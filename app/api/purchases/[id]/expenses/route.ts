import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/server-auth";
import { fetchFromBackend, toNextResponse } from "@/lib/backend/proxy";
import { asNumber, asString, extractRows, firstDefined } from "@/lib/backend/normalize";

type JsonRecord = Record<string, unknown>;

interface RouteContext {
  params: Promise<{ id: string }>;
}

function parseId(value: string) {
  const parsed = Number.parseInt(value.trim(), 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

function toExpense(row: JsonRecord) {
  return {
    id: asNumber(firstDefined(row.id, row.expenseId, row.expense_id)),
    vehicleId: asNumber(firstDefined(row.vehicleId, row.vehicle_id)),
    expenseType: asString(firstDefined(row.expenseType, row.expense_type)),
    amount: asNumber(firstDefined(row.amount)),
  };
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
    backendPath: `/api/purchases/${vehicleId}/expenses`,
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
      { message: "Invalid purchase expenses response from backend service." },
      { status: 502 },
    );
  }

  return NextResponse.json(rows.map((row) => toExpense(row)), { status: 200 });
}

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

  const body = (await request.json().catch(() => null)) as JsonRecord | null;

  if (!body || typeof body !== "object") {
    return NextResponse.json({ message: "Invalid request payload." }, { status: 400 });
  }

  const expenseType = asString(firstDefined(body.expenseType, body.expense_type)).trim();
  const amount = asNumber(firstDefined(body.amount), 0);

  if (!expenseType) {
    return NextResponse.json({ message: "Expense type is required." }, { status: 400 });
  }

  if (amount <= 0) {
    return NextResponse.json({ message: "Amount must be greater than zero." }, { status: 400 });
  }

  const result = await fetchFromBackend(request, {
    method: "POST",
    backendPath: `/api/purchases/${vehicleId}/expenses`,
    jsonBody: {
      expenseType,
      amount,
    },
  });

  if (!result.ok) {
    return result.response;
  }

  return toNextResponse(result.response);
}
