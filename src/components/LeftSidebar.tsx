import { useMemo, useState } from 'react';
import {
  CreditCard,
  Heading,
  Image as ImageIcon,
  Layers,
  Layout,
  LayoutGrid,
  LayoutTemplate,
  Megaphone,
  MousePointer2,
  Plus,
  Search,
  Square,
  Tag,
  TextCursorInput,
  Type,
  X,
} from 'lucide-react';
import {
  PAGE_TEMPLATES,
  type TemplateBlueprintNode,
} from '../constants/editorDefaults';
import type { LeftTab, NodesMap, NodeType } from '../types/editor';
import { filterComponentsByQuery } from '../utils/editorLogic';
import { LayerTreeItem } from './LayerTreeItem';

interface LeftSidebarProps {
  leftTab: LeftTab;
  onChangeTab: (tab: LeftTab) => void;
  onAddNode: (type: NodeType) => void;
  onAddCardPreset: () => void;
  onInsertPageTemplate: (blueprint: TemplateBlueprintNode) => void;
  nodes: NodesMap;
  selectedId: string;
  onSelectNode: (id: string) => void;
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

export function LeftSidebar({
  leftTab,
  onChangeTab,
  onAddNode,
  onAddCardPreset,
  onInsertPageTemplate,
  nodes,
  selectedId,
  onSelectNode,
}: LeftSidebarProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredBasicComponents = useMemo(
    () => filterComponentsByQuery(BASIC_COMPONENTS, searchQuery),
    [searchQuery]
  );

  const filteredPresets = useMemo(
    () => filterComponentsByQuery(PRESET_SECTIONS, searchQuery),
    [searchQuery]
  );

  const hasAnyResults =
    filteredBasicComponents.length > 0 || filteredPresets.length > 0;

  return (
    <aside className="w-68 bg-white border-r border-slate-200 flex flex-col shrink-0 z-20">
      <div className="h-14 px-4 border-b border-slate-200 flex items-center gap-2.5 shrink-0">
        <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-sm shrink-0">
          <MousePointer2 className="w-4 h-4" />
        </div>
        <h1 className="font-bold text-sm tracking-tight text-slate-900 whitespace-nowrap">
          React UI Studio
        </h1>
      </div>

      <div
        role="tablist"
        aria-label="Panel zasobów"
        className="grid grid-cols-3 p-1.5 gap-1 border-b border-slate-100 bg-slate-50/70 shrink-0"
      >
        <button
          type="button"
          role="tab"
          aria-selected={leftTab === 'components'}
          onClick={() => onChangeTab('components')}
          className={`flex items-center justify-center gap-1 py-1.5 px-1 rounded-md text-[11px] font-semibold transition-colors whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
            leftTab === 'components'
              ? 'bg-white text-blue-600 shadow-sm border border-slate-200'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Plus className="w-3 h-3 shrink-0" />
          Elementy
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={leftTab === 'templates'}
          onClick={() => onChangeTab('templates')}
          className={`flex items-center justify-center gap-1 py-1.5 px-1 rounded-md text-[11px] font-semibold transition-colors whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
            leftTab === 'templates'
              ? 'bg-white text-blue-600 shadow-sm border border-slate-200'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <LayoutTemplate className="w-3 h-3 shrink-0" />
          Templates
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={leftTab === 'layers'}
          onClick={() => onChangeTab('layers')}
          className={`flex items-center justify-center gap-1 py-1.5 px-1 rounded-md text-[11px] font-semibold transition-colors whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
            leftTab === 'layers'
              ? 'bg-white text-blue-600 shadow-sm border border-slate-200'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Layers className="w-3 h-3 shrink-0" />
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
                    {filteredBasicComponents.map(({ type, label, icon: Icon }) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => onAddNode(type)}
                        className="flex flex-col items-center justify-center p-3 bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 rounded-xl transition-all group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                      >
                        <Icon className="w-5 h-5 mb-1.5 text-slate-600 group-hover:text-blue-600" />
                        <span className="text-xs font-medium text-slate-700 whitespace-nowrap">
                          {label}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {filteredPresets.length > 0 && (
                <div>
                  <h2 className="text-[11px] font-bold text-slate-500 tracking-wide mb-2.5">
                    Gotowe Sekcje
                  </h2>
                  <button
                    type="button"
                    onClick={onAddCardPreset}
                    className="w-full flex items-center gap-3 p-3 bg-gradient-to-r from-slate-50 to-blue-50/40 hover:from-blue-50 hover:to-blue-100/60 border border-slate-200 hover:border-blue-300 rounded-xl transition-all text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
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
                </div>
              )}
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
      ) : (
        <div
          className="p-2 flex-1 overflow-y-auto"
          aria-label="Drzewo warstw"
        >
          <LayerTreeItem
            id="root"
            nodes={nodes}
            selectedId={selectedId}
            onSelect={onSelectNode}
          />
        </div>
      )}
    </aside>
  );
}
