import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/server-auth";
import { fetchFromBackend } from "@/lib/backend/proxy";

export const runtime = "nodejs";

interface RouteContext {
  params: Promise<{ billNumber: string }>;
}

/**
 * GET /api/manual-bills/[billNumber]/pdf
 * Returns PDF for the manual bill. Proxies to backend.
 */
export async function GET(request: NextRequest, context: RouteContext) {
  const user = await requireAuth(request);
  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { billNumber } = await context.params;
  if (!billNumber?.trim()) {
    return NextResponse.json({ message: "Bill number is required." }, { status: 400 });
  }

  const result = await fetchFromBackend(request, {
    method: "GET",
    backendPath: `/api/manual-bills/${encodeURIComponent(billNumber.trim())}/pdf`,
    includeQuery: true,
  });

  if (!result.ok) {
    return result.response;
  }

  const contentType = result.response.headers.get("content-type") ?? "application/pdf";
  const body = await result.response.arrayBuffer();
  const dispositionFromBackend = result.response.headers.get("content-disposition") ?? "";
  const isInline =
    request.nextUrl.searchParams.get("inline") === "1" ||
    request.nextUrl.searchParams.get("open") === "1";
  const contentDisposition =
    isInline || !dispositionFromBackend.toLowerCase().includes("attachment")
      ? `inline; filename="manual-bill-${billNumber}.pdf"`
      : dispositionFromBackend;

  return new NextResponse(body, {
    status: result.response.status,
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": contentDisposition,
    },
  });
}
