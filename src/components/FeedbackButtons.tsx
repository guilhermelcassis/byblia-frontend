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
  
  // Estilo centralizado comum para todas as versões do componente
  const containerStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    textAlign: 'center',
    margin: '0 auto',
    padding: '4px 0'
  };
  
  // Se o feedback já foi enviado, mostrar mensagem discreta de agradecimento
  if (feedbackGiven !== null) {
    return (
      <div style={containerStyle} className="feedback-buttons opacity-60">
        <p style={{ margin: '0 auto', fontSize: '0.75rem', fontStyle: 'italic', color: '#9ca3af' }}>
          Obrigado
        </p>
      </div>
    );
  }
  
  return (
    <div style={containerStyle} className="feedback-buttons">
      {error && (
        <div style={{ fontSize: '0.75rem', color: '#ef4444', marginRight: '0.25rem' }}>
          {error}
        </div>
      )}
      
      <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>Útil?</span>
      
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => handleFeedback(true)}
        style={{ 
          color: '#9ca3af', 
          margin: '0 0.25rem',
          padding: '0.25rem',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
        aria-label="Resposta útil"
        disabled={isLoading}
      >
        {isLoading ? <FaSpinner className="animate-spin" size={12} /> : <FaThumbsUp size={12} />}
      </motion.button>
      
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => handleFeedback(false)}
        style={{ 
          color: '#9ca3af', 
          padding: '0.25rem',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
        aria-label="Resposta não útil"
        disabled={isLoading}
      >
        {isLoading ? <FaSpinner className="animate-spin" size={12} /> : <FaThumbsDown size={12} />}
      </motion.button>
    </div>
  );
};

export default FeedbackButtons; 