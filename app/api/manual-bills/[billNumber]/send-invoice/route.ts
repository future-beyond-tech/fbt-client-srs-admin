import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/server-auth";
import { proxyToBackend } from "@/lib/backend/proxy";

export const runtime = "nodejs";

interface RouteContext {
  params: Promise<{ billNumber: string }>;
}

/**
 * POST /api/manual-bills/[billNumber]/send-invoice
 * Send manual bill invoice (e.g. via WhatsApp). Proxies to backend.
 */
export async function POST(request: NextRequest, context: RouteContext) {
  const user = await requireAuth(request);
  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { billNumber } = await context.params;
  if (!billNumber?.trim()) {
    return NextResponse.json({ message: "Bill number is required." }, { status: 400 });
  }

  return proxyToBackend(request, {
    method: "POST",
    backendPath: `/api/manual-bills/${encodeURIComponent(billNumber.trim())}/send-invoice`,
    forwardBody: false,
  });
}
