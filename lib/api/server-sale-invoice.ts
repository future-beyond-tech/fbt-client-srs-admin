import "server-only";
import { headers } from "next/headers";
import { normalizeSaleDetailFromFlat } from "@/lib/backend/normalize";
import { resolveInternalApiBaseUrl } from "@/lib/server/resolve-internal-api-base-url";
import type { SaleDetail } from "@/lib/types";

export async function getServerSaleInvoice(billNumber: string): Promise<SaleDetail | null> {
  const baseUrl = await resolveInternalApiBaseUrl();

  if (!baseUrl) {
    return null;
  }

  const requestHeaders = await headers();
  const cookieHeader = requestHeaders.get("cookie");
  const response = await fetch(
    `${baseUrl}/api/sales/${encodeURIComponent(billNumber)}/invoice`,
    {
      method: "GET",
      cache: "no-store",
      headers: cookieHeader
        ? {
            cookie: cookieHeader,
          }
        : undefined,
    },
  );

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    return null;
  }

  const payload = (await response.json().catch(() => null)) as Record<string, unknown> | null;

  if (!payload || typeof payload !== "object") {
    return null;
  }

  return normalizeSaleDetailFromFlat(payload) as SaleDetail;
}
