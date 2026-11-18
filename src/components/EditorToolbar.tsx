import {
  Code,
  Edit3,
  Eye,
  Monitor,
  Redo2,
  RotateCcw,
  Smartphone,
  Tablet,
  Undo2,
} from 'lucide-react';
import type { ViewportMode } from '../types/editor';

interface EditorToolbarProps {
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  confirmReset: boolean;
  onReset: () => void;
  viewport: ViewportMode;
  onChangeViewport: (mode: ViewportMode) => void;
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
  previewMode,
  onTogglePreview,
  showCode,
  onToggleShowCode,
}: EditorToolbarProps) {
  return (
    <header className="h-14 bg-white border-b border-slate-200 px-4 flex items-center justify-between gap-4 shrink-0 z-10">
      <div className="flex items-center gap-1 shrink-0">
        <button
          type="button"
          onClick={onUndo}
          disabled={!canUndo}
          title="Cofnij (Ctrl+Z)"
          aria-label="Cofnij (Ctrl+Z)"
          className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 disabled:opacity-35 disabled:hover:bg-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        >
          <Undo2 className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={onRedo}
          disabled={!canRedo}
          title="Ponów (Ctrl+Y)"
          aria-label="Ponów (Ctrl+Y)"
          className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 disabled:opacity-35 disabled:hover:bg-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        >
          <Redo2 className="w-4 h-4" />
        </button>
        <div className="h-5 w-px bg-slate-200 mx-1.5" aria-hidden="true" />
        <button
          type="button"
          onClick={onReset}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
            confirmReset
              ? 'bg-red-600 text-white'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <RotateCcw className="w-3.5 h-3.5" />
          {confirmReset ? 'Kliknij ponownie' : 'Reset'}
        </button>
      </div>

      <div
        role="group"
        aria-label="Rozmiar podglądu"
        className="hidden sm:flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200 shrink-0"
      >
        {VIEWPORT_OPTIONS.map(({ id, icon: Icon, title }) => (
          <button
            key={id}
            type="button"
            title={title}
            aria-label={title}
            aria-pressed={viewport === id}
            onClick={() => onChangeViewport(id)}
            className={`p-1.5 rounded-md transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
              viewport === id
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Icon className="w-4 h-4" />
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <button
          type="button"
          aria-pressed={previewMode}
          onClick={onTogglePreview}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
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
          className="flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        >
          <Code className="w-3.5 h-3.5" />
          {showCode ? 'Płótno' : 'Eksport JSX'}
        </button>
      </div>
    </header>
  );
}
