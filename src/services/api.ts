import axios from 'axios';
import { ChatRequest, ChatResponse, FeedbackRequest, FeedbackResponse, StreamChunk } from '../types';

// Use the local proxy instead of directly accessing the API
// This avoids CORS issues because requests will be made from the same origin
const API_URL = '/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Healthcheck API - utiliza o endpoint de saúde diretamente do backend
export const checkBackendHealth = async (timeout = 2000): Promise<boolean> => {
  try {
    // Usar o endpoint /health implementado diretamente no backend
    const response = await api.get('/health', {
      timeout: timeout,
      // Não queremos que erros aqui disparem alertas
      // então silenciamos o erro no console
      validateStatus: () => true
    });
    
    // Se recebemos qualquer resposta bem-sucedida, o backend está ativo
    return response.status >= 200 && response.status < 300;
  } catch (error) {
    // Se ocorrer um erro (como timeout), o backend está indisponível
    return false;
  }
};

// Função de validação para mensagens do usuário
const validateMessage = (message: string): { isValid: boolean; error?: string } => {
  if (!message || message.trim() === '') {
    return { isValid: false, error: 'A mensagem não pode estar vazia' };
  }
  
  // Verificar comprimento mínimo e máximo
  if (message.trim().length < 2) {
    return { isValid: false, error: 'A mensagem é muito curta' };
  }
  
  if (message.trim().length > 4000) {
    return { isValid: false, error: 'A mensagem excede o limite de 4000 caracteres' };
  }
  
  return { isValid: true };
};

export const sendMessage = async (
  prompt: string, 
  onChunk: (chunk: string) => void,
  onComplete: (response: Omit<ChatResponse, 'message'>) => void
): Promise<void> => {
  try {
    console.log('Enviando mensagem para a API:', prompt.substring(0, 30) + '...');
    console.log('API URL:', API_URL);
    
    // Validar a mensagem antes de enviá-la
    const validation = validateMessage(prompt);
    if (!validation.isValid) {
      throw new Error(validation.error || 'Mensagem inválida');
    }
    
    console.log('Fazendo requisição para o chat endpoint...');
    
    // Use fetch para ter suporte a streaming
    const response = await fetch(`${API_URL}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'text/event-stream, application/json',  // Aceitar JSON ou SSE
      },
      body: JSON.stringify({ 
        request: { 
          prompt 
        } 
      })
    });

    console.log('Status da resposta:', response.status, response.statusText);
    console.log('Headers da resposta:', Object.fromEntries([...response.headers.entries()]));
    console.log('Tipo de conteúdo:', response.headers.get('content-type'));

    // Tratar erros HTTP com mensagens específicas
    if (!response.ok) {
      let errorMessage = `Erro na requisição: ${response.status}`;
      
      // Tentar extrair mensagem de erro do corpo da resposta
      try {
        const errorData = await response.json();
        console.error('Erro detalhado:', errorData);
        if (errorData && errorData.detail) {
          if (Array.isArray(errorData.detail)) {
            const firstError = errorData.detail[0];
            errorMessage = `Erro: ${firstError.msg || 'Erro de validação'}`;
          } else {
            errorMessage = `Erro: ${errorData.detail}`;
          }
        } else if (errorData && errorData.message) {
          errorMessage = `Erro: ${errorData.message}`;
        }
      } catch (e) {
        // Se não conseguir extrair JSON, usar mensagens personalizadas com base no status
        if (response.status === 422) {
          errorMessage = 'A mensagem contém formato inválido ou caracteres não permitidos. Por favor, revise e tente novamente.';
        } else if (response.status === 429) {
          errorMessage = 'Muitas requisições em um curto período de tempo. Por favor, aguarde alguns instantes e tente novamente.';
        } else if (response.status >= 500) {
          errorMessage = 'Erro no servidor. Por favor, tente novamente mais tarde.';
        }
      }
      
      throw new Error(errorMessage);
    }

    // Verificar se o tipo de conteúdo é JSON em vez de SSE
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      console.log('Resposta recebida como JSON em vez de SSE, processando normalmente...');
      
      try {
        // Processar como JSON normal
        const jsonResponse = await response.json();
        console.log('Resposta JSON completa:', jsonResponse);
        
        // Verificar se há uma mensagem ou conteúdo na resposta
        let content = '';
        if (jsonResponse.response && jsonResponse.response.message) {
          content = jsonResponse.response.message;
        } else if (jsonResponse.message) {
          content = jsonResponse.message;
        } else if (jsonResponse.content) {
          content = jsonResponse.content;
        } else if (typeof jsonResponse === 'string') {
          content = jsonResponse;
        }
        
        if (content) {
          console.log('Conteúdo extraído da resposta JSON:', content.substring(0, 50) + '...');
          // Chamar primeiro onChunk para enviar o conteúdo para o cliente
          onChunk(content);
          
          // Aguardar um pequeno intervalo para garantir que o conteúdo seja processado
          await new Promise(resolve => setTimeout(resolve, 50));
        } else {
          console.warn('Não foi possível extrair conteúdo da resposta JSON:', jsonResponse);
          onChunk("Resposta recebida, mas o formato não pôde ser interpretado corretamente.");
          
          // Pequeno delay para garantir processamento
          await new Promise(resolve => setTimeout(resolve, 50));
        }
        
        // Extrair ou gerar o ID de interação
        let interactionId = 0;
        if (jsonResponse.interaction_id) {
          interactionId = Number(jsonResponse.interaction_id);
        } else if (jsonResponse.response && jsonResponse.response.interaction_id) {
          interactionId = Number(jsonResponse.response.interaction_id);
        } else {
          interactionId = Math.floor(Date.now() / 1000);
        }
        
        console.log('Interaction ID extraído da resposta JSON:', interactionId);
        
        // Concluir o processamento
        onComplete({
          token_usage: jsonResponse.token_usage || 0,
          temperature: jsonResponse.temperature || 0,
          interaction_id: interactionId
        });
        
        return; // Sair da função após processar o JSON
      } catch (error) {
        console.error('Erro ao processar resposta JSON:', error);
        // Continuar com processamento de stream como fallback
      }
    }
    
    console.log('Iniciando processamento do stream de eventos (SSE)...');
    
    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('Response body is null');
    }

    const decoder = new TextDecoder();
    let buffer = '';
    let receivedAnyData = false;
    
    // Log para debugging
    console.log('Iniciando leitura do stream de resposta...');

    // Processar o stream com atualização em tempo real
    while (true) {
      try {
        const { done, value } = await reader.read();
        
        if (done) {
          console.log('Stream completo (done signal received)');
          break;
        }

        // Decodificar o chunk
        const chunk = decoder.decode(value, { stream: true });
        console.log('Recebido chunk bruto de tamanho:', chunk.length);
        console.log('Conteúdo do chunk (primeiros 200 caracteres):', chunk.substring(0, 200));
        
        if (chunk.length > 0) {
          receivedAnyData = true;
          
          // Tentar processar o chunk como um único JSON completo
          if (!chunk.includes('data:') && (chunk.includes('{') || chunk.includes('[')) && (chunk.includes('}') || chunk.includes(']'))) {
            try {
              const jsonData = JSON.parse(chunk);
              console.log('Chunk processado como JSON completo:', jsonData);
              
              let message = '';
              if (jsonData.response && jsonData.response.message) {
                message = jsonData.response.message;
              } else if (jsonData.message) {
                message = jsonData.message;
              } else if (jsonData.content) {
                message = jsonData.content;
              }
              
              if (message) {
                onChunk(message);
              }
              
              // Tentar extrair o ID de interação
              let interactionId = 0;
              if (jsonData.interaction_id) {
                interactionId = Number(jsonData.interaction_id);
              } else if (jsonData.response && jsonData.response.interaction_id) {
                interactionId = Number(jsonData.response.interaction_id);
              } else {
                interactionId = Math.floor(Date.now() / 1000);
              }
              
              console.log('Completando com interaction_id do JSON completo:', interactionId);
              onComplete({
                token_usage: jsonData.token_usage || 0,
                temperature: jsonData.temperature || 0,
                interaction_id: interactionId
              });
              
              return;
            } catch (jsonError) {
              console.log('Não foi possível processar como JSON completo, continuando com processamento normal');
            }
          }
          
          // Caso não seja um JSON completo, continue com o processamento SSE normal
          buffer += chunk;
          
          // Tentar processar o buffer como eventos SSE
          try {
            // Dividir por linhas e processar cada evento data:
            const lines = buffer.split('\n');
            let newBuffer = '';
            let hasProcessedAnyLine = false;
            
            for (let i = 0; i < lines.length; i++) {
              const line = lines[i].trim();
              
              // Se for a última linha e não estiver completa, adicionar ao novo buffer
              if (i === lines.length - 1 && !line.endsWith('}') && !line.includes('[DONE]')) {
                newBuffer = line;
                continue;
              }
              
              // Ignorar linhas vazias
              if (!line) continue;
              
              // Processar linha de dados (data:)
              if (line.startsWith('data:')) {
                hasProcessedAnyLine = true;
                const dataContent = line.substring(5).trim();
                
                // Verificar se é o marcador de finalização
                if (dataContent === '[DONE]') {
                  console.log('Recebido marcador [DONE]');
                  const doneMarkerId = Math.floor(Date.now() / 1000);
                  onComplete({
                    token_usage: 0,
                    temperature: 0,
                    interaction_id: doneMarkerId
                  });
                  continue;
                }
                
                // Tentar parsear como JSON
                try {
                  const jsonData = JSON.parse(dataContent);
                  console.log('Chunk processado como JSON:', jsonData.type || 'sem tipo');
                  
                  if (jsonData.type === 'chunk' && jsonData.content) {
                    onChunk(jsonData.content);
                  } else if (jsonData.type === 'complete') {
                    console.log('Recebido evento complete com interaction_id:', jsonData.interaction_id);
                    onComplete({
                      token_usage: jsonData.token_usage ?? 0,
                      temperature: jsonData.temperature ?? 0,
                      interaction_id: jsonData.interaction_id ? Number(jsonData.interaction_id) : 0
                    });
                  } else if (jsonData.message || jsonData.content || jsonData.response) {
                    // Formato alternativo sem type
                    const content = jsonData.content || jsonData.message || 
                      (jsonData.response && jsonData.response.message) || '';
                    if (content) {
                      onChunk(content);
                    }
                  }
                } catch (jsonError) {
                  // Se falhar o parse como JSON, tratar como texto
                  console.log('Processando como texto plain:', dataContent);
                  if (dataContent && dataContent !== '[DONE]') {
                    onChunk(dataContent);
                  }
                }
              } else {
                // Se não for uma linha data:, verificar se parece texto útil
                if (line && !line.startsWith('{') && !line.startsWith('}')) {
                  console.log('Processando linha não-SSE como texto:', line);
                  onChunk(line);
                  hasProcessedAnyLine = true;
                } else if (line.startsWith('{') && line.endsWith('}')) {
                  // Tenta processar a linha como JSON completo
                  try {
                    const jsonData = JSON.parse(line);
                    console.log('Linha processada como JSON:', jsonData);
                    
                    let message = '';
                    if (jsonData.response && jsonData.response.message) {
                      message = jsonData.response.message;
                    } else if (jsonData.message) {
                      message = jsonData.message;
                    } else if (jsonData.content) {
                      message = jsonData.content;
                    }
                    
                    if (message) {
                      onChunk(message);
                      hasProcessedAnyLine = true;
                    }
                  } catch (jsonError) {
                    console.warn('Erro ao processar linha como JSON:', jsonError);
                  }
                }
              }
            }
            
            // Atualizar o buffer para conter apenas o conteúdo não processado
            buffer = newBuffer;
            
            // Se nenhuma linha foi processada e o buffer está crescendo, enviar como texto simples
            if (!hasProcessedAnyLine && buffer.length > 100) {
              console.log('Enviando buffer acumulado como texto:', buffer.length);
              onChunk(buffer);
              buffer = '';
            }
            
          } catch (processError) {
            console.error('Erro ao processar buffer:', processError);
            
            // Em caso de erro no processamento, enviar o chunk diretamente
            if (chunk) {
              console.log('Enviando chunk diretamente devido a erro de processamento');
              onChunk(chunk);
            }
          }
        }
      } catch (chunkError) {
        console.error('Erro ao processar chunk do stream:', chunkError);
        // Continuar tentando ler o stream mesmo com erro em um chunk
      }
    }

    // Processar qualquer dado restante no buffer
    if (buffer.trim()) {
      console.log('Processando buffer final após o término do stream:', buffer.length, 'bytes');
      onChunk(buffer.trim());
    }

    // Garantir que onComplete seja chamado se ainda não foi
    console.log('Finalizando stream, dados recebidos:', receivedAnyData);
    
    if (receivedAnyData) {
      // Gerar um ID temporário somente se recebemos algum dado
      const temporaryId = Math.floor(Date.now() / 1000);
      console.log('Using temporary interaction_id:', temporaryId);
      onComplete({
        token_usage: 0,
        temperature: 0,
        interaction_id: temporaryId
      });
    } else {
      // Se não recebemos nenhum dado, é um erro de conectividade
      throw new Error('Não foi possível obter resposta do servidor. Por favor, tente novamente.');
    }
    
    console.log('Processamento do stream concluído');
  } catch (error) {
    console.error('Erro ao enviar mensagem:', error);
    throw error;
  }
};

export const sendFeedback = async (
  interactionId: number,
  isPositive: boolean,
  retryCount = 0,
  maxRetries = 2
): Promise<FeedbackResponse | null> => {
  try {
    // Validar interactionId antes de enviar
    if (typeof interactionId !== 'number' || interactionId <= 0) {
      console.error('Invalid interaction_id in sendFeedback:', interactionId);
      return {
        success: false,
        message: 'Invalid interaction ID',
        status: 'error',
        details: 'Interaction ID must be a positive number'
      };
    }

    // Corrigir o formato do payload conforme a documentação da API
    const request: FeedbackRequest = {
      request: {
        interaction_id: interactionId,
        feedback: isPositive,
      }
    };

    // Log para debug
    console.log('Sending feedback request:', request);

    // Tentar enviar feedback com um timeout maior para permitir cold start
    const response = await api.post<FeedbackResponse>('/feedback', request, {
      timeout: 5000 + (retryCount * 1000), // Aumentar o timeout a cada tentativa
    });
    
    return response.data;
  } catch (error) {
    console.error('Error sending feedback:', error);
    
    // Verificar se é um erro de validação 422
    if (axios.isAxiosError(error) && error.response?.status === 422) {
      console.log('Validação falhou no servidor:', error.response.data);
      return {
        success: false,
        message: 'Validation error',
        status: 'error',
        details: error.response.data?.detail || 'Unknown validation error'
      };
    }
    
    // Verificar se é um erro de conectividade (backend indisponível ou cold start)
    if (isConnectivityError(error) && retryCount < maxRetries) {
      console.log(`Tentativa ${retryCount + 1} de envio de feedback falhou, tentando novamente...`);
      
      // Esperar antes de tentar novamente (com backoff exponencial)
      await new Promise(resolve => setTimeout(resolve, 1500 * (retryCount + 1)));
      
      // Tentar novamente
      return sendFeedback(interactionId, isPositive, retryCount + 1, maxRetries);
    }
    
    // Falha em todas as tentativas
    return null;
  }
};

// Função auxiliar para verificar se o erro é relacionado à conectividade
const isConnectivityError = (error: unknown): boolean => {
  if (axios.isAxiosError(error)) {
    // Verificar se não há resposta do servidor ou se houve erro de rede
    return !error.response || error.code === 'ECONNABORTED' || error.message.includes('Network Error');
  }
  
  return false;
};

// Nova função para testar detalhadamente a conexão com o backend
export const testBackendConnection = async (): Promise<{
  status: 'success' | 'error';
  message: string;
  details: any;
}> => {
  console.log('Iniciando teste detalhado de conexão com o backend...');
  
  try {
    // 1. Testar o endpoint de health check primeiro
    console.log('1. Testando endpoint de health...');
    let isHealthy = false;
    
    try {
      const healthResponse = await fetch(`${API_URL}/health`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      });
      
      console.log('Health status:', healthResponse.status);
      console.log('Health headers:', Object.fromEntries([...healthResponse.headers.entries()]));
      
      if (healthResponse.ok) {
        const healthData = await healthResponse.text();
        console.log('Health data:', healthData);
        isHealthy = true;
      }
    } catch (healthError) {
      console.error('Erro ao verificar health:', healthError);
    }
    
    // 2. Tentar fazer uma requisição simples para chat
    console.log('2. Testando endpoint de chat com requisição simples...');
    const chatResponse = await fetch(`${API_URL}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json, text/event-stream'
      },
      body: JSON.stringify({
        request: {
          prompt: 'Teste de conexão: por favor responda com uma palavra'
        }
      })
    });
    
    console.log('Chat status:', chatResponse.status);
    console.log('Chat headers:', Object.fromEntries([...chatResponse.headers.entries()]));
    
    // Verificar o formato da resposta
    const contentType = chatResponse.headers.get('content-type') || '';
    console.log('Chat content type:', contentType);
    
    let responseData;
    
    if (contentType.includes('application/json')) {
      // Processar como JSON
      responseData = await chatResponse.json();
      console.log('Resposta JSON recebida:', responseData);
    } else if (contentType.includes('text/event-stream')) {
      // Tentar ler como stream
      const reader = chatResponse.body?.getReader();
      if (reader) {
        const { value, done } = await reader.read();
        if (!done && value) {
          const text = new TextDecoder().decode(value);
          console.log('Primeiros dados do stream:', text);
          responseData = { streamSample: text };
        }
      }
    } else {
      // Tentar ler como texto
      const text = await chatResponse.text();
      console.log('Resposta como texto:', text);
      responseData = { text };
    }
    
    // Retornar resultado do teste
    return {
      status: 'success',
      message: 'Conexão com o backend testada com sucesso',
      details: {
        health: isHealthy,
        chatStatus: chatResponse.status,
        contentType,
        responseData
      }
    };
  } catch (error) {
    console.error('Erro ao testar conexão com backend:', error);
    return {
      status: 'error',
      message: error instanceof Error ? error.message : 'Erro desconhecido',
      details: error
    };
  }
};

export default api; 