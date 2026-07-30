import { create } from 'zustand';
import { apiClient } from '../api/client';

export interface Collection {
  id: string;
  name: string;
  description?: string;
  workspace: string;
  parent?: string | null;
  created_at: string;
  updated_at: string;
  // You might have these fields based on your backend
  // type?: 'folder' | 'request';
  // request?: RequestData;
}

interface CollectionStore {
  collections: Collection[];
  isLoading: boolean;
  error: string | null;
  fetchCollections: (workspaceId: string) => Promise<void>;
  createCollection: (data: {
    name: string;
    workspace: string;
    parent?: string | null;
  }) => Promise<Collection | null>;
  deleteCollection: (id: string) => Promise<void>;
  clearError: () => void;
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

  createCollection: async (data: { name: string; workspace: string; parent?: string | null }) => {
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

  deleteCollection: async (id: string) => {
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
}));

export default useCollectionStore;
