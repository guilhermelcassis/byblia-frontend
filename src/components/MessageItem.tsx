import React, { useRef, useState, memo, useEffect } from 'react';
import { Message } from '../types';
import MessageText from './MessageText';
import { FaCopy, FaWhatsapp, FaCheck, FaThumbsUp, FaThumbsDown } from 'react-icons/fa';
import { motion } from 'framer-motion';
import { useScreen } from '@/hooks/useScreen';
import FeedbackButtons from './FeedbackButtons';

interface Props {
  message: Message;
  isLastMessage?: boolean;
  isStreaming?: boolean;
  questionText?: string; // Pergunta do usuário que originou esta resposta
  isLoading?: boolean;
  onFeedback?: (isPositive: boolean) => Promise<boolean>; // Função para enviar feedback
  currentInteractionId?: number | null; // ID da interação atual
  showFeedback?: boolean; // Flag para mostrar ou não os botões de feedback
}

// Função auxiliar para formatar a hora
const formatTime = (date: Date): string => {
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
};

// Usando memo para evitar re-renderizações desnecessárias durante streaming
export const MessageItem: React.FC<Props> = memo(({ 
  message, 
  isLastMessage = false,
  isStreaming = false,
  questionText = '', // Valor padrão caso não seja fornecido
  isLoading = false,
  onFeedback,
  currentInteractionId,
  showFeedback = false
}) => {
  const isUser = message.role === 'user';
  const containerRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);
  const screen = useScreen();

  // Remover manipulação de zoom sem necessidade - pode estar interferindo no scroll
  useEffect(() => {
    // Não fazer nada aqui que possa afetar scroll
  }, [isLastMessage, isUser, screen.isMobile]);

  // Remover completamente qualquer manipulação de scroll
  useEffect(() => {
    // Este componente NÃO deve controlar o scroll, apenas mostrar o conteúdo
  }, [isLastMessage, isStreaming]);

  // Função auxiliar para truncar texto se necessário
  const truncateText = (text: string, maxLength: number): string => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - 3) + '...';
  };

  // Função para copiar a mensagem para a área de transferência
  const copyToClipboard = () => {
    // Não truncamos a cópia para a área de transferência, pois não tem limitação como a URL
    const textToCopy = questionText 
      ? `Pergunta: ${questionText}\n\nResposta da Byblia:\n${message.content}\n\n— Enviado via Byblia (https://byblia.com/)`
      : `${message.content}\n\n— Enviado via Byblia (https://byblia.com/)`;
      
    if (navigator.clipboard && window.isSecureContext) {
      // Para navegadores modernos
      navigator.clipboard.writeText(textToCopy)
        .then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        })
        .catch(err => {
          console.error('Erro ao copiar texto: ', err);
        });
    } else {
      // Fallback para navegadores mais antigos
      const textArea = document.createElement("textarea");
      textArea.value = textToCopy;
      // Tornar o textarea invisível
      textArea.style.position = "fixed";
      textArea.style.left = "-999999px";
      textArea.style.top = "-999999px";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      
      try {
        document.execCommand('copy');
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error('Erro ao copiar texto: ', err);
      }
      
      document.body.removeChild(textArea);
    }
  };

  // Função para compartilhar via WhatsApp
  const shareViaWhatsApp = () => {
    // Usar a mensagem completa sem truncamento, igual à função de cópia
    const messageToShare = questionText 
      ? `Pergunta: ${questionText}\n\nResposta da Byblia:\n${message.content}`
      : `Mensagem da Byblia:\n\n${message.content}`;
    
    // Criar URL do WhatsApp com a mensagem codificada
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(
      messageToShare + '\n\n— Enviado via Byblia (https://byblia.com/)'
    )}`;
    
    // Abrir em uma nova aba
    window.open(whatsappUrl, '_blank');
  };

  return (
    <div 
      ref={containerRef}
      className={`flex w-full ${
        isUser ? 'justify-end user-message-item' : 'mb-0'
      }`}
      data-testid="message-item"
      style={isUser ? { marginTop: '0', padding: '0' } : { marginBottom: '0' }}
    >
      <div
        className={`${
          isUser
            ? 'p-3 bg-bible-brown text-white font-medium rounded-user-message user-message user-message-container max-w-[85%]'
            : 'text-gray-800 rounded-tl-md assistant-message w-full'
        } ${isStreaming ? 'streaming-message' : ''}`}
        style={{ 
          boxShadow: isUser ? 'none' : 'none',
          backgroundColor: isUser ? '' : 'transparent',
          borderRadius: isUser ? '20px' : '0',
          fontSize: screen.isMobile ? '16px' : '17px', 
          padding: isUser ? '8px 12px' : '0',
          marginTop: isUser ? '0' : '',
          marginBottom: '0',
          maxWidth: screen.isMobile ? '' : '100%',
          margin: screen.isMobile ? '' : '0 auto'
        }}
      >
        {/* Show timestamp for user messages in mobile view */}
        {isUser && screen.isMobile && message.timestamp && (
          <div className="text-[10px] text-white opacity-80 mb-1">
            {formatTime(new Date(message.timestamp))}
          </div>
        )}
        
        <div 
          className={`whitespace-pre-wrap prose prose-sm max-w-none ${
            isUser ? 'prose-invert font-medium user-message-text' : ''
          }`}
          style={isUser ? { color: 'white' } : { lineHeight: screen.isMobile ? '1.5' : '1.7' }}
        >
          <MessageText content={message.content} isStreaming={isStreaming} isUser={isUser} />
        </div>
        
        {/* Exibir os botões de compartilhamento apenas se for uma mensagem do assistente e não estiver em streaming ou carregando */}
        {!isUser && !isStreaming && !isLoading && (
          <div 
            className="flex items-center justify-start mt-2 gap-1 share-buttons-container"
            style={{ 
              borderTop: 'none', 
              background: 'transparent', 
              borderRadius: '0', 
              padding: '0',
              margin: '8px 0 2px 0',
              maxWidth: 'fit-content'
            }}
          >
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={copyToClipboard}
              className="flex items-center justify-center text-xs text-gray-600 hover:text-bible-brown rounded-full px-2 py-1 transition-colors share-button"
              aria-label="Copiar mensagem"
            >
              {copied ? (
                <>
                  <FaCheck size={12} className="mr-1 text-green-500" />
                  <span>Copiado</span>
                </>
              ) : (
                <>
                  <FaCopy size={12} className="mr-1" />
                  <span>{questionText ? "Copiar" : "Copiar"}</span>
                </>
              )}
            </motion.button>
            
            <div className="text-gray-300 mx-1">|</div>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={shareViaWhatsApp}
              className="flex items-center justify-center text-xs text-gray-600 hover:text-green-600 rounded-full px-2 py-1 transition-colors share-button"
              aria-label="Compartilhar via WhatsApp"
            >
              <FaWhatsapp size={12} className="mr-1" />
              <span>{questionText ? "Compartilhar" : "Compartilhar"}</span>
            </motion.button>
          </div>
        )}
        
        {/* Feedback buttons - mostrar abaixo dos botões de compartilhamento */}
        {!isUser && !isStreaming && !isLoading && showFeedback && onFeedback && (
          <div className="flex justify-center mt-0 mb-0">
            <FeedbackButtons onFeedback={onFeedback} />
          </div>
        )}
        
        {!isUser && message.feedbackGiven !== undefined && (
          <div className="text-xs mt-1 italic text-gray-400 pt-1">
            {message.feedback
              ? 'Você achou esta resposta útil'
              : 'Você indicou que esta resposta não foi útil'}
          </div>
        )}
      </div>
    </div>
  );
});