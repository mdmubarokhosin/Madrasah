import { create } from 'zustand';
import type { Admin, SiteSettings } from '@/types';
import type { PageName } from '@/types';

interface AppState {
  // Navigation
  currentPage: PageName;
  previousPage: PageName;
  setCurrentPage: (page: PageName) => void;
  goBack: () => void;

  // Auth
  admin: Admin | null;
  token: string | null;
  setAuth: (admin: Admin, token: string) => void;
  clearAuth: () => void;

  // Site settings
  siteSettings: SiteSettings;
  setSiteSettings: (settings: SiteSettings) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  // Navigation
  currentPage: 'home',
  previousPage: 'home',
  setCurrentPage: (page) => set({ previousPage: get().currentPage, currentPage: page }),
  goBack: () => set((s) => ({ currentPage: s.previousPage })),

  // Auth
  admin: typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('madrasa_admin') || 'null') : null,
  token: typeof window !== 'undefined' ? localStorage.getItem('madrasa_token') : null,
  setAuth: (admin, token) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('madrasa_admin', JSON.stringify(admin));
      localStorage.setItem('madrasa_token', token);
    }
    set({ admin, token });
  },
  clearAuth: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('madrasa_admin');
      localStorage.removeItem('madrasa_token');
    }
    set({ admin: null, token: null, currentPage: 'admin-login' });
  },

  // Site settings
  siteSettings: {},
  setSiteSettings: (settings) => set({ siteSettings: settings }),
}));
