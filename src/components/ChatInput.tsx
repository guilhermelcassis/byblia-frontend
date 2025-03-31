import React, { useState, FormEvent, useEffect, useRef } from 'react';
import { FaArrowRight, FaExclamationTriangle } from 'react-icons/fa';
import { useScreen } from '@/hooks/useScreen';

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

  // Ajustar altura mínima para ser mais compacta na tela inicial em mobile portrait mode
  const getMinHeight = () => {
    if (screen.isMobile && !screen.isLandscape) {
      return '40px'; // Mais compacto em mobile portrait
    }
    return screen.isLandscape ? '42px' : '64px';
  };

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
    
    // Prevenir zoom no input ao receber foco
    if (screen.isMobile) {
      // Ajustar viewport para prevenir zoom
      const viewportMeta = document.querySelector('meta[name="viewport"]');
      if (viewportMeta) {
        viewportMeta.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no');
      }
      
      // Forçar zoom reset via CSS
      document.body.style.transform = 'scale(1)';
      document.body.style.transformOrigin = 'center top';
      
      // Garantir que o textarea tenha o tamanho adequado para prevenir zoom
      if (textareaRef.current) {
        textareaRef.current.style.fontSize = '16px';
      }
    }
  };

  const handleBlur = () => {
    setIsFocused(false);
    
    // Restaurar viewport após perder o foco
    if (screen.isMobile) {
      setTimeout(() => {
        const viewportMeta = document.querySelector('meta[name="viewport"]');
        if (viewportMeta) {
          viewportMeta.setAttribute('content', 'width=device-width, initial-scale=1.0, shrink-to-fit=no');
        }
      }, 300);
    }
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
    <div className="mobile-input-container">
      <form 
        onSubmit={handleSubmit} 
        className="flex items-start w-full relative chat-input-form"
        style={{
          padding: '16px',
          border: '1px solid rgba(0, 0, 0, 0.03)',
          borderRadius: '24px',
          boxShadow: '0 0 30px rgba(0, 0, 0, 0.04), 0 0 15px rgba(0, 0, 0, 0.02), 0 0 5px rgba(0, 0, 0, 0.01), inset 0 0 0 1px rgba(255, 255, 255, 0.9)',
          background: 'linear-gradient(to bottom, #ffffff, #fafafa)',
          marginTop: screen.isMobile ? '16px' : '32px',
          marginBottom: screen.isMobile ? '10px' : '20px',
          transition: 'all 0.4s cubic-bezier(0.19, 1, 0.22, 1)'
        }}
      >
        <textarea
          ref={textareaRef}
          value={inputValue}
          onChange={handleInputChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          placeholder={screen.isLandscape ? "Faça uma pergunta, peça conselhos ou compartilhe um problema" : "Faça uma pergunta, peça conselhos ou compartilhe um problema"}
          className={`flex-grow ${screen.isLandscape ? 'py-2' : 'py-3'} px-4 text-gray-800 ${screen.isMobile ? 'text-sm' : 'text-base'} font-normal resize-none overflow-hidden w-full rounded-3xl ${isFocused ? 'ring-2 ring-bible-brown/30' : ''} focus:outline-none transition-all duration-300`}
          style={{ 
            minHeight: getMinHeight(),
            maxHeight: screen.isLandscape ? '120px' : (screen.isMobile ? '300px' : '200px'),
            wordWrap: 'break-word',
            lineHeight: screen.isLandscape ? '1.3' : (screen.isMobile ? '1.4' : '1.5'),
            paddingRight: screen.isLandscape ? '40px' : '60px', // Espaço para o botão
            paddingLeft: '20px', // Um pouco mais de padding à esquerda para melhor equilíbrio visual
            boxShadow: 'none',
            background: 'linear-gradient(to bottom, #f0f0f0, #f5f5f5)',
            backgroundSize: '100% 200%',
            fontSize: screen.isMobile ? '16px' : '17px', // Fonte maior para desktop
            WebkitTextSizeAdjust: '100%', // Prevenir ajuste de texto
            transformOrigin: 'top center', // Ponto de origem para transformações
            transform: 'translateZ(0)', // Usar GPU para renderização
            touchAction: 'manipulation', // Otimizar comportamento de toque
            WebkitAppearance: 'none', // Remover estilo padrão do iOS
            border: 'none',
            borderRadius: '16px',
            caretColor: '#946A4A', // Cursor colorido para melhor visualização
            fontWeight: '400'
          }}
          inputMode="text"
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck="true"
          data-lpignore="true"
          disabled={isLoading}
          maxLength={MAX_MESSAGE_LENGTH}
          aria-describedby="message-validation"
          rows={1}
        />
        
        {/* Indicador sutil de "onde digitar" quando o campo está vazio */}
        {!inputValue && !isFocused && (
          <div 
            className="absolute pointer-events-none flex md:hidden"
            style={{
              left: '20px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'rgba(0, 0, 0, 0.35)',
              fontSize: screen.isMobile ? '14px' : '15px',
              fontStyle: 'italic',
              opacity: 0.7,
              fontWeight: '400',
              display: 'flex',
              alignItems: 'center',
              zIndex: 3
            }}
          >
            <span className="hidden sm:inline">Digite aqui para</span>
            <span className="inline sm:hidden">Digite para</span>
            <span className="ml-1 text-bible-brown/60 font-medium">conversar...</span>
          </div>
        )}
        
        {/* Botão com design profissional aprimorado */}
        <button
          type="submit"
          disabled={!inputValue.trim() || isLoading || charCount > MAX_MESSAGE_LENGTH || charCount < MIN_MESSAGE_LENGTH}
          className={`absolute flex items-center justify-center rounded-full transition-all z-[150] ${
            !inputValue.trim() || isLoading || charCount > MAX_MESSAGE_LENGTH || charCount < MIN_MESSAGE_LENGTH
              ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
              : 'bg-bible-brown text-white hover:bg-bible-darkbrown active:scale-95'
          }`}
          style={{
            width: screen.isMobile ? (screen.isLandscape ? '40px' : '46px') : '52px',
            height: screen.isMobile ? (screen.isLandscape ? '40px' : '46px') : '52px',
            transition: 'all 0.4s cubic-bezier(0.19, 1, 0.22, 1)',
            right: screen.isMobile ? (screen.isLandscape ? '12px' : '16px') : '18px',
            bottom: screen.isMobile ? (screen.isLandscape ? '50%' : '14px') : '50%',
            transform: (screen.isLandscape || !screen.isMobile) ? 'translateY(50%)' : 'none',
            boxShadow: '0 0 15px rgba(0, 0, 0, 0.08), 0 0 8px rgba(0, 0, 0, 0.04), inset 0 -2px 5px rgba(0, 0, 0, 0.08)'
          }}
          aria-label="Enviar mensagem"
        >
          <FaArrowRight size={screen.isMobile ? (screen.isLandscape ? 16 : 18) : 22} />
        </button>
      </form>
      
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

export default ChatInput
