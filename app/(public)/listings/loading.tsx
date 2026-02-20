import { ListingsSkeleton } from "./ListingsSkeleton";

export default function ListingsLoading() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8 md:py-10">
      <div className="mb-6 sm:mb-8">
        <div className="h-7 w-40 rounded bg-gray-200 sm:h-8 sm:w-48" />
        <div className="mt-2 h-4 w-56 max-w-full rounded bg-gray-100 sm:h-5 sm:w-72" />
      </div>
      <ListingsSkeleton />
    </div>
  );
}
