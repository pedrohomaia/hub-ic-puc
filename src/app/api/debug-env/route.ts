import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    hasEmail: !!process.env.DEV_AUTH_EMAIL,
    email: process.env.DEV_AUTH_EMAIL ?? null,
    hasPassword: !!process.env.DEV_AUTH_PASSWORD,
    name: process.env.DEV_AUTH_NAME ?? null,
    role: process.env.DEV_AUTH_ROLE ?? null,
  });
}
