import { useEffect, useRef, useState } from 'react';
import {
  AlignCenter,
  AlignCenterHorizontal,
  AlignCenterVertical,
  AlignEndHorizontal,
  AlignEndVertical,
  AlignJustify,
  AlignLeft,
  AlignRight,
  AlignStartHorizontal,
  AlignStartVertical,
  Bookmark,
  Check,
  Code2,
  Crosshair,
  Download,
  Files,
  Keyboard,
  LayoutGrid,
  ListChecks,
  Loader2,
  MessageSquare,
  Palette,
  PanelRightClose,
  Plus,
  RotateCcw,
  SlidersHorizontal,
  Sparkles,
  Trash2,
  Upload,
} from 'lucide-react';
import type {
  BootstrapVersion,
  EditorNode,
  InspectorTab,
  MaterialNodeMeta,
  NodeBlueprint,
  NodesMap,
  SeoMetadata,
  TailwindVersion,
  ThemeVarCategory,
  ThemeVariable,
} from '../types/editor';
import {
  INSPECTOR_TAB_STORAGE_KEY,
  THEME_PRESETS,
} from '../constants/editorDefaults';
import { ICON_LIBRARY } from '../constants/lucideIcons';
import { CustomStylesPanel } from './CustomStylesPanel';
import { DesignLintPanel } from './DesignLintPanel';
import { DevToolsPanel } from './DevToolsPanel';
import { GridLayoutPanel } from './GridLayoutPanel';
import { KeyboardShortcutsPanel } from './KeyboardShortcutsPanel';
import { SeoPreview } from './SeoPreview';
import { SitemapGenerator } from './SitemapGenerator';
import { ThemeUsageDashboard } from './ThemeUsageDashboard';
import type { DesignLintIssue } from '../utils/designLint';
import {
  ALIGN_ITEMS_CLASSES,
  BORDER_RADIUS_CLASSES,
  BOX_SHADOW_CLASSES,
  FLEX_DIRECTION_CLASSES,
  FONT_WEIGHT_CLASSES,
  HOVER_TRANSFORM_CLASSES,
  JUSTIFY_CONTENT_CLASSES,
  KEYFRAME_ANIMATION_CLASSES,
  TEXT_ALIGN_CLASSES,
  TRANSITION_DURATION_CLASSES,
  TRANSITION_EASING_CLASSES,
  TRANSITION_PROPERTY_CLASSES,
  applySmartLayoutClasses,
  centerNodeInParent,
  clearNodeAlignment,
  detectMatchingThemePresetId,
  getComponentVariants,
  getNodeAlignmentState,
  getSharedGroupTokenAcrossNodes,
  getSharedSpacingValueAcrossNodes,
  getSharedTextColorAcrossNodes,
  getTailwindGroupToken,
  getTailwindSpacingValue,
  getTailwindTextColor,
  normalizeCssVarName,
  parseImportedTheme,
  serializeThemeVariablesToJson,
  setNodeHorizontalAlignment,
  setNodeVerticalAlignment,
  setTailwindBgColor,
  setTailwindFlexDirection,
  setTailwindFontSize,
  setTailwindSpacingValue,
  setTailwindTextColor,
  toggleTailwindGroup,
  type SpacingPrefix,
} from '../utils/editorLogic';
import { downloadTextFile } from '../utils/exportFormats';
import {
  mergeGeneratedPaletteIntoThemeVars,
  type GeneratedThemePalette,
} from '../utils/themePalette';
import { getNodeComments } from '../utils/nodeComments';

interface InspectorPanelProps {
  selectedId: string;
  selectedIds: string[];
  selectedNode: EditorNode | undefined;
  nodes: NodesMap;
  onUpdateNode: (key: string, value: string, isProp?: boolean) => void;
  onBulkUpdateClassName: (
    updater: (currClass: string, node: EditorNode) => string
  ) => void;
  onAppendBulkClasses: (extraClasses: string) => void;
  onClearMultiSelect: () => void;
  onBulkDeleteNodes: () => void;
  onChangeVariant: (variantId: string) => void;
  onReplaceNodes: (nextNodes: NodesMap) => void;
  onUpdateNodeClassById: (nodeId: string, nextClassName: string) => void;
  onSelectNode: (nodeId: string) => void;
  onAddGridNode: () => void;
  onDuplicateNode: () => void;
  onDeleteNode: () => void;
  onSaveAsComponent: () => void;
  showShortcutsModal: boolean;
  onToggleShortcutsModal: () => void;
  themeVars: ThemeVariable[];
  onAddThemeVar: (name: string, value: string, category: ThemeVarCategory) => void;
  onUpdateThemeVar: (id: string, value: string) => void;
  onDeleteThemeVar: (id: string) => void;
  onReplaceThemeVars: (nextVars: ThemeVariable[]) => void;
  onSetNodeThemeOverride: (varName: string, overrideValue: string | null) => void;
  onClearNodeThemeOverrides: () => void;
  onFixDesignLintIssue: (issue: DesignLintIssue) => void;
  onFixAllDesignLint: () => number;
  onCollapse?: () => void;
  seoMetadata: SeoMetadata;
  onChangeSeo: (field: keyof SeoMetadata, value: string) => void;
  onAddNodeComment: (nodeId: string, text: string) => void;
  onDeleteNodeComment: (nodeId: string, commentId: string) => void;
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
  onUpdateNodeCustomCss: (nodeId: string, nextCss: string) => void;
  onUpdateNodeMaterialMeta: (
    nodeId: string,
    updater: (curr: MaterialNodeMeta) => MaterialNodeMeta
  ) => void;
  onInsertBlueprint: (blueprint: NodeBlueprint, label: string) => void;
}

interface SmartLayoutSuggestion {
  name: string;
  description: string;
  classes: string;
  patternType: string;
}

function loadInitialInspectorTab(): InspectorTab {
  try {
    const saved = localStorage.getItem(INSPECTOR_TAB_STORAGE_KEY);
    if (
      saved === 'properties' ||
      saved === 'grid-layout' ||
      saved === 'custom-styles' ||
      saved === 'devtools' ||
      saved === 'shortcuts'
    ) {
      return saved;
    }
  } catch {
    // Ignore localStorage access errors
  }
  return 'properties';
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

const TRANSITION_PROPERTY_OPTIONS = [
  { cls: 'transition', label: 'Standardowa (transition)' },
  { cls: 'transition-all', label: 'Wszystkie (transition-all)' },
  { cls: 'transition-colors', label: 'Kolory (transition-colors)' },
  { cls: 'transition-transform', label: 'Transformacje (transition-transform)' },
  { cls: 'transition-opacity', label: 'Krycie (transition-opacity)' },
  { cls: 'transition-shadow', label: 'Cień (transition-shadow)' },
  { cls: 'transition-none', label: 'Wyłączona (transition-none)' },
] as const;

const TRANSITION_DURATION_OPTIONS = [
  { cls: 'duration-75', label: 'duration-75' },
  { cls: 'duration-100', label: 'duration-100' },
  { cls: 'duration-150', label: 'duration-150' },
  { cls: 'duration-200', label: 'duration-200' },
  { cls: 'duration-300', label: 'duration-300' },
  { cls: 'duration-500', label: 'duration-500' },
  { cls: 'duration-700', label: 'duration-700' },
  { cls: 'duration-1000', label: 'duration-1000' },
] as const;

const TRANSITION_EASING_OPTIONS = [
  { cls: 'ease-linear', label: 'ease-linear' },
  { cls: 'ease-in', label: 'ease-in' },
  { cls: 'ease-out', label: 'ease-out' },
  { cls: 'ease-in-out', label: 'ease-in-out' },
] as const;

const HOVER_TRANSFORM_OPTIONS = [
  { cls: 'hover:scale-105', label: 'Powiększ 105% (hover:scale-105)' },
  { cls: 'hover:scale-110', label: 'Powiększ 110% (hover:scale-110)' },
  { cls: 'hover:scale-95', label: 'Zmniejsz 95% (hover:scale-95)' },
  { cls: 'hover:-translate-y-0.5', label: 'Unieś lekko (hover:-translate-y-0.5)' },
  { cls: 'hover:-translate-y-1', label: 'Unieś wyżej (hover:-translate-y-1)' },
  { cls: 'active:scale-95', label: 'Wciśnięcie (active:scale-95)' },
] as const;

const KEYFRAME_ANIMATION_OPTIONS = [
  { cls: 'animate-none', label: 'Brak animacji (animate-none)' },
  { cls: 'animate-pulse', label: 'Pulsowanie (animate-pulse)' },
  { cls: 'animate-bounce', label: 'Odbijanie (animate-bounce)' },
  { cls: 'animate-ping', label: 'Impuls (animate-ping)' },
  { cls: 'animate-spin', label: 'Obrót (animate-spin)' },
] as const;

const HORIZONTAL_ALIGNMENT_ACTIONS = [
  {
    align: 'left',
    label: 'Przypnij do lewej',
    icon: AlignStartVertical,
  },
  {
    align: 'center',
    label: 'Wyśrodkuj poziomo',
    icon: AlignCenterVertical,
  },
  {
    align: 'right',
    label: 'Przypnij do prawej',
    icon: AlignEndVertical,
  },
] as const;

const VERTICAL_ALIGNMENT_ACTIONS = [
  {
    align: 'top',
    label: 'Przypnij do góry',
    icon: AlignStartHorizontal,
  },
  {
    align: 'middle',
    label: 'Wyśrodkuj pionowo',
    icon: AlignCenterHorizontal,
  },
  {
    align: 'bottom',
    label: 'Przypnij do dołu',
    icon: AlignEndHorizontal,
  },
] as const;

export function InspectorPanel({
  selectedId,
  selectedIds,
  selectedNode,
  nodes,
  onUpdateNode,
  onBulkUpdateClassName,
  onAppendBulkClasses,
  onClearMultiSelect,
  onBulkDeleteNodes,
  onChangeVariant,
  onReplaceNodes,
  onUpdateNodeClassById,
  onSelectNode,
  onAddGridNode,
  onDuplicateNode,
  onDeleteNode,
  onSaveAsComponent,
  showShortcutsModal,
  onToggleShortcutsModal,
  themeVars,
  onAddThemeVar,
  onUpdateThemeVar,
  onDeleteThemeVar,
  onReplaceThemeVars,
  onSetNodeThemeOverride,
  onClearNodeThemeOverrides,
  onFixDesignLintIssue,
  onFixAllDesignLint,
  onCollapse,
  seoMetadata,
  onChangeSeo,
  onAddNodeComment,
  onDeleteNodeComment,
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
  onUpdateNodeCustomCss,
  onUpdateNodeMaterialMeta,
  onInsertBlueprint,
}: InspectorPanelProps) {
  const [inspectorTab, setInspectorTab] = useState<InspectorTab>(
    loadInitialInspectorTab
  );
  const [showIndividualSides, setShowIndividualSides] = useState(false);
  const [showAddVar, setShowAddVar] = useState(false);
  const [showImportTheme, setShowImportTheme] = useState(false);
  const [importThemeDraft, setImportThemeDraft] = useState('');
  const [importThemeError, setImportThemeError] = useState('');
  const [themeStatusMessage, setThemeStatusMessage] = useState('');
  const [savedNotice, setSavedNotice] = useState(false);
  const [smartLayoutGoal, setSmartLayoutGoal] = useState('');
  const [smartLayoutSuggestions, setSmartLayoutSuggestions] = useState<
    SmartLayoutSuggestion[]
  >([]);
  const [isGeneratingLayout, setIsGeneratingLayout] = useState(false);
  const [smartLayoutError, setSmartLayoutError] = useState('');
  const themeFileInputRef = useRef<HTMLInputElement | null>(null);
  const [newVarName, setNewVarName] = useState('');
  const [newVarCategory, setNewVarCategory] =
    useState<ThemeVarCategory>('color');
  const [newVarValue, setNewVarValue] = useState('#7c3aed');
  const [bulkCustomClasses, setBulkCustomClasses] = useState('');
  const [aiThemePrompt, setAiThemePrompt] = useState('');
  const [aiBaseColor, setAiBaseColor] = useState('#d97706');
  const [useAiBaseColor, setUseAiBaseColor] = useState(false);
  const [isGeneratingThemePalette, setIsGeneratingThemePalette] =
    useState(false);
  const [aiThemePalette, setAiThemePalette] =
    useState<GeneratedThemePalette | null>(null);
  const [aiThemeError, setAiThemeError] = useState('');
  const [commentDraft, setCommentDraft] = useState('');

  useEffect(() => {
    try {
      localStorage.setItem(INSPECTOR_TAB_STORAGE_KEY, inspectorTab);
    } catch {
      // Ignore storage errors
    }
  }, [inspectorTab]);

  useEffect(() => {
    setSmartLayoutSuggestions([]);
    setSmartLayoutError('');
    setSavedNotice(false);
    setCommentDraft('');
  }, [selectedId]);

  const activeThemePresetId = detectMatchingThemePresetId(themeVars, THEME_PRESETS);

  const handleSuggestSmartLayout = async (goalOverride?: string) => {
    if (!selectedNode || (selectedNode.type !== 'Container' && selectedNode.type !== 'Grid')) {
      return;
    }
    const activeGoal = (goalOverride ?? smartLayoutGoal).trim();
    if (goalOverride !== undefined) {
      setSmartLayoutGoal(goalOverride);
    }
    setIsGeneratingLayout(true);
    setSmartLayoutError('');

    try {
      const response = await fetch('/api/ai/smart-layout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          node: {
            id: selectedNode.id,
            type: selectedNode.type,
            name: selectedNode.name,
            className: selectedNode.props.className || '',
            childrenSummary: (selectedNode.children || [])
              .map((cid) => nodes[cid])
              .filter((child): child is EditorNode => Boolean(child))
              .map((child) => ({
                type: child.type,
                name: child.name,
                content:
                  child.content ||
                  child.props.placeholder ||
                  child.props.iconName ||
                  '',
              })),
          },
          goal: activeGoal,
        }),
      });

      const payload = (await response.json()) as {
        suggestions?: SmartLayoutSuggestion[];
        error?: string;
      };

      if (!response.ok) {
        setSmartLayoutSuggestions([]);
        setSmartLayoutError(
          payload.error || 'Nie udało się pobrać sugestii Smart Layout.'
        );
        return;
      }

      setSmartLayoutSuggestions(
        Array.isArray(payload.suggestions) ? payload.suggestions : []
      );
    } catch {
      setSmartLayoutSuggestions([]);
      setSmartLayoutError(
        'Błąd połączenia z serwerem podczas generowania Smart Layout.'
      );
    } finally {
      setIsGeneratingLayout(false);
    }
  };

  const handleGenerateThemePalette = async (promptOverride?: string) => {
    const activePrompt = (promptOverride ?? aiThemePrompt).trim();
    if (promptOverride !== undefined) {
      setAiThemePrompt(promptOverride);
    }

    if (!activePrompt && !useAiBaseColor) {
      setAiThemeError(
        'Podaj opis stylu (np. "warm autumn") lub włącz kolor bazowy.'
      );
      return;
    }

    setIsGeneratingThemePalette(true);
    setAiThemeError('');

    try {
      const response = await fetch('/api/ai/theme-palette', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: activePrompt,
          baseColor: useAiBaseColor ? aiBaseColor : '',
          currentVariables: themeVars,
        }),
      });

      const payload = (await response.json()) as {
        palette?: GeneratedThemePalette;
        error?: string;
      };

      if (!response.ok || !payload.palette) {
        setAiThemePalette(null);
        setAiThemeError(
          payload.error || 'Nie udało się wygenerować palety kolorów AI.'
        );
        return;
      }

      setAiThemePalette(payload.palette);
    } catch {
      setAiThemePalette(null);
      setAiThemeError(
        'Błąd połączenia z serwerem podczas generowania palety AI.'
      );
    } finally {
      setIsGeneratingThemePalette(false);
    }
  };

  const showTemporaryThemeStatus = (msg: string) => {
    setThemeStatusMessage(msg);
    window.setTimeout(() => {
      setThemeStatusMessage((curr) => (curr === msg ? '' : curr));
    }, 2400);
  };

  const applyImportedThemeText = (rawText: string) => {
    const parsed = parseImportedTheme(rawText);
    if (!parsed.ok) {
      setImportThemeError(parsed.error);
      return;
    }
    setImportThemeError('');
    onReplaceThemeVars(parsed.variables);
    setImportThemeDraft('');
    setShowImportTheme(false);
    showTemporaryThemeStatus(
      `Zaimportowano ${parsed.variables.length} zmiennych motywu`
    );
  };

  const activeIds =
    selectedIds.length > 1
      ? selectedIds.filter((id) => Boolean(nodes[id]))
      : selectedNode
        ? [selectedId]
        : [];
  const isMultiSelect = activeIds.length > 1;

  const classNameValue = selectedNode?.props.className || '';
  const classTokens = classNameValue.split(/\s+/).filter(Boolean);

  const applyClassUpdate = (
    updater: (currClass: string, node: EditorNode) => string
  ) => {
    if (isMultiSelect) {
      onBulkUpdateClassName(updater);
    } else if (selectedNode) {
      onUpdateNode('className', updater(classNameValue, selectedNode), true);
    }
  };

  const readSpacing = (prefix: SpacingPrefix): string =>
    isMultiSelect
      ? getSharedSpacingValueAcrossNodes(nodes, activeIds, prefix)
      : getTailwindSpacingValue(classNameValue, prefix);

  const readGroupToken = (groupClasses: readonly string[]): string =>
    isMultiSelect
      ? getSharedGroupTokenAcrossNodes(nodes, activeIds, groupClasses)
      : getTailwindGroupToken(classNameValue, groupClasses);

  const hasSideTokens = (
    ['pt', 'pr', 'pb', 'pl', 'mt', 'mr', 'mb', 'ml'] as SpacingPrefix[]
  ).some((prefix) => Boolean(readSpacing(prefix)));

  const sidesVisible = showIndividualSides || hasSideTokens;

  const handleSpacingChange = (prefix: SpacingPrefix, value: string) => {
    applyClassUpdate((curr) => setTailwindSpacingValue(curr, prefix, value));
  };

  const activeTextAlign = readGroupToken(TEXT_ALIGN_CLASSES);
  const activeFontWeight = readGroupToken(FONT_WEIGHT_CLASSES);
  const activeTextColor = isMultiSelect
    ? getSharedTextColorAcrossNodes(nodes, activeIds)
    : getTailwindTextColor(classNameValue);

  const activeShadow = readGroupToken(BOX_SHADOW_CLASSES);
  const hasShadow = Boolean(activeShadow && activeShadow !== 'shadow-none');

  const activeRadius = readGroupToken(BORDER_RADIUS_CLASSES);
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

  const parentNode =
    selectedNode?.parentId ? nodes[selectedNode.parentId] : undefined;
  const parentClassName = parentNode?.props.className || '';
  const alignmentState = getNodeAlignmentState(classNameValue, parentClassName);
  const canAlignToParent = Boolean(
    !isMultiSelect && selectedNode && selectedId !== 'root' && parentNode
  );
  const hasAnyAlignment = Boolean(
    alignmentState.horizontal || alignmentState.vertical
  );

  const activeTransitionProp = readGroupToken(TRANSITION_PROPERTY_CLASSES);
  const activeTransitionDuration = readGroupToken(TRANSITION_DURATION_CLASSES);
  const activeTransitionEasing = readGroupToken(TRANSITION_EASING_CLASSES);
  const activeHoverTransform = readGroupToken(HOVER_TRANSFORM_CLASSES);
  const activeKeyframeAnimation = readGroupToken(KEYFRAME_ANIMATION_CLASSES);
  const hasAnyAnimation = Boolean(
    activeTransitionProp ||
      activeTransitionDuration ||
      activeTransitionEasing ||
      activeHoverTransform ||
      activeKeyframeAnimation
  );

  return (
    <aside
      data-testid="inspector-sidebar"
      className="w-[356px] bg-white border-l border-slate-200 flex flex-col shrink-0 z-20"
    >
      <div className="h-14 px-3.5 border-b border-slate-200 flex items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <h2 className="font-bold text-sm text-slate-900">Inspektor</h2>
          {isMultiSelect ? (
            <span className="text-xs font-semibold text-violet-700">
              {activeIds.length} zazn.
            </span>
          ) : (
            selectedNode && (
              <span className="text-xs text-slate-500 font-mono truncate">
                {selectedNode.type}
              </span>
            )
          )}
        </div>
        {onCollapse && (
          <button
            type="button"
            data-testid="collapse-right-sidebar-btn"
            onClick={onCollapse}
            title="Ukryj panel Inspektora"
            aria-label="Ukryj Inspektor"
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            <PanelRightClose className="w-4 h-4" />
          </button>
        )}
      </div>

      <div
        role="tablist"
        aria-label="Tryb inspektora"
        className="grid grid-cols-5 p-1 gap-0.5 border-b border-slate-100 bg-slate-50/70 shrink-0"
      >
        <button
          type="button"
          role="tab"
          aria-selected={inspectorTab === 'properties'}
          onClick={() => setInspectorTab('properties')}
          className={`flex flex-col items-center justify-center gap-0.5 py-1.5 px-1 rounded-md text-[9.5px] font-semibold transition-colors whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
            inspectorTab === 'properties'
              ? 'bg-white text-blue-600 shadow-sm border border-slate-200'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <SlidersHorizontal className="w-3.5 h-3.5 shrink-0" />
          Właściwości
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={inspectorTab === 'grid-layout'}
          onClick={() => setInspectorTab('grid-layout')}
          className={`flex flex-col items-center justify-center gap-0.5 py-1.5 px-1 rounded-md text-[9.5px] font-semibold transition-colors whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
            inspectorTab === 'grid-layout'
              ? 'bg-white text-blue-600 shadow-sm border border-slate-200'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <LayoutGrid className="w-3.5 h-3.5 shrink-0" />
          Grid Layout
        </button>
        <button
          type="button"
          role="tab"
          data-testid="tab-custom-styles"
          aria-label="Custom Styles"
          aria-selected={inspectorTab === 'custom-styles'}
          onClick={() => setInspectorTab('custom-styles')}
          className={`flex flex-col items-center justify-center gap-0.5 py-1.5 px-1 rounded-md text-[9.5px] font-semibold transition-colors whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
            inspectorTab === 'custom-styles'
              ? 'bg-white text-blue-600 shadow-sm border border-slate-200'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Palette className="w-3.5 h-3.5 shrink-0" />
          Custom Styles
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={inspectorTab === 'devtools'}
          onClick={() => setInspectorTab('devtools')}
          className={`flex flex-col items-center justify-center gap-0.5 py-1.5 px-1 rounded-md text-[9.5px] font-semibold transition-colors whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
            inspectorTab === 'devtools'
              ? 'bg-white text-blue-600 shadow-sm border border-slate-200'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Code2 className="w-3.5 h-3.5 shrink-0" />
          DevTools
        </button>
        <button
          type="button"
          role="tab"
          title="Keyboard Shortcuts"
          aria-selected={inspectorTab === 'shortcuts'}
          onClick={() => setInspectorTab('shortcuts')}
          className={`flex flex-col items-center justify-center gap-0.5 py-1.5 px-1 rounded-md text-[9.5px] font-semibold transition-colors whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
            inspectorTab === 'shortcuts'
              ? 'bg-white text-blue-600 shadow-sm border border-slate-200'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Keyboard className="w-3.5 h-3.5 shrink-0" />
          Shortcuts
        </button>
      </div>

      {inspectorTab === 'shortcuts' ? (
        <KeyboardShortcutsPanel
          isFloatingModalOpen={showShortcutsModal}
          onOpenFloatingModal={onToggleShortcutsModal}
        />
      ) : inspectorTab === 'grid-layout' ? (
        <GridLayoutPanel
          selectedId={selectedId}
          selectedNode={selectedNode}
          isMultiSelect={isMultiSelect}
          nodes={nodes}
          onUpdateNodeClass={(nextClassName) =>
            onUpdateNode('className', nextClassName, true)
          }
          onUpdateNodeClassById={onUpdateNodeClassById}
          onSelectNode={onSelectNode}
          onAddGridNode={onAddGridNode}
        />
      ) : inspectorTab === 'custom-styles' ? (
        <CustomStylesPanel
          selectedId={selectedId}
          selectedNode={selectedNode}
          isMultiSelect={isMultiSelect}
          nodes={nodes}
          themeVars={themeVars}
          seoMetadata={seoMetadata}
          tailwindVersion={tailwindVersion}
          onChangeTailwindVersion={onChangeTailwindVersion}
          bootstrapVersion={bootstrapVersion}
          onChangeBootstrapVersion={onChangeBootstrapVersion}
          enableMd2={enableMd2}
          onToggleEnableMd2={onToggleEnableMd2}
          enableMd3={enableMd3}
          onToggleEnableMd3={onToggleEnableMd3}
          sharedThemeCss={sharedThemeCss}
          onChangeSharedThemeCss={onChangeSharedThemeCss}
          onUpdateNodeClass={(nextClassName) =>
            onUpdateNode('className', nextClassName, true)
          }
          onUpdateNodeCustomCss={onUpdateNodeCustomCss}
          onUpdateNodeMaterialMeta={onUpdateNodeMaterialMeta}
          onUpdateThemeVar={onUpdateThemeVar}
          onInsertBlueprint={onInsertBlueprint}
        />
      ) : inspectorTab === 'devtools' ? (
        <DevToolsPanel
          selectedId={selectedId}
          selectedNode={selectedNode}
          nodes={nodes}
          themeVars={themeVars}
          onUpdateNode={onUpdateNode}
          onReplaceNodes={onReplaceNodes}
        />
      ) : selectedNode || isMultiSelect ? (
        <div className="p-4 flex-1 overflow-y-auto flex flex-col gap-5">
          {isMultiSelect && (
            <section
              aria-label="Multi-Selection"
              className="p-3 bg-violet-50/90 border border-violet-200 rounded-xl space-y-2"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-violet-900">
                  <ListChecks className="w-3.5 h-3.5 text-violet-600" />
                  Multi-Selection ({activeIds.length})
                </div>
                <button
                  type="button"
                  aria-label="Wyczyść wielokrotne zaznaczenie"
                  onClick={onClearMultiSelect}
                  className="text-[11px] font-medium text-violet-700 hover:text-violet-900 whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 rounded px-1"
                >
                  Wyczyść
                </button>
              </div>
              <div className="flex flex-wrap gap-1">
                {activeIds.map((nodeId) => (
                  <span
                    key={nodeId}
                    className="px-1.5 py-0.5 rounded bg-white border border-violet-200 text-[10px] font-medium text-violet-800 truncate max-w-[120px]"
                  >
                    {nodes[nodeId]?.name || nodes[nodeId]?.type}
                  </span>
                ))}
              </div>
              <p className="text-[11px] text-violet-700/90 leading-snug">
                Zmiany w sekcjach Layout, Typography, Effects, Animations i Theme aktualizują wszystkie zaznaczone elementy.
              </p>
            </section>
          )}

          {!isMultiSelect && selectedNode && (
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
          )}

          {!isMultiSelect &&
            selectedNode &&
            (() => {
              const variants = getComponentVariants(selectedNode.type);
              if (variants.length === 0) return null;
              return (
                <div className="space-y-1.5">
                  <label
                    htmlFor="inspector-node-variant"
                    className="block text-[11px] font-bold text-slate-500 tracking-wide"
                  >
                    Wariant
                  </label>
                  <select
                    id="inspector-node-variant"
                    aria-label="Wariant komponentu"
                    value={selectedNode.variant || ''}
                    onChange={(e) => onChangeVariant(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  >
                    <option value="">Własny / brak</option>
                    {variants.map((variant) => (
                      <option key={variant.id} value={variant.id}>
                        {variant.label}
                      </option>
                    ))}
                  </select>
                </div>
              );
            })()}

          {!isMultiSelect && selectedId !== 'root' && (
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                title="Duplikuj (Ctrl+Alt+D)"
                onClick={onDuplicateNode}
                className="flex items-center justify-center gap-1.5 py-1.5 px-2 bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 rounded-lg text-xs font-medium text-slate-700 hover:text-blue-700 whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              >
                <Files className="w-3.5 h-3.5" /> Kopiuj
              </button>
              <button
                type="button"
                title="Zapisz jako komponent w Saved Components"
                aria-label="Zapisz jako komponent"
                onClick={() => {
                  onSaveAsComponent();
                  setSavedNotice(true);
                  window.setTimeout(() => setSavedNotice(false), 1800);
                }}
                className={`flex items-center justify-center gap-1.5 py-1.5 px-2 border rounded-lg text-xs font-medium whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                  savedNotice
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                    : 'bg-slate-50 hover:bg-blue-50 border-slate-200 hover:border-blue-300 text-slate-700 hover:text-blue-700'
                }`}
              >
                {savedNotice ? (
                  <Check className="w-3.5 h-3.5" />
                ) : (
                  <Bookmark className="w-3.5 h-3.5" />
                )}
                {savedNotice ? 'Zapisano' : 'Zapisz'}
              </button>
            </div>
          )}

          {!isMultiSelect && selectedNode?.type === 'Icon' && (
            <section
              aria-label="Wybór ikony"
              className="space-y-2 p-3 bg-slate-50 rounded-xl border border-slate-200/80"
            >
              <span className="block text-[11px] font-bold text-slate-500 tracking-wide">
                Ikona Lucide ({selectedNode.props.iconName || 'Star'})
              </span>
              <div className="grid grid-cols-6 gap-1.5 max-h-36 overflow-y-auto pr-0.5">
                {ICON_LIBRARY.map(({ name, component: IconComp }) => {
                  const isActive = (selectedNode.props.iconName || 'Star') === name;
                  return (
                    <button
                      key={name}
                      type="button"
                      title={name}
                      aria-label={`Zmień ikonę na ${name}`}
                      aria-pressed={isActive}
                      onClick={() => onUpdateNode('iconName', name, true)}
                      className={`p-1.5 rounded-md border flex items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                        isActive
                          ? 'bg-blue-50 border-blue-300 text-blue-700'
                          : 'bg-white hover:bg-blue-50 border-slate-200 hover:border-blue-300 text-slate-600'
                      }`}
                    >
                      <IconComp className="w-4 h-4" />
                    </button>
                  );
                })}
              </div>
            </section>
          )}

          {!isMultiSelect && selectedNode && (
            <section
              aria-label="Alignment"
              className="space-y-2 p-3 bg-slate-50 rounded-xl border border-slate-200/80"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <h3 className="text-[11px] font-bold text-slate-500 tracking-wide">
                    Alignment
                  </h3>
                  {canAlignToParent && (
                    <span className="text-[10px] font-mono text-slate-400">
                      {alignmentState.layoutKind}
                    </span>
                  )}
                </div>
                {canAlignToParent && hasAnyAlignment && (
                  <button
                    type="button"
                    aria-label="Resetuj wyrównanie"
                    onClick={() =>
                      onUpdateNode(
                        'className',
                        clearNodeAlignment(classNameValue),
                        true
                      )
                    }
                    className="inline-flex items-center gap-1 text-[10px] font-medium text-blue-600 hover:text-blue-700 whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded px-1"
                  >
                    <RotateCcw className="w-2.5 h-2.5" />
                    Reset
                  </button>
                )}
              </div>

              <div
                role="toolbar"
                aria-label="Szybkie wyrównanie w kontenerze"
                className="flex items-center justify-between gap-0.5 p-1 bg-white border border-slate-200 rounded-lg"
              >
                {HORIZONTAL_ALIGNMENT_ACTIONS.map(({ align, label, icon: Icon }) => {
                  const isActive =
                    canAlignToParent && alignmentState.horizontal === align;
                  return (
                    <button
                      key={align}
                      type="button"
                      disabled={!canAlignToParent}
                      title={label}
                      aria-label={label}
                      aria-pressed={isActive}
                      onClick={() => {
                        const updated = setNodeHorizontalAlignment(
                          classNameValue,
                          parentClassName,
                          isActive ? '' : align
                        );
                        onUpdateNode('className', updated, true);
                      }}
                      className={`flex-1 flex items-center justify-center py-1.5 rounded-md transition-colors disabled:opacity-35 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                        isActive
                          ? 'bg-blue-50 text-blue-700 ring-1 ring-blue-300'
                          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                    </button>
                  );
                })}

                <div className="w-px h-4 bg-slate-200 mx-0.5 shrink-0" aria-hidden="true" />

                {VERTICAL_ALIGNMENT_ACTIONS.map(({ align, label, icon: Icon }) => {
                  const isActive =
                    canAlignToParent && alignmentState.vertical === align;
                  return (
                    <button
                      key={align}
                      type="button"
                      disabled={!canAlignToParent}
                      title={label}
                      aria-label={label}
                      aria-pressed={isActive}
                      onClick={() => {
                        const updated = setNodeVerticalAlignment(
                          classNameValue,
                          parentClassName,
                          isActive ? '' : align
                        );
                        onUpdateNode('className', updated, true);
                      }}
                      className={`flex-1 flex items-center justify-center py-1.5 rounded-md transition-colors disabled:opacity-35 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                        isActive
                          ? 'bg-blue-50 text-blue-700 ring-1 ring-blue-300'
                          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                    </button>
                  );
                })}

                <div className="w-px h-4 bg-slate-200 mx-0.5 shrink-0" aria-hidden="true" />

                <button
                  type="button"
                  disabled={!canAlignToParent}
                  title="Wyśrodkuj w rodzicu (poziomo i pionowo)"
                  aria-label="Wyśrodkuj w rodzicu"
                  aria-pressed={
                    canAlignToParent &&
                    alignmentState.horizontal === 'center' &&
                    alignmentState.vertical === 'middle'
                  }
                  onClick={() => {
                    const isBothCentered =
                      alignmentState.horizontal === 'center' &&
                      alignmentState.vertical === 'middle';
                    const updated = isBothCentered
                      ? clearNodeAlignment(classNameValue)
                      : centerNodeInParent(classNameValue, parentClassName);
                    onUpdateNode('className', updated, true);
                  }}
                  className={`flex-1 flex items-center justify-center py-1.5 rounded-md transition-colors disabled:opacity-35 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                    canAlignToParent &&
                    alignmentState.horizontal === 'center' &&
                    alignmentState.vertical === 'middle'
                      ? 'bg-blue-50 text-blue-700 ring-1 ring-blue-300'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <Crosshair className="w-3.5 h-3.5" />
                </button>
              </div>

              {!canAlignToParent && (
                <p className="text-[10px] text-slate-400">
                  Zaznacz element potomny, aby przypiąć go do krawędzi rodzica.
                </p>
              )}
            </section>
          )}

          {!isMultiSelect &&
            selectedNode &&
            (selectedNode.type === 'Container' ||
              selectedNode.type === 'Grid') && (
              <section
                aria-label="Smart Layout"
                className="space-y-2.5 p-3 bg-indigo-50/50 rounded-xl border border-indigo-200/80"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                    <h3 className="text-[11px] font-bold text-indigo-950 tracking-wide">
                      Smart Layout
                    </h3>
                  </div>
                  <span className="px-1.5 py-0.5 rounded bg-indigo-100 text-[10px] font-semibold text-indigo-700">
                    AI
                  </span>
                </div>

                <div className="flex flex-wrap gap-1">
                  {[
                    'Centered card',
                    'Sidebar-content layout',
                    'Header row',
                    'Auto-align center',
                    'Justify-between row',
                  ].map((presetLabel) => (
                    <button
                      key={presetLabel}
                      type="button"
                      disabled={isGeneratingLayout}
                      onClick={() => void handleSuggestSmartLayout(presetLabel)}
                      className="px-2 py-0.5 bg-white hover:bg-indigo-100/70 border border-indigo-200 rounded text-[10px] font-medium text-indigo-800 transition-colors disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                    >
                      {presetLabel}
                    </button>
                  ))}
                </div>

                <div className="flex gap-1.5">
                  <input
                    type="text"
                    aria-label="Cel układu Smart Layout"
                    placeholder="np. Centered card, items-center, justify-between..."
                    value={smartLayoutGoal}
                    onChange={(e) => setSmartLayoutGoal(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        void handleSuggestSmartLayout();
                      }
                    }}
                    className="flex-1 min-w-0 px-2.5 py-1.5 bg-white border border-indigo-200 rounded-md text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <button
                    type="button"
                    aria-label="Zaproponuj układ Smart Layout AI"
                    disabled={isGeneratingLayout}
                    onClick={() => void handleSuggestSmartLayout()}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white text-[11px] font-semibold rounded-md transition-colors whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 shrink-0"
                  >
                    {isGeneratingLayout ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Sparkles className="w-3.5 h-3.5" />
                    )}
                    {isGeneratingLayout ? 'Analiza...' : 'Sugeruj'}
                  </button>
                </div>

                {smartLayoutError && (
                  <p
                    role="alert"
                    className="p-2 rounded-lg bg-red-50 border border-red-200 text-[11px] text-red-700 leading-snug"
                  >
                    {smartLayoutError}
                  </p>
                )}

                {smartLayoutSuggestions.length > 0 && (
                  <div className="space-y-1.5">
                    {smartLayoutSuggestions.map((item) => (
                      <div
                        key={`${item.name}-${item.classes}`}
                        className="p-2 bg-white border border-indigo-200/80 rounded-lg space-y-1.5"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <div className="text-xs font-semibold text-slate-800 truncate">
                              {item.name}
                            </div>
                            {item.description && (
                              <p className="text-[10px] text-slate-500 leading-snug">
                                {item.description}
                              </p>
                            )}
                          </div>
                          <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 shrink-0">
                            {item.patternType}
                          </span>
                        </div>
                        <code className="block text-[10px] font-mono text-slate-700 bg-slate-50 border border-slate-200/80 rounded px-1.5 py-1 break-words">
                          {item.classes}
                        </code>
                        <button
                          type="button"
                          onClick={() => {
                            const updated = applySmartLayoutClasses(
                              selectedNode.props.className || '',
                              item.classes
                            );
                            onUpdateNode('className', updated, true);
                          }}
                          className="w-full py-1 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded text-[11px] font-semibold text-indigo-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                        >
                          Zastosuj układ
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            )}

          {!isMultiSelect && selectedNode?.type === 'Container' && (
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

          {!isMultiSelect && selectedNode?.type === 'Container' && (
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

          {!isMultiSelect && selectedNode?.type === 'Grid' && (
            <div className="space-y-2.5 p-3 bg-slate-50 rounded-xl border border-slate-200/80">
              <div className="flex items-center justify-between gap-2">
                <span className="block text-[11px] font-bold text-slate-500 tracking-wide">
                  Kolumny Grid
                </span>
                <button
                  type="button"
                  onClick={() => setInspectorTab('grid-layout')}
                  className="text-[11px] font-medium text-blue-600 hover:text-blue-700 whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded px-1"
                >
                  Pełny Grid Layout
                </button>
              </div>
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
                      value={readSpacing(prefix)}
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
                        value={readSpacing(prefix)}
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
                      value={readSpacing(prefix)}
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
                        value={readSpacing(prefix)}
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

            {isMultiSelect ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!bulkCustomClasses.trim()) return;
                  onAppendBulkClasses(bulkCustomClasses);
                  setBulkCustomClasses('');
                }}
                className="space-y-1.5 pt-2 border-t border-slate-200/70"
              >
                <label
                  htmlFor="inspector-layout-bulk-classes"
                  className="block text-[11px] font-semibold text-slate-600"
                >
                  Custom Classes (Bulk)
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    id="inspector-layout-bulk-classes"
                    type="text"
                    value={bulkCustomClasses}
                    onChange={(e) => setBulkCustomClasses(e.target.value)}
                    placeholder="np. tracking-wide border"
                    className="flex-1 min-w-0 px-2.5 py-1.5 bg-white border border-slate-200 rounded-md text-xs font-mono text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="submit"
                    disabled={!bulkCustomClasses.trim()}
                    className="px-2.5 py-1.5 bg-violet-600 hover:bg-violet-700 disabled:opacity-40 text-white text-xs font-semibold rounded-md transition-colors whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
                  >
                    Zastosuj
                  </button>
                </div>
              </form>
            ) : (
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
            )}
          </section>

          {(isMultiSelect || selectedNode?.type !== 'Image') && (
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
                          applyClassUpdate((curr) =>
                            toggleTailwindGroup(
                              curr,
                              [...TEXT_ALIGN_CLASSES],
                              isActive ? '' : cls
                            )
                          );
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
                    const nextWeight = e.target.value;
                    applyClassUpdate((curr) =>
                      toggleTailwindGroup(
                        curr,
                        [...FONT_WEIGHT_CLASSES],
                        nextWeight
                      )
                    );
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
                          applyClassUpdate((curr) => setTailwindTextColor(curr, ''))
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
                        data-preserve-swatch="true"
                        title={`${label} (${cls})`}
                        aria-label={`Kolor tekstu ${label}`}
                        aria-pressed={isActive}
                        onClick={() => {
                          applyClassUpdate((curr) =>
                            setTailwindTextColor(curr, isActive ? '' : cls)
                          );
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
                    applyClassUpdate((curr) =>
                      toggleTailwindGroup(
                        curr,
                        [...BOX_SHADOW_CLASSES],
                        hasShadow ? '' : 'shadow-md'
                      )
                    );
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
                        applyClassUpdate((curr) =>
                          toggleTailwindGroup(
                            curr,
                            [...BOX_SHADOW_CLASSES],
                            isActive ? '' : opt.cls
                          )
                        );
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
                    applyClassUpdate((curr) =>
                      toggleTailwindGroup(
                        curr,
                        [...BORDER_RADIUS_CLASSES],
                        hasRadius ? '' : 'rounded-lg'
                      )
                    );
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
                        applyClassUpdate((curr) =>
                          toggleTailwindGroup(
                            curr,
                            [...BORDER_RADIUS_CLASSES],
                            isActive ? '' : opt.cls
                          )
                        );
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
            aria-label="Animations"
            className="space-y-2.5 p-3 bg-slate-50 rounded-xl border border-slate-200/80"
          >
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-[11px] font-bold text-slate-500 tracking-wide">
                Animations
              </h3>
              {hasAnyAnimation && (
                <button
                  type="button"
                  aria-label="Resetuj animacje"
                  onClick={() => {
                    applyClassUpdate((curr) =>
                      toggleTailwindGroup(
                        toggleTailwindGroup(
                          toggleTailwindGroup(
                            toggleTailwindGroup(
                              toggleTailwindGroup(
                                curr,
                                [...TRANSITION_PROPERTY_CLASSES],
                                ''
                              ),
                              [...TRANSITION_DURATION_CLASSES],
                              ''
                            ),
                            [...TRANSITION_EASING_CLASSES],
                            ''
                          ),
                          [...HOVER_TRANSFORM_CLASSES],
                          ''
                        ),
                        [...KEYFRAME_ANIMATION_CLASSES],
                        ''
                      )
                    );
                  }}
                  className="inline-flex items-center gap-1 text-[10px] font-medium text-blue-600 hover:text-blue-700 whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded px-1"
                >
                  <RotateCcw className="w-2.5 h-2.5" />
                  Reset
                </button>
              )}
            </div>

            <label className="block space-y-1">
              <span className="block text-[10px] font-semibold text-slate-600">
                Transition
              </span>
              <select
                id="inspector-anim-transition"
                aria-label="Typ przejścia"
                value={activeTransitionProp}
                onChange={(e) => {
                  const val = e.target.value;
                  applyClassUpdate((curr) =>
                    toggleTailwindGroup(
                      curr,
                      [...TRANSITION_PROPERTY_CLASSES],
                      val
                    )
                  );
                }}
                className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-md text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Domyślne (brak)</option>
                {TRANSITION_PROPERTY_OPTIONS.map((opt) => (
                  <option key={opt.cls} value={opt.cls}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </label>

            <div className="grid grid-cols-2 gap-1.5">
              <label className="block space-y-1">
                <span className="block text-[10px] font-semibold text-slate-600">
                  Duration
                </span>
                <select
                  id="inspector-anim-duration"
                  aria-label="Czas trwania animacji"
                  value={activeTransitionDuration}
                  onChange={(e) => {
                    const val = e.target.value;
                    applyClassUpdate((curr) =>
                      toggleTailwindGroup(
                        curr,
                        [...TRANSITION_DURATION_CLASSES],
                        val
                      )
                    );
                  }}
                  className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-md text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Domyślny</option>
                  {TRANSITION_DURATION_OPTIONS.map((opt) => (
                    <option key={opt.cls} value={opt.cls}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block space-y-1">
                <span className="block text-[10px] font-semibold text-slate-600">
                  Easing
                </span>
                <select
                  id="inspector-anim-easing"
                  aria-label="Krzywa przejścia"
                  value={activeTransitionEasing}
                  onChange={(e) => {
                    const val = e.target.value;
                    applyClassUpdate((curr) =>
                      toggleTailwindGroup(
                        curr,
                        [...TRANSITION_EASING_CLASSES],
                        val
                      )
                    );
                  }}
                  className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-md text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Domyślna</option>
                  {TRANSITION_EASING_OPTIONS.map((opt) => (
                    <option key={opt.cls} value={opt.cls}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <label className="block space-y-1">
              <span className="block text-[10px] font-semibold text-slate-600">
                Hover / Active Transform
              </span>
              <select
                id="inspector-anim-hover"
                aria-label="Transformacja przy najechaniu"
                value={activeHoverTransform}
                onChange={(e) => {
                  const val = e.target.value;
                  applyClassUpdate((curr) =>
                    toggleTailwindGroup(
                      curr,
                      [...HOVER_TRANSFORM_CLASSES],
                      val
                    )
                  );
                }}
                className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-md text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Brak</option>
                {HOVER_TRANSFORM_OPTIONS.map((opt) => (
                  <option key={opt.cls} value={opt.cls}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="block space-y-1">
              <span className="block text-[10px] font-semibold text-slate-600">
                Animation
              </span>
              <select
                id="inspector-anim-keyframe"
                aria-label="Animacja kluczowa"
                value={activeKeyframeAnimation}
                onChange={(e) => {
                  const val = e.target.value;
                  applyClassUpdate((curr) =>
                    toggleTailwindGroup(
                      curr,
                      [...KEYFRAME_ANIMATION_CLASSES],
                      val
                    )
                  );
                }}
                className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-md text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Brak</option>
                {KEYFRAME_ANIMATION_OPTIONS.map((opt) => (
                  <option key={opt.cls} value={opt.cls}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </label>
          </section>

          <ThemeUsageDashboard
            selectedNode={selectedNode}
            isMultiSelect={isMultiSelect}
            nodes={nodes}
            themeVars={themeVars}
            onSetLocalOverride={onSetNodeThemeOverride}
            onClearAllLocalOverrides={onClearNodeThemeOverrides}
            onAttachThemeVarClass={(varItem, mode) => {
              if (mode === 'bg') {
                applyClassUpdate((curr) =>
                  setTailwindBgColor(curr, `bg-[var(${varItem.name})]`)
                );
              } else if (mode === 'size') {
                applyClassUpdate((curr) =>
                  setTailwindFontSize(
                    curr,
                    `text-[length:var(${varItem.name})]`
                  )
                );
              } else {
                applyClassUpdate((curr) =>
                  setTailwindTextColor(curr, `text-[var(${varItem.name})]`)
                );
              }
            }}
          />

          <section
            aria-label="Theme"
            className="space-y-3 p-3 bg-slate-50 rounded-xl border border-slate-200/80"
          >
            <div className="flex items-center justify-between gap-1.5">
              <h3 className="text-[11px] font-bold text-slate-500 tracking-wide">
                Theme
              </h3>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  aria-expanded={showImportTheme}
                  onClick={() => {
                    setShowImportTheme((prev) => !prev);
                    setShowAddVar(false);
                    setImportThemeError('');
                  }}
                  className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-600 hover:text-slate-900 whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded px-1.5 py-0.5 bg-white border border-slate-200"
                >
                  <Upload className="w-3 h-3" />
                  {showImportTheme ? 'Zamknij' : 'Importuj'}
                </button>
                <button
                  type="button"
                  title="Eksportuj zmienne motywu do JSON"
                  aria-label="Eksportuj motyw JSON"
                  onClick={() => {
                    downloadTextFile(
                      serializeThemeVariablesToJson(themeVars),
                      'theme-tokens.json',
                      'application/json;charset=utf-8'
                    );
                    showTemporaryThemeStatus('Wyeksportowano theme-tokens.json');
                  }}
                  className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-600 hover:text-slate-900 whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded px-1.5 py-0.5 bg-white border border-slate-200"
                >
                  <Download className="w-3 h-3" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddVar((prev) => !prev);
                    setShowImportTheme(false);
                  }}
                  className="inline-flex items-center gap-1 text-[11px] font-medium text-blue-600 hover:text-blue-700 whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded px-1"
                >
                  <Plus className="w-3 h-3" />
                  {showAddVar ? 'Anuluj' : 'Dodaj'}
                </button>
              </div>
            </div>

            {themeStatusMessage && (
              <div
                role="status"
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-medium"
              >
                <Check className="w-3.5 h-3.5 shrink-0" />
                <span>{themeStatusMessage}</span>
              </div>
            )}

            <div
              data-testid="ai-theme-palette-card"
              className="p-2.5 rounded-lg bg-indigo-50/50 border border-indigo-200/80 space-y-2"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                  <span className="text-[11px] font-bold text-indigo-950">
                    Generator palety AI
                  </span>
                </div>
                <span className="px-1.5 py-0.5 rounded bg-indigo-100 text-[10px] font-semibold text-indigo-700">
                  AI
                </span>
              </div>

              <div className="flex flex-wrap gap-1">
                {['warm autumn', 'cyberpunk neon', 'nordic sage'].map(
                  (presetPrompt) => (
                    <button
                      key={presetPrompt}
                      type="button"
                      disabled={isGeneratingThemePalette}
                      onClick={() => void handleGenerateThemePalette(presetPrompt)}
                      className="px-2 py-0.5 bg-white hover:bg-indigo-100/70 border border-indigo-200 rounded text-[10px] font-medium text-indigo-800 transition-colors disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                    >
                      {presetPrompt}
                    </button>
                  )
                )}
              </div>

              <div className="flex gap-1.5">
                <input
                  type="text"
                  data-testid="ai-theme-prompt-input"
                  aria-label="Opis palety kolorów AI"
                  placeholder="np. warm autumn, cyberpunk neon..."
                  value={aiThemePrompt}
                  onChange={(e) => setAiThemePrompt(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      void handleGenerateThemePalette();
                    }
                  }}
                  className="flex-1 min-w-0 px-2 py-1.5 bg-white border border-indigo-200 rounded-md text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  type="button"
                  data-testid="ai-theme-generate-btn"
                  aria-label="Generuj paletę kolorów AI"
                  disabled={isGeneratingThemePalette}
                  onClick={() => void handleGenerateThemePalette()}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white text-[11px] font-semibold rounded-md transition-colors whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 shrink-0"
                >
                  {isGeneratingThemePalette ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Sparkles className="w-3.5 h-3.5" />
                  )}
                  {isGeneratingThemePalette ? 'Tworzę...' : 'Generuj'}
                </button>
              </div>

              <div className="flex items-center justify-between gap-2 pt-0.5">
                <label className="inline-flex items-center gap-1.5 text-[10px] font-medium text-slate-600 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    data-testid="ai-theme-base-color-toggle"
                    checked={useAiBaseColor}
                    onChange={(e) => setUseAiBaseColor(e.target.checked)}
                    className="rounded border-indigo-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>Kolor bazowy</span>
                </label>

                {useAiBaseColor && (
                  <div className="flex items-center gap-1.5">
                    <input
                      type="color"
                      data-testid="ai-theme-base-color-input"
                      aria-label="Wybierz kolor bazowy palety AI"
                      value={aiBaseColor}
                      onChange={(e) => setAiBaseColor(e.target.value)}
                      className="w-6 h-5 rounded border border-indigo-200 cursor-pointer bg-white p-0.5"
                    />
                    <span className="text-[10px] font-mono text-slate-600">
                      {aiBaseColor}
                    </span>
                  </div>
                )}
              </div>

              {aiThemeError && (
                <p
                  role="alert"
                  data-testid="ai-theme-error"
                  className="p-2 rounded-md bg-red-50 border border-red-200 text-[11px] text-red-700 leading-snug"
                >
                  {aiThemeError}
                </p>
              )}

              {aiThemePalette && (
                <div
                  data-testid="ai-theme-preview"
                  className="p-2 bg-white border border-indigo-200/80 rounded-lg space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-slate-800 truncate">
                        {aiThemePalette.paletteName}
                      </div>
                      {aiThemePalette.rationale && (
                        <p className="text-[10px] text-slate-500 leading-snug">
                          {aiThemePalette.rationale}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="space-y-1">
                    {aiThemePalette.colors.map((c) => (
                      <div
                        key={c.name}
                        className="flex items-center justify-between gap-2 text-[10px] py-0.5"
                      >
                        <div className="flex items-center gap-1.5 min-w-0">
                          <svg
                            viewBox="0 0 12 12"
                            className="w-3.5 h-3.5 rounded-xs border border-slate-300 shrink-0"
                            aria-hidden="true"
                          >
                            <rect width="12" height="12" fill={c.value} />
                          </svg>
                          <span className="font-mono text-slate-700 truncate">
                            {c.name}
                          </span>
                        </div>
                        <span className="font-mono text-slate-500 shrink-0">
                          {c.value}
                        </span>
                      </div>
                    ))}
                  </div>
                  <button
                    type="button"
                    data-testid="ai-theme-apply-btn"
                    onClick={() => {
                      const nextVars = mergeGeneratedPaletteIntoThemeVars(
                        themeVars,
                        aiThemePalette.colors
                      );
                      onReplaceThemeVars(nextVars);
                      showTemporaryThemeStatus(
                        `Zastosowano paletę AI: ${aiThemePalette.paletteName}`
                      );
                    }}
                    className="w-full py-1 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded text-[11px] font-semibold text-indigo-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                  >
                    Zastosuj paletę
                  </button>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <div className="space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <label
                    htmlFor="inspector-theme-presets"
                    className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-600"
                  >
                    <Palette className="w-3 h-3 text-slate-400" />
                    Presets
                  </label>
                  {activeThemePresetId && (
                    <span className="text-[10px] font-medium text-blue-600">
                      Aktywny preset
                    </span>
                  )}
                </div>
                <select
                  id="inspector-theme-presets"
                  aria-label="Presets"
                  value={activeThemePresetId || ''}
                  onChange={(e) => {
                    const preset = THEME_PRESETS.find(
                      (p) => p.id === e.target.value
                    );
                    if (!preset) return;
                    onReplaceThemeVars(
                      preset.variables.map((v) => ({ ...v }))
                    );
                    showTemporaryThemeStatus(`Zastosowano: ${preset.name}`);
                  }}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-md text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {!activeThemePresetId && (
                    <option value="">Własny motyw (Custom)</option>
                  )}
                  {THEME_PRESETS.map((preset) => (
                    <option key={preset.id} value={preset.id}>
                      {preset.name}
                    </option>
                  ))}
                </select>
              </div>
              <div
                role="group"
                aria-label="Presety motywu"
                className="grid grid-cols-2 gap-1.5"
              >
                {THEME_PRESETS.map((preset) => {
                  const isActive = activeThemePresetId === preset.id;
                  const swatches = preset.variables
                    .filter((v) => v.category === 'color')
                    .slice(0, 3);
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      aria-pressed={isActive}
                      title={preset.description}
                      onClick={() => {
                        onReplaceThemeVars(
                          preset.variables.map((v) => ({ ...v }))
                        );
                        showTemporaryThemeStatus(`Zastosowano: ${preset.name}`);
                      }}
                      className={`p-2 rounded-lg border text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                        isActive
                          ? 'bg-blue-50/80 border-blue-400 text-blue-900 shadow-xs'
                          : 'bg-white border-slate-200 hover:border-blue-300 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <div className="flex items-center gap-1">
                          {swatches.map((sw) => (
                            <svg
                              key={sw.id}
                              viewBox="0 0 12 12"
                              className="w-3 h-3 rounded-xs border border-slate-300/80 shrink-0"
                              aria-hidden="true"
                            >
                              <rect width="12" height="12" fill={sw.value} />
                            </svg>
                          ))}
                        </div>
                        {isActive && (
                          <Check className="w-3 h-3 text-blue-600 shrink-0" />
                        )}
                      </div>
                      <span className="block text-[11px] font-semibold leading-tight truncate">
                        {preset.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {showImportTheme && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  applyImportedThemeText(importThemeDraft);
                }}
                className="p-2.5 bg-white border border-slate-200 rounded-lg space-y-2"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-semibold text-slate-700">
                    Importuj motyw (JSON / CSS)
                  </span>
                  <input
                    ref={themeFileInputRef}
                    type="file"
                    accept=".json,.css,application/json,text/css"
                    aria-label="Wczytaj plik motywu (.json lub .css)"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      try {
                        const text = await file.text();
                        setImportThemeDraft(text);
                        applyImportedThemeText(text);
                      } catch {
                        setImportThemeError('Nie udało się odczytać pliku motywu.');
                      } finally {
                        e.target.value = '';
                      }
                    }}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => themeFileInputRef.current?.click()}
                    className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-semibold rounded border border-slate-200 whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                  >
                    Wybierz plik
                  </button>
                </div>

                <textarea
                  aria-label="Wklej JSON lub CSS motywu"
                  rows={4}
                  value={importThemeDraft}
                  onChange={(e) => {
                    setImportThemeDraft(e.target.value);
                    if (importThemeError) setImportThemeError('');
                  }}
                  placeholder={`:root { --color-primary: #6750A4; }\nlub JSON: { "--color-primary": "#6750A4" }`}
                  className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded text-[11px] font-mono text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
                />

                {importThemeError && (
                  <p role="alert" className="text-[11px] font-medium text-red-600">
                    {importThemeError}
                  </p>
                )}

                <button
                  type="submit"
                  className="w-full py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-md transition-colors whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                >
                  Zastosuj importowany motyw
                </button>
              </form>
            )}

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

                const isTextApplied = isMultiSelect
                  ? activeIds.every((id) =>
                      (nodes[id]?.props.className || '')
                        .split(/\s+/)
                        .includes(textVarClass)
                    )
                  : classTokens.includes(textVarClass);
                const isBgApplied = isMultiSelect
                  ? activeIds.every((id) =>
                      (nodes[id]?.props.className || '')
                        .split(/\s+/)
                        .includes(bgVarClass)
                    )
                  : classTokens.includes(bgVarClass);
                const isSizeApplied = isMultiSelect
                  ? activeIds.every((id) =>
                      (nodes[id]?.props.className || '')
                        .split(/\s+/)
                        .includes(sizeVarClass)
                    )
                  : classTokens.includes(sizeVarClass);

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
                      <input
                        type="color"
                        data-testid={`theme-var-color-${item.id}`}
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
                              applyClassUpdate((curr) =>
                                setTailwindTextColor(
                                  curr,
                                  isTextApplied ? '' : textVarClass
                                )
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
                              applyClassUpdate((curr) =>
                                setTailwindBgColor(
                                  curr,
                                  isBgApplied ? '' : bgVarClass
                                )
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
                            applyClassUpdate((curr) =>
                              setTailwindFontSize(
                                curr,
                                isSizeApplied ? '' : sizeVarClass
                              )
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

          <DesignLintPanel
            selectedId={selectedId}
            nodes={nodes}
            themeVars={themeVars}
            onSelectNode={onSelectNode}
            onFixIssue={onFixDesignLintIssue}
            onFixAll={onFixAllDesignLint}
          />

          <section
            aria-label="SEO"
            className="space-y-2.5 p-3 bg-slate-50 rounded-xl border border-slate-200/80"
          >
            <h3 className="text-[11px] font-bold text-slate-500 tracking-wide">
              SEO
            </h3>

            <div className="space-y-1">
              <label
                htmlFor="inspector-seo-title"
                className="block text-[11px] font-semibold text-slate-600"
              >
                Document Title
              </label>
              <input
                id="inspector-seo-title"
                type="text"
                value={seoMetadata.title}
                onChange={(e) => onChangeSeo('title', e.target.value)}
                placeholder="np. Moja Strona | React UI Studio"
                className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-md text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="space-y-1">
              <label
                htmlFor="inspector-seo-description"
                className="block text-[11px] font-semibold text-slate-600"
              >
                Meta Description
              </label>
              <textarea
                id="inspector-seo-description"
                rows={2}
                value={seoMetadata.description}
                onChange={(e) => onChangeSeo('description', e.target.value)}
                placeholder="Krótki opis strony dla wyszukiwarek..."
                className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-md text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>

            <div className="space-y-1">
              <label
                htmlFor="inspector-seo-canonical"
                className="block text-[11px] font-semibold text-slate-600"
              >
                Canonical URL
              </label>
              <input
                id="inspector-seo-canonical"
                type="url"
                value={seoMetadata.canonicalUrl}
                onChange={(e) => onChangeSeo('canonicalUrl', e.target.value)}
                placeholder="https://example.com/strona"
                className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-md text-xs font-mono text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <SeoPreview seoMetadata={seoMetadata} nodes={nodes} />

            <SitemapGenerator
              nodes={nodes}
              seoMetadata={seoMetadata}
              onSelectNode={onSelectNode}
            />
          </section>

          {!isMultiSelect &&
            selectedNode &&
            ['Heading', 'Text', 'Button', 'Badge'].includes(
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

          {!isMultiSelect && selectedNode?.type === 'Input' && (
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

          {!isMultiSelect && selectedNode?.type === 'Image' && (
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

          {!isMultiSelect && selectedNode && (
            <section
              aria-label="Comments"
              data-testid="inspector-comments-section"
              className="space-y-2.5 p-3 bg-amber-50/40 rounded-xl border border-amber-200/80"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <h3 className="text-[11px] font-bold text-slate-700 tracking-wide">
                    Comments
                  </h3>
                </div>
                <span className="text-[10px] font-mono font-semibold text-amber-700 tabular-nums">
                  {getNodeComments(selectedNode).length}
                </span>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const trimmed = commentDraft.trim();
                  if (!trimmed) return;
                  onAddNodeComment(selectedNode.id, trimmed);
                  setCommentDraft('');
                }}
                className="flex gap-1.5"
              >
                <input
                  type="text"
                  data-testid="node-comment-input"
                  aria-label="Notatka do komponentu"
                  placeholder="Dodaj notatkę do komponentu..."
                  value={commentDraft}
                  onChange={(e) => setCommentDraft(e.target.value)}
                  className="flex-1 min-w-0 px-2.5 py-1.5 bg-white border border-amber-200 rounded-md text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
                <button
                  type="submit"
                  data-testid="add-node-comment-btn"
                  disabled={!commentDraft.trim()}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-amber-600 hover:bg-amber-700 disabled:bg-amber-300 text-white text-[11px] font-semibold rounded-md transition-colors whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Dodaj
                </button>
              </form>

              {getNodeComments(selectedNode).length > 0 ? (
                <div
                  data-testid="node-comment-list"
                  className="space-y-1.5 max-h-44 overflow-y-auto pr-0.5"
                >
                  {getNodeComments(selectedNode).map((comment) => {
                    const formattedTime = new Date(
                      comment.createdAt
                    ).toLocaleTimeString('pl-PL', {
                      hour: '2-digit',
                      minute: '2-digit',
                    });
                    return (
                      <div
                        key={comment.id}
                        data-testid={`node-comment-item-${comment.id}`}
                        className="p-2 bg-white border border-amber-200/80 rounded-lg flex items-start justify-between gap-2"
                      >
                        <div className="min-w-0 flex-1 space-y-0.5">
                          <p className="text-xs text-slate-800 leading-snug break-words">
                            {comment.text}
                          </p>
                          <span className="block text-[10px] font-mono text-slate-400">
                            {formattedTime}
                          </span>
                        </div>
                        <button
                          type="button"
                          data-testid={`delete-node-comment-btn-${comment.id}`}
                          aria-label="Usuń notatkę"
                          onClick={() =>
                            onDeleteNodeComment(selectedNode.id, comment.id)
                          }
                          className="p-1 text-slate-400 hover:text-red-600 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 shrink-0"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-[10px] text-slate-500">
                  Brak notatek dla tego elementu. Dodane komentarze pojawią się w drzewie warstw.
                </p>
              )}
            </section>
          )}

          {!isMultiSelect && selectedNode && (
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
          )}

          {isMultiSelect
            ? activeIds.some((id) => id !== 'root') && (
                <div className="pt-4 border-t border-slate-100 mt-auto">
                  <button
                    type="button"
                    title="Usuń zaznaczone elementy (Delete)"
                    onClick={onBulkDeleteNodes}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Usuń zaznaczone (
                    {activeIds.filter((id) => id !== 'root').length})
                  </button>
                </div>
              )
            : selectedId !== 'root' && (
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
