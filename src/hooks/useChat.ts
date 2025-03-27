import { useState, useCallback, useRef, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { ChatState, Message } from '../types';
import { sendMessage, sendFeedback } from '../services/api';
import axios, { AxiosError } from 'axios';
import { logSecurityEvent, isSecurityDefenseActive } from '../utils/securityMonitor';
import { botDetection } from '../utils/botDetection';

// Configurações de throttling ajustadas para serem mais tolerantes
const THROTTLE_TIME_MS = 800; // Reduzido para 800ms (era 5000ms)
const MAX_MESSAGES_PER_MINUTE = 10; // Aumentado para 10 (era 5)

const useChat = () => {
  const [state, setState] = useState<ChatState>({
    isLoading: false,
    error: null,
    messages: [],
    currentResponse: '',
    currentInteractionId: null,
    isStreaming: false,
  });

  // Ref to store the current assistant message ID while streaming
  const currentAssistantMessageId = useRef<string>('');
  
  // Refs para o agrupamento de chunks
  const chunkBufferRef = useRef<string>('');
  const lastUpdateTimestampRef = useRef<number>(0);
  const updatesCountRef = useRef<number>(0);
  
  // Constantes para controle do buffer
  const BUFFER_SIZE_THRESHOLD = 30; // Reduzido: Caracteres mínimos antes de atualizar (era 60)
  const UPDATE_DELAY_MS = 50;       // Reduzido: Tempo mínimo entre atualizações (era 150)
  const MAX_UPDATES_PER_SECOND = 8; // Aumentado: Limite de atualizações por segundo (era 5)
  
  // Referências para controle de throttling
  const lastMessageTimestampRef = useRef<number>(0);
  const messageCountRef = useRef<number>(0);
  const messageTimestampsRef = useRef<number[]>([]);
  
  // Debug: log state changes
  useEffect(() => {
    console.log('Chat state updated:', state.isStreaming, state.messages.length);
  }, [state]);

  const resetChat = useCallback(() => {
    setState({
      isLoading: false,
      error: null,
      messages: [],
      currentResponse: '',
      currentInteractionId: null,
      isStreaming: false,
    });
  }, []);

  // Função para atualizar o estado com o buffer de chunks acumulado
  const updateStateWithBuffer = useCallback(() => {
    if (chunkBufferRef.current.length === 0) return;
    
    // Evitar atualizações muito frequentes
    const now = Date.now();
    const timeSinceLastUpdate = now - lastUpdateTimestampRef.current;
    
    // Modificado: reduzir o limite de tamanho de buffer para forçar atualizações mais frequentes
    // e garantir que todo o conteúdo seja exibido
    if (timeSinceLastUpdate < UPDATE_DELAY_MS && 
        chunkBufferRef.current.length < BUFFER_SIZE_THRESHOLD) {
      return; // Ainda não é hora de atualizar
    }
    
    // Limitar o número de atualizações para evitar renderizações excessivas
    const currentSecond = Math.floor(now / 1000);
    const lastSecond = Math.floor(lastUpdateTimestampRef.current / 1000);
    
    // Modificado: aumentar o limite de atualizações por segundo para garantir que todo o conteúdo seja exibido
    if (currentSecond === lastSecond && updatesCountRef.current >= MAX_UPDATES_PER_SECOND + 2) {
      return; // Já atingimos o limite de atualizações por segundo
    }
    
    // Registrar esta atualização
    if (currentSecond === lastSecond) {
      updatesCountRef.current++;
    } else {
      updatesCountRef.current = 1;
    }
    
    setState((prevState) => {
      // Encontrar a mensagem do assistente na array
      const newMessages = [...prevState.messages];
      const assistantMessageIndex = newMessages.findIndex(
        (m) => m.id === currentAssistantMessageId.current
      );

      if (assistantMessageIndex !== -1) {
        // Obter a mensagem atual do assistente
        const assistantMessage = newMessages[assistantMessageIndex];
        
        // Aplicar o conteúdo acumulado do buffer
        const updatedContent = assistantMessage.content + chunkBufferRef.current;
        
        // Debug: Registrar conteúdo atualizado
        console.log('Updating assistant message content:', chunkBufferRef.current.length, 'bytes');
        console.log('Updated content (length):', updatedContent.length);
        
        // Criar um novo objeto para forçar a renderização
        newMessages[assistantMessageIndex] = {
          ...assistantMessage,
          content: updatedContent,
        };
      }

      // Criar novo estado com o buffer acumulado
      const newState = {
        ...prevState,
        messages: newMessages,
        currentResponse: prevState.currentResponse + chunkBufferRef.current,
        isStreaming: true,
      };
      
      // Limpar o buffer para próximos chunks
      const bufferContent = chunkBufferRef.current;
      chunkBufferRef.current = '';
      lastUpdateTimestampRef.current = now;
      
      return newState;
    });
  }, []);

  // Limpar contagem de mensagens a cada minuto
  useEffect(() => {
    const interval = setInterval(() => {
      // Remover timestamps mais antigos que 1 minuto
      const oneMinuteAgo = Date.now() - 60000;
      messageTimestampsRef.current = messageTimestampsRef.current.filter(
        timestamp => timestamp > oneMinuteAgo
      );
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  // Verifica se o usuário pode enviar mensagem (throttling)
  const canSendMessage = (): boolean => {
    const now = Date.now();
    
    // Verificar intervalo mínimo entre mensagens
    if (now - lastMessageTimestampRef.current < THROTTLE_TIME_MS) {
      return false;
    }
    
    // Verificar limite de mensagens por minuto
    if (messageTimestampsRef.current.length >= MAX_MESSAGES_PER_MINUTE) {
      return false;
    }
    
    return true;
  };

  const sendUserMessage = useCallback(async (message: string) => {
    // Reduzir o limite da pontuação de bot para 20 (era 40)
    if (botDetection.getScore() < 20) {
      // Comportamento suspeito de bot
      logSecurityEvent('bot_behavior_detected', { score: botDetection.getScore() });
      
      setState(prev => ({
        ...prev,
        error: "Por motivos de segurança, precisamos verificar que você é humano. Por favor, mova o mouse, role a página ou interaja de outra forma por um momento antes de tentar novamente."
      }));
      
      // Não limpar automaticamente este erro para forçar o usuário a interagir
      return;
    }
    
    // Verificar se as medidas defensivas estão ativas
    if (isSecurityDefenseActive()) {
      setState(prev => ({
        ...prev,
        error: "Atividade suspeita detectada. Por favor, aguarde alguns minutos antes de tentar novamente."
      }));
      return;
    }

    // Verificar throttling
    if (!canSendMessage()) {
      setState(prev => ({
        ...prev,
        error: "Por favor, aguarde um momento antes de enviar outra mensagem."
      }));
      
      // Registrar tentativa de exceder o limite de taxa
      logSecurityEvent('throttling_triggered', { message: message.substring(0, 50) + '...' });
      
      // Limpar erro após 3 segundos
      setTimeout(() => {
        setState(prev => ({ ...prev, error: null }));
      }, 3000);
      
      return;
    }
    
    // Atualizar timestamps para throttling
    const now = Date.now();
    lastMessageTimestampRef.current = now;
    messageTimestampsRef.current.push(now);
    
    if (!message.trim()) return;

    console.log('Sending message:', message);
    
    // Resetar buffer de chunks e timestamp
    chunkBufferRef.current = '';
    lastUpdateTimestampRef.current = Date.now();
    
    const userMessage: Message = {
      id: uuidv4(),
      role: 'user',
      content: message,
      timestamp: new Date(),
    };

    // Create a placeholder for the assistant message
    const assistantMessageId = uuidv4();
    currentAssistantMessageId.current = assistantMessageId;
    
    const assistantMessage: Message = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
    };

    // Update the state with both the user message and an empty assistant message
    setState((prevState) => ({
      ...prevState,
      isLoading: true,
      isStreaming: true,
      error: null,
      messages: [...prevState.messages, userMessage, assistantMessage],
      currentResponse: '',
    }));

    // Declarar o intervalId ao nível do escopo da função
    let intervalId: NodeJS.Timeout | null = null;

    try {
      console.log('Starting streaming response...');
      
      // Configurar intervalo para processar o buffer com um intervalo maior
      intervalId = setInterval(() => {
        if (chunkBufferRef.current.length > 0 && 
            Date.now() - lastUpdateTimestampRef.current > UPDATE_DELAY_MS) {
          updateStateWithBuffer();
        }
      }, UPDATE_DELAY_MS);
      
      // Start streaming the response
      await sendMessage(
        message,
        // Handle each incoming chunk
        (chunk) => {
          // Debug: registrar chegada do chunk e conteúdo
          console.log('Received chunk of size:', chunk.length);
          console.log('Chunk content:', chunk);
          
          // Add the chunk to buffer
          chunkBufferRef.current += chunk;
          
          // Tentar atualizar imediatamente se o buffer tiver um tamanho significativo
          if (chunkBufferRef.current.length >= BUFFER_SIZE_THRESHOLD) {
            updateStateWithBuffer();
          }
        },
        // Handle when streaming is complete
        (responseData) => {
          // Final update of buffer contents - garantir que isso seja executado
          console.log('Streaming complete, final buffer size:', chunkBufferRef.current.length);
          
          // Forçar atualização final do buffer independentemente do tamanho
          if (chunkBufferRef.current.length > 0) {
            updateStateWithBuffer();
          }
          
          // Pequeno timeout para garantir que a última atualização do buffer seja processada
          setTimeout(() => {
            // Mark streaming as complete
            setState((prevState) => {
              const newMessages = [...prevState.messages];
              const assistantMessageIndex = newMessages.findIndex(
                (m) => m.id === currentAssistantMessageId.current
              );
              
              // Certificar-se de que toda a resposta está na mensagem antes de finalizar
              if (assistantMessageIndex !== -1) {
                const assistantMessage = newMessages[assistantMessageIndex];
                
                // Verificar se ainda tem conteúdo no buffer
                if (chunkBufferRef.current.length > 0) {
                  console.log('Aplicando buffer final à mensagem:', chunkBufferRef.current);
                  newMessages[assistantMessageIndex] = {
                    ...assistantMessage,
                    content: assistantMessage.content + chunkBufferRef.current,
                  };
                  chunkBufferRef.current = '';
                }
                
                // Log do conteúdo final da mensagem
                console.log('Conteúdo final da mensagem:', newMessages[assistantMessageIndex].content);
                console.log('Tamanho do conteúdo final:', newMessages[assistantMessageIndex].content.length);
              }
              
              return {
                ...prevState,
                isLoading: false,
                isStreaming: false,
                currentInteractionId: responseData.interaction_id,
                messages: newMessages,
              };
            });
          }, 50); // Pequeno delay para garantir sincronização
          
          if (intervalId) clearInterval(intervalId);
        }
      );
    } catch (error) {
      // Limpar o intervalo em caso de erro
      if (intervalId) clearInterval(intervalId);

      console.error('Erro ao processar mensagem:', error);
      
      // Melhor tratamento de erros
      let errorMessage = 'Ocorreu um erro ao processar sua mensagem. Por favor, tente novamente.';
      
      if (error instanceof Error) {
        // Se for um erro do axios, extrair a mensagem mais amigável
        if (axios.isAxiosError(error)) {
          const status = error.response?.status || 0;
          
          if (status === 422) {
            // Este é o erro específico que estamos tratando
            errorMessage = 'Sua mensagem não pôde ser processada pelo servidor. Por favor, verifique o conteúdo e tente novamente com uma formulação diferente.';
            
            // Se houver detalhes específicos no corpo da resposta
            const responseData = error.response?.data;
            if (responseData && responseData.detail) {
              errorMessage = `Erro: ${responseData.detail}`;
            }
          } else if (status === 429) {
            errorMessage = 'Muitas requisições foram feitas em um curto período de tempo. Por favor, aguarde um momento antes de tentar novamente.';
          } else if (status >= 500) {
            errorMessage = 'Nosso servidor está enfrentando problemas. Por favor, tente novamente mais tarde.';
          }
        } else {
          // Para outros tipos de erro, usamos a mensagem do erro se disponível
          errorMessage = error.message || errorMessage;
        }
      }
      
      // Limpar a mensagem do assistente que ficou vazia devido ao erro
      setState((prevState) => {
        // Remover a mensagem do assistente que estava aguardando resposta
        const newMessages = prevState.messages.filter(m => m.id !== assistantMessageId);
        
        return {
          ...prevState,
          isLoading: false,
          isStreaming: false,
          error: errorMessage,
          messages: newMessages,
        };
      });
      
      // Limpar erro após 8 segundos para mensagens de erro mais complexas
      setTimeout(() => {
        setState(prev => ({ ...prev, error: null }));
      }, 8000);
    }
  }, [updateStateWithBuffer]);

  const submitFeedback = useCallback(async (isPositive: boolean) => {
    if (state.currentInteractionId === null) return;

    try {
      await sendFeedback(state.currentInteractionId, isPositive);

      // Update the last message to include the feedback
      setState((prevState) => {
        const newMessages = [...prevState.messages];
        const lastMessageIndex = newMessages.findIndex(
          (m) => m.role === 'assistant'
        );

        if (lastMessageIndex !== -1) {
          newMessages[lastMessageIndex] = {
            ...newMessages[lastMessageIndex],
            feedbackGiven: true,
            feedback: isPositive,
          };
        }

        return {
          ...prevState,
          messages: newMessages,
          currentInteractionId: null,
        };
      });

      // Registrar feedback
      logSecurityEvent('feedback_submitted', { isPositive });
    } catch (error) {
      console.error('Feedback Error:', error);
      let errorMessage = 'Erro ao enviar feedback. Por favor, tente novamente.';
      
      setState((prevState) => ({
        ...prevState,
        error: errorMessage,
      }));
    }
  }, [state.currentInteractionId]);

  return {
    state,
    sendUserMessage,
    submitFeedback,
    resetChat,
  };
};

export default useChat; 