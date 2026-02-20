import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/server-auth";
import { fetchFromBackend, toNextResponse } from "@/lib/backend/proxy";
import { asNumber, asString, extractRows, firstDefined } from "@/lib/backend/normalize";

type JsonRecord = Record<string, unknown>;

function toFinanceCompany(row: JsonRecord) {
  return {
    id: asNumber(firstDefined(row.id, row.financeCompanyId, row.finance_company_id)),
    name: asString(firstDefined(row.name, row.financeCompanyName, row.finance_company_name)),
  };
}

export async function GET(request: NextRequest) {
  const user = await requireAuth(request);

  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const result = await fetchFromBackend(request, {
    method: "GET",
    backendPath: "/api/finance-companies",
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
      { message: "Invalid finance companies response from backend service." },
      { status: 502 },
    );
  }

  return NextResponse.json(rows.map((row) => toFinanceCompany(row)), { status: 200 });
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

  const name = asString(firstDefined(body.name)).trim();

  if (!name) {
    return NextResponse.json({ message: "Finance company name is required." }, { status: 400 });
  }

  const result = await fetchFromBackend(request, {
    method: "POST",
    backendPath: "/api/finance-companies",
    jsonBody: { name },
  });

  if (!result.ok) {
    return result.response;
  }

  return toNextResponse(result.response);
}
