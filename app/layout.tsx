import type { Metadata } from "next";
// import { Analytics } from "@vercel/analytics/next"
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
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
      {/* <Analytics /> */}
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
