import type { Metadata } from "next";
import { Karla, Libre_Caslon_Text } from "next/font/google";
import { BUSINESS } from "@/lib/utils/constants";
import OrganizationJsonLd from "@/components/seo/OrganizationJsonLd";
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
    default: "Saroj Couture — Designer Boutique in Nagpur | Teka Naka, Kamptee Road",
    template: "%s | Saroj Couture",
  },
  description:
    "Saroj Couture — bespoke women's designer wear and custom stitching in Teka Naka, Kamptee Road, Nagpur. Sarees, ghagra choli, kurtis, gowns and more.",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"
  ),
  applicationName: BUSINESS.name,
  // Overrides Next.js's default `<meta name="generator" content="Next.js ...">` tag.
  generator: BUSINESS.name,
  openGraph: {
    siteName: "Saroj Couture",
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${karla.variable} ${libreCaslon.variable} h-full`}
    >
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full flex flex-col">
        <OrganizationJsonLd />
        {children}
      </body>
    </html>
  );
}
