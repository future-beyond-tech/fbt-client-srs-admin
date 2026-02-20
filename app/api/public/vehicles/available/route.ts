import { NextResponse } from "next/server";
import { EXTERNAL_API_URL_DEFAULT } from "@/lib/constants";
import { extractRows, normalizeVehicle } from "@/lib/backend/normalize";
import type { PublicVehicleDto } from "@/lib/types/public";

const DEFAULT_EXTERNAL_API_URL = EXTERNAL_API_URL_DEFAULT;

function getBaseUrl(): string {
  return (process.env.EXTERNAL_API_URL ?? DEFAULT_EXTERNAL_API_URL).trim();
}

function pickColour(row: Record<string, unknown>): string | null {
  const raw =
    row.colour ??
    row.color ??
    row.vehicleColour ??
    row.vehicle_colour ??
    row.exteriorColor;
  if (typeof raw === "string" && raw.trim()) return raw.trim();
  return null;
}

/**
 * Public endpoint: returns available vehicles without requiring authentication.
 * Does not forward auth token to the backend.
 * Backend may require auth; if so, configure backend to allow unauthenticated GET /api/vehicles/available for public listing.
 */
export async function GET() {
  const baseUrl = getBaseUrl();

  if (!baseUrl) {
    return NextResponse.json(
      {
        message:
          process.env.NODE_ENV === "development"
            ? "Invalid EXTERNAL_API_URL for public vehicles."
            : "Service unavailable.",
      },
      { status: 500 },
    );
  }

  const url = `${baseUrl.replace(/\/$/, "")}/api/vehicles/available`;

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: { Accept: "application/json" },
      cache: "no-store",
    });
    const payload = await response.json().catch(() => null);
    const rows = extractRows(payload);

    if (!response.ok) {
      return NextResponse.json(
        { message: (payload && typeof payload.message === "string" && payload.message) || "Unable to load vehicles." },
        { status: response.status >= 400 ? response.status : 502 },
      );
    }

    if (!rows || !Array.isArray(rows)) {
      return NextResponse.json([], { status: 200 });
    }

    const vehicles: PublicVehicleDto[] = rows.map((row: Record<string, unknown>) => {
      const n = normalizeVehicle(row);
      const status =
        n.status === "SOLD" ? "SOLD" : "AVAILABLE";
      const imageUrl =
        typeof n.imageUrl === "string" && n.imageUrl.trim()
          ? n.imageUrl.trim()
          : null;
      return {
        id: n.id,
        brand: n.brand,
        model: n.model,
        year: n.year,
        registrationNumber: n.registrationNumber,
        chassisNumber: n.chassisNumber || null,
        engineNumber: n.engineNumber || null,
        colour: pickColour(row),
        sellingPrice: n.sellingPrice,
        status,
        createdAt: n.createdAt,
        imageUrl,
      };
    });

    return NextResponse.json(vehicles, { status: 200 });
  } catch (error) {
    const message =
      process.env.NODE_ENV === "development" && error instanceof Error
        ? error.message
        : "Unable to connect to vehicle service.";
    return NextResponse.json({ message }, { status: 503 });
  }
}
