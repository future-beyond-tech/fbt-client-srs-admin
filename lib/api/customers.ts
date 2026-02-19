import type { Customer } from "@/lib/types";
import apiClient from "@/lib/api/client";

export async function getCustomers(): Promise<Customer[]> {
  const { data } = await apiClient.get<Customer[]>("/customers");
  return Array.isArray(data) ? data : [];
}

export async function getCustomerById(id: string): Promise<Customer | null> {
  try {
    const { data } = await apiClient.get<Customer>(`/customers/${encodeURIComponent(id)}`);
    return data ?? null;
  } catch {
    return null;
  }
}

export async function searchCustomersByPhone(phone: string): Promise<Customer[]> {
  if (!phone.trim()) return [];
  const { data } = await apiClient.get<Customer[]>("/customers/search", {
    params: { phone: phone.trim() },
  });
  return Array.isArray(data) ? data : [];
}

export interface CreateCustomerPayload {
  name: string;
  phone: string;
  address?: string | null;
}

export async function createCustomer(payload: CreateCustomerPayload): Promise<Customer> {
  const { data } = await apiClient.post<Customer>("/customers", {
    name: payload.name.trim(),
    phone: payload.phone.trim(),
    ...(payload.address != null && payload.address.trim() !== ""
      ? { address: payload.address.trim() }
      : {}),
  });
  return data;
}
