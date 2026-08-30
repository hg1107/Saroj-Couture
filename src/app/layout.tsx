import type { Metadata } from "next";
import { Karla, Libre_Caslon_Text } from "next/font/google";
import "./globals.css";

// ─── Brand fonts (Atelier Heritage design spec) ───────────────────────────
const karla = Karla({
  variable: "--font-karla",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
});

const libreCaslon = Libre_Caslon_Text({
  variable: "--font-caslon",
  subsets: ["latin"],
  weight: ["400", "700"],
  display: "swap",
});

// ─── Default metadata (overridden per-page with generateMetadata) ─────────
export const metadata: Metadata = {
  title: {
    default: "Saroj Couture — Designer Dresses & Custom Stitching, Nagpur",
    template: "%s | Saroj Couture",
  },
  description:
    "Saroj Couture — bespoke women's designer wear and custom stitching in Teka Naka, Kamptee Road, Nagpur. Sarees, ghagra choli, kurtis, gowns and more.",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"
  ),
  openGraph: {
    siteName: "Saroj Couture",
    locale: "en_IN",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${karla.variable} ${libreCaslon.variable} h-full`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
