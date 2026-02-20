import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function VehicleNotFound() {
  return (
    <div className="mx-auto max-w-md px-4 py-16 text-center">
      <h1 className="text-xl font-semibold text-gray-900">Vehicle not found</h1>
      <p className="mt-2 text-gray-500">
        This vehicle may no longer be available or the link is incorrect.
      </p>
      <Link
        href="/listings"
        className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-gray-900 hover:underline"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to vehicles
      </Link>
    </div>
  );
}
