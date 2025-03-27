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
    
    // Validar a mensagem antes de enviá-la
    const validation = validateMessage(prompt);
    if (!validation.isValid) {
      throw new Error(validation.error || 'Mensagem inválida');
    }
    
    // Use fetch para ter suporte a streaming
    const response = await fetch(`${API_URL}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'text/event-stream',
      },
      body: JSON.stringify({ 
        request: { 
          prompt 
        } 
      })
    });

    // Tratar erros HTTP com mensagens específicas
    if (!response.ok) {
      let errorMessage = `Erro na requisição: ${response.status}`;
      
      // Tentar extrair mensagem de erro do corpo da resposta
      try {
        const errorData = await response.json();
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

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('Response body is null');
    }

    const decoder = new TextDecoder();
    let buffer = '';
    
    // Variável para armazenar todo o conteúdo recebido para debug
    let fullContent = '';

    // Log para debugging
    console.log('Iniciando leitura do stream de resposta...');

    // Adicionar variável para verificar se o stream terminou abruptamente
    let streamCompletedNormally = false;
    
    // Processar o stream com atualização em tempo real
    while (true) {
      try {
        const { done, value } = await reader.read();
        if (done) {
          console.log('Stream completo (done signal received)');
          streamCompletedNormally = true;
          break;
        }

        // Decodificar o chunk
        const chunk = decoder.decode(value, { stream: true });
        console.log('Recebido chunk bruto:', chunk.length, 'bytes');
        
        // Adicionar ao conteúdo completo para debug
        fullContent += chunk;
        
        // Adicionar ao buffer e processar mensagens SSE completas
        buffer += chunk;
        buffer = processSSEBuffer(buffer, (processedChunk) => {
          // Adicionar log para verificar cada pedaço processado
          console.log('Processed chunk being sent to UI:', processedChunk.length, 'chars');
          onChunk(processedChunk);
        }, (completeData) => {
          streamCompletedNormally = true;
          onComplete(completeData);
        });
      } catch (chunkError) {
        console.error('Erro ao processar chunk do stream:', chunkError);
        // Continuar tentando ler o stream mesmo com erro em um chunk
        continue;
      }
    }

    // Processar qualquer dado restante no buffer
    if (buffer.trim()) {
      console.log('Processando buffer final após o término do stream:', buffer.length, 'bytes');
      console.log('Buffer final:', buffer);
      processSSEBuffer(buffer, onChunk, onComplete, true);
    }

    // Log do conteúdo completo recebido
    console.log('Conteúdo completo recebido:', fullContent);
    console.log('Tamanho total do conteúdo:', fullContent.length, 'bytes');

    // Garantir que onComplete seja chamado se ainda não foi
    if (!streamCompletedNormally) {
      console.log('Chamando onComplete manualmente pois o stream não terminou normalmente');
      onComplete({
        token_usage: 0,
        temperature: 0,
        interaction_id: 0
      });
    }
    
    console.log('Processamento do stream concluído');
  } catch (error) {
    console.error('Erro ao enviar mensagem:', error);
    throw error;
  }
};

// Helper function to process SSE buffer
function processSSEBuffer(
  buffer: string,
  onChunk: (chunk: string) => void,
  onComplete: (response: Omit<ChatResponse, 'message'>) => void,
  isLastChunk: boolean = false
): string {
  // Log para debugging
  console.log('Processando buffer com tamanho:', buffer.length);
  
  // Se o buffer não tem "data:" pode ser uma resposta fora do padrão SSE
  if (!buffer.includes('data:') && buffer.trim()) {
    console.log('Buffer não contém formato SSE. Enviando como texto bruto.');
    onChunk(buffer);
    return '';
  }
  
  // Split buffer by lines
  const lines = buffer.split('\n');
  let remainingBuffer = '';
  let completionCalled = false;
  
  // Armazenar conteúdo completo para debug
  let processedContent = '';

  // Process each line
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Skip empty lines
    if (!line) continue;
    
    // Check if this is a data line
    if (line.startsWith('data:')) {
      try {
        const dataStr = line.substring(5).trim();
        
        // Handle end of stream marker
        if (dataStr === '[DONE]') {
          console.log('Received [DONE] marker');
          completionCalled = true;
          onComplete({
            token_usage: 0,
            temperature: 0,
            interaction_id: 0
          });
          continue;
        }
        
        // Se for apenas "data:" sem conteúdo, pular
        if (!dataStr) continue;
        
        // Log antes da tentativa de parse
        console.log('Tentando fazer parse de:', dataStr);
        
        try {
          const data = JSON.parse(dataStr) as StreamChunk;
          console.log('Parsed data:', data.type);
          
          if (data.type === 'chunk' && data.content) {
            // Receber e processar o chunk mantendo toda a formatação original
            const content = data.content as string;
            
            // Verificar apenas se o chunk está completamente vazio
            if (!content) continue;
            
            // Log do chunk que está sendo processado
            console.log('Processing chunk:', content.length, 'chars');
            processedContent += content;
            
            // Enviar o chunk para o frontend - preservando TODA a formatação original
            onChunk(content);
          } else if (data.type === 'complete') {
            console.log('Processing complete:', data);
            completionCalled = true;
            onComplete({
              token_usage: data.token_usage ?? 0,
              temperature: data.temperature ?? 0,
              interaction_id: data.interaction_id ?? 0
            });
          }
        } catch (jsonError) {
          // Se falhar o parse como JSON, tentar como texto simples
          console.error('Erro ao interpretar como JSON:', jsonError);
          console.log('Tentando interpretar como texto simples:', dataStr);
          
          // Se não for [DONE], enviar como conteúdo de texto
          if (dataStr !== '[DONE]') {
            processedContent += dataStr;
            onChunk(dataStr);
          }
        }
      } catch (error) {
        console.error('Error parsing SSE data:', error, 'Line:', line);
        // Try to extract content even if JSON parsing fails - melhorado
        try {
          // Check if this might be a plain text chunk
          const contentMatch = line.match(/data:\s*(.+)/);
          if (contentMatch && contentMatch[1]) {
            const content = contentMatch[1].trim();
            if (content && content !== '[DONE]') {
              console.log('Extracted text content from malformed data:', content.length, 'chars');
              processedContent += content;
              onChunk(content);
            }
          } else {
            // Tenta interpretar a linha inteira como conteúdo
            if (line && line !== 'data:' && line !== 'data: [DONE]') {
              console.log('Using entire line as content:', line.length, 'chars');
              // Remove 'data:' se presente no início
              const cleanedLine = line.startsWith('data:') ? line.substring(5).trim() : line;
              if (cleanedLine) {
                processedContent += cleanedLine;
                onChunk(cleanedLine);
              }
            }
          }
        } catch (extractError) {
          console.error('Failed to extract content from malformed data:', extractError);
        }
      }
    } else {
      // If this is the last line and not complete, add it to the remaining buffer
      if (i === lines.length - 1 && !line.endsWith('}')) {
        remainingBuffer = line;
      } else {
        // Try to process this line as well in case it's not properly formatted
        try {
          const trimmedLine = line.trim();
          if (trimmedLine && !trimmedLine.includes('{') && !trimmedLine.includes('}')) {
            console.log('Processing non-SSE line as content:', trimmedLine);
            processedContent += trimmedLine;
            onChunk(trimmedLine);
          }
        } catch (err) {
          console.error('Error processing non-SSE line:', err);
        }
      }
    }
  }
  
  // Log do conteúdo processado para debug
  console.log('Conteúdo processado total:', processedContent);
  console.log('Tamanho do conteúdo processado:', processedContent.length);
  
  // If this is the last chunk and completion wasn't called, call it now
  if (isLastChunk && !completionCalled) {
    console.log('Calling completion at end of stream');
    onComplete({
      token_usage: 0,
      temperature: 0,
      interaction_id: 0
    });
  }
  
  return remainingBuffer;
}

export const sendFeedback = async (
  interactionId: number,
  isPositive: boolean
): Promise<FeedbackResponse> => {
  try {
    const request: FeedbackRequest = {
      interaction_id: interactionId,
      feedback: isPositive,
    };
    const response = await api.post<FeedbackResponse>('/feedback', request);
    return response.data;
  } catch (error) {
    console.error('Error sending feedback:', error);
    throw error;
  }
};

export default api; 