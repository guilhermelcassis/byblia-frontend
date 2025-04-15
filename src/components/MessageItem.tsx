import React, { useRef, useState, memo, useEffect } from 'react';
import { Message } from '../types';
import MessageText from './MessageText';
import { FaWhatsapp } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import { useScreen } from '@/hooks/useScreen';
import FeedbackButtons from './FeedbackButtons';
import { Share2, Check, Copy, MessageSquare, User, Sparkles, BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTheme } from 'next-themes';

interface Props {
  message: Message;
  isLastMessage?: boolean;
  isStreaming?: boolean;
  questionText?: string; // User question that originated this response
  isLoading?: boolean;
  onFeedback?: (isPositive: boolean) => Promise<boolean>; // Function to send feedback
  currentInteractionId?: number | null; // Current interaction ID
  showFeedback?: boolean; // Flag to show feedback buttons
  lastMessageRef?: React.RefObject<HTMLDivElement>;
}

// Helper function to format time
const formatTime = (date: Date): string => {
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
};

// Using memo to avoid unnecessary re-renders during streaming
export const MessageItem: React.FC<Props> = memo(({ 
  message, 
  isLastMessage = false,
  isStreaming = false,
  questionText = '', // Default value if not provided
  isLoading = false,
  onFeedback,
  currentInteractionId,
  showFeedback = false,
  lastMessageRef
}) => {
  const isUser = message.role === 'user';
  const containerRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const screen = useScreen();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [isMounted, setIsMounted] = useState(false);

  // Verificar se estamos no cliente
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Determine if we should show buttons (not during loading or streaming)
  const shouldShowButtons = !isStreaming && !isLoading && message.role === 'assistant';
  
  // Quando uma resposta da IA for renderizada, adicionar um atributo no body
  // para que possamos detectar e ocultar botões
  useEffect(() => {
    if (!isMounted) return;
    
    if (!isUser && (isStreaming || isLoading)) {
      document.body.setAttribute('data-ai-responding', 'true');
      
      return () => {
        // Pequeno delay para evitar flickering
        setTimeout(() => {
          if (typeof document !== 'undefined') {
            document.body.removeAttribute('data-ai-responding');
          }
        }, 500);
      };
    }
  }, [isUser, isStreaming, isLoading, message.content, isMounted]);

  // Message animation variants with improved physics
  const messageVariants = {
    hidden: { 
      opacity: 0, 
      y: 20,
      scale: 0.97
    },
    visible: { 
      opacity: 1, 
      y: 0,
      scale: 1,
      transition: { 
        type: 'spring',
        damping: 20,
        stiffness: 300,
        duration: 0.4
      }
    },
    exit: { 
      opacity: 0,
      y: -10,
      transition: { duration: 0.3 } 
    }
  };

  // Button animation variants
  const buttonVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: { 
      opacity: 1, 
      scale: 1,
      transition: { type: 'spring', stiffness: 400, damping: 25 }
    },
    hover: { 
      scale: 1.1,
      backgroundColor: 'rgba(255, 255, 255, 0.15)',
      transition: { duration: 0.2 } 
    },
    tap: { scale: 0.95 }
  };

  // Avatar animation variants
  const avatarVariants = {
    hidden: { opacity: 0, scale: 0.5 },
    visible: { 
      opacity: 1, 
      scale: 1,
      transition: { type: 'spring', stiffness: 500, damping: 25, delay: 0.1 }
    }
  };

  // Remove unnecessary scroll manipulation
  useEffect(() => {
    // This component should NOT control scroll, only display content
  }, [isLastMessage, isStreaming]);

  // Helper function to truncate text if needed
  const truncateText = (text: string, maxLength: number): string => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - 3) + '...';
  };

  // Function to copy message to clipboard
  const copyToClipboard = () => {
    const textToCopy = questionText 
      ? `Pergunta: ${questionText}\n\nResposta da Byblia:\n${message.content}\n\n— Enviado via Byblia (https://byblia.com/)`
      : `${message.content}\n\n— Enviado via Byblia (https://byblia.com/)`;
      
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(textToCopy)
        .then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        })
        .catch(err => {
          console.error('Erro ao copiar texto: ', err);
        });
    } else {
      const textArea = document.createElement("textarea");
      textArea.value = textToCopy;
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

  // Function to share via WhatsApp
  const shareViaWhatsApp = () => {
    const messageToShare = questionText 
      ? `Pergunta: ${questionText}\n\nResposta da Byblia:\n${message.content}`
      : `Mensagem da Byblia:\n\n${message.content}`;
    
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(
      messageToShare + '\n\n— Enviado via Byblia (https://byblia.com/)'
    )}`;
    
    window.open(whatsappUrl, '_blank');
  };

  const toggleOptions = () => {
    setShowOptions(!showOptions);
  };

  // Static properties based on message role
  const avatarText = isUser ? 'U' : 'B';
  const avatarBg = isUser 
    ? 'bg-gray-800 text-white dark:bg-gray-600' 
    : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-200';

  return (
    <motion.div 
      ref={lastMessageRef || containerRef}
      className={cn(
        "message-item w-full max-w-full flex py-5 first:pt-0 last:pb-0",
        isUser ? "justify-end" : "justify-start"
      )}
      data-user-message={isUser}
      data-message-id={message.id}
      variants={messageVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      layout
    >
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className={cn(
          "message-container flex gap-3 max-w-[90%] sm:max-w-[85%] md:max-w-[80%]",
          isUser ? "flex-row-reverse" : "flex-row"
        )}
      >
        {/* Simple Avatar */}
        <div className="flex-shrink-0 w-8 h-8">
          <div className={cn(
            "h-8 w-8 rounded-md overflow-hidden border dark:border-gray-700 flex items-center justify-center",
            avatarBg,
            isUser ? "ml-2" : "mr-2"
          )}>
            {avatarText}
          </div>
        </div>

        {/* Message Content with Restored Background */}
        <div
          className={cn(
            "message-bubble flex-1 overflow-hidden rounded-md p-4 shadow-sm",
            isUser 
              ? "bg-gray-200 dark:bg-gray-800 border border-gray-300 dark:border-gray-700" 
              : "bg-gray-200 dark:bg-gray-800 border border-gray-300 dark:border-gray-700",
            isUser ? "rounded-tr-sm" : "rounded-tl-sm",
            "pb-5"
          )}
          style={{
            boxShadow: isDark 
              ? '0 1px 3px rgba(0,0,0,0.2)' 
              : '0 1px 3px rgba(0,0,0,0.1)'
          }}
        >
          {/* Message Content Wrapper */}
          <div className="message-content flex flex-col">
            {/* Role Indicator */}
            <div className={cn(
              "text-xs font-medium mb-1",
              isUser 
                ? "text-gray-700 dark:text-gray-300"
                : "text-gray-700 dark:text-gray-300"
            )}>
              {isUser ? 'Você' : 'Bybl.ia'}
            </div>

            {/* Actual Message Content - Always render with div wrapper for consistency */}
            <div className="mb-1 min-h-[1.5rem]">
              {message.content ? (
                <MessageText 
                  content={message.content} 
                  isStreaming={isStreaming && !isUser} 
                  isUser={isUser}
                />
              ) : (
                <div className="flex items-center h-6">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 rounded-full bg-gray-300 dark:bg-gray-600 animate-pulse"></div>
                    <div className="w-2 h-2 rounded-full bg-gray-300 dark:bg-gray-600 animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                    <div className="w-2 h-2 rounded-full bg-gray-300 dark:bg-gray-600 animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                  </div>
                </div>
              )}
            </div>
            
            {/* Action Buttons for assistant messages */}
            {shouldShowButtons && (
              <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-800">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  {/* Feedback buttons */}
                  {showFeedback && onFeedback && (
                    <FeedbackButtons onFeedback={onFeedback} />
                  )}
                  
                  {/* Copy and share buttons */}
                  <div className="flex items-center gap-2 ml-auto">
                    {/* Copy button */}
                    <button
                      onClick={copyToClipboard}
                      className={cn(
                        "group flex items-center justify-center p-1.5 rounded",
                        "hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors",
                        "text-gray-500 dark:text-gray-400"
                      )}
                      aria-label="Copiar mensagem"
                    >
                      {copied ? (
                        <Check size={16} className="text-green-600 dark:text-green-500" />
                      ) : (
                        <Copy size={16} className="group-hover:text-gray-700 dark:group-hover:text-gray-300" />
                      )}
                    </button>
                    
                    {/* WhatsApp button */}
                    <button
                      onClick={shareViaWhatsApp}
                      className={cn(
                        "group flex items-center justify-center p-1.5 rounded",
                        "hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors",
                        "text-gray-500 dark:text-gray-400"
                      )}
                      aria-label="Compartilhar via WhatsApp"
                    >
                      <FaWhatsapp size={16} className="group-hover:text-gray-700 dark:group-hover:text-gray-300" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
});

// Displaying the component name in React DevTools
MessageItem.displayName = 'MessageItem';

export default MessageItem;