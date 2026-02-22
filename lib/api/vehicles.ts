import type { Vehicle } from "@/lib/types";
import apiClient from "@/lib/api/client";

/**
 * GET /api/vehicles/{id}
 * Fetch a single vehicle by ID.
 */
export async function getVehicleById(id: string | number): Promise<Vehicle | null> {
  try {
    const { data } = await apiClient.get<Vehicle>(`/vehicles/${encodeURIComponent(String(id))}`);
    return data ?? null;
  } catch {
    return null;
  }
}

/**
 * POST /api/vehicles/{vehicleId}/photos
 * Upload multiple photos for a vehicle (multipart/form-data).
 * Do not set Content-Type so axios sets it with the correct boundary.
 */
export async function uploadVehiclePhotos(
  vehicleId: string | number,
  formData: FormData,
): Promise<unknown> {
  const { data } = await apiClient.post(
    `/vehicles/${encodeURIComponent(String(vehicleId))}/photos`,
    formData,
  );
  return data;
}

/**
 * PATCH /api/vehicles/{vehicleId}/photos/{photoId}/primary
 * Set the given photo as the primary photo for the vehicle.
 */
export async function setPrimaryVehiclePhoto(
  vehicleId: string | number,
  photoId: number,
): Promise<void> {
  await apiClient.patch(
    `/vehicles/${encodeURIComponent(String(vehicleId))}/photos/${photoId}/primary`,
    {},
  );
}

/**
 * DELETE /api/vehicles/photos/{photoId}
 * Delete a vehicle photo by ID.
 */
export async function deleteVehiclePhoto(photoId: number): Promise<void> {
  await apiClient.delete(`/vehicles/photos/${photoId}`);
}
