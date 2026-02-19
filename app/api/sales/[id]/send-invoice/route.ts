import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/server-auth";
import { proxyToBackend } from "@/lib/backend/proxy";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, context: RouteContext) {
  const user = await requireAuth(request);

  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { id: billNumber } = await context.params;

  if (!billNumber?.trim()) {
    return NextResponse.json({ message: "Bill number is required." }, { status: 400 });
  }

  return proxyToBackend(request, {
    method: "POST",
    backendPath: `/api/sales/${encodeURIComponent(billNumber.trim())}/send-invoice`,
    forwardBody: false,
  });
}
