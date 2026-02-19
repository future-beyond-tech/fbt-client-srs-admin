import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/server-auth";
import { proxyToBackend } from "@/lib/backend/proxy";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const user = await requireAuth(request);

  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  return proxyToBackend(request, {
    method: "POST",
    backendPath: "/api/upload",
    forwardBody: true,
  });
}
