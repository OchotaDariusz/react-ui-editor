import { useEffect, useRef, useState } from 'react';
import {
  BoxSelect,
  Check,
  ChevronDown,
  Code,
  Copy,
  Edit3,
  Eye,
  FileCode2,
  FileDown,
  FileImage,
  FileText,
  ListChecks,
  Monitor,
  PanelLeftClose,
  PanelLeftOpen,
  PanelRightClose,
  PanelRightOpen,
  Redo2,
  RotateCcw,
  Ruler,
  Smartphone,
  Tablet,
  Undo2,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import type { ExportFormat, ViewportMode } from '../types/editor';
import { ZOOM_LEVELS } from '../utils/editorLogic';

interface EditorToolbarProps {
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  confirmReset: boolean;
  onReset: () => void;
  viewport: ViewportMode;
  onChangeViewport: (mode: ViewportMode) => void;
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
  showGuides: boolean;
  onToggleGuides: () => void;
  showRulers: boolean;
  onToggleRulers: () => void;
  leftSidebarCollapsed: boolean;
  onToggleLeftSidebar: () => void;
  rightSidebarCollapsed: boolean;
  onToggleRightSidebar: () => void;
  multiSelectMode: boolean;
  multiSelectCount: number;
  onToggleMultiSelect: () => void;
  copiedJson: boolean;
  onCopyTreeJson: () => void;
  isExportingPdf: boolean;
  onExportPdf: () => void;
  onExportFormat: (format: ExportFormat) => void;
  previewMode: boolean;
  onTogglePreview: () => void;
  showCode: boolean;
  onToggleShowCode: () => void;
}

const VIEWPORT_OPTIONS: Array<{
  id: ViewportMode;
  icon: typeof Monitor;
  title: string;
}> = [
  { id: 'desktop', icon: Monitor, title: 'Desktop' },
  { id: 'tablet', icon: Tablet, title: 'Tablet (768px)' },
  { id: 'mobile', icon: Smartphone, title: 'Mobile (375px)' },
];

export function EditorToolbar({
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  confirmReset,
  onReset,
  viewport,
  onChangeViewport,
  zoom,
  onZoomIn,
  onZoomOut,
  onResetZoom,
  showGuides,
  onToggleGuides,
  showRulers,
  onToggleRulers,
  leftSidebarCollapsed,
  onToggleLeftSidebar,
  rightSidebarCollapsed,
  onToggleRightSidebar,
  multiSelectMode,
  multiSelectCount,
  onToggleMultiSelect,
  copiedJson,
  onCopyTreeJson,
  isExportingPdf,
  onExportPdf,
  onExportFormat,
  previewMode,
  onTogglePreview,
  showCode,
  onToggleShowCode,
}: EditorToolbarProps) {
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement | null>(null);

  const minZoom = ZOOM_LEVELS[0];
  const maxZoom = ZOOM_LEVELS[ZOOM_LEVELS.length - 1];
  const zoomPercent = Math.round(zoom * 100);

  useEffect(() => {
    if (!exportMenuOpen) return;
    const handlePointerDown = (event: MouseEvent) => {
      if (
        exportMenuRef.current &&
        !exportMenuRef.current.contains(event.target as Node)
      ) {
        setExportMenuOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setExportMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [exportMenuOpen]);

  return (
    <header className="h-14 bg-white border-b border-slate-200 px-1.5 flex items-center justify-between gap-1 shrink-0 z-20">
      <div className="flex items-center gap-0.5 shrink-0">
        <button
          type="button"
          data-testid="toggle-left-sidebar-btn"
          onClick={onToggleLeftSidebar}
          aria-expanded={!leftSidebarCollapsed}
          aria-label="Pokaż lub ukryj panel lewy"
          title={leftSidebarCollapsed ? 'Pokaż panel lewy' : 'Ukryj panel lewy'}
          className={`p-1 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
            leftSidebarCollapsed
              ? 'bg-blue-50 text-blue-700 border border-blue-200'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          {leftSidebarCollapsed ? (
            <PanelLeftOpen className="w-3.5 h-3.5" />
          ) : (
            <PanelLeftClose className="w-3.5 h-3.5" />
          )}
        </button>
        <div className="h-5 w-px bg-slate-200" aria-hidden="true" />
        <button
          type="button"
          onClick={onUndo}
          disabled={!canUndo}
          title="Cofnij (Ctrl+Z)"
          aria-label="Cofnij (Ctrl+Z)"
          className="p-1 rounded-lg text-slate-600 hover:bg-slate-100 disabled:opacity-35 disabled:hover:bg-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        >
          <Undo2 className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={onRedo}
          disabled={!canRedo}
          title="Ponów (Ctrl+Y)"
          aria-label="Ponów (Ctrl+Y)"
          className="p-1 rounded-lg text-slate-600 hover:bg-slate-100 disabled:opacity-35 disabled:hover:bg-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        >
          <Redo2 className="w-3.5 h-3.5" />
        </button>
        <div className="h-5 w-px bg-slate-200" aria-hidden="true" />
        <button
          type="button"
          onClick={onReset}
          title={confirmReset ? 'Kliknij ponownie, aby zresetować płótno' : 'Resetuj płótno'}
          aria-label={confirmReset ? 'Potwierdź reset płótna' : 'Resetuj płótno'}
          className={`flex items-center gap-1 p-1.5 rounded-lg text-[11px] font-medium transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
            confirmReset
              ? 'bg-red-600 text-white px-2'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <RotateCcw className="w-3.5 h-3.5" />
          {confirmReset && <span>Potwierdź</span>}
        </button>
      </div>

      <div className="hidden sm:flex items-center gap-1 shrink-0">
        <div
          role="group"
          aria-label="Rozmiar podglądu"
          className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 shrink-0"
        >
          {VIEWPORT_OPTIONS.map(({ id, icon: Icon, title }) => (
            <button
              key={id}
              type="button"
              title={title}
              aria-label={title}
              aria-pressed={viewport === id}
              onClick={() => onChangeViewport(id)}
              className={`p-1 rounded-md transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                viewport === id
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
            </button>
          ))}
        </div>

        <div
          role="group"
          aria-label="Powiększenie płótna"
          className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 shrink-0"
        >
          <button
            type="button"
            title="Oddal płótno"
            aria-label="Oddal płótno"
            disabled={showCode || zoom <= minZoom}
            onClick={onZoomOut}
            className="p-1 rounded-md text-slate-600 hover:bg-white hover:text-slate-900 disabled:opacity-35 disabled:hover:bg-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            title="Resetuj powiększenie do 100%"
            aria-label="Resetuj powiększenie do 100%"
            disabled={showCode}
            onClick={onResetZoom}
            className={`px-1 py-0.5 rounded-md text-[11px] font-mono font-semibold tabular-nums transition-colors whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
              zoom !== 1 && !showCode
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-slate-700 hover:bg-white/70'
            } disabled:opacity-40`}
          >
            {zoomPercent}%
          </button>
          <button
            type="button"
            title="Powiększ płótno"
            aria-label="Powiększ płótno"
            disabled={showCode || zoom >= maxZoom}
            onClick={onZoomIn}
            className="p-1 rounded-md text-slate-600 hover:bg-white hover:text-slate-900 disabled:opacity-35 disabled:hover:bg-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="flex items-center gap-0.5 shrink-0">
        <button
          type="button"
          title="Tryb wielokrotnego zaznaczania (lub Ctrl/Shift+Klik)"
          aria-label="Tryb wielokrotnego zaznaczania"
          aria-pressed={multiSelectMode}
          disabled={previewMode || showCode}
          onClick={onToggleMultiSelect}
          className={`flex items-center gap-1 px-1.5 py-1 rounded-lg text-[11px] font-semibold border transition-colors whitespace-nowrap shrink-0 disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
            multiSelectMode && !previewMode && !showCode
              ? 'bg-violet-50 border-violet-300 text-violet-700'
              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          <ListChecks className="w-3.5 h-3.5" />
          {multiSelectCount > 1 ? `Multi (${multiSelectCount})` : 'Multi'}
        </button>

        <button
          type="button"
          title="Pokaż prowadnice (przerywane obramowanie komponentów)"
          aria-label="Pokaż prowadnice"
          aria-pressed={showGuides}
          disabled={previewMode || showCode}
          onClick={onToggleGuides}
          className={`flex items-center gap-1 px-1.5 py-1 rounded-lg text-[11px] font-semibold border transition-colors whitespace-nowrap shrink-0 disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
            showGuides && !previewMode && !showCode
              ? 'bg-indigo-50 border-indigo-300 text-indigo-700'
              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          <BoxSelect className="w-3.5 h-3.5" />
          Guides
        </button>

        <button
          type="button"
          data-testid="toggle-rulers-btn"
          title="Pokaż lub ukryj linijki pikselowe płótna"
          aria-label="Linijki pikselowe"
          aria-pressed={showRulers}
          disabled={showCode}
          onClick={onToggleRulers}
          className={`flex items-center gap-1 px-1.5 py-1 rounded-lg text-[11px] font-semibold border transition-colors whitespace-nowrap shrink-0 disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
            showRulers && !showCode
              ? 'bg-blue-50 border-blue-300 text-blue-700'
              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          <Ruler className="w-3.5 h-3.5" />
          Rulers
        </button>

        <button
          type="button"
          title="Kopiuj JSON drzewa"
          aria-label="Kopiuj JSON drzewa"
          onClick={onCopyTreeJson}
          className={`flex items-center justify-center p-1.5 rounded-lg text-[11px] font-semibold border transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
            copiedJson
              ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          {copiedJson ? (
            <Check className="w-3.5 h-3.5 text-emerald-600" />
          ) : (
            <Copy className="w-3.5 h-3.5" />
          )}
        </button>

        <button
          type="button"
          title={
            showCode
              ? 'Wróć na płótno, aby wyeksportować PDF'
              : 'Eksportuj widok płótna jako plik PDF'
          }
          aria-label="Export PDF"
          disabled={showCode || isExportingPdf}
          onClick={onExportPdf}
          className="flex items-center justify-center p-1.5 rounded-lg text-[11px] font-semibold border bg-white border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0 disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        >
          <FileDown className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          aria-pressed={previewMode}
          onClick={onTogglePreview}
          className={`flex items-center gap-1 px-1.5 py-1 rounded-lg text-[11px] font-semibold border transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
            previewMode
              ? 'bg-blue-50 border-blue-300 text-blue-700'
              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          {previewMode ? (
            <>
              <Edit3 className="w-3.5 h-3.5" /> Edycja
            </>
          ) : (
            <>
              <Eye className="w-3.5 h-3.5" /> Podgląd
            </>
          )}
        </button>

        {showCode ? (
          <button
            type="button"
            aria-pressed={true}
            onClick={onToggleShowCode}
            className="flex items-center gap-1 px-1.5 py-1 bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            <Code className="w-3.5 h-3.5" />
            Płótno
          </button>
        ) : (
          <div className="relative shrink-0" ref={exportMenuRef}>
            <button
              type="button"
              aria-haspopup="menu"
              aria-expanded={exportMenuOpen}
              aria-label="Eksportuj projekt"
              onClick={() => setExportMenuOpen((prev) => !prev)}
              className="flex items-center gap-1 px-1.5 py-1 bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              <Code className="w-3.5 h-3.5" />
              Eksport
              <ChevronDown className="w-3 h-3 opacity-80" />
            </button>

            {exportMenuOpen && (
              <div
                role="menu"
                aria-label="Format eksportu"
                className="absolute right-0 mt-1.5 w-52 bg-white border border-slate-200 rounded-xl shadow-xl py-1.5 z-50"
              >
                <div className="px-3 py-1 text-[10px] font-bold text-slate-400 tracking-wide">
                  Pobierz plik
                </div>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setExportMenuOpen(false);
                    onExportFormat('html');
                  }}
                  className="w-full px-3 py-2 text-left text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900 flex items-center justify-between gap-2 transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <FileText className="w-3.5 h-3.5 text-orange-500" />
                    Export HTML
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">.html</span>
                </button>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setExportMenuOpen(false);
                    onExportFormat('react');
                  }}
                  className="w-full px-3 py-2 text-left text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900 flex items-center justify-between gap-2 transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <FileCode2 className="w-3.5 h-3.5 text-blue-500" />
                    Export React
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">.jsx</span>
                </button>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setExportMenuOpen(false);
                    onExportFormat('svg');
                  }}
                  className="w-full px-3 py-2 text-left text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900 flex items-center justify-between gap-2 transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <FileImage className="w-3.5 h-3.5 text-emerald-600" />
                    Export SVG
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">.svg</span>
                </button>
                <button
                  type="button"
                  role="menuitem"
                  disabled={isExportingPdf}
                  onClick={() => {
                    setExportMenuOpen(false);
                    onExportFormat('pdf');
                  }}
                  className="w-full px-3 py-2 text-left text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900 flex items-center justify-between gap-2 transition-colors disabled:opacity-40"
                >
                  <span className="flex items-center gap-2">
                    <FileDown className="w-3.5 h-3.5 text-rose-600" />
                    Export PDF
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">.pdf</span>
                </button>

                <div className="my-1 border-t border-slate-100" />
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setExportMenuOpen(false);
                    onToggleShowCode();
                  }}
                  className="w-full px-3 py-2 text-left text-xs font-semibold text-blue-600 hover:bg-blue-50 flex items-center gap-2 transition-colors"
                >
                  <Code className="w-3.5 h-3.5" />
                  Podgląd kodu (HTML / React / SVG)
                </button>
              </div>
            )}
          </div>
        )}

        <div className="h-5 w-px bg-slate-200" aria-hidden="true" />
        <button
          type="button"
          data-testid="toggle-right-sidebar-btn"
          onClick={onToggleRightSidebar}
          aria-expanded={!rightSidebarCollapsed}
          aria-label="Pokaż lub ukryj Inspektor"
          title={rightSidebarCollapsed ? 'Pokaż Inspektor' : 'Ukryj Inspektor'}
          className={`p-1 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
            rightSidebarCollapsed
              ? 'bg-blue-50 text-blue-700 border border-blue-200'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          {rightSidebarCollapsed ? (
            <PanelRightOpen className="w-3.5 h-3.5" />
          ) : (
            <PanelRightClose className="w-3.5 h-3.5" />
          )}
        </button>
      </div>
    </header>
  );
}
