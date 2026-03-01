import "server-only";
import { resolveInternalApiBaseUrl } from "@/lib/server/resolve-internal-api-base-url";
import type { PublicVehicleDto } from "@/lib/types/public";

/**
 * Fetches available vehicles for the public website.
 * Uses the public API route that does not require authentication.
 */
export async function getAvailableVehicles(): Promise<PublicVehicleDto[]> {
  const baseUrl = await resolveInternalApiBaseUrl();
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
