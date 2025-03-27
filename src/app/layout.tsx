import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import "./globals.css";

const montserrat = Montserrat({ 
  subsets: ["latin"],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: "Byblia - Assistente Bíblico",
  description: "Um assistente virtual para encontrar sabedoria nas Escrituras Sagradas",
  icons: [
    { rel: "icon", url: "/favicon.ico" },
    { rel: "icon", type: "image/png", url: "/biblia.png" },
    { rel: "icon", type: "image/svg+xml", url: "/biblia.svg" },
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
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/biblia.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/biblia.png" />
      </head>
      <body className={`${montserrat.className} bg-gray-50`}>
        {children}
      </body>
    </html>
  );
}
