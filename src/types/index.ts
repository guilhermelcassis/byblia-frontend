// API Request and Response Types
export interface ChatRequest {
  request: {
    prompt: string;
  };
  allowed_domains?: string[];
}

export interface ChatResponse {
  message: string;
  token_usage: number;
  temperature: number;
  interaction_id: number;
}

// Streaming response types
export interface StreamChunk {
  type: 'chunk' | 'complete';
  content?: string;
  token_usage?: number;
  temperature?: number;
  interaction_id?: number;
}

export interface FeedbackRequest {
  request: {
    interaction_id: number;
    feedback: boolean;
  };
  allowed_domains?: string[];
}

export interface FeedbackResponse {
  success: boolean;
  message: string;
  status?: 'success' | 'error' | 'partial';
  details?: string;
}

// Application State Types
export interface ChatState {
  isLoading: boolean;
  error: string | null;
  messages: Message[];
  currentResponse: string;
  currentInteractionId: number | null;
  isStreaming: boolean; // Flag for streaming state
  isColdStart: boolean; // Flag para indicar quando o backend está em cold start
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  feedbackGiven?: boolean;
  feedback?: boolean;
  feedbackSyncFailed?: boolean;
} 