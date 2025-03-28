import React, { useRef, useEffect, useCallback, useState } from 'react';
import ChatInput from './ChatInput';
import { MessageItem } from './MessageItem';
import FeedbackButtons from './FeedbackButtons';
import LoadingIndicator from './LoadingIndicator';
import ColdStartIndicator from './ColdStartIndicator';
import ErrorMessage from './ErrorMessage';
import useChat from '../hooks/useChat';
import { checkBackendHealth } from '../services/api';
import { FaServer, FaQuestionCircle, FaCommentDots, FaSyncAlt } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';

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

const ChatContainer: React.FC = () => {
  const { state, sendUserMessage, submitFeedback } = useChat();
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const prevMessagesLengthRef = useRef<number>(0);
  const lastMessageRef = useRef<string>('');
  
  // Scroll suave para o final do chat somente quando uma nova mensagem é adicionada
  useEffect(() => {
    // Se o número de mensagens aumentou, é uma nova mensagem
    if (state.messages.length > prevMessagesLengthRef.current) {
      // Atualize a referência para a próxima verificação
      prevMessagesLengthRef.current = state.messages.length;
      
      // Use setTimeout para garantir que o DOM foi atualizado antes de scrollar
      setTimeout(() => {
        if (chatContainerRef.current) {
          chatContainerRef.current.scrollTo({
            top: chatContainerRef.current.scrollHeight,
            behavior: 'smooth'
          });
        }
      }, 100);
    }
  }, [state.messages.length]);

  // Scroll suave para o fim quando o streaming termina
  useEffect(() => {
    if (!state.isStreaming && state.messages.length > 0) {
      setTimeout(() => {
        if (chatContainerRef.current) {
          chatContainerRef.current.scrollTo({
            top: chatContainerRef.current.scrollHeight,
            behavior: 'smooth'
          });
        }
      }, 100);
    }
  }, [state.isStreaming]);

  // Wrapper para enviar mensagem e atualizar a ref do comprimento da mensagem
  const handleSendMessage = (message: string) => {
    // Salvar a última mensagem para permitir reenviar em caso de erro
    lastMessageRef.current = message;
    
    // A contagem será atualizada no efeito após a mensagem ser adicionada
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
    <div className="flex flex-col h-full w-full mx-auto rounded-lg bg-white border-0 overflow-hidden">
      {/* Chat header minimalista sem a frase */}
      <div className="p-2 bg-white border-b border-gray-50">
        {/* Conteúdo do header removido pois a frase já está na navbar */}
      </div>
      
      {/* Messages container */}
      <div 
        ref={chatContainerRef}
        className="flex-grow overflow-y-auto p-3 sm:p-5 space-y-4 sm:space-y-5 mb-0 bg-white manual-scroll pb-36 md:pb-0" 
        id="chat-messages"
        style={{ 
          overscrollBehavior: 'contain',
          WebkitOverflowScrolling: 'touch',
          scrollPaddingBottom: state.isStreaming ? '100px' : '120px',
          paddingBottom: state.isStreaming ? '100px' : '120px'
        }}
      >      
        {state.messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full px-4 md:px-6 py-12">
            {/* Mensagem de boas-vindas estilo DeepSeek - centralizada com logo ou ícone */}
            <div className="flex flex-col items-center justify-center text-center max-w-md w-full mb-12">
              <h2 className="text-2xl font-bold mb-2 text-bible-brown">
                Oi, eu sou a Byblia
              </h2>
              <p className="text-sm text-gray-500 mb-0">
                Como eu posso te ajudar hoje?
              </p>
            </div>
            
            {/* Input centralizado após a mensagem de boas-vindas */}
            <div className="w-full max-w-2xl z-50 mb-10 mx-auto">
              <ChatInput 
                onSendMessage={handleSendMessage} 
                isLoading={state.isLoading || state.isStreaming}
              />
            </div>
          </div>
        ) : (
          <div className="message-list pb-2" style={{ position: 'relative' }}>
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
              <div className="mt-1 mb-4">
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
            className="p-3 sm:p-4 md:border-t border-t-0 border-gray-50 bg-white md:relative fixed bottom-0 left-0 right-0 z-50 shadow-md md:shadow-none"
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
            className="p-3 sm:p-4 md:border-t border-t-0 border-gray-50 bg-white md:relative fixed bottom-0 left-0 right-0 z-50 shadow-md md:shadow-none"
          >
            <div className="max-w-2xl mx-auto px-1">
              <div className="streaming-indicator">
                <div className="streaming-indicator-text">
                  <FaSyncAlt className="animate-spin streaming-indicator-icon" size={14} />
                  <span>{state.isColdStart ? "Iniciando o servidor bíblico..." : "Gerando resposta baseada nas Escrituras..."}</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ChatContainer; 