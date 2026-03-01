import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/server-auth";
import { proxyToBackend } from "@/lib/backend/proxy";

export const runtime = "nodejs";

/**
 * POST /api/manual-bills
 * Create a manual bill. Proxies to backend.
 */
export async function POST(request: NextRequest) {
  const user = await requireAuth(request);
  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  return proxyToBackend(request, {
    method: "POST",
    backendPath: "/api/manual-bills",
    forwardBody: true,
  });
}
