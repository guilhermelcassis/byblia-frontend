import React, { useRef, useEffect, useCallback, useState } from 'react';
import ChatInput from './ChatInput';
import { MessageItem } from './MessageItem';
import FeedbackButtons from './FeedbackButtons';
import LoadingIndicator from './LoadingIndicator';
import ColdStartIndicator from './ColdStartIndicator';
import ErrorMessage from './ErrorMessage';
import useChat from '../hooks/useChat';
import { useScroll } from '../hooks/useScroll';
import { checkBackendHealth, testBackendConnection } from '../services/api';
import { FaServer, FaQuestionCircle, FaCommentDots, FaSyncAlt, FaTools, FaArrowDown, FaShareAlt } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import { useScreen } from '@/hooks/useScreen';
import WelcomeTitleEffect from './WelcomeTitleEffect';

// Componente para mostrar o status do backend
const BackendStatus: React.FC = () => {
  const [isBackendReady, setIsBackendReady] = useState<boolean | null>(null);
  const [checkCount, setCheckCount] = useState(0);
  
  useEffect(() => {
    const checkHealth = async () => {
      try {
        const isHealthy = await checkBackendHealth(3000); // Aumentando o timeout para 3s
        setIsBackendReady(isHealthy);
        
        // Se o backend não estiver pronto, verificar novamente em alguns segundos
        if (!isHealthy && checkCount < 3) { // Reduzido para 3 tentativas
          const timeout = setTimeout(() => {
            setCheckCount(prev => prev + 1);
          }, 3000 + (checkCount * 1000)); // Aumentar tempo entre tentativas
          
          return () => clearTimeout(timeout);
        }
      } catch (error) {
        // Em caso de erro, consideramos o backend indisponível
        setIsBackendReady(false);
        
        // Tentar novamente se estiver dentro do limite de tentativas
        if (checkCount < 3) {
          const timeout = setTimeout(() => {
            setCheckCount(prev => prev + 1);
          }, 3000 + (checkCount * 1000));
          
          return () => clearTimeout(timeout);
        }
      }
    };
    
    checkHealth();
  }, [checkCount]);
  
  // Sempre retornar null para não exibir nenhuma mensagem
  return null;
};

// Componente para o botão de diagnóstico
const DiagnosticButton: React.FC = () => {
  const [isRunning, setIsRunning] = useState(false);
  
  const runDiagnostic = async () => {
    if (isRunning) return;
    
    setIsRunning(true);
    console.log('=== INICIANDO DIAGNÓSTICO DA CONEXÃO ===');
    
    try {
      // Executar teste de conexão
      const result = await testBackendConnection();
      console.log('=== RESULTADO DO DIAGNÓSTICO ===');
      console.log(result);
      
      // Mostrar resultado ao usuário
      if (result.status === 'success') {
        alert(`Diagnóstico concluído: A conexão com o backend parece estar funcionando. 
Status HTTP: ${result.details.chatStatus}
Tipo de resposta: ${result.details.contentType}
Verifique o console do navegador para mais detalhes.`);
      } else {
        alert(`Diagnóstico concluído: Foram encontrados problemas na conexão.
Erro: ${result.message}
Verifique o console do navegador para mais detalhes.`);
      }
    } catch (error) {
      console.error('Erro durante o diagnóstico:', error);
      alert('Ocorreu um erro ao executar o diagnóstico. Verifique o console para mais detalhes.');
    } finally {
      setIsRunning(false);
    }
  };
  
  return (
    <button 
      onClick={runDiagnostic}
      disabled={isRunning}
      className="fixed bottom-2 right-2 bg-gray-100 hover:bg-gray-200 text-gray-700 p-2 rounded-full shadow-md z-50"
      title="Executar diagnóstico de conexão"
    >
      <FaTools className={`${isRunning ? 'animate-spin text-bible-brown' : ''}`} size={16} />
    </button>
  );
};

const ChatContainer: React.FC = () => {
  const { state, sendUserMessage, submitFeedback } = useChat();
  const lastMessageRef = useRef<string>('');
  const screen = useScreen();
  const [streamHasNewContent, setStreamHasNewContent] = useState(false);
  const [userManuallyScrolled, setUserManuallyScrolled] = useState(false);
  const lastScrollPositionRef = useRef<number>(0);
  
  // Use the new scroll hook
  const { containerRef, userHasScrolled, scrollToBottom } = useScroll({
    isStreaming: state.isStreaming,
    messagesCount: state.messages.length
  });

  // Add scroll event listener to detect manual scrolling up
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      // Simplificar para apenas atualizar a posição, toda a lógica está no hook useScroll
      lastScrollPositionRef.current = container.scrollTop;
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  // Adicionar/remover a classe is-loading ao body
  useEffect(() => {
    if (state.isLoading) {
      document.body.classList.add('is-loading');
    } else {
      document.body.classList.remove('is-loading');
    }
    
    return () => {
      document.body.classList.remove('is-loading');
    };
  }, [state.isLoading]);

  // Simplificar o efeito de streaming para um único responsável pelo scroll
  useEffect(() => {
    // Durante streaming, sempre garantir que a classe is-streaming esteja no body e html
    if (state.isStreaming) {
      setStreamHasNewContent(true);
      
      // Adicionar classes para scroll styling com garantia total de aplicação
      document.body.classList.add('is-streaming');
      document.documentElement.classList.add('is-streaming');
      
      // SCROLL AGRESSIVO - Forçar um scroll APENAS se o usuário NÃO rolou manualmente
      if (containerRef.current && !userHasScrolled) {
        // Scroll direto, sem behavior
        containerRef.current.scrollTop = containerRef.current.scrollHeight + 5000;
        
        // Também forçar scroll da página inteira
        window.scrollTo(0, document.body.scrollHeight);
      } else if (userHasScrolled) {
        // Log para confirmar que estamos respeitando a rolagem manual
        console.log('Respeitando scroll manual do usuário - scroll automático pausado');
      }
      
      // Resetar a flag após um curto período para permitir múltiplas atualizações
      const timeout = setTimeout(() => {
        setStreamHasNewContent(false);
      }, 10);
      
      return () => {
        clearTimeout(timeout);
        // Remover as classes quando o streaming terminar
        document.body.classList.remove('is-streaming');
        document.documentElement.classList.remove('is-streaming');
      };
    } else {
      // Garantir que as classes sejam removidas quando não há streaming
      document.body.classList.remove('is-streaming');
      document.documentElement.classList.remove('is-streaming');
    }
  }, [state.currentResponse, state.isStreaming, userHasScrolled]);
  
  // Função específica para scroll DURANTE streaming - COM RESPEITO AO SCROLL MANUAL
  useEffect(() => {
    if (!state.isStreaming) return;
    
    // Polling menos frequente (200ms) para verificar se precisamos rolar - RESPEITANDO scroll manual
    const forcedScrollInterval = setInterval(() => {
      // APENAS faça scroll se o usuário NÃO rolou manualmente para cima
      if (containerRef.current && !userHasScrolled) {
        // Scroll direto sem comportamento suave
        containerRef.current.scrollTop = containerRef.current.scrollHeight + 5000;
        
        // Também forçar scroll da página inteira
        window.scrollTo(0, document.body.scrollHeight);
      }
    }, 200); // Reduzi a frequência para ser menos agressivo
    
    // MutationObserver que respeita rigorosamente o scroll manual
    const observer = new MutationObserver(() => {
      // APENAS faça scroll se o usuário NÃO rolou manualmente para cima
      if (containerRef.current && !userHasScrolled) {
        containerRef.current.scrollTop = containerRef.current.scrollHeight + 5000;
      }
    });
    
    // Observar todo o contêiner de mensagens
    if (containerRef.current) {
      observer.observe(containerRef.current, {
        childList: true,
        subtree: true,
        characterData: true
      });
    }
    
    return () => {
      clearInterval(forcedScrollInterval);
      observer.disconnect();
    };
  }, [state.isStreaming, userHasScrolled]);

  // Function to scroll to the last user message specifically
  const scrollToLastUserMessage = useCallback(() => {
    if (containerRef.current && state.messages.length > 0) {
      // Sempre garantir que a navbar esteja visível no topo em dispositivos móveis
      if (screen.isMobile) {
        window.scrollTo({
          top: 0,
          behavior: 'auto'
        });
      }
      
      // Reset user manually scrolled flag when sending a new message
      setUserManuallyScrolled(false);
      
      // Deixar o scrollToBottom do hook useScroll cuidar do scroll
      scrollToBottom();
    }
  }, [state.messages.length, screen.isMobile, scrollToBottom]);

  // Wrapper for sending message and updating the ref of the message length
  const handleSendMessage = (message: string) => {
    // Save the last message to allow resending in case of error
    lastMessageRef.current = message;
    
    // Send the message
    sendUserMessage(message);
    
    // Reset zoom level to ensure proper visibility on mobile devices
    if (screen.isMobile) {
      // Prevent zooming by meta viewport tag update and reset zoom
      const viewportMeta = document.querySelector('meta[name="viewport"]');
      if (viewportMeta) {
        viewportMeta.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0');
        
        // Restore viewport settings after a delay to prevent future zoom issues
        setTimeout(() => {
          viewportMeta.setAttribute('content', 'width=device-width, initial-scale=1.0, shrink-to-fit=no');
        }, 1000);
      }
      
      // Force the browser to reset zoom level
      document.body.style.transform = 'scale(1)';
      document.body.style.transformOrigin = 'center top';
      
      // Reset any transformation that might be causing zoom
      document.body.style.transform = 'none';
      document.documentElement.style.transform = 'none';
      
      // Force layout recalculation to ensure zoom is really reset
      void document.body.offsetHeight;
    }
    
    // Reset the user manual scroll flag when sending a new message
    setUserManuallyScrolled(false);
    
    // Force scroll to the user's message with a small delay to ensure render is complete
    setTimeout(() => {
      scrollToLastUserMessage();
    }, 10);
  };

  // Handle response display and ensure no zoom is applied
  useEffect(() => {
    // When a new response is received or streaming stops
    if (state.messages.length > 0 && !state.isStreaming) {
      // Ensure the page is not zoomed
      if (screen.isMobile) {
        // Reset any potential zoom
        const viewportMeta = document.querySelector('meta[name="viewport"]');
        if (viewportMeta) {
          viewportMeta.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0');
          
          // Allow user scaling after a short delay
          setTimeout(() => {
            viewportMeta.setAttribute('content', 'width=device-width, initial-scale=1.0, shrink-to-fit=no');
          }, 800);
        }
      }
    }
  }, [state.messages.length, state.isStreaming, screen.isMobile]);

  // Função para tentar novamente a última mensagem
  const handleRetry = useCallback(() => {
    if (lastMessageRef.current) {
      sendUserMessage(lastMessageRef.current);
    }
  }, [sendUserMessage]);

  // Função para determinar a severidade do erro
  const getErrorSeverity = () => {
    if (!state.error) return 'info';
    
    // Verificar o conteúdo da mensagem para determinar a severidade
    const errorMessage = state.error.toLowerCase();
    
    if (errorMessage.includes('tentar novamente') || 
        errorMessage.includes('aguarde') || 
        errorMessage.includes('formato inválido')) {
      return 'warning';
    }
    
    if (errorMessage.includes('servidor') || 
        errorMessage.includes('conexão') || 
        errorMessage.includes('processada')) {
      return 'error';
    }
    
    return 'info';
  };

  // Memoização simplificada das mensagens para reduzir re-renderizações
  // Isto evita que toda a lista seja re-renderizada durante o streaming
  const messageItems = state.messages.map((message, index) => {
    const isLastMessage = index === state.messages.length - 1;
    const isLastAssistantMessage = 
      message.role === 'assistant' && 
      isLastMessage && 
      state.isStreaming;
    
    // Encontrar a pergunta do usuário associada com esta resposta
    let questionText = '';
    if (message.role === 'assistant' && index > 0) {
      // Percorrer as mensagens anteriores para encontrar a pergunta do usuário mais recente
      for (let i = index - 1; i >= 0; i--) {
        if (state.messages[i].role === 'user') {
          questionText = state.messages[i].content;
          break;
        }
      }
    }
      
    return (
      <MessageItem 
        key={message.id} // Usando apenas ID estável para evitar re-renderizações
        message={message} 
        isLastMessage={isLastMessage}
        isStreaming={isLastAssistantMessage}
        questionText={questionText}
        isLoading={state.isLoading}
      />
    );
  });

  // Verificar se o erro atual está relacionado a problemas de conexão
  const hasConnectionError = state.error && (
    state.error.toLowerCase().includes('servidor') ||
    state.error.toLowerCase().includes('conexão') ||
    state.error.toLowerCase().includes('indisponível') ||
    state.error.toLowerCase().includes('tentando reconectar')
  );

  // Função para rolar para o final da resposta atual
  const scrollToCurrentResponse = () => {
    if (containerRef.current) {
      // Encontra o último elemento da resposta
      const lastMessageElement = containerRef.current.querySelector('.message-item:last-child');
      
      if (lastMessageElement) {
        lastMessageElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else {
        // Fallback: rola para o final do container
        scrollToBottom();
      }
    }
  };

  // Botão flutuante para recarregar em caso de erro
  const isErrorNonRecoverable = state.error && (
    state.error.toLowerCase().includes('servidor') ||
    state.error.toLowerCase().includes('conexão') ||
    state.error.toLowerCase().includes('indisponível') ||
    state.error.toLowerCase().includes('tentando reconectar')
  );

  // Botão para rolar para a resposta
  const showScrollToBottomButton = containerRef.current && !userHasScrolled;

  // Botão para compartilhar com amigos
  const showShareButton = false; // Implemente a lógica para mostrar o botão de compartilhamento

  return (
    <section className="flex-1 h-full relative" style={{ paddingTop: '0', marginTop: '0' }}>
      <div
        ref={containerRef}
        id="chat-messages"
        className="flex flex-col flex-1 overflow-y-auto max-h-full pb-24 md:pb-36"
        style={{ 
          paddingTop: '0', 
          marginTop: '56px', // Apenas a altura exata do header
          overflowAnchor: 'none'
        }}
      >
        {/* Pequena indicação de que o scroll automático foi pausado - sem botão */}
        {state.isStreaming && userHasScrolled && (
          <div className="auto-scroll-paused">
            <span>Rolagem automática pausada</span>
          </div>
        )}
      
        {state.messages.length === 0 ? (
          <div className={`flex flex-col items-center ${screen.isMobile && !screen.isLandscape ? 'justify-start pt-10' : 'justify-center h-full'} px-4 md:px-6 ${screen.isLandscape ? 'pt-2 pb-4' : 'pb-4'}`}>
            {/* Mensagem de boas-vindas estilo DeepSeek - agora com efeito de relevo */}
            <div className={`flex flex-col items-center justify-center text-center max-w-md w-full ${screen.isLandscape ? 'mb-4' : 'mb-4'}`}>
              <WelcomeTitleEffect className={`${screen.isLandscape ? 'text-lg' : 'text-xl'} font-bold ${screen.isMobile && !screen.isLandscape ? 'mb-2' : 'mb-3 md:mb-4'} byblia-title-md`}>
                Oi, eu sou a Byblia,
              </WelcomeTitleEffect>
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4, delay: 0.2 }}
                className={`${screen.isLandscape ? 'text-xs' : 'text-sm'} text-gray-500 mb-0`}
              >
                Como posso te ajudar hoje?
              </motion.p>
            </div>
            
            {/* Input centralizado após a mensagem de boas-vindas */}
            <motion.div 
              className={`w-full max-w-2xl z-50 ${screen.isMobile && !screen.isLandscape ? 'mb-2' : 'mb-4 md:mb-8'} mx-auto`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <div className="input-box-3d welcome-input">
                <ChatInput 
                  onSendMessage={handleSendMessage} 
                  isLoading={state.isLoading || state.isStreaming}
                />
              </div>
            </motion.div>
          </div>
        ) : (
          state.messages.map((message, index) => (
            <MessageItem
              key={message.id}
              message={message}
              isLastMessage={index === state.messages.length - 1}
              isStreaming={message.role === 'assistant' && index === state.messages.length - 1 && state.isStreaming}
              questionText={index > 0 && message.role === 'assistant' ? state.messages[index - 1].content : ''}
              isLoading={state.isLoading}
            />
          ))
        )}
        
        {/* Mostrar o indicador de cold start quando o backend estiver inicializando */}
        {state.isColdStart && <ColdStartIndicator />}
      </div>
      
      {/* Input area when messages exist */}
      <AnimatePresence>
        {state.messages.length > 0 && !state.isStreaming && !state.isLoading && !state.isColdStart && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="p-3 sm:p-4 bg-transparent relative z-[100] w-full"
            style={{ 
              padding: screen.isMobile ? '8px 8px 16px 8px' : '12px 16px',
              margin: 0
            }}
          >
            <div className="max-w-2xl mx-auto">
              <div className="input-box-3d">
                <ChatInput 
                  onSendMessage={handleSendMessage} 
                  isLoading={state.isLoading || state.isStreaming}
                />
              </div>
            </div>
          </motion.div>
        )}

        {/* Error message display - não mostrar durante cold start */}
        {state.error && !state.isColdStart && (
          <ErrorMessage 
            message={state.error}
            severity={getErrorSeverity()}
            onRetry={handleRetry}
          />
        )}

        {/* Feedback buttons */}
        {(() => {
          console.log('Feedback rendering check, currentInteractionId:', state.currentInteractionId);
          
          return state.messages.length > 0 &&
            !state.isLoading && 
            !state.isStreaming && 
            !state.isColdStart && (
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                width: 'auto',
                margin: '0 auto',
                padding: '0',
                position: 'relative'
              }}>
                <FeedbackButtons onFeedback={submitFeedback} />
              </div>
            );
        })()}

        {/* Botão flutuante para recarregar em caso de erro */}
        {isErrorNonRecoverable && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed bottom-5 left-1/2 transform -translate-x-1/2 z-[999]"
          >
            <button
              onClick={handleRetry}
              className="bg-red-50 text-red-600 border border-red-200 px-4 py-2 rounded-full shadow-lg flex items-center gap-2 hover:bg-red-100 transition-colors"
            >
              <FaSyncAlt size={14} className="text-red-500" />
              <span>Erro de conexão - Recarregar</span>
            </button>
          </motion.div>
        )}

        {/* Botão para rolar para a resposta */}
        {showScrollToBottomButton && !userHasScrolled && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed bottom-20 right-4 z-50"
          >
            <button
              onClick={scrollToBottom}
              className="bg-white border border-gray-200 rounded-full p-2 shadow-md text-gray-500 hover:bg-gray-50"
              aria-label="Rolar para o final"
            >
              <FaArrowDown size={16} />
            </button>
          </motion.div>
        )}

        {/* Botão para compartilhar com amigos */}
        {showShareButton && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-24 right-4 z-[90]"
          >
            <button
              onClick={() => {}}
              className="bg-white text-bible-brown border border-gray-200 rounded-full p-2 shadow-md hover:bg-gray-50"
              aria-label="Compartilhar"
            >
              <FaShareAlt size={16} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};

export default ChatContainer; 