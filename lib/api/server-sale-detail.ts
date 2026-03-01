import "server-only";
import { headers } from "next/headers";
import { resolveInternalApiBaseUrl } from "@/lib/server/resolve-internal-api-base-url";
import type { SaleDetail } from "@/lib/types";

export async function getServerSaleDetail(billNumber: string): Promise<SaleDetail | null> {
  const baseUrl = await resolveInternalApiBaseUrl();

  if (!baseUrl) {
    return null;
  }

  const requestHeaders = await headers();
  const cookieHeader = requestHeaders.get("cookie");
  const response = await fetch(
    `${baseUrl}/api/sales/${encodeURIComponent(billNumber)}`,
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

  const payload = (await response.json().catch(() => null)) as SaleDetail | null;

  return payload;
}
