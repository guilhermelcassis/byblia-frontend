import React, { useState, FormEvent, useEffect, useRef } from 'react';
import { FaArrowRight, FaExclamationTriangle } from 'react-icons/fa';
import { useScreen } from '@/app/page';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  isLoading: boolean;
}

// Constantes de validação ajustadas
const MAX_MESSAGE_LENGTH = 1000; // Aumentado para 1000 caracteres (era 500)
const MIN_MESSAGE_LENGTH = 2; // Mensagem precisa ter pelo menos 2 caracteres
// Reduzido para padrões mais críticos apenas
const SUSPICIOUS_PATTERNS = [
  /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, // Tags de script
  /javascript:/gi, // javascript: URLs
  /eval\(.*\)/gi, // Chamadas eval()
  /onload=/gi, // Eventos onload
  /\{\{.*\}\}/gi, // Padrões de template/interpolação que podem causar problemas
  /\$\{.*\}/gi,  // Template literals JavaScript
];

// Caracteres especiais que podem causar problemas na API
const POTENTIALLY_PROBLEMATIC_CHARS = /[\u0000-\u001F\u007F-\u009F\u2028\u2029]/g;

const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, isLoading }) => {
  const [inputValue, setInputValue] = useState('');
  const [charCount, setCharCount] = useState(0);
  const [validationError, setValidationError] = useState('');
  const [consecutiveRequests, setConsecutiveRequests] = useState(0);
  const [lastRequestTime, setLastRequestTime] = useState(0);
  const [isFocused, setIsFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const screen = useScreen();

  useEffect(() => {
    setCharCount(inputValue.length);
    
    // Limpar erro quando o usuário começa a digitar
    if (validationError) {
      setValidationError('');
    }
  }, [inputValue, validationError]);

  // Auto-resize textarea when content changes
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      // Reset height to auto to get the correct scrollHeight
      textarea.style.height = 'auto';
      
      // Set a smaller max height in landscape mode
      const maxHeight = screen.isLandscape ? 120 : 300;
      
      // Set height to scrollHeight to fit content, but respect max height
      textarea.style.height = `${Math.max(screen.isLandscape ? 48 : 64, Math.min(textarea.scrollHeight, maxHeight))}px`;
    }
  }, [inputValue, screen.isLandscape]);

  // Validação de segurança para entrada do usuário
  const validateInput = (text: string): boolean => {
    // Verificar tamanho mínimo
    if (text.trim().length < MIN_MESSAGE_LENGTH) {
      setValidationError(`A mensagem deve ter pelo menos ${MIN_MESSAGE_LENGTH} caracteres.`);
      return false;
    }
    
    // Verificar se o tamanho da mensagem está dentro do limite
    if (text.length > MAX_MESSAGE_LENGTH) {
      setValidationError(`A mensagem deve ter no máximo ${MAX_MESSAGE_LENGTH} caracteres.`);
      return false;
    }
    
    // Verificar caracteres potencialmente problemáticos
    if (POTENTIALLY_PROBLEMATIC_CHARS.test(text)) {
      setValidationError('Sua mensagem contém caracteres especiais não permitidos.');
      return false;
    }
    
    // Verificar padrões suspeitos
    for (const pattern of SUSPICIOUS_PATTERNS) {
      if (pattern.test(text)) {
        setValidationError('Sua mensagem contém conteúdo não permitido.');
        return false;
      }
    }
    
    // Verificar sequências de caracteres repetidos (pode indicar spam)
    const repeatedCharsMatch = text.match(/(.)\1{20,}/);
    if (repeatedCharsMatch) {
      setValidationError('Sua mensagem contém muitos caracteres repetidos.');
      return false;
    }
    
    return true;
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    
    if (inputValue.trim() && !isLoading) {
      // Validar entrada antes de enviar
      if (!validateInput(inputValue)) {
        return;
      }
      
      // Verificar frequência de requisições (proteção adicional de throttling)
      const now = Date.now();
      if (now - lastRequestTime < 500) { // Reduzido para 500ms (era 1000ms)
        setConsecutiveRequests(prev => prev + 1);
        
        if (consecutiveRequests > 10) { // Aumentado para 10 (era 5)
          setValidationError('Você está enviando mensagens muito rapidamente. Por favor, aguarde um momento.');
          return;
        }
      } else {
        // Resetar contador se o tempo entre requisições for adequado
        setConsecutiveRequests(0);
      }
      
      setLastRequestTime(now);
      
      // Sanitização menos restritiva
      let sanitizedInput = inputValue.trim();
      
      // Remover caracteres especiais não imprimíveis que podem causar erros na API
      sanitizedInput = sanitizedInput.replace(POTENTIALLY_PROBLEMATIC_CHARS, '');
      
      // Verificar apenas por scripts e outras injeções perigosas
      sanitizedInput = sanitizedInput
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/javascript:/gi, 'blocked-js:')
        .replace(/on\w+=/gi, 'data-blocked-handler=');
      
      onSendMessage(sanitizedInput);
      setInputValue('');

      // Reset textarea height after sending
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleFocus = () => {
    setIsFocused(true);
  };

  const handleBlur = () => {
    setIsFocused(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    
    // Prevenir caracteres especiais que causam problemas antes mesmo do envio
    if (POTENTIALLY_PROBLEMATIC_CHARS.test(newValue)) {
      const sanitized = newValue.replace(POTENTIALLY_PROBLEMATIC_CHARS, '');
      setInputValue(sanitized);
      if (sanitized !== newValue) {
        setValidationError('Alguns caracteres especiais foram removidos pois não são permitidos.');
        setTimeout(() => setValidationError(''), 3000);
      }
    } else {
      setInputValue(newValue);
    }
  };
  
  // Handle keyboard shortcuts
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Send message on Enter key (without Shift)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as unknown as FormEvent);
    }
  };

  return (
    <div className="w-full mobile-input-container">
      <div className={`relative bg-[#f5f5f7] rounded-2xl shadow-sm border ${validationError ? 'border-red-500' : 'border-gray-200'} w-full mx-auto transition-all ${isFocused ? 'ring-2 ring-bible-brown/20' : ''}`}>
        <form 
          onSubmit={handleSubmit} 
          className="flex items-start bg-transparent w-full mx-auto transition-all"
        >
          <textarea
            ref={textareaRef}
            value={inputValue}
            onChange={handleInputChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            placeholder={screen.isLandscape ? "Digite sua pergunta..." : "Faça uma pergunta, peça conselhos ou compartilhe um problema"}
            className={`flex-grow ${screen.isLandscape ? 'py-2' : 'py-3'} px-3 bg-transparent outline-none placeholder-gray-500 text-gray-800 text-sm font-normal rounded-2xl resize-none overflow-hidden w-full`}
            disabled={isLoading}
            maxLength={MAX_MESSAGE_LENGTH}
            aria-describedby="message-validation"
            rows={1}
            style={{ 
              minHeight: screen.isLandscape ? '42px' : '64px',
              maxHeight: screen.isLandscape ? '120px' : '300px',
              wordWrap: 'break-word',
              lineHeight: screen.isLandscape ? '1.3' : '1.4',
              paddingRight: screen.isLandscape ? '40px' : '60px' // Espaço para o botão
            }}
          />
          
          {/* Botão estilo DeepSeek - posicionado dentro do input */}
          <button
            type="submit"
            disabled={!inputValue.trim() || isLoading || charCount > MAX_MESSAGE_LENGTH || charCount < MIN_MESSAGE_LENGTH}
            className={`absolute ${screen.isLandscape ? 'right-2 top-1/2 transform -translate-y-1/2' : 'right-3 bottom-3'} w-8 h-8 md:w-10 md:h-10 flex items-center justify-center rounded-full transition-all z-10 ${
              !inputValue.trim() || isLoading || charCount > MAX_MESSAGE_LENGTH || charCount < MIN_MESSAGE_LENGTH
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : 'bg-bible-brown text-white hover:bg-bible-darkbrown'
            }`}
            style={{
              width: screen.isLandscape ? '32px' : '',
              height: screen.isLandscape ? '32px' : ''
            }}
            aria-label="Enviar mensagem"
          >
            <FaArrowRight size={screen.isLandscape ? 14 : 18} />
          </button>
        </form>
      </div>
      
      {validationError && (
        <div 
          id="message-validation" 
          className="flex items-center justify-center space-x-1 text-red-500 text-xs mt-2 text-center"
          role="alert"
        >
          <FaExclamationTriangle className="text-red-500" />
          <span>{validationError}</span>
        </div>
      )}
    </div>
  );
};

export default ChatInput; 