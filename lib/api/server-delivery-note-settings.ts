import "server-only";
import { headers } from "next/headers";
import { resolveInternalApiBaseUrl } from "@/lib/server/resolve-internal-api-base-url";
import type { DeliveryNoteSettings } from "@/lib/types";

function normalizeNullable(value: unknown): string | null {
  if (typeof value !== "string") {
    return value == null ? null : String(value);
  }

  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

export async function getServerDeliveryNoteSettings(): Promise<DeliveryNoteSettings | null> {
  const baseUrl = await resolveInternalApiBaseUrl();

  if (!baseUrl) {
    return null;
  }

  const requestHeaders = await headers();
  const cookieHeader = requestHeaders.get("cookie");
  const response = await fetch(`${baseUrl}/api/settings/delivery-note`, {
    method: "GET",
    cache: "no-store",
    headers: cookieHeader
      ? {
          cookie: cookieHeader,
        }
      : undefined,
  });

  if (!response.ok) {
    return null;
  }

  const payload = (await response.json().catch(() => null)) as Record<string, unknown> | null;

  if (!payload || typeof payload !== "object") {
    return null;
  }

  return {
    shopName: normalizeNullable(payload.shopName),
    shopAddress: normalizeNullable(payload.shopAddress),
    gstNumber: normalizeNullable(payload.gstNumber),
    contactNumber: normalizeNullable(payload.contactNumber),
    footerText: normalizeNullable(payload.footerText),
    termsAndConditions: normalizeNullable(payload.termsAndConditions),
    logoUrl: normalizeNullable(payload.logoUrl),
    signatureLine: normalizeNullable(payload.signatureLine),
  };
}
