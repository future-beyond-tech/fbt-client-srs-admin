import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/server-auth";
import { fetchFromBackend, toNextResponse } from "@/lib/backend/proxy";
import {
  asString,
  extractRows,
  firstDefined,
  normalizeKey,
  normalizeSale,
  normalizeStatus,
  normalizeVehicle,
} from "@/lib/backend/normalize";

function toAvailableVehicles(
  vehicles: Array<ReturnType<typeof normalizeVehicle>>,
) {
  return vehicles.filter((vehicle) => vehicle.status === "AVAILABLE");
}

export async function GET(request: NextRequest) {
  const user = await requireAuth(request);

  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const availableResult = await fetchFromBackend(request, {
    method: "GET",
    backendPath: "/api/vehicles/available",
  });

  if (!availableResult.ok) {
    return availableResult.response;
  }

  if (availableResult.response.ok) {
    const availablePayload = await availableResult.response.json().catch(() => null);
    const availableRows = extractRows(availablePayload);

    if (!availableRows) {
      return NextResponse.json(
        { message: "Invalid available vehicle response from backend service." },
        { status: 502 },
      );
    }

    return NextResponse.json(availableRows.map((row) => normalizeVehicle(row)), {
      status: 200,
    });
  }

  const vehiclesResult = await fetchFromBackend(request, {
    method: "GET",
    backendPath: "/api/vehicles",
  });

  if (!vehiclesResult.ok) {
    return vehiclesResult.response;
  }

  if (!vehiclesResult.response.ok) {
    return toNextResponse(vehiclesResult.response);
  }

  const vehiclesPayload = await vehiclesResult.response.json().catch(() => null);
  const vehiclesRows = extractRows(vehiclesPayload);

  if (!vehiclesRows) {
    return NextResponse.json(
      { message: "Invalid vehicle response from backend service." },
      { status: 502 },
    );
  }

  const vehicles = vehiclesRows.map((row) => normalizeVehicle(row));
  const rowsWithStatus = vehiclesRows.filter((row) => {
    const status = normalizeStatus(
      firstDefined(row.status, row.vehicleStatus, row.vehicle_status),
    );
    const isSold = firstDefined(row.isSold, row.is_sold);

    return Boolean(status) || typeof isSold === "boolean";
  });

  if (rowsWithStatus.length > 0) {
    return NextResponse.json(
      vehicles.filter((vehicle) => vehicle.status === "AVAILABLE"),
      { status: 200 },
    );
  }

  const salesResult = await fetchFromBackend(request, {
    method: "GET",
    backendPath: "/api/sales",
  });

  if (!salesResult.ok) {
    return NextResponse.json(toAvailableVehicles(vehicles), { status: 200 });
  }

  if (!salesResult.response.ok) {
    return NextResponse.json(toAvailableVehicles(vehicles), { status: 200 });
  }

  const salesPayload = await salesResult.response.json().catch(() => null);
  const salesRows = extractRows(salesPayload);

  if (!salesRows) {
    return NextResponse.json(toAvailableVehicles(vehicles), { status: 200 });
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
    vehicles.filter((vehicle) => {
      const isSoldById = Boolean(vehicle.id && soldVehicleIds.has(vehicle.id));
      const isSoldByRegistration = soldRegistrationNumbers.has(
        normalizeKey(vehicle.registrationNumber),
      );

      return !(isSoldById || isSoldByRegistration);
    }),
    { status: 200 },
  );
}
