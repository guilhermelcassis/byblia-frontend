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
  icons: {
    icon: "/biblia.png ",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={`${montserrat.className} bg-gray-50`}>
        {children}
      </body>
    </html>
  );
}
