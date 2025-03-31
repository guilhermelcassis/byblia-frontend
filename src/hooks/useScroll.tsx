import { useEffect, useRef, useState } from 'react';

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

  // Track user scrolling behavior
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      if (!isStreaming) return;

      const { scrollTop, scrollHeight, clientHeight } = container;
      // Consider user as having scrolled up if they're not close to the bottom (with a 100px threshold)
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
      
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
  }, [isStreaming, userHasScrolled]);

  // Handle auto-scrolling during streaming
  useEffect(() => {
    if (!containerRef.current) return;
    
    // Handle new complete messages
    if (messagesCount > prevMessagesCountRef.current) {
      prevMessagesCountRef.current = messagesCount;
      
      // Always scroll for new complete messages
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
      
      scrollTimeoutRef.current = setTimeout(() => {
        if (containerRef.current) {
          console.log('[useScroll] Nova mensagem detectada, scrollando para o final');
          containerRef.current.scrollTo({
            top: containerRef.current.scrollHeight,
            behavior: 'smooth'
          });
        }
      }, 100);
    }
  }, [messagesCount]);

  // Handle streaming content scrolling using currentResponseText
  useEffect(() => {
    if (!isStreaming || !containerRef.current || userHasScrolled) return;
    
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
            behavior: 'smooth'
          });
        }
      }, 50);
    }
  }, [isStreaming, currentResponseText, userHasScrolled]);

  // Handle streaming content scrolling based on hasNewContent flag
  useEffect(() => {
    if (!containerRef.current || !isStreaming || userHasScrolled) return;

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
            behavior: 'smooth'
          });
        }
      }, 50); // Faster timeout for streaming
    }
  }, [isStreaming, hasNewContent, userHasScrolled]);

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
        behavior: 'smooth'
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