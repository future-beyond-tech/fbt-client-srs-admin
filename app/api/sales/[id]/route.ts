import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/server-auth";
import { getSaleDetail } from "@/lib/data-store";

interface RouteContext {
  params: {
    id: string;
  };
}

export async function GET(request: NextRequest, context: RouteContext) {
  const user = await requireAuth(request);

  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const sale = await getSaleDetail(context.params.id);

  if (!sale) {
    return NextResponse.json({ message: "Sale not found" }, { status: 404 });
  }

  return NextResponse.json(sale, { status: 200 });
}
