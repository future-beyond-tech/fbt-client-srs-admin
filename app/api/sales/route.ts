import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/server-auth";
import { addSale } from "@/lib/data-store";
import { saleSchema } from "@/lib/validations/sale";

export async function POST(request: NextRequest) {
  const user = await requireAuth(request);

  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = saleSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { message: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }

  try {
    const { vehiclePrice: _vehiclePrice, ...payload } = parsed.data;

    const sale = await addSale(payload);

    return NextResponse.json(
      {
        message: "Sale completed successfully",
        billNumber: sale.billNumber,
        data: sale,
      },
      { status: 201 },
    );
  } catch (error) {
    return NextResponse.json(
      {
        message: error instanceof Error ? error.message : "Failed to create sale",
      },
      { status: 400 },
    );
  }
}
