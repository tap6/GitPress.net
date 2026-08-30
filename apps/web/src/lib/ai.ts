import { eq } from "drizzle-orm";
import { db } from "@/db";
import { aiSettings } from "@/db/schema";
import { decryptSecret, encryptSecret } from "./crypto";

/**
 * Thin client for any OpenAI-compatible `/chat/completions` endpoint
 * (OpenAI, DeepSeek, Moonshot/Kimi, Qwen, OpenRouter, ...). No SDK
 * dependency — it's a single well-known REST shape.
 */

export interface AiConfig {
  baseUrl: string;
  model: string;
  apiKey: string;
}

export async function getAiConfig(userId: string): Promise<AiConfig | null> {
  const [row] = await db.select().from(aiSettings).where(eq(aiSettings.userId, userId)).limit(1);
  if (!row) return null;
  return { baseUrl: row.baseUrl, model: row.model, apiKey: decryptSecret(row.apiKeyEncrypted) };
}

export async function saveAiConfig(
  userId: string,
  config: { baseUrl: string; model: string; apiKey: string },
): Promise<void> {
  await db
    .insert(aiSettings)
    .values({
      userId,
      baseUrl: config.baseUrl,
      model: config.model,
      apiKeyEncrypted: encryptSecret(config.apiKey),
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: aiSettings.userId,
      set: {
        baseUrl: config.baseUrl,
        model: config.model,
        apiKeyEncrypted: encryptSecret(config.apiKey),
        updatedAt: new Date(),
      },
    });
}

export async function deleteAiConfig(userId: string): Promise<void> {
  await db.delete(aiSettings).where(eq(aiSettings.userId, userId));
}

interface ChatMessage {
  role: "system" | "user";
  content: string;
}

async function chatComplete(config: AiConfig, messages: ChatMessage[], maxTokens: number): Promise<string> {
  const url = `${config.baseUrl.replace(/\/+$/, "")}/chat/completions`;
  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: config.model,
        messages,
        max_tokens: maxTokens,
        temperature: 0.7,
      }),
    });
  } catch (error) {
    throw new Error(`无法连接 AI 服务:${error instanceof Error ? error.message : String(error)}`);
  }
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`AI 服务返回错误(HTTP ${res.status}):${text.slice(0, 300)}`);
  }
  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = data.choices?.[0]?.message?.content;
  if (typeof content !== "string" || !content.trim()) {
    throw new Error("AI 服务返回了空内容,请检查模型名称是否正确。");
  }
  return content.trim();
}

export async function generateSummary(config: AiConfig, body: string): Promise<string> {
  return chatComplete(
    config,
    [
      {
        role: "system",
        content:
          "你是一个精炼的博客摘要助手。只输出摘要正文本身,不要加引号、前缀或解释,控制在 1-2 句、80 字以内,使用文章正文所用的语言。",
      },
      { role: "user", content: body.slice(0, 6000) },
    ],
    200,
  );
}

export type DraftTone = "default" | "formal" | "casual";
export type DraftLength = "short" | "medium";

export async function generateDraft(
  config: AiConfig,
  prompt: string,
  options?: { tone?: DraftTone; length?: DraftLength },
): Promise<string> {
  const tone = options?.tone ?? "default";
  const length = options?.length ?? "medium";
  const toneHint =
    tone === "formal" ? "语气正式、克制。" : tone === "casual" ? "语气轻松、口语化。" : "语气自然、适合博客。";
  const lengthHint =
    length === "short" ? "篇幅短,大约 200–400 字。" : "篇幅中等,大约 600–1000 字。";
  const maxTokens = length === "short" ? 700 : 1600;
  return chatComplete(
    config,
    [
      {
        role: "system",
        content: `你是一个博客写作助手。根据用户给出的主题或要点,直接输出一段 Markdown 格式的正文草稿。${toneHint}${lengthHint}不要加任何解释性文字,也不要用代码块包裹整段内容。`,
      },
      { role: "user", content: prompt },
    ],
    maxTokens,
  );
}
