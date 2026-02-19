import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/server-auth";
import { searchSales } from "@/lib/data-store";

export async function GET(request: NextRequest) {
  const user = await requireAuth(request);

  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const query = request.nextUrl.searchParams.get("q") ?? "";
  const results = await searchSales(query);

  return NextResponse.json(results, { status: 200 });
}
