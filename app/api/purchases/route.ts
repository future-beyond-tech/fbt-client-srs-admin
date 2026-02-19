import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/server-auth";
import { addPurchase, getPurchases } from "@/lib/data-store";
import { purchaseSchema } from "@/lib/validations/purchase";

export async function GET(request: NextRequest) {
  const user = await requireAuth(request);

  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const data = await getPurchases();
  return NextResponse.json(data, { status: 200 });
}

export async function POST(request: NextRequest) {
  const user = await requireAuth(request);

  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = purchaseSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { message: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }

  const payload = parsed.data;

  const purchase = await addPurchase({
    ...payload,
    imageUrl: payload.imageUrl?.trim() ? payload.imageUrl : undefined,
  });

  return NextResponse.json(
    {
      message: "Purchase created successfully",
      data: purchase,
    },
    { status: 201 },
  );
}
