// ✅ Made fully responsive (mobile → tablet → desktop) - Functionality untouched
"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, MessageCircle, X } from "lucide-react";
import { getWhatsAppChatUrl } from "@/lib/utils/whatsapp";

const navLinks = [
  { href: "/listings", label: "Inventory" },
  { href: "/contact", label: "Contact" },
];

export function PublicHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const whatsappUrl = getWhatsAppChatUrl();

  return (
    <header className="sticky top-0 z-50 border-b border-white/70 bg-white/75 backdrop-blur-xl supports-[backdrop-filter]:bg-white/65">
      <div className="srs-container flex h-14 items-center justify-between gap-3 sm:h-16">
        <Link
          href="/"
          className="landing-brand-link"
          onClick={() => setMobileOpen(false)}
        >
          Shree Raamalingam Sons
        </Link>

        <nav className="hidden items-center gap-1 md:flex" aria-label="Primary">
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href} className="landing-nav-link">
              {link.label}
            </Link>
          ))}

          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="landing-nav-wa"
          >
            <MessageCircle aria-hidden className="h-4 w-4" />
            WhatsApp
          </a>

          <Link href="/dashboard" className="landing-nav-link text-slate-500">
            Admin
          </Link>
        </nav>

        <div className="flex items-center gap-2 md:hidden">
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="landing-icon-button bg-emerald-500 text-white hover:bg-emerald-600"
            aria-label="Open WhatsApp chat"
          >
            <MessageCircle aria-hidden className="h-4 w-4" />
          </a>

          <button
            type="button"
            onClick={() => setMobileOpen((open) => !open)}
            className="landing-icon-button text-slate-700 hover:bg-slate-100"
            aria-expanded={mobileOpen}
            aria-controls="mobile-menu"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
          >
            {mobileOpen ? (
              <X aria-hidden className="h-5 w-5" />
            ) : (
              <Menu aria-hidden className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>

      <div
        id="mobile-menu"
        className={`border-t border-slate-200/70 bg-white/95 px-4 py-3 transition-all duration-200 ${
          mobileOpen ? "block animate-slide-down" : "hidden"
        } md:hidden`}
      >
        <nav className="flex flex-col gap-1" aria-label="Mobile">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="landing-mobile-link"
              onClick={() => setMobileOpen(false)}
            >
              {link.label}
            </Link>
          ))}

          <Link
            href="/dashboard"
            className="landing-mobile-link text-slate-500"
            onClick={() => setMobileOpen(false)}
          >
            Admin
          </Link>
        </nav>
      </div>
    </header>
  );
}
