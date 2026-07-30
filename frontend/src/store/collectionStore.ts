import { create } from 'zustand';
import { apiClient } from '../api/client';

export interface SavedRequest {
  id: number;
  collection: number;
  name: string;
  url: string;
  method: string;
  headers?: Record<string, unknown>;
  query_params?: Record<string, unknown>;
  body?: string;
  created_at: string;
  updated_at: string;
}

export interface Collection {
  id: number;
  name: string;
  description?: string;
  workspace: number;
  parent_collection?: number | null;
  requests?: SavedRequest[];
  created_at: string;
  updated_at: string;
}

interface CollectionStore {
  collections: Collection[];
  isLoading: boolean;
  error: string | null;
  fetchCollections: (workspaceId: string) => Promise<void>;
  createCollection: (data: {
    name: string;
    workspace: string;
    parent_collection?: number | null;
  }) => Promise<Collection | null>;
  deleteCollection: (id: number) => Promise<void>;
  clearError: () => void;
  reset: () => void;
}

const useCollectionStore = create<CollectionStore>(set => ({
  collections: [],
  isLoading: false,
  error: null,

  fetchCollections: async (workspaceId: string) => {
    set({ isLoading: true, error: null });
    try {
      const collections = await apiClient<Collection[]>(
        `/api/collections/?workspace=${workspaceId}`
      );
      set({ collections, isLoading: false });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to fetch collections';
      set({ error: message, isLoading: false });
    }
  },

  createCollection: async (data: {
    name: string;
    workspace: string;
    parent_collection?: number | null;
  }) => {
    set({ isLoading: true, error: null });
    try {
      const newCollection = await apiClient<Collection>('/api/collections/', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      set(state => ({
        collections: [...state.collections, newCollection],
        isLoading: false,
      }));
      return newCollection;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to create collection';
      set({ error: message, isLoading: false });
      return null;
    }
  },

  deleteCollection: async (id: number) => {
    set({ isLoading: true, error: null });
    try {
      await apiClient(`/api/collections/${id}/`, { method: 'DELETE' });
      set(state => ({
        collections: state.collections.filter(c => c.id !== id),
        isLoading: false,
      }));
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to delete collection';
      set({ error: message, isLoading: false });
    }
  },

  clearError: () => set({ error: null }),
  reset: () => set({ collections: [], isLoading: false, error: null }),
}));

export default useCollectionStore;
