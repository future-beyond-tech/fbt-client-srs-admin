// ✅ Made fully responsive (mobile → tablet → desktop) - Functionality untouched
import Link from "next/link";
import { MessageCircle, ShieldCheck, Sparkles } from "lucide-react";
import { VehicleCard } from "@/components/public/VehicleCard";
import { LandingHeroVisual } from "@/components/public/LandingHeroVisual";
import { getWhatsAppChatUrl, getWhatsAppUrlWithMessage } from "@/lib/utils/whatsapp";
import { getAvailableVehicles } from "@/services/publicVehicleService";

const FEATURED_COUNT = 6;

export const metadata = {
  title: "Shree Raamalingam Sons | Cars & Bikes",
  description: "Modern, transparent marketplace for quality pre-owned cars and bikes.",
};

export default async function PublicHomePage() {
  let vehicles: Awaited<ReturnType<typeof getAvailableVehicles>> = [];

  try {
    vehicles = await getAvailableVehicles();
  } catch {
    vehicles = [];
  }

  const featured = vehicles.slice(0, FEATURED_COUNT);
  const topVehicle = featured[0] ?? null;

  const whatsappUrl = getWhatsAppChatUrl();
  const whatsappEnquiryUrl = getWhatsAppUrlWithMessage(
    "Hi, I want details about available vehicles.",
  );

  return (
    <div className="landing-page">
      <section
        className="landing-hero relative overflow-hidden"
        aria-labelledby="landing-title"
      >
        <div className="landing-hero-backdrop" aria-hidden />

        <div className="srs-container relative py-10 sm:py-14 md:py-20">
          <div className="landing-hero-grid">
            <div className="space-y-5 md:space-y-7">
              <p className="landing-kicker">Shree Raamalingam Sons</p>

              <h1 id="landing-title" className="landing-title">
                Pre-Owned Cars & Bikes
              </h1>

              <p className="landing-subtitle">
                Inspected inventory. Transparent pricing. Fast response.
              </p>

              <div className="flex flex-col gap-3 xs:flex-row xs:flex-wrap">
                <Link href="/listings" className="landing-action landing-action-primary">
                  Browse Inventory
                </Link>
                <a
                  href={whatsappEnquiryUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="landing-action landing-action-secondary"
                >
                  <MessageCircle aria-hidden className="h-4 w-4" />
                  WhatsApp
                </a>
              </div>

              <div className="flex flex-wrap gap-2 text-xs sm:text-sm">
                <span className="landing-meta-pill">
                  <ShieldCheck aria-hidden className="h-3.5 w-3.5" />
                  Verified
                </span>
                <span className="landing-meta-pill">
                  <Sparkles aria-hidden className="h-3.5 w-3.5" />
                  {vehicles.length} In Stock
                </span>
              </div>
            </div>

            <LandingHeroVisual topVehicle={topVehicle} totalVehicles={vehicles.length} />
          </div>
        </div>
      </section>

      <section className="border-t border-slate-200/70 bg-white" aria-labelledby="featured-title">
        <div className="srs-container py-8 sm:py-10 md:py-14">
          <div className="flex items-end justify-between gap-3">
            <div>
              <h2 id="featured-title" className="landing-section-title">
                In Stock
              </h2>
              <p className="landing-section-subtitle">Updated daily</p>
            </div>
            {vehicles.length > FEATURED_COUNT && (
              <Link href="/listings" className="landing-inline-link">
                View all
              </Link>
            )}
          </div>

          {featured.length > 0 ? (
            <div className="mt-5 grid grid-cols-1 gap-4 sm:mt-6 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5">
              {featured.map((vehicle, idx) => (
                <VehicleCard
                  key={vehicle.id}
                  vehicle={vehicle}
                  priority={idx < 3}
                />
              ))}
            </div>
          ) : (
            <div className="landing-empty-state mt-5 sm:mt-6" role="status" aria-live="polite">
              Inventory is being refreshed.
            </div>
          )}
        </div>
      </section>

      <section className="border-t border-slate-200/70 bg-slate-950/95">
        <div className="srs-container py-7 sm:py-9">
          <div className="landing-contact-card">
            <p className="text-sm text-white/85 sm:text-base">Need a quick recommendation?</p>
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="landing-action landing-action-wa"
            >
              <MessageCircle aria-hidden className="h-4 w-4" />
              Chat on WhatsApp
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
