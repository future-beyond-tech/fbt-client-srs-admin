import apiClient from "@/lib/api/client";

/**
 * GET /api/sales/{billNumber}/pdf
 * Returns sales invoice PDF as blob (backend-generated, same as send-invoice pipeline).
 */
export async function getSalesInvoicePdfBlob(
  billNumber: string | number,
): Promise<Blob> {
  const response = await apiClient.get<Blob>(
    `/sales/${encodeURIComponent(String(billNumber))}/pdf`,
    { responseType: "blob" },
  );
  const blob = response.data;
  if (!blob || !(blob instanceof Blob)) {
    throw new Error("Could not load invoice PDF.");
  }
  return blob;
}

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
