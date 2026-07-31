import { create } from 'zustand';
import { User, AuthState } from '../types/auth';
import { apiClient } from '../api/client';
import useWorkspaceStore from './workspaceStore';
import useCollectionStore from './collectionStore';
import useEnvironmentStore from './environmentStore';
import useHistoryStore from './historyStore';

interface AuthActions {
  login: (email: string, password: string, turnstileToken?: string) => Promise<void>;
  register: (data: Record<string, string>) => Promise<void>;
  logout: () => void;
  loadProfile: () => Promise<void>;
  clearError: () => void;
}

const getInitialState = (): AuthState => {
  const accessToken = localStorage.getItem('accessToken');
  const refreshToken = localStorage.getItem('refreshToken');
  return {
    user: null,
    accessToken,
    refreshToken,
    isAuthenticated: !!accessToken,
    isLoading: false,
    error: null,
  };
};

export const useAuthStore = create<AuthState & AuthActions>((set, get) => {
  if (typeof window !== 'undefined') {
    window.addEventListener('auth-logout', () => {
      useWorkspaceStore.getState().reset();
      useHistoryStore.getState().reset();
      set({
        user: null,
        accessToken: null,
        refreshToken: null,
        isAuthenticated: false,
        isLoading: false,
        error: 'Session expired. Please log in again.',
      });
    });
  }

  return {
    ...getInitialState(),

    clearError: () => set({ error: null }),

    login: async (email, password, turnstileToken) => {
      set({ isLoading: true, error: null });
      try {
        const tokens = await apiClient<{ access: string; refresh: string }>(
          '/api/accounts/login/',
          {
            method: 'POST',
            body: JSON.stringify({ email, password, turnstile_token: turnstileToken }),
            skipAuth: true,
          }
        );

        localStorage.setItem('accessToken', tokens.access);
        localStorage.setItem('refreshToken', tokens.refresh);

        set({
          accessToken: tokens.access,
          refreshToken: tokens.refresh,
        });

        await get().loadProfile();
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Login failed. Please check your credentials.';
        set({
          error: message,
          isLoading: false,
        });
        throw err;
      }
    },

    register: async data => {
      set({ isLoading: true, error: null });
      try {
        await apiClient<User>('/api/accounts/register/', {
          method: 'POST',
          body: JSON.stringify(data),
          skipAuth: true,
        });

        await get().login(data.email, data.password);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Registration failed. Please check your details.';
        set({
          error: message,
          isLoading: false,
        });
        throw err;
      }
    },

    logout: () => {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      useWorkspaceStore.getState().reset();
      useCollectionStore.getState().reset();
      useEnvironmentStore.getState().reset();
      useHistoryStore.getState().reset();
      set({
        user: null,
        accessToken: null,
        refreshToken: null,
        isAuthenticated: false,
        error: null,
      });
    },

    loadProfile: async () => {
      const { accessToken } = get();
      if (!accessToken) {
        set({ isLoading: false, isAuthenticated: false });
        return;
      }

      set({ isLoading: true, error: null });
      try {
        const user = await apiClient<User>('/api/accounts/me/');
        set({
          user,
          isAuthenticated: true,
          isLoading: false,
        });
      } catch (err) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        useWorkspaceStore.getState().reset();
        useHistoryStore.getState().reset();
        const message = err instanceof Error ? err.message : 'Failed to retrieve profile.';
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
          isLoading: false,
          error: message,
        });
      }
    },
  };
});
