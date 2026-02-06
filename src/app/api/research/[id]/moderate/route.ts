export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { getSessionUser } from "@/lib/auth";
import { requireModerator } from "@/lib/rbac";
import { moderateResearch } from "@/lib/research.repo";
import { getRequestId, jsonErr, jsonOk } from "@/lib/api";
import { rateLimit, rateHeaders } from "@/lib/rateLimit";
import { logger } from "@/lib/logger";

function asObj(v: unknown): Record<string, unknown> {
  return typeof v === "object" && v !== null ? (v as Record<string, unknown>) : {};
}

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const requestId = getRequestId(req);

  try {
    const { id: researchId } = await ctx.params;

    const user = await getSessionUser();
    if (!user) {
      return jsonErr(requestId, "UNAUTHENTICATED", 401, { message: "Você precisa estar logado." });
    }

    requireModerator(user.email);

    const rl = rateLimit(`moderate:${user.id}:${researchId}`, { windowMs: 60_000, max: 10 });
    if (!rl.ok) {
      logger.warn("MODERATE", "rate limited", { requestId, researchId, userId: user.id });
      return jsonErr(requestId, "RATE_LIMITED", 429, {
        message: "Muitas ações em pouco tempo. Aguarde um pouco.",
        headers: rateHeaders(rl),
      });
    }

    const raw = await req.json().catch(() => ({}));
    const body = asObj(raw);
    const action = body.action;

    if (action !== "APPROVE" && action !== "HIDE") {
      return jsonErr(requestId, "INVALID_ACTION", 400, { message: "Ação inválida.", headers: rateHeaders(rl) });
    }

    const updated = await moderateResearch(researchId, action);
    return jsonOk({ research: updated, requestId }, { status: 200, headers: rateHeaders(rl) });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "UNKNOWN_ERROR";

    if (msg === "FORBIDDEN_MODERATOR") {
      logger.warn("MODERATE", "forbidden", { requestId });
      return jsonErr(requestId, "FORBIDDEN_MODERATOR", 403, { message: "Sem permissão para moderar." });
    }

    logger.error("MODERATE", "internal error", { requestId, err: e });
    return jsonErr(requestId, "INTERNAL_ERROR", 500, { message: "Erro interno." });
  }
}
