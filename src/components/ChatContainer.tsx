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
import { FaServer, FaQuestionCircle, FaCommentDots, FaSyncAlt, FaTools } from 'react-icons/fa';
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
  
  // Use the new scroll hook
  const { containerRef, userHasScrolled, scrollToBottom } = useScroll({
    isStreaming: state.isStreaming,
    messagesCount: state.messages.length,
    hasNewContent: streamHasNewContent,
    currentResponseText: state.currentResponse
  });

  // Reset stream content tracker when streaming starts/stops
  useEffect(() => {
    if (!state.isStreaming) {
      // When streaming stops, do a final scroll to bottom
      setTimeout(() => {
        scrollToBottom();
      }, 100);
    }
  }, [state.isStreaming, scrollToBottom]);

  // Track streaming content changes to trigger scrolling
  useEffect(() => {
    if (state.isStreaming) {
      setStreamHasNewContent(true);
      
      // Reset after a short delay to allow for batched updates
      const timeout = setTimeout(() => {
        setStreamHasNewContent(false);
      }, 300);
      
      return () => clearTimeout(timeout);
    }
  }, [state.currentResponse, state.isStreaming]);

  // Function to scroll to the last user message specifically
  const scrollToLastUserMessage = useCallback(() => {
    if (containerRef.current && state.messages.length > 0) {
      // Sempre garantir que a navbar esteja visível no topo em dispositivos móveis
      if (screen.isMobile) {
        // Scroll to top of page to ensure navbar is visible
        window.scrollTo({
          top: 0,
          behavior: 'auto'
        });
      }
      
      // Find all user message elements - targeting the right CSS class
      const userMessages = containerRef.current.querySelectorAll('.user-message-container');
      
      if (userMessages.length > 0) {
        // Get the last user message element
        const lastUserMessage = userMessages[userMessages.length - 1];
        
        // In mobile view, scroll to the very top to show question and navbar
        if (screen.isMobile && !screen.isLandscape) {
          // Small delay to ensure scrollToTop completed first
          setTimeout(() => {
            const container = containerRef.current;
            if (container) {
              const messageTop = lastUserMessage.getBoundingClientRect().top;
              const containerTop = container.getBoundingClientRect().top;
              const scrollOffset = messageTop - containerTop;
              
              container.scrollTo({
                top: scrollOffset,
                behavior: 'auto'
              });
            }
          }, 50);
        } else {
          // Default behavior for non-mobile or landscape mode
          const container = containerRef.current;
          const messageTop = lastUserMessage.getBoundingClientRect().top;
          const containerTop = container.getBoundingClientRect().top;
          const scrollOffset = messageTop - containerTop - 20; // 20px padding from top
          
          // Smooth scroll to position
          container.scrollBy({
            top: scrollOffset,
            behavior: 'auto' // Changed to auto for immediate scroll
          });
        }
      }
    }
  }, [state.messages.length, screen.isMobile, screen.isLandscape]);

  // Wrapper for sending message and updating the ref of the message length
  const handleSendMessage = (message: string) => {
    // Save the last message to allow resending in case of error
    lastMessageRef.current = message;
    
    // Send the message
    sendUserMessage(message);
    
    // Force scroll to the user's message with a small delay to ensure render is complete
    setTimeout(() => {
      scrollToLastUserMessage();
    }, 10); // Reduced delay for more immediate response
  };

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

  // Estilos para o indicador fixo no modo móvel
  const fixedIndicatorStyle = {
    position: 'fixed' as const,
    bottom: '16px',
    left: '50%',
    transform: 'translateX(-50%)',
    backgroundColor: 'white',
    borderRadius: '20px',
    boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
    padding: '8px 16px',
    maxWidth: '90%',
    zIndex: 1000,
    fontSize: '14px',
    opacity: 0.9,
    border: '1px solid rgba(0, 0, 0, 0.05)'
  };

  // Estilos para o botão "Ver resposta" no topo
  const viewResponseButtonStyle = {
    position: 'fixed' as const,
    top: '70px',
    left: '50%',
    transform: 'translateX(-50%)',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    color: '#8B5D33', // Cor bible-brown
    borderRadius: '20px',
    boxShadow: '0 2px 10px rgba(0, 0, 0, 0.08)',
    padding: '8px 16px',
    maxWidth: '90%',
    zIndex: 1000,
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    border: '1px solid rgba(139, 93, 51, 0.15)',
    fontSize: '14px',
    fontWeight: 500
  };

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

  return (
    <div className={`flex flex-col h-full w-full mx-auto rounded-lg border-0 overflow-hidden ${state.messages.length === 0 ? 'state-messages-length-0' : ''}`}>
      {/* Mobile view com a pergunta do usuário sempre visível */}
      {screen.isMobile && !screen.isLandscape && state.messages.length > 1 && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="question-focus-container bg-gray-50 py-3 px-4 border-b"
        >
          <div className="text-xs text-gray-500 mb-1">Sua pergunta:</div>
          <div className="text-sm font-medium text-gray-800">
            {state.messages.find(m => m.role === 'user')?.content || ''}
          </div>
        </motion.div>
      )}
      
      {/* Messages container */}
      <div 
        ref={containerRef}
        className={`flex-grow overflow-y-auto pt-0 px-2 sm:px-3 md:px-5 space-y-2 sm:space-y-3 mb-0 manual-scroll`}
        id="chat-messages"
        style={{ 
          overscrollBehavior: 'contain',
          WebkitOverflowScrolling: 'touch',
          scrollPaddingBottom: '70px',
          paddingBottom: screen.isLandscape ? '50px' : '20px',
          paddingTop: '10px',
          position: 'relative'
        }}
      >      
        {state.messages.length === 0 ? (
          <div className={`flex flex-col items-center ${screen.isMobile && !screen.isLandscape ? 'justify-start pt-10' : 'justify-center h-full'} px-4 md:px-6 ${screen.isLandscape ? 'pt-2 pb-4' : 'pb-4'}`}>
            {/* Mensagem de boas-vindas estilo DeepSeek - agora com efeito de relevo */}
            <div className={`flex flex-col items-center justify-center text-center max-w-md w-full ${screen.isLandscape ? 'mb-4' : 'mb-4'}`}>
              <WelcomeTitleEffect className={`${screen.isLandscape ? 'text-lg' : 'text-xl'} font-bold ${screen.isMobile && !screen.isLandscape ? 'mb-2' : 'mb-3 md:mb-4'} byblia-title-md`}>
                Oi, eu sou a Byblia,
              </WelcomeTitleEffect>
              <motion.p 
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.2 }}
                className={`${screen.isLandscape ? 'text-xs' : 'text-sm'} text-gray-500 mb-0`}
              >
                Como posso te ajudar hoje?
              </motion.p>
            </div>
            
            {/* Input centralizado após a mensagem de boas-vindas */}
            <motion.div 
              className={`w-full max-w-2xl z-50 ${screen.isMobile && !screen.isLandscape ? 'mb-2' : 'mb-4 md:mb-8'} mx-auto`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <div className="input-box-3d">
                <ChatInput 
                  onSendMessage={handleSendMessage} 
                  isLoading={state.isLoading || state.isStreaming}
                />
              </div>
            </motion.div>
          </div>
        ) : (
          <div className="message-list pb-2 mb-2" style={{ position: 'relative' }}>
            {messageItems}
            
            {/* Mostrar o indicador de cold start quando o backend estiver inicializando */}
            {state.isColdStart && <ColdStartIndicator />}
          </div>
        )}

        {/* Loading indicators - positioned fixed to not affect layout */}
        {state.isLoading && !state.isStreaming && !state.isColdStart && (
          <div className="fixed top-20 right-4 z-40">
            <div className="p-2 bg-white rounded-full shadow-sm opacity-90">
              <FaSyncAlt className="animate-spin text-bible-brown" size={14} />
            </div>
          </div>
        )}
        
        {/* Mini indicador durante streaming em mobile - fixed positioning */}
        {state.isStreaming && screen.isMobile && !screen.isLandscape && (
          <div className="fixed top-20 right-4 z-40">
            <div className="p-2 bg-white rounded-full shadow-sm opacity-90">
              <FaSyncAlt className="animate-spin text-bible-brown" size={14} />
            </div>
          </div>
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
              <div className="mt-0 mb-0">
                <FeedbackButtons onFeedback={submitFeedback} />
              </div>
            );
        })()}
      </div>
      
      {/* Input area when messages exist */}
      <AnimatePresence>
        {state.messages.length > 0 && !state.isStreaming && !state.isColdStart && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
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

        {/* Indicador de streaming apenas para desktop ou em caso de cold start */}
        {state.messages.length > 0 && ((state.isStreaming && (!screen.isMobile || screen.isLandscape)) || state.isColdStart) && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.2 }}
            className="p-2 sm:p-3 bg-transparent relative z-[90]"
            style={{ margin: 0, pointerEvents: 'none' }}
          >
            <div className="max-w-2xl mx-auto">
              <div 
                className="streaming-indicator" 
                style={!screen.isLandscape && screen.isMobile ? fixedIndicatorStyle : {}}
              >
                <div className="streaming-indicator-text">
                  <FaSyncAlt className="animate-spin streaming-indicator-icon" size={14} />
                  <span>
                    {state.isColdStart 
                      ? "Iniciando o servidor..." 
                      : "Consultando as Escrituras para encontrar sua resposta..."}
                  </span>
                  {state.isStreaming && 
                    <button 
                      onClick={handleRetry} 
                      className="ml-2 text-xs text-bible-brown underline cursor-pointer pointer-events-auto"
                      title="Cancelar e tentar novamente"
                      style={{ pointerEvents: 'auto' }}
                    >
                      (cancelar)
                    </button>
                  }
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Botão de diagnóstico - removido conforme solicitado */}
    </div>
  );
};

export default ChatContainer; 