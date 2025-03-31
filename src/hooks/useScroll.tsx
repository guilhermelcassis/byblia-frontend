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
 * Simplificado para garantir melhor funcionalidade
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
  
  // Simplified scroll detection - apenas verifica se o usuário rolou para cima
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Variável para armazenar a última posição de scroll
    let lastScrollTop = container.scrollTop;

    const handleScroll = () => {
      // Se o usuário rolou para cima significativamente (mais de 40px)
      if (container.scrollTop < lastScrollTop - 40) {
        setUserHasScrolled(true);
      }
      
      // Se o usuário rolou para perto do fim, reativar auto-scroll
      const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 100;
      if (isNearBottom) {
        setUserHasScrolled(false);
      }
      
      // Atualizar a posição para a próxima verificação
      lastScrollTop = container.scrollTop;
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  // Scroll simples quando novas mensagens são adicionadas
  useEffect(() => {
    if (!containerRef.current) return;
    
    // Se uma nova mensagem foi adicionada
    if (messagesCount > prevMessagesCountRef.current) {
      prevMessagesCountRef.current = messagesCount;
      
      // Solução simples: sempre scrollar para o final após nova mensagem
      if (!userHasScrolled) {
        if (scrollTimeoutRef.current) {
          clearTimeout(scrollTimeoutRef.current);
        }
        
        scrollTimeoutRef.current = setTimeout(() => {
          if (containerRef.current) {
            containerRef.current.scrollTo({
              top: containerRef.current.scrollHeight,
              behavior: 'auto' // Comportamento imediato para ser mais confiável
            });
          }
        }, 50);
      }
    }
  }, [messagesCount, userHasScrolled]);

  // Comportamento simplificado durante streaming
  useEffect(() => {
    if (!isStreaming || !containerRef.current || userHasScrolled) return;
    
    // Verificar mudanças no tamanho da resposta
    const currentLength = currentResponseText?.length || 0;
    const hasGrown = currentLength > prevResponseLengthRef.current;
    
    if (hasGrown || hasNewContent) {
      prevResponseLengthRef.current = currentLength;
      
      // Limpar timeout anterior para evitar múltiplos scrolls
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
      
      // Usar um timeout curto para agrupar múltiplas atualizações
      scrollTimeoutRef.current = setTimeout(() => {
        if (containerRef.current) {
          containerRef.current.scrollTo({
            top: containerRef.current.scrollHeight,
            behavior: 'auto' // 'auto' é mais consistente que 'smooth'
          });
        }
      }, 30);
    }
  }, [isStreaming, currentResponseText, hasNewContent, userHasScrolled]);

  // Limpar timeout ao desmontar
  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  // Função para scroll manual
  const scrollToBottom = () => {
    if (containerRef.current) {
      containerRef.current.scrollTo({
        top: containerRef.current.scrollHeight,
        behavior: 'auto' // Simplificado para sempre usar 'auto'
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