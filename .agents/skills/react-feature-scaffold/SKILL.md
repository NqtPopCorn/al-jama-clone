---
name: react-feature-scaffold
description: |
  Skill để tạo một feature module mới trong React frontend của AL-JAMA.
  Bao gồm: component structure, hooks, API integration với TanStack Query,
  Zustand store, và shadcn/ui patterns. Sử dụng khi cần tạo feature mới hoặc
  thêm page/component vào feature hiện có.
---

# React Feature Scaffold — AL-JAMA

## Khi nào sử dụng

- Tạo feature module mới trong `src/features/`
- Thêm page/component vào feature hiện có
- Cần tham khảo patterns cho data fetching, state management, UI

## Cấu trúc chuẩn cho 1 feature

```
src/features/{feature-name}/
├── components/                  # Feature-specific components
│   ├── {FeatureName}List.tsx
│   ├── {FeatureName}Detail.tsx
│   ├── {FeatureName}Form.tsx
│   └── {FeatureName}Card.tsx
├── hooks/                       # Feature-specific hooks
│   ├── use{FeatureName}s.ts     # List query
│   ├── use{FeatureName}.ts      # Single item query
│   ├── useCreate{FeatureName}.ts # Mutation
│   └── useUpdate{FeatureName}.ts # Mutation
├── api/                         # API layer
│   └── {feature-name}.api.ts    # Axios/fetch calls
├── types/                       # Feature-specific types
│   └── {feature-name}.types.ts
├── stores/                      # Zustand stores (if needed for UI state)
│   └── {feature-name}.store.ts
└── index.ts                     # Public API barrel export
```

## Template: API Layer

```typescript
// src/features/item/api/item.api.ts
import { apiClient } from '@/lib/api-client';
import { Item, CreateItemDto, UpdateItemDto, ItemsQuery } from '../types/item.types';

export const itemApi = {
  getAll: (query: ItemsQuery) =>
    apiClient.get<{ data: Item[]; total: number }>('/items', { params: query }),

  getById: (id: string) => apiClient.get<Item>(`/items/${id}`),

  create: (dto: CreateItemDto) => apiClient.post<Item>('/items', dto),

  update: (id: string, dto: UpdateItemDto) => apiClient.patch<Item>(`/items/${id}`, dto),

  delete: (id: string) => apiClient.delete(`/items/${id}`),
};
```

## Template: TanStack Query Hooks

```typescript
// src/features/item/hooks/useItems.ts
import { useQuery } from '@tanstack/react-query';
import { itemApi } from '../api/item.api';
import { ItemsQuery } from '../types/item.types';

export const itemKeys = {
  all: ['items'] as const,
  lists: () => [...itemKeys.all, 'list'] as const,
  list: (query: ItemsQuery) => [...itemKeys.lists(), query] as const,
  details: () => [...itemKeys.all, 'detail'] as const,
  detail: (id: string) => [...itemKeys.details(), id] as const,
};

export function useItems(query: ItemsQuery) {
  return useQuery({
    queryKey: itemKeys.list(query),
    queryFn: () => itemApi.getAll(query),
  });
}

export function useItem(id: string) {
  return useQuery({
    queryKey: itemKeys.detail(id),
    queryFn: () => itemApi.getById(id),
    enabled: !!id,
  });
}
```

```typescript
// src/features/item/hooks/useCreateItem.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { itemApi } from '../api/item.api';
import { itemKeys } from './useItems';
import { toast } from 'sonner';

export function useCreateItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: itemApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: itemKeys.lists() });
      toast.success('Item created successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create item');
    },
  });
}
```

## Template: Zustand Store (UI State)

```typescript
// src/features/explorer/stores/explorer.store.ts
import { create } from 'zustand';

interface ExplorerState {
  selectedFolderId: string | null;
  expandedFolderIds: Set<string>;
  viewMode: 'list' | 'reading';

  // Actions
  setSelectedFolder: (id: string | null) => void;
  toggleFolder: (id: string) => void;
  setViewMode: (mode: 'list' | 'reading') => void;
}

export const useExplorerStore = create<ExplorerState>(set => ({
  selectedFolderId: null,
  expandedFolderIds: new Set(),
  viewMode: 'list',

  setSelectedFolder: id => set({ selectedFolderId: id }),

  toggleFolder: id =>
    set(state => {
      const next = new Set(state.expandedFolderIds);
      next.has(id) ? next.delete(id) : next.add(id);
      return { expandedFolderIds: next };
    }),

  setViewMode: mode => set({ viewMode: mode }),
}));
```

## Template: Component with shadcn/ui

```tsx
// src/features/item/components/ItemList.tsx
import { useItems } from '../hooks/useItems';
import { useExplorerStore } from '@/features/explorer/stores/explorer.store';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

export function ItemList() {
  const { selectedFolderId } = useExplorerStore();
  const { data, isLoading, isError } = useItems({
    folderId: selectedFolderId ?? undefined,
  });

  if (isLoading) return <ItemListSkeleton />;
  if (isError) return <div>Error loading items</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Items</h2>
        <Button size="sm">
          <Plus className="mr-2 h-4 w-4" />
          New Item
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Key</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Priority</TableHead>
            <TableHead>Assignee</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data?.data.map(item => (
            <TableRow key={item.id} className="cursor-pointer hover:bg-muted/50">
              <TableCell className="font-mono text-sm">{item.itemKey}</TableCell>
              <TableCell>{item.name}</TableCell>
              <TableCell>
                <Badge variant="outline">{item.itemType.name}</Badge>
              </TableCell>
              <TableCell>{item.priority}</TableCell>
              <TableCell>{item.assignee?.fullName ?? '—'}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function ItemListSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} className="h-12 w-full" />
      ))}
    </div>
  );
}
```

## Template: Page Component

```tsx
// src/features/item/pages/ItemDetailPage.tsx
import { useParams } from 'react-router-dom';
import { useItem } from '../hooks/useItem';
import { ItemEditor } from '../components/ItemEditor';
import { RelationshipsPanel } from '@/features/traceability/components/RelationshipsPanel';
import { StreamPanel } from '@/features/collaboration/components/StreamPanel';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export function ItemDetailPage() {
  const { itemId } = useParams<{ itemId: string }>();
  const { data: item, isLoading } = useItem(itemId!);

  if (isLoading) return <div>Loading...</div>;
  if (!item) return <div>Item not found</div>;

  return (
    <div className="flex h-full">
      {/* Main content */}
      <div className="flex-1 overflow-auto p-6">
        <ItemEditor item={item} />
      </div>

      {/* Side panel */}
      <div className="w-96 border-l">
        <Tabs defaultValue="relationships">
          <TabsList className="w-full">
            <TabsTrigger value="relationships">Relationships</TabsTrigger>
            <TabsTrigger value="stream">Stream</TabsTrigger>
            <TabsTrigger value="versions">Versions</TabsTrigger>
          </TabsList>
          <TabsContent value="relationships">
            <RelationshipsPanel itemId={item.id} />
          </TabsContent>
          <TabsContent value="stream">
            <StreamPanel scopeType="item" scopeId={item.id} />
          </TabsContent>
          <TabsContent value="versions">{/* Version history */}</TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
```

## Rules

1. **Data fetching CHỈ dùng TanStack Query** — không `useEffect` + `useState` cho API calls
2. **Query keys follow factory pattern** — `itemKeys.detail(id)`, `itemKeys.list(query)`
3. **Mutations invalidate related queries** — ví dụ `create` invalidate `lists()`
4. **UI state in Zustand** — server state in TanStack Query cache
5. **Components dùng shadcn/ui** làm base — customize qua Tailwind classes
6. **Loading states**: luôn có Skeleton/Spinner, **error states**: luôn có fallback UI
7. **Barrel exports** từ `index.ts` — không import internal components từ feature khác
8. **Icons dùng lucide-react** — consistent với shadcn/ui ecosystem
