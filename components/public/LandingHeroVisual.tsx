// ✅ Made fully responsive (mobile → tablet → desktop) - Functionality untouched
import Link from "next/link";
import { ArrowUpRight, Bike, Car, CircleCheck, Gauge, Sparkles } from "lucide-react";
import { formatCurrencyINR } from "@/lib/formatters";
import type { PublicVehicleDto } from "@/lib/types/public";
import { VehicleImage } from "./VehicleImage";

interface LandingHeroVisualProps {
  topVehicle: PublicVehicleDto | null;
  totalVehicles: number;
}

export function LandingHeroVisual({ topVehicle, totalVehicles }: LandingHeroVisualProps) {
  return (
    <aside
      className="landing-visual-card group relative isolate overflow-hidden"
      aria-label="Vehicle inventory preview"
    >
      <span
        className="landing-visual-glow landing-visual-glow-top"
        aria-hidden
      />
      <span
        className="landing-visual-glow landing-visual-glow-bottom"
        aria-hidden
      />

      <div className="relative z-10 space-y-4">
        <div className="flex flex-wrap gap-2">
          <span className="landing-visual-chip">
            <Car
              aria-hidden
              className="h-4 w-4"
              strokeWidth={2}
            />
            Cars
          </span>
          <span className="landing-visual-chip">
            <Bike
              aria-hidden
              className="h-4 w-4"
              strokeWidth={2}
            />
            Bikes
          </span>
          <span className="landing-visual-chip">
            <Gauge
              aria-hidden
              className="h-4 w-4"
              strokeWidth={2}
            />
            {totalVehicles} Available
          </span>
        </div>

        {topVehicle ? (
          <Link
            href={`/vehicle/${topVehicle.id}`}
            className="landing-vehicle-preview group/preview"
          >
            <VehicleImage
              src={topVehicle.imageUrl}
              alt={`${topVehicle.brand} ${topVehicle.model} (${topVehicle.year})`}
              variant="detail"
              className="rounded-b-none"
              priority
            />
            <div className="flex items-start justify-between gap-3 p-4">
              <div className="space-y-1">
                <p className="text-sm font-semibold text-slate-900">
                  {topVehicle.brand} {topVehicle.model}
                </p>
                <p className="text-xs text-slate-500">{topVehicle.year}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-slate-900">
                  {formatCurrencyINR(topVehicle.sellingPrice)}
                </p>
                <p className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 transition-colors duration-200 group-hover/preview:text-slate-700">
                  View
                  <ArrowUpRight
                    aria-hidden
                    className="h-3.5 w-3.5"
                  />
                </p>
              </div>
            </div>
          </Link>
        ) : (
          <div className="landing-vehicle-empty" role="status" aria-live="polite">
            <Car
              aria-hidden
              className="h-8 w-8 text-slate-400"
              strokeWidth={1.75}
            />
            <span className="text-sm text-slate-500">Inventory updates shortly</span>
          </div>
        )}

        <div className="grid grid-cols-2 gap-2">
          <div className="landing-mini-tile">
            <CircleCheck
              aria-hidden
              className="h-4 w-4 text-emerald-600"
              strokeWidth={2}
            />
            Inspected
          </div>
          <div className="landing-mini-tile">
            <Sparkles
              aria-hidden
              className="h-4 w-4 text-amber-500"
              strokeWidth={2}
            />
            Clean Pricing
          </div>
        </div>
      </div>
    </aside>
  );
}
