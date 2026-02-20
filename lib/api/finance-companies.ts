import apiClient from "@/lib/api/client";
import type { FinanceCompany } from "@/lib/types";

export async function getFinanceCompanies(): Promise<FinanceCompany[]> {
  const { data } = await apiClient.get<FinanceCompany[]>("/finance-companies");
  return Array.isArray(data) ? data : [];
}

export async function createFinanceCompany(name: string): Promise<FinanceCompany> {
  const { data } = await apiClient.post<FinanceCompany>("/finance-companies", {
    name: name.trim(),
  });
  return data;
}

export async function deleteFinanceCompany(id: number): Promise<void> {
  await apiClient.delete(`/finance-companies/${id}`);
}
