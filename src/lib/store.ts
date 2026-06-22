import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export type ViewMode = 'upload' | 'dashboard';
export type EntryType = 'POST' | 'PAGE' | 'DRAFT' | 'COMMENT' | '';
export type EntryStatus = 'pending' | 'approved' | 'discarded' | 'needs_editing' | 'published' | '';
export type SortField = 'publishedAt' | 'title' | 'wordCount' | 'commentCount';
export type SortOrder = 'asc' | 'desc';

export interface Stats {
  total: number;
  posts: number;
  pages: number;
  drafts: number;
  comments: number;
  approved: number;
  pending: number;
  discarded: number;
  published: number;
  needsEditing: number;
  withIssues: number;
  totalWords: number;
  labels: string[];
  issueBreakdown?: {
    deadImages: number;
    flashEmbeds: number;
    noTitle: number;
    emptyOrShort: number;
  };
}

export interface DebugInfo {
  parseStrategy: string;
  firstEntryKeys: string[];
  sampleTitle: string;
  sampleBloggerType: string;
  sampleBloggerStatus: string;
  sampleFilename: string;
}

export interface UploadResult {
  blogTitle: string;
  blogAuthor: string;
  totalEntries: number;
  storedCount: number;
  skippedTypes: { type: string; count: number }[];
  breakdown: { POST: number; PAGE: number; DRAFT: number; COMMENT: number };
  debugInfo?: DebugInfo;
}

export interface EntryListItem {
  id: string;
  entryId: string;
  entryType: string;
  title: string;
  publishedAt: string | null;
  author: string | null;
  labels: string;
  status: string;
  issues: string;
  wordCount: number;
  commentCount: number;
  platforms: string;
  nostalgiaScore: number;
  smokeIndex: number;
}

interface AppState {
  view: ViewMode;
  uploadResult: UploadResult | null;
  stats: Stats | null;
  selectedId: string | null;
  selectedEntry: FullEntry | null;
  filters: {
    type: EntryType;
    status: EntryStatus;
    label: string;
    search: string;
    sortBy: SortField;
    sortOrder: SortOrder;
    page: number;
  };
  isLoading: boolean;
  isPreviewOpen: boolean;
  refreshTrigger: number;
  publishedEntries: string[]; // entry IDs that were exported as museum cards

  setView: (v: ViewMode) => void;
  setUploadResult: (r: UploadResult) => void;
  setStats: (s: Stats) => void;
  setSelectedId: (id: string | null) => void;
  setSelectedEntry: (e: FullEntry | null) => void;
  setFilter: <K extends keyof AppState['filters']>(key: K, value: AppState['filters'][K]) => void;
  setLoading: (l: boolean) => void;
  setPreviewOpen: (open: boolean) => void;
  bumpRefresh: () => void;
  markPublished: (ids: string[]) => void;
  isEntryPublished: (id: string) => boolean;
  resetAll: () => void;
}

export interface FullEntry {
  id: string;
  entryId: string;
  entryType: string;
  title: string;
  content: string;
  publishedAt: string | null;
  atomUpdated: string | null;
  author: string | null;
  labels: string;
  originalUrl: string | null;
  status: string;
  issues: string;
  wordCount: number;
  commentCount: number;
  parentId: string | null;
  platforms: string;
  nostalgiaScore: number;
  smokeIndex: number;
  createdAt: string;
  updatedAt: string;
}

const initialFilters = {
  type: '' as EntryType,
  status: '' as EntryStatus,
  label: '',
  search: '',
  sortBy: 'publishedAt' as SortField,
  sortOrder: 'desc' as SortOrder,
  page: 1,
};

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      view: 'upload',
      uploadResult: null,
      stats: null,
      selectedId: null,
      selectedEntry: null,
      filters: initialFilters,
      isLoading: false,
      isPreviewOpen: false,
      refreshTrigger: 0,
      publishedEntries: [],

      setView: (v) => set({ view: v }),
      setUploadResult: (r) => set({ uploadResult: r }),
      setStats: (s) => set({ stats: s }),
      setSelectedId: (id) => set({ selectedId: id }),
      setSelectedEntry: (e) => set({ selectedEntry: e }),
      setFilter: (key, value) =>
        set((state) => ({
          filters: { ...state.filters, [key]: value, ...(key !== 'page' ? { page: 1 } : {}) },
        })),
      setLoading: (l) => set({ isLoading: l }),
      setPreviewOpen: (open) => set({ isPreviewOpen: open }),
      bumpRefresh: () => set((s) => ({ refreshTrigger: s.refreshTrigger + 1 })),
      markPublished: (ids) => set((s) => ({
        publishedEntries: [...new Set([...s.publishedEntries, ...ids])],
      })),
      isEntryPublished: (id) => get().publishedEntries.includes(id),
      resetAll: () =>
        set({
          view: 'upload',
          uploadResult: null,
          stats: null,
          selectedId: null,
          selectedEntry: null,
          filters: initialFilters,
          isPreviewOpen: false,
        }),
    }),
    {
      name: 'curador-filters',
      storage: createJSONStorage(() => localStorage),
      // Persist filters, view, and published tracking — everything else is ephemeral
      partialize: (state) => ({
        filters: state.filters,
        view: state.view,
        publishedEntries: state.publishedEntries,
      }),
      // On hydration, use stored filters/view/published but keep everything else as initial
      merge: (persisted, current) => {
        const p = persisted as Partial<AppState>;
        return {
          ...current,
          ...(p.filters ? { filters: p.filters } : {}),
          ...(p.view ? { view: p.view } : {}),
          ...(p.publishedEntries ? { publishedEntries: p.publishedEntries } : {}),
        };
      },
    }
  )
);