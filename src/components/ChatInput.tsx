import React, { useState, FormEvent } from 'react';
import { FaPaperPlane } from 'react-icons/fa';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  isLoading: boolean;
}

const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, isLoading }) => {
  const [inputValue, setInputValue] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (inputValue.trim() && !isLoading) {
      onSendMessage(inputValue);
      setInputValue('');
    }
  };

  return (
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
      />
      <button
        type="submit"
        disabled={!inputValue.trim() || isLoading}
        className={`p-2.5 rounded-full transition-all ${
          !inputValue.trim() || isLoading
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200'
            : 'bg-bible-brown text-white hover:bg-bible-darkbrown hover:shadow-md'
        }`}
        aria-label="Enviar mensagem"
      >
        <FaPaperPlane size={14} />
      </button>
    </form>
  );
};

export default ChatInput; 