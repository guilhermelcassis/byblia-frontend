import { useCallback, useEffect, useRef, useState } from 'react';
import { useScreen } from '@/hooks/useScreen';

interface UseScrollOptions {
  /**
   * Whether content is currently streaming
   */
  isStreaming: boolean;
  /**
   * Total number of messages
   */
  messagesCount: number;
  /**
   * Whether there's pending content that should trigger a scroll
   */
  hasNewContent?: boolean;
  /**
   * Current response text (usado para detectar mudanças no conteúdo)
   */
  currentResponseText?: string;
}

/**
 * Hook que garante auto-scroll durante streaming, mas respeita scroll manual do usuário
 */
export function useScroll({ 
  isStreaming, 
  messagesCount, 
  hasNewContent = false,
  currentResponseText = ''
}: UseScrollOptions) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [userHasScrolled, setUserHasScrolled] = useState(false);
  const lastContentLengthRef = useRef<number>(0);
  const lastScrollPositionRef = useRef<number>(0);
  const screen = useScreen();
  const scrollDetectionThresholdRef = useRef(20);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const mutationObserverRef = useRef<MutationObserver | null>(null);
  const streamingIdRef = useRef<number | null>(null);
  
  // Quando o status de streaming muda, atualizar o ID de streaming
  useEffect(() => {
    if (isStreaming && streamingIdRef.current === null) {
      // Novo streaming iniciou - criar um novo ID
      streamingIdRef.current = Date.now();
    } else if (!isStreaming) {
      // Streaming terminou - resetar o ID e a flag de scroll
      streamingIdRef.current = null;
      setUserHasScrolled(false);
    }
  }, [isStreaming]);
  
  // Função para rolar para o final do container
  const scrollToBottom = useCallback(() => {
    if (!containerRef.current || userHasScrolled) return;

    const container = containerRef.current;
    
    // Usar scrollTop direto para rolar sem comportamento suave durante streaming
    container.scrollTop = container.scrollHeight + 5000;
    
    // Para garantir que toda a página também role junto
    window.scrollTo(0, document.body.scrollHeight);
  }, [userHasScrolled]);
  
  // Detecção de scroll manual pelo usuário - mais sensível
  const handleScroll = useCallback(() => {
    if (!containerRef.current || !isStreaming) return;
    
    const container = containerRef.current;
    const currentScrollTop = container.scrollTop;
    
    // Detectar qualquer movimento para cima
    if (lastScrollPositionRef.current > currentScrollTop) {
      console.log('Scroll manual para cima detectado - pausando auto-scroll permanentemente');
      setUserHasScrolled(true);
    }
    
    // Atualizar posição de scroll anterior
    lastScrollPositionRef.current = currentScrollTop;
  }, [isStreaming]);
  
  // Configurar observer para monitorar mudanças no conteúdo
  useEffect(() => {
    if (!containerRef.current) return;
    
    // Limpar observer existente se houver
    if (mutationObserverRef.current) {
      mutationObserverRef.current.disconnect();
    }
    
    // Criar novo observer
    const observer = new MutationObserver(() => {
      if (isStreaming && !userHasScrolled) {
        scrollToBottom();
      }
    });
    
    // Configurar observer
    observer.observe(containerRef.current, {
      childList: true,
      subtree: true,
      characterData: true
    });
    
    // Salvar referência e limpar ao desmontar
    mutationObserverRef.current = observer;
    return () => {
      observer.disconnect();
    };
  }, [isStreaming, scrollToBottom, userHasScrolled]);
  
  // Adicionar event listener de scroll
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    
    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      container.removeEventListener('scroll', handleScroll);
    };
  }, [handleScroll]);
  
  // Polling para forçar scroll durante streaming - menos frequente para evitar problemas
  useEffect(() => {
    if (isStreaming && !userHasScrolled) {
      // Limpar timer existente
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      
      // Configurar novo timer para forçar scroll a cada 200ms (menos frequente)
      timerRef.current = setInterval(() => {
        scrollToBottom();
      }, 200);
      
      // Scroll inicial
      scrollToBottom();
    } else if (timerRef.current) {
      // Limpar timer quando não estiver mais em streaming ou usuário rolou
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isStreaming, userHasScrolled, scrollToBottom]);
  
  // Resetar scroll APENAS quando uma nova mensagem é enviada (não durante o streaming)
  useEffect(() => {
    // Resetar a flag de scroll manual APENAS quando uma nova mensagem é enviada
    // e não durante o streaming atual
    if (!isStreaming) {
      setUserHasScrolled(false);
      
      // Pequeno timeout para garantir que o scroll aconteça
      setTimeout(() => {
        if (containerRef.current) {
          containerRef.current.scrollTop = containerRef.current.scrollHeight + 5000;
        }
      }, 10);
    }
  }, [messagesCount, isStreaming]);
  
  return {
    containerRef,
    userHasScrolled,
    scrollToBottom
  };
} 