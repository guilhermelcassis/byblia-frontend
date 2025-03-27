import React from 'react';
import { FaThumbsUp, FaThumbsDown } from 'react-icons/fa';
import { motion } from 'framer-motion';

interface FeedbackButtonsProps {
  onFeedback: (isPositive: boolean) => void;
}

const FeedbackButtons: React.FC<FeedbackButtonsProps> = ({ onFeedback }) => {
  return (
    <div className="flex flex-col items-center space-y-3 my-8 bg-white p-5 rounded-lg border border-gray-200 shadow-sm max-w-md mx-auto">
      <p className="text-gray-600 text-sm font-medium">Esta resposta foi útil?</p>
      <div className="flex space-x-8">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onFeedback(true)}
          className="flex flex-col items-center gap-2 group"
          aria-label="Resposta útil"
        >
          <div className="flex items-center justify-center p-3 bg-green-50 group-hover:bg-green-100 text-green-600 rounded-full transition-colors border border-green-200">
            <FaThumbsUp size={18} />
          </div>
          <span className="text-xs text-gray-500 group-hover:text-gray-700 font-medium">Sim</span>
        </motion.button>
        
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onFeedback(false)}
          className="flex flex-col items-center gap-2 group"
          aria-label="Resposta não útil"
        >
          <div className="flex items-center justify-center p-3 bg-red-50 group-hover:bg-red-100 text-red-600 rounded-full transition-colors border border-red-200">
            <FaThumbsDown size={18} />
          </div>
          <span className="text-xs text-gray-500 group-hover:text-gray-700 font-medium">Não</span>
        </motion.button>
      </div>
    </div>
  );
};

export default FeedbackButtons; 