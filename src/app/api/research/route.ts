// src/app/api/research/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";

// Se você ainda não implementou GET/POST aqui, deixa só 405.
// Isso evita erro de build (porque /api/research não tem params).
export async function GET() {
  return NextResponse.json({ error: "METHOD_NOT_IMPLEMENTED" }, { status: 501 });
}

export async function POST() {
  return NextResponse.json({ error: "METHOD_NOT_IMPLEMENTED" }, { status: 501 });
}

// ✅ IMPORTANTE:
// PATCH e DELETE com id devem ficar em:
// src/app/api/research/[id]/route.ts
