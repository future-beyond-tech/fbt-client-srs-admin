import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/server-auth";
import { fetchFromBackend, toNextResponse } from "@/lib/backend/proxy";
import { asNumber, asString, firstDefined } from "@/lib/backend/normalize";

type JsonRecord = Record<string, unknown>;

interface RouteContext {
  params: Promise<{ id: string }>;
}

function parseId(value: string) {
  const parsed = Number.parseInt(value.trim(), 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

function toStatusValue(value: unknown) {
  const numeric = asNumber(value, Number.NaN);

  if (Number.isFinite(numeric)) {
    if (numeric === 1 || numeric === 2) {
      return numeric;
    }
  }

  const normalized = asString(value).trim().toUpperCase();

  if (normalized === "AVAILABLE") return 1;
  if (normalized === "SOLD") return 2;

  return null;
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const user = await requireAuth(request);

  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const vehicleId = parseId(id ?? "");

  if (!vehicleId) {
    return NextResponse.json({ message: "Vehicle ID is required." }, { status: 400 });
  }

  const body = (await request.json().catch(() => null)) as JsonRecord | null;

  if (!body || typeof body !== "object") {
    return NextResponse.json({ message: "Invalid request payload." }, { status: 400 });
  }

  const status = toStatusValue(firstDefined(body.status, body.vehicleStatus, body.vehicle_status));

  if (!status) {
    return NextResponse.json(
      { message: "Status is required and must be Available or Sold." },
      { status: 400 },
    );
  }

  const result = await fetchFromBackend(request, {
    method: "PATCH",
    backendPath: `/api/vehicles/${vehicleId}/status`,
    jsonBody: { status },
  });

  if (!result.ok) {
    return result.response;
  }

  return toNextResponse(result.response);
}
