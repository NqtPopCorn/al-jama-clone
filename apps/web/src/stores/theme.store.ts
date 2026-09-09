import { create } from 'zustand';

export type HeaderTheme = 'dark' | 'light';

interface ThemeState {
  headerTheme: HeaderTheme;
  setHeaderTheme: (theme: HeaderTheme) => void;
  toggleHeaderTheme: () => void;
}

export const useThemeStore = create<ThemeState>((set) => ({
  headerTheme: (localStorage.getItem('aljama_header_theme') as HeaderTheme) || 'dark',

  setHeaderTheme: (headerTheme) => {
    localStorage.setItem('aljama_header_theme', headerTheme);
    set({ headerTheme });
  },

  toggleHeaderTheme: () => {
    set((state) => {
      const next = state.headerTheme === 'dark' ? 'light' : 'dark';
      localStorage.setItem('aljama_header_theme', next);
      return { headerTheme: next };
    });
  },
}));
