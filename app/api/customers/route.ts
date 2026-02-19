import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/server-auth";
import { proxyToBackend } from "@/lib/backend/proxy";

export async function GET(request: NextRequest) {
  const user = await requireAuth(request);

  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  return proxyToBackend(request, {
    method: "GET",
    backendPath: request.nextUrl.searchParams.has("phone")
      ? "/api/customers/search"
      : "/api/customers",
    includeQuery: true,
  });
}

export async function POST(request: NextRequest) {
  const user = await requireAuth(request);

  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ message: "Invalid request body." }, { status: 400 });
  }

  return proxyToBackend(request, {
    method: "POST",
    backendPath: "/api/customers",
    jsonBody: body,
  });
}
