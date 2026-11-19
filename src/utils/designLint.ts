import type {
  EditorNode,
  NodesMap,
  NodeType,
  ThemeVariable,
} from '../types/editor';

export type DesignLintCategory = 'color' | 'spacing' | 'typography';
export type DesignLintSeverity = 'warning' | 'info';

export interface DesignLintIssue {
  id: string;
  nodeId: string;
  nodeName: string;
  nodeType: NodeType;
  category: DesignLintCategory;
  severity: DesignLintSeverity;
  token: string;
  replacement: string | null;
  message: string;
}

export interface DesignLintReport {
  rootNodeId: string;
  rootNodeName: string;
  scannedNodeCount: number;
  issues: DesignLintIssue[];
  fixableCount: number;
  countsByCategory: Record<DesignLintCategory, number>;
}

interface RgbColor {
  r: number;
  g: number;
  b: number;
}

const TAILWIND_NAMED_HEX: Record<string, string> = {
  white: '#ffffff',
  black: '#000000',
  'slate-50': '#f8fafc',
  'slate-100': '#f1f5f9',
  'slate-200': '#e2e8f0',
  'slate-300': '#cbd5e1',
  'slate-400': '#94a3b8',
  'slate-500': '#64748b',
  'slate-600': '#475569',
  'slate-700': '#334155',
  'slate-800': '#1e293b',
  'slate-900': '#0f172a',
  'slate-950': '#020617',
  'gray-50': '#f9fafb',
  'gray-100': '#f3f4f6',
  'gray-200': '#e5e7eb',
  'gray-300': '#d1d5db',
  'gray-500': '#6b7280',
  'gray-600': '#4b5563',
  'gray-700': '#374151',
  'gray-800': '#1f2937',
  'gray-900': '#111827',
  'zinc-50': '#fafafa',
  'zinc-100': '#f4f4f5',
  'zinc-200': '#e4e4e7',
  'zinc-700': '#3f3f46',
  'zinc-800': '#27272a',
  'zinc-900': '#18181b',
  'neutral-50': '#fafafa',
  'neutral-100': '#f5f5f5',
  'neutral-200': '#e5e5e5',
  'neutral-800': '#262626',
  'neutral-900': '#171717',
  'red-50': '#fef2f2',
  'red-100': '#fee2e2',
  'red-400': '#f87171',
  'red-500': '#ef4444',
  'red-600': '#dc2626',
  'red-700': '#b91c1c',
  'orange-500': '#f97316',
  'amber-50': '#fffbeb',
  'amber-100': '#fef3c7',
  'amber-500': '#f59e0b',
  'amber-600': '#d97706',
  'amber-800': '#92400e',
  'emerald-50': '#ecfdf5',
  'emerald-100': '#d1fae5',
  'emerald-500': '#10b981',
  'emerald-600': '#059669',
  'emerald-700': '#047857',
  'cyan-500': '#06b6d4',
  'blue-50': '#eff6ff',
  'blue-100': '#dbeafe',
  'blue-200': '#bfdbfe',
  'blue-300': '#93c5fd',
  'blue-500': '#3b82f6',
  'blue-600': '#2563eb',
  'blue-700': '#1d4ed8',
  'indigo-500': '#6366f1',
  'indigo-600': '#4f46e5',
  'violet-500': '#8b5cf6',
  'violet-600': '#7c3aed',
  'purple-500': '#a855f7',
  'purple-600': '#9333ea',
  'pink-500': '#ec4899',
  'rose-500': '#f43f5e',
  'rose-600': '#e11d48',
};

const TAILWIND_FONT_SIZE_PX: Record<string, number> = {
  'text-xs': 12,
  'text-sm': 14,
  'text-base': 16,
  'text-lg': 18,
  'text-xl': 20,
  'text-2xl': 24,
  'text-3xl': 30,
  'text-4xl': 36,
  'text-5xl': 48,
  'text-6xl': 60,
};

const STANDARD_SPACING_SCALE: Array<{ scale: string; px: number }> = [
  { scale: '0', px: 0 },
  { scale: '1', px: 4 },
  { scale: '2', px: 8 },
  { scale: '3', px: 12 },
  { scale: '4', px: 16 },
  { scale: '6', px: 24 },
  { scale: '8', px: 32 },
  { scale: '10', px: 40 },
  { scale: '12', px: 48 },
  { scale: '16', px: 64 },
];

const parseHexColor = (raw: string): RgbColor | null => {
  const cleaned = raw.trim().replace(/^#/, '');
  if (/^[0-9a-fA-F]{3}$/.test(cleaned)) {
    return {
      r: parseInt(cleaned[0] + cleaned[0], 16),
      g: parseInt(cleaned[1] + cleaned[1], 16),
      b: parseInt(cleaned[2] + cleaned[2], 16),
    };
  }
  if (/^[0-9a-fA-F]{6}$/.test(cleaned)) {
    return {
      r: parseInt(cleaned.slice(0, 2), 16),
      g: parseInt(cleaned.slice(2, 4), 16),
      b: parseInt(cleaned.slice(4, 6), 16),
    };
  }
  return null;
};

const parseColorToRgb = (raw: string): RgbColor | null => {
  const trimmed = raw.trim();
  if (trimmed.startsWith('#')) return parseHexColor(trimmed);

  const rgbMatch = trimmed.match(
    /^rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})/i
  );
  if (rgbMatch) {
    return {
      r: Math.min(255, Number(rgbMatch[1])),
      g: Math.min(255, Number(rgbMatch[2])),
      b: Math.min(255, Number(rgbMatch[3])),
    };
  }

  const namedHex = TAILWIND_NAMED_HEX[trimmed];
  return namedHex ? parseHexColor(namedHex) : null;
};

const getLuminance = (c: RgbColor): number =>
  (0.2126 * c.r + 0.7152 * c.g + 0.0722 * c.b) / 255;

const getRelativeLuminance = (c: RgbColor): number => {
  const toLinear = (channel: number) => {
    const s = channel / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return (
    0.2126 * toLinear(c.r) + 0.7152 * toLinear(c.g) + 0.0722 * toLinear(c.b)
  );
};

const getContrastRatio = (a: RgbColor, b: RgbColor): number => {
  const la = getRelativeLuminance(a);
  const lb = getRelativeLuminance(b);
  const lighter = Math.max(la, lb);
  const darker = Math.min(la, lb);
  return (lighter + 0.05) / (darker + 0.05);
};

const colorDistance = (a: RgbColor, b: RgbColor): number =>
  Math.hypot(a.r - b.r, a.g - b.g, a.b - b.b);

const parseCssSizeToPx = (raw: string): number | null => {
  const trimmed = raw.trim().toLowerCase();
  const pxMatch = trimmed.match(/^(-?\d+(?:\.\d+)?)px$/);
  if (pxMatch) return Number(pxMatch[1]);
  const remMatch = trimmed.match(/^(-?\d+(?:\.\d+)?)rem$/);
  if (remMatch) return Number(remMatch[1]) * 16;
  return null;
};

const snapPxToStandardSpacingScale = (px: number): string => {
  if (px <= 0) return '0';
  let best = STANDARD_SPACING_SCALE[0];
  let bestDist = Infinity;
  for (const item of STANDARD_SPACING_SCALE) {
    const dist = Math.abs(item.px - px);
    if (dist < bestDist) {
      bestDist = dist;
      best = item;
    }
  }
  return best.scale;
};

const isColorUtilityNonLiteral = (colorArg: string): boolean => {
  const base = colorArg.split('/')[0];
  if (
    base === 'transparent' ||
    base === 'current' ||
    base === 'inherit' ||
    base === 'auto'
  ) {
    return true;
  }
  if (/^\[var\(--.+\)\]$/.test(colorArg)) return true;
  return false;
};

const parseTokenColorArgToRgb = (colorArg: string): RgbColor | null => {
  const baseName = colorArg.split('/')[0];
  if (baseName.startsWith('[') && baseName.endsWith(']')) {
    return parseColorToRgb(baseName.slice(1, -1).replace(/_/g, ' '));
  }
  return parseColorToRgb(baseName);
};

const pickBestColorVar = (
  colorArg: string,
  propPrefix: 'bg' | 'text' | 'border',
  colorVars: ThemeVariable[],
  avoidVarNames: Set<string> = new Set(),
  companionContrastRgb: RgbColor | null = null
): ThemeVariable | null => {
  if (colorVars.length === 0) return null;

  const sourceRgb = parseTokenColorArgToRgb(colorArg);
  const candidates = colorVars.filter((v) => !avoidVarNames.has(v.name));
  const pool = candidates.length > 0 ? candidates : colorVars;

  if (!sourceRgb) {
    return (
      pool.find((v) => v.name.includes(propPrefix === 'bg' ? 'surface' : 'primary')) ||
      pool[0]
    );
  }

  const sourceLum = getLuminance(sourceRgb);
  let best = pool[0];
  let bestScore = Infinity;

  for (const tv of pool) {
    const tvRgb = parseColorToRgb(tv.value);
    if (!tvRgb) continue;
    let score = colorDistance(sourceRgb, tvRgb);

    if (propPrefix === 'bg' && sourceLum > 0.72) {
      if (/surface|container/i.test(tv.name)) score -= 45;
      if (/secondary|on-surface/i.test(tv.name)) score += 60;
    }
    if (propPrefix === 'text' && sourceLum < 0.45) {
      if (/on-surface|secondary|primary/i.test(tv.name)) score -= 25;
      if (/surface|on-primary$/i.test(tv.name)) score += 80;
    }
    if (propPrefix === 'border') {
      if (/outline|surface/i.test(tv.name)) score -= 35;
    }

    if (companionContrastRgb && (propPrefix === 'bg' || propPrefix === 'text')) {
      const contrast = getContrastRatio(tvRgb, companionContrastRgb);
      if (contrast < 3.0) {
        score += 500;
      } else if (contrast < 4.5) {
        score += 240;
      } else {
        score -= 50;
      }
    }

    if (score < bestScore) {
      bestScore = score;
      best = tv;
    }
  }

  return best;
};

const pickBestFontSizeVar = (
  pxValue: number | null,
  fontVars: ThemeVariable[]
): ThemeVariable | null => {
  if (fontVars.length === 0) return null;
  if (pxValue === null) {
    return fontVars.find((v) => v.name.includes('body')) || fontVars[0];
  }

  let best = fontVars[0];
  let bestDiff = Infinity;
  for (const tv of fontVars) {
    const varPx = parseCssSizeToPx(tv.value);
    if (varPx === null) continue;
    const diff = Math.abs(varPx - pxValue);
    if (diff < bestDiff) {
      bestDiff = diff;
      best = tv;
    }
  }
  return best;
};

const TEXT_NON_COLOR_KEYWORDS = new Set([
  'left',
  'center',
  'right',
  'justify',
  'start',
  'end',
  'wrap',
  'nowrap',
  'balance',
  'pretty',
  'truncate',
  'ellipsis',
  'clip',
]);

const BORDER_NON_COLOR_KEYWORDS = new Set([
  '0',
  '2',
  '4',
  '8',
  't',
  'r',
  'b',
  'l',
  'x',
  'y',
  's',
  'e',
  'solid',
  'dashed',
  'dotted',
  'double',
  'hidden',
  'none',
  'collapse',
  'separate',
  't-0',
  'r-0',
  'b-0',
  'l-0',
]);

const SPACING_PREFIX_RE =
  /^(p|px|py|pt|pr|pb|pl|m|mx|my|mt|mr|mb|ml|gap|gap-x|gap-y)-(.+)$/;

const OFF_GRID_TAILWIND_SPACING = new Set([
  '0.5',
  '1.5',
  '2.5',
  '3.5',
  '5',
  '7',
  '9',
  '11',
  '14',
]);

const TAILWIND_SCALE_TO_PX: Record<string, number> = {
  '0.5': 2,
  '1.5': 6,
  '2.5': 10,
  '3.5': 14,
  '5': 20,
  '7': 28,
  '9': 36,
  '11': 44,
  '14': 56,
};

export const collectSubtreeNodeIds = (
  nodes: NodesMap,
  startId: string
): string[] => {
  const result: string[] = [];
  const visited = new Set<string>();

  const walk = (id: string) => {
    if (visited.has(id)) return;
    const node = nodes[id];
    if (!node) return;
    visited.add(id);
    result.push(id);
    for (const childId of node.children || []) {
      walk(childId);
    }
  };

  const entryId = nodes[startId] ? startId : 'root';
  walk(entryId);
  return result;
};

export const lintNodeTree = (
  nodes: NodesMap,
  selectedId: string,
  themeVars: ThemeVariable[]
): DesignLintReport => {
  const rootId = nodes[selectedId] ? selectedId : 'root';
  const rootNode = nodes[rootId];
  const nodeIds = collectSubtreeNodeIds(nodes, rootId);
  const colorVars = themeVars.filter((v) => v.category === 'color');
  const fontVars = themeVars.filter((v) => v.category === 'fontSize');

  const issues: DesignLintIssue[] = [];
  const countsByCategory: Record<DesignLintCategory, number> = {
    color: 0,
    spacing: 0,
    typography: 0,
  };

  for (const nodeId of nodeIds) {
    const node: EditorNode | undefined = nodes[nodeId];
    if (!node) continue;

    const tokens = (node.props.className || '').split(/\s+/).filter(Boolean);
    const chosenColorVarsOnNode = new Set<string>();
    const colorVarByName = new Map(colorVars.map((v) => [v.name, v]));

    let effectiveBgRgb: RgbColor | null = null;
    let effectiveTextRgb: RgbColor | null = null;

    // Pre-scan existing bg & text tokens (vars or literals) to avoid colliding bg & text onto one var or low contrast
    for (const tok of tokens) {
      if (tok.includes(':')) continue;
      const bgVarMatch = tok.match(/^bg-\[var\((--[^)]+)\)\]$/);
      if (bgVarMatch) {
        chosenColorVarsOnNode.add(bgVarMatch[1]);
        const tv = colorVarByName.get(bgVarMatch[1]);
        if (tv) effectiveBgRgb = parseColorToRgb(tv.value);
        continue;
      }
      const textVarMatch = tok.match(/^text-\[var\((--[^)]+)\)\]$/);
      if (textVarMatch) {
        chosenColorVarsOnNode.add(textVarMatch[1]);
        const tv = colorVarByName.get(textVarMatch[1]);
        if (tv) effectiveTextRgb = parseColorToRgb(tv.value);
        continue;
      }
      if (tok.startsWith('bg-')) {
        const arg = tok.slice(3);
        const baseArg = arg.split('/')[0];
        if (!isColorUtilityNonLiteral(arg) && !effectiveBgRgb) {
          effectiveBgRgb = parseTokenColorArgToRgb(baseArg);
        }
      } else if (tok.startsWith('text-') && !(tok in TAILWIND_FONT_SIZE_PX)) {
        const arg = tok.slice(5);
        const baseArg = arg.split('/')[0];
        if (
          !TEXT_NON_COLOR_KEYWORDS.has(baseArg) &&
          !isColorUtilityNonLiteral(arg) &&
          !/^\[(?:length:)?-?\d/.test(baseArg) &&
          !effectiveTextRgb
        ) {
          effectiveTextRgb = parseTokenColorArgToRgb(baseArg);
        }
      }
    }

    for (const token of tokens) {
      // Skip responsive/state variant prefixes for safe deterministic autofixing
      if (token.includes(':') && !token.startsWith('text-[length:')) continue;

      // 1. Background color tokens
      if (token.startsWith('bg-')) {
        const arg = token.slice(3);
        const baseArg = arg.split('/')[0];
        if (
          !isColorUtilityNonLiteral(arg) &&
          (Boolean(TAILWIND_NAMED_HEX[baseArg]) ||
            /^\[(?:#|rgb|hsl|oklch)/i.test(baseArg))
        ) {
          const matchedVar = pickBestColorVar(
            arg,
            'bg',
            colorVars,
            chosenColorVarsOnNode,
            effectiveTextRgb
          );
          const replacement = matchedVar ? `bg-[var(${matchedVar.name})]` : null;
          if (matchedVar) {
            chosenColorVarsOnNode.add(matchedVar.name);
            effectiveBgRgb = parseColorToRgb(matchedVar.value) ?? effectiveBgRgb;
          }
          countsByCategory.color += 1;
          issues.push({
            id: `${nodeId}:color:${token}`,
            nodeId,
            nodeName: node.name || node.type,
            nodeType: node.type,
            category: 'color',
            severity: 'warning',
            token,
            replacement,
            message: matchedVar
              ? `Zakodowane tło "${token}" zastąp zmienną ${matchedVar.name}.`
              : `Zakodowane tło "${token}" (brak zmiennej koloru w motywie).`,
          });
          continue;
        }
      }

      // 2. Font size & text color tokens
      if (token.startsWith('text-')) {
        if (token.startsWith('text-[length:var(')) continue;

        if (token in TAILWIND_FONT_SIZE_PX) {
          const pxVal = TAILWIND_FONT_SIZE_PX[token];
          const matchedFontVar = pickBestFontSizeVar(pxVal, fontVars);
          const replacement = matchedFontVar
            ? `text-[length:var(${matchedFontVar.name})]`
            : null;
          countsByCategory.typography += 1;
          issues.push({
            id: `${nodeId}:typography:${token}`,
            nodeId,
            nodeName: node.name || node.type,
            nodeType: node.type,
            category: 'typography',
            severity: 'info',
            token,
            replacement,
            message: matchedFontVar
              ? `Stały rozmiar fontu "${token}" zamień na ${matchedFontVar.name}.`
              : `Stały rozmiar fontu "${token}" nie korzysta ze zmiennej typograficznej.`,
          });
          continue;
        }

        const arbitrarySizeMatch = token.match(
          /^text-\[(?:length:)?(-?\d+(?:\.\d+)?(?:px|rem))\]$/
        );
        if (arbitrarySizeMatch) {
          const pxVal = parseCssSizeToPx(arbitrarySizeMatch[1]);
          const matchedFontVar = pickBestFontSizeVar(pxVal, fontVars);
          const replacement = matchedFontVar
            ? `text-[length:var(${matchedFontVar.name})]`
            : null;
          countsByCategory.typography += 1;
          issues.push({
            id: `${nodeId}:typography:${token}`,
            nodeId,
            nodeName: node.name || node.type,
            nodeType: node.type,
            category: 'typography',
            severity: 'warning',
            token,
            replacement,
            message: matchedFontVar
              ? `Dowolny rozmiar "${token}" ujednolić zmienną ${matchedFontVar.name}.`
              : `Dowolny rozmiar fontu "${token}" poza skalą motywu.`,
          });
          continue;
        }

        const arg = token.slice(5);
        const baseArg = arg.split('/')[0];
        if (
          !TEXT_NON_COLOR_KEYWORDS.has(baseArg) &&
          !isColorUtilityNonLiteral(arg) &&
          (Boolean(TAILWIND_NAMED_HEX[baseArg]) ||
            /^\[(?:#|rgb|hsl|oklch)/i.test(baseArg))
        ) {
          // Keep intentional white contrast text untouched unless an explicit light foreground token exists
          if (baseArg === 'white') {
            const onPrimaryVar = colorVars.find((v) =>
              /on-primary/i.test(v.name)
            );
            const matchedVar = onPrimaryVar || null;
            if (matchedVar) {
              chosenColorVarsOnNode.add(matchedVar.name);
              effectiveTextRgb =
                parseColorToRgb(matchedVar.value) ?? effectiveTextRgb;
              countsByCategory.color += 1;
              issues.push({
                id: `${nodeId}:color:${token}`,
                nodeId,
                nodeName: node.name || node.type,
                nodeType: node.type,
                category: 'color',
                severity: 'info',
                token,
                replacement: `text-[var(${matchedVar.name})]`,
                message: `Zakodowany kolor tekstu "${token}" zastąp zmienną ${matchedVar.name}.`,
              });
            }
            continue;
          }

          const matchedVar = pickBestColorVar(
            arg,
            'text',
            colorVars,
            chosenColorVarsOnNode,
            effectiveBgRgb
          );
          const replacement = matchedVar
            ? `text-[var(${matchedVar.name})]`
            : null;
          if (matchedVar) {
            chosenColorVarsOnNode.add(matchedVar.name);
            effectiveTextRgb =
              parseColorToRgb(matchedVar.value) ?? effectiveTextRgb;
          }
          countsByCategory.color += 1;
          issues.push({
            id: `${nodeId}:color:${token}`,
            nodeId,
            nodeName: node.name || node.type,
            nodeType: node.type,
            category: 'color',
            severity: 'warning',
            token,
            replacement,
            message: matchedVar
              ? `Zakodowany kolor tekstu "${token}" zastąp zmienną ${matchedVar.name}.`
              : `Zakodowany kolor tekstu "${token}" (brak zmiennej koloru w motywie).`,
          });
          continue;
        }
      }

      // 3. Border color tokens
      if (token.startsWith('border-')) {
        const arg = token.slice(7);
        const baseArg = arg.split('/')[0];
        if (
          !BORDER_NON_COLOR_KEYWORDS.has(baseArg) &&
          !isColorUtilityNonLiteral(arg) &&
          (Boolean(TAILWIND_NAMED_HEX[baseArg]) ||
            /^\[(?:#|rgb|hsl|oklch)/i.test(baseArg))
        ) {
          const matchedVar = pickBestColorVar(arg, 'border', colorVars);
          const replacement = matchedVar
            ? `border-[var(${matchedVar.name})]`
            : null;
          countsByCategory.color += 1;
          issues.push({
            id: `${nodeId}:color:${token}`,
            nodeId,
            nodeName: node.name || node.type,
            nodeType: node.type,
            category: 'color',
            severity: 'info',
            token,
            replacement,
            message: matchedVar
              ? `Zakodowane obramowanie "${token}" zamień na ${matchedVar.name}.`
              : `Zakodowane obramowanie "${token}" nie korzysta ze zmiennej motywu.`,
          });
          continue;
        }
      }

      // 4. Hardcoded spacing (arbitrary [Npx]/[Nrem] or off-grid spacing steps)
      const spacingMatch = token.match(SPACING_PREFIX_RE);
      if (spacingMatch) {
        const [, prefix, val] = spacingMatch;
        const arbMatch = val.match(/^\[(-?\d+(?:\.\d+)?(?:px|rem))\]$/);
        if (arbMatch) {
          const pxVal = parseCssSizeToPx(arbMatch[1]);
          const snapped = snapPxToStandardSpacingScale(Math.max(0, pxVal ?? 16));
          const replacement = `${prefix}-${snapped}`;
          countsByCategory.spacing += 1;
          issues.push({
            id: `${nodeId}:spacing:${token}`,
            nodeId,
            nodeName: node.name || node.type,
            nodeType: node.type,
            category: 'spacing',
            severity: 'warning',
            token,
            replacement,
            message: `Niestandardowy odstęp "${token}" wyrównaj do skali siatki (${replacement}).`,
          });
          continue;
        }

        if (OFF_GRID_TAILWIND_SPACING.has(val)) {
          const pxVal = TAILWIND_SCALE_TO_PX[val] ?? 16;
          const snapped = snapPxToStandardSpacingScale(pxVal);
          const replacement = `${prefix}-${snapped}`;
          if (replacement !== token) {
            countsByCategory.spacing += 1;
            issues.push({
              id: `${nodeId}:spacing:${token}`,
              nodeId,
              nodeName: node.name || node.type,
              nodeType: node.type,
              category: 'spacing',
              severity: 'info',
              token,
              replacement,
              message: `Pośredni odstęp "${token}" poza rytmem 8px zamień na ${replacement}.`,
            });
          }
        }
      }
    }
  }

  return {
    rootNodeId: rootId,
    rootNodeName: rootNode?.name || rootNode?.type || 'Root',
    scannedNodeCount: nodeIds.length,
    issues,
    fixableCount: issues.filter((i) => Boolean(i.replacement)).length,
    countsByCategory,
  };
};

const replaceClassToken = (
  className: string,
  targetToken: string,
  replacement: string
): string => {
  const tokens = className.split(/\s+/).filter(Boolean);
  const replaced = tokens.map((tok) => (tok === targetToken ? replacement : tok));
  return Array.from(new Set(replaced)).join(' ');
};

export const applyDesignLintFix = (
  nodes: NodesMap,
  issue: DesignLintIssue
): NodesMap => {
  if (!issue.replacement) return nodes;
  const node = nodes[issue.nodeId];
  if (!node) return nodes;

  const currentClass = node.props.className || '';
  const nextClass = replaceClassToken(currentClass, issue.token, issue.replacement);
  if (nextClass === currentClass) return nodes;

  return {
    ...nodes,
    [issue.nodeId]: {
      ...node,
      props: {
        ...node.props,
        className: nextClass,
      },
    },
  };
};

export const fixAllDesignLintIssues = (
  nodes: NodesMap,
  selectedId: string,
  themeVars: ThemeVariable[]
): { nodes: NodesMap; fixedCount: number } => {
  const report = lintNodeTree(nodes, selectedId, themeVars);
  let nextNodes = nodes;
  let fixedCount = 0;

  for (const issue of report.issues) {
    if (!issue.replacement) continue;
    const updated = applyDesignLintFix(nextNodes, issue);
    if (updated !== nextNodes) {
      nextNodes = updated;
      fixedCount += 1;
    }
  }

  return { nodes: nextNodes, fixedCount };
};
