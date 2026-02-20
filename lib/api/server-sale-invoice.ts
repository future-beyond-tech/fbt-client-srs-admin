import { headers } from "next/headers";
import { normalizeSaleDetailFromFlat } from "@/lib/backend/normalize";
import type { SaleDetail } from "@/lib/types";

function resolveInternalApiBaseUrl() {
  const requestHeaders = headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host");

  if (!host) {
    return null;
  }

  const forwardedProto = requestHeaders
    .get("x-forwarded-proto")
    ?.split(",")[0]
    ?.trim();

  const protocol =
    forwardedProto ||
    (host.includes("localhost") || host.startsWith("127.0.0.1") ? "http" : "https");

  return `${protocol}://${host}`;
}

export async function getServerSaleInvoice(billNumber: string): Promise<SaleDetail | null> {
  const baseUrl = resolveInternalApiBaseUrl();

  if (!baseUrl) {
    return null;
  }

  const requestHeaders = headers();
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
