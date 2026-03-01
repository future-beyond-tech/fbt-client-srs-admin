import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/server-auth";
import { fetchFromBackend } from "@/lib/backend/proxy";

export const runtime = "nodejs";

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/sales/{billNumber}/pdf
 * Returns sales invoice PDF. Proxies to backend GET /api/sales/{billNumber}/pdf.
 * Backend must return application/pdf bytes (same pipeline as send-invoice).
 */
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
    backendPath: `/api/sales/${encodeURIComponent(billNumber.trim())}/pdf`,
    includeQuery: false,
  });

  if (!result.ok) {
    return result.response;
  }

  const contentType = result.response.headers.get("content-type") ?? "application/pdf";
  const body = await result.response.arrayBuffer();
  const disposition =
    result.response.headers.get("content-disposition") ??
    `inline; filename="Invoice-${billNumber}.pdf"`;

  return new NextResponse(body, {
    status: result.response.status,
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": disposition,
    },
  });
}
