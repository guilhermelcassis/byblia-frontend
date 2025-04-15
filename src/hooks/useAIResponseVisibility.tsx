import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import useChat from './useChat';

interface AIResponseVisibilityContextType {
  isAIResponding: boolean;
  shouldHideButtons: boolean;
}

const AIResponseVisibilityContext = createContext<AIResponseVisibilityContextType>({
  isAIResponding: false,
  shouldHideButtons: false
});

export const useAIResponseVisibility = () => useContext(AIResponseVisibilityContext);

interface AIResponseVisibilityProviderProps {
  children: ReactNode;
}

export const AIResponseVisibilityProvider: React.FC<AIResponseVisibilityProviderProps> = ({ children }) => {
  const [isAIResponding, setIsAIResponding] = useState(false);
  const [shouldHideButtons, setShouldHideButtons] = useState(false);
  const { state } = useChat();
  const [isMounted, setIsMounted] = useState(false);

  // Verificar se estamos no cliente
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Track when AI is responding or streaming
  useEffect(() => {
    if (!isMounted) return;

    // Check if the last message is from the assistant and is being updated
    const isAssistantResponding = () => {
      const messages = state.messages;
      if (messages.length > 0) {
        const lastMessage = messages[messages.length - 1];
        return lastMessage.role === 'assistant';
      }
      return false;
    };
    
    // AI is responding if it's loading, streaming, or an assistant message is being updated
    const aiResponding = state.isLoading || 
                        state.isStreaming || 
                        isAssistantResponding() || 
                        Boolean(state.currentResponse && state.currentResponse.length > 0) ||
                        (typeof document !== 'undefined' && document.body.hasAttribute('data-ai-responding'));
    
    setIsAIResponding(aiResponding);
    
    // Esconder os botões durante o processamento da resposta
    if (aiResponding) {
      setShouldHideButtons(true);
    } else {
      // Pequeno atraso para mostrar os botões novamente
      const timer = setTimeout(() => {
        setShouldHideButtons(false);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [state.isLoading, state.isStreaming, state.messages, state.currentResponse, isMounted]);
  
  // Observer para monitorar a presença do atributo data-ai-responding
  useEffect(() => {
    if (!isMounted) return;

    const checkBodyAttribute = () => {
      const isResponding = document.body.hasAttribute('data-ai-responding');
      if (isResponding) {
        setShouldHideButtons(true);
      }
    };
    
    // Verificar inicialmente
    checkBodyAttribute();
    
    // Configurar um MutationObserver para monitorar mudanças nos atributos do body
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'data-ai-responding') {
          checkBodyAttribute();
        }
      });
    });
    
    observer.observe(document.body, { attributes: true });
    
    return () => {
      observer.disconnect();
    };
  }, [isMounted]);

  return (
    <AIResponseVisibilityContext.Provider value={{ isAIResponding, shouldHideButtons }}>
      {children}
    </AIResponseVisibilityContext.Provider>
  );
}; 