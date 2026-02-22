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

/**
 * POST /api/vehicles/{vehicleId}/photos
 * Upload multiple photos for a vehicle (multipart/form-data).
 */
export async function POST(request: NextRequest, context: RouteContext) {
  const user = await requireAuth(request);

  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const vehicleId = parseId(id ?? "");

  if (!vehicleId) {
    return NextResponse.json({ message: "Vehicle ID is required." }, { status: 400 });
  }

  return proxyToBackend(request, {
    method: "POST",
    backendPath: `/api/vehicles/${vehicleId}/photos`,
    forwardBody: true,
  });
}
