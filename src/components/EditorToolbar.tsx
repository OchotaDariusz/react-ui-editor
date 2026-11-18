import {
  BoxSelect,
  Check,
  Code,
  Copy,
  Edit3,
  Eye,
  FileDown,
  Monitor,
  Redo2,
  RotateCcw,
  Smartphone,
  Tablet,
  Undo2,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import type { ViewportMode } from '../types/editor';
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
  copiedJson: boolean;
  onCopyTreeJson: () => void;
  isExportingPdf: boolean;
  onExportPdf: () => void;
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
  copiedJson,
  onCopyTreeJson,
  isExportingPdf,
  onExportPdf,
  previewMode,
  onTogglePreview,
  showCode,
  onToggleShowCode,
}: EditorToolbarProps) {
  const minZoom = ZOOM_LEVELS[0];
  const maxZoom = ZOOM_LEVELS[ZOOM_LEVELS.length - 1];
  const zoomPercent = Math.round(zoom * 100);

  return (
    <header className="h-14 bg-white border-b border-slate-200 px-2 flex items-center justify-between gap-1 shrink-0 z-10">
      <div className="flex items-center gap-0.5 shrink-0">
        <button
          type="button"
          onClick={onUndo}
          disabled={!canUndo}
          title="Cofnij (Ctrl+Z)"
          aria-label="Cofnij (Ctrl+Z)"
          className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 disabled:opacity-35 disabled:hover:bg-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        >
          <Undo2 className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={onRedo}
          disabled={!canRedo}
          title="Ponów (Ctrl+Y)"
          aria-label="Ponów (Ctrl+Y)"
          className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 disabled:opacity-35 disabled:hover:bg-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        >
          <Redo2 className="w-4 h-4" />
        </button>
        <div className="h-5 w-px bg-slate-200 mx-1" aria-hidden="true" />
        <button
          type="button"
          onClick={onReset}
          className={`flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
            confirmReset
              ? 'bg-red-600 text-white'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <RotateCcw className="w-3.5 h-3.5" />
          {confirmReset ? 'Kliknij ponownie' : 'Reset'}
        </button>
      </div>

      <div className="hidden sm:flex items-center gap-1.5 shrink-0">
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
              <Icon className="w-4 h-4" />
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
            className={`px-1.5 py-1 rounded-md text-xs font-mono font-semibold tabular-nums transition-colors whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
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

      <div className="flex items-center gap-1 shrink-0">
        <button
          type="button"
          title="Pokaż prowadnice (przerywane obramowanie komponentów)"
          aria-label="Pokaż prowadnice"
          aria-pressed={showGuides}
          disabled={previewMode || showCode}
          onClick={onToggleGuides}
          className={`flex items-center gap-1 px-1.5 py-1.5 rounded-lg text-xs font-semibold border transition-colors whitespace-nowrap shrink-0 disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
            showGuides && !previewMode && !showCode
              ? 'bg-indigo-50 border-indigo-300 text-indigo-700'
              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          <BoxSelect className="w-3.5 h-3.5" />
          Prowadnice
        </button>

        <button
          type="button"
          title="Kopiuj JSON drzewa"
          aria-label="Kopiuj JSON drzewa"
          onClick={onCopyTreeJson}
          className={`flex items-center gap-1 px-1.5 py-1.5 rounded-lg text-xs font-semibold border transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
            copiedJson
              ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          {copiedJson ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              Skopiowano
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              Kopiuj
            </>
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
          className="flex items-center gap-1 px-1.5 py-1.5 rounded-lg text-xs font-semibold border bg-white border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0 disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        >
          <FileDown className="w-3.5 h-3.5" />
          {isExportingPdf ? 'PDF...' : 'Export PDF'}
        </button>

        <button
          type="button"
          aria-pressed={previewMode}
          onClick={onTogglePreview}
          className={`flex items-center gap-1 px-1.5 py-1.5 rounded-lg text-xs font-semibold border transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
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

        <button
          type="button"
          aria-pressed={showCode}
          onClick={onToggleShowCode}
          className="flex items-center gap-1 px-2 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        >
          <Code className="w-3.5 h-3.5" />
          {showCode ? 'Płótno' : 'Eksport JSX'}
        </button>
      </div>
    </header>
  );
}
