import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Phone } from "lucide-react";
import { getAvailableVehicleById } from "@/services/publicVehicleService";
import { formatCurrencyINR } from "@/lib/formatters";
import {
  getWhatsAppUrlWithMessage,
  getVehicleEnquiryMessage,
} from "@/lib/utils/whatsapp";
import { VehicleImage } from "@/components/public/VehicleImage";

interface VehiclePageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: VehiclePageProps) {
  const { id } = await params;
  const vehicle = await getAvailableVehicleById(id);
  if (!vehicle) {
    return { title: "Vehicle Not Found" };
  }
  const title = `${vehicle.brand} ${vehicle.model} (${vehicle.year})`;
  return {
    title: title,
    description: `View details and price for ${title}. Registration: ${vehicle.registrationNumber}.`,
  };
}

export default async function VehicleDetailPage({ params }: VehiclePageProps) {
  const { id } = await params;
  const vehicle = await getAvailableVehicleById(id);

  if (!vehicle) {
    notFound();
  }

  const enquiryMessage = getVehicleEnquiryMessage({
    brand: vehicle.brand,
    model: vehicle.model,
    year: vehicle.year,
    registrationNumber: vehicle.registrationNumber,
  });
  const whatsappUrl = getWhatsAppUrlWithMessage(enquiryMessage);

  const title = `${vehicle.brand} ${vehicle.model}`;
  const details = [
    { label: "Brand", value: vehicle.brand },
    { label: "Model", value: vehicle.model },
    { label: "Year", value: vehicle.year },
    { label: "Registration", value: vehicle.registrationNumber },
    ...(vehicle.chassisNumber
      ? [{ label: "Chassis", value: vehicle.chassisNumber }]
      : []),
    ...(vehicle.engineNumber
      ? [{ label: "Engine", value: vehicle.engineNumber }]
      : []),
    ...(vehicle.colour
      ? [{ label: "Colour", value: vehicle.colour }]
      : []),
  ] as Array<{ label: string; value: string | number }>;

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-8">
      <Link
        href="/listings"
        className="inline-flex min-h-[44px] items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to vehicles
      </Link>

      <div className="mt-6 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm sm:mt-8">
        <VehicleImage
          src={vehicle.imageUrl}
          alt={title}
          variant="detail"
          priority
        />
        <div className="p-4 sm:p-6 lg:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <h1 className="text-xl font-bold text-gray-900 sm:text-2xl lg:text-3xl">
                {title}
              </h1>
              <p className="mt-1 text-sm text-gray-500 sm:text-base">
                {vehicle.year} · {vehicle.registrationNumber}
              </p>
            </div>
            <span className="shrink-0 rounded-full bg-emerald-100 px-3 py-1 text-sm font-medium text-emerald-800">
              Available
            </span>
          </div>

          <p className="mt-5 text-2xl font-bold text-gray-900 sm:mt-6 sm:text-3xl lg:text-4xl">
            {formatCurrencyINR(vehicle.sellingPrice)}
          </p>

          <dl className="mt-6 grid gap-4 sm:mt-8 sm:grid-cols-2 sm:gap-5">
            {details.map(({ label, value }) => (
              <div key={label}>
                <dt className="text-xs font-medium text-gray-500 sm:text-sm">
                  {label}
                </dt>
                <dd className="mt-0.5 text-sm font-medium text-gray-900 sm:mt-1 sm:text-base">
                  {value}
                </dd>
              </div>
            ))}
          </dl>

          <div className="mt-8 border-t border-gray-100 pt-6 sm:mt-10 sm:pt-8">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-[#25D366] px-6 py-3 text-base font-semibold text-white hover:bg-[#20BD5A] sm:w-auto"
            >
              <Phone className="h-5 w-5 shrink-0" />
              Enquire on WhatsApp
            </a>
            <p className="mt-2 text-xs text-gray-500">
              Message will be pre-filled with vehicle details.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
