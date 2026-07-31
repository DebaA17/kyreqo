export interface RequestHistory {
  id: string;
  workspace: string;
  user: string;
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'QUERY';
  headers: Record<string, string>;
  body: string | null;
  response_status: number;
  response_time: number; // in milliseconds
  created_at: string;
  updated_at: string;
}

export interface HistoryResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: RequestHistory[];
}

export interface ClearHistoryPayload {
  workspace: string;
}
