import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/server-auth";
import { fetchFromBackend, proxyToBackend, toNextResponse } from "@/lib/backend/proxy";
import { asNumber, asString, firstDefined, normalizeVehicle } from "@/lib/backend/normalize";

type JsonRecord = Record<string, unknown>;

interface RouteContext {
  params: Promise<{ id: string }>;
}

function parseId(value: string) {
  const parsed = Number.parseInt(value.trim(), 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

export async function GET(request: NextRequest, context: RouteContext) {
  const user = await requireAuth(request);

  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const vehicleId = parseId(id ?? "");

  if (!vehicleId) {
    return NextResponse.json({ message: "Vehicle ID is required." }, { status: 400 });
  }

  const result = await fetchFromBackend(request, {
    method: "GET",
    backendPath: `/api/vehicles/${vehicleId}`,
  });

  if (!result.ok) {
    return result.response;
  }

  if (result.response.status === 404) {
    return NextResponse.json({ message: "Vehicle not found" }, { status: 404 });
  }

  if (!result.response.ok) {
    return toNextResponse(result.response);
  }

  const row = (await result.response.json().catch(() => null)) as JsonRecord | null;

  if (!row || typeof row !== "object") {
    return NextResponse.json(
      { message: "Invalid vehicle response from backend." },
      { status: 502 },
    );
  }

  const vehicle = normalizeVehicle(row);
  const rawPhotos = firstDefined(row.photos, row.Photos, row.vehiclePhotos);
  let photos: Array<{ id: number; url: string; isPrimary: boolean; displayOrder: number }> | undefined;
  if (Array.isArray(rawPhotos)) {
    photos = (rawPhotos as JsonRecord[]).map((p) => ({
      id: asNumber(firstDefined(p.id, p.photoId, p.PhotoId)),
      url: asString(
        firstDefined(p.photoUrl, p.PhotoUrl, p.url, p.urlPath, p.imageUrl, p.ImageUrl),
      ),
      isPrimary: Boolean(
        firstDefined(p.isPrimary, p.IsPrimary, p.is_primary, p.primary),
      ),
      displayOrder: asNumber(
        firstDefined(p.displayOrder, p.display_order, p.DisplayOrder),
        0,
      ),
    }));
    photos.sort((a, b) => a.displayOrder - b.displayOrder);
  }
  return NextResponse.json({ ...vehicle, ...(photos?.length ? { photos } : {}) }, { status: 200 });
}

export async function PUT(request: NextRequest, context: RouteContext) {
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

  const sellingPrice = asNumber(
    firstDefined(body.sellingPrice, body.selling_price),
    Number.NaN,
  );
  const colourRaw = asString(firstDefined(body.colour, body.color)).trim();
  const registrationNumberRaw = asString(
    firstDefined(body.registrationNumber, body.registration_number),
  ).trim();

  const payload: Record<string, unknown> = {};

  if (Number.isFinite(sellingPrice) && sellingPrice >= 0) {
    payload.sellingPrice = sellingPrice;
  }

  if (colourRaw || body.colour === "" || body.color === "") {
    payload.colour = colourRaw || null;
  }

  if (registrationNumberRaw || body.registrationNumber === "" || body.registration_number === "") {
    payload.registrationNumber = registrationNumberRaw || null;
  }

  if (Object.keys(payload).length === 0) {
    return NextResponse.json(
      { message: "At least one field must be provided for update." },
      { status: 400 },
    );
  }

  const result = await fetchFromBackend(request, {
    method: "PUT",
    backendPath: `/api/vehicles/${vehicleId}`,
    jsonBody: payload,
  });

  if (!result.ok) {
    return result.response;
  }

  return toNextResponse(result.response);
}

export async function DELETE(request: NextRequest, context: RouteContext) {
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
    method: "DELETE",
    backendPath: `/api/vehicles/${vehicleId}`,
  });
}
