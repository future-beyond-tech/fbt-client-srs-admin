import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/server-auth";
import { getDashboardStats } from "@/lib/data-store";

export async function GET(request: NextRequest) {
  const user = await requireAuth(request);

  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const data = await getDashboardStats();

  return NextResponse.json(data, { status: 200 });
}
