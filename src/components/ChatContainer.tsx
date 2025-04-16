import React, { useRef, useEffect, useCallback, useState } from 'react';
import { ChatInput } from './ChatInput';
import { MessageItem } from './MessageItem';
import LoadingIndicator from './LoadingIndicator';
import ColdStartIndicator from './ColdStartIndicator';
import ErrorMessage from './ErrorMessage';
import useChat from '../hooks/useChat';
import { useScroll } from '../hooks/useScroll';
import { FaSyncAlt, FaArrowDown, FaBible, FaExclamationTriangle, FaInfo } from 'react-icons/fa';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import { useScreen } from '@/hooks/useScreen';
import { useTheme } from 'next-themes';
import { cn } from '../lib/utils';
import { BookOpen, Scroll, BookHeart, BookText, MessageSquareQuote, Quote, Info, Sparkles } from 'lucide-react';

// Animation variants for consistent effects
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { 
      duration: 0.5,
      when: "beforeChildren",
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] }
  }
};

const fadeInVariants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { duration: 0.3 }
  }
};

const slideUpVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.3, ease: "easeOut" } 
  }
};

const ChatContainer: React.FC = () => {
  const { state, sendUserMessage, submitFeedback } = useChat();
  const lastMessageRef = useRef<string>('');
  const screen = useScreen();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [streamHasNewContent, setStreamHasNewContent] = useState(false);
  const [userManuallyScrolled, setUserManuallyScrolled] = useState(false);
  const lastScrollPositionRef = useRef<number>(0);
  const controls = useAnimation();
  // Add a mounted state to prevent hydration mismatch
  const [isMounted, setIsMounted] = useState(false);
  // Add state to track if we're at the top of scroll
  const [isAtScrollTop, setIsAtScrollTop] = useState(true);
  
  // Enhanced scroll hook
  const { containerRef, userHasScrolled, scrollToBottom, isNearBottom, hasInvisibleNewContent, resetAutoScroll } = useScroll({
    isStreaming: state.isStreaming,
    messagesCount: state.messages.length,
    hasNewContent: streamHasNewContent,
    currentResponseText: state.currentResponse || ''
  });
  
  // Add scroll event listener to check if we're at the top
  useEffect(() => {
    if (!containerRef.current) return;
    
    // Apply smooth scroll CSS for better animation - use auto for mobile
    if (containerRef.current.style) {
      containerRef.current.style.scrollBehavior = screen.isMobile ? 'auto' : 'smooth';
      
      // Apply hardware acceleration for mobile
      if (screen.isMobile) {
        // Use a type assertion for the non-standard webkit property
        (containerRef.current.style as any).WebkitOverflowScrolling = 'touch';
        containerRef.current.style.transform = 'translateZ(0)';
      }
    }
    
    const checkScrollTop = () => {
      const scrollTop = containerRef.current?.scrollTop || 0;
      setIsAtScrollTop(scrollTop < 10); // Consider "at top" if scrolled less than 10px
    };
    
    const container = containerRef.current;
    container.addEventListener('scroll', checkScrollTop, { passive: true });
    
    // Initial check
    checkScrollTop();
    
    return () => {
      container.removeEventListener('scroll', checkScrollTop);
    };
  }, [containerRef.current, screen.isMobile]);
  
  // Mark component as mounted to prevent hydration issues
  useEffect(() => {
    setIsMounted(true);
  }, []);
  
  // Loading animation state
  const [loadingDots, setLoadingDots] = useState('');
  
  // Animate loading dots
  useEffect(() => {
    if (!isMounted) return;
    
    if (state.isLoading || state.isStreaming) {
      const interval = setInterval(() => {
        setLoadingDots(prev => {
          if (prev === '...') return '';
          if (prev === '..') return '...';
          if (prev === '.') return '..';
          return '.';
        });
      }, 500);
      
      return () => clearInterval(interval);
    }
  }, [state.isLoading, state.isStreaming, isMounted]);
  
  // Apply animation when messages change
  useEffect(() => {
    if (isMounted) {
      controls.start("visible");
    }
  }, [state.messages.length, controls, isMounted]);

  // Handle messages from streaming response
  useEffect(() => {
    if (!isMounted) return;
    
    if (state.currentResponse && state.currentResponse !== '') {
      // Use requestAnimationFrame for smoother updates
      requestAnimationFrame(() => {
        if (!userManuallyScrolled) {
          // Use auto scroll for mobile devices for better performance
          scrollToBottom({ behavior: "auto" });
        }
        setStreamHasNewContent(true);
      });
    }
  }, [state.currentResponse, userManuallyScrolled, scrollToBottom, isMounted]);

  // Handle completed message
  useEffect(() => {
    if (!state.isStreaming && streamHasNewContent) {
      setStreamHasNewContent(false);
      
      // Final scroll once streaming completes - use a slightly longer delay
      if (!userHasScrolled) {
        // Use longer delay on mobile
        setTimeout(() => scrollToBottom({ behavior: screen.isMobile ? "auto" : "smooth" }), 
          screen.isMobile ? 200 : 150);
      }
    }
  }, [state.isStreaming, streamHasNewContent, userHasScrolled, scrollToBottom, screen.isMobile]);

  // For welcome screen, scroll to bottom when message count changes
  useEffect(() => {
    if (state.messages.length === 0) {
      scrollToBottom({ behavior: "auto" });
    }
  }, [state.messages.length, scrollToBottom]);

  // Function to retry on error
  const handleRetry = () => {
    if (lastMessageRef.current) {
      sendUserMessage(lastMessageRef.current);
    } else {
      // If no message to retry, just reset the error state
      window.location.reload();
    }
  };

  // Submit feedback for assistant message
  const handleFeedback = async (isPositive: boolean): Promise<boolean> => {
    try {
      await submitFeedback(isPositive);
      return true;
    } catch (error) {
      console.error("Error submitting feedback:", error);
      return false;
    }
  };

  // Get error severity for the error message component
  const getErrorSeverity = (): 'error' | 'warning' | 'info' => {
    if (!state.error) return 'info';
    
    const errorLower = state.error.toLowerCase();
    
    if (
      errorLower.includes('servidor') ||
      errorLower.includes('conexão') ||
      errorLower.includes('indisponível') ||
      errorLower.includes('falha') ||
      errorLower.includes('não foi possível')
    ) {
      return 'error';
    }
    
    if (
      errorLower.includes('tente novamente') ||
      errorLower.includes('timeout') ||
      errorLower.includes('tempo limite')
    ) {
      return 'warning';
    }
    
    return 'info';
  };

  // Function to scroll to the last user message
  const scrollToLastUserMessage = useCallback(() => {
    if (containerRef.current && state.messages.length > 0) {
      // Reset user manually scrolled flag when sending a new message
      setUserManuallyScrolled(false);
      
      // Let the scrollToBottom from useScroll handle scrolling
      scrollToBottom({ behavior: screen.isMobile ? "auto" : "smooth" });
    }
  }, [state.messages.length, scrollToBottom, screen.isMobile]);

  // Wrapper for sending message and handling scroll
  const handleSendMessage = (message: string) => {
    // Save the last message to allow resending in case of error
    lastMessageRef.current = message;
    
    // Send the message
    sendUserMessage(message);
    
    // Reset zoom level to ensure proper visibility on mobile devices
    if (screen.isMobile) {
      // Prevent zooming by meta viewport tag update
      const viewportMeta = document.querySelector('meta[name="viewport"]');
      if (viewportMeta) {
        viewportMeta.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0');
      }
    }
    
    // Reset the user manual scroll flag
    setUserManuallyScrolled(false);
    
    // Scroll to the user's message with a small delay
    setTimeout(() => scrollToLastUserMessage(), 10);
  };

  // Is there a connection error?
  const hasConnectionError = state.error && (
    state.error.toLowerCase().includes('servidor') ||
    state.error.toLowerCase().includes('conexão') ||
    state.error.toLowerCase().includes('indisponível') ||
    state.error.toLowerCase().includes('tentando reconectar')
  );

  // Check if error is non-recoverable
  const isErrorNonRecoverable = hasConnectionError;

  // Show scroll to bottom button?
  const showScrollToBottomButton = userHasScrolled && state.messages.length > 1;

  // Handle scrolling to the bottom - now with option to reset auto scroll
  const handleScrollToBottom = (resetScroll: boolean) => {
    if (resetScroll) {
      resetAutoScroll(); // Use the new resetAutoScroll function
    } else {
      scrollToBottom({ behavior: screen.isMobile ? "auto" : "smooth" });
    }
  };

  // Ensure scrolling when messages change
  useEffect(() => {
    if (state.messages.length > 0 && !userHasScrolled) {
      handleScrollToBottom(false);
    }
  }, [state.messages.length, userHasScrolled]);

  // Only render the full chat UI after component is mounted
  if (!isMounted) {
    return (
      <div className="relative flex flex-col h-full w-full min-h-screen">
        <div className="flex-1 overflow-y-auto bg-white dark:bg-black">
          <div className="flex justify-center py-8">
            <div className="dot-elastic"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex flex-col h-full w-full min-h-screen inset-0 m-0 p-0">
      {/* Main message container with enhanced styling */}
      <div
        ref={containerRef}
        id="chat-messages"
        className={cn(
          "flex-1 overflow-y-auto",
          "px-3 sm:px-4 pb-32 pt-0", 
          "scroll-smooth",
          "scroll-behavior-smooth",
          "bg-white dark:bg-black",
          "mt-0",
          isAtScrollTop && state.messages.length > 0 ? "initial-padding" : ""
        )}
        style={{ 
          scrollBehavior: screen.isMobile ? 'auto' : 'smooth',
          marginTop: 0, 
          paddingTop: isAtScrollTop && state.messages.length === 0 ? '1.5rem' : 0,
          WebkitOverflowScrolling: 'touch', // For smooth scrolling on iOS
          transform: 'translateZ(0)',  // Hardware acceleration
          willChange: screen.isMobile ? 'transform' : 'auto',     // Hint for browser optimization
          transition: screen.isMobile ? 'none' : 'transform 0.2s ease-out' // Smooth transition for scrolling
        }}
      >
        {/* If there are messages, show them */}
        {state.messages.length > 0 && (
          <motion.div
            className={`flex flex-col gap-4 max-w-3xl mx-auto pb-16 ${isAtScrollTop ? 'pt-2' : 'pt-0'}`}
            variants={containerVariants}
            initial="hidden"
            animate={controls}
            style={{
              willChange: 'transform, opacity',
              transformOrigin: 'top',
              backfaceVisibility: 'hidden'
            }}
          >
            {state.messages.map((message, index) => (
              <motion.div 
                key={message.id || index} 
                variants={itemVariants}
                className={`message-wrapper ${index === 0 && isAtScrollTop ? 'mt-2' : ''}`}
                style={{
                  willChange: 'transform, opacity',
                  backfaceVisibility: 'hidden'
                }}
              >
                <MessageItem
                  message={message}
                  isLastMessage={index === state.messages.length - 1}
                  isStreaming={state.isStreaming && index === state.messages.length - 1}
                  onFeedback={handleFeedback}
                  showFeedback={!state.isStreaming && message.role === 'assistant'}
                  questionText={message.role === 'assistant' && index > 0 ? state.messages[index - 1].content : ''}
                  isLoading={state.isLoading}
                />
              </motion.div>
            ))}
            
            {/* Loading indicator shown when streaming is complete but we're still processing */}
            {state.isLoading && !state.isStreaming && (
              <motion.div 
                className="flex justify-center py-8"
                variants={fadeInVariants}
              >
                <div className="dot-elastic"></div>
              </motion.div>
            )}
            
            {/* Error message */}
            {state.error && !isErrorNonRecoverable && (
              <motion.div 
                className="my-4 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg text-red-700 dark:text-red-300 text-sm flex items-center gap-2"
                variants={slideUpVariants}
              >
                <FaExclamationTriangle className="text-red-600 dark:text-red-400 shrink-0" />
                <span>Erro: {state.error || "Ocorreu um erro no processamento da solicitação."}</span>
                <button 
                  onClick={handleRetry} 
                  className="ml-auto bg-red-100 dark:bg-red-800/50 text-red-600 dark:text-red-300 px-3 py-1 rounded text-xs font-medium hover:bg-red-200 dark:hover:bg-red-700/50 transition-colors"
                >
                  Tentar novamente
                </button>
              </motion.div>
            )}
            
            {/* Cold start indicator */}
            {state.isColdStart && (
              <motion.div 
                className="my-4 p-4 bg-blue-50 dark:bg-black/80 rounded-lg text-blue-700 dark:text-gray-200 text-sm flex items-center gap-2 dark:border dark:border-white/20"
                variants={slideUpVariants}
              >
                <FaInfo className="text-blue-600 dark:text-white shrink-0" />
                <span>Primeira mensagem pode demorar um pouco mais enquanto o serviço é inicializado.</span>
              </motion.div>
            )}
          </motion.div>
        )}
        
        {/* Empty state with centered chat input */}
        {state.messages.length === 0 && !state.isLoading && (
          <div className="h-full w-full relative overflow-hidden">
            {/* Remove ambient background elements */}

            {/* Centered input with absolute positioning */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full max-w-xl px-4 z-10">
              <motion.div
                className="flex flex-col items-center"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
              >
                {/* Logo and title area - above centered input */}
                <motion.div className="text-center mb-10 pt-8" variants={itemVariants}>
                  
                  <motion.h2 
                    className="text-3xl sm:text-4xl font-semibold mb-3"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                  >
                    Olá, sou a <span className="bg-clip-text text-transparent bg-gradient-to-r from-gray-700 to-black dark:from-gray-300 dark:to-white font-boldonse animate-gradient-text">Bybl.ia</span>
                  </motion.h2>
                  
                  <motion.p 
                    className="text-gray-600 dark:text-white text-center max-w-md mx-auto text-lg"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                  >
                    Seu conselheiro bíblico
                  </motion.p>
                </motion.div>
                
                {/* Perfectly centered input */}
                <motion.div
                  className="w-full"
                  variants={itemVariants}
                >
                  <motion.div 
                    className={cn(
                      "chat-input-container",
                      "w-full bg-transparent rounded-2xl",
                      "transition-opacity transition-transform duration-300 ease-out"
                    )}
                    transition={{
                      type: "spring",
                      stiffness: 500,
                      damping: 30
                    }}
                  >
                    <ChatInput 
                      onSubmit={handleSendMessage}
                      isLoading={state.isLoading || state.isStreaming}
                      autoFocus={true}
                      placeholderText="Como posso ajudar hoje?"
                    />
                  </motion.div>
                </motion.div>
              </motion.div>
            </div>
          </div>
        )}
      </div>
      
      {/* Input area at the bottom, shown during conversations or when loading messages */}
      {(state.messages.length > 0 || state.isLoading) && (
        <div className="fixed bottom-0 left-0 right-0 p-3 z-30 bg-white dark:bg-black pt-4 border-t dark:border-gray-800">
          <div className="max-w-2xl mx-auto">
            <motion.div
              className={cn(
                "chat-input-container",
                "w-full bg-transparent rounded-2xl",
                "transition-opacity transition-transform duration-300 ease-out"
              )}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              <ChatInput 
                onSubmit={handleSendMessage} 
                isLoading={state.isLoading || state.isStreaming}
                autoFocus={true}
                placeholderText="Digite sua pergunta..."
              />
            </motion.div>
          </div>
        </div>
      )}
      
      {/* Connection error button */}
      <AnimatePresence>
        {isErrorNonRecoverable && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.4, type: "spring", stiffness: 300, damping: 25 }}
            className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50"
          >
            <motion.button
              onClick={handleRetry}
              className="bg-red-50 text-red-600 border border-red-200 px-4 py-2 rounded-full shadow-md flex items-center gap-2 hover:bg-red-100 transition-colors dark:bg-red-950 dark:border-red-800 dark:text-red-300"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
            >
              <FaSyncAlt size={14} className="text-red-500 animate-spin-slow" />
              <span>Erro de conexão - Tentar novamente</span>
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Enhanced scroll to bottom button */}
      <AnimatePresence>
        {(showScrollToBottomButton || (state.isStreaming && hasInvisibleNewContent)) && (
          <motion.button
            className="fixed right-4 bottom-28 p-3 rounded-full shadow-lg text-white hover:shadow-xl transition-shadow duration-200 ease-out bg-gray-800 dark:bg-black hover:bg-black dark:hover:bg-gray-900 dark:border dark:border-white/20"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.2 }}
            onClick={() => handleScrollToBottom(true)}
            aria-label="Scroll to bottom and resume auto-scroll"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <FaArrowDown size={14} className="text-white" />
          </motion.button>
        )}
      </AnimatePresence>
      
      {/* New content indicator when user has scrolled up during streaming */}
      <AnimatePresence>
        {hasInvisibleNewContent && state.isStreaming && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.3, type: "spring", stiffness: 500, damping: 30 }}
            className="fixed bottom-28 left-1/2 transform -translate-x-1/2 z-50"
          >
            <motion.button
              onClick={() => handleScrollToBottom(true)}
              className="bg-gray-800 text-white dark:bg-gray-900 dark:text-gray-100 px-4 py-2 rounded-full shadow-md flex items-center gap-2 hover:bg-gray-700 dark:hover:bg-gray-800 transition-colors border border-gray-700 dark:border-gray-600"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
            >
              <div className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-white dark:bg-gray-300 animate-pulse"></div>
                <div className="w-1.5 h-1.5 rounded-full bg-white dark:bg-gray-300 animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-1.5 h-1.5 rounded-full bg-white dark:bg-gray-300 animate-pulse" style={{ animationDelay: '0.4s' }}></div>
              </div>
              <span>Nova resposta está sendo gerada</span>
              <FaArrowDown size={12} className="text-white dark:text-gray-300 ml-1" />
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ChatContainer; 