import type {
  EditorNode,
  NodesMap,
  ThemeVarCategory,
  ThemeVariable,
} from '../types/editor';

export type ThemeUsageChannel =
  | 'Text'
  | 'Bg'
  | 'Border'
  | 'Font Size'
  | 'Arbitrary'
  | 'Override';

export interface ThemeUsageItem {
  varName: string;
  label: string;
  category: ThemeVarCategory;
  channels: ThemeUsageChannel[];
  matchedClasses: string[];
  globalValue: string;
  inheritedValue: string | null;
  inheritedFromName: string | null;
  localOverride: string | null;
  effectiveValue: string;
  isDefinedGlobally: boolean;
  isUsedDirectly: boolean;
  isLocallyOverridden: boolean;
}

export interface NodeThemeUsageReport {
  nodeId: string;
  nodeName: string;
  items: ThemeUsageItem[];
  usedCount: number;
  overriddenCount: number;
  childVarCount: number;
}

const normalizeVar = (rawName: string): string => {
  const cleaned = rawName.trim().replace(/[^a-zA-Z0-9_-]/g, '');
  if (!cleaned) return '';
  return cleaned.startsWith('--') ? cleaned : `--${cleaned}`;
};

const classifyTokenChannel = (token: string): ThemeUsageChannel => {
  if (/^text-\[length:var\(/.test(token)) return 'Font Size';
  if (/^bg-\[var\(/.test(token)) return 'Bg';
  if (/^border(?:-[trblxy])?-\[var\(/.test(token)) return 'Border';
  if (/^text-\[var\(/.test(token)) return 'Text';
  return 'Arbitrary';
};

const inferCategory = (
  varName: string,
  channels: ThemeUsageChannel[],
  globalVar?: ThemeVariable
): ThemeVarCategory => {
  if (globalVar) return globalVar.category;
  if (
    channels.includes('Font Size') ||
    /font-size|text-size|leading|radius|spacing/i.test(varName)
  ) {
    return 'fontSize';
  }
  return 'color';
};

export interface RawVarUsage {
  varName: string;
  channels: Set<ThemeUsageChannel>;
  classes: Set<string>;
}

export const extractCssVarReferencesFromClassName = (
  className = ''
): Map<string, RawVarUsage> => {
  const map = new Map<string, RawVarUsage>();
  const tokens = className.split(/\s+/).filter(Boolean);

  for (const token of tokens) {
    const varRegex = /var\(\s*(--[a-zA-Z0-9_-]+)\s*(?:,[^)]+)?\)/g;
    let match: RegExpExecArray | null;
    while ((match = varRegex.exec(token)) !== null) {
      const varName = normalizeVar(match[1]);
      if (!varName) continue;
      let entry = map.get(varName);
      if (!entry) {
        entry = {
          varName,
          channels: new Set<ThemeUsageChannel>(),
          classes: new Set<string>(),
        };
        map.set(varName, entry);
      }
      entry.channels.add(classifyTokenChannel(token));
      entry.classes.add(token);
    }
  }

  return map;
};

export const resolveAncestorThemeOverride = (
  nodes: NodesMap,
  nodeId: string,
  varName: string
): { value: string; fromNodeName: string } | null => {
  const normalized = normalizeVar(varName);
  if (!normalized) return null;

  const visited = new Set<string>([nodeId]);
  let currId = nodes[nodeId]?.parentId;

  while (currId && nodes[currId] && !visited.has(currId)) {
    visited.add(currId);
    const ancestor = nodes[currId];
    const val = ancestor.themeOverrides?.[normalized];
    if (typeof val === 'string' && val.trim()) {
      return {
        value: val.trim(),
        fromNodeName: ancestor.name || ancestor.type,
      };
    }
    currId = ancestor.parentId;
  }

  return null;
};

const countDescendantCssVars = (
  nodes: NodesMap,
  rootNodeId: string
): number => {
  const found = new Set<string>();
  const visited = new Set<string>();

  const walk = (id: string) => {
    if (visited.has(id)) return;
    visited.add(id);
    const node = nodes[id];
    if (!node) return;
    if (id !== rootNodeId) {
      const refs = extractCssVarReferencesFromClassName(node.props.className || '');
      for (const name of refs.keys()) {
        found.add(name);
      }
    }
    for (const childId of node.children || []) {
      walk(childId);
    }
  };

  walk(rootNodeId);
  return found.size;
};

export const analyzeNodeThemeUsage = (
  selectedNode: EditorNode | undefined,
  nodes: NodesMap,
  themeVars: ThemeVariable[]
): NodeThemeUsageReport | null => {
  if (!selectedNode) return null;

  const globalByName = new Map<string, ThemeVariable>();
  for (const tv of themeVars) {
    const norm = normalizeVar(tv.name);
    if (norm) globalByName.set(norm, { ...tv, name: norm });
  }

  const directRefs = extractCssVarReferencesFromClassName(
    selectedNode.props.className || ''
  );
  const localOverrides = selectedNode.themeOverrides || {};

  const orderedVarNames: string[] = [];
  const seen = new Set<string>();

  for (const varName of directRefs.keys()) {
    if (!seen.has(varName)) {
      seen.add(varName);
      orderedVarNames.push(varName);
    }
  }
  for (const rawName of Object.keys(localOverrides)) {
    const norm = normalizeVar(rawName);
    if (norm && !seen.has(norm)) {
      seen.add(norm);
      orderedVarNames.push(norm);
    }
  }

  const items: ThemeUsageItem[] = orderedVarNames.map((varName) => {
    const direct = directRefs.get(varName);
    const globalVar = globalByName.get(varName);
    const inherited = resolveAncestorThemeOverride(nodes, selectedNode.id, varName);
    const localRaw = localOverrides[varName];
    const localOverride =
      typeof localRaw === 'string' && localRaw.trim() ? localRaw.trim() : null;

    const channels: ThemeUsageChannel[] = direct
      ? Array.from(direct.channels)
      : ['Override'];
    const matchedClasses = direct ? Array.from(direct.classes) : [];
    const category = inferCategory(varName, channels, globalVar);
    const globalValue = globalVar?.value || '';
    const effectiveValue =
      localOverride || inherited?.value || globalValue || '';

    return {
      varName,
      label: globalVar?.label || varName.replace(/^--/, ''),
      category,
      channels,
      matchedClasses,
      globalValue,
      inheritedValue: inherited?.value ?? null,
      inheritedFromName: inherited?.fromNodeName ?? null,
      localOverride,
      effectiveValue,
      isDefinedGlobally: Boolean(globalVar),
      isUsedDirectly: Boolean(direct),
      isLocallyOverridden: localOverride !== null,
    };
  });

  return {
    nodeId: selectedNode.id,
    nodeName: selectedNode.name || selectedNode.type,
    items,
    usedCount: directRefs.size,
    overriddenCount: items.filter((item) => item.isLocallyOverridden).length,
    childVarCount: countDescendantCssVars(nodes, selectedNode.id),
  };
};

export const setNodeThemeOverrideInTree = (
  nodes: NodesMap,
  nodeId: string,
  varName: string,
  overrideValue: string | null
): NodesMap => {
  const node = nodes[nodeId];
  const normalized = normalizeVar(varName);
  if (!node || !normalized) return nodes;

  const existing = { ...(node.themeOverrides || {}) };
  if (overrideValue === null || !overrideValue.trim()) {
    if (!(normalized in existing)) return nodes;
    delete existing[normalized];
  } else {
    const cleanVal = overrideValue.replace(/[;{}<>]/g, '').trim();
    if (!cleanVal) return nodes;
    existing[normalized] = cleanVal;
  }

  const nextNode: EditorNode = { ...node };
  if (Object.keys(existing).length > 0) {
    nextNode.themeOverrides = existing;
  } else {
    delete nextNode.themeOverrides;
  }

  return {
    ...nodes,
    [nodeId]: nextNode,
  };
};

export const clearAllNodeThemeOverridesInTree = (
  nodes: NodesMap,
  nodeId: string
): NodesMap => {
  const node = nodes[nodeId];
  if (!node || !node.themeOverrides || Object.keys(node.themeOverrides).length === 0) {
    return nodes;
  }
  const nextNode: EditorNode = { ...node };
  delete nextNode.themeOverrides;
  return {
    ...nodes,
    [nodeId]: nextNode,
  };
};

export const buildScopedThemeOverrideCssRules = (
  nodes: NodesMap,
  attrName: 'data-node-id' | 'data-theme-scope' = 'data-node-id'
): string => {
  const blocks: string[] = [];

  for (const node of Object.values(nodes)) {
    const overrides = node.themeOverrides;
    if (!overrides) continue;

    const declarations: string[] = [];
    for (const [rawKey, rawValue] of Object.entries(overrides)) {
      const varName = normalizeVar(rawKey);
      const safeVal = (rawValue || '').replace(/[;{}<>]/g, '').trim();
      if (!varName || !safeVal) continue;
      declarations.push(`  ${varName}: ${safeVal};`);
    }

    if (declarations.length > 0) {
      const safeId = node.id.replace(/["\\]/g, '\\$&');
      blocks.push(`[${attrName}="${safeId}"] {\n${declarations.join('\n')}\n}`);
    }
  }

  return blocks.join('\n');
};
