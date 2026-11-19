import { useEffect, useState } from 'react';
import { LayoutGrid, Plus, RotateCcw } from 'lucide-react';
import type { EditorNode, NodesMap } from '../types/editor';
import {
  GRID_AUTO_COLS_OPTIONS,
  GRID_AUTO_FLOW_OPTIONS,
  GRID_AUTO_ROWS_OPTIONS,
  GRID_CHILD_COL_SPAN_OPTIONS,
  GRID_CHILD_ROW_SPAN_OPTIONS,
  GRID_COLUMN_GAP_OPTIONS,
  GRID_COLUMN_QUICK_CLASSES,
  GRID_COLUMN_SELECT_OPTIONS,
  GRID_GAP_QUICK_OPTIONS,
  GRID_PLACE_CONTENT_OPTIONS,
  GRID_PLACE_ITEMS_OPTIONS,
  GRID_ROW_GAP_OPTIONS,
  GRID_TEMPLATE_PRESETS,
  GRID_UNIFORM_GAP_OPTIONS,
  RESPONSIVE_LG_GRID_COLS_OPTIONS,
  RESPONSIVE_MD_GRID_COLS_OPTIONS,
  buildGridPreviewSummary,
  extractCustomGridTemplateText,
  formatCustomGapToToken,
  formatCustomGridTemplateToToken,
  getGridAutoCols,
  getGridAutoFlow,
  getGridAutoRows,
  getGridChildSpan,
  getGridColsToken,
  getGridDisplayMode,
  getGridGapState,
  getGridPlaceContent,
  getGridPlaceItems,
  listGridNodesInTree,
  resetGridLayoutClasses,
  setGridAutoCols,
  setGridAutoFlow,
  setGridAutoRows,
  setGridAxisGap,
  setGridChildSpan,
  setGridColsToken,
  setGridDisplayMode,
  setGridPlaceContent,
  setGridPlaceItems,
  setGridUniformGap,
} from '../utils/gridLayout';

interface GridLayoutPanelProps {
  selectedId: string;
  selectedNode: EditorNode | undefined;
  isMultiSelect: boolean;
  nodes: NodesMap;
  onUpdateNodeClass: (nextClassName: string) => void;
  onUpdateNodeClassById: (nodeId: string, nextClassName: string) => void;
  onSelectNode: (nodeId: string) => void;
  onAddGridNode: () => void;
}

export function GridLayoutPanel({
  selectedId,
  selectedNode,
  isMultiSelect,
  nodes,
  onUpdateNodeClass,
  onUpdateNodeClassById,
  onSelectNode,
  onAddGridNode,
}: GridLayoutPanelProps) {
  const isGridSelected = !isMultiSelect && selectedNode?.type === 'Grid';
  const classNameValue = isGridSelected ? selectedNode.props.className || '' : '';

  const activeColsToken = getGridColsToken(classNameValue, '');
  const activeMdColsToken = getGridColsToken(classNameValue, 'md');
  const activeLgColsToken = getGridColsToken(classNameValue, 'lg');
  const gapState = getGridGapState(classNameValue);
  const displayMode = getGridDisplayMode(classNameValue);
  const activeAutoFlow = getGridAutoFlow(classNameValue);
  const activeAutoCols = getGridAutoCols(classNameValue);
  const activeAutoRows = getGridAutoRows(classNameValue);
  const activePlaceItems = getGridPlaceItems(classNameValue);
  const activePlaceContent = getGridPlaceContent(classNameValue);

  const [gapModeOverride, setGapModeOverride] = useState<'uniform' | 'split' | null>(
    null
  );
  const [customColsDraft, setCustomColsDraft] = useState<string>(() =>
    extractCustomGridTemplateText(activeColsToken)
  );
  const [customGapDraft, setCustomGapDraft] = useState<string>('');

  useEffect(() => {
    setGapModeOverride(null);
  }, [selectedId]);

  useEffect(() => {
    setCustomColsDraft(extractCustomGridTemplateText(activeColsToken));
  }, [activeColsToken, selectedId]);

  useEffect(() => {
    const match = gapState.uniform.match(/^gap-\[(.+)\]$/);
    setCustomGapDraft(match ? match[1].replace(/_/g, ' ') : '');
  }, [gapState.uniform, selectedId]);

  if (!isGridSelected || !selectedNode) {
    const existingGrids = listGridNodesInTree(nodes);
    return (
      <div
        data-testid="grid-layout-empty"
        className="p-4 flex-1 overflow-y-auto flex flex-col gap-4"
      >
        <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-3">
          <div className="flex items-start gap-2.5">
            <LayoutGrid className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
            <div className="space-y-1">
              <h3 className="text-xs font-semibold text-slate-900">
                Brak zaznaczonego węzła Grid
              </h3>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                {isMultiSelect
                  ? 'Wyłącz zaznaczenie grupowe i wybierz pojedynczy komponent typu Grid, aby edytować kolumny, odstępy i auto-placement.'
                  : 'Zaznacz komponent typu Grid na płótnie lub w drzewie warstw, aby skonfigurować grid-template-columns, grid-gap oraz auto-placement.'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onAddGridNode}
            className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-colors whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            <Plus className="w-3.5 h-3.5" />
            Dodaj nowy Grid
          </button>
        </div>

        {existingGrids.length > 0 && (
          <div className="space-y-2">
            <span className="block text-[11px] font-semibold text-slate-500">
              Dostępne siatki na płótnie ({existingGrids.length})
            </span>
            <div className="divide-y divide-slate-200 border border-slate-200 rounded-lg bg-white overflow-hidden">
              {existingGrids.map((gridNode) => {
                const info = buildGridPreviewSummary(gridNode.props.className || '');
                return (
                  <button
                    key={gridNode.id}
                    type="button"
                    onClick={() => onSelectNode(gridNode.id)}
                    className="w-full px-3 py-2 flex items-center justify-between gap-2 text-left hover:bg-blue-50/70 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                  >
                    <div className="min-w-0">
                      <span className="block text-xs font-semibold text-slate-800 truncate">
                        {gridNode.name || 'Grid'}
                      </span>
                      <span className="block text-[10px] font-mono text-slate-500 tabular-nums truncate">
                        {info.colsLabel} · {info.gapLabel}
                      </span>
                    </div>
                    <span className="text-[11px] font-medium text-blue-600 whitespace-nowrap shrink-0">
                      Wybierz
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  }

  const effectiveGapMode = gapModeOverride ?? gapState.mode;
  const preview = buildGridPreviewSummary(classNameValue);
  const directChildren = (selectedNode.children || [])
    .map((cid) => nodes[cid])
    .filter((child): child is EditorNode => Boolean(child));

  return (
    <div
      data-testid="grid-layout-panel"
      className="p-4 flex-1 overflow-y-auto flex flex-col gap-4"
    >
      {/* Header & Live Schematic Preview */}
      <section
        aria-label="Podsumowanie siatki Grid"
        className="space-y-2.5 pb-4 border-b border-slate-200/80"
      >
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <h3 className="text-xs font-semibold text-slate-900 truncate">
              {selectedNode.name || 'Grid'}
            </h3>
            <p className="text-[11px] font-mono text-slate-500 tabular-nums truncate">
              {preview.colsLabel} · {preview.gapLabel} · flow:{preview.flowLabel}
            </p>
          </div>
          <button
            type="button"
            aria-label="Resetuj układ Grid"
            title="Przywróć domyślne grid-cols-2 i gap-4"
            onClick={() => onUpdateNodeClass(resetGridLayoutClasses(classNameValue))}
            className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium text-slate-600 hover:text-blue-700 hover:bg-slate-100 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            <RotateCcw className="w-3 h-3" />
            Reset
          </button>
        </div>

        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
          {(
            [
              { mode: 'grid', label: 'Display: grid' },
              { mode: 'inline-grid', label: 'inline-grid' },
            ] as const
          ).map(({ mode, label }) => {
            const isActive = (displayMode || 'grid') === mode;
            return (
              <button
                key={mode}
                type="button"
                aria-pressed={isActive}
                onClick={() =>
                  onUpdateNodeClass(setGridDisplayMode(classNameValue, mode))
                }
                className={`flex-1 py-1 px-2 text-[11px] font-medium rounded-md transition-colors whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                  isActive
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>

        <div
          aria-hidden="true"
          className={`grid ${preview.previewGridClass} gap-1.5 p-2 bg-slate-50 rounded-lg`}
        >
          {Array.from({ length: preview.previewCellCount }).map((_, idx) => (
            <div
              key={idx}
              className="h-3.5 rounded-xs bg-blue-100/90 border border-blue-200/80"
            />
          ))}
        </div>
      </section>

      {/* Section 1: grid-template-columns */}
      <section
        aria-label="Grid Template Columns"
        className="space-y-3 pb-4 border-b border-slate-200/80"
      >
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-[11px] font-bold text-slate-600 tracking-wide">
            Grid Template Columns
          </h3>
          {activeColsToken && (
            <span className="text-[10px] font-mono text-blue-700 tabular-nums truncate max-w-[140px]">
              {activeColsToken}
            </span>
          )}
        </div>

        <div className="space-y-1.5">
          <span className="block text-[11px] font-semibold text-slate-600">
            Liczba kolumn
          </span>
          <div className="grid grid-cols-6 gap-1">
            {GRID_COLUMN_QUICK_CLASSES.map((opt) => {
              const isActive = activeColsToken === opt.cls;
              return (
                <button
                  key={opt.cls}
                  type="button"
                  title={opt.title}
                  aria-label={`Ustaw ${opt.title}`}
                  aria-pressed={isActive}
                  onClick={() =>
                    onUpdateNodeClass(setGridColsToken(classNameValue, opt.cls, ''))
                  }
                  className={`py-1.5 border rounded-md text-xs font-mono tabular-nums transition-colors whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                    isActive
                      ? 'bg-blue-50 border-blue-400 text-blue-700 font-semibold'
                      : 'bg-white hover:bg-blue-50 border-slate-200 hover:border-blue-300 text-slate-700'
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>

          <label className="block space-y-1 pt-0.5">
            <span className="block text-[10px] font-semibold text-slate-500">
              Pełna lista kolumn (1–12, none, subgrid)
            </span>
            <select
              aria-label="Grid template columns select"
              value={
                GRID_COLUMN_SELECT_OPTIONS.some((o) => o.value === activeColsToken)
                  ? activeColsToken
                  : ''
              }
              onChange={(e) =>
                onUpdateNodeClass(setGridColsToken(classNameValue, e.target.value, ''))
              }
              className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-md text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">
                {activeColsToken &&
                !GRID_COLUMN_SELECT_OPTIONS.some((o) => o.value === activeColsToken)
                  ? `Własny: ${activeColsToken}`
                  : 'Domyślne (brak)'}
              </option>
              {GRID_COLUMN_SELECT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="space-y-1.5 pt-2.5 border-t border-slate-100">
          <span className="block text-[11px] font-semibold text-slate-600">
            Presety proporcji i auto-fit
          </span>
          <div className="grid grid-cols-2 gap-1.5">
            {GRID_TEMPLATE_PRESETS.map((preset) => {
              const isActive = activeColsToken === preset.cls;
              return (
                <button
                  key={preset.id}
                  type="button"
                  aria-pressed={isActive}
                  onClick={() =>
                    onUpdateNodeClass(setGridColsToken(classNameValue, preset.cls, ''))
                  }
                  className={`p-2 rounded-lg border text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                    isActive
                      ? 'bg-blue-50 border-blue-400 text-blue-900'
                      : 'bg-white hover:bg-blue-50/70 border-slate-200 hover:border-blue-300 text-slate-700'
                  }`}
                >
                  <span className="block text-[11px] font-semibold leading-tight whitespace-nowrap truncate">
                    {preset.label}
                  </span>
                  <span className="block text-[10px] font-mono text-slate-500 truncate mt-0.5">
                    {preset.hint}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            const token = formatCustomGridTemplateToToken(customColsDraft);
            onUpdateNodeClass(setGridColsToken(classNameValue, token, ''));
          }}
          className="space-y-1.5 pt-2.5 border-t border-slate-100"
        >
          <label
            htmlFor="grid-custom-template-cols"
            className="block text-[11px] font-semibold text-slate-600"
          >
            Własne grid-template-columns
          </label>
          <div className="flex items-center gap-1.5">
            <input
              id="grid-custom-template-cols"
              type="text"
              value={customColsDraft}
              onChange={(e) => setCustomColsDraft(e.target.value)}
              placeholder="np. 200px 1fr 2fr"
              className="flex-1 min-w-0 px-2.5 py-1.5 bg-white border border-slate-200 rounded-md text-xs font-mono text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              Zastosuj
            </button>
          </div>
        </form>

        <div className="space-y-1.5 pt-2.5 border-t border-slate-100">
          <span className="block text-[11px] font-semibold text-slate-600">
            Kolumny responsywne
          </span>
          <div className="grid grid-cols-2 gap-1.5">
            <label className="block space-y-1">
              <span className="block text-[10px] font-mono text-slate-500">
                Tablet (md:)
              </span>
              <select
                aria-label="Kolumny na tablet md"
                value={activeMdColsToken}
                onChange={(e) =>
                  onUpdateNodeClass(
                    setGridColsToken(classNameValue, e.target.value, 'md')
                  )
                }
                className="w-full px-2 py-1 bg-white border border-slate-200 rounded-md text-[11px] font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {RESPONSIVE_MD_GRID_COLS_OPTIONS.map((opt) => (
                  <option key={opt.value || 'inherit'} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="block space-y-1">
              <span className="block text-[10px] font-mono text-slate-500">
                Desktop (lg:)
              </span>
              <select
                aria-label="Kolumny na desktop lg"
                value={activeLgColsToken}
                onChange={(e) =>
                  onUpdateNodeClass(
                    setGridColsToken(classNameValue, e.target.value, 'lg')
                  )
                }
                className="w-full px-2 py-1 bg-white border border-slate-200 rounded-md text-[11px] font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {RESPONSIVE_LG_GRID_COLS_OPTIONS.map((opt) => (
                  <option key={opt.value || 'inherit'} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>
      </section>

      {/* Section 2: grid-gap */}
      <section
        aria-label="Grid Gap"
        className="space-y-3 pb-4 border-b border-slate-200/80"
      >
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-[11px] font-bold text-slate-600 tracking-wide">
            Grid Gap
          </h3>
          <span className="text-[10px] font-mono text-slate-500 tabular-nums">
            {preview.gapLabel}
          </span>
        </div>

        <div
          role="group"
          aria-label="Tryb odstępów Grid"
          className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg"
        >
          <button
            type="button"
            aria-pressed={effectiveGapMode === 'uniform'}
            onClick={() => {
              setGapModeOverride('uniform');
              if (gapState.mode === 'split') {
                const candidate = gapState.x
                  ? `gap-${gapState.x.slice(6)}`
                  : gapState.y
                    ? `gap-${gapState.y.slice(6)}`
                    : '';
                if (candidate) {
                  onUpdateNodeClass(setGridUniformGap(classNameValue, candidate));
                }
              }
            }}
            className={`flex-1 py-1 px-2 text-[11px] font-medium rounded-md transition-colors whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
              effectiveGapMode === 'uniform'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Jednolity (gap)
          </button>
          <button
            type="button"
            aria-pressed={effectiveGapMode === 'split'}
            onClick={() => {
              setGapModeOverride('split');
              if (gapState.mode === 'uniform' && gapState.uniform) {
                const scale = gapState.uniform.slice(4);
                onUpdateNodeClass(
                  setGridAxisGap(classNameValue, 'x', `gap-x-${scale}`)
                );
              }
            }}
            className={`flex-1 py-1 px-2 text-[11px] font-medium rounded-md transition-colors whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
              effectiveGapMode === 'split'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Osobno (X / Y)
          </button>
        </div>

        {effectiveGapMode === 'uniform' ? (
          <div className="space-y-2">
            <div className="grid grid-cols-5 gap-1">
              {GRID_GAP_QUICK_OPTIONS.map((opt) => {
                const isActive = gapState.uniform === opt.cls;
                return (
                  <button
                    key={opt.cls}
                    type="button"
                    aria-label={`Ustaw ${opt.cls}`}
                    aria-pressed={isActive}
                    onClick={() =>
                      onUpdateNodeClass(setGridUniformGap(classNameValue, opt.cls))
                    }
                    className={`py-1.5 border rounded-md text-xs font-mono tabular-nums transition-colors whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                      isActive
                        ? 'bg-blue-50 border-blue-400 text-blue-700 font-semibold'
                        : 'bg-white hover:bg-blue-50 border-slate-200 hover:border-blue-300 text-slate-700'
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>

            <label className="block space-y-1">
              <span className="block text-[10px] font-semibold text-slate-500">
                Skala odstępu (gap-*)
              </span>
              <select
                aria-label="Jednolity Grid Gap"
                value={
                  GRID_UNIFORM_GAP_OPTIONS.some((o) => o.value === gapState.uniform)
                    ? gapState.uniform
                    : ''
                }
                onChange={(e) =>
                  onUpdateNodeClass(setGridUniformGap(classNameValue, e.target.value))
                }
                className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-md text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Brak odstępu</option>
                {GRID_UNIFORM_GAP_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </label>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const token = formatCustomGapToToken(customGapDraft);
                onUpdateNodeClass(setGridUniformGap(classNameValue, token));
              }}
              className="flex items-center gap-1.5"
            >
              <input
                type="text"
                aria-label="Własny grid gap"
                value={customGapDraft}
                onChange={(e) => setCustomGapDraft(e.target.value)}
                placeholder="Własny np. 18px lub 1.5rem"
                className="flex-1 min-w-0 px-2.5 py-1 bg-white border border-slate-200 rounded-md text-xs font-mono text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="submit"
                className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-[11px] font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              >
                Ustaw
              </button>
            </form>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-1.5">
            <label className="block space-y-1">
              <span className="block text-[10px] font-semibold text-slate-600">
                Column Gap (gap-x)
              </span>
              <select
                aria-label="Column Gap gap-x"
                value={gapState.x}
                onChange={(e) =>
                  onUpdateNodeClass(
                    setGridAxisGap(classNameValue, 'x', e.target.value)
                  )
                }
                className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-md text-[11px] font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Brak</option>
                {GRID_COLUMN_GAP_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="block space-y-1">
              <span className="block text-[10px] font-semibold text-slate-600">
                Row Gap (gap-y)
              </span>
              <select
                aria-label="Row Gap gap-y"
                value={gapState.y}
                onChange={(e) =>
                  onUpdateNodeClass(
                    setGridAxisGap(classNameValue, 'y', e.target.value)
                  )
                }
                className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-md text-[11px] font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Brak</option>
                {GRID_ROW_GAP_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        )}
      </section>

      {/* Section 3: Auto-Placement */}
      <section
        aria-label="Auto-Placement"
        className="space-y-3 pb-4 border-b border-slate-200/80"
      >
        <h3 className="text-[11px] font-bold text-slate-600 tracking-wide">
          Auto-Placement
        </h3>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-semibold text-slate-600">
              Grid Auto Flow
            </span>
            {activeAutoFlow && (
              <button
                type="button"
                onClick={() =>
                  onUpdateNodeClass(setGridAutoFlow(classNameValue, ''))
                }
                className="text-[10px] font-medium text-blue-600 hover:text-blue-700 whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded px-0.5"
              >
                Reset
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-1">
            {GRID_AUTO_FLOW_OPTIONS.map((opt) => {
              const isActive = activeAutoFlow === opt.cls;
              return (
                <button
                  key={opt.cls}
                  type="button"
                  title={opt.title}
                  aria-label={opt.title}
                  aria-pressed={isActive}
                  onClick={() =>
                    onUpdateNodeClass(
                      setGridAutoFlow(classNameValue, isActive ? '' : opt.cls)
                    )
                  }
                  className={`px-2 py-1 border rounded-md text-[11px] font-medium transition-colors whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                    isActive
                      ? 'bg-blue-50 border-blue-400 text-blue-700 font-semibold'
                      : 'bg-white hover:bg-blue-50 border-slate-200 hover:border-blue-300 text-slate-700'
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-1.5 pt-2 border-t border-slate-100">
          <label className="block space-y-1">
            <span className="block text-[10px] font-semibold text-slate-600">
              Auto Columns
            </span>
            <select
              aria-label="Grid auto columns"
              value={activeAutoCols}
              onChange={(e) =>
                onUpdateNodeClass(setGridAutoCols(classNameValue, e.target.value))
              }
              className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-md text-[11px] text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Domyślne</option>
              {GRID_AUTO_COLS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>

          <label className="block space-y-1">
            <span className="block text-[10px] font-semibold text-slate-600">
              Auto Rows
            </span>
            <select
              aria-label="Grid auto rows"
              value={activeAutoRows}
              onChange={(e) =>
                onUpdateNodeClass(setGridAutoRows(classNameValue, e.target.value))
              }
              className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-md text-[11px] text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Domyślne</option>
              {GRID_AUTO_ROWS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="grid grid-cols-2 gap-1.5 pt-2 border-t border-slate-100">
          <label className="block space-y-1">
            <span className="block text-[10px] font-semibold text-slate-600">
              Place Items
            </span>
            <select
              aria-label="Grid place items"
              value={activePlaceItems}
              onChange={(e) =>
                onUpdateNodeClass(
                  setGridPlaceItems(classNameValue, e.target.value)
                )
              }
              className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-md text-[11px] text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Domyślne</option>
              {GRID_PLACE_ITEMS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>

          <label className="block space-y-1">
            <span className="block text-[10px] font-semibold text-slate-600">
              Place Content
            </span>
            <select
              aria-label="Grid place content"
              value={activePlaceContent}
              onChange={(e) =>
                onUpdateNodeClass(
                  setGridPlaceContent(classNameValue, e.target.value)
                )
              }
              className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-md text-[11px] text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Domyślne</option>
              {GRID_PLACE_CONTENT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      {/* Section 4: Direct Child Spans */}
      <section aria-label="Elementy siatki" className="space-y-2.5">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-[11px] font-bold text-slate-600 tracking-wide">
            Komórki potomne ({directChildren.length})
          </h3>
        </div>

        {directChildren.length === 0 ? (
          <p className="text-[11px] text-slate-500 leading-relaxed">
            Ten Grid nie ma jeszcze dzieci. Dodaj komponenty do wnętrza siatki, aby regulować ich rozpiętość kolumn i wierszy (`col-span` / `row-span`).
          </p>
        ) : (
          <div className="divide-y divide-slate-200 border border-slate-200 rounded-lg bg-white overflow-hidden">
            {directChildren.map((child) => {
              const childCls = child.props.className || '';
              const colSpan = getGridChildSpan(childCls, 'col');
              const rowSpan = getGridChildSpan(childCls, 'row');

              return (
                <div key={child.id} className="p-2 space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => onSelectNode(child.id)}
                      className="text-[11px] font-semibold text-slate-800 hover:text-blue-700 truncate text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded"
                    >
                      {child.name || child.type}
                    </button>
                    <span className="text-[10px] font-mono text-slate-400 shrink-0">
                      {child.type}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-1.5">
                    <select
                      aria-label={`Col span dla ${child.name || child.id}`}
                      value={colSpan}
                      onChange={(e) =>
                        onUpdateNodeClassById(
                          child.id,
                          setGridChildSpan(childCls, 'col', e.target.value)
                        )
                      }
                      className="w-full px-1.5 py-1 bg-slate-50 border border-slate-200 rounded text-[10px] font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">col-span (auto)</option>
                      {GRID_CHILD_COL_SPAN_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>

                    <select
                      aria-label={`Row span dla ${child.name || child.id}`}
                      value={rowSpan}
                      onChange={(e) =>
                        onUpdateNodeClassById(
                          child.id,
                          setGridChildSpan(childCls, 'row', e.target.value)
                        )
                      }
                      className="w-full px-1.5 py-1 bg-slate-50 border border-slate-200 rounded text-[10px] font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">row-span (auto)</option>
                      {GRID_CHILD_ROW_SPAN_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
