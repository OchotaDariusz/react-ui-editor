import { Keyboard, X } from 'lucide-react';
import { KeyboardShortcutsPanel } from './KeyboardShortcutsPanel';

interface KeyboardShortcutsModalProps {
  open: boolean;
  onClose: () => void;
}

export function KeyboardShortcutsModal({
  open,
  onClose,
}: KeyboardShortcutsModalProps) {
  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-label="Keyboard Shortcuts"
      aria-modal="false"
      onClick={(e) => e.stopPropagation()}
      className="absolute bottom-3 right-3 z-30 w-[340px] max-w-[calc(100%-1.5rem)] max-h-[65vh] bg-white rounded-2xl border border-slate-200 shadow-2xl flex flex-col overflow-hidden"
    >
      <div className="px-3.5 py-2.5 border-b border-slate-200 bg-slate-50/80 flex items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-2">
          <Keyboard className="w-4 h-4 text-blue-600 shrink-0" />
          <h3 className="text-xs font-bold text-slate-900">
            Keyboard Shortcuts
          </h3>
        </div>
        <button
          type="button"
          onClick={onClose}
          title="Zamknij skróty (Escape)"
          aria-label="Zamknij Keyboard Shortcuts"
          className="p-1 rounded-md text-slate-500 hover:text-slate-900 hover:bg-slate-200/70 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="p-3 overflow-y-auto flex-1">
        <KeyboardShortcutsPanel compact />
      </div>
    </div>
  );
}
