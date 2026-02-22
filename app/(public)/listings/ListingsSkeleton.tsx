// ✅ Made fully responsive (mobile → tablet → desktop) - Functionality untouched
export function ListingsSkeleton() {
  return (
    <div className="space-y-4 sm:space-y-5">
      <div className="h-10 w-64 max-w-full rounded-lg bg-gray-200" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="overflow-hidden rounded-2xl border border-gray-200 bg-white"
          >
            <div className="aspect-[4/3] w-full rounded-t-2xl bg-gray-200" />
            <div className="p-4 sm:p-5">
              <div className="h-5 w-3/4 rounded bg-gray-200" />
              <div className="mt-3 h-4 w-1/2 rounded bg-gray-100" />
              <div className="mt-3 h-6 w-24 rounded bg-gray-200" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
