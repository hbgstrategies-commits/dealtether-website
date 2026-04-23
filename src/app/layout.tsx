import type { Metadata } from "next";
import "./globals.css";

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
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
