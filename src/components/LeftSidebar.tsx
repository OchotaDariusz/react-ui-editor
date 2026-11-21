import { useEffect, useMemo, useState } from 'react';
import { useDrag } from 'react-dnd';
import {
  Bookmark,
  Clock,
  CreditCard,
  FolderOpen,
  GripVertical,
  Heading,
  History,
  Image as ImageIcon,
  Layers,
  Layout,
  LayoutGrid,
  LayoutTemplate,
  Megaphone,
  MousePointer2,
  PanelLeftClose,
  Plus,
  RotateCcw,
  Search,
  Sparkles,
  Square,
  Tag,
  TextCursorInput,
  Trash2,
  Type,
  X,
} from 'lucide-react';
import {
  PAGE_TEMPLATES,
  type TemplateBlueprintNode,
} from '../constants/editorDefaults';
import { ICON_LIBRARY, type IconLibraryEntry } from '../constants/lucideIcons';
import {
  DND_NEW_CARD_PRESET_TYPE,
  DND_NEW_COMPONENT_TYPE,
  DND_NEW_ICON_TYPE,
  DND_SAVED_COMPONENT_TYPE,
  type ComponentHistoryEntry,
  type ComponentHistoryEventType,
  type ImportedAsset,
  type LeftTab,
  type NodesMap,
  type NodeType,
  type RecentComponentSearch,
  type SavedComponentEntry,
} from '../types/editor';
import {
  filterComponentHistory,
  filterComponentsByQuery,
  normalizeSearchText,
} from '../utils/editorLogic';
import { AssetsPanel } from './AssetsPanel';
import { LayerTreeItem } from './LayerTreeItem';

interface LeftSidebarProps {
  leftTab: LeftTab;
  onChangeTab: (tab: LeftTab) => void;
  onAddNode: (type: NodeType) => void;
  onAddIconNode: (iconName: string) => void;
  onAddCardPreset: () => void;
  onInsertPageTemplate: (blueprint: TemplateBlueprintNode) => void;
  savedComponents: SavedComponentEntry[];
  onSaveSelectedComponent: (customName?: string) => void;
  onInsertSavedComponent: (entry: SavedComponentEntry) => void;
  onRemoveSavedComponent: (id: string) => void;
  onClearSavedComponents: () => void;
  assets: ImportedAsset[];
  assetStorageError: string;
  onAddAssets: (newAssets: ImportedAsset[]) => void;
  onInsertAsset: (asset: ImportedAsset) => void;
  onApplyAssetToSelectedImage: (asset: ImportedAsset) => void;
  onRemoveAsset: (id: string) => void;
  onClearAssets: () => void;
  onDismissAssetStorageError: () => void;
  componentHistory: ComponentHistoryEntry[];
  onReinsertFromHistory: (entry: ComponentHistoryEntry) => void;
  onRemoveHistoryEntry: (historyId: string) => void;
  onClearComponentHistory: () => void;
  recentSearches: RecentComponentSearch[];
  onRecordRecentSearch: (entry: Omit<RecentComponentSearch, 'timestamp'>) => void;
  onRemoveRecentSearch: (type: RecentComponentSearch['type'], query: string) => void;
  onClearRecentSearches: () => void;
  onCollapse?: () => void;
  nodes: NodesMap;
  selectedId: string;
  selectedIds: string[];
  highlightedNodeId?: string | null;
  matchingSearchIds?: ReadonlySet<string>;
  onSelectNode: (id: string, additive?: boolean) => void;
  onToggleNodeVisibility: (id: string) => void;
}

const BASIC_COMPONENTS: Array<{
  type: NodeType;
  label: string;
  icon: typeof Layout;
}> = [
  { type: 'Container', label: 'Kontener', icon: Layout },
  { type: 'Grid', label: 'Grid', icon: LayoutGrid },
  { type: 'Heading', label: 'Nagłówek', icon: Heading },
  { type: 'Text', label: 'Tekst', icon: Type },
  { type: 'Button', label: 'Przycisk', icon: Square },
  { type: 'Badge', label: 'Odznaka', icon: Tag },
  { type: 'Input', label: 'Input', icon: TextCursorInput },
  { type: 'Image', label: 'Obraz', icon: ImageIcon },
];

const PRESET_SECTIONS = [
  {
    id: 'product-card',
    type: 'CardPreset',
    label: 'Karta Produktu',
    description: 'Obraz + Tytuł + Opis + CTA',
    keywords: 'sekcja obraz tytul opis cta card',
  },
] as const;

const TEMPLATE_ICONS: Record<string, typeof LayoutTemplate> = {
  'hero-section': LayoutTemplate,
  'pricing-table': CreditCard,
  'features-grid': LayoutGrid,
  'cta-banner': Megaphone,
};

function DraggableBasicComponentTile({
  type,
  label,
  icon: Icon,
  onClickAdd,
}: {
  type: NodeType;
  label: string;
  icon: typeof Layout;
  onClickAdd: () => void;
}) {
  const [{ isDragging }, drag] = useDrag(
    () => ({
      type: DND_NEW_COMPONENT_TYPE,
      item: () => ({ newComponentType: type }),
      collect: (monitor) => ({
        isDragging: monitor.isDragging(),
      }),
    }),
    [type]
  );

  return (
    <button
      ref={(el) => {
        drag(el);
      }}
      type="button"
      onClick={onClickAdd}
      title={`${label} — przeciągnij na płótno lub kliknij`}
      className={`flex flex-col items-center justify-center p-3 bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 rounded-xl transition-all group cursor-grab active:cursor-grabbing focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
        isDragging ? 'opacity-45 scale-95' : ''
      }`}
    >
      <Icon className="w-5 h-5 mb-1.5 text-slate-600 group-hover:text-blue-600" />
      <span className="text-xs font-medium text-slate-700 whitespace-nowrap">
        {label}
      </span>
    </button>
  );
}

function DraggableCardPresetButton({ onClickAdd }: { onClickAdd: () => void }) {
  const [{ isDragging }, drag] = useDrag(
    () => ({
      type: DND_NEW_CARD_PRESET_TYPE,
      item: () => ({ isCardPreset: true }),
      collect: (monitor) => ({
        isDragging: monitor.isDragging(),
      }),
    }),
    []
  );

  return (
    <button
      ref={(el) => {
        drag(el);
      }}
      type="button"
      onClick={onClickAdd}
      title="Karta Produktu — przeciągnij na płótno lub kliknij"
      className={`w-full flex items-center gap-3 p-3 bg-gradient-to-r from-slate-50 to-blue-50/40 dark:from-slate-800 dark:to-slate-900 hover:from-blue-50 hover:to-blue-100/60 dark:hover:from-slate-700 dark:hover:to-slate-800 border border-slate-200 hover:border-blue-300 rounded-xl transition-all text-left cursor-grab active:cursor-grabbing focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
        isDragging ? 'opacity-45 scale-98' : ''
      }`}
    >
      <CreditCard className="w-5 h-5 text-blue-600 shrink-0" />
      <div className="min-w-0">
        <div className="text-xs font-semibold text-slate-800">
          Karta Produktu
        </div>
        <div className="text-[11px] text-slate-500">
          Obraz + Tytuł + Opis + CTA
        </div>
      </div>
    </button>
  );
}

function DraggableIconTile({
  entry,
  onAddIconNode,
}: {
  entry: IconLibraryEntry;
  onAddIconNode: (iconName: string) => void;
}) {
  const IconComp = entry.component;
  const [{ isDragging }, drag] = useDrag(
    () => ({
      type: DND_NEW_ICON_TYPE,
      item: () => ({ iconName: entry.name }),
      collect: (monitor) => ({
        isDragging: monitor.isDragging(),
      }),
    }),
    [entry.name]
  );

  return (
    <button
      ref={(el) => {
        drag(el);
      }}
      type="button"
      data-icon-palette-item={entry.name}
      title={`${entry.name} — przeciągnij na płótno lub kliknij`}
      aria-label={`Ikona ${entry.name} (${entry.label})`}
      onClick={() => onAddIconNode(entry.name)}
      className={`flex flex-col items-center justify-center gap-1 p-2.5 bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 rounded-xl transition-all group cursor-grab active:cursor-grabbing focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
        isDragging ? 'opacity-45 scale-95' : ''
      }`}
    >
      <IconComp className="w-5 h-5 text-slate-600 group-hover:text-blue-600" />
      <span className="text-[10px] font-medium text-slate-700 truncate w-full text-center">
        {entry.name}
      </span>
    </button>
  );
}

function DraggableSavedComponentCard({
  entry,
  onInsertSavedComponent,
  onRemoveSavedComponent,
}: {
  entry: SavedComponentEntry;
  onInsertSavedComponent: (entry: SavedComponentEntry) => void;
  onRemoveSavedComponent: (id: string) => void;
}) {
  const [{ isDragging }, drag] = useDrag(
    () => ({
      type: DND_SAVED_COMPONENT_TYPE,
      item: () => ({ savedBlueprint: entry.snapshot }),
      collect: (monitor) => ({
        isDragging: monitor.isDragging(),
      }),
    }),
    [entry.snapshot]
  );

  return (
    <div
      ref={(el) => {
        drag(el);
      }}
      data-saved-component={entry.id}
      className={`p-2.5 bg-slate-50 border border-slate-200 hover:border-blue-300 rounded-xl space-y-2 cursor-grab active:cursor-grabbing transition-all ${
        isDragging ? 'opacity-45 scale-98' : ''
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-1.5 min-w-0 flex-1">
          <GripVertical
            className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5"
            aria-hidden="true"
          />
          <div className="min-w-0 flex-1 space-y-0.5">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-slate-800 truncate">
                {entry.name}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] font-mono text-slate-500">
              <span>{entry.nodeType}</span>
              {entry.variant && <span>· {entry.variant}</span>}
              {entry.nodeCount > 1 && <span>· {entry.nodeCount} elem.</span>}
            </div>
          </div>
        </div>
        <button
          type="button"
          title="Usuń zapisany snippet"
          aria-label={`Usuń zapisany komponent ${entry.name}`}
          onClick={() => onRemoveSavedComponent(entry.id)}
          className="p-1 text-slate-400 hover:text-red-600 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 shrink-0"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {entry.classNameSummary && (
        <p
          className="text-[10px] font-mono text-slate-600 bg-white border border-slate-200/80 rounded px-2 py-1 truncate"
          title={entry.classNameSummary}
        >
          {entry.classNameSummary}
        </p>
      )}

      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] text-slate-400">
          Przeciągnij na płótno
        </span>
        <button
          type="button"
          aria-label={`Wstaw zapisany komponent ${entry.name}`}
          onClick={() => onInsertSavedComponent(entry)}
          className="inline-flex items-center gap-1 py-1 px-2.5 bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-300 rounded-lg text-[11px] font-semibold text-blue-700 transition-colors whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        >
          <Plus className="w-3 h-3" />
          Wstaw
        </button>
      </div>
    </div>
  );
}

export function LeftSidebar({
  leftTab,
  onChangeTab,
  onAddNode,
  onAddIconNode,
  onAddCardPreset,
  onInsertPageTemplate,
  savedComponents,
  onSaveSelectedComponent,
  onInsertSavedComponent,
  onRemoveSavedComponent,
  onClearSavedComponents,
  assets,
  assetStorageError,
  onAddAssets,
  onInsertAsset,
  onApplyAssetToSelectedImage,
  onRemoveAsset,
  onClearAssets,
  onDismissAssetStorageError,
  componentHistory,
  onReinsertFromHistory,
  onRemoveHistoryEntry,
  onClearComponentHistory,
  recentSearches,
  onRecordRecentSearch,
  onRemoveRecentSearch,
  onClearRecentSearches,
  onCollapse,
  nodes,
  selectedId,
  selectedIds,
  highlightedNodeId,
  matchingSearchIds,
  onSelectNode,
  onToggleNodeVisibility,
}: LeftSidebarProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [iconQuery, setIconQuery] = useState('');
  const [savedQuery, setSavedQuery] = useState('');
  const [savedNameDraft, setSavedNameDraft] = useState('');
  const [historyFilter, setHistoryFilter] = useState<
    'all' | ComponentHistoryEventType
  >('all');

  const filteredBasicComponents = useMemo(
    () => filterComponentsByQuery(BASIC_COMPONENTS, searchQuery),
    [searchQuery]
  );

  const filteredPresets = useMemo(
    () => filterComponentsByQuery(PRESET_SECTIONS, searchQuery),
    [searchQuery]
  );

  const filteredIcons = useMemo(
    () => filterComponentsByQuery(ICON_LIBRARY, iconQuery),
    [iconQuery]
  );

  const visibleHistoryEntries = useMemo(
    () => filterComponentHistory(componentHistory, historyFilter),
    [componentHistory, historyFilter]
  );

  const visibleSavedComponents = useMemo(() => {
    const q = normalizeSearchText(savedQuery);
    if (!q) return savedComponents;
    return savedComponents.filter(
      (item) =>
        normalizeSearchText(item.name).includes(q) ||
        normalizeSearchText(item.nodeType).includes(q) ||
        normalizeSearchText(item.classNameSummary).includes(q)
    );
  }, [savedComponents, savedQuery]);

  const selectedNodeForSave =
    selectedId !== 'root' ? nodes[selectedId] : undefined;

  const hasAnyResults =
    filteredBasicComponents.length > 0 || filteredPresets.length > 0;

  useEffect(() => {
    const trimmed = searchQuery.trim();
    if (trimmed.length < 2) return;
    const topBasic = filteredBasicComponents[0];
    const topPreset = filteredPresets[0];
    if (!topBasic && !topPreset) return;

    const timer = window.setTimeout(() => {
      if (topBasic) {
        onRecordRecentSearch({
          type: topBasic.type,
          label: topBasic.label,
          query: trimmed,
        });
      } else if (topPreset) {
        onRecordRecentSearch({
          type: topPreset.type,
          label: topPreset.label,
          query: trimmed,
        });
      }
    }, 450);

    return () => window.clearTimeout(timer);
  }, [
    searchQuery,
    filteredBasicComponents,
    filteredPresets,
    onRecordRecentSearch,
  ]);

  const canApplyAssetToSelectedImage = Boolean(
    selectedId !== 'root' && nodes[selectedId]?.type === 'Image'
  );

  return (
    <aside
      data-testid="left-sidebar"
      className="w-[320px] bg-white border-r border-slate-200 flex flex-col shrink-0 z-20"
    >
      <div className="h-14 px-3.5 border-b border-slate-200 flex items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-sm shrink-0">
            <MousePointer2 className="w-4 h-4" />
          </div>
          <h1 className="font-bold text-sm tracking-tight text-slate-900 whitespace-nowrap truncate">
            React UI Studio
          </h1>
        </div>
        {onCollapse && (
          <button
            type="button"
            data-testid="collapse-left-sidebar-btn"
            onClick={onCollapse}
            title="Ukryj panel lewy"
            aria-label="Ukryj panel lewy"
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            <PanelLeftClose className="w-4 h-4" />
          </button>
        )}
      </div>

      <div
        role="tablist"
        aria-label="Panel zasobów"
        className="grid grid-cols-7 p-1 gap-0.5 border-b border-slate-100 bg-slate-50/70 shrink-0"
      >
        <button
          type="button"
          role="tab"
          aria-selected={leftTab === 'components'}
          onClick={() => onChangeTab('components')}
          className={`flex flex-col items-center justify-center gap-0.5 py-1.5 px-0.5 rounded-md text-[9.5px] font-semibold transition-colors whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
            leftTab === 'components'
              ? 'bg-white text-blue-600 shadow-sm border border-slate-200'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Plus className="w-3.5 h-3.5 shrink-0" />
          Elementy
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={leftTab === 'icons'}
          onClick={() => onChangeTab('icons')}
          className={`flex flex-col items-center justify-center gap-0.5 py-1.5 px-0.5 rounded-md text-[9.5px] font-semibold transition-colors whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
            leftTab === 'icons'
              ? 'bg-white text-blue-600 shadow-sm border border-slate-200'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 shrink-0" />
          Icons
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={leftTab === 'templates'}
          onClick={() => onChangeTab('templates')}
          className={`flex flex-col items-center justify-center gap-0.5 py-1.5 px-0.5 rounded-md text-[9.5px] font-semibold transition-colors whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
            leftTab === 'templates'
              ? 'bg-white text-blue-600 shadow-sm border border-slate-200'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <LayoutTemplate className="w-3.5 h-3.5 shrink-0" />
          Templates
        </button>
        <button
          type="button"
          role="tab"
          title="Saved Components"
          aria-label="Saved Components"
          aria-selected={leftTab === 'saved'}
          onClick={() => onChangeTab('saved')}
          className={`flex flex-col items-center justify-center gap-0.5 py-1.5 px-0.5 rounded-md text-[9.5px] font-semibold transition-colors whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
            leftTab === 'saved'
              ? 'bg-white text-blue-600 shadow-sm border border-slate-200'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Bookmark className="w-3.5 h-3.5 shrink-0" />
          Saved
        </button>
        <button
          type="button"
          role="tab"
          title="Assets"
          aria-label="Assets"
          aria-selected={leftTab === 'assets'}
          onClick={() => onChangeTab('assets')}
          className={`flex flex-col items-center justify-center gap-0.5 py-1.5 px-0.5 rounded-md text-[9.5px] font-semibold transition-colors whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
            leftTab === 'assets'
              ? 'bg-white text-blue-600 shadow-sm border border-slate-200'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <FolderOpen className="w-3.5 h-3.5 shrink-0" />
          Assets
        </button>
        <button
          type="button"
          role="tab"
          title="Component History"
          aria-selected={leftTab === 'history'}
          onClick={() => onChangeTab('history')}
          className={`flex flex-col items-center justify-center gap-0.5 py-1.5 px-0.5 rounded-md text-[9.5px] font-semibold transition-colors whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
            leftTab === 'history'
              ? 'bg-white text-blue-600 shadow-sm border border-slate-200'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <History className="w-3.5 h-3.5 shrink-0" />
          History
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={leftTab === 'layers'}
          onClick={() => onChangeTab('layers')}
          className={`flex flex-col items-center justify-center gap-0.5 py-1.5 px-0.5 rounded-md text-[9.5px] font-semibold transition-colors whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
            leftTab === 'layers'
              ? 'bg-white text-blue-600 shadow-sm border border-slate-200'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Layers className="w-3.5 h-3.5 shrink-0" />
          Warstwy
        </button>
      </div>

      {leftTab === 'components' ? (
        <div className="p-3.5 flex-1 overflow-y-auto space-y-4">
          <div className="relative">
            <Search
              className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
              aria-hidden="true"
            />
            <input
              type="text"
              aria-label="Szukaj komponentów"
              placeholder="Szukaj komponentu..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Escape' && searchQuery) {
                  setSearchQuery('');
                  return;
                }
                if (e.key === 'Enter') {
                  const trimmed = searchQuery.trim();
                  if (!trimmed) return;
                  const topBasic = filteredBasicComponents[0];
                  const topPreset = filteredPresets[0];
                  if (topBasic) {
                    onRecordRecentSearch({
                      type: topBasic.type,
                      label: topBasic.label,
                      query: trimmed,
                    });
                  } else if (topPreset) {
                    onRecordRecentSearch({
                      type: topPreset.type,
                      label: topPreset.label,
                      query: trimmed,
                    });
                  }
                }
              }}
              className="w-full pl-8 pr-8 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                aria-label="Wyczyść wyszukiwanie"
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-700 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {recentSearches.length > 0 && (
            <section
              aria-label="Recent Searches"
              data-testid="recent-searches-panel"
              className="space-y-2 p-2.5 bg-slate-50/90 border border-slate-200/80 rounded-xl"
            >
              <div className="flex items-center justify-between gap-2">
                <h2 className="flex items-center gap-1 text-[11px] font-bold text-slate-600 tracking-wide tabular-nums">
                  <Clock className="w-3 h-3 text-slate-500" aria-hidden="true" />
                  Recent Searches
                  <span className="font-normal text-slate-400">
                    · {recentSearches.length}
                  </span>
                </h2>
                <button
                  type="button"
                  data-testid="clear-recent-searches-btn"
                  aria-label="Wyczyść ostatnie wyszukiwania"
                  title="Wyczyść historię wyszukiwań"
                  onClick={onClearRecentSearches}
                  className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                >
                  <Trash2 className="w-3 h-3" />
                  Wyczyść
                </button>
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                {recentSearches.map((item) => {
                  const matchedBasic = BASIC_COMPONENTS.find(
                    (b) => b.type === item.type
                  );
                  const ItemIcon = matchedBasic ? matchedBasic.icon : CreditCard;
                  const showSubQuery =
                    item.query.toLowerCase() !== item.label.toLowerCase();
                  return (
                    <div
                      key={`${item.type}-${item.query}`}
                      className="flex items-center bg-white border border-slate-200 hover:border-blue-300 rounded-lg overflow-hidden transition-colors"
                    >
                      <button
                        type="button"
                        title={`Wstaw ${item.label} (szukano: "${item.query}")`}
                        aria-label={`Wstaw ostatnio szukany komponent ${item.label}`}
                        onClick={() => {
                          if (item.type === 'CardPreset') {
                            onAddCardPreset();
                          } else {
                            onAddNode(item.type);
                          }
                        }}
                        className="flex-1 min-w-0 flex items-center gap-1.5 px-2 py-1.5 hover:bg-blue-50 text-left transition-colors group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500"
                      >
                        <ItemIcon className="w-3.5 h-3.5 text-slate-500 group-hover:text-blue-600 shrink-0" />
                        <div className="min-w-0 flex-1">
                          <span className="block text-[11px] font-medium text-slate-700 group-hover:text-blue-700 truncate">
                            {item.label}
                          </span>
                          {showSubQuery && (
                            <span className="block text-[9px] text-slate-400 truncate">
                              „{item.query}”
                            </span>
                          )}
                        </div>
                      </button>
                      <button
                        type="button"
                        title={`Usuń "${item.query}" z historii`}
                        aria-label={`Usuń "${item.query}" z ostatnich wyszukiwań`}
                        onClick={() => onRemoveRecentSearch(item.type, item.query)}
                        className="p-1 mr-0.5 text-slate-300 hover:text-red-600 rounded transition-colors shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {!hasAnyResults ? (
            <div className="py-8 px-3 text-center border border-dashed border-slate-200 rounded-xl bg-slate-50/50 space-y-2.5">
              <p className="text-xs text-slate-500">
                Brak pasujących komponentów
              </p>
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              >
                Wyczyść wyszukiwanie
              </button>
            </div>
          ) : (
            <div className="space-y-5">
              {filteredBasicComponents.length > 0 && (
                <div>
                  <h2 className="text-[11px] font-bold text-slate-500 tracking-wide mb-2.5">
                    Podstawowe
                  </h2>
                  <div className="grid grid-cols-2 gap-2">
                    {filteredBasicComponents.map(({ type, label, icon }) => (
                      <DraggableBasicComponentTile
                        key={type}
                        type={type}
                        label={label}
                        icon={icon}
                        onClickAdd={() => {
                          const trimmed = searchQuery.trim();
                          if (trimmed) {
                            onRecordRecentSearch({
                              type,
                              label,
                              query: trimmed,
                            });
                          }
                          onAddNode(type);
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}

              {filteredPresets.length > 0 && (
                <div>
                  <h2 className="text-[11px] font-bold text-slate-500 tracking-wide mb-2.5">
                    Gotowe Sekcje
                  </h2>
                  <DraggableCardPresetButton
                    onClickAdd={() => {
                      const trimmed = searchQuery.trim();
                      if (trimmed) {
                        onRecordRecentSearch({
                          type: 'CardPreset',
                          label: 'Karta Produktu',
                          query: trimmed,
                        });
                      }
                      onAddCardPreset();
                    }}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      ) : leftTab === 'icons' ? (
        <div
          className="p-3.5 flex-1 overflow-y-auto space-y-3"
          aria-label="Ikony Lucide React"
        >
          <div className="relative">
            <Search
              className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
              aria-hidden="true"
            />
            <input
              type="text"
              aria-label="Szukaj ikony"
              placeholder="Szukaj ikony..."
              value={iconQuery}
              onChange={(e) => setIconQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Escape' && iconQuery) {
                  setIconQuery('');
                }
              }}
              className="w-full pl-8 pr-8 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors"
            />
            {iconQuery && (
              <button
                type="button"
                aria-label="Wyczyść wyszukiwanie ikon"
                onClick={() => setIconQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-700 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <p className="text-[11px] text-slate-400">
            Przeciągnij ikonę na płótno lub kliknij, aby wstawić.
          </p>

          {filteredIcons.length === 0 ? (
            <div className="py-8 px-3 text-center border border-dashed border-slate-200 rounded-xl bg-slate-50/50 space-y-2.5">
              <p className="text-xs text-slate-500">Brak pasujących ikon</p>
              <button
                type="button"
                onClick={() => setIconQuery('')}
                className="px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              >
                Wyczyść wyszukiwanie
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {filteredIcons.map((entry) => (
                <DraggableIconTile
                  key={entry.name}
                  entry={entry}
                  onAddIconNode={onAddIconNode}
                />
              ))}
            </div>
          )}
        </div>
      ) : leftTab === 'templates' ? (
        <div
          className="p-3.5 flex-1 overflow-y-auto space-y-3"
          aria-label="Szablony układów"
        >
          <div className="space-y-0.5">
            <h2 className="text-[11px] font-bold text-slate-500 tracking-wide">
              Gotowe układy stron
            </h2>
            <p className="text-[11px] text-slate-400">
              Kliknij szablon, aby wstawić go na płótno.
            </p>
          </div>
          <div className="space-y-2">
            {PAGE_TEMPLATES.map((tpl) => {
              const Icon = TEMPLATE_ICONS[tpl.id] || LayoutTemplate;
              return (
                <button
                  key={tpl.id}
                  type="button"
                  onClick={() => onInsertPageTemplate(tpl.root)}
                  className="w-full flex items-start gap-3 p-3 bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 rounded-xl transition-all text-left group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                >
                  <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 group-hover:border-blue-200 flex items-center justify-center text-blue-600 shrink-0 mt-0.5">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1 space-y-0.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-slate-800 group-hover:text-blue-700 truncate">
                        {tpl.name}
                      </span>
                      <span className="text-[10px] font-medium text-slate-400 shrink-0">
                        {tpl.category}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-snug">
                      {tpl.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      ) : leftTab === 'saved' ? (
        <div
          className="p-3.5 flex-1 overflow-y-auto space-y-3"
          aria-label="Saved Components"
        >
          <div className="flex items-center justify-between gap-2">
            <div>
              <h2 className="text-[11px] font-bold text-slate-500 tracking-wide">
                Saved Components
              </h2>
              <p className="text-[11px] text-slate-400">
                Własne snippety do przeciągnięcia ({savedComponents.length})
              </p>
            </div>
            {savedComponents.length > 0 && (
              <button
                type="button"
                aria-label="Wyczyść zapisane komponenty"
                onClick={onClearSavedComponents}
                className="text-[11px] font-medium text-slate-500 hover:text-red-600 whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded px-1.5 py-0.5"
              >
                Wyczyść
              </button>
            )}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!selectedNodeForSave) return;
              onSaveSelectedComponent(savedNameDraft);
              setSavedNameDraft('');
            }}
            className="p-2.5 bg-blue-50/60 border border-blue-200/80 rounded-xl space-y-2"
          >
            {selectedNodeForSave ? (
              <>
                <div className="flex items-center justify-between gap-1.5 text-[11px]">
                  <span className="font-semibold text-slate-700 truncate">
                    Zaznaczono: {selectedNodeForSave.name || selectedNodeForSave.type}
                  </span>
                  <span className="font-mono text-[10px] text-blue-700 shrink-0">
                    {selectedNodeForSave.type}
                  </span>
                </div>
                <input
                  type="text"
                  aria-label="Nazwa zapisywanego komponentu"
                  placeholder={selectedNodeForSave.name || 'Nazwa snippetu...'}
                  value={savedNameDraft}
                  onChange={(e) => setSavedNameDraft(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="submit"
                  aria-label="Zapisz zaznaczony komponent"
                  className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition-colors whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                >
                  <Bookmark className="w-3.5 h-3.5" />
                  Zapisz zaznaczony
                </button>
              </>
            ) : (
              <p className="text-[11px] text-slate-600 leading-snug">
                Zaznacz dowolny element lub kontener na płótnie (poza Root Canvas), aby zapisać go jako snippet wielokrotnego użytku.
              </p>
            )}
          </form>

          {savedComponents.length > 0 && (
            <div className="relative">
              <Search
                className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                aria-hidden="true"
              />
              <input
                type="text"
                aria-label="Szukaj zapisanych komponentów"
                placeholder="Szukaj zapisanych..."
                value={savedQuery}
                onChange={(e) => setSavedQuery(e.target.value)}
                className="w-full pl-8 pr-8 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors"
              />
              {savedQuery && (
                <button
                  type="button"
                  aria-label="Wyczyść filtr zapisanych komponentów"
                  onClick={() => setSavedQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-700 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}

          {visibleSavedComponents.length === 0 ? (
            <div className="py-8 px-3 text-center border border-dashed border-slate-200 rounded-xl bg-slate-50/50 space-y-1.5">
              <p className="text-xs font-medium text-slate-500">
                {savedComponents.length === 0
                  ? 'Brak zapisanych snippetów'
                  : 'Brak pasujących snippetów'}
              </p>
              <p className="text-[11px] text-slate-400">
                {savedComponents.length === 0
                  ? 'Zapisz skonfigurowane kontenery z dziećmi i stylami, a potem przeciągaj je na płótno.'
                  : 'Spróbuj innej frazy wyszukiwania.'}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {visibleSavedComponents.map((entry) => (
                <DraggableSavedComponentCard
                  key={entry.id}
                  entry={entry}
                  onInsertSavedComponent={onInsertSavedComponent}
                  onRemoveSavedComponent={onRemoveSavedComponent}
                />
              ))}
            </div>
          )}
        </div>
      ) : leftTab === 'assets' ? (
        <AssetsPanel
          assets={assets}
          storageError={assetStorageError}
          canApplyToSelectedImage={canApplyAssetToSelectedImage}
          onAddAssets={onAddAssets}
          onInsertAsset={onInsertAsset}
          onApplyAssetToSelectedImage={onApplyAssetToSelectedImage}
          onRemoveAsset={onRemoveAsset}
          onClearAssets={onClearAssets}
          onDismissStorageError={onDismissAssetStorageError}
        />
      ) : leftTab === 'history' ? (
        <div
          className="p-3.5 flex-1 overflow-y-auto space-y-3"
          aria-label="Component History"
        >
          <div className="flex items-center justify-between gap-2">
            <div>
              <h2 className="text-[11px] font-bold text-slate-500 tracking-wide">
                Component History
              </h2>
              <p className="text-[11px] text-slate-400">
                Dodane i usunięte konfiguracje ({componentHistory.length})
              </p>
            </div>
            {componentHistory.length > 0 && (
              <button
                type="button"
                aria-label="Wyczyść historię komponentów"
                onClick={onClearComponentHistory}
                className="text-[11px] font-medium text-slate-500 hover:text-red-600 whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded px-1.5 py-0.5"
              >
                Wyczyść
              </button>
            )}
          </div>

          <div
            role="group"
            aria-label="Filtr historii komponentów"
            className="grid grid-cols-3 p-0.5 gap-0.5 bg-slate-100 rounded-lg border border-slate-200"
          >
            {(
              [
                { id: 'all', label: 'Wszystkie' },
                { id: 'added', label: 'Dodane' },
                { id: 'deleted', label: 'Usunięte' },
              ] as const
            ).map(({ id, label }) => (
              <button
                key={id}
                type="button"
                aria-pressed={historyFilter === id}
                onClick={() => setHistoryFilter(id)}
                className={`py-1 px-1.5 rounded-md text-[10px] font-semibold transition-colors whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                  historyFilter === id
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {visibleHistoryEntries.length === 0 ? (
            <div className="py-8 px-3 text-center border border-dashed border-slate-200 rounded-xl bg-slate-50/50 space-y-1.5">
              <p className="text-xs font-medium text-slate-500">
                Brak zapisanych komponentów
              </p>
              <p className="text-[11px] text-slate-400">
                Dodane, zmodyfikowane lub usunięte elementy pojawią się tutaj do ponownego wstawienia.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {visibleHistoryEntries.map((entry) => {
                const timeLabel = new Date(entry.timestamp).toLocaleTimeString(
                  'pl-PL',
                  {
                    hour: '2-digit',
                    minute: '2-digit',
                  }
                );
                return (
                  <div
                    key={entry.historyId}
                    data-history-entry={entry.historyId}
                    className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1 space-y-0.5">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-semibold text-slate-800 truncate">
                            {entry.label}
                          </span>
                          <span
                            className={`text-[10px] font-semibold px-1.5 py-0.5 rounded shrink-0 ${
                              entry.eventType === 'deleted'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-emerald-100 text-emerald-700'
                            }`}
                          >
                            {entry.eventType === 'deleted' ? 'Usunięto' : 'Dodano'}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] font-mono text-slate-500">
                          <span>{entry.nodeType}</span>
                          {entry.variant && <span>· {entry.variant}</span>}
                          {entry.nodeCount > 1 && (
                            <span>· {entry.nodeCount} elem.</span>
                          )}
                          <span>· {timeLabel}</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        title="Usuń z historii"
                        aria-label={`Usuń z historii ${entry.label}`}
                        onClick={() => onRemoveHistoryEntry(entry.historyId)}
                        className="p-1 text-slate-400 hover:text-red-600 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 shrink-0"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {entry.classNameSummary && (
                      <p
                        className="text-[10px] font-mono text-slate-600 bg-white border border-slate-200/80 rounded px-2 py-1 truncate"
                        title={entry.classNameSummary}
                      >
                        {entry.classNameSummary}
                      </p>
                    )}

                    <button
                      type="button"
                      aria-label={`Wstaw ponownie ${entry.label}`}
                      onClick={() => onReinsertFromHistory(entry)}
                      className="w-full flex items-center justify-center gap-1.5 py-1.5 px-2.5 bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-300 rounded-lg text-xs font-semibold text-blue-700 transition-colors whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                    >
                      <RotateCcw className="w-3 h-3" />
                      Wstaw ponownie
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        <div
          className="p-2 flex-1 overflow-y-auto"
          aria-label="Drzewo warstw"
        >
          <LayerTreeItem
            id="root"
            nodes={nodes}
            selectedId={selectedId}
            selectedIds={selectedIds}
            highlightedNodeId={highlightedNodeId}
            matchingSearchIds={matchingSearchIds}
            onSelect={onSelectNode}
            onToggleVisibility={onToggleNodeVisibility}
          />
        </div>
      )}
    </aside>
  );
}
