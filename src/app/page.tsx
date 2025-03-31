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
        // Previne zoom apenas quando há múltiplos toques (pinch zoom)
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
          
          // Permite zoom controlado após um curto período
          setTimeout(() => {
            viewportMeta.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, shrink-to-fit=no');
          }, 500);
        }
        
        // Aplicar uma transformação direta para garantir que não haja zoom
        document.body.style.transform = 'scale(1)';
        document.body.style.transformOrigin = 'center top';
        
        // Reset completo de transformações que podem causar zoom
        setTimeout(() => {
          document.body.style.transform = 'none';
          document.documentElement.style.transform = 'none';
          // Forçar recálculo de layout para garantir que o zoom seja realmente resetado
          void document.body.offsetHeight;
        }, 50);
      };
      
      // Função para controlar zoom quando a visibilidade da página muda
      const handleVisibilityChange = () => {
        if (document.visibilityState === 'visible') {
          resetZoom();
        }
      };
      
      // Função para prevenir zoom quando o input é focado
      const preventInputZoom = () => {
        const viewportMeta = document.querySelector('meta[name="viewport"]');
        if (viewportMeta) {
          viewportMeta.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no');
        }
      };
      
      // Adicionar listeners para detectar quando inputs são focados
      const addInputListeners = () => {
        const inputs = document.querySelectorAll('input, textarea');
        inputs.forEach(input => {
          input.addEventListener('focus', preventInputZoom);
          input.addEventListener('blur', resetZoom);
        });
      };
      
      // Observar mudanças no DOM para adicionar listeners em novos inputs
      const observer = new MutationObserver(mutations => {
        for (const mutation of mutations) {
          if (mutation.addedNodes.length) {
            addInputListeners();
          }
        }
      });
      
      // Resetar zoom ao carregar
      resetZoom();
      
      // Adicionar listeners iniciais
      addInputListeners();
      
      // Configurar observer para detectar novos inputs
      observer.observe(document.body, { childList: true, subtree: true });
      
      // Também resetar quando a tab ficar visível novamente
      document.addEventListener('visibilitychange', handleVisibilityChange);
      
      // Prevenir zoom por pinça (pinch zoom)
      document.addEventListener('touchstart', preventZoom, { passive: false });
      
      // Adicionar mais um nivel de garantia para prevenir zoom no iOS
      const handleOrientationChange = () => {
        setTimeout(resetZoom, 300); // Atraso para permitir que a mudança de orientação seja concluída
      };
      
      // Resetar zoom quando a orientação da tela mudar
      window.addEventListener('orientationchange', handleOrientationChange);
      
      return () => {
        // Limpar todos os listeners
        document.removeEventListener('touchstart', preventZoom);
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        window.removeEventListener('orientationchange', handleOrientationChange);
        observer.disconnect();
        
        // Remover listeners de inputs existentes
        const inputs = document.querySelectorAll('input, textarea');
        inputs.forEach(input => {
          input.removeEventListener('focus', preventInputZoom);
          input.removeEventListener('blur', resetZoom);
        });
      };
    }
  }, [screen.isMobile]);

  return (
    <MainLayout>
      <section className="w-full max-w-4xl mx-auto flex flex-col p-2 md:px-6">
        <div className={`flex-grow flex flex-col ${
          screen.isMobile && !screen.isLandscape 
            ? 'min-h-[calc(100vh-90px)]' 
            : screen.isMobile 
              ? 'h-[calc(100vh-80px)]'
              : 'h-[calc(100vh-100px)]'
        }`}>
          <ChatContainer />
        </div>
      </section>
    </MainLayout>
  );
}
