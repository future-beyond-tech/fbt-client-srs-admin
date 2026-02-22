// ✅ Made fully responsive (mobile → tablet → desktop) - Functionality untouched
import Link from "next/link";
import { formatCurrencyINR } from "@/lib/formatters";
import type { PublicVehicleDto } from "@/lib/types/public";
import { VehicleImage } from "./VehicleImage";

interface VehicleCardProps {
  vehicle: PublicVehicleDto;
  /** Use compact style for grids where space is limited */
  compact?: boolean;
  /** Prioritize loading image (e.g. above-the-fold featured) */
  priority?: boolean;
}

export function VehicleCard({ vehicle, compact, priority }: VehicleCardProps) {
  const { id, brand, model, year, registrationNumber, sellingPrice, imageUrl } =
    vehicle;
  const title = `${brand} ${model} (${year})`;

  return (
    <Link
      href={`/vehicle/${id}`}
      className="group block overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition-all duration-200 ease-out hover:border-gray-300 hover:shadow-lg"
    >
      <VehicleImage
        src={imageUrl}
        alt={title}
        variant="card"
        priority={priority}
      />
      <div className="flex flex-col gap-2 p-4 sm:gap-3 sm:p-5 lg:p-5">
        <div className="flex items-start justify-between gap-2">
          <h3 className="line-clamp-2 font-semibold text-gray-900 group-hover:text-gray-700">
            {title}
          </h3>
          <span className="shrink-0 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-800">
            Available
          </span>
        </div>
        {!compact && (
          <p className="text-sm text-gray-500">Reg: {registrationNumber}</p>
        )}
        <p className="text-lg font-bold text-gray-900">
          {formatCurrencyINR(sellingPrice)}
        </p>
        <span className="text-sm font-medium text-gray-500 group-hover:text-gray-700">
          View details →
        </span>
      </div>
    </Link>
  );
}
