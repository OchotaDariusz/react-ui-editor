import { useMemo, useState } from 'react';
import { Palette, RotateCcw } from 'lucide-react';
import type { EditorNode, NodesMap, ThemeVariable } from '../types/editor';
import { analyzeNodeThemeUsage } from '../utils/themeUsage';

interface ThemeUsageDashboardProps {
  selectedNode: EditorNode | undefined;
  isMultiSelect: boolean;
  nodes: NodesMap;
  themeVars: ThemeVariable[];
  onSetLocalOverride: (varName: string, overrideValue: string | null) => void;
  onClearAllLocalOverrides: () => void;
  onAttachThemeVarClass: (varItem: ThemeVariable, mode: 'text' | 'bg' | 'size') => void;
}

const isHexColor = (val: string): boolean => /^#[0-9a-fA-F]{6}$/.test(val.trim());

export function ThemeUsageDashboard({
  selectedNode,
  isMultiSelect,
  nodes,
  themeVars,
  onSetLocalOverride,
  onClearAllLocalOverrides,
  onAttachThemeVarClass,
}: ThemeUsageDashboardProps) {
  const [expandedQuickAttach, setExpandedQuickAttach] = useState(false);

  const report = useMemo(
    () =>
      !isMultiSelect
        ? analyzeNodeThemeUsage(selectedNode, nodes, themeVars)
        : null,
    [isMultiSelect, selectedNode, nodes, themeVars]
  );

  if (isMultiSelect) {
    return (
      <section
        aria-label="Theme Usage"
        data-testid="theme-usage-dashboard"
        className="space-y-2 p-3 bg-slate-50 rounded-xl border border-slate-200/80"
      >
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-[11px] font-bold text-slate-600 tracking-wide">
            Theme Usage
          </h3>
        </div>
        <p className="text-[11px] text-slate-500 leading-relaxed">
          Wybierz pojedynczy komponent, aby podejrzeć używane zmienne CSS oraz ustawić dla nich lokalne nadpisania.
        </p>
      </section>
    );
  }

  if (!selectedNode || !report) return null;

  const isContainerOrButton =
    selectedNode.type === 'Container' ||
    selectedNode.type === 'Grid' ||
    selectedNode.type === 'Button' ||
    selectedNode.type === 'Badge';

  return (
    <section
      aria-label="Theme Usage"
      data-testid="theme-usage-dashboard"
      className="space-y-3 p-3 bg-slate-50 rounded-xl border border-slate-200/80"
    >
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <h3 className="text-[11px] font-bold text-slate-600 tracking-wide">
            Theme Usage
          </h3>
          <p className="text-[11px] text-slate-500 tabular-nums truncate">
            {report.nodeName} · {report.usedCount} użytych · {report.overriddenCount} lokalnych
          </p>
        </div>

        {report.overriddenCount > 0 && (
          <button
            type="button"
            aria-label="Resetuj wszystkie lokalne nadpisania"
            onClick={onClearAllLocalOverrides}
            className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium text-slate-600 hover:text-red-700 hover:bg-white border border-transparent hover:border-slate-200 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            <RotateCcw className="w-3 h-3" />
            Resetuj
          </button>
        )}
      </div>

      {report.items.length === 0 ? (
        <div className="p-2.5 bg-white border border-slate-200 rounded-lg space-y-2">
          <p className="text-[11px] text-slate-600 leading-relaxed">
            Ten komponent nie używa jeszcze zmiennych CSS (`var(--...)`) w swoich klasach.
            {report.childVarCount > 0 &&
              ` Wewnątrz dzieci używa ${report.childVarCount} zmiennych — możesz je też nadpisać po przypięciu.`}
          </p>

          {themeVars.length > 0 && (
            <div className="space-y-1.5 pt-1 border-t border-slate-100">
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-500">
                  <Palette className="w-3 h-3 text-slate-400" />
                  Szybkie przypięcie zmiennej
                </span>
                {themeVars.length > 3 && (
                  <button
                    type="button"
                    onClick={() => setExpandedQuickAttach((prev) => !prev)}
                    className="text-[10px] font-medium text-blue-600 hover:text-blue-700 whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded"
                  >
                    {expandedQuickAttach ? 'Mniej' : `Wszystkie (${themeVars.length})`}
                  </button>
                )}
              </div>

              <div className="flex flex-wrap gap-1">
                {(expandedQuickAttach ? themeVars : themeVars.slice(0, 3)).map((tv) => {
                  const defaultMode =
                    tv.category === 'fontSize'
                      ? 'size'
                      : isContainerOrButton && /surface|primary|secondary/i.test(tv.name)
                        ? 'bg'
                        : 'text';
                  return (
                    <button
                      key={tv.id}
                      type="button"
                      aria-label={`Przypnij ${tv.name} do komponentu`}
                      onClick={() => onAttachThemeVarClass(tv, defaultMode)}
                      className="inline-flex items-center gap-1.5 px-2 py-1 bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 rounded-md text-[10px] font-mono text-slate-700 hover:text-blue-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                    >
                      {tv.category === 'color' && (
                        <svg
                          viewBox="0 0 10 10"
                          className="w-2.5 h-2.5 rounded-xs border border-slate-300 shrink-0"
                          aria-hidden="true"
                        >
                          <rect width="10" height="10" fill={tv.value} />
                        </svg>
                      )}
                      <span>{tv.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="divide-y divide-slate-200 border border-slate-200 rounded-lg bg-white overflow-hidden">
          {report.items.map((item) => {
            const isColor = item.category === 'color';
            const pickerValue = isHexColor(item.effectiveValue)
              ? item.effectiveValue
              : '#2563eb';
            const baselineLabel = item.inheritedValue
              ? `odziedziczone (${item.inheritedFromName}): ${item.inheritedValue}`
              : item.globalValue
                ? `globalne: ${item.globalValue}`
                : 'brak wartości globalnej';

            return (
              <div
                key={item.varName}
                data-testid={`theme-usage-item-${item.varName}`}
                className="p-2.5 space-y-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 space-y-0.5">
                    <div className="flex items-center gap-1.5 min-w-0">
                      {isColor && item.effectiveValue && (
                        <svg
                          viewBox="0 0 12 12"
                          className="w-3 h-3 rounded-xs border border-slate-300 shrink-0"
                          aria-hidden="true"
                        >
                          <rect width="12" height="12" fill={item.effectiveValue} />
                        </svg>
                      )}
                      <span
                        className="text-[11px] font-mono font-semibold text-slate-900 truncate"
                        title={item.varName}
                      >
                        {item.varName}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-500 flex items-center gap-1 flex-wrap">
                      <span>{item.channels.join(', ')}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono truncate max-w-[180px]" title={baselineLabel}>
                        {baselineLabel}
                      </span>
                    </div>
                    {item.matchedClasses.length > 0 && (
                      <div className="text-[10px] font-mono text-slate-400 truncate">
                        {item.matchedClasses.join(' ')}
                      </div>
                    )}
                  </div>

                  {item.isLocallyOverridden ? (
                    <button
                      type="button"
                      aria-label={`Resetuj lokalne nadpisanie ${item.varName}`}
                      onClick={() => onSetLocalOverride(item.varName, null)}
                      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold text-blue-700 bg-blue-50 hover:bg-red-50 hover:text-red-700 border border-blue-200 hover:border-red-200 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                    >
                      <RotateCcw className="w-2.5 h-2.5" />
                      Reset
                    </button>
                  ) : (
                    <button
                      type="button"
                      aria-label={`Nadpisz lokalnie ${item.varName}`}
                      onClick={() =>
                        onSetLocalOverride(
                          item.varName,
                          item.effectiveValue || (isColor ? '#e11d48' : '1.25rem')
                        )
                      }
                      className="px-2 py-0.5 rounded text-[10px] font-semibold text-slate-700 bg-slate-100 hover:bg-blue-50 hover:text-blue-700 border border-slate-200 hover:border-blue-300 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                    >
                      Nadpisz lokalnie
                    </button>
                  )}
                </div>

                {item.isLocallyOverridden && (
                  <div className="flex items-center gap-1.5 pt-1 border-t border-slate-100">
                    {isColor && (
                      <input
                        type="color"
                        aria-label={`Wybierz lokalny kolor ${item.varName}`}
                        value={pickerValue}
                        onChange={(e) =>
                          onSetLocalOverride(item.varName, e.target.value)
                        }
                        className="w-6 h-6 p-0.5 bg-white border border-slate-200 rounded cursor-pointer shrink-0"
                      />
                    )}
                    <input
                      type="text"
                      aria-label={`Lokalna wartość ${item.varName}`}
                      value={item.localOverride || ''}
                      onChange={(e) => {
                        const nextVal = e.target.value;
                        if (nextVal.trim()) {
                          onSetLocalOverride(item.varName, nextVal);
                        }
                      }}
                      placeholder={isColor ? '#e11d48' : '1.25rem'}
                      className="flex-1 min-w-0 px-2 py-1 bg-slate-50 border border-blue-300 rounded text-[11px] font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="text-[10px] font-medium text-blue-700 whitespace-nowrap shrink-0">
                      Lokalnie
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
