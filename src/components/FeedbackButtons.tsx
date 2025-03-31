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
  
  // Estilo ainda mais compacto para o container
  const containerStyle: React.CSSProperties = {
    display: 'inline-flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '6px', // Aumentado de 4px para 6px
    width: 'auto',
    textAlign: 'center',
    margin: '0 auto',
    padding: '2px 4px', // Aumentado de 1px 0 para 2px 4px
    maxWidth: 'fit-content',
    borderRadius: '12px',
    fontSize: '12px' // Aumentado de 11px para 12px
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
  
  // Estilo compacto para botões
  const buttonStyle: React.CSSProperties = {
    color: '#9ca3af',
    padding: '0.15rem', // Ligeiramente aumentado
    margin: '0',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 'auto',
    minHeight: 'auto'
  };
  
  return (
    <div style={containerStyle} className="feedback-buttons">
      {error && (
        <div style={{ fontSize: '0.7rem', color: '#ef4444', marginRight: '0.1rem' }}>
          {error}
        </div>
      )}
      
      {/* Texto entre os botões para economizar espaço horizontal */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}> {/* Gap aumentado de 2px para 4px */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => handleFeedback(true)}
          style={buttonStyle}
          aria-label="Resposta útil"
          disabled={isLoading}
        >
          {isLoading ? <FaSpinner className="animate-spin" size={12} /> : <FaThumbsUp size={12} />} {/* Tamanho aumentado de 10px para 12px */}
        </motion.button>
        
        <span style={{ fontSize: '0.7rem', color: '#9ca3af' }}>útil?</span> {/* Tamanho aumentado de 0.65rem para 0.7rem */}
        
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => handleFeedback(false)}
          style={buttonStyle}
          aria-label="Resposta não útil"
          disabled={isLoading}
        >
          {isLoading ? <FaSpinner className="animate-spin" size={12} /> : <FaThumbsDown size={12} />} {/* Tamanho aumentado de 10px para 12px */}
        </motion.button>
      </div>
    </div>
  );
};

export default FeedbackButtons; 