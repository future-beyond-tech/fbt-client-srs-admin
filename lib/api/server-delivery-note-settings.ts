import { headers } from "next/headers";
import type { DeliveryNoteSettings } from "@/lib/types";

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

function normalizeNullable(value: unknown): string | null {
  if (typeof value !== "string") {
    return value == null ? null : String(value);
  }

  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

export async function getServerDeliveryNoteSettings(): Promise<DeliveryNoteSettings | null> {
  const baseUrl = resolveInternalApiBaseUrl();

  if (!baseUrl) {
    return null;
  }

  const requestHeaders = headers();
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
