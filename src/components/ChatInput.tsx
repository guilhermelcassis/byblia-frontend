import React, { useState, FormEvent, useEffect } from 'react';
import { FaPaperPlane } from 'react-icons/fa';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  isLoading: boolean;
}

// Constantes de validação ajustadas
const MAX_MESSAGE_LENGTH = 1000; // Aumentado para 1000 caracteres (era 500)
// Reduzido para padrões mais críticos apenas
const SUSPICIOUS_PATTERNS = [
  /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, // Tags de script
  /javascript:/gi, // javascript: URLs
  /eval\(.*\)/gi, // Chamadas eval()
];

const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, isLoading }) => {
  const [inputValue, setInputValue] = useState('');
  const [charCount, setCharCount] = useState(0);
  const [validationError, setValidationError] = useState('');
  const [consecutiveRequests, setConsecutiveRequests] = useState(0);
  const [lastRequestTime, setLastRequestTime] = useState(0);

  useEffect(() => {
    setCharCount(inputValue.length);
    
    // Limpar erro quando o usuário começa a digitar
    if (validationError) {
      setValidationError('');
    }
  }, [inputValue, validationError]);

  // Validação de segurança para entrada do usuário
  const validateInput = (text: string): boolean => {
    // Verificar se o tamanho da mensagem está dentro do limite
    if (text.length > MAX_MESSAGE_LENGTH) {
      setValidationError(`A mensagem deve ter no máximo ${MAX_MESSAGE_LENGTH} caracteres.`);
      return false;
    }
    
    // Verificar padrões suspeitos
    for (const pattern of SUSPICIOUS_PATTERNS) {
      if (pattern.test(text)) {
        setValidationError('Sua mensagem contém conteúdo não permitido.');
        return false;
      }
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
      
      // Verificar apenas por scripts e outras injeções perigosas
      sanitizedInput = sanitizedInput
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/javascript:/gi, 'blocked-js:')
        .replace(/on\w+=/gi, 'data-blocked-handler=');
      
      onSendMessage(sanitizedInput);
      setInputValue('');
    }
  };

  return (
    <div className="w-full">
      <form 
        onSubmit={handleSubmit} 
        className="flex items-center gap-3 bg-white rounded-full p-1.5 shadow-sm border border-gray-300 w-full max-w-2xl mx-auto focus-within:border-bible-brown focus-within:ring-2 focus-within:ring-bible-brown/20 transition-all"
      >
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Faça uma pergunta, peça conselhos ou compartilhe um problema..."
          className="flex-grow p-2.5 pl-4 bg-transparent outline-none placeholder-gray-400 text-gray-800 text-sm"
          disabled={isLoading}
          maxLength={MAX_MESSAGE_LENGTH}
          aria-describedby="message-validation"
        />
        <div className="flex items-center mr-2">
          <span className={`text-xs ${charCount > MAX_MESSAGE_LENGTH * 0.8 ? 'text-amber-500' : 'text-gray-400'}`}>
            {charCount}/{MAX_MESSAGE_LENGTH}
          </span>
        </div>
        <button
          type="submit"
          disabled={!inputValue.trim() || isLoading || charCount > MAX_MESSAGE_LENGTH}
          className={`p-2.5 rounded-full transition-all ${
            !inputValue.trim() || isLoading || charCount > MAX_MESSAGE_LENGTH
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200'
              : 'bg-bible-brown text-white hover:bg-bible-darkbrown hover:shadow-md'
          }`}
          aria-label="Enviar mensagem"
        >
          <FaPaperPlane size={14} />
        </button>
      </form>
      
      {validationError && (
        <div 
          id="message-validation" 
          className="text-red-500 text-xs mt-2 text-center"
          role="alert"
        >
          {validationError}
        </div>
      )}
    </div>
  );
};

export default ChatInput; 