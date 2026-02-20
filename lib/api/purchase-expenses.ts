import apiClient from "@/lib/api/client";
import type { PurchaseExpense } from "@/lib/types";

export interface CreatePurchaseExpensePayload {
  expenseType: string;
  amount: number;
}

export async function getPurchaseExpenses(vehicleId: string | number): Promise<PurchaseExpense[]> {
  const { data } = await apiClient.get<PurchaseExpense[]>(
    `/purchases/${encodeURIComponent(String(vehicleId))}/expenses`,
  );
  return Array.isArray(data) ? data : [];
}

export async function createPurchaseExpense(
  vehicleId: string | number,
  payload: CreatePurchaseExpensePayload,
): Promise<PurchaseExpense> {
  const { data } = await apiClient.post<PurchaseExpense>(
    `/purchases/${encodeURIComponent(String(vehicleId))}/expenses`,
    {
      expenseType: payload.expenseType.trim(),
      amount: payload.amount,
    },
  );
  return data;
}

export async function deletePurchaseExpense(expenseId: number): Promise<void> {
  await apiClient.delete(`/purchases/expenses/${expenseId}`);
}
