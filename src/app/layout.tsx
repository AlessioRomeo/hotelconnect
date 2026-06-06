import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ServiceWorkerRegister } from "@/components/ServiceWorkerRegister";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  applicationName: "HotelConnect",
  title: "HotelConnect",
  description: "Coordinamento pulizie camere per reception e personale di pulizia.",
  // Make iOS treat the home-screen launch as a standalone app with the right
  // title and status-bar style (the manifest is auto-linked by Next).
  appleWebApp: {
    capable: true,
    title: "HotelConnect",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // suppressHydrationWarning: some phone browsers / extensions / in-app
    // webviews inject attributes onto <html>/<body> before React hydrates
    // (e.g. __gcrremoteframetoken), which is harmless but triggers a hydration
    // warning. This suppresses only these elements' own attribute mismatches —
    // not anything inside the app.
    <html
      lang="it"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        {children}
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
