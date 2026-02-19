import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/server-auth";
import { proxyToBackend } from "@/lib/backend/proxy";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, context: RouteContext) {
  const user = await requireAuth(request);

  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;

  if (!id?.trim()) {
    return NextResponse.json({ message: "Customer ID is required." }, { status: 400 });
  }

  return proxyToBackend(request, {
    method: "GET",
    backendPath: `/api/customers/${encodeURIComponent(id.trim())}`,
  });
}
