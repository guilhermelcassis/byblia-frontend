"use client";

import React, { useEffect } from 'react';
import ChatContainer from '@/components/ChatContainer';
import { ScreenProvider, useScreen } from '@/hooks/useScreen';
import MainLayout from '@/components/layout/MainLayout';
import { useMouseEffect } from '@/hooks/useMouseEffect';

export default function Home() {
  return (
    <ScreenProvider>
      <HomeContent />
    </ScreenProvider>
  );
}

function HomeContent() {
  const screen = useScreen();
  
  // Integrar o efeito de mouse para melhorar a experiência em desktop
  useMouseEffect();

  // Controle de zoom e visualização para melhorar a experiência em dispositivos móveis
  useEffect(() => {
    if (screen.isMobile) {
      // Função para garantir que não haja zoom automático
      const preventZoom = (e: TouchEvent) => {
        if (e.touches.length > 1) {
          e.preventDefault();
        }
      };
      
      // Função para resetar o zoom ao carregar a página
      const resetZoom = () => {
        // Faz um reset no zoom da página para garantir visibilidade completa
        const viewportMeta = document.querySelector('meta[name="viewport"]');
        if (viewportMeta) {
          viewportMeta.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0');
          
          // Permite zoom após um curto período
          setTimeout(() => {
            viewportMeta.setAttribute('content', 'width=device-width, initial-scale=1.0, shrink-to-fit=no');
          }, 500);
        }
      };
      
      // Resetar zoom ao carregar
      resetZoom();
      
      // Captura eventos de toque para controlar o zoom
      document.addEventListener('touchstart', preventZoom, { passive: false });
      
      return () => {
        document.removeEventListener('touchstart', preventZoom);
      };
    }
  }, [screen.isMobile]);

  return (
    <MainLayout>
      <section className="w-full max-w-4xl p-2 md:px-6 mx-auto flex flex-col">
        <div className={`flex-grow flex flex-col rounded-2xl ${screen.isMobile && !screen.isLandscape ? 'min-h-[calc(100vh-90px)]' : 'h-[calc(100vh-80px)]'}`}>
          <ChatContainer />
        </div>
      </section>
    </MainLayout>
  );
}
