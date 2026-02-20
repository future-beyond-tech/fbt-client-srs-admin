import { Car, Bike } from "lucide-react";

/**
 * Animated car and bike icons for the public hero.
 * Helps viewers immediately understand: Cars & Bikes dealer.
 */
export function HeroVehicleAnimation() {
  return (
    <div
      className="hero-vehicle-icons mt-6 sm:mt-8"
      aria-hidden
    >
      <div className="flex flex-col items-center gap-1 rounded-2xl border border-gray-200/80 bg-white/60 px-6 py-4 shadow-sm backdrop-blur sm:flex-row sm:gap-8 sm:px-8 sm:py-5">
        <div className="flex items-center gap-3 sm:gap-4">
          <span
            className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-600 sm:h-14 sm:w-14"
            aria-hidden
          >
            <Car
              className="h-6 w-6 animate-car-drive sm:h-8 sm:w-8"
              strokeWidth={2}
            />
          </span>
          <span className="text-sm font-semibold text-gray-700 sm:text-base">
            Cars
          </span>
        </div>
        <div className="hidden h-8 w-px bg-gray-300 sm:block" />
        <div className="h-px w-8 bg-gray-300 sm:hidden" />
        <div className="flex items-center gap-3 sm:gap-4">
          <span
            className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 text-amber-700 sm:h-14 sm:w-14"
            aria-hidden
          >
            <Bike
              className="h-6 w-6 animate-bike-ride sm:h-8 sm:w-8"
              strokeWidth={2}
            />
          </span>
          <span className="text-sm font-semibold text-gray-700 sm:text-base">
            Bikes
          </span>
        </div>
      </div>
    </div>
  );
}
