/**
 * Public-facing DTOs for the dealership website.
 * Contract: API_DOCUMENTATION.md — GET /api/vehicles/available
 */

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
  /** Optional vehicle photo URL from backend (purchase/imageUrl). */
  imageUrl: string | null;
}
