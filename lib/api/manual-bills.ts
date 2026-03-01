import apiClient from "@/lib/api/client";
import type {
  ManualBillCreateDto,
  ManualBillCreateResponse,
  ManualBillSendInvoiceResponse,
} from "@/lib/types";

/** Allowed image types for upload (match backend constraints). */
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
/** Max file size 2MB. */
const MAX_FILE_SIZE_BYTES = 2 * 1024 * 1024;

/**
 * Validate file type and size before upload. Throws on invalid.
 */
export function validatePhotoFile(file: File): void {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    throw new Error("Only JPEG, PNG, or WebP images are allowed.");
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    throw new Error("Image size must be 2MB or less.");
  }
}

/**
 * Upload photo via POST /api/upload. Returns URL for use in manual bill payload.
 */
export async function uploadPhoto(file: File): Promise<string> {
  validatePhotoFile(file);
  const formData = new FormData();
  formData.append("file", file);
  const { data } = await apiClient.post<{ url: string }>("/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  if (!data?.url || typeof data.url !== "string") {
    throw new Error("Upload did not return a URL.");
  }
  return data.url;
}

/**
 * Create manual bill via POST /api/manual-bills.
 */
export async function createManualBill(
  payload: ManualBillCreateDto,
): Promise<ManualBillCreateResponse> {
  const { data } = await apiClient.post<ManualBillCreateResponse>(
    "/manual-bills",
    payload,
  );
  return data;
}

/**
 * Send manual bill invoice via WhatsApp (POST /api/manual-bills/{billNumber}/send-invoice).
 */
export async function sendManualBillInvoice(
  billNumber: string,
): Promise<ManualBillSendInvoiceResponse> {
  const { data } = await apiClient.post<ManualBillSendInvoiceResponse>(
    `/manual-bills/${encodeURIComponent(billNumber)}/send-invoice`,
  );
  return data;
}

/**
 * Get manual bill PDF as Blob for download. Uses ?download=true so backend returns bytes.
 */
export async function downloadManualBillPdf(billNumber: string): Promise<Blob> {
  const { data } = await apiClient.get<Blob>(
    `/manual-bills/${encodeURIComponent(billNumber)}/pdf?download=true`,
    { responseType: "blob" },
  );
  if (!data || !(data instanceof Blob)) {
    throw new Error("Could not get PDF.");
  }
  return data;
}

/**
 * Return same-origin URL to open manual bill PDF in new tab (e.g. for print).
 * Uses inline=1 so the BFF returns Content-Disposition: inline and the browser displays the PDF instead of downloading.
 */
export function getManualBillPdfUrl(billNumber: string): string {
  return `/api/manual-bills/${encodeURIComponent(billNumber)}/pdf?download=true&inline=1`;
}
