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
  if (e instanceof AppError) {
    return { code: e.code, status: e.status, details: e.details };
  }

  let code = "INTERNAL_ERROR";

  // fallback: padrão antigo (throw new Error("TOKEN_USED"))
  if (e && typeof e === "object" && "message" in e) {
    const msg = (e as { message?: unknown }).message;
    if (typeof msg === "string" && msg.trim()) code = msg.trim();
  } else if (typeof e === "string" && e.trim()) {
    code = e.trim();
  }

  const statusByCode: Record<string, number> = {
    UNAUTHENTICATED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,

    MISSING_TOKEN: 400,
    TOKEN_INVALID: 400,
    TOKEN_EXPIRED: 400,
    INVALID_PERIOD: 400,
    INVALID_COUNT: 400,
    INVALID_EXPIRES_IN_DAYS: 400,

    TOKEN_USED: 409,
    ALREADY_COMPLETED: 409,
  };

  const status = statusByCode[code];
  return status ? { code, status } : { code };
}
