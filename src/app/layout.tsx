import React from "react";
import type { Metadata } from "next";
import { Montserrat, Pacifico, Syne, Archivo } from "next/font/google";
import "./globals.css";

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

// Usando Syne como alternativa para Boldonse, já que Boldonse pode não estar disponível diretamente no next/font/google
const boldonse = Syne({
  weight: ['700', '800'],
  subsets: ["latin"],
  display: 'swap',
  variable: '--font-boldonse',
});

// Adicionando Archivo para o logotipo Byblia
const archivo = Archivo({
  subsets: ["latin"],
  weight: ['400', '500', '700'],
  display: 'swap',
  variable: '--font-archivo',
});

export const metadata: Metadata = {
  title: "Byblia - Conselheiro Bíblico",
  description: "Um conselheiro virtual para encontrar sabedoria nas Escrituras Sagradas",
  viewport: "width=device-width, initial-scale=1.0",
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
    <html lang="pt-BR">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link rel="icon" href="/biblia.png" sizes="any" />
        <link rel="apple-touch-icon" href="/biblia.png" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Boldonse:wght@400;700&display=swap" rel="stylesheet" />
      </head>
      <body className={`${montserrat.className} ${pacifico.variable} ${boldonse.variable} ${archivo.variable} bg-gray-50`}>
        {children}
      </body>
    </html>
  );
}
