export type Role = 'user' | 'model';

export interface ChatMessage {
  id: string;
  role: Role;
  text: string;
  timestamp: number;
  imageUrl?: string; // For user uploads
  isStreaming?: boolean;
  sources?: { title: string; url: string }[];
}

export type ActionType = 'simplify' | 'elaborate' | 'visualize' | 'edit';

export interface Subject {
  id: string;
  name: string;
  icon: string;
  color: string;
  systemInstruction: string;
  welcomeMessage: string;
}

export type LoadingState = 'idle' | 'loading' | 'error';