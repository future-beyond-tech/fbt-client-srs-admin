import { NextResponse } from "next/server";
import { getExternalApiBaseUrl } from "@/lib/backend/proxy";

/**
 * GET /api/_debug/backend
 * Returns resolved backend URL and node env. No secrets or tokens.
 * Use to verify which backend the app is using (local vs remote).
 */
export async function GET() {
  const backendUrl = getExternalApiBaseUrl();
  const nodeEnv = process.env.NODE_ENV ?? "development";

  return NextResponse.json(
    {
      backendUrl,
      nodeEnv,
    },
    { status: 200 },
  );
}
