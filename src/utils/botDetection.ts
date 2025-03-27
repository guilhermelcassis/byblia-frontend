/**
 * Sistema de detecção de bots com base no comportamento do usuário
 * Implementa verificações invisíveis baseadas em comportamentos naturais
 */

// Padrões para detectar humanos vs. bots
interface UserBehaviorData {
  mouseMovements: number;
  keyboardEvents: number;
  interactionGaps: number[];
  typingPatterns: number[];
  lastActivityTime: number;
  pageLoadTime: number;
  focusEvents: number;
  blurEvents: number;
  scrollEvents: number;
  score: number; // 0-100, valores mais altos são mais "humanos"
}

class BotDetection {
  private static instance: BotDetection;
  private behaviorData: UserBehaviorData;
  private listeners: boolean = false;
  private onScoreUpdateCallbacks: ((score: number) => void)[] = [];

  private constructor() {
    this.behaviorData = {
      mouseMovements: 0,
      keyboardEvents: 0,
      interactionGaps: [],
      typingPatterns: [],
      lastActivityTime: Date.now(),
      pageLoadTime: Date.now(),
      focusEvents: 0,
      blurEvents: 0,
      scrollEvents: 0,
      score: 70, // Começamos com um valor mais humano (era 50)
    };
    
    if (typeof window !== 'undefined') {
      try {
        this.initEventListeners();
      } catch (error) {
        console.error('Erro ao inicializar detecção de bots:', error);
        // Garantir que a falha não impede o uso do app
        this.behaviorData.score = 80; // Valor padrão mais alto para evitar bloqueios
      }
    }
  }

  public static getInstance(): BotDetection {
    if (!BotDetection.instance) {
      try {
        BotDetection.instance = new BotDetection();
      } catch (error) {
        console.error('Erro ao criar instância de BotDetection:', error);
        // Criar uma instância básica que não bloqueará o aplicativo
        const fallbackInstance = new BotDetection();
        fallbackInstance.behaviorData.score = 100; // Valor máximo para evitar bloqueios
        BotDetection.instance = fallbackInstance;
      }
    }
    return BotDetection.instance;
  }

  /**
   * Inicializa ouvintes de eventos para capturar comportamento do usuário
   */
  private initEventListeners(): void {
    if (this.listeners || typeof window === 'undefined') return;
    
    try {
      // Mapear movimentos do mouse
      window.addEventListener('mousemove', this.throttle(() => {
        this.behaviorData.mouseMovements++;
        this.updateActivityTime();
        this.updateScore();
      }, 500));
      
      // Mapear digitação
      window.addEventListener('keydown', (event) => {
        this.behaviorData.keyboardEvents++;
        
        // Armazenar o tempo entre pressionamentos de tecla
        const now = Date.now();
        const gap = now - this.behaviorData.lastActivityTime;
        
        if (gap > 10 && gap < 2000) { // Filtrar tempos irrealistas
          this.behaviorData.typingPatterns.push(gap);
          
          // Manter apenas os últimos 20 tempos
          if (this.behaviorData.typingPatterns.length > 20) {
            this.behaviorData.typingPatterns.shift();
          }
        }
        
        this.updateActivityTime();
        this.updateScore();
      });
      
      // Mapear scrolls
      window.addEventListener('scroll', this.throttle(() => {
        this.behaviorData.scrollEvents++;
        this.updateActivityTime();
        this.updateScore();
      }, 500));
      
      // Mapear foco e perda de foco
      window.addEventListener('focus', () => {
        this.behaviorData.focusEvents++;
        this.updateActivityTime();
        this.updateScore();
      });
      
      window.addEventListener('blur', () => {
        this.behaviorData.blurEvents++;
        this.updateActivityTime();
        this.updateScore();
      });
      
      // Verificação periódica com intervalo maior para reduzir carga
      const intervalId = setInterval(() => {
        try {
          const now = Date.now();
          const gap = now - this.behaviorData.lastActivityTime;
          
          if (gap > 1000 && gap < 30000) {
            this.behaviorData.interactionGaps.push(gap);
            
            // Manter apenas os últimos 10 intervalos
            if (this.behaviorData.interactionGaps.length > 10) {
              this.behaviorData.interactionGaps.shift();
            }
          }
          
          this.updateScore();
        } catch (error) {
          console.error('Erro na verificação periódica de bots:', error);
          // Não permitir que erros de verificação afetem a experiência
          clearInterval(intervalId);
        }
      }, 10000); // Aumentado para 10 segundos (era 5 segundos)
      
      this.listeners = true;
    } catch (error) {
      console.error('Erro ao adicionar event listeners para detecção de bots:', error);
      // Definir um valor alto de score para garantir funcionamento
      this.behaviorData.score = 90;
    }
  }
  
  /**
   * Limitador de taxa para eventos frequentes
   */
  private throttle(callback: Function, delay: number): (...args: any[]) => void {
    let lastCall = 0;
    return (...args: any[]) => {
      const now = Date.now();
      if (now - lastCall >= delay) {
        lastCall = now;
        callback(...args);
      }
    };
  }
  
  /**
   * Atualiza o tempo da última atividade
   */
  private updateActivityTime(): void {
    this.behaviorData.lastActivityTime = Date.now();
  }
  
  /**
   * Calcula a pontuação humana/bot com base nos padrões de comportamento
   */
  private updateScore(): void {
    let score = 50; // Valor base

    // 1. Verificar movimento do mouse (bots geralmente têm pouco ou nenhum movimento)
    if (this.behaviorData.mouseMovements > 10) score += 10;
    if (this.behaviorData.mouseMovements > 30) score += 5;
    
    // 2. Verificar eventos de teclado
    if (this.behaviorData.keyboardEvents > 5) score += 5;
    if (this.behaviorData.keyboardEvents > 20) score += 5;
    
    // 3. Analisar padrões de digitação
    if (this.behaviorData.typingPatterns.length > 5) {
      // Calcular a variância no tempo entre pressionamentos de tecla
      const avg = this.average(this.behaviorData.typingPatterns);
      const variance = this.variance(this.behaviorData.typingPatterns, avg);
      
      // Humanos têm mais variância na digitação (não são perfeitamente consistentes)
      if (variance > 1000) score += 10;
    }
    
    // 4. Verificar eventos de scroll (bots raramente fazem scroll natural)
    if (this.behaviorData.scrollEvents > 3) score += 5;
    
    // 5. Verificar eventos de foco/perda de foco (humanos mudam de aba, bots raramente fazem isso)
    if (this.behaviorData.focusEvents > 0 || this.behaviorData.blurEvents > 0) score += 5;
    
    // 6. Tempo na página (bots geralmente são rápidos)
    const timeOnPage = Date.now() - this.behaviorData.pageLoadTime;
    if (timeOnPage > 30000) score += 5; // 30 segundos
    if (timeOnPage > 120000) score += 5; // 2 minutos
    
    // Limitar a pontuação a 0-100
    this.behaviorData.score = Math.max(0, Math.min(100, score));
    
    // Notificar observadores sobre a mudança de pontuação
    this.notifyScoreUpdate();
  }
  
  /**
   * Calcula a média de um array de números
   */
  private average(arr: number[]): number {
    if (arr.length === 0) return 0;
    return arr.reduce((sum, val) => sum + val, 0) / arr.length;
  }
  
  /**
   * Calcula a variância de um array de números
   */
  private variance(arr: number[], avg: number): number {
    if (arr.length === 0) return 0;
    return arr.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / arr.length;
  }
  
  /**
   * Retorna a pontuação atual (0-100)
   * Valores mais altos indicam comportamento mais humano
   */
  public getScore(): number {
    try {
      return this.behaviorData.score;
    } catch (error) {
      console.error('Erro ao obter pontuação de bot:', error);
      return 100; // Em caso de erro, retornar valor alto para não bloquear
    }
  }
  
  /**
   * Verifica se o comportamento parece humano com base na pontuação
   */
  public isLikelyHuman(): boolean {
    try {
      return this.behaviorData.score >= 60; // Reduzido de 70 para 60
    } catch (error) {
      console.error('Erro ao verificar se é humano:', error);
      return true; // Em caso de erro, assumir que é humano
    }
  }
  
  /**
   * Registra um callback para ser chamado quando a pontuação for atualizada
   */
  public onScoreUpdate(callback: (score: number) => void): () => void {
    this.onScoreUpdateCallbacks.push(callback);
    
    // Retorna uma função para cancelar a inscrição
    return () => {
      this.onScoreUpdateCallbacks = this.onScoreUpdateCallbacks.filter(cb => cb !== callback);
    };
  }
  
  /**
   * Notifica todos os callbacks registrados sobre a atualização da pontuação
   */
  private notifyScoreUpdate(): void {
    this.onScoreUpdateCallbacks.forEach(callback => {
      callback(this.behaviorData.score);
    });
  }
  
  /**
   * Obtém dados detalhados do comportamento (para depuração)
   */
  public getDetailedData(): UserBehaviorData {
    return { ...this.behaviorData };
  }
}

// Exportar uma instância singleton com tratamento de erros
export const botDetection = (() => {
  try {
    return BotDetection.getInstance();
  } catch (error) {
    console.error('Erro ao exportar instância de botDetection:', error);
    // Criar um objeto substituto que não bloqueará o aplicativo
    return {
      getScore: () => 100,
      isLikelyHuman: () => true,
      onScoreUpdate: () => () => {},
      getDetailedData: () => ({
        mouseMovements: 0,
        keyboardEvents: 0,
        interactionGaps: [],
        typingPatterns: [],
        lastActivityTime: Date.now(),
        pageLoadTime: Date.now(),
        focusEvents: 0,
        blurEvents: 0,
        scrollEvents: 0,
        score: 100
      })
    };
  }
})();

// Hook React para usar a detecção de bots em componentes
export const useBotDetection = () => {
  try {
    if (typeof window === 'undefined') {
      return { 
        isLikelyHuman: true, 
        score: 100 
      };
    }
    
    return {
      isLikelyHuman: botDetection.isLikelyHuman(),
      score: botDetection.getScore()
    };
  } catch (error) {
    console.error('Erro no hook useBotDetection:', error);
    return {
      isLikelyHuman: true,
      score: 100
    };
  }
}; 