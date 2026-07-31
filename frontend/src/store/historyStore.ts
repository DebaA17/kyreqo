import { create } from 'zustand';
import { apiClient } from '../api/client';
import { RequestHistory, ClearHistoryPayload } from '../types/history';

interface HistoryStore {
  history: RequestHistory[];
  isLoading: boolean;
  error: string | null;

  fetchHistory: (workspaceId: string) => Promise<void>;
  deleteHistoryEntry: (id: string) => Promise<void>;
  clearHistory: (workspaceId: string) => Promise<void>;
  clearError: () => void;
}

const useHistoryStore = create<HistoryStore>(set => ({
  history: [],
  isLoading: false,
  error: null,

  fetchHistory: async (workspaceId: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiClient<{ results: RequestHistory[] }>(
        `/api/history/?workspace=${workspaceId}`
      );
      set({
        history: response.results || [],
        isLoading: false,
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to fetch history';
      set({ error: message, isLoading: false });
    }
  },

  deleteHistoryEntry: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      await apiClient(`/api/history/${id}/`, {
        method: 'DELETE',
      });
      set(state => ({
        history: state.history.filter(item => item.id !== id),
        isLoading: false,
      }));
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to delete history entry';
      set({ error: message, isLoading: false });
    }
  },

  clearHistory: async (workspaceId: string) => {
    set({ isLoading: true, error: null });
    try {
      await apiClient('/api/history/clear/', {
        method: 'POST',
        body: JSON.stringify({ workspace: workspaceId } as ClearHistoryPayload),
      });
      set({ history: [], isLoading: false });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to clear history';
      set({ error: message, isLoading: false });
    }
  },

  clearError: () => set({ error: null }),
}));

export default useHistoryStore;
