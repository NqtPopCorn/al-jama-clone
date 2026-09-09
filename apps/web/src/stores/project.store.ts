import { create } from 'zustand';
import { ProjectSummary } from '@aljama/shared';

export type ViewMode = 'list' | 'reading' | 'dashboard' | 'trace';

interface ProjectState {
  currentProject: ProjectSummary | null;
  selectedFolderId: string | null;
  selectedItemId: string | null;
  searchQuery: string;
  activeView: ViewMode;
  isSidebarOpen: boolean;
  isFilterSidebarOpen: boolean;
  itemTypeFilter: string;
  statusFilter: string;
  priorityFilter: string;
  lastModifiedFilter: string;
  setCurrentProject: (project: ProjectSummary | null) => void;
  setSelectedFolderId: (folderId: string | null) => void;
  setSelectedItemId: (itemId: string | null) => void;
  setSearchQuery: (query: string) => void;
  setActiveView: (view: ViewMode) => void;
  toggleSidebar: () => void;
  toggleFilterSidebar: () => void;
  setFilterSidebarOpen: (open: boolean) => void;
  setItemTypeFilter: (typeId: string) => void;
  setStatusFilter: (status: string) => void;
  setPriorityFilter: (priority: string) => void;
  setLastModifiedFilter: (modified: string) => void;
  resetFilters: () => void;
}

export const useProjectStore = create<ProjectState>(set => ({
  currentProject: null,
  selectedFolderId: null,
  selectedItemId: null,
  searchQuery: '',
  activeView: 'list',
  isSidebarOpen: true,
  isFilterSidebarOpen: false,
  itemTypeFilter: '',
  statusFilter: '',
  priorityFilter: '',
  lastModifiedFilter: '',

  setCurrentProject: project =>
    set({
      currentProject: project,
      selectedFolderId: null,
      selectedItemId: null,
      searchQuery: '',
      itemTypeFilter: '',
      statusFilter: '',
      priorityFilter: '',
      lastModifiedFilter: '',
    }),

  setSelectedFolderId: folderId =>
    set({
      selectedFolderId: folderId,
      selectedItemId: null, // clear item selection when folder is selected
    }),

  setSelectedItemId: itemId =>
    set({
      selectedItemId: itemId,
    }),

  setSearchQuery: searchQuery => set({ searchQuery }),

  setActiveView: activeView => set({ activeView }),

  toggleSidebar: () => set(state => ({ isSidebarOpen: !state.isSidebarOpen })),

  toggleFilterSidebar: () => set(state => ({ isFilterSidebarOpen: !state.isFilterSidebarOpen })),

  setFilterSidebarOpen: isFilterSidebarOpen => set({ isFilterSidebarOpen }),

  setItemTypeFilter: itemTypeFilter => set({ itemTypeFilter }),

  setStatusFilter: statusFilter => set({ statusFilter }),

  setPriorityFilter: priorityFilter => set({ priorityFilter }),

  setLastModifiedFilter: lastModifiedFilter => set({ lastModifiedFilter }),

  resetFilters: () =>
    set({
      searchQuery: '',
      itemTypeFilter: '',
      statusFilter: '',
      priorityFilter: '',
      lastModifiedFilter: '',
    }),
}));
