import apiClient from "@/lib/api/client";

/**
 * POST /api/sales/{billNumber}/process-invoice
 * Process or mark the invoice for the given sale (e.g. mark as sent/processed).
 */
export async function processInvoice(billNumber: string | number): Promise<unknown> {
  const { data } = await apiClient.post(
    `/sales/${encodeURIComponent(String(billNumber))}/process-invoice`,
  );
  return data;
}
