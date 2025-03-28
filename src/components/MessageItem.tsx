import React, { useRef, useState } from 'react';
import { Message } from '../types';
import MessageText from './MessageText';
import { FaCopy, FaWhatsapp, FaCheck } from 'react-icons/fa';
import { motion } from 'framer-motion';

interface Props {
  message: Message;
  isLastMessage?: boolean;
  isStreaming?: boolean;
}

export const MessageItem: React.FC<Props> = ({ 
  message, 
  isLastMessage = false,
  isStreaming = false
}) => {
  const isUser = message.role === 'user';
  const containerRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);

  // Função para copiar a mensagem para a área de transferência
  const copyToClipboard = () => {
    if (navigator.clipboard && window.isSecureContext) {
      // Para navegadores modernos
      navigator.clipboard.writeText(message.content)
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
      textArea.value = message.content;
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
    // Limitar a mensagem a 1000 caracteres para evitar problemas com URLs muito longos
    const truncatedMessage = message.content.length > 1000 
      ? message.content.substring(0, 997) + '...' 
      : message.content;
    
    // Criar URL do WhatsApp com a mensagem codificada
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(
      'Mensagem da Byblia:\n\n' + truncatedMessage + '\n\n— Enviado via Byblia (https://byblia.vercel.app/)'
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
                  <span>Copiar</span>
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
              <span>Compartilhar</span>
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