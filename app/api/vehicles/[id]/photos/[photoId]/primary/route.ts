import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/server-auth";
import { proxyToBackend } from "@/lib/backend/proxy";

interface RouteContext {
  params: Promise<{ id: string; photoId: string }>;
}

function parseId(value: string) {
  const parsed = Number.parseInt(value.trim(), 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

/**
 * PATCH /api/vehicles/{vehicleId}/photos/{photoId}/primary
 * Set the given photo as the primary photo for the vehicle.
 */
export async function PATCH(request: NextRequest, context: RouteContext) {
  const user = await requireAuth(request);

  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { id: vehicleIdParam, photoId } = await context.params;
  const vehicleId = parseId(vehicleIdParam ?? "");
  const photoIdNum = parseId(photoId ?? "");

  if (!vehicleId) {
    return NextResponse.json({ message: "Vehicle ID is required." }, { status: 400 });
  }

  if (!photoIdNum) {
    return NextResponse.json({ message: "Photo ID is required." }, { status: 400 });
  }

  return proxyToBackend(request, {
    method: "PATCH",
    backendPath: `/api/vehicles/${vehicleId}/photos/${photoIdNum}/primary`,
    forwardBody: true,
  });
}
