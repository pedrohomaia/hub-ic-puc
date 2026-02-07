export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";

export async function GET() {
  await requireAuth();
  return NextResponse.json({ error: "NOT_IMPLEMENTED" }, { status: 501 });
}
