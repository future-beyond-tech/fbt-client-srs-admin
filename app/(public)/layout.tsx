import type { Metadata } from "next";
import { PublicHeader } from "./PublicHeader";

export const metadata: Metadata = {
  title: {
    default: "Shree Raamalingam Sons — Trusted Cars & Bikes Dealer",
    template: "%s | Shree Raamalingam Sons",
  },
  description:
    "Quality checked pre-owned cars and bikes. Transparent billing, best market price. Trusted since years.",
};

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen min-h-[100dvh] bg-white text-gray-900">
      <PublicHeader />
      <main className="min-h-[50vh]">{children}</main>
      <footer className="mt-auto border-t border-gray-200 bg-gray-50">
        <div className="mx-auto max-w-6xl px-4 py-5 sm:px-6 sm:py-6">
          <p className="text-center text-xs text-gray-500 sm:text-sm">
            © {new Date().getFullYear()} Shree Raamalingam Sons. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
