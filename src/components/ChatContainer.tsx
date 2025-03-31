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

  // Wrapper for sending message and updating the ref of the message length
  const handleSendMessage = (message: string) => {
    // Save the last message to allow resending in case of error
    lastMessageRef.current = message;
    
    sendUserMessage(message);
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

  return (
    <div className="flex flex-col h-full w-full mx-auto rounded-lg border-0 overflow-hidden">
      {/* Removed redundant header div with border */}
      
      {/* Messages container */}
      <div 
        ref={containerRef}
        className="flex-grow overflow-y-auto pt-0 px-2 sm:px-3 md:px-5 space-y-2 sm:space-y-3 mb-0 manual-scroll" 
        id="chat-messages"
        style={{ 
          overscrollBehavior: 'contain',
          WebkitOverflowScrolling: 'touch',
          scrollPaddingBottom: state.isStreaming ? '50px' : '70px',
          paddingBottom: screen.isLandscape 
            ? '50px' 
            : state.isStreaming ? '70px' : '20px',
          paddingTop: '10px'
        }}
      >      
        {state.messages.length === 0 ? (
          <div className={`flex flex-col items-center justify-center h-full px-4 md:px-6 ${screen.isLandscape ? 'pt-2 pb-4' : 'pt-3 pb-6 md:py-6'}`}>
            {/* Mensagem de boas-vindas estilo DeepSeek - centralizada com logo ou ícone */}
            <div className={`flex flex-col items-center justify-center text-center max-w-md w-full ${screen.isLandscape ? 'mb-3' : 'mb-5 md:mb-8'}`}>
              <h2 className={`${screen.isLandscape ? 'text-lg' : 'text-xl md:text-2xl'} font-bold mb-1 md:mb-2 text-bible-brown byblia-title-md`}>
                Oi, eu sou a Byblia,
              </h2>
              <p className={`${screen.isLandscape ? 'text-xs' : 'text-sm'} text-gray-500 mb-0`}>
                Como posso te ajudar hoje?
              </p>
            </div>
            
            {/* Input centralizado após a mensagem de boas-vindas */}
            <div className="w-full max-w-2xl z-50 mb-4 md:mb-8 mx-auto">
              <ChatInput 
                onSendMessage={handleSendMessage} 
                isLoading={state.isLoading || state.isStreaming}
              />
            </div>
          </div>
        ) : (
          <div className="message-list pb-2 mb-2" style={{ position: 'relative' }}>
            {messageItems}
            
            {/* Mostrar o indicador de cold start quando o backend estiver inicializando */}
            {state.isColdStart && <ColdStartIndicator />}
            
            {/* Mostrar o indicador de carregamento apenas quando estiver inicialmente carregando, 
                não durante o streaming ou cold start */}
            {state.isLoading && !state.isStreaming && !state.isColdStart && <LoadingIndicator />}
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

        {/* Feedback buttons - agora com estilo mais minimalista */}
        {(() => {
          // Log para depuração do interaction_id
          console.log('Feedback rendering check, currentInteractionId:', state.currentInteractionId);
          
          return state.messages.length > 0 &&
            !state.isLoading && 
            !state.isStreaming && 
            !state.isColdStart && (
              <div className="mt-1 mb-2 sm:mb-0">
                <FeedbackButtons onFeedback={submitFeedback} />
              </div>
            );
        })()}
      </div>
      
      {/* Input area - posicionado na parte inferior apenas quando já existem mensagens e não está em streaming */}
      <AnimatePresence>
        {state.messages.length > 0 && !state.isStreaming && !state.isColdStart && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.2 }}
            className="p-3 sm:p-4 bg-transparent relative z-[100]"
            style={{ margin: 0 }}
          >
            <div className="max-w-2xl mx-auto px-1">
              <ChatInput 
                onSendMessage={handleSendMessage} 
                isLoading={state.isLoading || state.isStreaming}
              />
            </div>
          </motion.div>
        )}

        {/* Indicador de streaming que substitui o input quando uma resposta está sendo gerada */}
        {state.messages.length > 0 && (state.isStreaming || state.isColdStart) && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.2 }}
            className="p-2 sm:p-3 bg-transparent relative z-[90]"
            style={{ margin: 0, pointerEvents: 'none' }}
          >
            <div className="max-w-2xl mx-auto">
              <div className="streaming-indicator">
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