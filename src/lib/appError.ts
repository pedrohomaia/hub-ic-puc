// src/lib/appError.ts
export class AppError extends Error {
  code: string;
  status: number;
  details?: unknown;

  constructor(code: string, status = 400, details?: unknown) {
    super(code);
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

export function asErrorCode(e: unknown): { code: string; status?: number; details?: unknown } {
  if (e instanceof AppError) return { code: e.code, status: e.status, details: e.details };

  // fallback: padrão antigo (throw new Error("TOKEN_USED"))
  if (e && typeof e === "object" && "message" in e) {
    const msg = (e as { message?: unknown }).message;
    if (typeof msg === "string") return { code: msg };
  }

  return { code: "INTERNAL_ERROR" };
}
