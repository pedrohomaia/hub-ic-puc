export const runtime = "nodejs";

import { asErrorCode } from "@/lib/appError";
import { requireAuth } from "@/lib/auth";
import { createCompletionSimple } from "@/lib/completions.repo";
import { getRequestId, jsonErr, jsonOk } from "@/lib/api";
import { rateLimit, rateHeaders } from "@/lib/rateLimit";
import { logger } from "@/lib/logger";

export async function POST(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const requestId = getRequestId(_req);

  try {
    const user = await requireAuth();
    const { id: researchId } = await ctx.params;

    const rl = rateLimit(`complete:${user.id}:${researchId}`, { windowMs: 60_000, max: 6 });
    if (!rl.ok) {
      logger.warn("COMPLETE", "rate limited", { requestId, researchId, userId: user.id });
      return jsonErr(requestId, "RATE_LIMITED", 429, {
        message: "Muitas tentativas. Aguarde um pouco e tente novamente.",
        headers: rateHeaders(rl),
      });
    }

    const result = await createCompletionSimple(user.id, researchId);

    return jsonOk({ ...result, requestId }, { status: 200, headers: rateHeaders(rl) });
  } catch (err) {
    const { code, status } = asErrorCode(err);

    if (typeof status === "number") {
      logger.warn("COMPLETE", "expected error", { requestId, code, status });
      return jsonErr(requestId, code, status, { message: code });
    }

    logger.error("COMPLETE", "internal error", { requestId, err });
    return jsonErr(requestId, "INTERNAL_ERROR", 500, { message: "Erro interno." });
  }
}
