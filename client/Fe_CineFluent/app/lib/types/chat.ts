export type TChatContextType =
  | "general"
  | "movie"
  | "flashcard"
  | "roadmap"
  | "typing_game"
  | "realtime_practice";

export type TChatMessageRole = "system" | "user" | "assistant";

export type TAskAssistantMode = "rag" | "hybrid";

export interface IChatSession {
  id: number;
  title: string | null;
  context_type: TChatContextType;
  context_id: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface IChatUsage {
  prompt_token_count: number | null;
  candidates_token_count: number | null;
  total_token_count: number | null;
}

export interface IChatSource {
  chunk_id: string;
  score: number;
  doc_id: string | null;
  title: string | null;
  topic: string | null;
  path: string | null;
  section_title: string | null;
  text: string | null;
}

export interface IChatMessage {
  id: number;
  session_id: number;
  user_id: string;
  role: TChatMessageRole;
  content: string;
  context_used: Record<string, unknown> | null;
  sources: IChatSource[] | null;
  usage: IChatUsage | null;
  latency_ms: number | null;
  created_at: string | null;
}

export interface IChatSessionMessagesResponse {
  session: IChatSession;
  messages: IChatMessage[];
}

export interface ICreateChatSessionPayload {
  context_type?: TChatContextType;
  context_id?: number | string | null;
  title?: string | null;
}

export interface IAppendChatMessagePayload {
  role: TChatMessageRole;
  content: string;
  context_used?: Record<string, unknown> | null;
  sources?: IChatSource[] | null;
  usage?: IChatUsage | null;
  latency_ms?: number | null;
}

export interface IAskAssistantPayload {
  content: string;
  client_state?: Record<string, unknown>;
}

export interface IAskAssistantResponse {
  session_id: number;
  mode: TAskAssistantMode;
  user_message: IChatMessage;
  assistant_message: IChatMessage;
  context_used: Record<string, unknown> | null;
  sources: IChatSource[];
}
