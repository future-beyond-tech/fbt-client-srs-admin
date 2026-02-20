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
    backendPath: "/api/settings/delivery-note",
  });
}

export async function PUT(request: NextRequest) {
  const user = await requireAuth(request);

  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  return proxyToBackend(request, {
    method: "PUT",
    backendPath: "/api/settings/delivery-note",
    forwardBody: true,
  });
}
