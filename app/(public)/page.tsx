import Link from "next/link";
import { Car, CheckCircle2, Phone } from "lucide-react";
import { getAvailableVehicles } from "@/services/publicVehicleService";
import { getWhatsAppChatUrl, getWhatsAppUrlWithMessage } from "@/lib/utils/whatsapp";
import { VehicleCard } from "@/components/public/VehicleCard";
import { HeroVehicleAnimation } from "@/components/public/HeroVehicleAnimation";

const FEATURED_COUNT = 6;

const WHY_US = [
  { title: "Quality Checked Vehicles", desc: "Every vehicle is thoroughly inspected." },
  { title: "Transparent Billing", desc: "No hidden charges or last-minute fees." },
  { title: "Best Market Price", desc: "Competitive and fair pricing." },
  { title: "Trusted Since Years", desc: "A name you can rely on." },
];

export const metadata = {
  title: "Shree Raamalingam Sons — Trusted Cars & Bikes Dealer",
  description:
    "Quality checked pre-owned cars and bikes. Transparent billing, best market price. Trusted since years.",
};

export default async function PublicHomePage() {
  let vehicles: Awaited<ReturnType<typeof getAvailableVehicles>> = [];
  try {
    vehicles = await getAvailableVehicles();
  } catch {
    vehicles = [];
  }
  const featured = vehicles.slice(0, FEATURED_COUNT);
  const whatsappUrl = getWhatsAppChatUrl();
  const whatsappEnquiryUrl = getWhatsAppUrlWithMessage(
    "Hello, I would like to know more about your vehicles.",
  );

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-50 via-white to-amber-50/30 px-4 py-12 sm:py-16 md:py-24">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 xs:text-3xl sm:text-4xl md:text-5xl">
            Shree Raamalingam Sons
          </h1>
          <p className="mt-2 text-base text-gray-600 sm:mt-3 sm:text-lg md:text-xl">
            Trusted Cars & Bikes Dealer
          </p>
          <p className="mt-2 text-sm text-gray-500 sm:text-base">
            Quality pre-owned cars and two-wheelers at fair prices
          </p>
          <HeroVehicleAnimation />
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3 sm:mt-8 sm:gap-4">
            <Link
              href="/listings"
              className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl bg-gray-900 px-5 py-3 text-sm font-semibold text-white shadow-lg hover:bg-gray-800 sm:min-h-[48px] sm:px-6 sm:text-base"
            >
              Browse Vehicles
            </Link>
            <a
              href={whatsappEnquiryUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center gap-2 rounded-xl border-2 border-gray-900 bg-white px-5 py-3 text-sm font-semibold text-gray-900 hover:bg-gray-50 sm:min-h-[48px] sm:px-6 sm:text-base"
            >
              <Phone className="h-5 w-5 shrink-0" />
              Contact on WhatsApp
            </a>
          </div>
        </div>
      </section>

      {/* What we do — help viewers understand the business */}
      <section className="border-t border-gray-100 bg-white px-4 py-6 sm:py-8">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-medium text-gray-600 sm:text-base">
            We buy and sell quality used <strong className="text-gray-800">cars</strong> and{" "}
            <strong className="text-gray-800">bikes</strong>. Every vehicle is checked for quality and offered at a fair price.
          </p>
        </div>
      </section>

      {/* Featured Vehicles */}
      <section className="border-t border-gray-100 bg-white px-4 py-10 sm:py-14 md:py-16">
        <div className="mx-auto max-w-6xl">
          <div className="flex items-center gap-2 text-gray-900">
            <Car className="h-5 w-5 shrink-0 animate-float-soft sm:h-6 sm:w-6" />
            <h2 className="text-xl font-bold sm:text-2xl">Featured Vehicles</h2>
          </div>
          <p className="mt-1.5 text-sm text-gray-600 sm:mt-2 sm:text-base">
            Hand-picked cars and bikes currently available. Click to see details and price.
          </p>
          {featured.length > 0 ? (
            <div className="mt-6 grid gap-4 xs:gap-5 sm:mt-8 sm:grid-cols-2 lg:grid-cols-3">
              {featured.map((v, i) => (
                <VehicleCard
                  key={v.id}
                  vehicle={v}
                  priority={i < 3}
                />
              ))}
            </div>
          ) : (
            <div className="mt-6 rounded-2xl border border-dashed border-gray-200 bg-gray-50/50 p-8 text-center sm:mt-8 sm:p-10">
              <p className="text-sm text-gray-500 sm:text-base">
                No vehicles available at the moment.
              </p>
              <Link
                href="/contact"
                className="mt-3 inline-block min-h-[44px] leading-[44px] text-sm font-medium text-gray-900 hover:underline"
              >
                Contact us for enquiries
              </Link>
            </div>
          )}
          {vehicles.length > FEATURED_COUNT && (
            <div className="mt-6 text-center sm:mt-8">
              <Link
                href="/listings"
                className="inline-flex min-h-[44px] items-center text-sm font-semibold text-gray-900 hover:underline"
              >
                View all vehicles →
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="border-t border-gray-100 bg-gradient-to-b from-gray-50 to-white px-4 py-10 sm:py-14">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-xl font-bold text-gray-900 sm:text-2xl">
            Why Choose Us
          </h2>
          <p className="mt-1.5 text-sm text-gray-600 sm:mt-2 sm:text-base">
            We are committed to transparency and quality.
          </p>
          <div className="mt-6 grid gap-4 sm:mt-8 sm:grid-cols-2 sm:gap-5 lg:grid-cols-4 lg:gap-6">
            {WHY_US.map((item) => (
              <div
                key={item.title}
                className="flex flex-col rounded-xl border border-gray-100 bg-white p-4 shadow-sm sm:p-5"
              >
                <CheckCircle2 className="h-7 w-7 text-emerald-600 sm:h-8 sm:w-8" />
                <h3 className="mt-2.5 font-semibold text-gray-900 sm:mt-3">
                  {item.title}
                </h3>
                <p className="mt-1 text-xs text-gray-500 sm:text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact strip */}
      <section className="border-t border-gray-100 bg-gray-900 px-4 py-8 text-white sm:py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 sm:flex-row">
          <p className="text-center text-xs sm:text-left sm:text-sm">
            Have a question? Reach out on WhatsApp for a quick response.
          </p>
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-lg bg-[#25D366] px-5 py-2.5 font-semibold text-white hover:bg-[#20BD5A] sm:w-auto"
          >
            <Phone className="h-5 w-5 shrink-0" />
            Contact on WhatsApp
          </a>
        </div>
      </section>
    </>
  );
}
