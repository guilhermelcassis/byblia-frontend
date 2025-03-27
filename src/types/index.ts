// API Request and Response Types
export interface ChatRequest {
  prompt: string;
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
  interaction_id: number;
  feedback: boolean;
}

export interface FeedbackResponse {
  success: boolean;
  message: string;
}

// Application State Types
export interface ChatState {
  isLoading: boolean;
  error: string | null;
  messages: Message[];
  currentResponse: string;
  currentInteractionId: number | null;
  isStreaming: boolean; // Flag for streaming state
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  feedbackGiven?: boolean;
  feedback?: boolean;
} 