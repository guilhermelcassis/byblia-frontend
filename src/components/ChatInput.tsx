import React, { useRef, useState, useEffect } from 'react';
import { Send, AlertTriangle, Check, Sparkles, Search } from 'lucide-react';
import sanitizeHtml from 'sanitize-html';
import { sanitizeOptions } from '../lib/sanitize';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from 'next-themes';

interface ChatInputProps {
  isLoading?: boolean;
  onSubmit: (message: string) => void;
  isDisabled?: boolean;
  autoFocus?: boolean;
  useEnterToSend?: boolean;
  placeholderText?: string;
}

// Validation constants
const MIN_MESSAGE_LENGTH = 2;
const MAX_MESSAGE_LENGTH = 1000;
const SUSPICIOUS_PATTERNS = [
  /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
  /javascript:/gi,
  /eval\(/gi,
  /on\w+=/gi
];

export const ChatInput: React.FC<ChatInputProps> = ({
  isLoading = false,
  onSubmit,
  isDisabled = false,
  autoFocus = true,
  useEnterToSend = true,
  placeholderText = "Digite sua pergunta bíblica aqui..."
}) => {
  const [value, setValue] = useState<string>('');
  const [charCount, setCharCount] = useState<number>(0);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isFocused, setIsFocused] = useState<boolean>(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const [showSuccessIcon, setShowSuccessIcon] = useState<boolean>(false);
  const [textareaHeight, setTextareaHeight] = useState<number>(56); // Reduced initial height
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // Validação de entrada
  const validateInput = (text: string): boolean => {
    if (text.trim().length < MIN_MESSAGE_LENGTH) {
      setValidationError(`Mensagem deve ter pelo menos ${MIN_MESSAGE_LENGTH} caracteres.`);
      return false;
    }
    
    if (text.length > MAX_MESSAGE_LENGTH) {
      setValidationError(`Mensagem não pode exceder ${MAX_MESSAGE_LENGTH} caracteres.`);
      return false;
    }
    
    for (const pattern of SUSPICIOUS_PATTERNS) {
      if (pattern.test(text)) {
        setValidationError('Mensagem contém conteúdo potencialmente prejudicial.');
        return false;
      }
    }
    
    setValidationError(null);
    return true;
  };

  // Improved text area height calculator with smoother transitions
  useEffect(() => {
    if (textareaRef.current) {
      const textarea = textareaRef.current;
      
      // Save the current scroll position
      const scrollPos = textarea.scrollTop;
      
      // Reset height temporarily to get accurate scrollHeight
      textarea.style.height = 'auto';
      
      // Calculate new height with better min/max constraints
      // The +2 provides a small buffer to avoid flickering
      const newHeight = Math.min(Math.max(56, textarea.scrollHeight + 2), 150);
      
      // Set the height back
      textarea.style.height = `${newHeight}px`;
      
      // Restore scroll position
      textarea.scrollTop = scrollPos;
      
      // Only update state if change is significant to avoid re-renders
      if (Math.abs(newHeight - textareaHeight) > 1) {
        setTextareaHeight(newHeight);
      }
    }
  }, [value, textareaHeight]);

  // Submit handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isLoading || isDisabled || !value.trim()) return;
    
    if (!validateInput(value)) return;
    
    const sanitizedMessage = sanitizeHtml(value, sanitizeOptions);
    
    setShowSuccessIcon(true);
    setTimeout(() => setShowSuccessIcon(false), 1000);
    
    onSubmit(sanitizedMessage);
    setValue('');
    setCharCount(0);
    setTextareaHeight(56); // Reset to initial height
    
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  // Get character count color with better ranges
  const getCharCountColor = (): string => {
    if (charCount > MAX_MESSAGE_LENGTH * 0.9) return 'text-red-500 dark:text-red-400';
    if (charCount > MAX_MESSAGE_LENGTH * 0.7) return 'text-amber-500 dark:text-amber-400';
    return 'text-gray-400 dark:text-gray-500';
  };

  // Enhanced input change handler with debounced validation
  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setValue(newValue);
    setCharCount(newValue.length);
    
    if (validationError) {
      // Only validate if there's an existing error to avoid unnecessary validations
      validateInput(newValue);
    }
  };

  // Key press handler with Enter support
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (useEnterToSend && e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      formRef.current?.requestSubmit();
    }
  };

  const handleFocus = () => setIsFocused(true);
  const handleBlur = () => setIsFocused(false);

  // Improved placeholder animations
  const placeholderVariants = {
    active: {
      opacity: 0.8,
      y: 0,
      scale: 1,
    },
    inactive: {
      opacity: 0.5,
      y: 0,
      scale: 1,
    },
    exit: {
      opacity: 0,
      y: -10,
      scale: 0.95,
    }
  };

  return (
    <div className="w-full chat-input-wrapper mb-6">
      <AnimatePresence>
        {validationError && (
          <motion.div 
            className="bg-red-50 dark:bg-black border-l-4 border-red-500 dark:border-red-600 text-red-600 dark:text-red-300 px-4 py-2 mb-2 text-sm flex items-center gap-2 rounded-r-lg"
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.3, type: "spring", stiffness: 500, damping: 25 }}
          >
            <AlertTriangle size={14} className="shrink-0" />
            <span>{validationError}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <form ref={formRef} onSubmit={handleSubmit} className="relative">
        {/* Enhanced container with shadow and blur effects */}
        <div 
          className={cn(
            "relative w-full rounded-lg border overflow-hidden",
            "transition-all duration-200",
            "backdrop-blur-sm",
            isDark 
              ? "bg-gray-950/90 backdrop-blur-sm" 
              : "bg-white/95 backdrop-blur-sm",
            isDark 
              ? isFocused 
                ? "border-gray-600 shadow-[0_0_0_1px_rgba(75,85,99,0.2),0_2px_10px_rgba(0,0,0,0.2)]" 
                : "border-gray-800 shadow-lg shadow-black/10" 
              : isFocused 
                ? "border-gray-400 shadow-[0_0_0_1px_rgba(156,163,175,0.2),0_2px_14px_rgba(0,0,0,0.1)]" 
                : "border-gray-200 shadow-md shadow-black/5"
          )}
          style={{
            height: `${textareaHeight}px`,
            minHeight: '56px',
            boxShadow: isFocused 
              ? isDark 
                ? '0 0 0 1px rgba(75,85,99,0.3), 0 4px 20px rgba(0,0,0,0.3), 0 0 15px rgba(0,0,0,0.2)' 
                : '0 0 0 1px rgba(156,163,175,0.2), 0 4px 20px rgba(0,0,0,0.08), 0 0 15px rgba(0,0,0,0.05)'
              : isDark
                ? '0 4px 12px rgba(0,0,0,0.25)'
                : '0 4px 12px rgba(0,0,0,0.07)'
          }}
        >
          <AnimatePresence>
            {!value && !isLoading && (
              <div 
                className="absolute left-5 top-1/2 transform -translate-y-1/2 flex items-center text-gray-400 dark:text-gray-500 pointer-events-none z-10 gap-2.5"
              >
                <Search size={18} className="opacity-70" />
                <span className="text-base font-normal">{placeholderText}</span>
              </div>
            )}
          </AnimatePresence>
          
          <textarea
            ref={textareaRef}
            value={value}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            onFocus={handleFocus}
            onBlur={handleBlur}
            placeholder=""
            disabled={isDisabled || isLoading}
            autoFocus={autoFocus}
            className={cn(
              "w-full h-full resize-none py-3 px-5", 
              "text-gray-900 dark:text-white",
              "placeholder-transparent",
              "outline-none border-0",
              "font-normal text-base leading-relaxed",
              "bg-transparent",
              "transition-all duration-300 ease-out",
              isDisabled && "opacity-70 pointer-events-none",
              isFocused ? "pl-5" : "pl-5",
              value ? "pl-5" : "pl-14"
            )}
            style={{ 
              overflow: value.length > 100 ? 'auto' : 'hidden',
              paddingRight: '56px', // Fixed padding to accommodate the button
            }}
          />
        </div>

        {/* Enhanced button with better styling */}
        <button
          type="submit"
          className={cn(
            "absolute right-3 top-[50%] transform -translate-y-1/2 w-10 h-10", 
            "rounded-md",
            "transition-all duration-200 z-10",
            "flex items-center justify-center",
            "shadow-sm",
            isLoading || isDisabled || value.trim().length < MIN_MESSAGE_LENGTH 
              ? "bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500"
              : "bg-gray-800 dark:bg-gray-700 text-white hover:bg-gray-700 dark:hover:bg-gray-600 active:scale-95"
          )}
          disabled={isLoading || isDisabled || value.trim().length < MIN_MESSAGE_LENGTH}
          style={{
            boxShadow: isLoading || isDisabled || value.trim().length < MIN_MESSAGE_LENGTH
              ? 'none'
              : isDark
                ? '0 1px 3px rgba(0,0,0,0.3)'
                : '0 1px 3px rgba(0,0,0,0.1)'
          }}
        >
          {isLoading ? (
            <div className="w-5 h-5 border-2 border-gray-400 dark:border-gray-500 border-t-transparent rounded-full animate-spin" />
          ) : showSuccessIcon ? (
            <Check size={20} className="text-white" />
          ) : (
            <div
              className="flex items-center justify-center"
            >
              <Send size={18} className={value.trim().length < MIN_MESSAGE_LENGTH ? "text-gray-400 dark:text-gray-500" : "text-white"} />
            </div>
          )}
        </button>

        {/* Simple character counter */}
        <AnimatePresence>
          {charCount > 0 && (
            <div 
              className={`absolute right-5 bottom-[-22px] text-xs font-medium ${getCharCountColor()}`}
            >
              {charCount}/{MAX_MESSAGE_LENGTH}
            </div>
          )}
        </AnimatePresence>
      </form>
    </div>
  );
};