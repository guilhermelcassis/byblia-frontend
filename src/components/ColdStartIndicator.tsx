import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { FaBible, FaServer, FaCloudUploadAlt } from 'react-icons/fa';

const ColdStartIndicator: React.FC = () => {
  // No need for dots state, we'll use modern animations instead
  
  // Particles for visual effect
  const particles = Array.from({ length: 8 }, (_, i) => i);
  
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="flex flex-col items-center justify-center w-full my-8 px-4"
    >
      <motion.div 
        className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 
                  rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700 
                  max-w-md w-full backdrop-blur-sm"
        initial={{ scale: 0.95 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.5, type: "spring", stiffness: 300, damping: 25 }}
      >
        <div className="relative">
          {/* Cloud animation container */}
          <div className="relative flex flex-col items-center justify-center mb-5 min-h-[120px]">
            {/* Particles around the cloud */}
            {particles.map((i) => (
              <motion.div
                key={i}
                className="absolute w-2 h-2 rounded-full bg-primary-300 dark:bg-primary-600"
                initial={{ 
                  x: 0, 
                  y: 0, 
                  opacity: 0.3,
                  backgroundColor: i % 2 === 0 ? 'rgba(var(--primary-color-rgb), 0.3)' : 'white' 
                }}
                animate={{ 
                  x: Math.sin(i * 45) * 30, 
                  y: Math.cos(i * 45) * 30, 
                  opacity: [0.2, 0.7, 0.2],
                  scale: [0.8, 1.2, 0.8]
                }}
                transition={{ 
                  duration: 3 + (i % 3), 
                  repeat: Infinity,
                  delay: i * 0.2
                }}
                style={{
                  width: (i % 3) * 3 + 3 + 'px',
                  height: (i % 3) * 3 + 3 + 'px',
                }}
              />
            ))}

            {/* Main icon container */}
            <motion.div 
              className="relative z-10"
              animate={{ y: [0, -5, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            >
              {/* Server/Cloud icon */}
              <motion.div 
                className="w-20 h-20 bg-gradient-to-br from-primary-500 to-primary-600 
                        dark:from-primary-600 dark:to-primary-700 
                        rounded-full flex items-center justify-center shadow-lg"
                initial={{ boxShadow: "0 4px 12px rgba(var(--primary-color-rgb), 0.4)" }}
                animate={{ 
                  boxShadow: [
                    "0 4px 12px rgba(var(--primary-color-rgb), 0.2)",
                    "0 8px 20px rgba(var(--primary-color-rgb), 0.4)",
                    "0 4px 12px rgba(var(--primary-color-rgb), 0.2)"
                  ]
                }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                <FaCloudUploadAlt className="text-white" size={36} />
              </motion.div>
              
              {/* Bible icon overlay */}
              <motion.div
                className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 
                       w-14 h-14 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center 
                       border-4 border-white dark:border-gray-800 shadow-md"
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              >
                <FaBible className="text-primary-500 dark:text-primary-400" size={22} />
              </motion.div>
            </motion.div>
          </div>
          
          {/* Text content */}
          <div className="text-center">
            <motion.h3 
              className="text-lg font-bold text-gray-800 dark:text-white"
              animate={{ opacity: [0.8, 1, 0.8] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              Iniciando Byblia
            </motion.h3>
            
            {/* Modern loading bar */}
            <div className="mt-4 w-full bg-gray-200 dark:bg-gray-700 h-2 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-primary-400 to-primary-600"
                initial={{ width: "0%" }}
                animate={{ width: "100%" }}
                transition={{ 
                  duration: 15, 
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
            </div>
            
            <motion.p 
              className="text-sm text-gray-600 dark:text-gray-300 mt-4"
              animate={{ opacity: [0.7, 1, 0.7] }}
              transition={{ duration: 2, repeat: Infinity, repeatType: "reverse" }}
            >
              O servidor está inicializando os recursos necessários para responder às suas perguntas.
            </motion.p>
            
            <motion.p 
              className="text-xs text-gray-500 dark:text-gray-400 mt-2 italic"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1, duration: 1 }}
            >
              Isso pode levar alguns segundos...
            </motion.p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default ColdStartIndicator; 