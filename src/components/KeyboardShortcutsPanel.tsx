import { Fragment, useMemo, useState } from 'react';
import { Keyboard, Search } from 'lucide-react';
import { KEYBOARD_SHORTCUTS } from '../constants/editorDefaults';
import type { KeyboardShortcutCategory, KeyboardShortcutItem } from '../types/editor';
import { filterKeyboardShortcuts } from '../utils/editorLogic';

interface KeyboardShortcutsPanelProps {
  compact?: boolean;
  onOpenFloatingModal?: () => void;
  isFloatingModalOpen?: boolean;
}

const CATEGORY_ORDER: Array<{
  id: KeyboardShortcutCategory;
  label: string;
}> = [
  { id: 'editing', label: 'Edycja komponentów' },
  { id: 'selection', label: 'Zaznaczanie i nawigacja' },
  { id: 'history', label: 'Historia zmian' },
  { id: 'view', label: 'Widok i wyszukiwanie' },
];

export function KeyboardShortcutsPanel({
  compact = false,
  onOpenFloatingModal,
  isFloatingModalOpen = false,
}: KeyboardShortcutsPanelProps) {
  const [query, setQuery] = useState('');

  const filteredShortcuts = useMemo(
    () => filterKeyboardShortcuts(KEYBOARD_SHORTCUTS, query),
    [query]
  );

  const grouped = useMemo(() => {
    const map = new Map<KeyboardShortcutCategory, KeyboardShortcutItem[]>();
    for (const cat of CATEGORY_ORDER) {
      map.set(cat.id, []);
    }
    for (const item of filteredShortcuts) {
      map.get(item.category)?.push(item);
    }
    return CATEGORY_ORDER.map((cat) => ({
      ...cat,
      items: map.get(cat.id) || [],
    })).filter((g) => g.items.length > 0);
  }, [filteredShortcuts]);

  return (
    <div className={compact ? 'space-y-3' : 'p-4 flex-1 overflow-y-auto flex flex-col gap-4'}>
      {!compact && (
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <Keyboard className="w-4 h-4 text-blue-600 shrink-0" />
            <h3 className="text-xs font-bold text-slate-800">
              Keyboard Shortcuts
            </h3>
          </div>
          {onOpenFloatingModal && (
            <button
              type="button"
              onClick={onOpenFloatingModal}
              aria-pressed={isFloatingModalOpen}
              className="px-2 py-1 rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-[11px] font-medium text-slate-700 transition-colors whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              {isFloatingModalOpen ? 'Ukryj pływające' : 'Przypnij okno'}
            </button>
          )}
        </div>
      )}

      <div className="relative">
        <Search
          className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
          aria-hidden="true"
        />
        <input
          type="search"
          aria-label="Szukaj skrótu klawiszowego"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Szukaj skrótu (np. Delete, Escape)..."
          className="w-full pl-8 pr-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {grouped.length === 0 ? (
        <div className="p-4 text-center rounded-xl border border-dashed border-slate-200 bg-slate-50">
          <p className="text-xs text-slate-500">
            Brak skrótów pasujących do „{query}”.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {grouped.map((group) => (
            <section
              key={group.id}
              aria-label={group.label}
              className="space-y-2 p-2.5 bg-slate-50 rounded-xl border border-slate-200/80"
            >
              <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-0.5">
                {group.label}
              </h4>
              <dl className="space-y-1.5">
                {group.items.map((item) => (
                  <div
                    key={item.id}
                    className="p-2 bg-white border border-slate-200/80 rounded-lg space-y-1"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <dt className="text-xs font-semibold text-slate-800">
                        {item.action}
                      </dt>
                      <dd className="flex items-center gap-1 flex-wrap justify-end">
                        {item.keys.map((keyLabel, idx) => (
                          <Fragment key={`${item.id}-${keyLabel}`}>
                            {idx > 0 && (
                              <span
                                className="text-[10px] text-slate-400 font-medium"
                                aria-hidden="true"
                              >
                                +
                              </span>
                            )}
                            <kbd className="px-1.5 py-0.5 bg-slate-100 border border-slate-300 border-b-2 rounded text-[10px] font-mono font-semibold text-slate-700 whitespace-nowrap">
                              {keyLabel}
                            </kbd>
                          </Fragment>
                        ))}
                      </dd>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-snug">
                      {item.description}
                    </p>
                  </div>
                ))}
              </dl>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
