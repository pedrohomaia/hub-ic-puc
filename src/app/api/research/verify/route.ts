// src/app/api/research/verify/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import { requireAuth } from "@/lib/auth";
import { verifyTokenAndCreateVerifiedCompletion } from "@/lib/researchTokens.repo";
import { asErrorCode } from "@/lib/appError";
import { getRequestId } from "@/lib/api";
import { rateLimit, rateHeaders } from "@/lib/rateLimit";

type VerifyBody = { researchId?: unknown; token?: unknown };

function messageFor(code: string) {
  switch (code) {
    case "TOKEN_REQUIRED":
      return "Digite um token para verificar.";
    case "TOKEN_INVALID":
      return "Token inválido. Confira se você copiou corretamente.";
    case "TOKEN_USED":
      return "Esse token já foi usado.";
    case "TOKEN_EXPIRED":
      return "Esse token expirou. Peça um novo para o ADMIN.";
    case "ALREADY_COMPLETED":
      return "Você já concluiu essa pesquisa.";
    case "RESEARCH_NOT_FOUND":
      return "Pesquisa não encontrada.";
    case "UNAUTHENTICATED":
      return "Você precisa estar logado para verificar.";
    case "FORBIDDEN":
      return "Você não tem permissão para isso.";
    case "MISSING_RESEARCH_ID":
      return "Pesquisa inválida.";
    case "RATE_LIMITED":
      return "Muitas tentativas. Aguarde um pouco e tente novamente.";
    default:
      return "Não foi possível verificar. Tente novamente.";
  }
}

function errJson(requestId: string, code: string, status: number, headers?: Record<string, string>) {
  return NextResponse.json(
    { ok: false, error: code, message: messageFor(code), requestId },
    { status, headers }
  );
}

export async function PATCH(req: Request) {
  const startedAt = Date.now();
  const requestId = getRequestId(req);

  try {
    const user = await requireAuth();

    const rawBody: unknown = await req.json().catch(() => ({} as unknown));
    const body = (typeof rawBody === "object" && rawBody !== null ? rawBody : {}) as VerifyBody;

    const researchId = typeof body.researchId === "string" ? body.researchId.trim() : "";
    if (!researchId) return errJson(requestId, "MISSING_RESEARCH_ID", 400);

    // rate limit: 10 req / 60s por usuário+pesquisa
    const rl = rateLimit(`verify:${user.id}:${researchId}`, { windowMs: 60_000, max: 10 });
    const rlH = rateHeaders(rl);

    if (!rl.ok) {
      logger.warn("VERIFY", "rate limited", { requestId, researchId, userId: user.id });
      return errJson(requestId, "RATE_LIMITED", 429, rlH);
    }

    const token = typeof body.token === "string" ? body.token.trim() : "";
    if (!token) {
      logger.warn("VERIFY", "token missing", { requestId, researchId, userId: user.id });
      return errJson(requestId, "TOKEN_REQUIRED", 400, rlH);
    }

    const completion = await verifyTokenAndCreateVerifiedCompletion(user.id, researchId, token);

    logger.info("VERIFY", "ok", { requestId, researchId, userId: user.id, ms: Date.now() - startedAt });

    return NextResponse.json(
      {
        ok: true,
        message: "Token verificado com sucesso.",
        pointsAwarded: completion?.pointsAwarded ?? 0,
        completion,
        requestId,
      },
      { status: 200, headers: rlH }
    );
    } catch (e) {
    const { code, status } = asErrorCode(e);
    const normalizedCode = code === "MISSING_TOKEN" ? "TOKEN_REQUIRED" : code;

    const maybeStatus = normalizedCode === "TOKEN_REQUIRED" ? 400 : status;
    const safeStatus = typeof maybeStatus === "number" ? maybeStatus : 500;

    logger.warn("VERIFY", "expected error", { requestId, code: normalizedCode, status: safeStatus });
    return errJson(requestId, normalizedCode, safeStatus);
  }
}
