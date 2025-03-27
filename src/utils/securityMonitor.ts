/**
 * Sistema de monitoramento de segurança para detectar e registrar atividades suspeitas
 */

interface ActivityLog {
  timestamp: number;
  eventType: string;
  data?: any;
  userAgent?: string;
  ipHash?: string; // Hash do IP para preservar privacidade
}

class SecurityMonitor {
  private static instance: SecurityMonitor;
  private activityLogs: ActivityLog[] = [];
  private suspiciousPatterns: Map<string, number> = new Map();
  private sessionStartTime: number = Date.now();
  private requestCount: number = 0;
  private errorCount: number = 0;
  private lastWarningTime: number = 0;
  private initialized: boolean = false;
  
  // Limites para detecção - ajustados para serem menos sensíveis
  private static REQUEST_RATE_THRESHOLD = 100; // Solicitações por minuto (era 50)
  private static ERROR_RATE_THRESHOLD = 20;   // Erros por minuto (era 10)
  private static SUSPICIOUS_CONTENT_THRESHOLD = 5; // Conteúdo suspeito detectado (era 3)
  private static PATTERN_THRESHOLD = 8; // Padrões suspeitos (era 5)

  private constructor() {
    // Inicializar monitoramento com tratamento de erros
    try {
      this.cleanupOldLogs();
      this.initialized = true;
    } catch (error) {
      console.error('Erro ao inicializar o monitor de segurança:', error);
      this.initialized = false;
    }
  }

  public static getInstance(): SecurityMonitor {
    if (!SecurityMonitor.instance) {
      try {
        SecurityMonitor.instance = new SecurityMonitor();
      } catch (error) {
        console.error('Erro ao criar instância do SecurityMonitor:', error);
        // Criar uma instância básica que não bloqueará o aplicativo
        SecurityMonitor.instance = new SecurityMonitor();
        SecurityMonitor.instance.initialized = false;
      }
    }
    return SecurityMonitor.instance;
  }

  /**
   * Registra uma atividade para monitoramento
   */
  public logActivity(eventType: string, data?: any): void {
    try {
      if (!this.initialized) return;
      
      const userAgent = typeof window !== 'undefined' ? window.navigator.userAgent : 'server';
      
      const log: ActivityLog = {
        timestamp: Date.now(),
        eventType,
        data,
        userAgent
      };
      
      this.activityLogs.push(log);
      this.requestCount++;
      
      // Analise imediata para certos tipos de eventos
      if (eventType === 'message_send' && data?.content) {
        this.analyzeMessageContent(data.content);
      }
      
      if (eventType === 'error') {
        this.errorCount++;
      }
      
      // Verificar por comportamentos anômalos
      this.detectAnomalies();
    } catch (error) {
      console.error('Erro ao registrar atividade:', error);
      // Não interromper a aplicação em caso de erro
    }
  }

  /**
   * Analisa o conteúdo da mensagem para padrões suspeitos
   */
  private analyzeMessageContent(content: string): void {
    try {
      if (!content || !this.initialized) return;
      
      const suspiciousPatterns = [
        { name: 'sql_injection', pattern: /(\b(select|insert|update|delete|drop|alter)\b.*\b(from|into|table|database)\b)/i },
        { name: 'script_tags', pattern: /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/i },
        { name: 'prompt_injection', pattern: /(\bignore|disregard\b).*(\binstructions\b|\bprevious\b)/i },
        { name: 'system_commands', pattern: /(\bsystem\b|\bcommand\b|\bexec\b|\beval\b|\bconsole\b)/i },
        { name: 'excessive_characters', pattern: /.{1000,}/i }, // Mensagens excessivamente longas
      ];
      
      suspiciousPatterns.forEach(({ name, pattern }) => {
        if (pattern.test(content)) {
          const currentCount = this.suspiciousPatterns.get(name) || 0;
          this.suspiciousPatterns.set(name, currentCount + 1);
          
          // Registrar a detecção (evitando recursão infinita)
          const logData = { patternName: name };
          if (this.activityLogs.findIndex(log => 
            log.eventType === 'suspicious_content_detected' && 
            log.data?.patternName === name) === -1) {
            this.activityLogs.push({
              timestamp: Date.now(),
              eventType: 'suspicious_content_detected',
              data: logData,
              userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'server'
            });
          }
        }
      });
    } catch (error) {
      console.error('Erro ao analisar conteúdo de mensagem:', error);
    }
  }

  /**
   * Detecta anomalias no comportamento do usuário
   */
  private detectAnomalies(): void {
    const now = Date.now();
    const oneMinuteAgo = now - 60000;
    
    // Contar solicitações no último minuto
    const recentRequests = this.activityLogs.filter(
      log => log.timestamp > oneMinuteAgo
    ).length;
    
    // Contar erros no último minuto
    const recentErrors = this.activityLogs.filter(
      log => log.timestamp > oneMinuteAgo && log.eventType === 'error'
    ).length;
    
    // Verificar limites de taxa
    if (recentRequests > SecurityMonitor.REQUEST_RATE_THRESHOLD) {
      this.triggerAlert('high_request_rate', { count: recentRequests });
    }
    
    if (recentErrors > SecurityMonitor.ERROR_RATE_THRESHOLD) {
      this.triggerAlert('high_error_rate', { count: recentErrors });
    }
    
    // Verificar padrões suspeitos acumulados
    for (const [patternName, count] of this.suspiciousPatterns.entries()) {
      if (count >= SecurityMonitor.PATTERN_THRESHOLD) {
        this.triggerAlert('suspicious_pattern_detected', { patternName, count });
      }
    }
  }

  /**
   * Dispara um alerta de segurança
   */
  private triggerAlert(alertType: string, data: any): void {
    // Evitar spam de alertas - uma vez a cada 30 segundos por tipo
    const now = Date.now();
    if (now - this.lastWarningTime < 30000) {
      return;
    }
    
    this.lastWarningTime = now;
    
    // Registrar alerta
    const alertLog = {
      timestamp: now,
      alertType,
      data,
      severity: this.determineSeverity(alertType, data)
    };
    
    console.warn('Security Alert:', alertLog);
    
    // Aqui você poderia enviar para sua API de monitoramento
    // fetch('/api/security/alert', { method: 'POST', body: JSON.stringify(alertLog) });
    
    // Para severidades altas, você pode tomar medidas mais drásticas
    if (alertLog.severity === 'high') {
      this.applyDefensiveMeasures();
    }
  }
  
  /**
   * Determina a severidade de um alerta
   */
  private determineSeverity(alertType: string, data: any): 'low' | 'medium' | 'high' {
    switch(alertType) {
      case 'high_request_rate':
        return data.count > SecurityMonitor.REQUEST_RATE_THRESHOLD * 2 ? 'high' : 'medium';
      case 'high_error_rate':
        return data.count > SecurityMonitor.ERROR_RATE_THRESHOLD * 2 ? 'high' : 'medium';
      case 'suspicious_pattern_detected':
        return data.count > SecurityMonitor.PATTERN_THRESHOLD * 2 ? 'high' : 'medium';
      default:
        return 'low';
    }
  }
  
  /**
   * Aplica medidas defensivas em resposta a ameaças de severidade alta
   */
  private applyDefensiveMeasures(): void {
    // Aqui você implementaria medidas como:
    // 1. Limitar severamente a taxa de solicitações
    // 2. Exigir verificação adicional (CAPTCHA)
    // 3. Temporariamente bloquear interações
    
    // Esta é apenas uma simulação - em produção você integraria com seu sistema real
    console.error('Defensive measures triggered due to suspicious activity');
    
    // Exemplos de medidas:
    if (typeof window !== 'undefined') {
      // Armazenar estado defensivo
      localStorage.setItem('security_defense_active', 'true');
      localStorage.setItem('security_defense_until', String(Date.now() + 300000)); // 5 minutos
    }
  }
  
  /**
   * Limpa registros antigos para conservar memória
   */
  private cleanupOldLogs(): void {
    setInterval(() => {
      const oneDayAgo = Date.now() - 86400000; // 24 horas
      this.activityLogs = this.activityLogs.filter(log => log.timestamp > oneDayAgo);
    }, 3600000); // Limpar a cada hora
  }
  
  /**
   * Verifica se há medidas defensivas ativas no momento
   */
  public isDefenseActive(): boolean {
    try {
      if (!this.initialized) return false;
      if (typeof window === 'undefined') return false;
      
      const defenseActive = localStorage.getItem('security_defense_active') === 'true';
      const defenseUntil = Number(localStorage.getItem('security_defense_until') || '0');
      
      if (defenseActive && Date.now() > defenseUntil) {
        // Expirou
        localStorage.removeItem('security_defense_active');
        localStorage.removeItem('security_defense_until');
        return false;
      }
      
      return defenseActive;
    } catch (error) {
      console.error('Erro ao verificar se defesa está ativa:', error);
      return false; // Em caso de erro, não bloquear o usuário
    }
  }
  
  /**
   * Retorna estatísticas de segurança para diagnóstico
   */
  public getSecurityStats(): object {
    try {
      if (!this.initialized) {
        return {
          sessionDuration: 0,
          totalRequests: 0,
          recentRequestsPerMinute: 0,
          suspiciousPatternsCounts: {},
          defenseActive: false
        };
      }
      
      const oneMinuteAgo = Date.now() - 60000;
      const recentLogs = this.activityLogs.filter(log => log.timestamp > oneMinuteAgo);
      
      return {
        sessionDuration: Math.floor((Date.now() - this.sessionStartTime) / 1000),
        totalRequests: this.requestCount,
        recentRequestsPerMinute: recentLogs.length,
        suspiciousPatternsCounts: Object.fromEntries(this.suspiciousPatterns),
        defenseActive: this.isDefenseActive()
      };
    } catch (error) {
      console.error('Erro ao obter estatísticas de segurança:', error);
      return {
        error: 'Falha ao obter estatísticas',
        sessionDuration: 0,
        totalRequests: 0,
        recentRequestsPerMinute: 0,
        suspiciousPatternsCounts: {},
        defenseActive: false
      };
    }
  }
}

// Exportar uma instância singleton
export const securityMonitor = (() => {
  try {
    return SecurityMonitor.getInstance();
  } catch (error) {
    console.error('Erro ao exportar instância de securityMonitor:', error);
    // Objeto substituto que não bloqueará o aplicativo
    return {
      logActivity: () => {},
      getSecurityStats: () => ({
        sessionDuration: 0,
        totalRequests: 0,
        recentRequestsPerMinute: 0,
        suspiciousPatternsCounts: {},
        defenseActive: false
      }),
      isDefenseActive: () => false
    };
  }
})();

// Função de utilidade para facilitar o registro de atividades
export function logSecurityEvent(eventType: string, data?: any): void {
  try {
    securityMonitor.logActivity(eventType, data);
  } catch (error) {
    console.error('Erro ao registrar evento de segurança:', error);
    // Não fazer nada em caso de erro para evitar interrupção
  }
}

// Função para verificar se as medidas defensivas estão ativas
export function isSecurityDefenseActive(): boolean {
  try {
    return securityMonitor.isDefenseActive();
  } catch (error) {
    console.error('Erro ao verificar medidas defensivas:', error);
    return false; // Em caso de erro, não bloquear o usuário
  }
} 