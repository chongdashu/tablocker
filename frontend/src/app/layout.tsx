import { Footer } from "@/components/Footer";
import type { Metadata } from "next";
import localFont from "next/font/local";
import Script from "next/script";
import "./globals.css";
import { CSPostHogProvider } from "./providers";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "Un-Tab: Focus Booster & Distraction Blocker for Chrome",
  description:
    "Un-Tab is a powerful Chrome extension that blocks distracting websites, boosts productivity, and helps you maintain focus. Ideal for students, professionals, and anyone looking to improve their digital habits.",
  keywords:
    "productivity, focus, distraction blocker, website blocker, Chrome extension, time management, digital wellbeing",
  openGraph: {
    title: "Un-Tab: Focus Booster & Distraction Blocker for Chrome",
    description:
      "Boost productivity and eliminate distractions with Un-Tab, your reliable Chrome extension for a focused work environment.",
    url: "https://untab.xyz",
    type: "website",
    images: [
      {
        url: "https://untab.xyz/og-image.png",
        width: 1200,
        height: 630,
        alt: "Un-Tab Chrome Extension Screenshot",
      },
    ],
    siteName: "Un-Tab",
  },
  twitter: {
    card: "summary_large_image",
    title: "Un-Tab: Focus Booster & Distraction Blocker for Chrome",
    description:
      "Maximize productivity by blocking distracting websites with Un-Tab. Stay focused and achieve your goals efficiently.",
    images: ["https://untab.xyz/og-image.png"], // maybe change this to twitter card next time
    creator: "@chongdashu",
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
  alternates: {
    canonical: "https://untab.xyz",
  },
  icons: [
    { rel: "icon", url: "/favicon.ico" },
    { rel: "apple-touch-icon", url: "/apple-touch-icon.png" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <Script
          id="structured-data"
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "SoftwareApplication",
              name: "Un-Tab",
              applicationCategory: "BrowserApplication",
              operatingSystem: "Chrome",
              offers: [
                {
                  "@type": "Offer",
                  price: "0",
                  priceCurrency: "USD",
                  description: "Standard version",
                },
                {
                  "@type": "Offer",
                  price: "7.99",
                  priceCurrency: "USD",
                  description: "Pro version (50% off)",
                },
              ],
              description:
                "Un-Tab is a Chrome extension that helps users block distracting websites and boost productivity.",
              aggregateRating: {
                "@type": "AggregateRating",
                ratingValue: "4.8",
                ratingCount: "100",
              },
            }),
          }}
        />
      </head>
      <CSPostHogProvider>
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        >
          {children}
          <Footer />
        </body>
      </CSPostHogProvider>
    </html>
  );
}
