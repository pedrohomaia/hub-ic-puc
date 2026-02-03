// src/lib/researchTokens.ts
import crypto from "crypto";

/**
 * Token "humano" (fácil de ler/digitar) — evita caracteres ambíguos.
 * Ex: "K7QH-9M2X-WR5P"
 */
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // sem I, O, 0, 1
const DEFAULT_PARTS = 3;
const DEFAULT_PART_LEN = 4;

export type PlainToken = string;

/** Remove espaços, normaliza para UPPER e mantém '-' como separador */
export function normalizeToken(input: string): PlainToken {
  return input
    .trim()
    .replace(/\s+/g, "")
    .toUpperCase();
}

/** Gera um token no formato XXXX-XXXX-XXXX (por padrão) */
export function generatePlainToken(
  parts: number = DEFAULT_PARTS,
  partLen: number = DEFAULT_PART_LEN
): PlainToken {
  if (parts <= 0 || partLen <= 0) {
    throw new Error("Invalid token format params");
  }

  const segments: string[] = [];
  for (let p = 0; p < parts; p++) {
    segments.push(randomChars(partLen));
  }
  return segments.join("-");
}

/** Valida formato (apenas) — não garante que exista no banco */
export function isTokenFormatValid(
  token: string,
  parts: number = DEFAULT_PARTS,
  partLen: number = DEFAULT_PART_LEN
): boolean {
  const t = normalizeToken(token);
  const re = new RegExp(
    `^([${ALPHABET}]{${partLen}})(-([${ALPHABET}]{${partLen}})){${parts - 1}}$`
  );
  return re.test(t);
}

/**
 * Hash seguro para guardar no banco (não salva token puro).
 * Recomendado: HMAC-SHA256(token, secret).
 */
export function hashToken(token: string, secret?: string): string {
  const t = normalizeToken(token);

  const s = secret ?? process.env.RESEARCH_TOKEN_SECRET;
  if (!s) {
    throw new Error(
      "Missing RESEARCH_TOKEN_SECRET env var. Set it in .env.local"
    );
  }

  return crypto.createHmac("sha256", s).update(t, "utf8").digest("hex");
}

/**
 * Gera token puro + hash (pra inserir no banco e devolver o token ao ADMIN 1x)
 */
export function generateTokenPair(secret?: string): { token: PlainToken; tokenHash: string } {
  const token = generatePlainToken();
  const tokenHash = hashToken(token, secret);
  return { token, tokenHash };
}

/* --------------------- helpers --------------------- */

function randomChars(len: number): string {
  // random bytes -> índice no ALPHABET
  const bytes = crypto.randomBytes(len);
  let out = "";
  for (let i = 0; i < len; i++) {
    out += ALPHABET[bytes[i] % ALPHABET.length];
  }
  return out;
}
