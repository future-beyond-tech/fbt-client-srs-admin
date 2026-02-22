/**
 * Public-facing DTOs for the dealership website.
 * Contract: API_DOCUMENTATION.md — GET /api/vehicles/available
 */

export interface PublicVehiclePhoto {
  id: number;
  url: string;
  isPrimary: boolean;
  displayOrder?: number;
}

export interface PublicVehicleDto {
  id: string;
  brand: string;
  model: string;
  year: number;
  registrationNumber: string;
  chassisNumber: string | null;
  engineNumber: string | null;
  colour: string | null;
  sellingPrice: number;
  status: "AVAILABLE" | "SOLD";
  createdAt: string;
  /** Optional vehicle photo URL from backend (purchase/imageUrl or primary photo). */
  imageUrl: string | null;
  /** All vehicle photos (e.g. from Cloudinary). Sorted by displayOrder. */
  photos?: PublicVehiclePhoto[];
}
