import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/server-auth";
import { proxyToBackend } from "@/lib/backend/proxy";

interface RouteContext {
  params: Promise<{ id: string }>;
}

function parseId(value: string) {
  const parsed = Number.parseInt(value.trim(), 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const user = await requireAuth(request);

  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const financeCompanyId = parseId(id ?? "");

  if (!financeCompanyId) {
    return NextResponse.json({ message: "Finance company ID is required." }, { status: 400 });
  }

  return proxyToBackend(request, {
    method: "DELETE",
    backendPath: `/api/finance-companies/${financeCompanyId}`,
  });
}
