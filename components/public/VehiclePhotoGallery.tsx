"use client";

import { useState } from "react";
import { Car } from "lucide-react";
import type { PublicVehiclePhoto } from "@/lib/types/public";

interface VehiclePhotoGalleryProps {
  photos: PublicVehiclePhoto[];
  alt: string;
  /** Use same aspect as detail variant */
  className?: string;
}

export function VehiclePhotoGallery({
  photos,
  alt,
  className = "",
}: VehiclePhotoGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [errorIndexes, setErrorIndexes] = useState<Set<number>>(new Set());
  const mainPhoto = photos[selectedIndex];
  const mainFailed = mainPhoto ? errorIndexes.has(selectedIndex) : true;

  const handleError = (index: number) => {
    setErrorIndexes((prev) => new Set(prev).add(index));
  };

  if (!photos.length) {
    return (
      <div
        className={`flex aspect-[16/10] w-full items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 sm:aspect-[2/1] ${className}`}
      >
        <div className="flex flex-col items-center gap-2 text-slate-400">
          <Car className="h-12 w-12 sm:h-16 sm:w-16" strokeWidth={1.5} />
          <span className="text-xs font-medium sm:text-sm">No photo</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col gap-3 ${className}`}>
      <div className="relative aspect-[16/10] w-full overflow-hidden rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 sm:aspect-[2/1]">
        {mainFailed ? (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-slate-400">
            <Car className="h-12 w-12 sm:h-16 sm:w-16" strokeWidth={1.5} />
            <span className="text-xs font-medium sm:text-sm">Image unavailable</span>
          </div>
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={mainPhoto.url}
            src={mainPhoto.url}
            alt={photos.length > 1 ? `${alt} (${selectedIndex + 1} of ${photos.length})` : alt}
            className="h-full w-full object-contain"
            loading="eager"
            decoding="async"
            onError={() => handleError(selectedIndex)}
            sizes="(max-width: 640px) 100vw, 768px"
          />
        )}
      </div>
      {photos.length > 1 && (
        <div className="flex flex-wrap gap-2 px-4 pb-4 sm:px-6">
          {photos.map((photo, index) => {
            const hasError = errorIndexes.has(index);
            return (
              <button
                key={photo.id}
                type="button"
                onClick={() => setSelectedIndex(index)}
                className={`relative h-14 w-14 shrink-0 overflow-hidden rounded-lg border-2 transition-colors sm:h-16 sm:w-16 ${
                  selectedIndex === index
                    ? "border-gray-900 ring-2 ring-gray-900 ring-offset-2"
                    : "border-gray-200 hover:border-gray-400"
                }`}
                aria-label={`View photo ${index + 1} of ${photos.length}`}
              >
                {hasError ? (
                  <div className="flex h-full w-full items-center justify-center bg-slate-200">
                    <Car className="h-6 w-6 text-slate-400" strokeWidth={1.5} />
                  </div>
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={photo.url}
                    alt=""
                    className="h-full w-full object-cover"
                    loading="lazy"
                    onError={() => handleError(index)}
                  />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
