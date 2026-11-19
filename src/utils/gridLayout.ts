import type { EditorNode, NodesMap } from '../types/editor';

export type GridBreakpointPrefix = '' | 'sm' | 'md' | 'lg' | 'xl';
export type GridDisplayMode = 'grid' | 'inline-grid';
export type GridGapMode = 'uniform' | 'split';

export const GRID_COLUMN_COUNT_VALUES = [
  '1',
  '2',
  '3',
  '4',
  '5',
  '6',
  '7',
  '8',
  '9',
  '10',
  '11',
  '12',
  'none',
  'subgrid',
] as const;

export const GRID_COLUMN_QUICK_CLASSES = [
  { label: '1', cls: 'grid-cols-1', title: '1 kolumna (grid-cols-1)' },
  { label: '2', cls: 'grid-cols-2', title: '2 kolumny (grid-cols-2)' },
  { label: '3', cls: 'grid-cols-3', title: '3 kolumny (grid-cols-3)' },
  { label: '4', cls: 'grid-cols-4', title: '4 kolumny (grid-cols-4)' },
  { label: '5', cls: 'grid-cols-5', title: '5 kolumn (grid-cols-5)' },
  { label: '6', cls: 'grid-cols-6', title: '6 kolumn (grid-cols-6)' },
] as const;

export const GRID_COLUMN_SELECT_OPTIONS = [
  { value: 'grid-cols-1', label: '1 kolumna (grid-cols-1)' },
  { value: 'grid-cols-2', label: '2 kolumny (grid-cols-2)' },
  { value: 'grid-cols-3', label: '3 kolumny (grid-cols-3)' },
  { value: 'grid-cols-4', label: '4 kolumny (grid-cols-4)' },
  { value: 'grid-cols-5', label: '5 kolumn (grid-cols-5)' },
  { value: 'grid-cols-6', label: '6 kolumn (grid-cols-6)' },
  { value: 'grid-cols-7', label: '7 kolumn (grid-cols-7)' },
  { value: 'grid-cols-8', label: '8 kolumn (grid-cols-8)' },
  { value: 'grid-cols-9', label: '9 kolumn (grid-cols-9)' },
  { value: 'grid-cols-10', label: '10 kolumn (grid-cols-10)' },
  { value: 'grid-cols-11', label: '11 kolumn (grid-cols-11)' },
  { value: 'grid-cols-12', label: '12 kolumn (grid-cols-12)' },
  { value: 'grid-cols-none', label: 'Brak (grid-cols-none)' },
  { value: 'grid-cols-subgrid', label: 'Subgrid (grid-cols-subgrid)' },
] as const;

export const RESPONSIVE_MD_GRID_COLS_OPTIONS = [
  { value: '', label: 'Dziedziczony' },
  { value: 'md:grid-cols-1', label: 'md:grid-cols-1' },
  { value: 'md:grid-cols-2', label: 'md:grid-cols-2' },
  { value: 'md:grid-cols-3', label: 'md:grid-cols-3' },
  { value: 'md:grid-cols-4', label: 'md:grid-cols-4' },
  { value: 'md:grid-cols-6', label: 'md:grid-cols-6' },
] as const;

export const RESPONSIVE_LG_GRID_COLS_OPTIONS = [
  { value: '', label: 'Dziedziczony' },
  { value: 'lg:grid-cols-1', label: 'lg:grid-cols-1' },
  { value: 'lg:grid-cols-2', label: 'lg:grid-cols-2' },
  { value: 'lg:grid-cols-3', label: 'lg:grid-cols-3' },
  { value: 'lg:grid-cols-4', label: 'lg:grid-cols-4' },
  { value: 'lg:grid-cols-5', label: 'lg:grid-cols-5' },
  { value: 'lg:grid-cols-6', label: 'lg:grid-cols-6' },
  { value: 'lg:grid-cols-12', label: 'lg:grid-cols-12' },
] as const;

export const GRID_TEMPLATE_PRESETS = [
  {
    id: 'sidebar-main',
    label: 'Sidebar + Main',
    cls: 'grid-cols-[240px_1fr]',
    hint: '240px · 1fr',
  },
  {
    id: 'split-1-2',
    label: '1 : 2 Split',
    cls: 'grid-cols-[1fr_2fr]',
    hint: '1fr · 2fr',
  },
  {
    id: 'split-2-1',
    label: '2 : 1 Split',
    cls: 'grid-cols-[2fr_1fr]',
    hint: '2fr · 1fr',
  },
  {
    id: 'auto-fit-180',
    label: 'Auto-fit 180px',
    cls: 'grid-cols-[repeat(auto-fit,minmax(180px,1fr))]',
    hint: 'repeat(auto-fit)',
  },
  {
    id: 'auto-fit-240',
    label: 'Auto-fit 240px',
    cls: 'grid-cols-[repeat(auto-fit,minmax(240px,1fr))]',
    hint: 'repeat(auto-fit)',
  },
  {
    id: 'auto-fill-200',
    label: 'Auto-fill 200px',
    cls: 'grid-cols-[repeat(auto-fill,minmax(200px,1fr))]',
    hint: 'repeat(auto-fill)',
  },
] as const;

export const GRID_GAP_QUICK_OPTIONS = [
  { label: '0', cls: 'gap-0' },
  { label: '2', cls: 'gap-2' },
  { label: '4', cls: 'gap-4' },
  { label: '6', cls: 'gap-6' },
  { label: '8', cls: 'gap-8' },
] as const;

export const GRID_UNIFORM_GAP_OPTIONS = [
  { value: 'gap-0', label: 'gap-0 (0px)' },
  { value: 'gap-0.5', label: 'gap-0.5 (2px)' },
  { value: 'gap-1', label: 'gap-1 (4px)' },
  { value: 'gap-1.5', label: 'gap-1.5 (6px)' },
  { value: 'gap-2', label: 'gap-2 (8px)' },
  { value: 'gap-2.5', label: 'gap-2.5 (10px)' },
  { value: 'gap-3', label: 'gap-3 (12px)' },
  { value: 'gap-4', label: 'gap-4 (16px)' },
  { value: 'gap-5', label: 'gap-5 (20px)' },
  { value: 'gap-6', label: 'gap-6 (24px)' },
  { value: 'gap-8', label: 'gap-8 (32px)' },
  { value: 'gap-10', label: 'gap-10 (40px)' },
  { value: 'gap-12', label: 'gap-12 (48px)' },
  { value: 'gap-16', label: 'gap-16 (64px)' },
] as const;

export const GRID_COLUMN_GAP_OPTIONS = [
  { value: 'gap-x-0', label: 'gap-x-0 (0px)' },
  { value: 'gap-x-1', label: 'gap-x-1 (4px)' },
  { value: 'gap-x-2', label: 'gap-x-2 (8px)' },
  { value: 'gap-x-3', label: 'gap-x-3 (12px)' },
  { value: 'gap-x-4', label: 'gap-x-4 (16px)' },
  { value: 'gap-x-5', label: 'gap-x-5 (20px)' },
  { value: 'gap-x-6', label: 'gap-x-6 (24px)' },
  { value: 'gap-x-8', label: 'gap-x-8 (32px)' },
  { value: 'gap-x-10', label: 'gap-x-10 (40px)' },
  { value: 'gap-x-12', label: 'gap-x-12 (48px)' },
  { value: 'gap-x-16', label: 'gap-x-16 (64px)' },
] as const;

export const GRID_ROW_GAP_OPTIONS = [
  { value: 'gap-y-0', label: 'gap-y-0 (0px)' },
  { value: 'gap-y-1', label: 'gap-y-1 (4px)' },
  { value: 'gap-y-2', label: 'gap-y-2 (8px)' },
  { value: 'gap-y-3', label: 'gap-y-3 (12px)' },
  { value: 'gap-y-4', label: 'gap-y-4 (16px)' },
  { value: 'gap-y-5', label: 'gap-y-5 (20px)' },
  { value: 'gap-y-6', label: 'gap-y-6 (24px)' },
  { value: 'gap-y-8', label: 'gap-y-8 (32px)' },
  { value: 'gap-y-10', label: 'gap-y-10 (40px)' },
  { value: 'gap-y-12', label: 'gap-y-12 (48px)' },
  { value: 'gap-y-16', label: 'gap-y-16 (64px)' },
] as const;

export const GRID_AUTO_FLOW_OPTIONS = [
  { cls: 'grid-flow-row', label: 'Row', title: 'Układ wierszowy (grid-flow-row)' },
  { cls: 'grid-flow-col', label: 'Column', title: 'Układ kolumnowy (grid-flow-col)' },
  { cls: 'grid-flow-dense', label: 'Dense', title: 'Gęste wypełnianie (grid-flow-dense)' },
  {
    cls: 'grid-flow-row-dense',
    label: 'Row Dense',
    title: 'Wierszowy gęsty (grid-flow-row-dense)',
  },
  {
    cls: 'grid-flow-col-dense',
    label: 'Col Dense',
    title: 'Kolumnowy gęsty (grid-flow-col-dense)',
  },
] as const;

export const GRID_AUTO_COLS_OPTIONS = [
  { value: 'auto-cols-auto', label: 'auto (auto-cols-auto)' },
  { value: 'auto-cols-min', label: 'min-content (auto-cols-min)' },
  { value: 'auto-cols-max', label: 'max-content (auto-cols-max)' },
  { value: 'auto-cols-fr', label: '1fr (auto-cols-fr)' },
] as const;

export const GRID_AUTO_ROWS_OPTIONS = [
  { value: 'auto-rows-auto', label: 'auto (auto-rows-auto)' },
  { value: 'auto-rows-min', label: 'min-content (auto-rows-min)' },
  { value: 'auto-rows-max', label: 'max-content (auto-rows-max)' },
  { value: 'auto-rows-fr', label: '1fr (auto-rows-fr)' },
] as const;

export const GRID_PLACE_ITEMS_OPTIONS = [
  { value: 'place-items-start', label: 'start (place-items-start)' },
  { value: 'place-items-center', label: 'center (place-items-center)' },
  { value: 'place-items-end', label: 'end (place-items-end)' },
  { value: 'place-items-baseline', label: 'baseline (place-items-baseline)' },
  { value: 'place-items-stretch', label: 'stretch (place-items-stretch)' },
] as const;

export const GRID_PLACE_CONTENT_OPTIONS = [
  { value: 'place-content-start', label: 'start (place-content-start)' },
  { value: 'place-content-center', label: 'center (place-content-center)' },
  { value: 'place-content-end', label: 'end (place-content-end)' },
  { value: 'place-content-between', label: 'between (place-content-between)' },
  { value: 'place-content-around', label: 'around (place-content-around)' },
  { value: 'place-content-evenly', label: 'evenly (place-content-evenly)' },
  { value: 'place-content-baseline', label: 'baseline (place-content-baseline)' },
  { value: 'place-content-stretch', label: 'stretch (place-content-stretch)' },
] as const;

export const GRID_CHILD_COL_SPAN_OPTIONS = [
  { value: 'col-span-1', label: 'col-span-1' },
  { value: 'col-span-2', label: 'col-span-2' },
  { value: 'col-span-3', label: 'col-span-3' },
  { value: 'col-span-4', label: 'col-span-4' },
  { value: 'col-span-5', label: 'col-span-5' },
  { value: 'col-span-6', label: 'col-span-6' },
  { value: 'col-span-full', label: 'col-span-full' },
] as const;

export const GRID_CHILD_ROW_SPAN_OPTIONS = [
  { value: 'row-span-1', label: 'row-span-1' },
  { value: 'row-span-2', label: 'row-span-2' },
  { value: 'row-span-3', label: 'row-span-3' },
  { value: 'row-span-4', label: 'row-span-4' },
  { value: 'row-span-full', label: 'row-span-full' },
] as const;

const SPLIT_DISPLAY_REMOVE = new Set([
  'flex',
  'inline-flex',
  'grid',
  'inline-grid',
  'block',
  'inline-block',
  'flex-row',
  'flex-col',
  'flex-row-reverse',
  'flex-col-reverse',
]);

export const getGridDisplayMode = (className = ''): GridDisplayMode | '' => {
  const tokens = className.split(/\s+/).filter(Boolean);
  let found: GridDisplayMode | '' = '';
  for (const token of tokens) {
    if (token === 'inline-grid') found = 'inline-grid';
    else if (token === 'grid') found = 'grid';
  }
  return found;
};

export const setGridDisplayMode = (
  className = '',
  mode: GridDisplayMode = 'grid'
): string => {
  const tokens = className.split(/\s+/).filter(Boolean);
  const filtered = tokens.filter((t) => !SPLIT_DISPLAY_REMOVE.has(t));
  return [mode, ...filtered].join(' ');
};

const buildColsTokenRegex = (breakpoint: GridBreakpointPrefix = ''): RegExp =>
  breakpoint
    ? new RegExp(`^${breakpoint}:grid-cols-(?:[0-9]+|none|subgrid|\\[.+\\])$`)
    : /^grid-cols-(?:[0-9]+|none|subgrid|\[.+\])$/;

export const getGridColsToken = (
  className = '',
  breakpoint: GridBreakpointPrefix = ''
): string => {
  const tokens = className.split(/\s+/).filter(Boolean);
  const re = buildColsTokenRegex(breakpoint);
  let found = '';
  for (const token of tokens) {
    if (re.test(token)) {
      found = token;
    }
  }
  return found;
};

export const setGridColsToken = (
  className = '',
  nextToken: string,
  breakpoint: GridBreakpointPrefix = ''
): string => {
  const tokens = className.split(/\s+/).filter(Boolean);
  const re = buildColsTokenRegex(breakpoint);
  const filtered = tokens.filter((t) => {
    if (re.test(t)) return false;
    if (!breakpoint && (t === 'flex' || t === 'flex-row' || t === 'flex-col')) {
      return false;
    }
    return true;
  });

  if (nextToken) {
    const hasDisplay = filtered.some((t) => t === 'grid' || t === 'inline-grid');
    if (!hasDisplay) {
      filtered.unshift('grid');
    }
    filtered.push(nextToken);
  }
  return filtered.join(' ');
};

export const formatCustomGridTemplateToToken = (rawTemplate: string): string => {
  const trimmed = rawTemplate.replace(/[;{}<>]/g, '').trim();
  if (!trimmed) return '';
  if (/^grid-cols-/.test(trimmed)) return trimmed;
  const compact = trimmed.replace(/\s*,\s*/g, ',').replace(/\s+/g, '_');
  return `grid-cols-[${compact}]`;
};

export const extractCustomGridTemplateText = (token: string): string => {
  const match = token.match(/^grid-cols-\[(.+)\]$/);
  if (!match) return '';
  return match[1].replace(/_/g, ' ');
};

const GAP_UNIFORM_RE = /^gap-(?:[0-9]+(?:\.[0-9]+)?|px|\[.+\])$/;
const GAP_X_RE = /^gap-x-(?:[0-9]+(?:\.[0-9]+)?|px|\[.+\])$/;
const GAP_Y_RE = /^gap-y-(?:[0-9]+(?:\.[0-9]+)?|px|\[.+\])$/;

export interface GridGapState {
  mode: GridGapMode;
  uniform: string;
  x: string;
  y: string;
}

export const getGridGapState = (className = ''): GridGapState => {
  const tokens = className.split(/\s+/).filter(Boolean);
  let uniform = '';
  let x = '';
  let y = '';
  let lastKind: GridGapMode = 'uniform';

  for (const token of tokens) {
    if (GAP_UNIFORM_RE.test(token)) {
      uniform = token;
      lastKind = 'uniform';
    } else if (GAP_X_RE.test(token)) {
      x = token;
      lastKind = 'split';
    } else if (GAP_Y_RE.test(token)) {
      y = token;
      lastKind = 'split';
    }
  }

  if (x || y) {
    return {
      mode: 'split',
      uniform,
      x: x || (uniform ? `gap-x-${uniform.slice(4)}` : ''),
      y: y || (uniform ? `gap-y-${uniform.slice(4)}` : ''),
    };
  }

  return {
    mode: lastKind,
    uniform,
    x: '',
    y: '',
  };
};

export const setGridUniformGap = (
  className = '',
  nextGapToken = ''
): string => {
  const tokens = className.split(/\s+/).filter(Boolean);
  const filtered = tokens.filter(
    (t) => !GAP_UNIFORM_RE.test(t) && !GAP_X_RE.test(t) && !GAP_Y_RE.test(t)
  );
  if (nextGapToken) {
    filtered.push(nextGapToken);
  }
  return filtered.join(' ');
};

export const setGridAxisGap = (
  className = '',
  axis: 'x' | 'y',
  nextAxisToken = ''
): string => {
  const current = getGridGapState(className);
  const fallbackScale = current.uniform ? current.uniform.slice(4) : '';
  const nextX =
    axis === 'x'
      ? nextAxisToken
      : current.x || (fallbackScale ? `gap-x-${fallbackScale}` : '');
  const nextY =
    axis === 'y'
      ? nextAxisToken
      : current.y || (fallbackScale ? `gap-y-${fallbackScale}` : '');

  const tokens = className.split(/\s+/).filter(Boolean);
  const filtered = tokens.filter(
    (t) => !GAP_UNIFORM_RE.test(t) && !GAP_X_RE.test(t) && !GAP_Y_RE.test(t)
  );

  if (nextX) filtered.push(nextX);
  if (nextY) filtered.push(nextY);
  return filtered.join(' ');
};

export const formatCustomGapToToken = (rawGap: string): string => {
  const cleaned = rawGap.replace(/[;{}<>]/g, '').trim();
  if (!cleaned) return '';
  if (GAP_UNIFORM_RE.test(cleaned)) return cleaned;
  const compact = cleaned.replace(/\s+/g, '');
  return `gap-[${compact}]`;
};

const replaceByPattern = (
  className: string,
  pattern: RegExp,
  nextToken: string
): string => {
  const tokens = className.split(/\s+/).filter(Boolean);
  const filtered = tokens.filter((t) => !pattern.test(t));
  if (nextToken) {
    filtered.push(nextToken);
  }
  return filtered.join(' ');
};

const readByPattern = (className: string, pattern: RegExp): string => {
  const tokens = className.split(/\s+/).filter(Boolean);
  let found = '';
  for (const token of tokens) {
    if (pattern.test(token)) {
      found = token;
    }
  }
  return found;
};

const GRID_FLOW_RE = /^grid-flow-(?:row|col|dense|row-dense|col-dense)$/;
const AUTO_COLS_RE = /^auto-cols-(?:auto|min|max|fr|\[.+\])$/;
const AUTO_ROWS_RE = /^auto-rows-(?:auto|min|max|fr|\[.+\])$/;
const PLACE_ITEMS_RE = /^place-items-(?:start|end|center|baseline|stretch)$/;
const CONFLICTS_PLACE_ITEMS_RE =
  /^(?:place-items-(?:start|end|center|baseline|stretch)|items-(?:start|end|center|baseline|stretch)|justify-items-(?:start|end|center|stretch|normal))$/;
const PLACE_CONTENT_RE =
  /^place-content-(?:start|end|center|between|around|evenly|baseline|stretch)$/;
const CONFLICTS_PLACE_CONTENT_RE =
  /^(?:place-content-(?:start|end|center|between|around|evenly|baseline|stretch)|justify-(?:normal|start|end|center|between|around|evenly|stretch)|content-(?:normal|start|end|center|between|around|evenly|baseline|stretch))$/;
const COL_SPAN_RE = /^col-span-(?:[0-9]+|full|auto|\[.+\])$/;
const ROW_SPAN_RE = /^row-span-(?:[0-9]+|full|auto|\[.+\])$/;

export const getGridAutoFlow = (className = ''): string =>
  readByPattern(className, GRID_FLOW_RE);

export const setGridAutoFlow = (className = '', nextToken = ''): string =>
  replaceByPattern(className, GRID_FLOW_RE, nextToken);

export const getGridAutoCols = (className = ''): string =>
  readByPattern(className, AUTO_COLS_RE);

export const setGridAutoCols = (className = '', nextToken = ''): string =>
  replaceByPattern(className, AUTO_COLS_RE, nextToken);

export const getGridAutoRows = (className = ''): string =>
  readByPattern(className, AUTO_ROWS_RE);

export const setGridAutoRows = (className = '', nextToken = ''): string =>
  replaceByPattern(className, AUTO_ROWS_RE, nextToken);

export const getGridPlaceItems = (className = ''): string =>
  readByPattern(className, PLACE_ITEMS_RE);

export const setGridPlaceItems = (className = '', nextToken = ''): string =>
  replaceByPattern(
    className,
    nextToken ? CONFLICTS_PLACE_ITEMS_RE : PLACE_ITEMS_RE,
    nextToken
  );

export const getGridPlaceContent = (className = ''): string =>
  readByPattern(className, PLACE_CONTENT_RE);

export const setGridPlaceContent = (className = '', nextToken = ''): string =>
  replaceByPattern(
    className,
    nextToken ? CONFLICTS_PLACE_CONTENT_RE : PLACE_CONTENT_RE,
    nextToken
  );

export const getGridChildSpan = (
  className = '',
  axis: 'col' | 'row'
): string =>
  readByPattern(className, axis === 'col' ? COL_SPAN_RE : ROW_SPAN_RE);

export const setGridChildSpan = (
  className = '',
  axis: 'col' | 'row',
  nextToken = ''
): string =>
  replaceByPattern(
    className,
    axis === 'col' ? COL_SPAN_RE : ROW_SPAN_RE,
    nextToken
  );

export const resetGridLayoutClasses = (className = ''): string => {
  const tokens = className.split(/\s+/).filter(Boolean);
  const gridTokensToStrip = (t: string) =>
    t === 'grid' ||
    t === 'inline-grid' ||
    buildColsTokenRegex('').test(t) ||
    buildColsTokenRegex('sm').test(t) ||
    buildColsTokenRegex('md').test(t) ||
    buildColsTokenRegex('lg').test(t) ||
    buildColsTokenRegex('xl').test(t) ||
    GAP_UNIFORM_RE.test(t) ||
    GAP_X_RE.test(t) ||
    GAP_Y_RE.test(t) ||
    GRID_FLOW_RE.test(t) ||
    AUTO_COLS_RE.test(t) ||
    AUTO_ROWS_RE.test(t) ||
    PLACE_ITEMS_RE.test(t) ||
    PLACE_CONTENT_RE.test(t);

  const preserved = tokens.filter((t) => !gridTokensToStrip(t));
  return ['grid', 'grid-cols-2', 'gap-4', ...preserved].join(' ');
};

export const listGridNodesInTree = (nodes: NodesMap): EditorNode[] =>
  Object.values(nodes).filter((n) => n.type === 'Grid');

export interface GridPreviewSummary {
  colsLabel: string;
  gapLabel: string;
  flowLabel: string;
  previewCellCount: number;
  previewGridClass: string;
}

export const buildGridPreviewSummary = (
  className = ''
): GridPreviewSummary => {
  const colsToken = getGridColsToken(className, '');
  const gapState = getGridGapState(className);
  const flowToken = getGridAutoFlow(className);

  const numericMatch = colsToken.match(/^grid-cols-([1-9]|1[0-2])$/);
  const numericCols = numericMatch ? Number(numericMatch[1]) : 0;

  let previewCellCount = 4;
  if (numericCols > 0) {
    previewCellCount = Math.min(numericCols * 2, 12);
  } else if (colsToken.includes('auto-fit') || colsToken.includes('auto-fill')) {
    previewCellCount = 6;
  } else if (colsToken.includes('[')) {
    const inner = extractCustomGridTemplateText(colsToken);
    const parts = inner.split(/\s+/).filter(Boolean).length;
    previewCellCount = Math.max(2, Math.min(parts * 2, 8));
  }

  let gapLabel = 'domyślny';
  if (gapState.mode === 'split' && (gapState.x || gapState.y)) {
    gapLabel = [gapState.x, gapState.y].filter(Boolean).join(' · ');
  } else if (gapState.uniform) {
    gapLabel = gapState.uniform;
  }

  const safeColsPreviewClass =
    numericCols >= 1 && numericCols <= 6
      ? GRID_COLUMN_QUICK_CLASSES[numericCols - 1].cls
      : numericCols > 6
        ? 'grid-cols-6'
        : colsToken === 'grid-cols-[240px_1fr]' || colsToken === 'grid-cols-[1fr_2fr]'
          ? 'grid-cols-[1fr_2fr]'
          : colsToken === 'grid-cols-[2fr_1fr]'
            ? 'grid-cols-[2fr_1fr]'
            : 'grid-cols-3';

  return {
    colsLabel: colsToken || 'brak (domyślnie 1)',
    gapLabel,
    flowLabel: flowToken ? flowToken.replace('grid-flow-', '') : 'row',
    previewCellCount,
    previewGridClass: safeColsPreviewClass,
  };
};

const escapeArbitraryClassSelector = (token: string): string =>
  token.replace(/[^a-zA-Z0-9_-]/g, '\\$&');

const PRECOMPILED_GRID_TOKENS = new Set<string>([
  ...GRID_TEMPLATE_PRESETS.map((p) => p.cls),
  'grid-cols-1',
  'grid-cols-2',
  'grid-cols-3',
  'grid-cols-4',
  'grid-cols-5',
  'grid-cols-6',
  'grid-cols-7',
  'grid-cols-8',
  'grid-cols-9',
  'grid-cols-10',
  'grid-cols-11',
  'grid-cols-12',
  'grid-cols-none',
  'grid-cols-subgrid',
]);

export const buildArbitraryGridCssRules = (nodes: NodesMap): string => {
  const rules: string[] = [];
  const seen = new Set<string>();

  for (const node of Object.values(nodes)) {
    const tokens = (node.props.className || '').split(/\s+/).filter(Boolean);
    for (const token of tokens) {
      if (seen.has(token) || PRECOMPILED_GRID_TOKENS.has(token)) continue;
      seen.add(token);

      const colsMatch = token.match(/^grid-cols-\[(.+)\]$/);
      if (colsMatch) {
        const cssValue = colsMatch[1].replace(/_/g, ' ').replace(/[;{}<>]/g, '');
        if (cssValue) {
          rules.push(
            `:where(.${escapeArbitraryClassSelector(token)}) { grid-template-columns: ${cssValue}; }`
          );
        }
        continue;
      }

      const gapMatch = token.match(/^gap-\[(.+)\]$/);
      if (gapMatch) {
        const cssValue = gapMatch[1].replace(/_/g, ' ').replace(/[;{}<>]/g, '');
        if (cssValue) {
          rules.push(
            `:where(.${escapeArbitraryClassSelector(token)}) { gap: ${cssValue}; }`
          );
        }
        continue;
      }

      const gapXMatch = token.match(/^gap-x-\[(.+)\]$/);
      if (gapXMatch) {
        const cssValue = gapXMatch[1].replace(/_/g, ' ').replace(/[;{}<>]/g, '');
        if (cssValue) {
          rules.push(
            `:where(.${escapeArbitraryClassSelector(token)}) { column-gap: ${cssValue}; }`
          );
        }
        continue;
      }

      const gapYMatch = token.match(/^gap-y-\[(.+)\]$/);
      if (gapYMatch) {
        const cssValue = gapYMatch[1].replace(/_/g, ' ').replace(/[;{}<>]/g, '');
        if (cssValue) {
          rules.push(
            `:where(.${escapeArbitraryClassSelector(token)}) { row-gap: ${cssValue}; }`
          );
        }
        continue;
      }

      const autoColsMatch = token.match(/^auto-cols-\[(.+)\]$/);
      if (autoColsMatch) {
        const cssValue = autoColsMatch[1]
          .replace(/_/g, ' ')
          .replace(/[;{}<>]/g, '');
        if (cssValue) {
          rules.push(
            `:where(.${escapeArbitraryClassSelector(token)}) { grid-auto-columns: ${cssValue}; }`
          );
        }
        continue;
      }

      const autoRowsMatch = token.match(/^auto-rows-\[(.+)\]$/);
      if (autoRowsMatch) {
        const cssValue = autoRowsMatch[1]
          .replace(/_/g, ' ')
          .replace(/[;{}<>]/g, '');
        if (cssValue) {
          rules.push(
            `:where(.${escapeArbitraryClassSelector(token)}) { grid-auto-rows: ${cssValue}; }`
          );
        }
      }
    }
  }

  return rules.length > 0 ? `@layer utilities {\n  ${rules.join('\n  ')}\n}` : '';
};
