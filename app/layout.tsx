import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ServiceWorkerRegistrar } from "@/components/ServiceWorkerRegistrar";
import { InstallPrompt } from "@/components/InstallPrompt";
import { GYMTWIN_SITE_URL, GYMTWIN_SUPPORT_URL } from "@/lib/appInfo";
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
  metadataBase: new URL(GYMTWIN_SITE_URL),
  applicationName: "GymTwin AI",
  title: "GymTwin AI",
  description: "AI-guided home workouts with 3D coaching, pose tracking, and adaptive training.",
  keywords: ["fitness", "home workout", "AI coach", "pose tracking", "GymTwin"],
  manifest: "/manifest.json",
  alternates: {
    canonical: "/",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "GymTwin",
  },
  openGraph: {
    title: "GymTwin AI",
    description: "AI-guided home workouts with 3D coaching, pose tracking, and adaptive training.",
    url: GYMTWIN_SITE_URL,
    siteName: "GymTwin AI",
    type: "website",
  },
  other: {
    "mobile-web-app-capable": "yes",
    "support-url": GYMTWIN_SUPPORT_URL,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <meta name="theme-color" content="#6366f1" />
        <link rel="apple-touch-icon" href="/icon-512.png" />
      </head>
      <body className="min-h-full flex flex-col">
        <ServiceWorkerRegistrar />
        <InstallPrompt />
        {children}
      </body>
    </html>
  );
}
