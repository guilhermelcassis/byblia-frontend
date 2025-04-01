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
    <html lang="pt-BR">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0, shrink-to-fit=no" />
        <link rel="icon" href="/biblia.png" sizes="any" />
        <link rel="apple-touch-icon" href="/biblia.png" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Boldonse:wght@400;700&display=swap" rel="stylesheet" />
        <style>{`
          html {
            touch-action: manipulation;
            overflow-x: hidden;
            text-size-adjust: 100%; /* Previne texto crescer automaticamente */
            -webkit-text-size-adjust: 100%;
            -webkit-tap-highlight-color: transparent;
            zoom: 1.0;
            -webkit-zoom: 1.0;
            -moz-transform: scale(1.0);
            -moz-transform-origin: 0 0;
          }
          
          body {
            overscroll-behavior-y: contain; /* Previne scroll excessivo */
            touch-action: manipulation;
            -webkit-overflow-scrolling: touch;
            max-height: 100vh;
          }
          
          input, textarea, select, button {
            font-size: 16px !important; /* Tamanho mínimo para prevenir zoom em todos os dispositivos */
            -webkit-appearance: none;
            appearance: none;
            border-radius: 0;
            max-height: 100%;
          }
          
          /* Previne o zoom mesmo quando clicar em campos de entrada */
          input[type="text"], 
          input[type="email"], 
          input[type="password"], 
          input[type="number"], 
          input[type="search"], 
          input[type="tel"], 
          input[type="url"], 
          textarea {
            font-size: 16px !important;
            transform: scale(1);
            transform-origin: left top;
          }
          
          @media (max-width: 768px) {
            /* Melhorar a visualização de respostas */
            .prose, .prose p, .prose div, .message-text-content {
              font-size: 16px !important;
              line-height: 1.5 !important;
            }
            
            /* Previne comportamentos de zoom específicos do Safari em iOS */
            body * {
              -webkit-tap-highlight-color: transparent;
            }
            
            /* Controle melhor do scroll */
            #chat-messages {
              -webkit-overflow-scrolling: touch;
              scroll-behavior: auto;
              overscroll-behavior-y: contain;
              overflow-x: hidden;
              overflow-y: auto;
            }
          }
        `}</style>
      </head>
      <body className={`${montserrat.className} ${pacifico.variable} ${boldonse.variable} ${archivo.variable} bg-gray-50`}>
        {children}
      </body>
    </html>
  );
}
