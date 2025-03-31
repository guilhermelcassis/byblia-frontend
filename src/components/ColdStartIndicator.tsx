import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { FaBible, FaServer } from 'react-icons/fa';

const ColdStartIndicator: React.FC = () => {
  const [dots, setDots] = useState('.');
  
  // Animação dos pontos
  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '.' : prev + '.');
    }, 500);
    
    return () => clearInterval(interval);
  }, []);
  
  return (
    <div className="flex flex-col items-center justify-center w-full my-8 px-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="bg-gray-50 rounded-lg p-6 shadow-sm border border-gray-100 max-w-md w-full"
      >
        <div className="flex flex-col items-center space-y-4">
          <div className="relative flex items-center justify-center">
            <div className="w-16 h-16 bg-bible-brown bg-opacity-10 rounded-full flex items-center justify-center">
              <FaBible className="text-bible-brown" size={28} />
            </div>
            <motion.div
              className="absolute -bottom-1 -right-1 w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center border-2 border-white"
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            >
              <FaServer className="text-gray-500" size={14} />
            </motion.div>
          </div>
          
          <h3 className="text-base font-medium text-bible-brown text-center">
            Iniciando Byblia
          </h3>
          
          <motion.div 
            className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden mt-2"
            initial={{ opacity: 0.8 }}
            animate={{ opacity: [0.8, 1, 0.8] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <motion.div
              className="bg-bible-brown h-full rounded-full"
              initial={{ width: "15%" }}
              animate={{ width: ["15%", "85%", "35%", "65%", "45%", "95%"] }}
              transition={{ 
                duration: 10, 
                times: [0, 0.2, 0.4, 0.6, 0.8, 1],
                repeat: Infinity,
                repeatType: "reverse"
              }}
            />
          </motion.div>
          
          <p className="text-xs text-gray-500 text-center italic mt-2">
            Aguarde um momento{dots}
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default ColdStartIndicator; 