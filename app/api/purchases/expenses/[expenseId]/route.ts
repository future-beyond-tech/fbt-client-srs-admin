import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/server-auth";
import { proxyToBackend } from "@/lib/backend/proxy";

interface RouteContext {
  params: Promise<{ expenseId: string }>;
}

function parseId(value: string) {
  const parsed = Number.parseInt(value.trim(), 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const user = await requireAuth(request);

  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { expenseId } = await context.params;
  const parsedExpenseId = parseId(expenseId ?? "");

  if (!parsedExpenseId) {
    return NextResponse.json({ message: "Expense ID is required." }, { status: 400 });
  }

  return proxyToBackend(request, {
    method: "DELETE",
    backendPath: `/api/purchases/expenses/${parsedExpenseId}`,
  });
}
