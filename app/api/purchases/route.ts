import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/server-auth";
import { fetchFromBackend, toNextResponse } from "@/lib/backend/proxy";

type JsonRecord = Record<string, unknown>;

function asRecordArray(payload: unknown) {
  if (!Array.isArray(payload)) {
    return null;
  }

  return payload.filter(
    (item): item is JsonRecord => typeof item === "object" && item !== null,
  );
}

function asString(value: unknown, fallback = "") {
  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }

  return fallback;
}

function asNumber(value: unknown, fallback = 0) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim()) {
    const normalized = value.replace(/[, ]+/g, "").replace(/[^\d.-]/g, "");
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  return fallback;
}

function firstDefined<T>(...values: T[]) {
  return values.find((value) => value !== undefined && value !== null);
}

function getTodayDateString() {
  const now = new Date();
  return now.toISOString();
}

function toUtcIsoString(value: string) {
  const trimmed = value.trim();
  const dateOnlyPattern = /^\d{4}-\d{2}-\d{2}$/;

  if (dateOnlyPattern.test(trimmed)) {
    return `${trimmed}T00:00:00.000Z`;
  }

  // If timestamp has no timezone, force UTC interpretation.
  if (
    /^\d{4}-\d{2}-\d{2}T/.test(trimmed) &&
    !/[zZ]$/.test(trimmed) &&
    !/[+-]\d{2}:\d{2}$/.test(trimmed)
  ) {
    return `${trimmed}Z`;
  }

  const parsed = new Date(trimmed);

  if (Number.isNaN(parsed.getTime())) {
    return getTodayDateString();
  }

  return parsed.toISOString();
}

function resolvePurchaseDate(input: JsonRecord) {
  const dateCandidate = asString(
    firstDefined(input.purchaseDate, input.purchase_date, input.PurchaseDate),
  ).trim();

  if (!dateCandidate) {
    return getTodayDateString();
  }

  return toUtcIsoString(dateCandidate);
}

function extractRows(payload: unknown) {
  const directRows = asRecordArray(payload);

  if (directRows) {
    return directRows;
  }

  if (typeof payload === "object" && payload !== null) {
    const container = payload as JsonRecord;

    return (
      asRecordArray(container.data) ??
      asRecordArray(container.items) ??
      asRecordArray(container.results)
    );
  }

  return null;
}

export async function GET(request: NextRequest) {
  const user = await requireAuth(request);

  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  let result = await fetchFromBackend(request, {
    method: "GET",
    backendPath: "/api/purchases",
  });

  if (!result.ok) {
    return result.response;
  }

  if (result.response.status === 404) {
    result = await fetchFromBackend(request, {
      method: "GET",
      backendPath: "/api/vehicles",
    });

    if (!result.ok) {
      return result.response;
    }
  }

  if (!result.response.ok) {
    return toNextResponse(result.response);
  }

  const payload = await result.response.json().catch(() => null);
  const rows = extractRows(payload);

  if (!rows) {
    return NextResponse.json(
      { message: "Invalid purchases response from backend service." },
      { status: 502 },
    );
  }

  const normalized = rows.map((row) => {
    const buyingCostRaw = firstDefined(
      row.buyingCost,
      row.buying_cost,
      row.buyingcost,
      row.buyingPrice,
      row.buying_price,
      row.purchasePrice,
      row.purchase_price,
      row.costPrice,
      row.cost_price,
    );

    return {
      id: asString(firstDefined(row.id, row.vehicleId)),
      brand: asString(row.brand),
      model: asString(row.model),
      year: asNumber(row.year),
      registrationNumber: asString(
        firstDefined(row.registrationNumber, row.registrationNo, row.registration_number),
      ),
      chassisNumber: asString(firstDefined(row.chassisNumber, row.chassisNo, row.chassis_number)),
      engineNumber: asString(firstDefined(row.engineNumber, row.engineNo, row.engine_number)),
      sellingPrice: asNumber(
        firstDefined(row.sellingPrice, row.salePrice, row.selling_price, row.sale_price),
      ),
      sellerName: asString(firstDefined(row.sellerName, row.ownerName, row.seller_name)),
      sellerPhone: asString(firstDefined(row.sellerPhone, row.ownerPhone, row.seller_phone)),
      sellerAddress: asString(
        firstDefined(row.sellerAddress, row.ownerAddress, row.seller_address),
      ),
      buyingCost: asNumber(buyingCostRaw),
      expense: asNumber(firstDefined(row.expense, row.expenses, row.expense_amount)),
      purchaseDate: asString(
        firstDefined(row.purchaseDate, row.purchase_date, row.createdAt, row.created_at, row.date),
      ),
      imageUrl: asString(firstDefined(row.imageUrl, row.image_url)),
      createdAt: asString(firstDefined(row.createdAt, row.purchaseDate)),
    };
  });

  return NextResponse.json(normalized, { status: 200 });
}

export async function POST(request: NextRequest) {
  const user = await requireAuth(request);

  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as JsonRecord | null;

  if (!body || typeof body !== "object") {
    return NextResponse.json({ message: "Invalid request payload." }, { status: 400 });
  }

  const backendPayload = {
    ...body,
    purchaseDate: resolvePurchaseDate(body),
  };

  const result = await fetchFromBackend(request, {
    method: "POST",
    backendPath: "/api/purchases",
    jsonBody: backendPayload,
  });

  if (!result.ok) {
    return result.response;
  }

  return toNextResponse(result.response);
}
