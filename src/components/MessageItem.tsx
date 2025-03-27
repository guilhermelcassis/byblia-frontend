import React, { useRef } from 'react';
import { Message } from '../types';
import MessageText from './MessageText';

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

  // Removido qualquer manipulação de scroll ou efeito automatizado

  return (
    <div 
      ref={containerRef}
      className={`flex w-full mb-6 ${
        isUser ? 'justify-end' : 'justify-start'
      }`}
      data-testid="message-item"
    >
      <div
        className={`p-4 rounded-lg max-w-[85%] shadow-sm ${
          isUser
            ? 'bg-bible-brown text-white font-medium rounded-br-none user-message-container'
            : 'bg-white border border-gray-200 text-gray-800 rounded-tl-none'
        } ${isStreaming ? 'streaming-message' : ''}`}
        style={{ 
          boxShadow: isUser ? '0 1px 2px rgba(0,0,0,0.05)' : '0 1px 3px rgba(0,0,0,0.1)',
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
        
        {!isUser && message.feedbackGiven !== undefined && (
          <div className="text-xs mt-2 italic text-gray-400 border-t border-gray-200 pt-2">
            {message.feedback
              ? 'Você achou esta resposta útil'
              : 'Você indicou que esta resposta não foi útil'}
          </div>
        )}
      </div>
    </div>
  );
};