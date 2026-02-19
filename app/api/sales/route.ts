import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/server-auth";
import { fetchFromBackend, toNextResponse } from "@/lib/backend/proxy";
import {
  asNumber,
  asString,
  extractRows,
  firstDefined,
  normalizeSale,
} from "@/lib/backend/normalize";

type SalePayload = ReturnType<typeof toBackendSalePayload>;
type BackendCandidate = Record<string, unknown>;

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

function resolveSaleDate(input: Record<string, unknown>) {
  const dateCandidate = asString(
    firstDefined(input.saleDate, input.sale_date, input.SaleDate),
  ).trim();

  if (!dateCandidate) {
    return getTodayDateString();
  }

  return toUtcIsoString(dateCandidate);
}

function parseVehicleId(value: unknown): number {
  if (typeof value === "number" && Number.isInteger(value) && value >= 0) {
    return value;
  }
  const str = asString(value).replace(/\D/g, "");
  const num = parseInt(str, 10);
  return Number.isFinite(num) ? num : 0;
}

function toBackendSalePayload(input: Record<string, unknown>) {
  const financeCompany = asString(
    firstDefined(input.financeCompany, input.finance_company),
  ).trim();

  return {
    vehicleId: parseVehicleId(firstDefined(input.vehicleId, input.vehicle_id)),
    customerPhotoUrl: asString(
      firstDefined(input.customerPhotoUrl, input.customer_photo_url, input.CustomerPhotoUrl),
    ),
    customerName: asString(
      firstDefined(input.customerName, input.customer_name, input.buyerName, input.buyer_name),
    ),
    phone: asString(
      firstDefined(input.phone, input.phoneNumber, input.mobile, input.customerPhone),
    ),
    address: asString(firstDefined(input.address, input.customerAddress, input.customer_address)),
    paymentMode: asString(firstDefined(input.paymentMode, input.payment_mode, input.mode), "Cash"),
    cashAmount: asNumber(firstDefined(input.cashAmount, input.cash, input.cash_amount)),
    upiAmount: asNumber(firstDefined(input.upiAmount, input.upi, input.upi_amount)),
    financeAmount: asNumber(
      firstDefined(
        input.financeAmount,
        input.finance,
        input.finance_amount,
        input.loanAmount,
        input.loan_amount,
      ),
    ),
    saleDate: resolveSaleDate(input),
    ...(financeCompany ? { financeCompany } : {}),
  };
}

function toBackendPaymentMode(input: string) {
  const normalized = input.trim().toUpperCase();

  if (normalized === "CASH") {
    return 1;
  }

  if (normalized === "UPI") {
    return 2;
  }

  if (normalized === "FINANCE") {
    return 3;
  }

  return null;
}

function toBackendPaymentModeCandidates(input: string) {
  const normalized = input.trim().toUpperCase();

  if (normalized === "CASH") {
    return [1, 0];
  }

  if (normalized === "UPI") {
    return [2, 1];
  }

  if (normalized === "FINANCE") {
    return [3, 2];
  }

  return [];
}

function shouldRetryModelBinding(responsePayload: unknown) {
  if (!responsePayload || typeof responsePayload !== "object") {
    return false;
  }

  const payload = responsePayload as Record<string, unknown>;
  const errors = payload.errors;

  if (!errors || typeof errors !== "object") {
    return false;
  }

  const keyedErrors = errors as Record<string, unknown>;
  const keys = Object.keys(keyedErrors).map((key) => key.toLowerCase());

  if (
    keys.some(
      (key) =>
        key.includes("dto") ||
        key.includes("paymentmode") ||
        key.includes("customername") ||
        key.includes("customerphone") ||
        key.includes("customerphotourl") ||
        key.includes("phone") ||
        key.includes("vehicleid") ||
        key.includes("address") ||
        key.includes("saledate"),
    )
  ) {
    return true;
  }

  const flatMessages = Object.values(keyedErrors)
    .flatMap((value) => (Array.isArray(value) ? value : [value]))
    .filter((value): value is string => typeof value === "string")
    .map((value) => value.toLowerCase());

  return flatMessages.some(
    (message) =>
      message.includes("dto field is required") ||
      message.includes("could not be converted") ||
      message.includes("paymentmode") ||
      message.includes("field is required") ||
      message.includes("saledate"),
  );
}

function buildPascalSalePayload(payload: SalePayload, paymentMode: string | number) {
  return {
    VehicleId: payload.vehicleId,
    CustomerPhotoUrl: payload.customerPhotoUrl,
    CustomerName: payload.customerName,
    CustomerPhone: payload.phone,
    Phone: payload.phone,
    CustomerAddress: payload.address,
    Address: payload.address,
    SaleDate: payload.saleDate,
    PaymentMode: paymentMode,
    CashAmount: payload.cashAmount,
    UpiAmount: payload.upiAmount,
    FinanceAmount: payload.financeAmount,
    ...(payload.financeCompany ? { FinanceCompany: payload.financeCompany } : {}),
  };
}

function buildCamelSalePayload(payload: SalePayload, paymentMode: string | number) {
  return {
    ...payload,
    customerPhone: payload.phone,
    customerPhotoURL: payload.customerPhotoUrl,
    customerAddress: payload.address,
    sale_date: payload.saleDate,
    paymentMode,
    paymentModeId: paymentMode,
    mode: paymentMode,
  };
}

function addCandidate(
  list: BackendCandidate[],
  seen: Set<string>,
  candidate: BackendCandidate,
) {
  const key = JSON.stringify(candidate);

  if (!seen.has(key)) {
    seen.add(key);
    list.push(candidate);
  }
}

function buildSaleCandidates(payload: SalePayload) {
  const numericModes = toBackendPaymentModeCandidates(payload.paymentMode);
  const fallbackNumericMode = toBackendPaymentMode(payload.paymentMode);
  const normalizedNumericModes =
    numericModes.length > 0
      ? numericModes
      : fallbackNumericMode === null
        ? []
        : [fallbackNumericMode];
  const candidates: BackendCandidate[] = [];
  const seen = new Set<string>();

  for (const numericMode of normalizedNumericModes) {
    const pascalNumericPayload = buildPascalSalePayload(payload, numericMode);
    const camelNumericPayload = buildCamelSalePayload(payload, numericMode);

    // Prioritize ASP.NET endpoints that expect a named DTO wrapper.
    addCandidate(candidates, seen, { dto: pascalNumericPayload });
    addCandidate(candidates, seen, { dto: camelNumericPayload });
    addCandidate(candidates, seen, { Dto: pascalNumericPayload });
    addCandidate(candidates, seen, { Dto: camelNumericPayload });
    addCandidate(candidates, seen, pascalNumericPayload);
    addCandidate(candidates, seen, camelNumericPayload);
  }

  const camelStringPayload = buildCamelSalePayload(payload, payload.paymentMode);
  const pascalStringPayload = buildPascalSalePayload(payload, payload.paymentMode);

  // Final fallback for backends configured with string enum converters.
  addCandidate(candidates, seen, { dto: pascalStringPayload });
  addCandidate(candidates, seen, { dto: camelStringPayload });
  addCandidate(candidates, seen, pascalStringPayload);
  addCandidate(candidates, seen, camelStringPayload);

  return candidates;
}

async function postSaleWithFallback(request: NextRequest, payload: SalePayload) {
  const candidates = buildSaleCandidates(payload);
  let lastResponse: Response | null = null;

  for (const [index, candidate] of candidates.entries()) {
    const result = await fetchFromBackend(request, {
      method: "POST",
      backendPath: "/api/sales",
      jsonBody: candidate,
    });

    if (!result.ok) {
      return {
        ok: false as const,
        nextResponse: result.response,
      };
    }

    if (result.response.ok) {
      return {
        ok: true as const,
        response: result.response,
      };
    }

    lastResponse = result.response;
    const hasNextCandidate = index < candidates.length - 1;

    if (hasNextCandidate && result.response.status === 500) {
      continue;
    }

    if (!hasNextCandidate || result.response.status !== 400) {
      break;
    }

    const errorPayload = await result.response.clone().json().catch(() => null);

    if (!shouldRetryModelBinding(errorPayload)) {
      break;
    }
  }

  if (!lastResponse) {
    return {
      ok: false as const,
      nextResponse: NextResponse.json({ message: "Unable to create sale." }, { status: 500 }),
    };
  }

  return {
    ok: false as const,
    nextResponse: await toNextResponse(lastResponse),
  };
}

export async function GET(request: NextRequest) {
  const user = await requireAuth(request);

  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const result = await fetchFromBackend(request, {
    method: "GET",
    backendPath: "/api/sales",
    includeQuery: true,
  });

  if (!result.ok) {
    return result.response;
  }

  if (!result.response.ok) {
    return toNextResponse(result.response);
  }

  const payload = (await result.response.json().catch(() => null)) as
    | Record<string, unknown>
    | unknown[]
    | null;

  const rows = extractRows(payload);

  if (!rows) {
    return NextResponse.json(
      { message: "Invalid sales response from backend service." },
      { status: 502 },
    );
  }

  const items = rows.map((row) => {
    const sale = normalizeSale(row);
    const profit = asNumber(firstDefined(row.profit, (row as Record<string, unknown>)?.profit));
    return { ...sale, profit };
  });

  if (Array.isArray(payload)) {
    return NextResponse.json({ items, totalCount: items.length, pageNumber: 1, pageSize: items.length, totalPages: 1 }, { status: 200 });
  }

  const totalCount = asNumber(firstDefined((payload as Record<string, unknown>)?.totalCount, (payload as Record<string, unknown>)?.total_count)) || items.length;
  const pageNumber = asNumber(firstDefined((payload as Record<string, unknown>)?.pageNumber, (payload as Record<string, unknown>)?.page_number)) || 1;
  const pageSize = asNumber(firstDefined((payload as Record<string, unknown>)?.pageSize, (payload as Record<string, unknown>)?.page_size)) || items.length;
  const totalPages = asNumber(firstDefined((payload as Record<string, unknown>)?.totalPages, (payload as Record<string, unknown>)?.total_pages)) || Math.max(1, Math.ceil(totalCount / pageSize));

  return NextResponse.json(
    { items, totalCount, pageNumber, pageSize, totalPages },
    { status: 200 },
  );
}

export async function POST(request: NextRequest) {
  const user = await requireAuth(request);

  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;

  if (!body || typeof body !== "object") {
    return NextResponse.json({ message: "Invalid request payload." }, { status: 400 });
  }

  const backendPayload = toBackendSalePayload(body);

  if (!backendPayload.customerName.trim()) {
    return NextResponse.json({ message: "Customer name is required." }, { status: 400 });
  }

  if (!backendPayload.customerPhotoUrl.trim()) {
    return NextResponse.json({ message: "Customer photo is required." }, { status: 400 });
  }

  if (!backendPayload.phone.trim()) {
    return NextResponse.json({ message: "Phone is required." }, { status: 400 });
  }

  if (backendPayload.vehicleId <= 0) {
    return NextResponse.json({ message: "Vehicle is required." }, { status: 400 });
  }

  const posted = await postSaleWithFallback(request, backendPayload);

  if (!posted.ok) {
    return posted.nextResponse;
  }

  const payload = (await posted.response.json().catch(() => null)) as
    | Record<string, unknown>
    | null;

  if (!payload || typeof payload !== "object") {
    return NextResponse.json(
      { message: "Invalid sale create response from backend service." },
      { status: 502 },
    );
  }

  const dataRecord =
    typeof payload.data === "object" && payload.data !== null
      ? (payload.data as Record<string, unknown>)
      : null;

  const saleId = asString(
    firstDefined(payload.id, payload.saleId, payload.sale_id, dataRecord?.id, dataRecord?.saleId),
  );
  const billNumber = asString(
    firstDefined(
      payload.billNumber,
      payload.billNo,
      payload.bill_number,
      payload.invoiceNumber,
      dataRecord?.billNumber,
      dataRecord?.billNo,
    ),
  );

  return NextResponse.json(
    {
      ...payload,
      billNumber,
      data: {
        ...(dataRecord ?? {}),
        id: saleId,
      },
    },
    { status: posted.response.status },
  );
}
