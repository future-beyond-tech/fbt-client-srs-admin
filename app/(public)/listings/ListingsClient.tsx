"use client";

import { useMemo, useState } from "react";
import { VehicleCard } from "@/components/public/VehicleCard";
import type { PublicVehicleDto } from "@/lib/types/public";

interface ListingsClientProps {
  initialVehicles: PublicVehicleDto[];
}

function filterVehicles(vehicles: PublicVehicleDto[], query: string): PublicVehicleDto[] {
  const q = query.trim().toLowerCase();
  if (!q) return vehicles;
  return vehicles.filter(
    (v) =>
      v.brand.toLowerCase().includes(q) ||
      v.model.toLowerCase().includes(q) ||
      v.registrationNumber.toLowerCase().includes(q) ||
      String(v.year).includes(q),
  );
}

export function ListingsClient({ initialVehicles }: ListingsClientProps) {
  const [search, setSearch] = useState("");
  const filtered = useMemo(
    () => filterVehicles(initialVehicles, search),
    [initialVehicles, search],
  );

  return (
    <div className="space-y-5 sm:space-y-6">
      <div className="flex flex-col gap-2 xs:flex-row xs:items-center xs:justify-between">
        <input
          type="search"
          placeholder="Search by brand, model, year, registration..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="min-h-[44px] w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-base text-gray-900 placeholder:text-gray-400 focus:border-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500 sm:max-w-md sm:text-sm"
          aria-label="Search vehicles"
        />
        <p className="shrink-0 text-sm text-gray-500">
          {filtered.length} vehicle{filtered.length !== 1 ? "s" : ""} found
        </p>
      </div>

      {filtered.length > 0 ? (
        <div className="grid gap-4 xs:gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((v) => (
            <VehicleCard key={v.id} vehicle={v} />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50/50 p-8 text-center sm:p-12">
          <p className="text-sm text-gray-500 sm:text-base">
            {search
              ? "No vehicles match your search. Try a different term."
              : "No vehicles available at the moment."}
          </p>
        </div>
      )}
    </div>
  );
}
