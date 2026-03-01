import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/server-auth";
import { fetchFromBackend, toNextResponse } from "@/lib/backend/proxy";
import { asNumber, asString, extractRows, firstDefined } from "@/lib/backend/normalize";

export async function GET(request: NextRequest) {
  const user = await requireAuth(request);

  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const result = await fetchFromBackend(request, {
    method: "GET",
    backendPath: "/api/search",
    includeQuery: true,
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
      { message: "Invalid search response from backend service." },
      { status: 502 },
    );
  }

  const normalized = rows.map((row) => ({
    type: (firstDefined(row.type, row.Type) as string) || "Sale",
    billNumber: asNumber(
      firstDefined(
        row.billNumber,
        row.billNo,
        row.bill_number,
        row.invoiceNumber,
        row.saleId,
        row.sale_id,
        row.id,
      ),
    ),
    customerName: asString(firstDefined(row.customerName, row.customer_name)),
    customerPhone: asString(
      firstDefined(
        row.customerPhone,
        row.customer_phone,
        row.phone,
        row.phoneNumber,
        row.mobile,
      ),
    ),
    vehicle: asString(firstDefined(row.vehicle, row.vehicleName, row.vehicle_model)),
    registrationNumber: asString(
      firstDefined(
        row.registrationNumber,
        row.registrationNo,
        row.registration_number,
        row.regNumber,
        row.reg_no,
      ),
    ),
    saleDate: asString(firstDefined(row.saleDate, row.sale_date, row.createdAt, row.date)),
  }));

  return NextResponse.json(normalized, { status: 200 });
}
