// ✅ Made fully responsive (mobile → tablet → desktop) - Functionality untouched
import { Phone, MessageCircle } from "lucide-react";
import { getWhatsAppChatUrl } from "@/lib/utils/whatsapp";

export const metadata = {
  title: "Contact Us",
  description:
    "Get in touch with Shree Raamalingam Sons. WhatsApp or call for vehicle enquiries.",
};

function getPhoneTelUrl(): string | null {
  const raw = process.env.NEXT_PUBLIC_WHATSAPP_PHONE ?? process.env.NEXT_PUBLIC_CONTACT_PHONE;
  if (typeof raw !== "string" || !raw.trim()) return null;
  const digits = raw.replace(/\D/g, "");
  return digits.length > 0 ? `tel:${digits}` : null;
}

export default function ContactPage() {
  const whatsappUrl = getWhatsAppChatUrl();
  const telUrl = getPhoneTelUrl();

  return (
    <div className="srs-container mx-auto max-w-2xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
      <h1 className="text-xl font-bold text-gray-900 sm:text-2xl md:text-3xl">
        Contact Us
      </h1>
      <p className="mt-1.5 text-sm text-gray-600 sm:mt-2 sm:text-base">
        We are here to help. Reach out for any enquiry about our vehicles.
      </p>

      <div className="mt-6 space-y-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:mt-8 sm:space-y-5 sm:p-6 lg:p-6">
        <div>
          <h2 className="font-semibold text-gray-900">Shree Raamalingam Sons</h2>
          <p className="mt-1 text-sm text-gray-500">
            Trusted Cars & Bikes Dealer
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-[#25D366] px-6 py-3 font-semibold text-white hover:bg-[#20BD5A] sm:w-auto"
          >
            <MessageCircle className="h-5 w-5 shrink-0" />
            Chat on WhatsApp
          </a>
          {telUrl ? (
            <a
              href={telUrl}
              className="inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl border-2 border-gray-900 bg-white px-6 py-3 font-semibold text-gray-900 hover:bg-gray-50 sm:w-auto"
            >
              <Phone className="h-5 w-5 shrink-0" />
              Call
            </a>
          ) : null}
        </div>

        <p className="text-sm text-gray-500">
          For quick responses, we recommend WhatsApp. We value your trust and
          are committed to transparent, hassle-free dealings.
        </p>
      </div>
    </div>
  );
}
