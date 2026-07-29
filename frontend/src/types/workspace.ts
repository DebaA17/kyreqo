export interface Workspace {
  id: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
  created_by: number;
}

export interface CreateWorkspacePayload {
  name: string;
  description?: string;
}

export interface WorkspaceResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Workspace[];
}