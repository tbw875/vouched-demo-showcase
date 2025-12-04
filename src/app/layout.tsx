import type { Metadata } from "next";
import Script from "next/script";
import { Analytics } from "@vercel/analytics/next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import SessionProvider from "./components/SessionProvider";
import AuthHeader from "./components/AuthHeader";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Vouched Identity Verification Showcase",
  description: "Interactive demo showcasing Vouched's powerful identity verification solutions",
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
        <SessionProvider>
          <AuthHeader />
          {children}
        </SessionProvider>
        <Analytics />
        {process.env.NEXT_PUBLIC_KYA_PROJECT_ID && (
          <Script
            src="https://kya.vouched.id/pixel.js"
            data-project-id={process.env.NEXT_PUBLIC_KYA_PROJECT_ID}
            strategy="afterInteractive"
          />
        )}
      </body>
    </html>
  );
}
