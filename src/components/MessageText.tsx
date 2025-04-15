import React, { useEffect, useRef, useState, memo } from 'react';
import { cn } from '../lib/utils';

interface MessageTextProps {
  content: string;
  isStreaming?: boolean;
  isUser?: boolean;
}

/**
 * Component specialized for rendering message text content
 * with plain styling and maximum readability.
 */
const MessageText: React.FC<MessageTextProps> = memo(({ 
  content, 
  isStreaming = false, 
  isUser = false 
}) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const [processedContent, setProcessedContent] = useState<string>('');
  const prevContentLengthRef = useRef<number>(0);
  
  // Update processed content when new data is received
  useEffect(() => {
    if (!content) {
      setProcessedContent('');
      prevContentLengthRef.current = 0;
      return;
    }

    // Only process if content has actually changed or increased
    if (content.length !== prevContentLengthRef.current) {
      prevContentLengthRef.current = content.length;
      
      // Format the content with plain styling
      const formattedContent = formatContent(content);
      setProcessedContent(formattedContent);
    }
  }, [content]);
  
  // Function to format content with plain styling
  const formatContent = (text: string): string => {
    if (!text) return '';
    
    // Escape HTML to prevent injection
    let formattedText = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
    
    // Format code blocks with plain styling
    formattedText = formattedText.replace(/```([\s\S]*?)```/g, (match, codeContent) => {
      return `<div class="code-block my-4 rounded overflow-hidden border border-gray-300 dark:border-gray-700">
                <div class="bg-gray-100 dark:bg-gray-900 px-4 py-2 text-xs text-gray-800 dark:text-gray-200 flex justify-between">
                  <span>code</span>
                  <button class="copy-code-btn hover:text-gray-900 dark:hover:text-white transition-colors" onclick="copyCodeToClipboard(this)">
                    Copy
                  </button>
                </div>
                <pre class="bg-white dark:bg-black p-4 text-sm overflow-x-auto"><code>${codeContent}</code></pre>
              </div>`;
    });
    
    // Format inline code with plain styling
    formattedText = formattedText.replace(/`([^`]+)`/g, '<code class="bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-200 px-1.5 py-0.5 rounded text-sm font-mono border border-gray-300 dark:border-gray-700">$1</code>');
    
    // Replace double asterisks with bold tags
    formattedText = formattedText.replace(/\*\*(.*?)\*\*/g, '<strong class="text-gray-900 dark:text-white font-medium">$1</strong>');
    
    // Replace single asterisks with emphasis tags (for italic)
    formattedText = formattedText.replace(/\*(.*?)\*/g, '<em class="text-gray-800 dark:text-gray-200">$1</em>');
    
    // Format Bible verse references with monochrome styling - no background
    formattedText = formattedText.replace(/\b(\d\s*)?([A-Za-zÀ-ÖØ-öø-ÿ]+)\s+(\d+)[:]\s*(\d+(?:-\d+)?)\b/g, 
      '<span class="inline-block border-b border-gray-400 dark:border-gray-600 px-0.5 py-0.5 text-gray-900 dark:text-gray-100 text-sm font-semibold">$1$2 $3:$4</span>'
    );
    
    // Auto-link URLs with plain styling
    formattedText = formattedText.replace(
      /(https?:\/\/[^\s]+)/g, 
      '<a href="$1" target="_blank" rel="noopener noreferrer" class="text-gray-800 dark:text-gray-200 underline">$1</a>'
    );
    
    // Add line breaks with proper spacing
    formattedText = formattedText.replace(/\n/g, '<br />');
    
    // Always add a space at the end for consistent rendering between server and client
    formattedText = formattedText + ' ';
    
    return formattedText;
  };
  
  return (
    <div 
      className={cn(
        "message-text-content",
        isUser ? 'user-message-content' : '',
        "pb-1"
      )}
      data-user-message={isUser}
      data-streaming={isStreaming}
    >
      <div
        ref={contentRef}
        className={cn(
          "message-text leading-relaxed text-base",
          isUser 
            ? "text-gray-900 dark:text-white" 
            : "text-gray-900 dark:text-white", 
          "min-h-[1.5rem]"
        )}
        dangerouslySetInnerHTML={{ __html: processedContent }}
      />
      
      {/* Streaming cursor with improved visibility */}
      {isStreaming && (
        <span className="inline-block w-0.5 h-4 ml-0.5 bg-gray-600 dark:bg-gray-400 animate-pulse" />
      )}
      
      {/* Add invisible element to ensure proper spacing at the end */}
      <div className="h-1"></div>
    </div>
  );
});

MessageText.displayName = 'MessageText';

export default MessageText;