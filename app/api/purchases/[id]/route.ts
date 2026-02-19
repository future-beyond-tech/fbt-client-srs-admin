import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/server-auth";
import { fetchFromBackend, toNextResponse } from "@/lib/backend/proxy";
import {
  asString,
  firstDefined,
} from "@/lib/backend/normalize";

type JsonRecord = Record<string, unknown>;

function asNumber(value: unknown, fallback = 0) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const n = Number(value.replace(/[^\d.-]/g, ""));
    return Number.isFinite(n) ? n : fallback;
  }
  return fallback;
}

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, context: RouteContext) {
  const user = await requireAuth(request);

  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;

  if (!id?.trim()) {
    return NextResponse.json({ message: "Purchase ID is required." }, { status: 400 });
  }

  const result = await fetchFromBackend(request, {
    method: "GET",
    backendPath: `/api/purchases/${encodeURIComponent(id.trim())}`,
  });

  if (!result.ok) {
    return result.response;
  }

  if (result.response.status === 404) {
    return NextResponse.json({ message: "Purchase not found" }, { status: 404 });
  }

  if (!result.response.ok) {
    return toNextResponse(result.response);
  }

  const row = (await result.response.json().catch(() => null)) as JsonRecord | null;

  if (!row || typeof row !== "object") {
    return NextResponse.json(
      { message: "Invalid purchase response from backend." },
      { status: 502 },
    );
  }

  const buyingCostRaw = firstDefined(
    row.buyingCost,
    row.buying_cost,
    row.buyingPrice,
    row.buying_price,
    row.purchasePrice,
    row.cost_price,
  );

  const normalized = {
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

  return NextResponse.json(normalized, { status: 200 });
}
