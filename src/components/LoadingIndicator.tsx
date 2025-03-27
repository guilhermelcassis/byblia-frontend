import React from 'react';
import { motion } from 'framer-motion';

interface LoadingIndicatorProps {
  isStreaming?: boolean;
}

const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({ isStreaming = false }) => {
  return (
    <motion.div 
      className="flex justify-start w-full mb-1"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="bg-transparent p-2 max-w-[80%]">
        <div className="flex space-x-1 items-center">
          <div className="flex items-center">
            <div className="flex items-center">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.4, 0.8, 0.4],
                  }}
                  transition={{
                    duration: 1,
                    repeat: Infinity,
                    delay: i * 0.2,
                    ease: "easeInOut",
                  }}
                  className="w-1.5 h-1.5 bg-primary-500 rounded-full mx-0.5"
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default LoadingIndicator; 