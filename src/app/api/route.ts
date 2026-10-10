import { NextResponse } from "next/server";
import { db } from "@/lib/db";

/** GET /api → service health (used by monitoring / quick diagnostics). */
export async function GET() {
  let database: "up" | "down" = "down";
  try {
    await db.$queryRaw`SELECT 1`;
    database = "up";
  } catch {
    database = "down";
  }
  return NextResponse.json({
    ok: database === "up",
    service: "liveshop-api",
    database,
    time: new Date().toISOString(),
  });
}
