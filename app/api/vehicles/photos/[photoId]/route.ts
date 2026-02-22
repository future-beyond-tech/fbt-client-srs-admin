import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/server-auth";
import { proxyToBackend } from "@/lib/backend/proxy";

interface RouteContext {
  params: Promise<{ photoId: string }>;
}

function parseId(value: string) {
  const parsed = Number.parseInt(value.trim(), 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

/**
 * DELETE /api/vehicles/photos/{photoId}
 * Delete a specific vehicle photo by ID.
 */
export async function DELETE(request: NextRequest, context: RouteContext) {
  const user = await requireAuth(request);

  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { photoId } = await context.params;
  const photoIdNum = parseId(photoId ?? "");

  if (!photoIdNum) {
    return NextResponse.json({ message: "Photo ID is required." }, { status: 400 });
  }

  return proxyToBackend(request, {
    method: "DELETE",
    backendPath: `/api/vehicles/photos/${photoIdNum}`,
  });
}
