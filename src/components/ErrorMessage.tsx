import React from 'react';
import { FaExclamationTriangle, FaInfoCircle, FaExclamationCircle, FaSync, FaPlug } from 'react-icons/fa';

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
      icon: <FaInfoCircle className="text-blue-500" size={18} />,
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-700',
      borderColor: 'border-blue-200'
    },
    warning: {
      icon: <FaExclamationTriangle className="text-amber-500" size={18} />,
      bgColor: 'bg-amber-50',
      textColor: 'text-amber-700',
      borderColor: 'border-amber-200'
    },
    error: {
      icon: <FaExclamationCircle className="text-red-500" size={18} />,
      bgColor: 'bg-red-50',
      textColor: 'text-red-700',
      borderColor: 'border-red-200'
    },
    connection: {
      icon: <FaPlug className="text-purple-500" size={18} />,
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-700',
      borderColor: 'border-purple-200'
    }
  };

  const { icon, bgColor, textColor, borderColor } = config[actualSeverity];

  return (
    <div 
      className={`flex flex-col p-4 rounded-lg my-3 border shadow-sm ${bgColor} ${borderColor} ${className}`}
      role="alert"
    >
      <div className="flex items-center">
        <div className="flex-shrink-0 mr-3">
          {isReconnecting ? <FaSync className="text-purple-500 animate-spin" size={18} /> : icon}
        </div>
        <div className={`flex-grow ${textColor}`}>
          <p>{message}</p>
        </div>
        {onRetry && !isReconnecting && (
          <button
            onClick={onRetry}
            className="ml-3 px-3 py-1 rounded-md bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-bible-brown"
          >
            Tentar novamente
          </button>
        )}
      </div>
      
      {isConnectionError && !isReconnecting && (
        <div className="mt-3 text-xs text-purple-600 pl-7">
          <p>
            Se o problema persistir, o servidor pode estar inicializando. 
            Isto é normal após um período de inatividade.
          </p>
        </div>
      )}
    </div>
  );
};

export default ErrorMessage; 