import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ORS Kahvaltı Ligi — World Cup Edition",
  description:
    "Tahmin yap, puan kazan, simit hattından uzak dur. ORS ofis tahmin ligi.",
  openGraph: {
    title: "ORS Kahvaltı Ligi — World Cup Edition",
    description: "Tahmin yap, puan kazan, simit hattından uzak dur.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#0A0A0F",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="tr" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Inter:wght@300;400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen overflow-x-hidden font-sans">
        {children}
      </body>
    </html>
  );
}
