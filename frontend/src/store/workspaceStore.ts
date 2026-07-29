import { create } from 'zustand';
import { apiClient } from '../api/client'; // ← Use named import like authStore
import { Workspace, CreateWorkspacePayload } from '../types/workspace';

interface WorkspaceStore {
  workspaces: Workspace[];
  currentWorkspaceId: string | null;
  isLoading: boolean;
  error: string | null;
  fetchWorkspaces: () => Promise<void>;
  setCurrentWorkspace: (id: string) => void;
  createWorkspace: (payload: CreateWorkspacePayload) => Promise<Workspace | null>;
  deleteWorkspace: (id: string) => Promise<void>;
  clearError: () => void;
}

const useWorkspaceStore = create<WorkspaceStore>((set, get) => ({
  workspaces: [],
  currentWorkspaceId: null,
  isLoading: false,
  error: null,

  fetchWorkspaces: async () => {
    set({ isLoading: true, error: null });
    try {
      const workspaces = await apiClient<Workspace[]>('/api/workspaces/');

      set({
        workspaces,
        isLoading: false,
        currentWorkspaceId:
          get().currentWorkspaceId || (workspaces.length > 0 ? workspaces[0].id : null),
      });
    } catch (error: any) {
      set({
        error: error.message || 'Failed to fetch workspaces',
        isLoading: false,
      });
    }
  },

  setCurrentWorkspace: (id: string) => {
    set({ currentWorkspaceId: id });
  },

  createWorkspace: async (payload: CreateWorkspacePayload) => {
    set({ isLoading: true, error: null });
    try {
      const newWorkspace = await apiClient<Workspace>('/api/workspaces/', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      set(state => ({
        workspaces: [newWorkspace, ...state.workspaces],
        currentWorkspaceId: newWorkspace.id,
        isLoading: false,
      }));

      return newWorkspace;
    } catch (error: any) {
      set({
        error: error.message || 'Failed to create workspace',
        isLoading: false,
      });
      return null;
    }
  },

  deleteWorkspace: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      await apiClient(`/api/workspaces/${id}/`, {
        method: 'DELETE',
      });

      set(state => {
        const remainingWorkspaces = state.workspaces.filter(w => w.id !== id);
        return {
          workspaces: remainingWorkspaces,
          currentWorkspaceId:
            state.currentWorkspaceId === id
              ? remainingWorkspaces.length > 0
                ? remainingWorkspaces[0].id
                : null
              : state.currentWorkspaceId,
          isLoading: false,
        };
      });
    } catch (error: any) {
      set({
        error: error.message || 'Failed to delete workspace',
        isLoading: false,
      });
    }
  },

  clearError: () => set({ error: null }),
}));

export default useWorkspaceStore;
