// src/app/api/research/[id]/verify/route.ts
import { logger } from "@/lib/logger";

export const runtime = "nodejs";

import { requireAuth } from "@/lib/auth";
import { verifyTokenAndCreateVerifiedCompletion } from "@/lib/researchTokens.repo";
import { asErrorCode } from "@/lib/appError";
import { getRequestId, jsonErr, jsonOk } from "@/lib/api";
import { rateLimit, rateHeaders } from "@/lib/rateLimit";

type VerifyBody = { token?: unknown };

function pickToken(req: Request, body: VerifyBody) {
  if (typeof body.token === "string") return body.token;

  const url = new URL(req.url);
  const q = url.searchParams.get("token");
  if (q) return q;

  const h = req.headers.get("x-verification-token");
  if (h) return h;

  return "";
}

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
    default:
      return "Não foi possível verificar. Tente novamente.";
  }
}

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const startedAt = Date.now();
  const requestId = getRequestId(req);

  try {
    const { id: researchId } = await ctx.params;
    if (!researchId) {
      return jsonErr(requestId, "MISSING_RESEARCH_ID", 400, { message: messageFor("MISSING_RESEARCH_ID") });
    }

    const user = await requireAuth();

    // rate limit: 10 req / 60s por usuário+pesquisa
    const rl = rateLimit(`verify:${user.id}:${researchId}`, { windowMs: 60_000, max: 10 });
    if (!rl.ok) {
      logger.warn("VERIFY", "rate limited", { requestId, researchId, userId: user.id });
      return jsonErr(requestId, "RATE_LIMITED", 429, {
        message: "Muitas tentativas. Aguarde um pouco e tente novamente.",
        headers: rateHeaders(rl),
      });
    }

    const rawBody: unknown = await req.json().catch(() => ({} as unknown));
    const body = (typeof rawBody === "object" && rawBody !== null ? rawBody : {}) as VerifyBody;

    const tokenRaw = pickToken(req, body);
    const token = typeof tokenRaw === "string" ? tokenRaw.trim() : "";

    if (!token) {
      logger.warn("VERIFY", "token missing", { requestId, researchId, userId: user.id });
      return jsonErr(requestId, "TOKEN_REQUIRED", 400, {
        message: messageFor("TOKEN_REQUIRED"),
        headers: rateHeaders(rl),
      });
    }

    const completion = await verifyTokenAndCreateVerifiedCompletion(user.id, researchId, token);

    logger.info("VERIFY", "ok", {
      requestId,
      researchId,
      userId: user.id,
      ms: Date.now() - startedAt,
    });

    return jsonOk(
      {
        message: "Token verificado com sucesso.",
        pointsAwarded: completion?.pointsAwarded ?? 0,
        completion,
        requestId,
      },
      { status: 200, headers: rateHeaders(rl) }
    );
  } catch (err) {
    const { code, status } = asErrorCode(err);

    const normalizedCode = code === "MISSING_TOKEN" ? "TOKEN_REQUIRED" : code;
    const normalizedStatus = normalizedCode === "TOKEN_REQUIRED" ? 400 : status;

    if (typeof normalizedStatus === "number") {
      logger.warn("VERIFY", "expected error", { requestId, code: normalizedCode, status: normalizedStatus });
      return jsonErr(requestId, normalizedCode, normalizedStatus, { message: messageFor(normalizedCode) });
    }

    logger.error("VERIFY", "internal error", { requestId, code: normalizedCode, err });
    return jsonErr(requestId, "INTERNAL_ERROR", 500, { message: "Erro interno. Tente novamente em instantes." });
  }
}
