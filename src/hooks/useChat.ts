import { useState, useCallback, useRef, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { ChatState, Message } from '../types';
import { sendMessage, sendFeedback, checkBackendHealth } from '../services/api';
import axios, { AxiosError } from 'axios';
import { logSecurityEvent, isSecurityDefenseActive } from '../utils/securityMonitor';
import { botDetection } from '../utils/botDetection';

// Configurações de throttling ajustadas para serem mais tolerantes
const THROTTLE_TIME_MS = 800; // Reduzido para 800ms (era 5000ms)
const MAX_MESSAGES_PER_MINUTE = 10; // Aumentado para 10 (era 5)

// Configurações para retry em caso de falha na conexão
const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 1500;

// Limite de tempo para aguardar a primeira resposta do streaming
const FIRST_CHUNK_TIMEOUT_MS = 10000; // Aumentado para 10 segundos (antes era 5s)

const useChat = () => {
  const [state, setState] = useState<ChatState>({
    isLoading: false,
    error: null,
    messages: [],
    currentResponse: '',
    currentInteractionId: null,
    isStreaming: false,
    isColdStart: false  // Novo estado para indicar cold start
  });

  // Ref to store the current assistant message ID while streaming
  const currentAssistantMessageId = useRef<string>('');
  
  // Refs para o agrupamento de chunks
  const chunkBufferRef = useRef<string>('');
  const lastUpdateTimestampRef = useRef<number>(0);
  const updatesCountRef = useRef<number>(0);
  
  // Referência para controlar se recebemos algum chunk
  const receivedChunkRef = useRef<boolean>(false);
  
  // Constantes para controle do buffer
  const BUFFER_SIZE_THRESHOLD = 30; // Reduzido: Caracteres mínimos antes de atualizar (era 60)
  const UPDATE_DELAY_MS = 50;       // Reduzido: Tempo mínimo entre atualizações (era 150)
  const MAX_UPDATES_PER_SECOND = 8; // Aumentado: Limite de atualizações por segundo (era 5)
  
  // Referências para controle de throttling
  const lastMessageTimestampRef = useRef<number>(0);
  const messageCountRef = useRef<number>(0);
  const messageTimestampsRef = useRef<number[]>([]);
  
  // Referência para controle de retentativas
  const retryCountRef = useRef<number>(0);
  
  // Remover log de debugging desnecessário que pode causar re-renderizações
  // useEffect(() => {
  //   console.log('Chat state updated:', state.isStreaming, state.messages.length);
  // }, [state]);

  const resetChat = useCallback(() => {
    setState({
      isLoading: false,
      error: null,
      messages: [],
      currentResponse: '',
      currentInteractionId: null,
      isStreaming: false,
      isColdStart: false  // Resetar o estado de cold start
    });
  }, []);

  // Função para atualizar o estado com o buffer de chunks acumulado
  const updateStateWithBuffer = useCallback(() => {
    if (chunkBufferRef.current.length === 0) return;
    
    // Guardar uma cópia local do buffer antes de qualquer verificação
    const currentBufferContent = chunkBufferRef.current;
    
    // Evitar atualizações muito frequentes
    const now = Date.now();
    const timeSinceLastUpdate = now - lastUpdateTimestampRef.current;
    
    // Modificado: aumentar o limite de tamanho de buffer para reduzir atualizações frequentes
    // e diminuir o efeito de flickering
    if (timeSinceLastUpdate < UPDATE_DELAY_MS && 
        currentBufferContent.length < BUFFER_SIZE_THRESHOLD) {
      return; // Ainda não é hora de atualizar
    }
    
    // Limitar o número de atualizações para evitar renderizações excessivas
    const currentSecond = Math.floor(now / 1000);
    const lastSecond = Math.floor(lastUpdateTimestampRef.current / 1000);
    
    // Modificado: reduzir o limite de atualizações por segundo para evitar flickering
    if (currentSecond === lastSecond && updatesCountRef.current >= MAX_UPDATES_PER_SECOND) {
      return; // Já atingimos o limite de atualizações por segundo
    }
    
    // Registrar esta atualização
    if (currentSecond === lastSecond) {
      updatesCountRef.current++;
    } else {
      updatesCountRef.current = 1;
    }
    
    // Log para debug do buffer antes da atualização
    console.log('[useChat] Buffer antes da atualização, tamanho:', currentBufferContent.length);
    console.log('[useChat] Conteúdo do buffer (primeiros 50 caracteres):', 
      currentBufferContent.substring(0, 50));
    
    // Limpar o buffer ANTES da atualização de estado para evitar race conditions
    chunkBufferRef.current = '';
    lastUpdateTimestampRef.current = now;
    
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
        const updatedContent = assistantMessage.content + currentBufferContent;
        
        console.log('[useChat] Atualizando mensagem, tamanho atual:', assistantMessage.content.length);
        console.log('[useChat] Novo tamanho após atualização:', updatedContent.length);
        
        // Criar um novo objeto para forçar a renderização
        newMessages[assistantMessageIndex] = {
          ...assistantMessage,
          content: updatedContent,
        };
      } else {
        console.warn('[useChat] Mensagem do assistente não encontrada, ID:', currentAssistantMessageId.current);
      }

      // Criar novo estado com o buffer acumulado
      const newState = {
        ...prevState,
        messages: newMessages,
        currentResponse: prevState.currentResponse + currentBufferContent,
        isStreaming: true,
      };
      
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

  // Função auxiliar para verificar se o erro é relacionado à conectividade 
  const isConnectivityError = (error: unknown): boolean => {
    if (axios.isAxiosError(error)) {
      // Verificar se não há resposta do servidor ou se houve erro de rede
      return !error.response || error.code === 'ECONNABORTED' || error.message.includes('Network Error');
    }
    
    return false;
  };

  // Função para tentar conexão com o backend
  const attemptBackendConnection = useCallback(async (): Promise<boolean> => {
    try {
      // Usar diretamente o endpoint de saúde implementado no backend
      const isHealthy = await checkBackendHealth(3000); // Aumentado para 3s
      return isHealthy;
    } catch (error) {
      return false;
    }
  }, []);

  const sendUserMessage = useCallback(async (message: string, retryCount = 0) => {
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
    if (!canSendMessage() && retryCount === 0) {
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
    
    // Só atualizar os timestamps se não for uma retry
    if (retryCount === 0) {
      // Atualizar timestamps para throttling
      const now = Date.now();
      lastMessageTimestampRef.current = now;
      messageTimestampsRef.current.push(now);
    }
    
    if (!message.trim()) return;
    
    // Resetar buffer de chunks e timestamp
    chunkBufferRef.current = '';
    lastUpdateTimestampRef.current = Date.now();
    
    // Resetar a flag que controla se recebemos algum chunk
    receivedChunkRef.current = false;
    
    // Timeout para verificar se recebemos o primeiro chunk
    let firstChunkTimeoutId: NodeJS.Timeout | null = null;
    
    // Se for a primeira tentativa, criar mensagens novas. Se for retry, reutilizar IDs.
    let userMessageId: string;
    let assistantMessageId: string;
    
    if (retryCount === 0) {
      userMessageId = uuidv4();
      assistantMessageId = uuidv4();
      
      const userMessage: Message = {
        id: userMessageId,
        role: 'user',
        content: message,
        timestamp: new Date(),
      };

      // Create a placeholder for the assistant message
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
        isColdStart: false  // Resetar o estado de cold start
      }));
    } else {
      // Em retry, usamos o ID atual
      assistantMessageId = currentAssistantMessageId.current;
    }

    // Declarar o intervalId ao nível do escopo da função
    let intervalId: NodeJS.Timeout | null = null;

    try {
      // Configurar intervalo para processar o buffer com um intervalo maior para reduzir flickering
      intervalId = setInterval(() => {
        updateStateWithBuffer();
      }, 150); // Aumentado de 120 para 150ms para dar mais tempo ao buffer acumular
      
      console.log('[useChat] Iniciando envio da mensagem:', message.substring(0, 30) + '...');
      
      // Configurar timeout para o primeiro chunk
      firstChunkTimeoutId = setTimeout(() => {
        if (!receivedChunkRef.current) {
          console.log('[useChat] Timeout atingido enquanto aguardava pelo primeiro chunk');
          
          // Verificar novamente - proteção extra para evitar condições de corrida
          if (receivedChunkRef.current) {
            console.log('[useChat] Recebido chunk após verificação, cancelando timeout');
            return;
          }
          
          // Limpar o intervalo de buffer
          if (intervalId) {
            clearInterval(intervalId);
            intervalId = null;
          }
          
          // Mostrar mensagem de timeout em vez de ficar esperando indefinidamente
          setState(prevState => {
            // Encontrar e atualizar a mensagem do assistente
            const newMessages = [...prevState.messages];
            const assistantMessageIndex = newMessages.findIndex(
              (m) => m.id === currentAssistantMessageId.current
            );
            
            if (assistantMessageIndex !== -1) {
              newMessages[assistantMessageIndex] = {
                ...newMessages[assistantMessageIndex],
                content: "A resposta está demorando mais que o normal. O servidor pode estar ocupado ou pode haver um problema de comunicação. Por favor, tente novamente."
              };
            }
            
            return {
              ...prevState,
              isLoading: false,
              isStreaming: false,
              error: "Tempo de resposta excedido. Por favor, tente novamente.",
              messages: newMessages
            };
          });
        }
      }, FIRST_CHUNK_TIMEOUT_MS);
      
      // Start streaming the response
      await sendMessage(
        message,
        // Handle each incoming chunk
        (chunk) => {
          // Mover para cima para garantir que a flag seja atualizada imediatamente
          receivedChunkRef.current = true;
          
          // Limpar o timeout do primeiro chunk
          if (firstChunkTimeoutId) {
            clearTimeout(firstChunkTimeoutId);
            firstChunkTimeoutId = null;
          }
          
          console.log('[useChat] Recebido chunk de tamanho:', chunk.length);
          // Para debug, mostrar o início do chunk
          if (chunk.length > 0) {
            console.log('[useChat] Início do chunk recebido:', chunk.substring(0, 20));
          }
          
          // Add the chunk to buffer
          chunkBufferRef.current += chunk;
          
          // Resetar contador de retries quando a conexão funciona
          retryCountRef.current = 0;
          
          // Desativar o modo de cold start quando recebemos dados
          if (state.isColdStart) {
            console.log('[useChat] Desativando modo cold start após receber dados');
            setState(prev => ({ ...prev, isColdStart: false }));
          }
          
          // Processar imediatamente se o chunk tiver conteúdo significativo
          if (chunk.length > 0) {
            const currentBufferSize = chunkBufferRef.current.length;
            console.log('[useChat] Tamanho do buffer acumulado:', currentBufferSize);
            
            // Tentar atualizar imediatamente se o buffer tiver um tamanho significativo
            if (currentBufferSize >= BUFFER_SIZE_THRESHOLD) {
              console.log('[useChat] Buffer atingiu tamanho significativo, atualizando estado');
              
              // Atualização manual em vez de chamar updateStateWithBuffer para ter mais controle
              const bufferToProcess = chunkBufferRef.current;
              chunkBufferRef.current = ''; // Reset do buffer
              
              setState(prevState => {
                const newMessages = [...prevState.messages];
                const assistantIndex = newMessages.findIndex(
                  m => m.id === currentAssistantMessageId.current
                );
                
                if (assistantIndex !== -1) {
                  const assistantMessage = newMessages[assistantIndex];
                  console.log('[useChat] Mensagem atual:', assistantMessage.content.length, 'caracteres');
                  
                  // Update com conteúdo novo
                  const newContent = assistantMessage.content + bufferToProcess;
                  console.log('[useChat] Novo tamanho da mensagem:', newContent.length);
                  
                  newMessages[assistantIndex] = {
                    ...assistantMessage,
                    content: newContent
                  };
                }
                
                return {
                  ...prevState,
                  messages: newMessages,
                  currentResponse: prevState.currentResponse + bufferToProcess,
                  isStreaming: true
                };
              });
              
              lastUpdateTimestampRef.current = Date.now();
            }
          }
        },
        // Handle when streaming is complete
        (responseData) => {
          // Marcar que recebemos pelo menos um chunk e limpar timeout
          receivedChunkRef.current = true;
          if (firstChunkTimeoutId) {
            clearTimeout(firstChunkTimeoutId);
            firstChunkTimeoutId = null;
          }
          
          console.log('[useChat] Streaming completo, responseData:', responseData);
          
          // Em vez de setTimeout, atualizamos o estado de uma vez após o streaming
          setState((prevState) => {
            const newMessages = [...prevState.messages];
            const assistantMessageIndex = newMessages.findIndex(
              (m) => m.id === currentAssistantMessageId.current
            );
            
            let completedMessage = '';
            
            // Certificar-se de que toda a resposta está na mensagem antes de finalizar
            if (assistantMessageIndex !== -1) {
              const assistantMessage = newMessages[assistantMessageIndex];
              completedMessage = assistantMessage.content;
              
              // Verificar se há conteúdo no buffer para aplicar
              if (chunkBufferRef.current.length > 0) {
                const finalBuffer = chunkBufferRef.current;
                chunkBufferRef.current = '';
                
                console.log('[useChat] Aplicando buffer final do streaming, tamanho:', finalBuffer.length);
                completedMessage = assistantMessage.content + finalBuffer;
                
                // Atualizar a mensagem
                newMessages[assistantMessageIndex] = {
                  ...assistantMessage,
                  content: completedMessage
                };
              }
              
              console.log('[useChat] Conteúdo final da mensagem:', completedMessage.length, 'caracteres');
              console.log('[useChat] Primeiros 50 caracteres:', completedMessage.substring(0, 50));
              
              // Se a mensagem estiver vazia após todo o processamento, adicionar texto padrão
              if (!completedMessage.trim()) {
                console.warn('[useChat] Mensagem está vazia após processamento, adicionando mensagem genérica');
                completedMessage = "Desculpe, houve um problema ao gerar a resposta. Por favor, tente novamente.";
                
                newMessages[assistantMessageIndex] = {
                  ...assistantMessage,
                  content: completedMessage
                };
              }
            }
            
            // Debugando o interaction_id
            console.log('[useChat] Received interaction_id from API:', responseData.interaction_id, 
              'Type:', typeof responseData.interaction_id);
            
            // Retornar estado atualizado
            return {
              ...prevState,
              isLoading: false,
              isStreaming: false,
              currentInteractionId: responseData.interaction_id ? 
                Number(responseData.interaction_id) : 
                // Gerar um ID temporário se a API não retornar um
                Math.floor(Date.now() / 1000),
              messages: newMessages,
              isColdStart: false
            };
          });
          
          if (intervalId) {
            console.log('[useChat] Limpando intervalo de atualização de buffer');
            clearInterval(intervalId);
            intervalId = null;
          }
        }
      );
    } catch (error) {
      console.error('[useChat] Erro capturado durante envio/processamento da mensagem:', error);
      
      // Limpar o intervalo em caso de erro
      if (intervalId) {
        console.log('[useChat] Limpando intervalo devido a erro');
        clearInterval(intervalId);
      }
      
      // Limpar o timeout do primeiro chunk
      if (firstChunkTimeoutId) {
        clearTimeout(firstChunkTimeoutId);
        firstChunkTimeoutId = null;
      }
      
      // Checar se é um erro de conectividade (backend indisponível ou cold start)
      if (isConnectivityError(error)) {
        console.log('[useChat] Detectado erro de conectividade, verificando status do backend...');
        
        // Se for o primeiro erro de conectividade, verificar se é um cold start
        if (retryCount === 0) {
          // Verificar se o backend está disponível
          console.log('[useChat] Verificando disponibilidade do backend');
          attemptBackendConnection().then(isHealthy => {
            if (!isHealthy) {
              console.log('[useChat] Backend indisponível, ativando modo cold start');
              // Backend não está disponível, provavelmente é um cold start
              setState(prev => ({
                ...prev,
                isColdStart: true,  // Ativar o modo cold start
                error: null         // Não mostrar erro
              }));
              
              // Tentar novamente após um período maior
              console.log('[useChat] Agendando nova tentativa após 3 segundos');
              setTimeout(() => {
                sendUserMessage(message, retryCount + 1);
              }, 3000);
            } else {
              // Backend está disponível, é outro tipo de erro
              console.log('[useChat] Backend disponível, mas ocorreu outro tipo de erro');
              handleNormalError(error);
            }
          });
          return;
        }
        
        // Para retentativas subsequentes durante um cold start
        if (state.isColdStart) {
          const retryDelay = Math.min(3000 + (retryCount * 500), 8000);
          console.log(`[useChat] Em cold start, tentativa ${retryCount}, agendando retry em ${retryDelay}ms`);
          
          // Continuar tentando indefinidamente durante cold start
          setTimeout(() => {
            sendUserMessage(message, retryCount + 1);
          }, retryDelay); // Backoff limitado a 8 segundos
          return;
        }
        
        // Para erros de conectividade normais (não cold start)
        if (retryCount < MAX_RETRIES) {
          // Incrementar contador interno de retries
          retryCountRef.current++;
          const retryDelay = RETRY_DELAY_MS * (retryCount + 1);
          
          console.log(`[useChat] Erro de conectividade normal, tentativa ${retryCount}, próxima tentativa em ${retryDelay}ms`);
          
          // Tentar novamente após um delay sem mostrar erro ao usuário
          setTimeout(() => {
            sendUserMessage(message, retryCount + 1);
          }, retryDelay); // Backoff exponencial
          
          return;
        }
      }
      
      // Função para tratar erros normais (não cold start)
      const handleNormalError = (error: any) => {
        console.log('[useChat] Tratando erro normal:', error);
        
        // Melhor tratamento de erros
        let errorMessage = 'Ocorreu um erro ao processar sua mensagem. Por favor, tente novamente.';
        
        if (error instanceof Error) {
          // Se for um erro do axios, extrair a mensagem mais amigável
          if (axios.isAxiosError(error)) {
            const status = error.response?.status || 0;
            
            if (status === 422) {
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
            } else if (!error.response || error.code === 'ECONNABORTED') {
              errorMessage = 'Não foi possível conectar ao servidor. O backend pode estar temporariamente indisponível ou em processo de inicialização. Por favor, tente novamente em alguns instantes.';
            } else if (error.message.includes('Network Error')) {
              errorMessage = 'Erro de conexão. Verifique sua conexão com a internet e tente novamente.';
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
            isColdStart: false
          };
        });
        
        // Tempo de exibição de erro baseado na complexidade da mensagem
        const errorDisplayTime = errorMessage.length > 100 ? 10000 : 6000;
        
        // Limpar erro após o tempo definido
        setTimeout(() => {
          setState(prev => {
            // Só limpar o erro se for o mesmo erro
            if (prev.error === errorMessage) {
              return { ...prev, error: null };
            }
            return prev;
          });
        }, errorDisplayTime);
      };
      
      // Se chegou aqui, não é um cold start ou já excedeu as retentativas
      if (!state.isColdStart) {
        handleNormalError(error);
      } else {
        console.log('[useChat] Erro em cold start, mas vai continuar tentando');
      }
    }
  }, [updateStateWithBuffer, attemptBackendConnection, state.isColdStart]);

  const submitFeedback = useCallback(async (isPositive: boolean): Promise<boolean> => {
    // Sempre atualizar a UI localmente, mesmo se não for possível enviar o feedback ao servidor
    const updateUIWithFeedback = () => {
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
            feedbackSyncFailed: state.currentInteractionId === null || 
              typeof state.currentInteractionId !== 'number' || 
              state.currentInteractionId <= 0
          };
        }

        return {
          ...prevState,
          messages: newMessages,
          currentInteractionId: null,
        };
      });
    };

    // Verificar se existe um interaction_id válido
    if (state.currentInteractionId === null || 
        typeof state.currentInteractionId !== 'number' || 
        state.currentInteractionId <= 0) {
      console.error('Invalid or missing interaction_id:', state.currentInteractionId);
      
      // Atualizar UI mesmo com erro
      updateUIWithFeedback();
      
      // Registrar evento localmente
      logSecurityEvent('feedback_submitted_local_only', { 
        isPositive, 
        error: 'Invalid interaction_id'
      });
      
      return true; // Para experiência de usuário, retornamos true
    }

    try {
      console.log('Enviando feedback para interaction_id:', state.currentInteractionId);
      const result = await sendFeedback(state.currentInteractionId, isPositive);
      
      // Atualizar UI
      updateUIWithFeedback();
      
      // Registrar feedback localmente
      logSecurityEvent('feedback_submitted', { isPositive });
        
      return true;
    } catch (error) {
      console.error('Feedback Error:', error);
      
      // Mesmo com erro, atualizamos a UI localmente
      updateUIWithFeedback();
      
      // Registrar o erro
      logSecurityEvent('feedback_error', { 
        isPositive, 
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      return true; // Retornamos true para não prejudicar experiência do usuário
    }
  }, [state.currentInteractionId, setState]);

  return {
    state,
    sendUserMessage,
    submitFeedback,
    resetChat,
  };
};

export default useChat; 