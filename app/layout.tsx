import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import Script from "next/script";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";
import { Providers } from "./providers";

const geistSans = Geist({
  variable: "--font-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ProdSim — Intern to CPO",
  description:
    "Take 100 PM decisions before your next real one. AI-graded career sim. 8 levels. Intern to CPO.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#0a0a0a",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const datafastId = process.env.NEXT_PUBLIC_DATAFAST_WEBSITE_ID;
  return (
    <ClerkProvider>
      <html
        lang="en"
        className={`${geistSans.variable} h-full antialiased`}
        suppressHydrationWarning
      >
        <body className="min-h-full flex flex-col bg-background text-foreground">
          <Providers>{children}</Providers>
          {datafastId ? (
            <Script
              src="https://datafa.st/js/script.js"
              data-website-id={datafastId}
              data-domain="prodsim-swart.vercel.app"
              strategy="afterInteractive"
            />
          ) : null}
        </body>
      </html>
    </ClerkProvider>
  );
}
