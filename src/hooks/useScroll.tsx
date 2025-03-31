import { useEffect, useRef, useState } from 'react';
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
 * Hook to handle automatic scrolling behavior with user interaction detection
 */
export function useScroll({ 
  isStreaming, 
  messagesCount, 
  hasNewContent = false,
  currentResponseText = ''
}: UseScrollOptions) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [userHasScrolled, setUserHasScrolled] = useState(false);
  const prevMessagesCountRef = useRef<number>(0);
  const prevResponseLengthRef = useRef<number>(0);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const screen = useScreen();
  // Track if we should prioritize showing the question over auto-scrolling
  const [prioritizeQuestion, setPrioritizeQuestion] = useState(false);

  // Reset prioritize question when message count changes
  useEffect(() => {
    if (messagesCount % 2 === 0 && messagesCount > 0) {
      // New question was just sent (even number of messages means user message + placeholder response)
      setPrioritizeQuestion(true);
    } else if (messagesCount > prevMessagesCountRef.current) {
      // After a short delay, reset the priority flag
      const timeout = setTimeout(() => {
        setPrioritizeQuestion(false);
      }, 1500);
      return () => clearTimeout(timeout);
    }
  }, [messagesCount]);

  // Track user scrolling behavior
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      if (!isStreaming) return;

      const { scrollTop, scrollHeight, clientHeight } = container;
      // Consideramos uma distância maior para dispositivos móveis em modo retrato
      const scrollThreshold = screen.isMobile && !screen.isLandscape ? 200 : 100;
      // Consider user as having scrolled up if they're not close to the bottom
      const isNearBottom = scrollHeight - scrollTop - clientHeight < scrollThreshold;
      
      if (!isNearBottom) {
        setUserHasScrolled(true);
      }
      
      // If user has scrolled back to the bottom, re-enable auto scrolling
      if (isNearBottom && userHasScrolled) {
        setUserHasScrolled(false);
      }
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, [isStreaming, userHasScrolled, screen.isMobile, screen.isLandscape]);

  // Handle auto-scrolling during streaming
  useEffect(() => {
    if (!containerRef.current) return;
    
    // Handle new complete messages
    if (messagesCount > prevMessagesCountRef.current) {
      prevMessagesCountRef.current = messagesCount;
      
      // Em dispositivos móveis, garantir que a navbar esteja visível
      if (screen.isMobile && !screen.isLandscape) {
        // Scroll to top of page to ensure navbar is visible
        window.scrollTo({
          top: 0,
          behavior: 'auto'
        });
      }
      
      // Em dispositivos móveis no modo retrato, vamos rolar para o topo do container
      // para garantir visibilidade da conversa, já que removemos a exibição da pergunta no topo
      if (screen.isMobile && !screen.isLandscape) {
        console.log('[useScroll] Mobile mode - scrolling to the top of container');
        
        if (scrollTimeoutRef.current) {
          clearTimeout(scrollTimeoutRef.current);
        }
        
        scrollTimeoutRef.current = setTimeout(() => {
          if (containerRef.current) {
            containerRef.current.scrollTo({
              top: 0,
              behavior: 'auto'
            });
          }
        }, 50);
        
        return;
      }
      
      // Always scroll for new complete messages, mas com animação mais suave em mobile
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
      
      scrollTimeoutRef.current = setTimeout(() => {
        if (containerRef.current) {
          console.log('[useScroll] Nova mensagem detectada, scrollando para o final');
          containerRef.current.scrollTo({
            top: containerRef.current.scrollHeight,
            behavior: screen.isMobile && !screen.isLandscape ? 'auto' : 'smooth'
          });
        }
      }, screen.isMobile && !screen.isLandscape ? 300 : 100);
    }
  }, [messagesCount, screen.isMobile, screen.isLandscape, prioritizeQuestion]);

  // Handle streaming content scrolling using currentResponseText
  useEffect(() => {
    if (!isStreaming || !containerRef.current || userHasScrolled) return;
    
    // Permitir rolagem automática em todos os dispositivos durante o streaming
    // Removida a condição que impedia o scroll em dispositivos móveis
    
    // Detectar se houve mudança no tamanho da resposta
    const currentLength = currentResponseText?.length || 0;
    
    if (currentLength > prevResponseLengthRef.current) {
      console.log('[useScroll] Resposta cresceu durante streaming, scrollando para o final');
      prevResponseLengthRef.current = currentLength;
      
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
      
      scrollTimeoutRef.current = setTimeout(() => {
        if (containerRef.current) {
          containerRef.current.scrollTo({
            top: containerRef.current.scrollHeight,
            behavior: screen.isMobile ? 'auto' : 'smooth' // Usar 'auto' em mobile para scroll instantâneo
          });
        }
      }, 50);
    }
  }, [isStreaming, currentResponseText, userHasScrolled, screen.isMobile, screen.isLandscape]);

  // Handle streaming content scrolling based on hasNewContent flag
  useEffect(() => {
    if (!containerRef.current || !isStreaming || userHasScrolled) return;
    
    // Permitir rolagem automática em todos os dispositivos
    // Removida a condição que impedia o scroll em dispositivos móveis

    // During streaming, scroll if user hasn't manually scrolled up
    if (hasNewContent && !userHasScrolled) {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
      
      scrollTimeoutRef.current = setTimeout(() => {
        if (containerRef.current) {
          console.log('[useScroll] Novo conteúdo durante streaming, scrollando para o final');
          containerRef.current.scrollTo({
            top: containerRef.current.scrollHeight,
            behavior: screen.isMobile ? 'auto' : 'smooth' // Usar 'auto' para scroll mais rápido no mobile
          });
        }
      }, 30); // Ainda mais rápido para melhor responsividade 
    }
  }, [isStreaming, hasNewContent, userHasScrolled, screen.isMobile, screen.isLandscape]);

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  // Scroll to bottom manually (can be called after streaming ends)
  const scrollToBottom = () => {
    if (containerRef.current) {
      console.log('[useScroll] Scroll manual para o final solicitado');
      containerRef.current.scrollTo({
        top: containerRef.current.scrollHeight,
        behavior: screen.isMobile && !screen.isLandscape ? 'auto' : 'smooth'
      });
      setUserHasScrolled(false);
    }
  };

  return {
    containerRef,
    userHasScrolled,
    scrollToBottom
  };
} 