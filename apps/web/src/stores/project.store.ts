import { create } from 'zustand';
import { ProjectSummary } from '@aljama/shared';

export type ViewMode = 'list' | 'reading' | 'dashboard';

interface ProjectState {
  currentProject: ProjectSummary | null;
  selectedFolderId: string | null;
  selectedItemId: string | null;
  searchQuery: string;
  activeView: ViewMode;
  isSidebarOpen: boolean;
  setCurrentProject: (project: ProjectSummary | null) => void;
  setSelectedFolderId: (folderId: string | null) => void;
  setSelectedItemId: (itemId: string | null) => void;
  setSearchQuery: (query: string) => void;
  setActiveView: (view: ViewMode) => void;
  toggleSidebar: () => void;
}

export const useProjectStore = create<ProjectState>((set) => ({
  currentProject: null,
  selectedFolderId: null,
  selectedItemId: null,
  searchQuery: '',
  activeView: 'list',
  isSidebarOpen: true,

  setCurrentProject: (project) =>
    set({
      currentProject: project,
      selectedFolderId: null,
      selectedItemId: null,
      searchQuery: '',
    }),

  setSelectedFolderId: (folderId) =>
    set({
      selectedFolderId: folderId,
      selectedItemId: null, // clear item selection when folder is selected
    }),

  setSelectedItemId: (itemId) =>
    set({
      selectedItemId: itemId,
    }),

  setSearchQuery: (searchQuery) => set({ searchQuery }),

  setActiveView: (activeView) => set({ activeView }),

  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
}));
