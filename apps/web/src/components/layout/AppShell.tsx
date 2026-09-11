import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { useAuthStore } from '../../stores/auth.store';
import { useProjectStore } from '../../stores/project.store';
import { AppHeader, MainNavTab } from './AppHeader';
import { ProjectSubHeader } from './ProjectSubHeader';
import { WorkspaceTabs, WorkspaceTabId } from './WorkspaceTabs';
import { HomeView } from '../../features/home/HomeView';
import { ExplorerSidebar } from '../../features/explorer/ExplorerSidebar';
import { ListView } from '../../features/item/ListView';
import { ReadingView } from '../../features/item/ReadingView';
import { ProjectDashboard } from '../../features/project/ProjectDashboard';
import { ItemDetailView } from '../../features/item/components/item-detail-view';
import { CreateItemModal } from '../../features/item/components/create-item-modal';
import { TraceView } from '../../features/traceability/components/TraceView';
import { ProjectStreamView } from '../../features/collaboration/ProjectStreamView';
import {
  ReviewsHomeView,
  ReviewExecutionView,
  StartReviewWizard,
  ReviewWizardItemInfo,
} from '../../features/review';
import { useProjectMeta } from '../../features/item/hooks/use-project-meta';
import { ProjectSummary, LicenseType } from '@aljama/shared';

export const AppShell: React.FC = () => {
  const { user } = useAuthStore();
  const {
    currentProject,
    setCurrentProject,
    selectedFolderId,
    setSelectedFolderId,
    activeView,
    searchQuery,
    isSidebarOpen,
    itemTypeFilter,
    statusFilter,
    priorityFilter,
    lastModifiedFilter,
  } = useProjectStore();

  // Navigation and perspective states
  const [mainNavTab, setMainNavTab] = useState<MainNavTab>('projects');
  const [perspective, setPerspective] = useState<WorkspaceTabId>('workspace');
  const [openTabs, setOpenTabs] = useState<WorkspaceTabId[]>(['welcome', 'dashboard', 'workspace']);

  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState('updatedAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedReviewId, setSelectedReviewId] = useState<string | null>(null);

  // 1. Fetch User Projects
  const { data: projectsData } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const res = await api.get('/projects');
      return res.data.data as ProjectSummary[];
    },
  });

  // Set default project when loaded
  useEffect(() => {
    if (projectsData && projectsData.length > 0 && !currentProject) {
      setCurrentProject(projectsData[0]);
    }
  }, [projectsData, currentProject, setCurrentProject]);

  const projectId = currentProject?.id;
  const isReviewerLimited = user?.licenseType === LicenseType.REVIEWER_LIMITED;

  // 2. Fetch Project Details / Dashboard
  const { data: projectDetails, isLoading: isLoadingDetails } = useQuery({
    queryKey: ['project-details', projectId],
    queryFn: async () => {
      if (!projectId) return null;
      const res = await api.get(`/projects/${projectId}`);
      return res.data.data;
    },
    enabled: !!projectId,
  });

  // 3. Fetch Explorer Tree
  const { data: explorerTree, isLoading: isLoadingTree } = useQuery({
    queryKey: ['explorer-tree', projectId],
    queryFn: async () => {
      if (!projectId || isReviewerLimited) return [];
      const res = await api.get(`/projects/${projectId}/explorer-tree`);
      return res.data.data;
    },
    enabled: !!projectId && !isReviewerLimited,
  });

  // 4. Fetch Items for List View
  const { data: itemsData, isLoading: isLoadingItems } = useQuery({
    queryKey: [
      'items',
      projectId,
      selectedFolderId,
      itemTypeFilter,
      statusFilter,
      priorityFilter,
      lastModifiedFilter,
      searchQuery,
      page,
      sortBy,
      sortOrder,
    ],
    queryFn: async () => {
      if (!projectId || isReviewerLimited) return null;
      const params = new URLSearchParams({
        page: String(page),
        limit: '20',
        sortBy,
        sortOrder,
      });

      if (selectedFolderId) params.append('folderId', selectedFolderId);
      if (itemTypeFilter) params.append('itemTypeId', itemTypeFilter);
      if (statusFilter) params.append('status', statusFilter);
      if (priorityFilter) params.append('priority', priorityFilter);
      if (lastModifiedFilter) params.append('lastModified', lastModifiedFilter);
      if (searchQuery) params.append('search', searchQuery);

      const res = await api.get(`/projects/${projectId}/items?${params.toString()}`);
      return res.data.data;
    },
    enabled: !!projectId && !isReviewerLimited && activeView === 'list',
  });

  // 5. Fetch Reading View Items
  const { data: readingItems, isLoading: isLoadingReading } = useQuery({
    queryKey: ['reading-view', projectId, selectedFolderId],
    queryFn: async () => {
      if (!projectId || isReviewerLimited) return [];
      const params = new URLSearchParams();
      if (selectedFolderId) params.append('folderId', selectedFolderId);

      const res = await api.get(`/projects/${projectId}/reading-view?${params.toString()}`);
      return res.data.data;
    },
    enabled: !!projectId && !isReviewerLimited && activeView === 'reading',
  });

  const handleSortChange = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  const handleOpenProject = (projId: string) => {
    const selected = projectsData?.find(p => p.id === projId);
    if (selected) {
      setCurrentProject(selected);
      setMainNavTab('projects');
      setPerspective('workspace');
      if (!openTabs.includes('workspace')) {
        setOpenTabs(prev => [...prev, 'workspace']);
      }
    }
  };

  // Local item tabs and create item modal states
  const [openItemTabs, setOpenItemTabs] = useState<
    Array<{ id: string; key: string; name: string }>
  >([]);
  const [isCreateItemOpen, setIsCreateItemOpen] = useState(false);

  // Review wizard state for context menu "Send for review"
  const [reviewWizardState, setReviewWizardState] = useState<{
    isOpen: boolean;
    reviewName?: string;
    sourceFilterName?: string;
    items?: ReviewWizardItemInfo[];
  }>({ isOpen: false });

  // Fetch project meta (itemTypes, folders, members)
  const { itemTypes, folders, members } = useProjectMeta(projectId);

  const handleOpenItem = (id: string, key?: string, name?: string) => {
    setMainNavTab('projects');
    setOpenItemTabs(prev => {
      if (prev.some(t => t.id === id)) return prev;
      return [...prev, { id, key: key || 'ITEM', name: name || 'Item Details' }];
    });
    setPerspective(`item:${id}`);
  };

  const handleOpenTraceability = () => {
    setMainNavTab('projects');
    if (!openTabs.includes('traceability')) {
      setOpenTabs(prev => [...prev, 'traceability']);
    }
    setPerspective('traceability');
  };

  const handleSelectRootDashboard = () => {
    if (!openTabs.includes('dashboard')) {
      setOpenTabs(prev => [...prev, 'dashboard']);
    }
    setPerspective('dashboard');
    setSelectedFolderId(null);
  };

  const handleSelectFolder = (folderId: string | null) => {
    setSelectedFolderId(folderId);
    if (perspective === 'dashboard' || perspective === 'welcome') {
      if (!openTabs.includes('workspace')) {
        setOpenTabs(prev => [...prev, 'workspace']);
      }
      setPerspective('workspace');
    }
  };

  const handleCloseTab = (tabToClose: WorkspaceTabId) => {
    if (typeof tabToClose === 'string' && tabToClose.startsWith('item:')) {
      const itemId = tabToClose.replace('item:', '');
      const nextItemTabs = openItemTabs.filter(t => t.id !== itemId);
      setOpenItemTabs(nextItemTabs);
      if (perspective === tabToClose) {
        if (nextItemTabs.length > 0) {
          setPerspective(`item:${nextItemTabs[nextItemTabs.length - 1].id}`);
        } else if (openTabs.length > 0) {
          setPerspective(openTabs[openTabs.length - 1]);
        } else {
          setMainNavTab('home');
        }
      }
      return;
    }

    const nextTabs = openTabs.filter(t => t !== tabToClose);
    setOpenTabs(nextTabs);

    // If the closed tab was the active one, activate the last remaining tab
    if (perspective === tabToClose) {
      if (nextTabs.length > 0) {
        setPerspective(nextTabs[nextTabs.length - 1]);
      } else if (openItemTabs.length > 0) {
        setPerspective(`item:${openItemTabs[openItemTabs.length - 1].id}`);
      } else {
        // If all workspace tabs are closed, go to Home
        setMainNavTab('home');
      }
    }
  };

  const handleTabChange = (tab: MainNavTab) => {
    setMainNavTab(tab);
    if (tab === 'projects') {
      if (!openTabs.includes('workspace')) {
        setOpenTabs(prev => [...prev, 'workspace']);
      }
      setPerspective('workspace');
    }
  };

  const handleNavigateToReview = (reviewId: string) => {
    setMainNavTab('reviews');
    setSelectedReviewId(reviewId);
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-[#eef2f6] text-slate-800 overflow-hidden font-sans select-none">
      {/* 1. App Header: Supports Dark & Light header themes (Matching Image 2, 3, 4) */}
      <AppHeader
        activeTab={mainNavTab}
        onTabChange={handleTabChange}
        onNavigateToItem={handleOpenItem}
        onNavigateToReview={handleNavigateToReview}
        onOpenTraceability={handleOpenTraceability}
      />

      {/* 2. When Home Nav Tab is selected -> display Image 2 Home View WITHOUT tab bar */}
      {mainNavTab === 'home' ? (
        <div className="flex-1 flex flex-col overflow-hidden">
          <HomeView projects={projectsData} onOpenProject={handleOpenProject} />
        </div>
      ) : mainNavTab === 'stream' ? (
        <ProjectStreamView onOpenItem={handleOpenItem} />
      ) : mainNavTab === 'projects' ? (
        /* 3. Projects Workspace (Image 3 & 4) */
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Project Sub-Header: Title + Scope Search */}
          <ProjectSubHeader />

          {/* Workspace Tabs with Close Buttons [X] */}
          <WorkspaceTabs
            projects={projectsData}
            activePerspective={perspective}
            openTabs={openTabs}
            itemTabs={openItemTabs}
            onPerspectiveChange={setPerspective}
            onCloseTab={handleCloseTab}
          />

          {/* Main Project Workspace Layout: Sidebar is ALWAYS displayed on the left for both Dashboard and Workspace */}
          <div className="flex-1 flex overflow-hidden bg-white">
            {/* Left Explorer Sidebar (Image 3) */}
            <aside
              className={`transition-all duration-150 flex flex-col shrink-0 ${
                isSidebarOpen ? 'w-72' : 'w-0'
              } overflow-hidden`}
            >
              <ExplorerSidebar
                nodes={explorerTree}
                isLoading={isLoadingTree}
                activePerspective={perspective}
                onSelectRootDashboard={handleSelectRootDashboard}
                onSelectFolder={handleSelectFolder}
                onSelectItem={handleOpenItem}
                onOpenCreateItem={() => setIsCreateItemOpen(true)}
                onSendForReview={config => {
                  setReviewWizardState({
                    isOpen: true,
                    reviewName: config.reviewName,
                    sourceFilterName: config.sourceFilterName,
                    items: config.items,
                  });
                }}
              />
            </aside>

            {/* Right Main Content Area: Dashboard, List View, Reading View, or Item Detail */}
            <main className="flex-1 flex flex-col overflow-hidden bg-white">
              {typeof perspective === 'string' && perspective.startsWith('item:') ? (
                /* Item Detail View (Matching Jama Connect Image 4 & 5) */
                <ItemDetailView
                  itemId={perspective.replace('item:', '')}
                  projectId={projectId || ''}
                  projectName={currentProject?.name}
                  onCloseTab={() => handleCloseTab(perspective)}
                  onOpenCreateItem={() => setIsCreateItemOpen(true)}
                />
              ) : perspective === 'dashboard' ? (
                /* Dashboard with Explorer tree visible on the left */
                <ProjectDashboard
                  projectDetails={projectDetails}
                  isLoading={isLoadingDetails}
                  onOpenListView={() => {
                    if (!openTabs.includes('workspace')) {
                      setOpenTabs(prev => [...prev, 'workspace']);
                    }
                    setPerspective('workspace');
                  }}
                />
              ) : perspective === 'welcome' ? (
                /* Welcome Perspective inside workspace tab */
                <HomeView projects={projectsData} onOpenProject={handleOpenProject} />
              ) : perspective === 'traceability' ? (
                /* Dedicated Traceability Matrix Tab */
                <div className="flex-1 overflow-hidden flex flex-col bg-white">
                  {projectId && (
                    <TraceView
                      projectId={projectId}
                      onNavigateToItem={id => {
                        const it = itemsData?.items?.find((i: { id: string }) => i.id === id);
                        handleOpenItem(id, it?.itemKey || 'Item', it?.name || '');
                      }}
                    />
                  )}
                </div>
              ) : (
                /* Project Workspace: List View or Reading View */
                <div className="flex-1 overflow-hidden flex flex-col">
                  {activeView === 'reading' ? (
                    <ReadingView
                      items={readingItems || []}
                      isLoading={isLoadingReading}
                      onOpenItem={handleOpenItem}
                      onOpenTraceability={handleOpenTraceability}
                    />
                  ) : (
                    <ListView
                      data={itemsData}
                      isLoading={isLoadingItems}
                      page={page}
                      sortBy={sortBy}
                      sortOrder={sortOrder}
                      onPageChange={setPage}
                      onSortChange={handleSortChange}
                      onOpenItem={handleOpenItem}
                      onOpenCreateItem={() => setIsCreateItemOpen(true)}
                      onOpenTraceability={handleOpenTraceability}
                    />
                  )}
                </div>
              )}
            </main>
          </div>
        </div>
      ) : mainNavTab === 'reviews' ? (
        selectedReviewId ? (
          <ReviewExecutionView
            reviewId={selectedReviewId}
            onBack={() => setSelectedReviewId(null)}
          />
        ) : (
          <ReviewsHomeView
            onSelectReview={id => setSelectedReviewId(id)}
            projectId={projectId}
            projectName={currentProject?.name}
            projectMembers={members.map(m => ({
              userId: m.userId,
              fullName: m.fullName,
              username: m.username,
            }))}
          />
        )
      ) : (
        /* Other Navigation Tabs (Stream, Admin) */
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-white">
          <div className="max-w-md space-y-3">
            <h2 className="text-xl font-bold text-slate-800 capitalize">{mainNavTab} Center</h2>
            <p className="text-xs text-slate-500 leading-relaxed">
              The {mainNavTab} center is configured in the modular architecture. Stream
              conversations and review cycles are accessible directly from individual items and
              projects.
            </p>
            <button
              type="button"
              onClick={() => {
                setMainNavTab('projects');
                setPerspective('workspace');
              }}
              className="px-4 py-2 bg-[#203a6b] hover:bg-[#1a2f55] text-white text-xs font-semibold rounded shadow transition-colors"
            >
              Return to Project Workspace
            </button>
          </div>
        </div>
      )}

      {/* Create Item Modal */}
      {projectId && currentProject && (
        <CreateItemModal
          isOpen={isCreateItemOpen}
          onClose={() => setIsCreateItemOpen(false)}
          projectId={projectId}
          projectName={currentProject.name}
          defaultFolderId={selectedFolderId}
          itemTypes={itemTypes}
          folders={folders}
          members={members}
          onItemCreated={_newItemId => {
            // Can optionally focus the newly created item or list will refetch
          }}
        />
      )}

      {/* Start Review Wizard (Triggered from Explorer context menu or Filters tab context menu) */}
      {reviewWizardState.isOpen && projectId && currentProject && (
        <StartReviewWizard
          isOpen={reviewWizardState.isOpen}
          onClose={() => setReviewWizardState({ isOpen: false })}
          projectId={projectId}
          projectName={currentProject.name}
          defaultReviewName={reviewWizardState.reviewName}
          sourceFilterName={reviewWizardState.sourceFilterName}
          initialItems={reviewWizardState.items}
          preselectedItemIds={reviewWizardState.items?.map(i => i.id)}
          members={members.map(m => ({
            userId: m.userId,
            fullName: m.fullName,
            username: m.username,
          }))}
          onSuccess={newReviewId => {
            setReviewWizardState({ isOpen: false });
            setMainNavTab('reviews');
            setSelectedReviewId(newReviewId);
          }}
        />
      )}
    </div>
  );
};
