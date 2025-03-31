import React, { useEffect, useRef, useState, memo } from 'react';

interface MessageTextProps {
  content: string;
  isStreaming?: boolean;
  isUser?: boolean;
}

/**
 * Componente especializado para renderizar o texto das mensagens
 * sem animações para evitar o efeito de "piscar" durante o streaming.
 */
const MessageText: React.FC<MessageTextProps> = memo(({ content, isStreaming = false, isUser = false }) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const [processedContent, setProcessedContent] = useState<string>('');
  const prevContentLengthRef = useRef<number>(0);
  
  // Atualizar o conteúdo processado quando receber novos dados, sem logs
  useEffect(() => {
    if (!content) {
      setProcessedContent('');
      prevContentLengthRef.current = 0;
      return;
    }

    // Só processar se o conteúdo realmente mudou ou aumentou
    if (content.length !== prevContentLengthRef.current) {
      prevContentLengthRef.current = content.length;
      
      // Usar timeout para evitar processamento excessivo em updates rápidos
      const formattedContent = formatContent(content);
      setProcessedContent(formattedContent);
    }
  }, [content]);
  
  // Função para formatar o conteúdo e aplicar formatação
  const formatContent = (text: string): string => {
    if (!text) return '';
    
    // Substituir duplos asteriscos por tags de negrito
    let formattedText = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    
    // Substituir asteriscos simples por tags de negrito também
    formattedText = formattedText.replace(/\*(.*?)\*/g, '<strong>$1</strong>');

    // Adicionar quebras de linha adequadas
    formattedText = formattedText.replace(/\n/g, '<br />');
    
    return formattedText;
  };
  
  return (
    <div 
      className={`message-text-content ${isUser ? 'user-message-content' : ''}`}
      data-user-message={isUser}
      data-streaming={isStreaming}
    >
      <div
        ref={contentRef}
        className={`message-text ${isUser ? 'user-message-inner' : ''} ${isStreaming ? 'streaming-text' : ''}`}
        style={isUser ? { color: 'white' } : {}}
        dangerouslySetInnerHTML={{ __html: processedContent }}
      />
    </div>
  );
});

export default MessageText;