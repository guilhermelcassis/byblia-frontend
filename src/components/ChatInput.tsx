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
  const [isTyping, setIsTyping] = useState(false);
  const [showRipple, setShowRipple] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const screen = useScreen();

  useEffect(() => {
    setCharCount(inputValue.length);
    
    // Limpar erro quando o usuário começa a digitar
    if (validationError) {
      setValidationError('');
    }

    // Detectar quando o usuário está digitando para animar o input
    if (inputValue.length > 0) {
      setIsTyping(true);
      const timer = setTimeout(() => setIsTyping(false), 1000);
      return () => clearTimeout(timer);
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
      // Criar efeito de ripple no botão
      if (buttonRef.current) {
        setShowRipple(true);
        setTimeout(() => setShowRipple(false), 400);
      }

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

  // Calcular a cor da borda baseada no comprimento da mensagem
  const getBorderStyle = () => {
    if (isFocused) {
      if (charCount > MAX_MESSAGE_LENGTH) {
        return '2px solid rgba(220, 38, 38, 0.5)'; // Vermelho para erro
      } 
      return '2px solid rgba(148, 106, 74, 0.6)'; // Marrom bíblia quando focado
    }
    if (isTyping) {
      return '1px solid rgba(148, 106, 74, 0.4)'; // Sutilmente destacado enquanto digita
    }
    return '1px solid rgba(235, 235, 235, 0.8)'; // Default
  };

  // Calcular a cor de fundo do input baseado no estado
  const getInputBackground = () => {
    if (isFocused) {
      return 'linear-gradient(to bottom, #ffffff, #f9f7f5)';
    }
    if (isTyping) {
      return 'linear-gradient(to bottom, #f9f7f5, #f7f7f7)';
    }
    return 'linear-gradient(to bottom, #f7f7f7, #f5f5f5)';
  };

  // Classe para o contador de caracteres
  const getCharCountClass = () => {
    if (charCount > MAX_MESSAGE_LENGTH * 0.9) {
      return 'text-red-500 font-medium';
    }
    if (charCount > MAX_MESSAGE_LENGTH * 0.7) {
      return 'text-yellow-600';
    }
    return 'text-gray-400';
  };

  return (
    <div className="mobile-input-container">
      <form 
        onSubmit={handleSubmit} 
        className="flex items-start w-full relative chat-input-form"
        style={{
          padding: '16px',
          border: '1px solid rgba(0, 0, 0, 0.08)',
          borderRadius: '24px',
          boxShadow: isFocused ? '0 4px 20px rgba(0, 0, 0, 0.08)' : 'none',
          background: '#ffffff',
          marginTop: screen.isMobile ? '16px' : '32px',
          marginBottom: screen.isMobile ? '10px' : '20px',
          transition: 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)'
        }}
      >
        <div className="relative flex-grow">
          <textarea
            ref={textareaRef}
            value={inputValue}
            onChange={handleInputChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            placeholder={screen.isLandscape ? "Faça uma pergunta, peça conselhos ou compartilhe um problema" : "Faça uma pergunta, peça conselhos ou compartilhe um problema"}
            className={`flex-grow ${screen.isLandscape ? 'py-2' : 'py-3'} px-4 text-gray-800 ${screen.isMobile ? 'text-sm' : 'text-base'} font-normal resize-none overflow-hidden w-full rounded-3xl focus:outline-none transition-all duration-300`}
            style={{ 
              minHeight: getMinHeight(),
              maxHeight: screen.isLandscape ? '120px' : (screen.isMobile ? '300px' : '200px'),
              wordWrap: 'break-word',
              lineHeight: screen.isLandscape ? '1.3' : (screen.isMobile ? '1.4' : '1.5'),
              paddingRight: screen.isLandscape ? '40px' : '60px', // Espaço para o botão
              paddingLeft: '20px', // Um pouco mais de padding à esquerda para melhor equilíbrio visual
              boxShadow: isFocused ? 'inset 0 1px 3px rgba(0, 0, 0, 0.05)' : 'none',
              background: getInputBackground(),
              fontSize: screen.isMobile ? '16px' : '17px', // Fonte maior para desktop
              WebkitTextSizeAdjust: '100%', // Prevenir ajuste de texto
              transformOrigin: 'top center', // Ponto de origem para transformações
              transform: 'translateZ(0)', // Usar GPU para renderização
              touchAction: 'manipulation', // Otimizar comportamento de toque
              WebkitAppearance: 'none', // Remover estilo padrão do iOS
              border: getBorderStyle(),
              borderRadius: '16px',
              caretColor: '#946A4A', // Cursor colorido para melhor visualização
              fontWeight: '400',
              transition: 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1), height 0.2s ease',
              backdropFilter: 'blur(4px)'
            }}
            inputMode="text"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck="true"
            data-lpignore="true"
            disabled={isLoading}
            maxLength={MAX_MESSAGE_LENGTH + 100} // Permitir um pouco mais para mostrar erro
            aria-describedby="message-validation"
            rows={1}
          />
          
          {/* Adicionar contador de caracteres elegante */}
          {inputValue.length > 0 && (
            <div 
              className={`absolute ${getCharCountClass()} text-xs transition-all duration-300`}
              style={{
                right: screen.isMobile ? (screen.isLandscape ? '48px' : '66px') : '74px',
                bottom: '8px',
                opacity: isFocused || isTyping ? 1 : 0.7,
                transform: charCount > MAX_MESSAGE_LENGTH ? 'scale(1.1)' : 'scale(1)',
                transition: 'all 0.3s ease'
              }}
            >
              {charCount}/{MAX_MESSAGE_LENGTH}
            </div>
          )}
        </div>
        
        {/* Botão com design profissional aprimorado */}
        <button
          ref={buttonRef}
          type="submit"
          disabled={!inputValue.trim() || isLoading || charCount > MAX_MESSAGE_LENGTH || charCount < MIN_MESSAGE_LENGTH}
          className={`absolute flex items-center justify-center rounded-full transition-all z-[150] overflow-hidden ${
            !inputValue.trim() || isLoading || charCount > MAX_MESSAGE_LENGTH || charCount < MIN_MESSAGE_LENGTH
              ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
              : `bg-bible-brown text-white hover:bg-bible-darkbrown ${screen.isMobile ? 'active:scale-95' : ''}`
          }`}
          style={{
            width: screen.isMobile ? (screen.isLandscape ? '40px' : '46px') : '52px',
            height: screen.isMobile ? (screen.isLandscape ? '40px' : '46px') : '52px',
            transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
            right: screen.isMobile ? (screen.isLandscape ? '12px' : '16px') : '18px',
            bottom: screen.isMobile ? (screen.isLandscape ? '50%' : '14px') : '50%',
            transform: (screen.isLandscape || !screen.isMobile) 
              ? `translateY(50%) ${inputValue.trim() && !isLoading ? 'scale(1.03)' : 'scale(1)'}` 
              : (inputValue.trim() && !isLoading ? 'scale(1.03)' : 'scale(1)'),
            boxShadow: inputValue.trim() && !isLoading 
              ? '0 4px 10px rgba(148, 106, 74, 0.3)' 
              : 'none'
          }}
          aria-label="Enviar mensagem"
          onMouseDown={() => setShowRipple(true)}
          onMouseUp={() => setTimeout(() => setShowRipple(false), 400)}
          onMouseLeave={() => setShowRipple(false)}
        >
          <FaArrowRight 
            size={screen.isMobile ? (screen.isLandscape ? 16 : 18) : 22} 
            className={`${inputValue.trim() && !isLoading ? 'transform transition-transform duration-300 group-hover:translate-x-0.5' : ''}`}
          />
          
          {/* Efeito de ripple */}
          {showRipple && inputValue.trim() && !isLoading && (
            <span 
              className="absolute inset-0 rounded-full" 
              style={{
                background: 'radial-gradient(circle, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0) 70%)',
                animation: 'ripple 0.6s cubic-bezier(0.25, 0.8, 0.25, 1) forwards',
                opacity: 0.6
              }}
            />
          )}
        </button>
      </form>
      
      {validationError && (
        <div 
          id="message-validation" 
          className="flex items-center justify-center space-x-1 text-red-500 text-xs mt-2 text-center animate-pulse"
          role="alert"
          style={{
            animation: 'fadeIn 0.3s ease-out',
            background: 'rgba(254, 242, 242, 0.7)',
            padding: '6px 12px',
            borderRadius: '16px',
            boxShadow: '0 2px 5px rgba(0, 0, 0, 0.05)'
          }}
        >
          <FaExclamationTriangle className="text-red-500" />
          <span>{validationError}</span>
        </div>
      )}

      {/* Estilos para animações */}
      <style jsx global>{`
        @keyframes ripple {
          0% {
            transform: scale(0);
            opacity: 0.8;
          }
          100% {
            transform: scale(2.5);
            opacity: 0;
          }
        }
        
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-5px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .animate-pulse {
          animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
      `}</style>
    </div>
  );
};

export default ChatInput
