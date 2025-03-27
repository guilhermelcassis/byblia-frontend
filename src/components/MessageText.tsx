import React from 'react';

interface MessageTextProps {
  content: string;
  isStreaming?: boolean;
  isUser?: boolean;
}

/**
 * Componente especializado para renderizar o texto das mensagens
 * com transições suaves quando o texto muda durante o streaming.
 */
const MessageText: React.FC<MessageTextProps> = ({ content, isStreaming = false, isUser = false }) => {
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

  const formattedContent = formatContent(content);
  
  return (
    <div 
      className={`message-text-content ${isStreaming ? 'streaming-content' : ''} ${
        isUser ? 'user-message-content' : ''
      }`}
      data-streaming={isStreaming}
      data-user-message={isUser}
    >
      <div
        className={`message-text ${isUser ? 'user-message-inner' : ''}`}
        style={isUser ? { color: 'white' } : {}}
        dangerouslySetInnerHTML={{ __html: formattedContent }}
      />
    </div>
  );
};

export default MessageText;