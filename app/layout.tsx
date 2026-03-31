import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import { Space_Grotesk, Outfit, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";
import { ClientProviders } from "./client-providers";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-display-family",
  subsets: ["latin"],
  weight: ["500", "700"],
});

const outfit = Outfit({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["300", "400", "500"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "CostWise - Cost of Living Intelligence",
    template: "%s | CostWise",
  },
  description:
    "Compare cost of living across the United States with real-time data from official government sources. Explore housing costs, regional price parities, and make informed decisions about where to live.",
  keywords: [
    "cost of living",
    "regional price parity",
    "housing costs",
    "rent prices",
    "cost comparison",
    "BEA data",
    "state comparison",
    "affordable states",
    "expensive cities",
    "relocation",
  ],
  authors: [{ name: "CostWise" }],
  creator: "CostWise",
  publisher: "CostWise",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    siteName: "CostWise",
    title: "CostWise - Cost of Living Intelligence",
    description:
      "Compare cost of living across the United States with official government data.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "CostWise - Cost of Living Intelligence",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "CostWise - Cost of Living Intelligence",
    description:
      "Compare cost of living across the United States with official government data.",
    images: ["/og-image.png"],
    creator: "@costwise",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: "verification_token",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <Analytics />
      <body
        className={`${spaceGrotesk.variable} ${outfit.variable} ${geistMono.variable} antialiased`}
        style={{ fontFamily: "var(--font-body)" }}
      >
        <ClientProviders>
          <Navbar />
          <main className="relative z-[1]">{children}</main>
          <Footer />
        </ClientProviders>
      </body>
    </html>
  );
}
