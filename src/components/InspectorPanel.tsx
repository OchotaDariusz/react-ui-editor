import { useState } from 'react';
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  Files,
  Plus,
  Trash2,
} from 'lucide-react';
import type {
  EditorNode,
  ThemeVarCategory,
  ThemeVariable,
} from '../types/editor';
import {
  ALIGN_ITEMS_CLASSES,
  BORDER_RADIUS_CLASSES,
  BOX_SHADOW_CLASSES,
  FLEX_DIRECTION_CLASSES,
  FONT_WEIGHT_CLASSES,
  JUSTIFY_CONTENT_CLASSES,
  TEXT_ALIGN_CLASSES,
  getTailwindGroupToken,
  getTailwindSpacingValue,
  getTailwindTextColor,
  normalizeCssVarName,
  setTailwindBgColor,
  setTailwindFlexDirection,
  setTailwindFontSize,
  setTailwindSpacingValue,
  setTailwindTextColor,
  toggleTailwindGroup,
  type SpacingPrefix,
} from '../utils/editorLogic';

interface InspectorPanelProps {
  selectedId: string;
  selectedNode: EditorNode | undefined;
  onUpdateNode: (key: string, value: string, isProp?: boolean) => void;
  onDuplicateNode: () => void;
  onDeleteNode: () => void;
  themeVars: ThemeVariable[];
  onAddThemeVar: (name: string, value: string, category: ThemeVarCategory) => void;
  onUpdateThemeVar: (id: string, value: string) => void;
  onDeleteThemeVar: (id: string) => void;
}

const LAYOUT_OPTIONS = [
  { label: 'Kolumna', cls: 'flex-col' },
  { label: 'Wiersz', cls: 'flex-row' },
  { label: 'Grid 2x', cls: 'grid-cols-2' },
] as const;

const GRID_COLUMN_OPTIONS = [
  { label: '1 kol.', cls: 'grid-cols-1' },
  { label: '2 kol.', cls: 'grid-cols-2' },
  { label: '3 kol.', cls: 'grid-cols-3' },
  { label: '4 kol.', cls: 'grid-cols-4' },
] as const;

const GRID_GAP_OPTIONS = [
  { label: 'gap-2', cls: 'gap-2' },
  { label: 'gap-4', cls: 'gap-4' },
  { label: 'gap-6', cls: 'gap-6' },
  { label: 'gap-8', cls: 'gap-8' },
] as const;

const PADDING_VALUES = ['0', '1', '2', '2.5', '3', '4', '5', '6', '8', '10', '12', '16'];
const MARGIN_VALUES = ['0', '1', '2', '3', '4', '5', '6', '8', '10', '12', '16', 'auto'];

const TEXT_ALIGN_OPTIONS = [
  { cls: 'text-left', label: 'Wyrównaj do lewej', icon: AlignLeft },
  { cls: 'text-center', label: 'Wyśrodkuj tekst', icon: AlignCenter },
  { cls: 'text-right', label: 'Wyrównaj do prawej', icon: AlignRight },
  { cls: 'text-justify', label: 'Wyjustuj tekst', icon: AlignJustify },
] as const;

const FONT_WEIGHT_OPTIONS = [
  { cls: 'font-light', label: 'Lekki (font-light)' },
  { cls: 'font-normal', label: 'Normalny (font-normal)' },
  { cls: 'font-medium', label: 'Średni (font-medium)' },
  { cls: 'font-semibold', label: 'Półgruby (font-semibold)' },
  { cls: 'font-bold', label: 'Pogrubiony (font-bold)' },
  { cls: 'font-extrabold', label: 'Bardzo gruby (font-extrabold)' },
] as const;

const TEXT_COLOR_SWATCHES = [
  { cls: 'text-slate-900', label: 'Ciemny łupkowy', swatchClass: 'bg-slate-900 border-slate-900' },
  { cls: 'text-slate-600', label: 'Szary średni', swatchClass: 'bg-slate-600 border-slate-600' },
  { cls: 'text-slate-400', label: 'Szary jasny', swatchClass: 'bg-slate-400 border-slate-400' },
  { cls: 'text-white', label: 'Biały', swatchClass: 'bg-white border-slate-300' },
  { cls: 'text-blue-600', label: 'Niebieski', swatchClass: 'bg-blue-600 border-blue-600' },
  { cls: 'text-emerald-600', label: 'Szmaragdowy', swatchClass: 'bg-emerald-600 border-emerald-600' },
  { cls: 'text-amber-600', label: 'Bursztynowy', swatchClass: 'bg-amber-600 border-amber-600' },
  { cls: 'text-red-600', label: 'Czerwony', swatchClass: 'bg-red-600 border-red-600' },
] as const;

const SHADOW_PRESETS = [
  { cls: 'shadow-sm', label: 'shadow-sm' },
  { cls: 'shadow', label: 'shadow' },
  { cls: 'shadow-md', label: 'shadow-md' },
  { cls: 'shadow-lg', label: 'shadow-lg' },
  { cls: 'shadow-xl', label: 'shadow-xl' },
  { cls: 'shadow-2xl', label: 'shadow-2xl' },
] as const;

const RADIUS_PRESETS = [
  { cls: 'rounded-sm', label: 'rounded-sm' },
  { cls: 'rounded-md', label: 'rounded-md' },
  { cls: 'rounded-lg', label: 'rounded-lg' },
  { cls: 'rounded-xl', label: 'rounded-xl' },
  { cls: 'rounded-2xl', label: 'rounded-2xl' },
  { cls: 'rounded-full', label: 'rounded-full' },
] as const;

const FLEX_DIRECTION_OPTIONS = [
  { cls: 'flex-row', label: 'row', title: 'Poziomo (flex-row)' },
  { cls: 'flex-col', label: 'col', title: 'Pionowo (flex-col)' },
  { cls: 'flex-row-reverse', label: 'row-rev', title: 'Poziomo odwrócone (flex-row-reverse)' },
  { cls: 'flex-col-reverse', label: 'col-rev', title: 'Pionowo odwrócone (flex-col-reverse)' },
] as const;

const JUSTIFY_CONTENT_OPTIONS = [
  { cls: 'justify-start', label: 'Start (justify-start)' },
  { cls: 'justify-center', label: 'Center (justify-center)' },
  { cls: 'justify-end', label: 'End (justify-end)' },
  { cls: 'justify-between', label: 'Between (justify-between)' },
  { cls: 'justify-around', label: 'Around (justify-around)' },
  { cls: 'justify-evenly', label: 'Evenly (justify-evenly)' },
] as const;

const ALIGN_ITEMS_OPTIONS = [
  { cls: 'items-start', label: 'Start (items-start)' },
  { cls: 'items-center', label: 'Center (items-center)' },
  { cls: 'items-end', label: 'End (items-end)' },
  { cls: 'items-stretch', label: 'Stretch (items-stretch)' },
  { cls: 'items-baseline', label: 'Baseline (items-baseline)' },
] as const;

export function InspectorPanel({
  selectedId,
  selectedNode,
  onUpdateNode,
  onDuplicateNode,
  onDeleteNode,
  themeVars,
  onAddThemeVar,
  onUpdateThemeVar,
  onDeleteThemeVar,
}: InspectorPanelProps) {
  const [showIndividualSides, setShowIndividualSides] = useState(false);
  const [showAddVar, setShowAddVar] = useState(false);
  const [newVarName, setNewVarName] = useState('');
  const [newVarCategory, setNewVarCategory] =
    useState<ThemeVarCategory>('color');
  const [newVarValue, setNewVarValue] = useState('#7c3aed');

  const classNameValue = selectedNode?.props.className || '';
  const classTokens = classNameValue.split(/\s+/).filter(Boolean);

  const hasSideTokens = (
    ['pt', 'pr', 'pb', 'pl', 'mt', 'mr', 'mb', 'ml'] as SpacingPrefix[]
  ).some((prefix) => Boolean(getTailwindSpacingValue(classNameValue, prefix)));

  const sidesVisible = showIndividualSides || hasSideTokens;

  const handleSpacingChange = (prefix: SpacingPrefix, value: string) => {
    const updated = setTailwindSpacingValue(classNameValue, prefix, value);
    onUpdateNode('className', updated, true);
  };

  const activeTextAlign = getTailwindGroupToken(
    classNameValue,
    TEXT_ALIGN_CLASSES
  );
  const activeFontWeight = getTailwindGroupToken(
    classNameValue,
    FONT_WEIGHT_CLASSES
  );
  const activeTextColor = getTailwindTextColor(classNameValue);

  const activeShadow = getTailwindGroupToken(classNameValue, BOX_SHADOW_CLASSES);
  const hasShadow = Boolean(activeShadow && activeShadow !== 'shadow-none');

  const activeRadius = getTailwindGroupToken(
    classNameValue,
    BORDER_RADIUS_CLASSES
  );
  const hasRadius = Boolean(activeRadius && activeRadius !== 'rounded-none');

  const activeFlexDirection = getTailwindGroupToken(
    classNameValue,
    FLEX_DIRECTION_CLASSES
  );
  const activeJustifyContent = getTailwindGroupToken(
    classNameValue,
    JUSTIFY_CONTENT_CLASSES
  );
  const activeAlignItems = getTailwindGroupToken(
    classNameValue,
    ALIGN_ITEMS_CLASSES
  );

  return (
    <aside className="w-80 bg-white border-l border-slate-200 flex flex-col shrink-0 z-20">
      <div className="h-14 px-4 border-b border-slate-200 flex items-center justify-between shrink-0">
        <h2 className="font-bold text-sm text-slate-900">Inspektor</h2>
        {selectedNode && (
          <span className="text-xs text-slate-500 font-mono">
            {selectedNode.type}
          </span>
        )}
      </div>

      {selectedNode ? (
        <div className="p-4 flex-1 overflow-y-auto flex flex-col gap-5">
          <div className="space-y-1.5">
            <label
              htmlFor="inspector-layer-name"
              className="block text-[11px] font-bold text-slate-500 tracking-wide"
            >
              Nazwa warstwy
            </label>
            <input
              id="inspector-layer-name"
              type="text"
              placeholder="np. Submit Button"
              value={selectedNode.name || ''}
              onChange={(e) => onUpdateNode('name', e.target.value)}
              className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
            />
          </div>

          {selectedId !== 'root' && (
            <button
              type="button"
              title="Duplikuj (Ctrl+Alt+D)"
              onClick={onDuplicateNode}
              className="w-full flex items-center justify-center gap-1.5 py-1.5 bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 rounded-lg text-xs font-medium text-slate-700 hover:text-blue-700 whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              <Files className="w-3.5 h-3.5" /> Kopiuj
            </button>
          )}

          {selectedNode.type === 'Container' && (
            <div className="space-y-2 p-3 bg-slate-50 rounded-xl border border-slate-200/80">
              <span className="block text-[11px] font-bold text-slate-500 tracking-wide">
                Układ (Flex / Grid)
              </span>
              <div className="grid grid-cols-3 gap-1.5">
                {LAYOUT_OPTIONS.map((opt) => {
                  const isGrid = opt.cls.startsWith('grid');
                  const isActive = classTokens.includes(opt.cls);
                  return (
                    <button
                      key={opt.cls}
                      type="button"
                      aria-pressed={isActive}
                      onClick={() => {
                        const updated = toggleTailwindGroup(
                          selectedNode.props.className,
                          [
                            'flex',
                            'grid',
                            'flex-col',
                            'flex-row',
                            'grid-cols-2',
                          ],
                          isGrid ? `grid ${opt.cls}` : `flex ${opt.cls}`
                        );
                        onUpdateNode('className', updated, true);
                      }}
                      className={`py-1.5 px-2 border rounded-md text-[11px] font-medium transition-colors whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                        isActive
                          ? 'bg-blue-50 border-blue-300 text-blue-700 font-semibold'
                          : 'bg-white hover:bg-blue-50 border-slate-200 hover:border-blue-300 text-slate-700'
                      }`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {selectedNode.type === 'Container' && (
            <section
              aria-label="Flexbox"
              className="space-y-3 p-3 bg-slate-50 rounded-xl border border-slate-200/80"
            >
              <h3 className="text-[11px] font-bold text-slate-500 tracking-wide">
                Flexbox
              </h3>

              <div className="space-y-1.5">
                <span className="block text-[11px] font-semibold text-slate-600">
                  Flex Direction
                </span>
                <div className="grid grid-cols-4 gap-1.5">
                  {FLEX_DIRECTION_OPTIONS.map((opt) => {
                    const isActive = activeFlexDirection === opt.cls;
                    return (
                      <button
                        key={opt.cls}
                        type="button"
                        title={opt.title}
                        aria-label={`Flex direction ${opt.cls}`}
                        aria-pressed={isActive}
                        onClick={() => {
                          const updated = setTailwindFlexDirection(
                            classNameValue,
                            opt.cls
                          );
                          onUpdateNode('className', updated, true);
                        }}
                        className={`py-1.5 px-1 border rounded-md text-[10px] font-mono transition-colors whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                          isActive
                            ? 'bg-blue-50 border-blue-300 text-blue-700 font-semibold'
                            : 'bg-white hover:bg-blue-50 border-slate-200 hover:border-blue-300 text-slate-600'
                        }`}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-2">
                <label className="block space-y-1">
                  <span className="block text-[10px] font-semibold text-slate-600">
                    Justify Content
                  </span>
                  <select
                    aria-label="Justify content"
                    value={activeJustifyContent}
                    onChange={(e) => {
                      const updated = toggleTailwindGroup(
                        classNameValue,
                        [...JUSTIFY_CONTENT_CLASSES],
                        e.target.value
                      );
                      onUpdateNode('className', updated, true);
                    }}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-md text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Domyślne</option>
                    {JUSTIFY_CONTENT_OPTIONS.map((opt) => (
                      <option key={opt.cls} value={opt.cls}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block space-y-1">
                  <span className="block text-[10px] font-semibold text-slate-600">
                    Align Items
                  </span>
                  <select
                    aria-label="Align items"
                    value={activeAlignItems}
                    onChange={(e) => {
                      const updated = toggleTailwindGroup(
                        classNameValue,
                        [...ALIGN_ITEMS_CLASSES],
                        e.target.value
                      );
                      onUpdateNode('className', updated, true);
                    }}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-md text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Domyślne</option>
                    {ALIGN_ITEMS_OPTIONS.map((opt) => (
                      <option key={opt.cls} value={opt.cls}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </section>
          )}

          {selectedNode.type === 'Grid' && (
            <div className="space-y-2.5 p-3 bg-slate-50 rounded-xl border border-slate-200/80">
              <span className="block text-[11px] font-bold text-slate-500 tracking-wide">
                Kolumny Grid
              </span>
              <div className="grid grid-cols-4 gap-1.5">
                {GRID_COLUMN_OPTIONS.map((opt) => {
                  const isActive = classTokens.includes(opt.cls);
                  return (
                    <button
                      key={opt.cls}
                      type="button"
                      aria-pressed={isActive}
                      onClick={() => {
                        const updated = toggleTailwindGroup(
                          selectedNode.props.className,
                          [
                            'flex',
                            'grid',
                            'grid-cols-1',
                            'grid-cols-2',
                            'grid-cols-3',
                            'grid-cols-4',
                          ],
                          `grid ${opt.cls}`
                        );
                        onUpdateNode('className', updated, true);
                      }}
                      className={`py-1.5 px-1.5 border rounded-md text-[11px] font-medium transition-colors whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                        isActive
                          ? 'bg-blue-50 border-blue-300 text-blue-700 font-semibold'
                          : 'bg-white hover:bg-blue-50 border-slate-200 hover:border-blue-300 text-slate-700'
                      }`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>

              <div className="grid grid-cols-4 gap-1.5 pt-1">
                {GRID_GAP_OPTIONS.map((opt) => {
                  const isActive = classTokens.includes(opt.cls);
                  return (
                    <button
                      key={opt.cls}
                      type="button"
                      aria-pressed={isActive}
                      onClick={() => {
                        const updated = toggleTailwindGroup(
                          selectedNode.props.className,
                          ['gap-1', 'gap-2', 'gap-3', 'gap-4', 'gap-6', 'gap-8'],
                          opt.cls
                        );
                        onUpdateNode('className', updated, true);
                      }}
                      className={`py-1 px-1.5 border rounded-md text-[10px] font-mono transition-colors whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                        isActive
                          ? 'bg-blue-50 border-blue-300 text-blue-700 font-semibold'
                          : 'bg-white hover:bg-blue-50 border-slate-200 hover:border-blue-300 text-slate-600'
                      }`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <section
            aria-label="Layout"
            className="space-y-3 p-3 bg-slate-50 rounded-xl border border-slate-200/80"
          >
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-[11px] font-bold text-slate-500 tracking-wide">
                Layout
              </h3>
              <button
                type="button"
                aria-expanded={sidesVisible}
                onClick={() => setShowIndividualSides((prev) => !prev)}
                className="text-[11px] font-medium text-blue-600 hover:text-blue-700 whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded px-1"
              >
                {sidesVisible ? 'Ukryj strony' : 'Strony (T/R/B/L)'}
              </button>
            </div>

            <div className="space-y-1.5">
              <span className="block text-[11px] font-semibold text-slate-600">
                Padding
              </span>
              <div className="grid grid-cols-3 gap-1.5">
                {(
                  [
                    { prefix: 'p', label: 'All (p-)' },
                    { prefix: 'px', label: 'X (px-)' },
                    { prefix: 'py', label: 'Y (py-)' },
                  ] as const
                ).map(({ prefix, label }) => (
                  <label key={prefix} className="block space-y-1">
                    <span className="block text-[10px] text-slate-500 font-mono">
                      {label}
                    </span>
                    <select
                      aria-label={`Padding ${label}`}
                      value={getTailwindSpacingValue(classNameValue, prefix)}
                      onChange={(e) =>
                        handleSpacingChange(prefix, e.target.value)
                      }
                      className="w-full px-2 py-1 bg-white border border-slate-200 rounded-md text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">—</option>
                      {PADDING_VALUES.map((val) => (
                        <option key={val} value={val}>
                          {prefix}-{val}
                        </option>
                      ))}
                    </select>
                  </label>
                ))}
              </div>

              {sidesVisible && (
                <div className="grid grid-cols-4 gap-1.5 pt-1">
                  {(
                    [
                      { prefix: 'pt', label: 'pt-' },
                      { prefix: 'pr', label: 'pr-' },
                      { prefix: 'pb', label: 'pb-' },
                      { prefix: 'pl', label: 'pl-' },
                    ] as const
                  ).map(({ prefix, label }) => (
                    <label key={prefix} className="block space-y-1">
                      <span className="block text-[10px] text-slate-500 font-mono">
                        {label}
                      </span>
                      <select
                        aria-label={`Padding ${label}`}
                        value={getTailwindSpacingValue(classNameValue, prefix)}
                        onChange={(e) =>
                          handleSpacingChange(prefix, e.target.value)
                        }
                        className="w-full px-1.5 py-1 bg-white border border-slate-200 rounded-md text-[11px] font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">—</option>
                        {PADDING_VALUES.map((val) => (
                          <option key={val} value={val}>
                            {val}
                          </option>
                        ))}
                      </select>
                    </label>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-1.5 pt-2 border-t border-slate-200/70">
              <span className="block text-[11px] font-semibold text-slate-600">
                Margin
              </span>
              <div className="grid grid-cols-3 gap-1.5">
                {(
                  [
                    { prefix: 'm', label: 'All (m-)' },
                    { prefix: 'mx', label: 'X (mx-)' },
                    { prefix: 'my', label: 'Y (my-)' },
                  ] as const
                ).map(({ prefix, label }) => (
                  <label key={prefix} className="block space-y-1">
                    <span className="block text-[10px] text-slate-500 font-mono">
                      {label}
                    </span>
                    <select
                      aria-label={`Margin ${label}`}
                      value={getTailwindSpacingValue(classNameValue, prefix)}
                      onChange={(e) =>
                        handleSpacingChange(prefix, e.target.value)
                      }
                      className="w-full px-2 py-1 bg-white border border-slate-200 rounded-md text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">—</option>
                      {MARGIN_VALUES.map((val) => (
                        <option key={val} value={val}>
                          {prefix}-{val}
                        </option>
                      ))}
                    </select>
                  </label>
                ))}
              </div>

              {sidesVisible && (
                <div className="grid grid-cols-4 gap-1.5 pt-1">
                  {(
                    [
                      { prefix: 'mt', label: 'mt-' },
                      { prefix: 'mr', label: 'mr-' },
                      { prefix: 'mb', label: 'mb-' },
                      { prefix: 'ml', label: 'ml-' },
                    ] as const
                  ).map(({ prefix, label }) => (
                    <label key={prefix} className="block space-y-1">
                      <span className="block text-[10px] text-slate-500 font-mono">
                        {label}
                      </span>
                      <select
                        aria-label={`Margin ${label}`}
                        value={getTailwindSpacingValue(classNameValue, prefix)}
                        onChange={(e) =>
                          handleSpacingChange(prefix, e.target.value)
                        }
                        className="w-full px-1.5 py-1 bg-white border border-slate-200 rounded-md text-[11px] font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">—</option>
                        {MARGIN_VALUES.map((val) => (
                          <option key={val} value={val}>
                            {val}
                          </option>
                        ))}
                      </select>
                    </label>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-1.5 pt-2 border-t border-slate-200/70">
              <label
                htmlFor="inspector-layout-custom-classes"
                className="block text-[11px] font-semibold text-slate-600"
              >
                Custom Classes
              </label>
              <input
                id="inspector-layout-custom-classes"
                type="text"
                value={classNameValue}
                onChange={(e) => onUpdateNode('className', e.target.value, true)}
                placeholder="np. max-w-md mx-auto bg-indigo-50"
                className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-md text-xs font-mono text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </section>

          {selectedNode.type !== 'Image' && (
            <section
              aria-label="Typography"
              className="space-y-3 p-3 bg-slate-50 rounded-xl border border-slate-200/80"
            >
              <h3 className="text-[11px] font-bold text-slate-500 tracking-wide">
                Typography
              </h3>

              <div className="space-y-1.5">
                <span className="block text-[11px] font-semibold text-slate-600">
                  Wyrównanie tekstu
                </span>
                <div className="grid grid-cols-4 gap-1.5">
                  {TEXT_ALIGN_OPTIONS.map(({ cls, label, icon: Icon }) => {
                    const isActive = activeTextAlign === cls;
                    return (
                      <button
                        key={cls}
                        type="button"
                        title={label}
                        aria-label={label}
                        aria-pressed={isActive}
                        onClick={() => {
                          const updated = toggleTailwindGroup(
                            classNameValue,
                            [...TEXT_ALIGN_CLASSES],
                            isActive ? '' : cls
                          );
                          onUpdateNode('className', updated, true);
                        }}
                        className={`flex items-center justify-center py-1.5 border rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                          isActive
                            ? 'bg-blue-50 border-blue-300 text-blue-700'
                            : 'bg-white hover:bg-blue-50 border-slate-200 hover:border-blue-300 text-slate-600'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                      </button>
                    );
                  })}
                </div>
              </div>

              <label className="block space-y-1">
                <span className="block text-[11px] font-semibold text-slate-600">
                  Grubość fontu
                </span>
                <select
                  aria-label="Font weight"
                  value={activeFontWeight}
                  onChange={(e) => {
                    const updated = toggleTailwindGroup(
                      classNameValue,
                      [...FONT_WEIGHT_CLASSES],
                      e.target.value
                    );
                    onUpdateNode('className', updated, true);
                  }}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-md text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Domyślna</option>
                  {FONT_WEIGHT_OPTIONS.map((opt) => (
                    <option key={opt.cls} value={opt.cls}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </label>

              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-semibold text-slate-600">
                    Kolor tekstu
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-mono text-slate-500">
                      {activeTextColor || 'domyślny'}
                    </span>
                    {activeTextColor && (
                      <button
                        type="button"
                        onClick={() =>
                          onUpdateNode(
                            'className',
                            setTailwindTextColor(classNameValue, ''),
                            true
                          )
                        }
                        className="text-[10px] font-medium text-blue-600 hover:text-blue-700 whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded px-0.5"
                      >
                        Reset
                      </button>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-8 gap-1.5">
                  {TEXT_COLOR_SWATCHES.map(({ cls, label, swatchClass }) => {
                    const isActive = activeTextColor === cls;
                    return (
                      <button
                        key={cls}
                        type="button"
                        title={`${label} (${cls})`}
                        aria-label={`Kolor tekstu ${label}`}
                        aria-pressed={isActive}
                        onClick={() => {
                          const updated = setTailwindTextColor(
                            classNameValue,
                            isActive ? '' : cls
                          );
                          onUpdateNode('className', updated, true);
                        }}
                        className={`w-6 h-6 rounded-md border transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${swatchClass} ${
                          isActive
                            ? 'ring-2 ring-blue-500 ring-offset-1 scale-105'
                            : 'hover:scale-105'
                        }`}
                      />
                    );
                  })}
                </div>
              </div>
            </section>
          )}

          <section
            aria-label="Effects"
            className="space-y-3 p-3 bg-slate-50 rounded-xl border border-slate-200/80"
          >
            <h3 className="text-[11px] font-bold text-slate-500 tracking-wide">
              Effects
            </h3>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-semibold text-slate-600">
                  Cień (box-shadow)
                </span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={hasShadow}
                  aria-label="Przełącz cień"
                  onClick={() => {
                    const updated = toggleTailwindGroup(
                      classNameValue,
                      [...BOX_SHADOW_CLASSES],
                      hasShadow ? '' : 'shadow-md'
                    );
                    onUpdateNode('className', updated, true);
                  }}
                  className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border text-[10px] font-semibold transition-colors whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                    hasShadow
                      ? 'bg-blue-50 border-blue-300 text-blue-700'
                      : 'bg-white border-slate-200 text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <span
                    aria-hidden="true"
                    className={`w-2 h-2 rounded-full ${
                      hasShadow ? 'bg-blue-600' : 'bg-slate-300'
                    }`}
                  />
                  {hasShadow ? 'Wł.' : 'Wył.'}
                </button>
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                {SHADOW_PRESETS.map((opt) => {
                  const isActive = activeShadow === opt.cls;
                  return (
                    <button
                      key={opt.cls}
                      type="button"
                      aria-pressed={isActive}
                      onClick={() => {
                        const updated = toggleTailwindGroup(
                          classNameValue,
                          [...BOX_SHADOW_CLASSES],
                          isActive ? '' : opt.cls
                        );
                        onUpdateNode('className', updated, true);
                      }}
                      className={`py-1 px-1.5 border rounded-md text-[10px] font-mono transition-colors whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                        isActive
                          ? 'bg-blue-50 border-blue-300 text-blue-700 font-semibold'
                          : 'bg-white hover:bg-blue-50 border-slate-200 hover:border-blue-300 text-slate-600'
                      }`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-1.5 pt-2 border-t border-slate-200/70">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-semibold text-slate-600">
                  Zaokrąglenie (border-radius)
                </span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={hasRadius}
                  aria-label="Przełącz zaokrąglenie"
                  onClick={() => {
                    const updated = toggleTailwindGroup(
                      classNameValue,
                      [...BORDER_RADIUS_CLASSES],
                      hasRadius ? '' : 'rounded-lg'
                    );
                    onUpdateNode('className', updated, true);
                  }}
                  className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border text-[10px] font-semibold transition-colors whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                    hasRadius
                      ? 'bg-blue-50 border-blue-300 text-blue-700'
                      : 'bg-white border-slate-200 text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <span
                    aria-hidden="true"
                    className={`w-2 h-2 rounded-full ${
                      hasRadius ? 'bg-blue-600' : 'bg-slate-300'
                    }`}
                  />
                  {hasRadius ? 'Wł.' : 'Wył.'}
                </button>
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                {RADIUS_PRESETS.map((opt) => {
                  const isActive = activeRadius === opt.cls;
                  return (
                    <button
                      key={opt.cls}
                      type="button"
                      aria-pressed={isActive}
                      onClick={() => {
                        const updated = toggleTailwindGroup(
                          classNameValue,
                          [...BORDER_RADIUS_CLASSES],
                          isActive ? '' : opt.cls
                        );
                        onUpdateNode('className', updated, true);
                      }}
                      className={`py-1 px-1.5 border rounded-md text-[10px] font-mono transition-colors whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                        isActive
                          ? 'bg-blue-50 border-blue-300 text-blue-700 font-semibold'
                          : 'bg-white hover:bg-blue-50 border-slate-200 hover:border-blue-300 text-slate-600'
                      }`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </section>

          <section
            aria-label="Theme"
            className="space-y-3 p-3 bg-slate-50 rounded-xl border border-slate-200/80"
          >
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-[11px] font-bold text-slate-500 tracking-wide">
                Theme
              </h3>
              <button
                type="button"
                onClick={() => setShowAddVar((prev) => !prev)}
                className="inline-flex items-center gap-1 text-[11px] font-medium text-blue-600 hover:text-blue-700 whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded px-1"
              >
                <Plus className="w-3 h-3" />
                {showAddVar ? 'Anuluj' : 'Dodaj zmienną'}
              </button>
            </div>

            {showAddVar && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const normalized = normalizeCssVarName(newVarName);
                  if (!normalized || !newVarValue.trim()) return;
                  onAddThemeVar(normalized, newVarValue.trim(), newVarCategory);
                  setNewVarName('');
                  setNewVarValue(newVarCategory === 'color' ? '#7c3aed' : '1.25rem');
                  setShowAddVar(false);
                }}
                className="p-2.5 bg-white border border-slate-200 rounded-lg space-y-2"
              >
                <input
                  type="text"
                  aria-label="Nazwa zmiennej CSS"
                  placeholder="np. --color-accent"
                  value={newVarName}
                  onChange={(e) => setNewVarName(e.target.value)}
                  className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <div className="grid grid-cols-2 gap-1.5">
                  <select
                    aria-label="Kategoria zmiennej"
                    value={newVarCategory}
                    onChange={(e) => {
                      const nextCat = e.target.value as ThemeVarCategory;
                      setNewVarCategory(nextCat);
                      setNewVarValue(nextCat === 'color' ? '#7c3aed' : '1.25rem');
                    }}
                    className="px-2 py-1 bg-slate-50 border border-slate-200 rounded text-[11px] text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="color">Kolor</option>
                    <option value="fontSize">Rozmiar fontu</option>
                  </select>
                  <input
                    type="text"
                    aria-label="Wartość zmiennej CSS"
                    placeholder={
                      newVarCategory === 'color' ? '#7c3aed' : '1.25rem'
                    }
                    value={newVarValue}
                    onChange={(e) => setNewVarValue(e.target.value)}
                    className="px-2 py-1 bg-slate-50 border border-slate-200 rounded text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-md transition-colors whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                >
                  Zapisz zmienną
                </button>
              </form>
            )}

            <div className="space-y-2">
              {themeVars.map((item) => {
                const isColor = item.category === 'color';
                const textVarClass = `text-[var(${item.name})]`;
                const bgVarClass = `bg-[var(${item.name})]`;
                const sizeVarClass = `text-[length:var(${item.name})]`;

                const isTextApplied = classTokens.includes(textVarClass);
                const isBgApplied = classTokens.includes(bgVarClass);
                const isSizeApplied = classTokens.includes(sizeVarClass);

                return (
                  <div
                    key={item.id}
                    className="p-2 bg-white border border-slate-200/90 rounded-lg space-y-1.5"
                  >
                    <div className="flex items-center justify-between gap-1.5">
                      <span
                        className="text-[10px] font-mono font-semibold text-slate-700 truncate"
                        title={item.name}
                      >
                        {item.name}
                      </span>
                      <button
                        type="button"
                        aria-label={`Usuń ${item.name}`}
                        onClick={() => onDeleteThemeVar(item.id)}
                        className="p-0.5 text-slate-400 hover:text-red-600 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 shrink-0"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {isColor && (
                        <input
                          type="color"
                          aria-label={`Wybierz kolor ${item.name}`}
                          value={
                            /^#[0-9a-fA-F]{6}$/.test(item.value)
                              ? item.value
                              : '#2563eb'
                          }
                          onChange={(e) =>
                            onUpdateThemeVar(item.id, e.target.value)
                          }
                          className="w-6 h-6 p-0.5 bg-white border border-slate-200 rounded cursor-pointer shrink-0"
                        />
                      )}
                      <input
                        type="text"
                        aria-label={`Wartość ${item.name}`}
                        value={item.value}
                        onChange={(e) =>
                          onUpdateThemeVar(item.id, e.target.value)
                        }
                        className="flex-1 min-w-0 px-2 py-1 bg-slate-50 border border-slate-200 rounded text-[11px] font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      {isColor ? (
                        <>
                          <button
                            type="button"
                            title={`Zastosuj ${textVarClass}`}
                            aria-label={`Zastosuj kolor tekstu ${item.name}`}
                            aria-pressed={isTextApplied}
                            onClick={() =>
                              onUpdateNode(
                                'className',
                                setTailwindTextColor(
                                  classNameValue,
                                  isTextApplied ? '' : textVarClass
                                ),
                                true
                              )
                            }
                            className={`px-1.5 py-1 border rounded text-[10px] font-medium whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                              isTextApplied
                                ? 'bg-blue-50 border-blue-300 text-blue-700 font-semibold'
                                : 'bg-slate-50 hover:bg-blue-50 border-slate-200 text-slate-600'
                            }`}
                          >
                            Text
                          </button>
                          <button
                            type="button"
                            title={`Zastosuj ${bgVarClass}`}
                            aria-label={`Zastosuj tło ${item.name}`}
                            aria-pressed={isBgApplied}
                            onClick={() =>
                              onUpdateNode(
                                'className',
                                setTailwindBgColor(
                                  classNameValue,
                                  isBgApplied ? '' : bgVarClass
                                ),
                                true
                              )
                            }
                            className={`px-1.5 py-1 border rounded text-[10px] font-medium whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                              isBgApplied
                                ? 'bg-blue-50 border-blue-300 text-blue-700 font-semibold'
                                : 'bg-slate-50 hover:bg-blue-50 border-slate-200 text-slate-600'
                            }`}
                          >
                            Bg
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          title={`Zastosuj ${sizeVarClass}`}
                          aria-label={`Zastosuj rozmiar ${item.name}`}
                          aria-pressed={isSizeApplied}
                          onClick={() =>
                            onUpdateNode(
                              'className',
                              setTailwindFontSize(
                                classNameValue,
                                isSizeApplied ? '' : sizeVarClass
                              ),
                              true
                            )
                          }
                          className={`px-2 py-1 border rounded text-[10px] font-medium whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                            isSizeApplied
                              ? 'bg-blue-50 border-blue-300 text-blue-700 font-semibold'
                              : 'bg-slate-50 hover:bg-blue-50 border-slate-200 text-slate-600'
                          }`}
                        >
                          Size
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {['Heading', 'Text', 'Button', 'Badge'].includes(
            selectedNode.type
          ) && (
            <div className="space-y-1.5">
              <label
                htmlFor="inspector-node-content"
                className="block text-[11px] font-bold text-slate-500 tracking-wide"
              >
                Treść
              </label>
              <textarea
                id="inspector-node-content"
                rows={2}
                value={selectedNode.content || ''}
                onChange={(e) => onUpdateNode('content', e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white resize-none"
              />
            </div>
          )}

          {selectedNode.type === 'Input' && (
            <div className="space-y-1.5">
              <label
                htmlFor="inspector-node-placeholder"
                className="block text-[11px] font-bold text-slate-500 tracking-wide"
              >
                Placeholder
              </label>
              <input
                id="inspector-node-placeholder"
                type="text"
                value={selectedNode.props.placeholder || ''}
                onChange={(e) =>
                  onUpdateNode('placeholder', e.target.value, true)
                }
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
              />
            </div>
          )}

          {selectedNode.type === 'Image' && (
            <div className="space-y-1.5">
              <label
                htmlFor="inspector-node-src"
                className="block text-[11px] font-bold text-slate-500 tracking-wide"
              >
                Adres URL obrazu
              </label>
              <input
                id="inspector-node-src"
                type="text"
                value={selectedNode.props.src || ''}
                onChange={(e) => onUpdateNode('src', e.target.value, true)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
              />
            </div>
          )}

          <div className="space-y-1.5">
            <label
              htmlFor="inspector-node-classname"
              className="block text-[11px] font-bold text-slate-500 tracking-wide"
            >
              Klasy Tailwind CSS
            </label>
            <textarea
              id="inspector-node-classname"
              value={selectedNode.props.className || ''}
              onChange={(e) => onUpdateNode('className', e.target.value, true)}
              className="w-full h-28 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 font-mono leading-relaxed focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white resize-none"
              placeholder="np. p-4 bg-white rounded-xl shadow-sm..."
            />
          </div>

          {selectedId !== 'root' && (
            <div className="pt-4 border-t border-slate-100 mt-auto">
              <button
                type="button"
                title="Usuń element (Delete)"
                onClick={onDeleteNode}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Usuń element
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="p-6 text-center text-slate-500 text-xs mt-10">
          Zaznacz element na płótnie lub w drzewie warstw.
        </div>
      )}
    </aside>
  );
}
