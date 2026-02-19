import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/server-auth";
import { fetchFromBackend, toNextResponse } from "@/lib/backend/proxy";
import { normalizeSaleDetailFromFlat } from "@/lib/backend/normalize";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, context: RouteContext) {
  const user = await requireAuth(request);

  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { id: billNumber } = await context.params;

  if (!billNumber?.trim()) {
    return NextResponse.json({ message: "Bill number is required." }, { status: 400 });
  }

  const result = await fetchFromBackend(request, {
    method: "GET",
    backendPath: `/api/sales/${encodeURIComponent(billNumber.trim())}`,
  });

  if (!result.ok) {
    return result.response;
  }

  if (result.response.status === 404) {
    return NextResponse.json({ message: "Sale not found" }, { status: 404 });
  }

  if (!result.response.ok) {
    return toNextResponse(result.response);
  }

  const payload = (await result.response.json().catch(() => null)) as Record<string, unknown> | null;

  if (!payload || typeof payload !== "object") {
    return NextResponse.json(
      { message: "Invalid sale detail response from backend service." },
      { status: 502 },
    );
  }

  const detail = normalizeSaleDetailFromFlat(payload);

  return NextResponse.json(detail, { status: 200 });
}
