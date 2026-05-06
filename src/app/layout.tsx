import type { Metadata } from "next";
import "./globals.css";
import { DM_Mono, Syne } from "next/font/google";

const dmMono = DM_Mono({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-mono" });
const syne = Syne({ subsets: ["latin"], weight: ["500", "600", "700"], variable: "--font-display" });

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"
  ),
  title: {
    default: "Tether — Buy a Business Without Guessing",
    template: "%s | Tether",
  },
  description:
    "Tether is the acquisition system that helps buyers know the numbers, structure the deal, and close with confidence. Built by an operator who has closed $60M+ in acquisitions.",
  openGraph: {
    type: "website",
    siteName: "Tether",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${dmMono.variable} ${syne.variable}`}>
      <body>{children}</body>
    </html>
  );
}
