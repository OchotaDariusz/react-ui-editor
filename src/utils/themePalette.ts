import { generateId } from './editorLogic';
import type { ThemeVariable } from '../types/editor';

export interface GeneratedThemeColor {
  name: string;
  label: string;
  value: string;
}

export interface GeneratedThemePalette {
  paletteName: string;
  rationale: string;
  colors: GeneratedThemeColor[];
}

export function normalizeHexColor(value: string): string | null {
  const trimmed = (value || '').trim();
  const fullMatch = trimmed.match(/^#([0-9a-fA-F]{6})$/);
  if (fullMatch) {
    return `#${fullMatch[1].toLowerCase()}`;
  }
  const shortMatch = trimmed.match(/^#([0-9a-fA-F]{3})$/);
  if (shortMatch) {
    const [r, g, b] = shortMatch[1].toLowerCase().split('');
    return `#${r}${r}${g}${g}${b}${b}`;
  }
  return null;
}

export function normalizeThemeColorVarName(rawName: string): string {
  const cleaned = (rawName || '')
    .trim()
    .toLowerCase()
    .replace(/^var\((.+)\)$/, '$1')
    .replace(/[^a-z0-9-_]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');

  if (!cleaned) return '';
  return `--${cleaned}`;
}

export function sanitizeGeneratedColors(
  colors: ReadonlyArray<{ name?: unknown; label?: unknown; value?: unknown }>
): GeneratedThemeColor[] {
  const seen = new Set<string>();
  const result: GeneratedThemeColor[] = [];

  for (const item of colors) {
    if (!item || typeof item !== 'object') continue;
    const rawName = typeof item.name === 'string' ? item.name : '';
    const rawValue = typeof item.value === 'string' ? item.value : '';
    const rawLabel = typeof item.label === 'string' ? item.label : '';

    const normalizedName = normalizeThemeColorVarName(rawName);
    const normalizedHex = normalizeHexColor(rawValue);
    if (!normalizedName || !normalizedHex || seen.has(normalizedName)) {
      continue;
    }

    seen.add(normalizedName);
    result.push({
      name: normalizedName,
      label:
        rawLabel.trim() ||
        normalizedName.replace(/^--/, '').replace(/-/g, ' '),
      value: normalizedHex,
    });
  }

  return result;
}

export function mergeGeneratedPaletteIntoThemeVars(
  currentVars: readonly ThemeVariable[],
  generatedColors: readonly GeneratedThemeColor[],
  idFactory: () => string = generateId
): ThemeVariable[] {
  if (generatedColors.length === 0) return [...currentVars];

  const colorMap = new Map<string, GeneratedThemeColor>();
  for (const c of generatedColors) {
    const normName = normalizeThemeColorVarName(c.name);
    const normHex = normalizeHexColor(c.value);
    if (normName && normHex && !colorMap.has(normName)) {
      colorMap.set(normName, {
        name: normName,
        label: c.label.trim() || normName.replace(/^--/, ''),
        value: normHex,
      });
    }
  }

  const consumed = new Set<string>();
  const updatedExisting = currentVars.map((existing) => {
    if (existing.category !== 'color') {
      return { ...existing };
    }
    const normExistingName = normalizeThemeColorVarName(existing.name);
    const match = colorMap.get(normExistingName);
    if (!match) {
      return { ...existing };
    }
    consumed.add(normExistingName);
    return {
      ...existing,
      value: match.value,
    };
  });

  const additions: ThemeVariable[] = [];
  for (const [normName, item] of colorMap.entries()) {
    if (consumed.has(normName)) continue;
    additions.push({
      id: idFactory(),
      name: normName,
      label: item.label,
      value: item.value,
      category: 'color',
    });
  }

  return [...updatedExisting, ...additions];
}
