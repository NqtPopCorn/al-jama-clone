import { create } from 'zustand';
import { UserSummary } from '@aljama/shared';
import { api } from '../lib/api';

interface AuthState {
  user: UserSummary | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (login: string, pass: string) => Promise<void>;
  logout: () => void;
  fetchProfile: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: localStorage.getItem('aljama_user')
    ? JSON.parse(localStorage.getItem('aljama_user')!)
    : null,
  token: localStorage.getItem('aljama_token'),
  isAuthenticated: !!localStorage.getItem('aljama_token'),
  isLoading: false,

  login: async (login: string, pass: string) => {
    set({ isLoading: true });
    try {
      const response = await api.post('/auth/login', { login, password: pass });
      const { accessToken, user } = response.data.data;

      localStorage.setItem('aljama_token', accessToken);
      localStorage.setItem('aljama_user', JSON.stringify(user));

      set({
        token: accessToken,
        user,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  logout: () => {
    localStorage.removeItem('aljama_token');
    localStorage.removeItem('aljama_user');
    set({
      user: null,
      token: null,
      isAuthenticated: false,
    });
  },

  fetchProfile: async () => {
    try {
      const response = await api.get('/auth/me');
      const user = response.data.data;
      localStorage.setItem('aljama_user', JSON.stringify(user));
      set({ user, isAuthenticated: true });
    } catch (error) {
      localStorage.removeItem('aljama_token');
      localStorage.removeItem('aljama_user');
      set({ user: null, token: null, isAuthenticated: false });
    }
  },
}));
