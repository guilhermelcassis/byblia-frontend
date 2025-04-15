import React from "react";
import type { Metadata } from "next";
import { Montserrat, Pacifico, Syne, Archivo } from "next/font/google";
import { ThemeProvider } from "next-themes";
import "./globals.css";
import "./mobile-optimization.css";

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
    { rel: "icon", url: "/biblia.png" },
    { rel: "icon", type: "image/png", url: "/biblia.png" },
    { rel: "apple-touch-icon", url: "/biblia.png" },
    { rel: "shortcut icon", url: "/biblia.png" }
  ],
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
        <link rel="icon" href="/biblia.png" sizes="any" />
        <link rel="apple-touch-icon" href="/biblia.png" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Boldonse:wght@400;700&display=swap" rel="stylesheet" />
      </head>
      <body className={`${montserrat.className} ${pacifico.variable} ${boldonse.variable} ${archivo.variable} antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
