import React, { useRef, useEffect, useCallback } from 'react';
import ChatInput from './ChatInput';
import { MessageItem } from './MessageItem';
import FeedbackButtons from './FeedbackButtons';
import LoadingIndicator from './LoadingIndicator';
import ErrorMessage from './ErrorMessage';
import useChat from '../hooks/useChat';

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

  return (
    <div className="flex flex-col h-full w-full mx-auto rounded-lg bg-white shadow-md border border-gray-200 overflow-hidden">
      {/* Chat header */}
      <div className="p-5 bg-white border-b border-gray-200">
        <h2 className="text-lg font-medium text-bible-brown">
          Converse e receba orientação baseada nas Escrituras
        </h2>
      </div>
      
      {/* Messages container - Com scroll suave ao enviar mensagem */}
      <div 
        ref={chatContainerRef}
        className="flex-grow overflow-y-auto p-5 space-y-5 mb-0 bg-gray-50 manual-scroll" 
        id="chat-messages"
        style={{ 
          overscrollBehavior: 'contain',
        }}
      >
        {state.messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center p-8 rounded-lg bg-white border border-gray-200 shadow-sm max-w-md mx-auto">
              <h2 className="text-2xl font-medium mb-3 text-bible-brown">
                Bem-vindo à Byblia
              </h2>
              <p className="text-gray-600 mb-5 leading-relaxed">
                Faça qualquer pergunta, peça conselhos ou compartilhe seus problemas e receba orientação à luz das Escrituras Sagradas.
              </p>
              <p className="text-sm text-gray-500 italic leading-relaxed">
                "Toda a Escritura é inspirada por Deus e útil para o ensino, para a repreensão, para a correção e para a instrução na justiça."
                <br />
                — 2 Timóteo 3:16
              </p>
            </div>
          </div>
        ) : (
          <div className="message-list pb-2" style={{ position: 'relative' }}>
            {state.messages.map((message, index) => {
              // Identificar se esta é a última mensagem do assistente e está em streaming
              const isLastAssistantMessage = 
                message.role === 'assistant' && 
                index === state.messages.length - 1 && 
                state.isStreaming;
              
              const isLastMessage = index === state.messages.length - 1;
              
              return (
                <MessageItem 
                  key={`${message.id}-${message.content.length}`}
                  message={message} 
                  isLastMessage={isLastMessage}
                  isStreaming={isLastAssistantMessage}
                />
              );
            })}
            {/* Mostrar o indicador de carregamento apenas quando estiver inicialmente carregando, 
                não durante o streaming */}
            {state.isLoading && !state.isStreaming && <LoadingIndicator />}
          </div>
        )}

        {/* Error message display - Substituído pelo novo componente ErrorMessage */}
        {state.error && (
          <ErrorMessage 
            message={state.error}
            severity={getErrorSeverity()}
            onRetry={handleRetry}
          />
        )}

        {/* Show feedback buttons only after a non-empty response and when feedback hasn't been given */}
        {state.messages.length > 0 &&
          state.currentInteractionId !== null &&
          !state.isLoading && 
          !state.isStreaming && (
            <FeedbackButtons onFeedback={submitFeedback} />
          )}
      </div>

      {/* Input area */}
      <div className="p-5 border-t-2 border-gray-200 bg-white">
        <ChatInput 
          onSendMessage={handleSendMessage} 
          isLoading={state.isLoading || state.isStreaming}
        />
      </div>
    </div>
  );
};

export default ChatContainer; 