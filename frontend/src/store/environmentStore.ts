import { create } from 'zustand';
import { apiClient } from '../api/client';

export interface Environment {
  id: number;
  name: string;
  workspace: string;
  variables: EnvironmentVariable[];
  is_active?: boolean;
  created_at: string;
  updated_at: string;
}

export interface EnvironmentVariable {
  key: string;
  value: string;
  enabled: boolean;
}

interface EnvironmentStore {
  environments: Environment[];
  activeEnvironmentId: number | null;
  isLoading: boolean;
  error: string | null;

  fetchEnvironments: (workspaceId: string) => Promise<void>;
  setActiveEnvironment: (id: number | null) => void;
  createEnvironment: (data: {
    name: string;
    workspace: string;
    variables?: EnvironmentVariable[];
  }) => Promise<Environment | null>;
  updateEnvironment: (id: number, data: Partial<Environment>) => Promise<Environment | null>;
  deleteEnvironment: (id: number) => Promise<void>;
  clearError: () => void;
}

const useEnvironmentStore = create<EnvironmentStore>((set, get) => ({
  environments: [],
  activeEnvironmentId: null,
  isLoading: false,
  error: null,

  fetchEnvironments: async (workspaceId: string) => {
    set({ isLoading: true, error: null });
    try {
      const environments = await apiClient<Environment[]>(
        `/api/environments/?workspace=${workspaceId}`
      );
      set({
        environments,
        isLoading: false,
        activeEnvironmentId:
          get().activeEnvironmentId || (environments.length > 0 ? environments[0].id : null),
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to fetch environments';
      set({ error: message, isLoading: false });
    }
  },

  setActiveEnvironment: (id: number | null) => {
    set({ activeEnvironmentId: id });
  },

  createEnvironment: async (data: {
    name: string;
    workspace: string;
    variables?: EnvironmentVariable[];
  }) => {
    set({ isLoading: true, error: null });
    try {
      const newEnvironment = await apiClient<Environment>('/api/environments/', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      set(state => ({
        environments: [...state.environments, newEnvironment],
        activeEnvironmentId: newEnvironment.id,
        isLoading: false,
      }));
      return newEnvironment;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to create environment';
      set({ error: message, isLoading: false });
      return null;
    }
  },

  updateEnvironment: async (id: number, data: Partial<Environment>) => {
    set({ isLoading: true, error: null });
    try {
      const updated = await apiClient<Environment>(`/api/environments/${id}/`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
      set(state => ({
        environments: state.environments.map(e => (e.id === id ? updated : e)),
        isLoading: false,
      }));
      return updated;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to update environment';
      set({ error: message, isLoading: false });
      return null;
    }
  },

  deleteEnvironment: async (id: number) => {
    set({ isLoading: true, error: null });
    try {
      await apiClient(`/api/environments/${id}/`, { method: 'DELETE' });
      set(state => ({
        environments: state.environments.filter(e => e.id !== id),
        activeEnvironmentId: state.activeEnvironmentId === id ? null : state.activeEnvironmentId,
        isLoading: false,
      }));
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to delete environment';
      set({ error: message, isLoading: false });
    }
  },

  clearError: () => set({ error: null }),
}));

export default useEnvironmentStore;
