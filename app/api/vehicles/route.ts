import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/server-auth";
import { fetchFromBackend, proxyToBackend, toNextResponse } from "@/lib/backend/proxy";
import {
  asString,
  extractRows,
  firstDefined,
  normalizeKey,
  normalizeSale,
  normalizeStatus,
  normalizeVehicle,
} from "@/lib/backend/normalize";

export async function GET(request: NextRequest) {
  const user = await requireAuth(request);

  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const result = await fetchFromBackend(request, {
    method: "GET",
    backendPath: "/api/vehicles",
  });

  if (!result.ok) {
    return result.response;
  }

  if (!result.response.ok) {
    return toNextResponse(result.response);
  }

  const payload = await result.response.json().catch(() => null);
  const rows = extractRows(payload);

  if (!rows) {
    return NextResponse.json(
      { message: "Invalid vehicle response from backend service." },
      { status: 502 },
    );
  }

  const vehicles = rows.map((row) => normalizeVehicle(row));
  const hasNativeStatus = rows.some((row) => {
    const status = normalizeStatus(
      firstDefined(row.status, row.vehicleStatus, row.vehicle_status),
    );
    const isSold = firstDefined(row.isSold, row.is_sold);

    return Boolean(status) || typeof isSold === "boolean";
  });

  if (hasNativeStatus) {
    return NextResponse.json(vehicles, { status: 200 });
  }

  const salesResult = await fetchFromBackend(request, {
    method: "GET",
    backendPath: "/api/sales",
  });

  if (!salesResult.ok) {
    return NextResponse.json(vehicles, { status: 200 });
  }

  if (!salesResult.response.ok) {
    return NextResponse.json(vehicles, { status: 200 });
  }

  const salesPayload = await salesResult.response.json().catch(() => null);
  const salesRows = extractRows(salesPayload);

  if (!salesRows) {
    return NextResponse.json(vehicles, { status: 200 });
  }

  const soldVehicleIds = new Set(
    salesRows
      .map((sale) => normalizeSale(sale))
      .map((sale) => asString(firstDefined(sale.vehicleId, sale.vehicle?.id)))
      .filter((vehicleId) => Boolean(vehicleId)),
  );
  const soldRegistrationNumbers = new Set(
    salesRows
      .map((sale) => normalizeSale(sale))
      .map((sale) => asString(firstDefined(sale.registrationNumber, sale.vehicle?.registrationNumber)))
      .map((registrationNumber) => normalizeKey(registrationNumber))
      .filter((registrationNumber) => Boolean(registrationNumber)),
  );

  return NextResponse.json(
    vehicles.map((vehicle) => ({
      ...vehicle,
      status:
        soldVehicleIds.has(vehicle.id) ||
        soldRegistrationNumbers.has(normalizeKey(vehicle.registrationNumber))
          ? "SOLD"
          : "AVAILABLE",
    })),
    { status: 200 },
  );
}

export async function POST(request: NextRequest) {
  const user = await requireAuth(request);

  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  return proxyToBackend(request, {
    method: "POST",
    backendPath: "/api/vehicles",
    forwardBody: true,
  });
}
