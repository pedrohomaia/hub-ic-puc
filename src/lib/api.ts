// src/lib/api.ts
import { NextResponse } from "next/server";

export function getRequestId(req?: Request) {
  const fromHeader = req?.headers.get("x-request-id") ?? "";
  const id = fromHeader.trim();
  return id.length > 0 ? id : crypto.randomUUID();
}

export function jsonOk(data: Record<string, unknown>, init?: ResponseInit) {
  return NextResponse.json(
    { ok: true, ...data },
    { status: init?.status ?? 200, headers: init?.headers }
  );
}

export function jsonErr(
  reqId: string,
  error: string,
  status: number,
  opts?: { message?: string; hint?: string; extra?: Record<string, unknown>; headers?: HeadersInit }
) {
  return NextResponse.json(
    {
      ok: false,
      error,
      ...(opts?.message ? { message: opts.message } : {}),
      ...(opts?.hint ? { hint: opts.hint } : {}),
      ...(opts?.extra ?? {}),
      requestId: reqId,
    },
    { status, headers: opts?.headers }
  );
}
