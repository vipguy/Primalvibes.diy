export interface ChatMessage {
  text: string;
  type: 'user' | 'ai';
  code?: string;
  dependencies?: Record<string, string>;
}

export interface SessionDocument {
  _id: string;
  title?: string;
  timestamp: number;
  messages?: ChatMessage[];
}

export interface ChatInterfaceProps {
  onCodeGenerated: (code: string, dependencies?: Record<string, string>) => void;
} 