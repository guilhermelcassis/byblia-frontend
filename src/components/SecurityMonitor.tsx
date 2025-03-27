/**
 * Componente de Depuração de Segurança - APENAS PARA DESENVOLVIMENTO
 * NÃO USE ESTE COMPONENTE EM PRODUÇÃO!
 */

import React, { useState, useEffect } from 'react';
import { securityMonitor } from '../utils/securityMonitor';
import { botDetection } from '../utils/botDetection';

interface SecurityStats {
  botScore: number;
  isLikelyHuman: boolean;
  defenseActive: boolean;
  recentRequestsPerMinute: number;
  sessionDuration: number;
  suspiciousPatterns: Record<string, number>;
}

const SecurityMonitorComponent: React.FC = () => {
  const [stats, setStats] = useState<SecurityStats>({
    botScore: 50,
    isLikelyHuman: true,
    defenseActive: false,
    recentRequestsPerMinute: 0,
    sessionDuration: 0,
    suspiciousPatterns: {}
  });
  
  const [expanded, setExpanded] = useState(false);
  
  useEffect(() => {
    // Atualizar estatísticas a cada 2 segundos
    const interval = setInterval(() => {
      const securityStats = securityMonitor.getSecurityStats() as any;
      
      setStats({
        botScore: botDetection.getScore(),
        isLikelyHuman: botDetection.isLikelyHuman(),
        defenseActive: securityStats.defenseActive,
        recentRequestsPerMinute: securityStats.recentRequestsPerMinute || 0,
        sessionDuration: securityStats.sessionDuration || 0,
        suspiciousPatterns: securityStats.suspiciousPatternsCounts || {}
      });
    }, 2000);
    
    return () => clearInterval(interval);
  }, []);

  // Calcular classe de status com base na pontuação de bot
  const getBotScoreClass = () => {
    if (stats.botScore >= 70) return 'text-green-600';
    if (stats.botScore >= 40) return 'text-orange-500';
    return 'text-red-600';
  };
  
  if (process.env.NODE_ENV === 'production') {
    return null;
  }
  
  return (
    <div className="fixed bottom-16 right-4 z-50 text-xs bg-white p-2 shadow-lg rounded border border-gray-300 max-w-xs">
      <div className="flex items-center justify-between mb-1">
        <h4 className="font-bold text-gray-800">Debug de Segurança</h4>
        <button 
          onClick={() => setExpanded(!expanded)}
          className="text-gray-500 hover:text-gray-800"
        >
          {expanded ? '▼' : '▶'}
        </button>
      </div>
      
      <div className="flex items-center justify-between">
        <span className="text-gray-600">Status Humano:</span>
        <span className={getBotScoreClass()}>
          {stats.botScore}/100 {stats.isLikelyHuman ? '✓' : '❌'}
        </span>
      </div>
      
      {expanded && (
        <div className="mt-2 pt-2 border-t border-gray-200">
          <div className="grid grid-cols-2 gap-x-2 gap-y-1">
            <span className="text-gray-600">Defesa Ativa:</span>
            <span className={stats.defenseActive ? 'text-red-600' : 'text-green-600'}>
              {stats.defenseActive ? 'Sim' : 'Não'}
            </span>
            
            <span className="text-gray-600">Requisições/Min:</span>
            <span className={stats.recentRequestsPerMinute > 30 ? 'text-orange-500' : 'text-gray-800'}>
              {stats.recentRequestsPerMinute}
            </span>
            
            <span className="text-gray-600">Tempo na Sessão:</span>
            <span className="text-gray-800">
              {Math.floor(stats.sessionDuration / 60)}min {stats.sessionDuration % 60}s
            </span>
          </div>
          
          {Object.keys(stats.suspiciousPatterns).length > 0 && (
            <div className="mt-2">
              <h5 className="font-semibold text-red-600 mb-1">Padrões Suspeitos:</h5>
              <ul className="text-gray-600">
                {Object.entries(stats.suspiciousPatterns).map(([pattern, count]) => (
                  <li key={pattern} className="flex justify-between">
                    <span>{pattern}:</span>
                    <span className="text-red-600">{count}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SecurityMonitorComponent; 