import { getBuiltinTheme } from "@/lib/themes";
import { readBuiltinThemePreview } from "@/lib/themePreview";

export async function GET(
  _request: Request,
  context: { params: Promise<{ name: string }> },
): Promise<Response> {
  const { name } = await context.params;
  const theme = getBuiltinTheme(name);
  if (!theme) return new Response("Not found", { status: 404 });

  const preview = readBuiltinThemePreview(name, theme.preview);
  if (!preview) return new Response("Not found", { status: 404 });

  return new Response(preview.body, {
    headers: {
      "Content-Type": preview.type,
      "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
    },
  });
}
