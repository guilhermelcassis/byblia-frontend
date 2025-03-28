import React, { useRef, useState } from 'react';
import { Message } from '../types';
import MessageText from './MessageText';
import { FaCopy, FaWhatsapp, FaCheck } from 'react-icons/fa';
import { motion } from 'framer-motion';

interface Props {
  message: Message;
  isLastMessage?: boolean;
  isStreaming?: boolean;
  questionText?: string; // Pergunta do usuário que originou esta resposta
}

export const MessageItem: React.FC<Props> = ({ 
  message, 
  isLastMessage = false,
  isStreaming = false,
  questionText = '' // Valor padrão caso não seja fornecido
}) => {
  const isUser = message.role === 'user';
  const containerRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);

  // Função auxiliar para truncar texto se necessário
  const truncateText = (text: string, maxLength: number): string => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - 3) + '...';
  };

  // Função para copiar a mensagem para a área de transferência
  const copyToClipboard = () => {
    // Não truncamos a cópia para a área de transferência, pois não tem limitação como a URL
    const textToCopy = questionText 
      ? `Pergunta: ${questionText}\n\nResposta da Byblia:\n${message.content}\n\n— Enviado via Byblia (https://byblia.vercel.app/)`
      : `${message.content}\n\n— Enviado via Byblia (https://byblia.vercel.app/)`;
      
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
    // Limitar o tamanho da pergunta e da resposta para o URL do WhatsApp não ficar muito longo
    const maxQuestionLength = 300; // Tamanho máximo para a pergunta
    const maxAnswerLength = 800;   // Tamanho máximo para a resposta
    
    const truncatedQuestion = questionText ? truncateText(questionText, maxQuestionLength) : '';
    const truncatedAnswer = truncateText(message.content, maxAnswerLength);
    
    // Formato da mensagem com a pergunta original, se disponível
    const messageWithQuestion = questionText 
      ? `Pergunta: ${truncatedQuestion}\n\nResposta da Byblia:\n${truncatedAnswer}`
      : `Mensagem da Byblia:\n\n${truncatedAnswer}`;
    
    // Criar URL do WhatsApp com a mensagem codificada
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(
      messageWithQuestion + '\n\n— Enviado via Byblia (https://byblia.vercel.app/)'
    )}`;
    
    // Abrir em uma nova aba
    window.open(whatsappUrl, '_blank');
  };

  return (
    <div 
      ref={containerRef}
      className={`flex w-full mb-4 ${
        isUser ? 'justify-end' : ''
      }`}
      data-testid="message-item"
    >
      <div
        className={`p-3 sm:p-4 rounded-lg ${
          isUser
            ? 'bg-bible-brown text-white font-medium rounded-br-md user-message user-message-container max-w-[85%]'
            : 'bg-[#F5F5F5] text-gray-800 rounded-tl-md assistant-message w-full'
        } ${isStreaming ? 'streaming-message' : ''}`}
        style={{ 
          boxShadow: 'none',
        }}
      >
        <div 
          className={`whitespace-pre-wrap prose prose-sm max-w-none ${
            isUser ? 'prose-invert font-medium user-message-text' : ''
          }`}
          style={isUser ? { color: 'white' } : {}}
        >
          <MessageText content={message.content} isStreaming={isStreaming} isUser={isUser} />
        </div>
        
        {/* Exibir os botões de compartilhamento apenas se for uma mensagem do assistente e não estiver em streaming */}
        {!isUser && !isStreaming && (
          <div className="flex items-center justify-end mt-2 pt-2 border-t border-gray-100 gap-2 share-buttons-container">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={copyToClipboard}
              className="flex items-center justify-center text-xs bg-white text-gray-600 hover:text-bible-brown border border-gray-200 rounded-full px-3 py-1 transition-colors share-button"
              aria-label="Copiar mensagem"
            >
              {copied ? (
                <>
                  <FaCheck size={10} className="mr-1 text-green-500" />
                  <span>Copiado</span>
                </>
              ) : (
                <>
                  <FaCopy size={10} className="mr-1" />
                  <span>{questionText ? "Copiar conversa" : "Copiar resposta"}</span>
                </>
              )}
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={shareViaWhatsApp}
              className="flex items-center justify-center text-xs bg-white text-gray-600 hover:text-green-600 border border-gray-200 rounded-full px-3 py-1 transition-colors share-button"
              aria-label="Compartilhar via WhatsApp"
            >
              <FaWhatsapp size={10} className="mr-1" />
              <span>{questionText ? "Compartilhar conversa" : "Compartilhar"}</span>
            </motion.button>
          </div>
        )}
        
        {!isUser && message.feedbackGiven !== undefined && (
          <div className="text-xs mt-2 italic text-gray-400 pt-2">
            {message.feedback
              ? 'Você achou esta resposta útil'
              : 'Você indicou que esta resposta não foi útil'}
          </div>
        )}
      </div>
    </div>
  );
};