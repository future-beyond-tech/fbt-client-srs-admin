import { headers } from "next/headers";
import type { PublicVehicleDto } from "@/lib/types/public";

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

/**
 * Fetches available vehicles for the public website.
 * Uses the public API route that does not require authentication.
 */
export async function getAvailableVehicles(): Promise<PublicVehicleDto[]> {
  const baseUrl = resolveInternalApiBaseUrl();
  if (!baseUrl) {
    throw new Error("Unable to resolve public API base URL.");
  }

  const url = `${baseUrl}/api/public/vehicles/available`;
  const res = await fetch(url, {
    method: "GET",
    headers: { Accept: "application/json" },
    cache: "no-store",
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const message =
      typeof body?.message === "string" && body.message.trim()
        ? body.message
        : "Failed to load vehicles.";
    throw new Error(message);
  }
  const data = await res.json();
  if (!Array.isArray(data)) return [];
  return data as PublicVehicleDto[];
}

/**
 * Fetches a single vehicle by id from the available list.
 * Returns null if not found or not available.
 */
export async function getAvailableVehicleById(id: string): Promise<PublicVehicleDto | null> {
  const vehicles = await getAvailableVehicles();
  const match = vehicles.find((v) => String(v.id) === String(id));
  return match ?? null;
}
