import React, { useState } from 'react';
import { FaThumbsUp, FaThumbsDown, FaSpinner } from 'react-icons/fa';
import { motion } from 'framer-motion';

interface FeedbackButtonsProps {
  onFeedback: (isPositive: boolean) => Promise<boolean>;
}

const FeedbackButtons: React.FC<FeedbackButtonsProps> = ({ onFeedback }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feedbackGiven, setFeedbackGiven] = useState<boolean | null>(null);
  
  const handleFeedback = async (isPositive: boolean) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Tentativa de envio do feedback
      const success = await onFeedback(isPositive);
      
      // Mesmo com falha no servidor, vamos mostrar como enviado para melhorar UX
      setFeedbackGiven(isPositive);
      
      if (!success) {
        // Log de erro sem mostrar ao usuário
        console.log('Feedback não foi enviado ao servidor, mas UI foi atualizada');
      }
    } catch (err) {
      console.error('Erro ao processar feedback:', err);
      
      // Mesmo com erro, mostrar como enviado para melhorar UX
      setFeedbackGiven(isPositive);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Se o feedback já foi enviado, mostrar mensagem discreta de agradecimento
  if (feedbackGiven !== null) {
    return (
      <div className="flex justify-center opacity-60">
        <p className="text-gray-400 text-xs italic">
          Obrigado
        </p>
      </div>
    );
  }
  
  return (
    <div className="flex items-center justify-center gap-1 opacity-60 hover:opacity-100 transition-opacity">
      {error && (
        <div className="text-xs text-red-500 mr-1">
          {error}
        </div>
      )}
      
      <span className="text-xs text-gray-400">Útil?</span>
      
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => handleFeedback(true)}
        className="text-gray-400 hover:text-green-600 transition-colors mx-1 p-1"
        aria-label="Resposta útil"
        disabled={isLoading}
      >
        {isLoading ? <FaSpinner className="animate-spin" size={12} /> : <FaThumbsUp size={12} />}
      </motion.button>
      
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => handleFeedback(false)}
        className="text-gray-400 hover:text-red-500 transition-colors p-1"
        aria-label="Resposta não útil"
        disabled={isLoading}
      >
        {isLoading ? <FaSpinner className="animate-spin" size={12} /> : <FaThumbsDown size={12} />}
      </motion.button>
    </div>
  );
};

export default FeedbackButtons; 