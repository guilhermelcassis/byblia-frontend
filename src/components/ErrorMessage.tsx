import React from 'react';
import { FaExclamationTriangle, FaInfoCircle, FaExclamationCircle, FaSync, FaPlug, FaRedo } from 'react-icons/fa';
import { motion } from 'framer-motion';

type ErrorSeverity = 'info' | 'warning' | 'error' | 'connection';

interface ErrorMessageProps {
  message: string;
  severity?: ErrorSeverity;
  onRetry?: () => void;
  className?: string;
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({
  message,
  severity = 'error',
  onRetry,
  className = ''
}) => {
  // Detectar se é uma mensagem de tentativa de reconexão
  const isReconnecting = message.includes('Tentando reconectar');
  
  // Verificar se é um erro de conexão
  const isConnectionError = 
    message.includes('conectar ao servidor') || 
    message.includes('backend') || 
    message.includes('conexão') ||
    message.includes('Network Error') ||
    isReconnecting;
  
  // Ajustar a severidade para 'connection' se for um erro de conexão
  const actualSeverity = isConnectionError ? 'connection' : severity;
  
  // Configurações baseadas na severidade
  const config = {
    info: {
      icon: <FaInfoCircle className="text-blue-500" size={20} />,
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-700',
      borderColor: 'border-blue-200',
      buttonColor: 'bg-blue-100 hover:bg-blue-200 text-blue-700',
      lightTextColor: 'text-blue-600'
    },
    warning: {
      icon: <FaExclamationTriangle className="text-amber-500" size={20} />,
      bgColor: 'bg-amber-50',
      textColor: 'text-amber-700',
      borderColor: 'border-amber-200',
      buttonColor: 'bg-amber-100 hover:bg-amber-200 text-amber-700',
      lightTextColor: 'text-amber-600'
    },
    error: {
      icon: <FaExclamationCircle className="text-red-500" size={20} />,
      bgColor: 'bg-red-50',
      textColor: 'text-red-700',
      borderColor: 'border-red-200',
      buttonColor: 'bg-red-100 hover:bg-red-200 text-red-700',
      lightTextColor: 'text-red-600'
    },
    connection: {
      icon: <FaPlug className="text-purple-500" size={20} />,
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-700',
      borderColor: 'border-purple-200',
      buttonColor: 'bg-purple-100 hover:bg-purple-200 text-purple-700',
      lightTextColor: 'text-purple-600'
    }
  };

  const { icon, bgColor, textColor, borderColor, buttonColor, lightTextColor } = config[actualSeverity];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      transition={{ 
        duration: 0.4, 
        type: "spring", 
        stiffness: 300, 
        damping: 30 
      }}
      className={`flex flex-col p-4 rounded-lg my-3 border shadow-sm backdrop-blur-sm ${bgColor} ${borderColor} ${className} max-w-2xl mx-auto`}
      role="alert"
      aria-live="assertive"
    >
      <div className="flex items-center gap-3">
        <div className="flex-shrink-0">
          {isReconnecting ? (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            >
              <FaSync className="text-purple-500" size={20} />
            </motion.div>
          ) : (
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.3, type: "spring" }}
            >
              {icon}
            </motion.div>
          )}
        </div>
        <div className={`flex-grow ${textColor} font-medium`}>
          <p>{message}</p>
        </div>
        {onRetry && !isReconnecting && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onRetry}
            className={`ml-3 px-3 py-1.5 rounded-md ${buttonColor} text-sm font-medium focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-opacity-50 flex items-center gap-1.5 shadow-sm`}
            aria-label="Tentar novamente"
          >
            <FaRedo size={12} />
            <span>Tentar novamente</span>
          </motion.button>
        )}
      </div>
      
      {isConnectionError && !isReconnecting && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          className={`mt-3 text-sm ${lightTextColor} pl-7 font-medium opacity-90`}
        >
          <p>
            Se o problema persistir, o servidor pode estar inicializando. 
            Isto é normal após um período de inatividade e deve resolver em alguns instantes.
          </p>
        </motion.div>
      )}
    </motion.div>
  );
};

export default ErrorMessage; 