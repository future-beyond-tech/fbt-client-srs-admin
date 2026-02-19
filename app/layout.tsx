import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import { AppProviders } from "@/components/providers/app-providers";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "SRS Vehicle Management System",
  description: "Admin panel for SRS Vehicle Management System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={poppins.className}>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
