export type Doc = {
  id: string;
  title: string;
  category: string;
  pages: number;
  updated: string;
  status: string;
  chunks: { page: number; text: string }[];
};
export type Source = {
  document_id: string;
  title: string;
  page: number;
  text: string;
  score?: number;
};
export type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources: Source[];
  feedback?: number;
};
export type Conversation = { id: string; title: string; messages: Message[]; updated: string };
