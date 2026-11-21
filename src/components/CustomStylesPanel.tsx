import { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  Boxes,
  Check,
  CheckCircle2,
  Copy,
  Eye,
  FileCode2,
  Info,
  Layers,
  Palette,
  Plus,
  Search,
  Sparkles,
  Wand2,
} from 'lucide-react';
import type {
  BootstrapVersion,
  EditorNode,
  MaterialNodeMeta,
  NodeBlueprint,
  NodesMap,
  SeoMetadata,
  TailwindVersion,
  ThemeVariable,
} from '../types/editor';
import {
  buildClassExplorerCatalog,
  discoverPageStylesheets,
  filterClassExplorerItems,
  getClassAutocompleteSuggestions,
  getDeclarationAutocompleteSuggestions,
  tokenizeCssForHighlight,
  validateRawCssAgainstTailwind,
  type CssTokenSpan,
} from '../utils/cssEditor';
import {
  buildBootstrapPlainHtmlDocument,
  getBootstrapAssets,
  getBootstrapClassesForVersion,
  getBootstrapComponentsForVersion,
  type BootstrapClassCategory,
  type BootstrapComponentCategory,
} from '../utils/bootstrapSupport';
import {
  buildConditionalPlainHtmlDocument,
  filterMaterialComponents,
  filterMaterialStyleEntries,
  generateMuiReactJsxExport,
  type MaterialLibrarySource,
  type MaterialStyleEntry,
} from '../utils/materialSupport';
import { MaterialMuiNodeView } from './MaterialNodeRenderer';

interface CustomStylesPanelProps {
  selectedId: string;
  selectedNode: EditorNode | undefined;
  isMultiSelect: boolean;
  nodes: NodesMap;
  themeVars: ThemeVariable[];
  seoMetadata?: SeoMetadata;
  tailwindVersion: TailwindVersion;
  onChangeTailwindVersion: (version: TailwindVersion) => void;
  bootstrapVersion: BootstrapVersion;
  onChangeBootstrapVersion: (version: BootstrapVersion) => void;
  enableMd2: boolean;
  onToggleEnableMd2: (enabled: boolean) => void;
  enableMd3: boolean;
  onToggleEnableMd3: (enabled: boolean) => void;
  sharedThemeCss: string;
  onChangeSharedThemeCss: (nextCss: string) => void;
  onUpdateNodeClass: (nextClassName: string) => void;
  onUpdateNodeCustomCss: (nodeId: string, nextCss: string) => void;
  onUpdateNodeMaterialMeta: (
    nodeId: string,
    updater: (curr: MaterialNodeMeta) => MaterialNodeMeta
  ) => void;
  onUpdateThemeVar: (id: string, value: string) => void;
  onInsertBlueprint: (blueprint: NodeBlueprint, label: string) => void;
}

type CustomStylesSubTab = 'editor' | 'explorer' | 'bootstrap' | 'material';

function getTokenSpanClass(kind: CssTokenSpan['kind']): string {
  switch (kind) {
    case 'comment':
      return 'text-slate-500 italic';
    case 'property':
      return 'text-sky-300';
    case 'var':
      return 'text-amber-300';
    case 'color':
      return 'text-pink-300';
    case 'number':
      return 'text-emerald-300';
    case 'selector':
      return 'text-violet-300';
    case 'punctuation':
      return 'text-slate-400';
    default:
      return 'text-slate-100';
  }
}

export function CustomStylesPanel({
  selectedId,
  selectedNode,
  isMultiSelect,
  nodes,
  themeVars,
  seoMetadata,
  tailwindVersion,
  onChangeTailwindVersion,
  bootstrapVersion,
  onChangeBootstrapVersion,
  enableMd2,
  onToggleEnableMd2,
  enableMd3,
  onToggleEnableMd3,
  sharedThemeCss,
  onChangeSharedThemeCss,
  onUpdateNodeClass,
  onUpdateNodeCustomCss,
  onUpdateNodeMaterialMeta,
  onUpdateThemeVar,
  onInsertBlueprint,
}: CustomStylesPanelProps) {
  const [subTab, setSubTab] = useState<CustomStylesSubTab>('editor');
  const [classDraft, setClassDraft] = useState(
    selectedNode?.props.className || ''
  );
  const [classInputFocused, setClassInputFocused] = useState(false);
  const [cssInputFocused, setCssInputFocused] = useState(false);

  // Unified Style Explorer filters
  const [explorerQuery, setExplorerQuery] = useState('');
  const [explorerFilter, setExplorerFilter] = useState<
    'all' | 'tailwind' | 'ui' | 'bootstrap' | 'material'
  >('all');
  const [bsClassCategory, setBsClassCategory] = useState<
    BootstrapClassCategory | 'All'
  >('All');

  // Bootstrap component picker state
  const [bsCompCategory, setBsCompCategory] = useState<
    BootstrapComponentCategory | 'All'
  >('All');
  const [previewBsId, setPreviewBsId] = useState<string | null>(null);

  // Material component picker state
  const [materialSourceFilter, setMaterialSourceFilter] = useState<
    'all' | MaterialLibrarySource
  >('all');
  const [materialSearch, setMaterialSearch] = useState('');
  const [previewMatId, setPreviewMatId] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const highlightPreRef = useRef<HTMLPreElement | null>(null);
  const themePreRef = useRef<HTMLPreElement | null>(null);

  useEffect(() => {
    setClassDraft(selectedNode?.props.className || '');
  }, [selectedId, selectedNode?.props.className]);

  const discovered = useMemo(
    () =>
      discoverPageStylesheets(
        typeof document !== 'undefined' ? document : null,
        sharedThemeCss,
        themeVars
      ),
    [sharedThemeCss, themeVars, nodes]
  );

  const elementClassName = selectedNode?.props.className || '';
  const elementClassTokens = useMemo(
    () => elementClassName.split(/\s+/).filter(Boolean),
    [elementClassName]
  );
  const rawCssValue = selectedNode?.customStyleCss || '';

  const cssTokens = useMemo(
    () => tokenizeCssForHighlight(rawCssValue),
    [rawCssValue]
  );
  const sharedCssTokens = useMemo(
    () => tokenizeCssForHighlight(sharedThemeCss),
    [sharedThemeCss]
  );

  const validation = useMemo(
    () =>
      validateRawCssAgainstTailwind(
        rawCssValue,
        elementClassName,
        tailwindVersion
      ),
    [rawCssValue, elementClassName, tailwindVersion]
  );

  // Combine Tailwind + Bootstrap + UI classes + Material props/slots/selectors/md2/md3
  const classSuggestions = useMemo(() => {
    const baseSuggestions = getClassAutocompleteSuggestions(
      classDraft,
      tailwindVersion,
      discovered,
      8,
      bootstrapVersion
    );

    const words = classDraft.split(/\s+/);
    const activeToken = (words[words.length - 1] || '').trim().toLowerCase();
    const selectedMuiTag =
      selectedNode?.sourceLibrary === 'mui-v9'
        ? selectedNode.materialMeta?.componentTag
        : undefined;

    const materialMatches = filterMaterialStyleEntries({
      enableMd2,
      enableMd3,
      searchQuery: activeToken,
      selectedComponentTag: !activeToken ? selectedMuiTag : undefined,
    })
      .slice(0, 6)
      .map((entry) => ({
        label: entry.name,
        insertText: entry.insertText,
        detail: `${entry.sourceLabel} · ${entry.description}`,
        badge: entry.sourceLabel,
        kind: 'class' as const,
      }));

    // Prioritize selected component's library suggestions cleanly
    if (selectedNode?.sourceLibrary === 'mui-v9' || selectedNode?.sourceLibrary === 'md2' || selectedNode?.sourceLibrary === 'md3') {
      return [...materialMatches, ...baseSuggestions].slice(0, 12);
    }
    return [...baseSuggestions, ...materialMatches].slice(0, 12);
  }, [
    classDraft,
    tailwindVersion,
    discovered,
    bootstrapVersion,
    enableMd2,
    enableMd3,
    selectedNode?.sourceLibrary,
    selectedNode?.materialMeta?.componentTag,
  ]);

  const declarationSuggestions = useMemo(() => {
    const baseDecls = getDeclarationAutocompleteSuggestions(
      rawCssValue,
      tailwindVersion,
      discovered.cssVariables,
      8
    );

    if (!enableMd3 && selectedNode?.sourceLibrary !== 'md3') {
      return baseDecls;
    }

    const md3Tokens = filterMaterialStyleEntries({
      enableMd2: false,
      enableMd3: true,
      sourceFilter: 'md3',
    })
      .filter((item) => item.kind === 'md3-token')
      .slice(0, 4)
      .map((item) => ({
        label: item.name,
        insertText: item.insertText,
        detail: item.description,
        badge: 'MD3 Token',
        kind: 'variable' as const,
      }));

    return [...baseDecls, ...md3Tokens].slice(0, 10);
  }, [
    rawCssValue,
    tailwindVersion,
    discovered.cssVariables,
    enableMd3,
    selectedNode?.sourceLibrary,
  ]);

  const explorerCatalog = useMemo(
    () => buildClassExplorerCatalog(tailwindVersion, discovered),
    [tailwindVersion, discovered]
  );

  const filteredTailwindAndUiItems = useMemo(() => {
    if (explorerFilter === 'bootstrap' || explorerFilter === 'material') {
      return [];
    }
    const mode = explorerFilter === 'all' ? 'all' : explorerFilter;
    return filterClassExplorerItems(explorerCatalog, explorerQuery, mode);
  }, [explorerCatalog, explorerQuery, explorerFilter]);

  const bootstrapExplorerClasses = useMemo(() => {
    if (explorerFilter !== 'all' && explorerFilter !== 'bootstrap') {
      return [];
    }
    return getBootstrapClassesForVersion(
      bootstrapVersion,
      explorerQuery,
      bsClassCategory
    );
  }, [explorerFilter, bootstrapVersion, explorerQuery, bsClassCategory]);

  const materialExplorerEntries = useMemo(() => {
    if (explorerFilter !== 'all' && explorerFilter !== 'material') {
      return [];
    }
    return filterMaterialStyleEntries({
      enableMd2,
      enableMd3,
      searchQuery: explorerQuery,
    });
  }, [explorerFilter, enableMd2, enableMd3, explorerQuery]);

  const bootstrapComponents = useMemo(
    () => getBootstrapComponentsForVersion(bootstrapVersion, bsCompCategory),
    [bootstrapVersion, bsCompCategory]
  );

  const materialComponents = useMemo(
    () =>
      filterMaterialComponents({
        sourceFilter: materialSourceFilter,
        enableMd2,
        enableMd3,
        searchQuery: materialSearch,
      }),
    [materialSourceFilter, enableMd2, enableMd3, materialSearch]
  );

  const handleCopyText = async (value: string, key = value) => {
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      // Clipboard may be unavailable in non-secure environments
    }
    setCopiedKey(key);
    window.setTimeout(() => {
      setCopiedKey((curr) => (curr === key ? null : curr));
    }, 1500);
  };

  const applyClassSuggestion = (classNameToInsert: string) => {
    // Handle MUI / MD3 style entries seamlessly even from autocomplete
    if (classNameToInsert.startsWith('.Mui')) {
      if (selectedNode) {
        onUpdateNodeMaterialMeta(selectedNode.id, (curr) => ({
          ...curr,
          slotOverrides: {
            ...(curr.slotOverrides || {}),
            [classNameToInsert]: 'borderRadius: 10px;',
          },
        }));
      }
      return;
    }

    if (classNameToInsert.startsWith('--md-')) {
      const [prop, val = '#6750a4'] = classNameToInsert
        .replace(/;$/, '')
        .split(':')
        .map((s) => s.trim());
      if (selectedNode) {
        onUpdateNodeMaterialMeta(selectedNode.id, (curr) => ({
          ...curr,
          mdTokens: { ...(curr.mdTokens || {}), [prop]: val },
        }));
        const nextRaw = rawCssValue.trim()
          ? `${rawCssValue.trim()}\n${prop}: ${val};`
          : `${prop}: ${val};`;
        onUpdateNodeCustomCss(selectedNode.id, nextRaw);
      }
      return;
    }

    const trimmed = classDraft.trimEnd();
    const parts = trimmed.length > 0 ? trimmed.split(/\s+/) : [];
    const lastToken = parts[parts.length - 1] || '';

    let nextClasses: string[];
    if (
      lastToken &&
      classNameToInsert.toLowerCase().includes(lastToken.toLowerCase()) &&
      classNameToInsert !== lastToken
    ) {
      nextClasses = [...parts.slice(0, -1), classNameToInsert];
    } else if (!parts.includes(classNameToInsert)) {
      nextClasses = [...parts, classNameToInsert];
    } else {
      nextClasses = parts;
    }

    const joined = Array.from(new Set(nextClasses)).join(' ');
    setClassDraft(joined);
    onUpdateNodeClass(joined);
  };

  const applyDeclarationSuggestion = (insertText: string) => {
    if (!selectedNode) return;
    const lines = rawCssValue.split('\n');
    const lastIdx = lines.length - 1;
    const activeLine = lines[lastIdx] || '';
    const colonIdx = activeLine.indexOf(':');

    let nextCss = '';
    if (colonIdx === -1) {
      lines[lastIdx] = insertText;
      nextCss = lines.join('\n');
    } else {
      const propPrefix = activeLine.slice(0, colonIdx + 1);
      lines[lastIdx] = `${propPrefix} ${insertText}`;
      nextCss = `${lines.join('\n')}\n`;
    }
    onUpdateNodeCustomCss(selectedNode.id, nextCss);
  };

  const handleToggleExplorerClass = (cls: string) => {
    if (!selectedNode || isMultiSelect) return;
    const clsTokens = cls.split(/\s+/).filter(Boolean);
    const exists = clsTokens.every((t) => elementClassTokens.includes(t));
    const nextTokens = exists
      ? elementClassTokens.filter((t) => !clsTokens.includes(t))
      : Array.from(new Set([...elementClassTokens, ...clsTokens]));
    const nextClassStr = nextTokens.join(' ');
    setClassDraft(nextClassStr);
    onUpdateNodeClass(nextClassStr);
  };

  const handleApplyMaterialStyleEntry = (entry: MaterialStyleEntry) => {
    if (!selectedNode || isMultiSelect) return;

    if (entry.kind === 'md2-class') {
      handleToggleExplorerClass(entry.insertText);
      return;
    }

    if (entry.kind === 'mui-selector' || entry.kind === 'mui-slot') {
      const key =
        entry.kind === 'mui-slot'
          ? `[data-slot="${entry.insertText}"]`
          : entry.insertText;
      onUpdateNodeMaterialMeta(selectedNode.id, (curr) => ({
        ...curr,
        slotOverrides: {
          ...(curr.slotOverrides || {}),
          [key]: 'fontWeight: 600;',
        },
      }));
      return;
    }

    if (entry.kind === 'mui-prop-value') {
      const [propKey, propVal] = entry.insertText.split('=');
      if (propKey && propVal) {
        onUpdateNodeMaterialMeta(selectedNode.id, (curr) => ({
          ...curr,
          muiProps: { ...(curr.muiProps || {}), [propKey]: propVal },
        }));
      }
      return;
    }

    if (entry.kind === 'md3-token') {
      const [varName, varVal = '#6750a4'] = entry.insertText
        .replace(/;$/, '')
        .split(':')
        .map((s) => s.trim());
      if (varName.startsWith('--md-sys-')) {
        // Apply MD3 system variable to Theme Shared CSS
        const nextRule = `:root {\n  ${varName}: ${varVal};\n}`;
        if (!sharedThemeCss.includes(varName)) {
          onChangeSharedThemeCss(`${sharedThemeCss.trim()}\n\n${nextRule}`.trim());
        }
      } else {
        onUpdateNodeMaterialMeta(selectedNode.id, (curr) => ({
          ...curr,
          mdTokens: { ...(curr.mdTokens || {}), [varName]: varVal },
        }));
        const nextRaw = rawCssValue.trim()
          ? `${rawCssValue.trim()}\n${varName}: ${varVal};`
          : `${varName}: ${varVal};`;
        onUpdateNodeCustomCss(selectedNode.id, nextRaw);
      }
      return;
    }

    if (entry.kind === 'md3-attr' || entry.kind === 'md2-attr') {
      const [k, v = 'true'] = entry.insertText
        .replace(/"/g, '')
        .split('=')
        .map((s) => s.trim());
      if (k) {
        handleToggleExplorerClass(selectedNode.props.className || '');
        // Update raw CSS or attribute feedback
        onUpdateNodeMaterialMeta(selectedNode.id, (curr) => ({
          ...curr,
          muiProps: { ...(curr.muiProps || {}), [k]: v },
        }));
      }
    }
  };

  const muiExportSnippet = useMemo(
    () => generateMuiReactJsxExport(nodes, themeVars, true),
    [nodes, themeVars]
  );

  const bsAssets = getBootstrapAssets(bootstrapVersion);

  return (
    <div
      data-testid="custom-styles-panel"
      className="flex-1 flex flex-col min-h-0 overflow-hidden"
    >
      {/* Internal Sub-tabs for clean organization */}
      <div
        role="tablist"
        aria-label="Sekcje Custom Styles"
        className="grid grid-cols-4 gap-0.5 p-1.5 border-b border-slate-200 bg-slate-50/90 shrink-0"
      >
        {(
          [
            { id: 'editor', label: 'CSS Editor' },
            { id: 'explorer', label: 'Explorer' },
            { id: 'bootstrap', label: `BS ${bootstrapVersion === '4.6.2' ? 'v4' : 'v5'}` },
            { id: 'material', label: 'MUI v9' },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            data-testid={`custom-styles-subtab-${tab.id}`}
            aria-selected={subTab === tab.id}
            onClick={() => setSubTab(tab.id)}
            className={`py-1.5 px-1 rounded-md text-[10.5px] font-semibold transition-colors whitespace-nowrap ${
              subTab === tab.id
                ? 'bg-white text-blue-600 shadow-xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="p-3.5 flex-1 overflow-y-auto flex flex-col gap-4">
        {/* Global Reference Versions Card */}
        <section
          aria-label="Reference Versions"
          className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/90 space-y-2"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1 text-[10.5px] font-bold text-slate-700">
              <FileCode2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              Tailwind CSS
            </span>
            <div
              role="group"
              aria-label="Wybierz wersję Tailwind CSS"
              data-testid="tailwind-version-selector"
              className="flex items-center bg-white p-0.5 rounded-lg border border-slate-200"
            >
              {(['v3', 'v4'] as const).map((ver) => (
                <button
                  key={ver}
                  type="button"
                  data-testid={`tailwind-version-${ver}`}
                  aria-pressed={tailwindVersion === ver}
                  onClick={() => onChangeTailwindVersion(ver)}
                  className={`px-2 py-0.5 rounded text-[10.5px] font-semibold transition-colors ${
                    tailwindVersion === ver
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {ver}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1 text-[10.5px] font-bold text-slate-700">
              <Boxes className="w-3.5 h-3.5 text-violet-600 shrink-0" />
              Bootstrap
            </span>
            <div
              role="group"
              aria-label="Wybierz wersję Bootstrap"
              data-testid="bootstrap-version-selector"
              className="flex items-center bg-white p-0.5 rounded-lg border border-slate-200"
            >
              {(['4.6.2', '5.2.3'] as const).map((ver) => (
                <button
                  key={ver}
                  type="button"
                  data-testid={`bootstrap-version-${ver}`}
                  aria-pressed={bootstrapVersion === ver}
                  onClick={() => onChangeBootstrapVersion(ver)}
                  className={`px-2 py-0.5 rounded text-[10.5px] font-semibold transition-colors ${
                    bootstrapVersion === ver
                      ? 'bg-violet-600 text-white'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {ver === '4.6.2' ? 'v4 (4.6.2)' : 'v5 (5.2.3)'}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-200/70 text-[10px]">
            <span className="font-semibold text-slate-600">Material opcjonalne:</span>
            <div className="flex items-center gap-2">
              <label className="inline-flex items-center gap-1 cursor-pointer text-slate-700">
                <input
                  type="checkbox"
                  data-testid="toggle-enable-md2"
                  checked={enableMd2}
                  onChange={(e) => onToggleEnableMd2(e.target.checked)}
                  className="rounded border-slate-300 text-blue-600"
                />
                <span>MD2</span>
              </label>
              <label className="inline-flex items-center gap-1 cursor-pointer text-slate-700">
                <input
                  type="checkbox"
                  data-testid="toggle-enable-md3"
                  checked={enableMd3}
                  onChange={(e) => onToggleEnableMd3(e.target.checked)}
                  className="rounded border-slate-300 text-blue-600"
                />
                <span>MD3</span>
              </label>
            </div>
          </div>

          <div className="flex items-center justify-between text-[10px] text-slate-500">
            <span>Arkusze CSS strony: {discovered.stylesheetCount}</span>
            <span
              data-testid="tailwind-runtime-badge"
              className="px-1.5 py-0.5 rounded bg-white border border-slate-200 text-slate-700 font-medium"
            >
              {discovered.tailwindDetected
                ? `TW ${tailwindVersion} aktywny`
                : 'Plain HTML + CSS'}
            </span>
          </div>
        </section>

        {/* SUB-TAB 1: ELEMENT & THEME CSS EDITOR */}
        {subTab === 'editor' && (
          <>
            <section
              aria-label="Element CSS Editor"
              data-testid="element-css-editor"
              className="space-y-3 p-3 bg-white rounded-xl border border-slate-200"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 min-w-0">
                  <Layers className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  <h3 className="text-[11px] font-bold text-slate-800 truncate">
                    Element: {selectedNode?.name || 'Brak wyboru'}
                  </h3>
                </div>
                {selectedNode?.sourceLibrary && (
                  <span className="px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 text-[9.5px] font-mono text-slate-600 shrink-0">
                    {selectedNode.sourceLibrary}
                  </span>
                )}
              </div>

              {!selectedNode || isMultiSelect ? (
                <p className="text-[11px] text-slate-500">
                  Wybierz pojedynczy element na płótnie, aby edytować jego klasy, reguły CSS oraz warianty biblioteki.
                </p>
              ) : (
                <>
                  {/* MUI v9 Props quick editor if MUI node */}
                  {selectedNode.sourceLibrary === 'mui-v9' && (
                    <div
                      data-testid="mui-props-quick-editor"
                      className="p-2.5 bg-blue-50/70 border border-blue-200 rounded-lg space-y-2"
                    >
                      <div className="text-[10.5px] font-bold text-blue-900">
                        MUI v9 Props &amp; Slots ({selectedNode.materialMeta?.componentTag || 'Component'})
                      </div>
                      <div className="grid grid-cols-2 gap-1.5">
                        <label className="text-[10px] text-slate-600 space-y-0.5">
                          <span>variant</span>
                          <select
                            value={String(selectedNode.materialMeta?.muiProps?.variant || 'contained')}
                            onChange={(e) =>
                              onUpdateNodeMaterialMeta(selectedNode.id, (curr) => ({
                                ...curr,
                                muiProps: {
                                  ...(curr.muiProps || {}),
                                  variant: e.target.value,
                                },
                              }))
                            }
                            className="w-full px-1.5 py-1 bg-white border border-slate-200 rounded text-[11px]"
                          >
                            <option value="contained">contained</option>
                            <option value="outlined">outlined</option>
                            <option value="text">text</option>
                            <option value="filled">filled</option>
                            <option value="standard">standard</option>
                            <option value="elevation">elevation</option>
                          </select>
                        </label>
                        <label className="text-[10px] text-slate-600 space-y-0.5">
                          <span>color / severity</span>
                          <select
                            value={String(
                              selectedNode.materialMeta?.muiProps?.severity ||
                                selectedNode.materialMeta?.muiProps?.color ||
                                'primary'
                            )}
                            onChange={(e) =>
                              onUpdateNodeMaterialMeta(selectedNode.id, (curr) => ({
                                ...curr,
                                muiProps: {
                                  ...(curr.muiProps || {}),
                                  color: e.target.value,
                                  ...(curr.componentTag === 'Alert'
                                    ? { severity: e.target.value }
                                    : {}),
                                },
                              }))
                            }
                            className="w-full px-1.5 py-1 bg-white border border-slate-200 rounded text-[11px]"
                          >
                            <option value="primary">primary</option>
                            <option value="secondary">secondary</option>
                            <option value="success">success</option>
                            <option value="warning">warning</option>
                            <option value="error">error</option>
                            <option value="info">info</option>
                          </select>
                        </label>
                      </div>
                      {selectedNode.materialMeta?.slotOverrides &&
                        Object.keys(selectedNode.materialMeta.slotOverrides).length > 0 && (
                          <div className="text-[10px] font-mono text-blue-800 bg-white/80 rounded p-1.5 border border-blue-200">
                            sx overrides:{' '}
                            {Object.keys(selectedNode.materialMeta.slotOverrides).join(', ')}
                          </div>
                        )}
                    </div>
                  )}

                  {/* Element CSS Classes Input + Multi-library Autocomplete */}
                  <div className="space-y-1.5">
                    <label
                      htmlFor="custom-styles-class-input"
                      className="block text-[10px] font-semibold text-slate-600"
                    >
                      Klasy CSS / Atrybuty (TW {tailwindVersion} · BS {bootstrapVersion} · MUI/MD)
                    </label>
                    <input
                      id="custom-styles-class-input"
                      type="text"
                      data-testid="custom-styles-class-input"
                      value={classDraft}
                      onFocus={() => setClassInputFocused(true)}
                      onBlur={() => {
                        window.setTimeout(() => setClassInputFocused(false), 160);
                      }}
                      onChange={(e) => {
                        const val = e.target.value;
                        setClassDraft(val);
                        onUpdateNodeClass(val);
                      }}
                      placeholder="np. btn btn-primary, flex items-center, mdc-button..."
                      className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                    />

                    {classInputFocused && classSuggestions.length > 0 && (
                      <div
                        data-testid="class-autocomplete-list"
                        className="bg-white border border-slate-200 rounded-lg shadow-md divide-y divide-slate-100 max-h-44 overflow-y-auto"
                      >
                        {classSuggestions.map((sug, idx) => (
                          <button
                            key={`${sug.badge}-${sug.label}-${idx}`}
                            type="button"
                            onMouseDown={(e) => {
                              e.preventDefault();
                              applyClassSuggestion(sug.insertText);
                            }}
                            className="w-full px-2.5 py-1.5 text-left hover:bg-blue-50 flex items-center justify-between gap-2 transition-colors"
                          >
                            <div className="min-w-0">
                              <div className="text-[11px] font-mono font-semibold text-slate-800 truncate">
                                {sug.label}
                              </div>
                              <div className="text-[9.5px] text-slate-500 truncate">
                                {sug.detail}
                              </div>
                            </div>
                            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 shrink-0">
                              {sug.badge}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Raw CSS Rules / Declarations with Dark Syntax Highlighting */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <label
                        htmlFor="custom-styles-css-textarea"
                        className="block text-[10px] font-semibold text-slate-600"
                      >
                        Raw CSS Rules / Declarations
                      </label>
                      {rawCssValue.trim() && (
                        <button
                          type="button"
                          onClick={() => onUpdateNodeCustomCss(selectedNode.id, '')}
                          className="text-[10px] font-medium text-slate-500 hover:text-red-600"
                        >
                          Wyczyść
                        </button>
                      )}
                    </div>

                    <div className="relative h-28 rounded-lg bg-slate-950 border border-slate-800 overflow-hidden focus-within:ring-2 focus-within:ring-blue-500">
                      <pre
                        ref={highlightPreRef}
                        aria-hidden="true"
                        data-testid="css-syntax-highlight-layer"
                        className="absolute inset-0 m-0 p-2.5 font-mono text-[11px] leading-5 whitespace-pre-wrap break-words overflow-auto pointer-events-none select-none"
                      >
                        {rawCssValue ? (
                          cssTokens.map((tok, i) => (
                            <span key={i} className={getTokenSpanClass(tok.kind)}>
                              {tok.text}
                            </span>
                          ))
                        ) : (
                          <span className="text-slate-600">
                            {'/* np. background-color: var(--color-surface);\n   border-radius: 12px; */'}
                          </span>
                        )}
                      </pre>
                      <textarea
                        id="custom-styles-css-textarea"
                        data-testid="custom-styles-css-textarea"
                        spellCheck={false}
                        value={rawCssValue}
                        onFocus={() => setCssInputFocused(true)}
                        onBlur={() => {
                          window.setTimeout(() => setCssInputFocused(false), 160);
                        }}
                        onScroll={(e) => {
                          if (highlightPreRef.current) {
                            highlightPreRef.current.scrollTop =
                              e.currentTarget.scrollTop;
                            highlightPreRef.current.scrollLeft =
                              e.currentTarget.scrollLeft;
                          }
                        }}
                        onChange={(e) =>
                          onUpdateNodeCustomCss(selectedNode.id, e.target.value)
                        }
                        className="relative z-10 w-full h-full p-2.5 bg-transparent text-transparent caret-white font-mono text-[11px] leading-5 resize-none focus:outline-none overflow-auto"
                      />
                    </div>

                    {(cssInputFocused || declarationSuggestions.length > 0) && (
                      <div
                        data-testid="css-declaration-autocomplete"
                        className="flex flex-wrap gap-1 max-h-16 overflow-y-auto"
                      >
                        {declarationSuggestions.map((sug) => (
                          <button
                            key={`${sug.kind}-${sug.label}`}
                            type="button"
                            title={sug.detail}
                            onMouseDown={(e) => {
                              e.preventDefault();
                              applyDeclarationSuggestion(sug.insertText);
                            }}
                            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-100 hover:bg-indigo-50 border border-slate-200 text-[10px] font-mono text-slate-700"
                          >
                            <Plus className="w-2.5 h-2.5 text-slate-400" />
                            <span>{sug.label}</span>
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Validation against syntax & Tailwind classes */}
                    <div
                      data-testid="custom-styles-validation"
                      className="space-y-1 pt-0.5"
                    >
                      {validation.issues.length === 0 ? (
                        <div className="flex items-center gap-1.5 text-[10.5px] text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-2 py-1">
                          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                          <span>
                            {rawCssValue.trim()
                              ? `Poprawny CSS · brak kolizji z Tailwind ${tailwindVersion}`
                              : `Walidator CSS ↔ Tailwind ${tailwindVersion} aktywny`}
                          </span>
                        </div>
                      ) : (
                        validation.issues.map((issue) => (
                          <div
                            key={issue.id}
                            className={`p-2 rounded-lg border text-[10px] space-y-1 ${
                              issue.severity === 'error'
                                ? 'bg-red-50 border-red-200 text-red-800'
                                : issue.severity === 'warning'
                                  ? 'bg-amber-50 border-amber-200 text-amber-800'
                                  : 'bg-blue-50 border-blue-200 text-blue-800'
                            }`}
                          >
                            <div className="flex items-start gap-1.5">
                              {issue.severity === 'info' ? (
                                <Info className="w-3 h-3 shrink-0 mt-0.5" />
                              ) : (
                                <AlertTriangle className="w-3 h-3 shrink-0 mt-0.5" />
                              )}
                              <span>{issue.message}</span>
                            </div>
                            {issue.tailwindEquivalent && (
                              <button
                                type="button"
                                onClick={() => {
                                  const nextClassStr = Array.from(
                                    new Set([
                                      ...elementClassTokens,
                                      issue.tailwindEquivalent!,
                                    ])
                                  ).join(' ');
                                  setClassDraft(nextClassStr);
                                  onUpdateNodeClass(nextClassStr);
                                }}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-white border border-blue-200 text-[10px] font-semibold text-blue-700 hover:bg-blue-100"
                              >
                                <Wand2 className="w-3 h-3" />
                                Zastosuj `{issue.tailwindEquivalent}`
                              </button>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </>
              )}
            </section>

            {/* Shared Theme CSS Editor + Variable Color Pickers */}
            <section
              aria-label="Theme Shared CSS Editor"
              data-testid="theme-shared-css-section"
              className="space-y-2 p-3 bg-slate-50 rounded-xl border border-slate-200"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <Palette className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                  <h3 className="text-[11px] font-bold text-slate-800">
                    Theme Shared CSS Rules
                  </h3>
                </div>
                <span className="text-[9.5px] font-mono text-slate-500">
                  {discovered.themeClasses.length} klas
                </span>
              </div>

              <div className="relative h-24 rounded-lg bg-slate-950 border border-slate-800 overflow-hidden focus-within:ring-2 focus-within:ring-indigo-500">
                <pre
                  ref={themePreRef}
                  aria-hidden="true"
                  className="absolute inset-0 m-0 p-2 font-mono text-[10.5px] leading-4 whitespace-pre-wrap break-words overflow-auto pointer-events-none select-none"
                >
                  {sharedCssTokens.map((tok, i) => (
                    <span key={i} className={getTokenSpanClass(tok.kind)}>
                      {tok.text}
                    </span>
                  ))}
                </pre>
                <textarea
                  aria-label="Wspólne reguły CSS motywu"
                  data-testid="theme-shared-css-textarea"
                  spellCheck={false}
                  value={sharedThemeCss}
                  onScroll={(e) => {
                    if (themePreRef.current) {
                      themePreRef.current.scrollTop = e.currentTarget.scrollTop;
                      themePreRef.current.scrollLeft = e.currentTarget.scrollLeft;
                    }
                  }}
                  onChange={(e) => onChangeSharedThemeCss(e.target.value)}
                  className="relative z-10 w-full h-full p-2 bg-transparent text-transparent caret-white font-mono text-[10.5px] leading-4 resize-none focus:outline-none overflow-auto"
                />
              </div>

              <div className="space-y-1 max-h-28 overflow-y-auto">
                {themeVars.map((tv) => (
                  <div
                    key={tv.id}
                    className="flex items-center justify-between gap-2 px-2 py-1 bg-white border border-slate-200 rounded-md"
                  >
                    <span className="text-[10px] font-mono text-slate-700 truncate">
                      {tv.name}
                    </span>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <input
                        type="color"
                        aria-label={`Szybki kolor ${tv.name}`}
                        value={
                          /^#[0-9a-fA-F]{6}$/.test(tv.value) ? tv.value : '#2563eb'
                        }
                        onChange={(e) => onUpdateThemeVar(tv.id, e.target.value)}
                        className="w-5 h-5 p-0 border border-slate-200 rounded cursor-pointer bg-white"
                      />
                      <span className="text-[9.5px] font-mono text-slate-500 w-14 text-right truncate">
                        {tv.value}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}

        {/* SUB-TAB 2: UNIFIED STYLE EXPLORER (Tailwind / UI / Bootstrap / Material) */}
        {subTab === 'explorer' && (
          <section
            aria-label="Style Explorer"
            data-testid="class-explorer-section"
            className="space-y-2.5 p-3 bg-white rounded-xl border border-slate-200"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <Search className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                <h3 className="text-[11px] font-bold text-slate-800">
                  Style Explorer
                </h3>
              </div>
              <span className="text-[10px] font-mono text-slate-400">
                {filteredTailwindAndUiItems.length +
                  bootstrapExplorerClasses.length +
                  materialExplorerEntries.length}
              </span>
            </div>

            <input
              type="text"
              data-testid="class-explorer-search"
              aria-label="Szukaj w Style Explorer"
              placeholder={`Szukaj klas, selektorów .Mui*, mdc-*, --md-*...`}
              value={explorerQuery}
              onChange={(e) => setExplorerQuery(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
            />

            <div
              role="group"
              aria-label="Źródło stylów"
              className="flex flex-wrap gap-1"
            >
              {(
                [
                  { id: 'all', label: 'Wszystkie' },
                  { id: 'tailwind', label: `TW ${tailwindVersion}` },
                  { id: 'bootstrap', label: `BS ${bootstrapVersion}` },
                  { id: 'material', label: 'Material' },
                  { id: 'ui', label: 'Theme' },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  data-testid={`explorer-filter-${tab.id}`}
                  aria-pressed={explorerFilter === tab.id}
                  onClick={() => setExplorerFilter(tab.id)}
                  className={`py-1 px-2 rounded text-[10px] font-semibold border transition-colors ${
                    explorerFilter === tab.id
                      ? 'bg-blue-50 border-blue-300 text-blue-700'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {(explorerFilter === 'all' || explorerFilter === 'bootstrap') && (
              <div className="flex flex-wrap gap-1 pt-1">
                {(
                  ['All', 'Components', 'Layout', 'Forms', 'Utilities', 'Helpers'] as const
                ).map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    data-testid={`bs-class-cat-${cat}`}
                    aria-pressed={bsClassCategory === cat}
                    onClick={() => setBsClassCategory(cat)}
                    className={`px-1.5 py-0.5 rounded text-[9.5px] font-medium border ${
                      bsClassCategory === cat
                        ? 'bg-violet-50 border-violet-300 text-violet-700'
                        : 'bg-slate-50 border-slate-200 text-slate-500'
                    }`}
                  >
                    BS: {cat}
                  </button>
                ))}
              </div>
            )}

            <div
              data-testid="class-explorer-list"
              className="space-y-1.5 max-h-[420px] overflow-y-auto pr-0.5"
            >
              {/* Material Style Entries */}
              {materialExplorerEntries.map((entry) => (
                <div
                  key={entry.id}
                  data-testid={`material-style-item-${entry.id}`}
                  className="p-2 rounded-lg border border-blue-100 bg-blue-50/30 space-y-1.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <code className="text-[11px] font-mono font-semibold text-slate-800 truncate">
                          {entry.name}
                        </code>
                        <span className="text-[9px] font-mono px-1 py-0.5 rounded bg-blue-100 text-blue-800 shrink-0">
                          {entry.sourceLabel}
                        </span>
                      </div>
                      <p className="text-[9.5px] text-slate-600 leading-snug">
                        {entry.description}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        aria-label={`Kopiuj ${entry.name}`}
                        onClick={() => void handleCopyText(entry.example, entry.id)}
                        className="p-1 bg-white hover:bg-slate-100 border border-slate-200 rounded text-slate-600"
                      >
                        {copiedKey === entry.id ? (
                          <Check className="w-3 h-3 text-emerald-600" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                      <button
                        type="button"
                        disabled={!selectedNode || isMultiSelect}
                        data-testid={`material-style-apply-${entry.id}`}
                        onClick={() => handleApplyMaterialStyleEntry(entry)}
                        className="px-2 py-1 rounded text-[10px] font-semibold bg-white border border-slate-200 text-blue-700 hover:bg-blue-50 disabled:opacity-40"
                      >
                        Zastosuj
                      </button>
                    </div>
                  </div>
                  <pre className="text-[9.5px] font-mono text-slate-600 bg-white border border-slate-200/80 rounded p-1.5 overflow-x-auto">
                    {entry.example}
                  </pre>
                </div>
              ))}

              {/* Bootstrap Class Entries */}
              {bootstrapExplorerClasses.map((item) => {
                const isApplied =
                  !isMultiSelect &&
                  Boolean(selectedNode) &&
                  item.className
                    .split(/\s+/)
                    .every((t) => elementClassTokens.includes(t));
                const copyId = `bs-${item.version}-${item.className}`;

                return (
                  <div
                    key={copyId}
                    data-testid={`class-explorer-item-${item.className}`}
                    className="p-2 rounded-lg border border-violet-200/80 bg-violet-50/30 space-y-1.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <code className="text-[11px] font-mono font-semibold text-slate-800 truncate">
                            {item.className}
                          </code>
                          <span className="text-[9px] font-mono px-1 py-0.5 rounded bg-violet-100 text-violet-800 shrink-0">
                            BS {item.version} · {item.category}
                          </span>
                        </div>
                        <p className="text-[9.5px] text-slate-600 leading-snug">
                          {item.description}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          data-testid={`class-explorer-copy-${item.className}`}
                          aria-label={`Kopiuj klasę ${item.className}`}
                          onClick={() =>
                            void handleCopyText(item.className, copyId)
                          }
                          className="p-1 bg-white hover:bg-slate-100 border border-slate-200 rounded text-slate-600"
                        >
                          {copiedKey === copyId ? (
                            <Check className="w-3 h-3 text-emerald-600" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                        <button
                          type="button"
                          disabled={!selectedNode || isMultiSelect}
                          data-testid={`class-explorer-apply-${item.className}`}
                          aria-pressed={isApplied}
                          onClick={() => handleToggleExplorerClass(item.className)}
                          className={`px-2 py-1 rounded text-[10px] font-semibold border disabled:opacity-40 ${
                            isApplied
                              ? 'bg-violet-600 border-violet-600 text-white'
                              : 'bg-white border-slate-200 text-slate-700 hover:bg-violet-50'
                          }`}
                        >
                          {isApplied ? 'Dodano' : 'Zastosuj'}
                        </button>
                      </div>
                    </div>
                    <pre className="text-[9.5px] font-mono text-slate-600 bg-white border border-slate-200/80 rounded p-1.5 overflow-x-auto">
                      {item.exampleHtml}
                    </pre>
                  </div>
                );
              })}

              {/* Tailwind & Theme CSS Entries */}
              {filteredTailwindAndUiItems.map((item) => {
                const isApplied =
                  !isMultiSelect &&
                  Boolean(selectedNode) &&
                  elementClassTokens.includes(item.className);
                const copyId = `${item.source}-${item.className}`;

                return (
                  <div
                    key={copyId}
                    data-testid={`class-explorer-item-${item.className}`}
                    className="p-2 rounded-lg border border-slate-200/80 bg-slate-50/70 flex items-center justify-between gap-2"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <code className="text-[11px] font-mono font-semibold text-slate-800 truncate">
                          {item.className}
                        </code>
                        <span className="text-[9px] font-mono px-1 py-0.5 rounded bg-white border border-slate-200 text-slate-500 shrink-0">
                          {item.source === 'tailwind'
                            ? tailwindVersion
                            : item.source === 'theme'
                              ? 'Theme'
                              : 'CSS'}
                        </span>
                      </div>
                      <p className="text-[9.5px] text-slate-500 truncate">
                        {item.description}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        data-testid={`class-explorer-copy-${item.className}`}
                        aria-label={`Kopiuj klasę ${item.className}`}
                        onClick={() => void handleCopyText(item.className, copyId)}
                        className="p-1 bg-white hover:bg-slate-100 border border-slate-200 rounded text-slate-600"
                      >
                        {copiedKey === copyId ? (
                          <Check className="w-3 h-3 text-emerald-600" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                      <button
                        type="button"
                        disabled={!selectedNode || isMultiSelect}
                        data-testid={`class-explorer-apply-${item.className}`}
                        aria-pressed={isApplied}
                        onClick={() => handleToggleExplorerClass(item.className)}
                        className={`px-2 py-1 rounded text-[10px] font-semibold border disabled:opacity-40 ${
                          isApplied
                            ? 'bg-blue-600 border-blue-600 text-white'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-blue-50'
                        }`}
                      >
                        {isApplied ? 'Dodano' : 'Zastosuj'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* SUB-TAB 3: BOOTSTRAP v4 (4.6.2) / v5 (5.2.3) COMPONENT LIBRARY */}
        {subTab === 'bootstrap' && (
          <section
            aria-label="Bootstrap Component Library"
            data-testid="bootstrap-library-section"
            className="space-y-3"
          >
            <div className="p-2.5 rounded-xl bg-violet-50/70 border border-violet-200 text-[10.5px] text-violet-900 space-y-1">
              <div className="font-bold">{bsAssets.label}</div>
              <p className="text-violet-700 leading-snug">{bsAssets.dependencyNote}</p>
            </div>

            <div className="flex flex-wrap gap-1" role="group" aria-label="Kategorie Bootstrap">
              {(['All', 'Components', 'Forms', 'Layout'] as const).map((cat) => (
                <button
                  key={cat}
                  type="button"
                  data-testid={`bs-comp-cat-${cat}`}
                  aria-pressed={bsCompCategory === cat}
                  onClick={() => setBsCompCategory(cat)}
                  className={`px-2 py-1 rounded-md text-[10px] font-semibold border ${
                    bsCompCategory === cat
                      ? 'bg-violet-600 border-violet-600 text-white'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="space-y-2.5">
              {bootstrapComponents.map((example) => {
                const isPreviewOpen = previewBsId === example.id;
                const previewDoc = isPreviewOpen
                  ? buildBootstrapPlainHtmlDocument({
                      nodes,
                      themeVars,
                      sharedThemeCss,
                      bootstrapVersion: example.version,
                      seo: seoMetadata,
                      snippetHtmlOverride: example.html,
                    })
                  : '';

                return (
                  <div
                    key={example.id}
                    data-testid={`bs-component-card-${example.id}`}
                    className="p-3 bg-white border border-slate-200 rounded-xl space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-slate-800">
                            {example.title}
                          </span>
                          <span className="text-[9.5px] font-mono px-1.5 py-0.5 rounded bg-violet-100 text-violet-800">
                            {example.category}
                          </span>
                        </div>
                        <p className="text-[10.5px] text-slate-500 leading-snug mt-0.5">
                          {example.description}
                        </p>
                      </div>
                    </div>

                    {isPreviewOpen && (
                      <div className="rounded-lg border border-slate-200 overflow-hidden bg-slate-50">
                        <iframe
                          title={`Podgląd ${example.title}`}
                          data-testid={`bs-preview-iframe-${example.id}`}
                          srcDoc={previewDoc}
                          className="w-full h-40 border-0 bg-white"
                          sandbox="allow-scripts"
                        />
                      </div>
                    )}

                    <pre className="text-[9.5px] font-mono bg-slate-950 text-slate-200 rounded-lg p-2 overflow-x-auto max-h-24">
                      <code>{example.html}</code>
                    </pre>

                    <div className="flex items-center justify-between gap-2">
                      <button
                        type="button"
                        data-testid={`bs-toggle-preview-${example.id}`}
                        onClick={() =>
                          setPreviewBsId((curr) =>
                            curr === example.id ? null : example.id
                          )
                        }
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10.5px] font-semibold"
                      >
                        <Eye className="w-3 h-3" />
                        {isPreviewOpen ? 'Ukryj podgląd' : 'Podgląd HTML'}
                      </button>

                      <button
                        type="button"
                        data-testid={`bs-insert-${example.id}`}
                        onClick={() =>
                          onInsertBlueprint(example.blueprint, example.title)
                        }
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-violet-600 hover:bg-violet-700 text-white text-[10.5px] font-semibold"
                      >
                        <Plus className="w-3 h-3" />
                        Wstaw do strony
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* SUB-TAB 4: MATERIAL UI v9 + OPTIONAL MD2 & MD3 */}
        {subTab === 'material' && (
          <section
            aria-label="Material UI v9 Library"
            data-testid="material-library-section"
            className="space-y-3"
          >
            <input
              type="text"
              data-testid="material-search-input"
              aria-label="Szukaj komponentów Material"
              placeholder="Szukaj (Button, NumberField, Menubar, mdc-, md-)..."
              value={materialSearch}
              onChange={(e) => setMaterialSearch(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            <div className="flex flex-wrap gap-1" role="group" aria-label="Filtr bibliotek Material">
              <button
                type="button"
                data-testid="material-filter-all"
                aria-pressed={materialSourceFilter === 'all'}
                onClick={() => setMaterialSourceFilter('all')}
                className={`px-2 py-1 rounded-md text-[10px] font-semibold border ${
                  materialSourceFilter === 'all'
                    ? 'bg-blue-600 border-blue-600 text-white'
                    : 'bg-white border-slate-200 text-slate-600'
                }`}
              >
                Wszystkie
              </button>
              <button
                type="button"
                data-testid="material-filter-mui-v9"
                aria-pressed={materialSourceFilter === 'mui-v9'}
                onClick={() => setMaterialSourceFilter('mui-v9')}
                className={`px-2 py-1 rounded-md text-[10px] font-semibold border ${
                  materialSourceFilter === 'mui-v9'
                    ? 'bg-blue-600 border-blue-600 text-white'
                    : 'bg-white border-slate-200 text-slate-600'
                }`}
              >
                MUI v9
              </button>
              {enableMd2 && (
                <button
                  type="button"
                  data-testid="material-filter-md2"
                  aria-pressed={materialSourceFilter === 'md2'}
                  onClick={() => setMaterialSourceFilter('md2')}
                  className={`px-2 py-1 rounded-md text-[10px] font-semibold border ${
                    materialSourceFilter === 'md2'
                      ? 'bg-blue-600 border-blue-600 text-white'
                      : 'bg-white border-slate-200 text-slate-600'
                  }`}
                >
                  MD2 (MDC)
                </button>
              )}
              {enableMd3 && (
                <button
                  type="button"
                  data-testid="material-filter-md3"
                  aria-pressed={materialSourceFilter === 'md3'}
                  onClick={() => setMaterialSourceFilter('md3')}
                  className={`px-2 py-1 rounded-md text-[10px] font-semibold border ${
                    materialSourceFilter === 'md3'
                      ? 'bg-blue-600 border-blue-600 text-white'
                      : 'bg-white border-slate-200 text-slate-600'
                  }`}
                >
                  MD3 (Web)
                </button>
              )}
            </div>

            {/* Copyable MUI v9 React JSX */}
            <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800 space-y-1.5">
              <div className="flex items-center justify-between gap-2 text-[10.5px] text-slate-200 font-semibold">
                <span className="inline-flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-sky-400" />
                  MUI v9 JSX (z importami)
                </span>
                <button
                  type="button"
                  data-testid="copy-mui-jsx-btn"
                  onClick={() => void handleCopyText(muiExportSnippet, 'mui-jsx')}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-100 text-[10px]"
                >
                  {copiedKey === 'mui-jsx' ? (
                    <Check className="w-3 h-3 text-emerald-400" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                  {copiedKey === 'mui-jsx' ? 'Skopiowano' : 'Kopiuj JSX'}
                </button>
              </div>
              <pre className="text-[9.5px] font-mono text-slate-300 max-h-20 overflow-auto">
                <code>{muiExportSnippet}</code>
              </pre>
            </div>

            <div className="space-y-2.5">
              {materialComponents.map((example) => {
                const isPreviewOpen = previewMatId === example.id;
                const syntheticNode: EditorNode = {
                  id: `preview-${example.id}`,
                  type: example.blueprint.type,
                  name: example.blueprint.name,
                  content: example.blueprint.content,
                  parentId: null,
                  props: example.blueprint.props,
                  sourceLibrary: example.blueprint.sourceLibrary,
                  materialMeta: example.blueprint.materialMeta,
                  children: [],
                };

                const mdPreviewDoc =
                  isPreviewOpen && example.source !== 'mui-v9'
                    ? buildConditionalPlainHtmlDocument({
                        nodes,
                        themeVars,
                        sharedThemeCss,
                        seo: seoMetadata,
                        forceMd2Assets: example.source === 'md2',
                        forceMd3Modules: example.md3Modules || [],
                        snippetHtmlOverride: example.htmlSnippet,
                      })
                    : '';

                return (
                  <div
                    key={example.id}
                    data-testid={`material-component-card-${example.id}`}
                    className="p-3 bg-white border border-slate-200 rounded-xl space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs font-bold text-slate-800">
                            {example.title}
                          </span>
                          <span
                            className={`text-[9.5px] font-mono px-1.5 py-0.5 rounded font-semibold ${
                              example.source === 'mui-v9'
                                ? 'bg-sky-100 text-sky-800'
                                : example.source === 'md2'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-indigo-100 text-indigo-800'
                            }`}
                          >
                            {example.sourceLabel}
                          </span>
                        </div>
                        <p className="text-[10.5px] text-slate-500 leading-snug mt-0.5">
                          {example.description}
                        </p>
                      </div>
                    </div>

                    {isPreviewOpen && (
                      <div className="p-2.5 rounded-lg border border-slate-200 bg-slate-50">
                        {example.source === 'mui-v9' ? (
                          <div data-testid={`material-react-preview-${example.id}`}>
                            <MaterialMuiNodeView
                              node={syntheticNode}
                              themeVars={themeVars}
                            />
                          </div>
                        ) : (
                          <iframe
                            title={`Podgląd ${example.title}`}
                            data-testid={`material-html-preview-${example.id}`}
                            srcDoc={mdPreviewDoc}
                            className="w-full h-28 border-0 bg-white rounded"
                            sandbox="allow-scripts"
                          />
                        )}
                      </div>
                    )}

                    <pre className="text-[9.5px] font-mono bg-slate-950 text-slate-200 rounded-lg p-2 overflow-x-auto max-h-20">
                      <code>{example.jsxSnippet || example.htmlSnippet}</code>
                    </pre>

                    <div className="flex items-center justify-between gap-2">
                      <button
                        type="button"
                        data-testid={`material-toggle-preview-${example.id}`}
                        onClick={() =>
                          setPreviewMatId((curr) =>
                            curr === example.id ? null : example.id
                          )
                        }
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10.5px] font-semibold"
                      >
                        <Eye className="w-3 h-3" />
                        {isPreviewOpen
                          ? 'Ukryj'
                          : example.source === 'mui-v9'
                            ? 'Podgląd React'
                            : 'Podgląd HTML'}
                      </button>

                      <button
                        type="button"
                        data-testid={`material-insert-${example.id}`}
                        onClick={() =>
                          onInsertBlueprint(example.blueprint, example.title)
                        }
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[10.5px] font-semibold"
                      >
                        <Plus className="w-3 h-3" />
                        Wstaw do strony
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
