import React, { useState } from 'react';
import { FaThumbsUp, FaThumbsDown, FaSpinner } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { ThumbsUp, ThumbsDown, Check } from 'lucide-react';

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
      await onFeedback(isPositive);
      setFeedbackGiven(isPositive);
    } catch (err) {
      console.error('Erro ao processar feedback:', err);
      // Still show as sent for better UX
      setFeedbackGiven(isPositive);
    } finally {
      setIsLoading(false);
    }
  };
  
  // If feedback was already given, show a thank you message
  if (feedbackGiven !== null) {
    return (
      <motion.div
        className={cn(
          "flex items-center gap-1.5",
          "text-xs text-gray-600 dark:text-gray-400"
        )}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <Check size={12} className="text-green-600 dark:text-green-500" />
        <span>Obrigado pelo feedback</span>
      </motion.div>
    );
  }
  
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-gray-600 dark:text-gray-400">
        Esta resposta foi útil?
      </span>
      
      <div className="flex items-center gap-1.5">
        {/* Positive feedback button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => handleFeedback(true)}
          disabled={isLoading}
          className={cn(
            "flex items-center justify-center p-1.5 rounded",
            "transition-colors duration-200",
            "hover:bg-gray-100 dark:hover:bg-gray-800",
            "text-gray-600 dark:text-gray-400",
            "hover:text-green-600 dark:hover:text-green-400"
          )}
          aria-label="Resposta útil"
        >
          {isLoading ? 
            <FaSpinner className="animate-spin" size={12} /> : 
            <ThumbsUp size={14} />
          }
        </motion.button>
        
        {/* Negative feedback button */}
        <motion.button
          whileHover={{ scale: 1.05 }} 
          whileTap={{ scale: 0.95 }}
          onClick={() => handleFeedback(false)}
          disabled={isLoading}
          className={cn(
            "flex items-center justify-center p-1.5 rounded",
            "transition-colors duration-200",
            "hover:bg-gray-100 dark:hover:bg-gray-800",
            "text-gray-600 dark:text-gray-400",
            "hover:text-red-600 dark:hover:text-red-400"
          )}
          aria-label="Resposta não útil"
        >
          {isLoading ? 
            <FaSpinner className="animate-spin" size={12} /> : 
            <ThumbsDown size={14} />
          }
        </motion.button>
      </div>
    </div>
  );
};

export default FeedbackButtons; 