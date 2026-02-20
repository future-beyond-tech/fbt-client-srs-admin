"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, Phone, X } from "lucide-react";
import { getWhatsAppChatUrl } from "@/lib/utils/whatsapp";

const navLinks = [
  { href: "/listings", label: "Vehicles" },
  { href: "/contact", label: "Contact" },
];

export function PublicHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const whatsappUrl = getWhatsAppChatUrl();

  return (
    <header className="sticky top-0 z-50 border-b border-gray-200/80 bg-white/95 backdrop-blur transition-shadow duration-200 supports-[backdrop-filter]:bg-white/90">
      <div className="mx-auto flex h-14 min-h-[44px] max-w-6xl items-center justify-between gap-4 px-4 sm:h-16 sm:px-6">
        <Link
          href="/"
          className="min-h-[44px] shrink-0 py-2 text-base font-semibold tracking-tight text-gray-900 transition-colors duration-200 hover:text-gray-700 sm:text-lg"
        >
          Shree Ramalingam Sons
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-4 md:flex md:gap-6">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="min-h-[44px] py-2 text-sm font-medium text-gray-600 transition-colors duration-200 hover:text-gray-900"
            >
              {link.label}
            </Link>
          ))}
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-[#25D366] px-4 py-2 text-sm font-medium text-white transition-all duration-200 hover:bg-[#20BD5A]"
          >
            <Phone className="h-4 w-4" />
            WhatsApp
          </a>
          <Link
            href="/dashboard"
            className="min-h-[44px] py-2 text-sm font-medium text-gray-500 transition-colors duration-200 hover:text-gray-700"
          >
            Admin
          </Link>
        </nav>

        {/* Mobile: menu button */}
        <div className="flex items-center gap-2 md:hidden">
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg bg-[#25D366] text-white transition-colors duration-200 hover:bg-[#20BD5A]"
            aria-label="WhatsApp"
          >
            <Phone className="h-5 w-5" />
          </a>
          <button
            type="button"
            onClick={() => setMobileOpen((o) => !o)}
            className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-gray-600 transition-colors duration-200 hover:bg-gray-100 hover:text-gray-900"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      {mobileOpen && (
        <div className="border-t border-gray-100 bg-white px-4 py-4 md:hidden animate-slide-down">
          <nav className="flex flex-col gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="min-h-[44px] rounded-lg px-3 py-3 text-sm font-medium text-gray-700 transition-colors duration-200 hover:bg-gray-50"
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/dashboard"
              className="min-h-[44px] rounded-lg px-3 py-3 text-sm font-medium text-gray-500 transition-colors duration-200 hover:bg-gray-50"
              onClick={() => setMobileOpen(false)}
            >
              Admin
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
