import { randomBytes } from "node:crypto";
import nacl from "tweetnacl";

/**
 * Symmetric encryption for secrets we store at rest in Postgres (currently
 * just the user's own AI provider API key). Reuses the `tweetnacl` dependency
 * already pulled in for GitHub deploy-key generation — no new package needed.
 */

function getKey(): Uint8Array {
  const b64 = process.env.GITPRESS_SECRET_KEY;
  if (!b64) {
    throw new Error(
      "GITPRESS_SECRET_KEY is not set. Generate one with `openssl rand -base64 32` and add it to .env.local / Vercel.",
    );
  }
  const key = Buffer.from(b64, "base64");
  if (key.length !== nacl.secretbox.keyLength) {
    throw new Error(
      `GITPRESS_SECRET_KEY must decode to ${nacl.secretbox.keyLength} bytes (base64-encoded).`,
    );
  }
  return new Uint8Array(key);
}

/** Returns `${nonce}.${ciphertext}`, both base64 — safe to store as a single text column. */
export function encryptSecret(plaintext: string): string {
  const key = getKey();
  const nonce = new Uint8Array(randomBytes(nacl.secretbox.nonceLength));
  const box = nacl.secretbox(new TextEncoder().encode(plaintext), nonce, key);
  return `${Buffer.from(nonce).toString("base64")}.${Buffer.from(box).toString("base64")}`;
}

export function decryptSecret(encrypted: string): string {
  const key = getKey();
  const [nonceB64, boxB64] = encrypted.split(".");
  if (!nonceB64 || !boxB64) throw new Error("Malformed encrypted secret");
  const nonce = new Uint8Array(Buffer.from(nonceB64, "base64"));
  const box = new Uint8Array(Buffer.from(boxB64, "base64"));
  const opened = nacl.secretbox.open(box, nonce, key);
  if (!opened) throw new Error("Failed to decrypt secret (wrong GITPRESS_SECRET_KEY or corrupted data)");
  return new TextDecoder().decode(opened);
}
