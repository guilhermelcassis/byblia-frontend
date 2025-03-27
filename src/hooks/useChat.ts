import { useState, useCallback, useRef, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { ChatState, Message } from '../types';
import { sendMessage, sendFeedback } from '../services/api';
import axios, { AxiosError } from 'axios';

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
  const BUFFER_SIZE_THRESHOLD = 60; // Caracteres mínimos antes de atualizar
  const UPDATE_DELAY_MS = 150;      // Tempo mínimo entre atualizações
  const MAX_UPDATES_PER_SECOND = 5; // Limite de atualizações por segundo
  
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
    
    if (timeSinceLastUpdate < UPDATE_DELAY_MS && 
        chunkBufferRef.current.length < BUFFER_SIZE_THRESHOLD * 2) {
      return; // Ainda não é hora de atualizar
    }
    
    // Limitar o número de atualizações para evitar renderizações excessivas
    const currentSecond = Math.floor(now / 1000);
    const lastSecond = Math.floor(lastUpdateTimestampRef.current / 1000);
    
    if (currentSecond === lastSecond && updatesCountRef.current >= MAX_UPDATES_PER_SECOND) {
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
      const processedContent = chunkBufferRef.current;
      chunkBufferRef.current = '';
      lastUpdateTimestampRef.current = now;
      
      return newState;
    });
  }, []);

  const sendUserMessage = useCallback(async (message: string) => {
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

    try {
      console.log('Starting streaming response...');
      
      // Configurar intervalo para processar o buffer com um intervalo maior
      const intervalId = setInterval(() => {
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
          // Atualizar o estado com cada chunk, sem setTimeout e sem logs excessivos
          setState((prevState) => {
            // Encontrar a mensagem do assistente na array
            const newMessages = [...prevState.messages];
            const assistantMessageIndex = newMessages.findIndex(
              (m) => m.id === currentAssistantMessageId.current
            );

            if (assistantMessageIndex !== -1) {
              // Atualizar o conteúdo incrementalmente
              const assistantMessage = newMessages[assistantMessageIndex];
              const updatedContent = assistantMessage.content + chunk;
              
              // Criar um novo objeto para forçar a renderização
              newMessages[assistantMessageIndex] = {
                ...assistantMessage,
                content: updatedContent,
              };
            }

            // Retornar um novo objeto de estado
            return {
              ...prevState,
              messages: newMessages,
              currentResponse: prevState.currentResponse + chunk,
              isStreaming: true, // Manter a flag de streaming ativa
            };
          });
        },
        // Handle completion of streaming
        (completionData) => {
          // Processar qualquer conteúdo restante no buffer
          if (chunkBufferRef.current.length > 0) {
            updateStateWithBuffer();
          }
          
          // Limpar o intervalo
          clearInterval(intervalId);
          
          console.log('Stream complete, interaction ID:', completionData.interaction_id);
          
          // Delay menor para finalizar o streaming de forma mais natural
          setTimeout(() => {
            setState((prevState) => ({
              ...prevState,
              isLoading: false,
              isStreaming: false,
              currentInteractionId: completionData.interaction_id,
            }));
          }, 150); // Reduzir o delay para 150ms para ser mais natural
        }
      );
    } catch (error) {
      // Limpar recursos em caso de erro
      chunkBufferRef.current = '';
      
      console.error('API Error:', error);
      let errorMessage = 'Erro ao processar sua mensagem. Por favor, tente novamente.';
      
      // Type assertion for better error handling
      const axiosError = error as AxiosError;
      
      // Check if it's a network error
      if (axiosError.message === 'Network Error') {
        errorMessage = 'Erro de conexão com o servidor. Verifique sua conexão com a internet.';
      }
      // Check if it's a CORS error
      else if (axiosError.message && axiosError.message.includes('CORS')) {
        errorMessage = 'Erro de política de origem cruzada (CORS). Contate o administrador do sistema.';
      }
      // Check if there's a response with error data
      else if (axiosError.response?.data) {
        const responseData = axiosError.response.data as { message?: string };
        errorMessage = `Erro do servidor: ${responseData.message || JSON.stringify(axiosError.response.data)}`;
      }

      setState((prevState) => {
        // Remove the empty assistant message if there was an error
        const newMessages = prevState.messages.filter(
          msg => msg.id !== currentAssistantMessageId.current
        );
        
        return {
          ...prevState,
          isLoading: false,
          isStreaming: false,
          error: errorMessage,
          messages: newMessages,
        };
      });
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