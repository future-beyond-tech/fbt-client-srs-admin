import { Suspense } from "react";
import { getAvailableVehicles } from "@/services/publicVehicleService";
import { VehicleCard } from "@/components/public/VehicleCard";
import { ListingsClient } from "./ListingsClient";
import { ListingsSkeleton } from "./ListingsSkeleton";

export const metadata = {
  title: "Available Vehicles",
  description: "Browse quality checked cars and bikes. Transparent pricing, trusted dealer.",
};

async function ListingsContent() {
  let vehicles: Awaited<ReturnType<typeof getAvailableVehicles>> = [];
  try {
    vehicles = await getAvailableVehicles();
  } catch {
    vehicles = [];
  }
  return <ListingsClient initialVehicles={vehicles} />;
}

export default function ListingsPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8 md:py-10">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-xl font-bold text-gray-900 sm:text-2xl md:text-3xl">
          Available Vehicles
        </h1>
        <p className="mt-1.5 text-sm text-gray-600 sm:mt-2 sm:text-base">
          Quality checked <strong className="text-gray-800">cars</strong> and{" "}
          <strong className="text-gray-800">bikes</strong>. Select a vehicle for full details and price.
        </p>
      </div>
      <Suspense fallback={<ListingsSkeleton />}>
        <ListingsContent />
      </Suspense>
    </div>
  );
}
