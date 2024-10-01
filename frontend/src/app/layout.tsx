import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

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
  title: "Un-Tab: Keep Focus & Stop Distractions",
  description:
    "Un-Tab is a powerful tab blocker that helps you stay focused and productive by blocking distracting websites. Enhance your workflow and maintain concentration effortlessly.", // Updated description
  openGraph: {
    title: "Un-Tab: Keep Focus & Stop Distractions",
    description:
      "Stay productive and eliminate distractions with Un-Tab, your reliable tab blocker for a focused work environment.",
    url: "https://untab.xyz",
    type: "website",
    images: [
      {
        url: "https://untab.xyz/og-image",
        width: 1200,
        height: 630,
        alt: "Un-Tab Application Screenshot",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Un-Tab: Keep Focus & Stop Distractions",
    description:
      "Boost your productivity by blocking distracting websites with Un-Tab. Stay focused and achieve your goals efficiently.",
    images: ["https://untab.xyz/og-image"],
    creator: "@chongdashu",
  },
  robots: {
    index: true,
    follow: true,
    nocache: false,
    noimageindex: false,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
