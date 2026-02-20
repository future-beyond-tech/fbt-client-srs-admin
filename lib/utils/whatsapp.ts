/**
 * WhatsApp deep-link and message helpers for the public website.
 * Uses wa.me with pre-filled text (opens in WhatsApp app or web).
 */

const DEFAULT_WHATSAPP_PHONE = "9551406006";

/**
 * Get WhatsApp business number from env (e.g. 919876543210 with country code, no +).
 * Fallback: configured business number so enquiry links always target WhatsApp.
 */
function getWhatsAppNumber(): string {
  const envPhone = process.env.NEXT_PUBLIC_WHATSAPP_PHONE;
  if (typeof envPhone === "string") {
    const num = envPhone.replace(/\D/g, "");
    if (num.length > 0) {
      return num;
    }
  }
  return DEFAULT_WHATSAPP_PHONE;
}

/**
 * Build WhatsApp chat URL. If number is empty, returns wa.me (user can type number).
 */
export function getWhatsAppChatUrl(phone?: string): string {
  const number = phone || getWhatsAppNumber();
  if (number.length > 0) {
    return `https://wa.me/${number}`;
  }
  return "https://wa.me";
}

/**
 * Build WhatsApp URL with pre-filled message (abbr parameter).
 */
export function getWhatsAppUrlWithMessage(message: string, phone?: string): string {
  const base = getWhatsAppChatUrl(phone);
  const encoded = encodeURIComponent(message);
  const separator = base.includes("?") ? "&" : "?";
  return `${base}${separator}text=${encoded}`;
}

/**
 * Prefill for vehicle enquiry as per requirement.
 */
export function getVehicleEnquiryMessage(params: {
  brand: string;
  model: string;
  year: number;
  registrationNumber: string;
}): string {
  const { brand, model, year, registrationNumber } = params;
  return `Hello, I am interested in ${brand} ${model} ${year} - ${registrationNumber}. Please share details.`;
}
