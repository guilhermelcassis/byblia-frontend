import React from 'react';
import { motion } from 'framer-motion';
import { FaBook } from 'react-icons/fa';

interface LoadingIndicatorProps {
  isStreaming?: boolean;
  isColdStart?: boolean;
  message?: string;
}

const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({ 
  isStreaming = false, 
  isColdStart = false,
  message = "Consultando a Bíblia Sagrada para encontrar uma resposta..."
}) => {
  return (
    <motion.div 
      className="flex flex-col items-center justify-center w-full my-6 px-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="bg-gray-50 rounded-lg p-4 shadow-sm border border-gray-100 max-w-md w-full">
        <div className="flex flex-col items-center space-y-3">
          <div className="flex items-center justify-center w-10 h-10 bg-bible-brown bg-opacity-10 rounded-full">
            <FaBook className="text-bible-brown" size={20} />
          </div>
          
          <p className="text-sm text-gray-700 text-center font-medium">
            {message}
          </p>
          
          <div className="flex space-x-2 items-center py-1">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.4, 0.8, 0.4],
                }}
                transition={{
                  duration: 1.2,
                  repeat: Infinity,
                  delay: i * 0.2,
                  ease: "easeInOut",
                }}
                className="w-2 h-2 bg-bible-brown rounded-full"
              />
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default LoadingIndicator; 