import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Pati Buldum — Her pati evinin yolunu bulsun",
  description: "Kayıp ve bulunan evcil hayvanları yuvalarıyla buluşturan güvenli topluluk.",
  manifest: "/manifest.json",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "Pati Buldum" },
  icons: { icon: "/icon-192.png", apple: "/icon-192.png" },
  openGraph: { title: "Pati Buldum", description: "Her pati evinin yolunu bulsun.", type: "website" },
};

export const viewport: Viewport = { themeColor: "#173f35", width: "device-width", initialScale: 1, maximumScale: 1, userScalable: false };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="tr"><body>{children}</body></html>;
}
