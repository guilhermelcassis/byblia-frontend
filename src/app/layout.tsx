import React from "react";
import type { Metadata } from "next";
import { Montserrat, Pacifico, Syne, Archivo } from "next/font/google";
import { ThemeProvider } from "next-themes";
import "./globals.css";
import "./mobile-optimization.css";
import "./chat-styles.css";
import "./fixes/header-fix.css";
import "./fixes/chat-padding-fix.css";
import "./fixes/chat-bubble-fix.css";

const montserrat = Montserrat({ 
  subsets: ["latin"],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
});

const pacifico = Pacifico({
  weight: '400',
  subsets: ["latin"],
  display: 'swap',
  variable: '--font-pacifico',
});

// Using Syne as an alternative for Boldonse, since Boldonse may not be directly available in next/font/google
const boldonse = Syne({
  weight: ['700', '800'],
  subsets: ["latin"],
  display: 'swap',
  variable: '--font-boldonse',
});

// Adding Archivo for the Byblia logo
const archivo = Archivo({
  subsets: ["latin"],
  weight: ['400', '500', '700'],
  display: 'swap',
  variable: '--font-archivo',
});

export const metadata: Metadata = {
  title: "Byblia - Conselheiro Bíblico",
  description: "Um conselheiro virtual para encontrar sabedoria nas Escrituras Sagradas",
  viewport: "width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0, shrink-to-fit=no",
  icons: [
    { rel: "icon", url: "/icons/icon-192x192.png" },
    { rel: "icon", type: "image/png", url: "/icons/icon-192x192.png" },
    { rel: "apple-touch-icon", url: "/icons/icon-192x192.png" },
    { rel: "shortcut icon", url: "/icons/icon-192x192.png" }
  ],
  // PWA metadata
  manifest: "/manifest.json",
  themeColor: "#ffffff",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Byblia"
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0, shrink-to-fit=no" />
        <link rel="icon" href="/icons/icon-192x192.png" sizes="any" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" sizes="180x180" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Boldonse:wght@400;700&display=swap" rel="stylesheet" />
        {/* PWA meta tags */}
        <meta name="application-name" content="Byblia" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Byblia" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <link rel="manifest" href="/manifest.json" />
        {/* Register service worker */}
        <script src="/pwa.js" defer />
      </head>
      <body className={`${montserrat.className} ${pacifico.variable} ${boldonse.variable} ${archivo.variable} antialiased m-0 p-0 overflow-hidden`}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
