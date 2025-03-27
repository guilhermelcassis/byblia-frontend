import React from 'react';
import { FaExclamationTriangle, FaInfoCircle, FaExclamationCircle } from 'react-icons/fa';

type ErrorSeverity = 'info' | 'warning' | 'error';

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
    }
  };

  const { icon, bgColor, textColor, borderColor } = config[severity];

  return (
    <div 
      className={`flex items-center p-4 rounded-lg my-3 border shadow-sm ${bgColor} ${borderColor} ${className}`}
      role="alert"
    >
      <div className="flex-shrink-0 mr-3">
        {icon}
      </div>
      <div className={`flex-grow ${textColor}`}>
        <p>{message}</p>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="ml-3 px-3 py-1 rounded-md bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-bible-brown"
        >
          Tentar novamente
        </button>
      )}
    </div>
  );
};

export default ErrorMessage; 