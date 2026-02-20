"use client";

import { useState } from "react";
import { Car } from "lucide-react";

interface VehicleImageProps {
  src: string | null | undefined;
  alt: string;
  /** Card: 4/3 aspect, rounded top. Detail: larger, full width. */
  variant?: "card" | "detail";
  className?: string;
  priority?: boolean;
}

export function VehicleImage({
  src,
  alt,
  variant = "card",
  className = "",
  priority = false,
}: VehicleImageProps) {
  const [error, setError] = useState(false);
  const showPlaceholder = !src || error;

  const aspectClass =
    variant === "card"
      ? "aspect-[4/3] rounded-t-2xl"
      : "aspect-[16/10] sm:aspect-[2/1] rounded-2xl";

  return (
    <div
      className={`relative w-full overflow-hidden bg-gradient-to-br from-slate-100 to-slate-200 ${aspectClass} ${className}`}
    >
      {showPlaceholder ? (
        <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-slate-400">
          <Car className="h-12 w-12 sm:h-16 sm:w-16" strokeWidth={1.5} />
          <span className="text-xs font-medium sm:text-sm">No photo</span>
        </div>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={alt}
          loading={priority ? "eager" : "lazy"}
          decoding="async"
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
          onError={() => setError(true)}
          sizes={
            variant === "card"
              ? "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              : "(max-width: 640px) 100vw, 768px"
          }
        />
      )}
    </div>
  );
}
