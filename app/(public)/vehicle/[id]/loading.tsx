export default function VehicleLoading() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-8">
      <div className="h-5 w-24 rounded bg-gray-200" />
      <div className="mt-6 overflow-hidden rounded-2xl border border-gray-200 bg-white sm:mt-8">
        <div className="aspect-[16/10] w-full rounded-t-2xl bg-gray-200 sm:aspect-[2/1]" />
        <div className="p-4 sm:p-6 lg:p-8">
          <div className="h-6 w-3/4 rounded bg-gray-200 sm:h-8" />
          <div className="mt-2 h-4 w-1/2 rounded bg-gray-100" />
          <div className="mt-5 h-8 w-36 rounded bg-gray-200 sm:mt-6 sm:h-10" />
          <div className="mt-6 grid gap-4 sm:mt-8 sm:grid-cols-2 sm:gap-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i}>
                <div className="h-3 w-16 rounded bg-gray-100 sm:h-4 sm:w-20" />
                <div className="mt-1 h-4 w-24 rounded bg-gray-200 sm:h-5 sm:w-32" />
              </div>
            ))}
          </div>
          <div className="mt-8 h-12 w-full rounded-xl bg-gray-200 sm:mt-10 sm:w-48" />
        </div>
      </div>
    </div>
  );
}
