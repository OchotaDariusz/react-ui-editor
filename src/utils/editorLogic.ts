import {
  COMPONENT_VARIANTS,
  ELEMENT_TEMPLATES,
  type ComponentVariantOption,
  type TemplateBlueprintNode,
} from '../constants/editorDefaults';
import type {
  ComponentHistoryEntry,
  ComponentHistoryEventType,
  EditorNode,
  NodeBlueprint,
  NodesMap,
  NodeType,
  RecentComponentSearch,
  SeoMetadata,
  ThemePreset,
  ThemeVarCategory,
  ThemeVariable,
} from '../types/editor';

export const generateId = (): string =>
  `node_${Math.random().toString(36).slice(2, 9)}`;

export const toggleTailwindGroup = (
  currentClass = '',
  groupClasses: string[] = [],
  nextClass = ''
): string => {
  const tokens = currentClass.split(/\s+/).filter(Boolean);
  const filtered = tokens.filter((t) => !groupClasses.includes(t));
  if (nextClass) {
    filtered.push(nextClass);
  }
  return filtered.join(' ');
};

export const isContainerNodeType = (type: NodeType): boolean =>
  type === 'Container' || type === 'Grid';

export const resolveTargetParentId = (
  nodes: NodesMap,
  selectedId: string
): string => {
  const selected = nodes[selectedId];
  if (!selected) return 'root';
  if (isContainerNodeType(selected.type)) return selectedId;
  return selected.parentId && nodes[selected.parentId]
    ? selected.parentId
    : 'root';
};

export const addNodeToTree = (
  prev: NodesMap,
  selectedId: string,
  type: NodeType,
  idFactory: () => string = generateId
): { nodes: NodesMap; createdId: string | null } => {
  const template = ELEMENT_TEMPLATES[type];
  if (!template) return { nodes: prev, createdId: null };

  const newId = idFactory();
  const targetParentId = resolveTargetParentId(prev, selectedId);
  const parent = prev[targetParentId];
  if (!parent) return { nodes: prev, createdId: null };

  const clonedTemplate = JSON.parse(JSON.stringify(template)) as Omit<
    EditorNode,
    'id' | 'parentId'
  >;

  const newNode: EditorNode = {
    ...clonedTemplate,
    id: newId,
    parentId: targetParentId,
  };

  return {
    createdId: newId,
    nodes: {
      ...prev,
      [newId]: newNode,
      [targetParentId]: {
        ...parent,
        children: [...parent.children, newId],
      },
    },
  };
};

export const addCardPresetToTree = (
  prev: NodesMap,
  selectedId: string,
  idFactory: () => string = generateId
): { nodes: NodesMap; createdId: string | null } => {
  const targetParentId = resolveTargetParentId(prev, selectedId);
  const parent = prev[targetParentId];
  if (!parent) return { nodes: prev, createdId: null };

  const cardId = idFactory();
  const imgId = idFactory();
  const titleId = idFactory();
  const descId = idFactory();
  const btnId = idFactory();

  return {
    createdId: cardId,
    nodes: {
      ...prev,
      [cardId]: {
        id: cardId,
        type: 'Container',
        name: 'Karta Produktu',
        parentId: targetParentId,
        props: {
          className:
            'p-5 bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col gap-3 max-w-sm',
        },
        children: [imgId, titleId, descId, btnId],
      },
      [imgId]: {
        id: imgId,
        type: 'Image',
        name: 'Miniatura',
        parentId: cardId,
        props: {
          className: 'w-full h-40 rounded-xl object-cover',
          src: '/assets/preview-card.svg',
        },
        children: [],
      },
      [titleId]: {
        id: titleId,
        type: 'Heading',
        name: 'Tytuł karty',
        content: 'Komponent Karty',
        parentId: cardId,
        props: { className: 'text-lg font-bold text-slate-900' },
        children: [],
      },
      [descId]: {
        id: descId,
        type: 'Text',
        name: 'Opis karty',
        content:
          'Gotowy układ wieloelementowy, który możesz dowolnie rozbudowywać.',
        parentId: cardId,
        props: { className: 'text-sm text-slate-600' },
        children: [],
      },
      [btnId]: {
        id: btnId,
        type: 'Button',
        name: 'Akcja',
        content: 'Zobacz szczegóły',
        parentId: cardId,
        props: {
          className:
            'mt-1 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 text-sm font-medium w-full',
        },
        children: [],
      },
      [targetParentId]: {
        ...parent,
        children: [...parent.children, cardId],
      },
    },
  };
};

export const updateNodeInTree = (
  prev: NodesMap,
  selectedId: string,
  key: string,
  value: string,
  isProp = false
): NodesMap => {
  const existing = prev[selectedId];
  if (!existing) return prev;

  const updated: EditorNode = isProp
    ? { ...existing, props: { ...existing.props, [key]: value } }
    : { ...existing, [key]: value };

  return {
    ...prev,
    [selectedId]: updated,
  };
};

export const duplicateNodeInTree = (
  prev: NodesMap,
  selectedId: string,
  idFactory: () => string = generateId
): { nodes: NodesMap; createdId: string | null } => {
  if (selectedId === 'root') return { nodes: prev, createdId: null };
  const target = prev[selectedId];
  if (!target || !target.parentId || !prev[target.parentId]) {
    return { nodes: prev, createdId: null };
  }

  const next: NodesMap = { ...prev };

  const cloneSubtree = (oldId: string, newParentId: string): string => {
    const original = next[oldId];
    const newId = idFactory();
    const clonedChildren = (original.children || []).map((cId) =>
      cloneSubtree(cId, newId)
    );
    const deepCopy = JSON.parse(JSON.stringify(original)) as EditorNode;
    next[newId] = {
      ...deepCopy,
      id: newId,
      name: `${original.name || original.type} (kopia)`,
      parentId: newParentId,
      children: clonedChildren,
    };
    return newId;
  };

  const rootCloneId = cloneSubtree(selectedId, target.parentId);
  const parent = next[target.parentId];
  const idx = parent.children.indexOf(selectedId);
  const updatedChildren = [...parent.children];
  updatedChildren.splice(idx + 1, 0, rootCloneId);

  next[target.parentId] = { ...parent, children: updatedChildren };
  return { nodes: next, createdId: rootCloneId };
};

export const moveNodeInTree = (
  prev: NodesMap,
  selectedId: string,
  direction: -1 | 1
): NodesMap => {
  if (selectedId === 'root') return prev;
  const node = prev[selectedId];
  if (!node || !node.parentId) return prev;
  const parent = prev[node.parentId];
  if (!parent) return prev;

  const idx = parent.children.indexOf(selectedId);
  const swapIdx = idx + direction;
  if (idx === -1 || swapIdx < 0 || swapIdx >= parent.children.length) {
    return prev;
  }

  const newChildren = [...parent.children];
  [newChildren[idx], newChildren[swapIdx]] = [
    newChildren[swapIdx],
    newChildren[idx],
  ];

  return {
    ...prev,
    [parent.id]: { ...parent, children: newChildren },
  };
};

export type DropPosition = 'before' | 'after' | 'inside';

export const isDescendantOrSelf = (
  nodes: NodesMap,
  candidateId: string,
  ancestorId: string
): boolean => {
  let curr: string | null | undefined = candidateId;
  const visited = new Set<string>();
  while (curr) {
    if (curr === ancestorId) return true;
    if (visited.has(curr)) break;
    visited.add(curr);
    curr = nodes[curr]?.parentId;
  }
  return false;
};

export const moveNodeRelativeToTarget = (
  prev: NodesMap,
  dragId: string,
  targetId: string,
  position: DropPosition
): NodesMap => {
  if (dragId === 'root' || dragId === targetId) return prev;
  const dragNode = prev[dragId];
  const targetNode = prev[targetId];
  if (!dragNode || !targetNode || !dragNode.parentId) return prev;

  const oldParent = prev[dragNode.parentId];
  if (!oldParent) return prev;

  let targetParentId: string;
  if (position === 'inside') {
    if (!isContainerNodeType(targetNode.type)) return prev;
    targetParentId = targetId;
  } else {
    if (!targetNode.parentId) return prev;
    targetParentId = targetNode.parentId;
  }

  const targetParent = prev[targetParentId];
  if (!targetParent || !isContainerNodeType(targetParent.type)) return prev;

  // Prevent dropping a container into itself or any of its descendants
  if (isDescendantOrSelf(prev, targetParentId, dragId)) return prev;

  const oldParentChildren = oldParent.children.filter((id) => id !== dragId);

  if (oldParent.id === targetParent.id) {
    let insertIndex: number;
    if (position === 'inside') {
      insertIndex = oldParentChildren.length;
    } else {
      const targetIndex = oldParentChildren.indexOf(targetId);
      if (targetIndex === -1) return prev;
      insertIndex = position === 'before' ? targetIndex : targetIndex + 1;
    }

    const nextChildren = [...oldParentChildren];
    nextChildren.splice(insertIndex, 0, dragId);

    const unchanged =
      nextChildren.length === oldParent.children.length &&
      nextChildren.every((id, idx) => id === oldParent.children[idx]);
    if (unchanged) return prev;

    return {
      ...prev,
      [oldParent.id]: { ...oldParent, children: nextChildren },
    };
  }

  const targetParentChildren = [...targetParent.children];
  let insertIndex: number;
  if (position === 'inside') {
    insertIndex = targetParentChildren.length;
  } else {
    const targetIndex = targetParentChildren.indexOf(targetId);
    if (targetIndex === -1) return prev;
    insertIndex = position === 'before' ? targetIndex : targetIndex + 1;
  }
  targetParentChildren.splice(insertIndex, 0, dragId);

  return {
    ...prev,
    [oldParent.id]: { ...oldParent, children: oldParentChildren },
    [targetParent.id]: { ...targetParent, children: targetParentChildren },
    [dragId]: { ...dragNode, parentId: targetParentId },
  };
};

export const deleteNodeFromTree = (
  prev: NodesMap,
  selectedId: string
): { nodes: NodesMap; nextSelectedId: string } => {
  if (selectedId === 'root' || !prev[selectedId]) {
    return { nodes: prev, nextSelectedId: selectedId };
  }

  const next: NodesMap = { ...prev };
  const nodeToDelete = next[selectedId];
  const parentId = nodeToDelete.parentId;

  const deleteRecursively = (id: string) => {
    const n = next[id];
    if (n?.children) {
      n.children.forEach(deleteRecursively);
    }
    delete next[id];
  };

  if (parentId && next[parentId]) {
    next[parentId] = {
      ...next[parentId],
      children: next[parentId].children.filter((id) => id !== selectedId),
    };
  }

  deleteRecursively(selectedId);
  return { nodes: next, nextSelectedId: 'root' };
};

const escapeAttr = (value: string): string => value.replace(/"/g, '&quot;');

const buildNodeJSX = (
  nodes: NodesMap,
  id: string,
  indent = '    '
): string => {
  const node = nodes[id];
  if (!node) return '';
  const props = node.props || {};
  const cleanClass = (props.className || '').replace(/\s+/g, ' ').trim();
  let propsStr = cleanClass ? ` className="${escapeAttr(cleanClass)}"` : '';

  if (node.type === 'Input' && props.placeholder) {
    propsStr += ` placeholder="${escapeAttr(props.placeholder)}"`;
  }
  if (node.type === 'Image' && props.src) {
    propsStr += ` src="${escapeAttr(props.src)}" alt="${escapeAttr(
      node.name || 'image'
    )}"`;
  }

  if (isContainerNodeType(node.type)) {
    if (node.children.length === 0) return `${indent}<div${propsStr} />\n`;
    const inner = node.children
      .map((cId) => buildNodeJSX(nodes, cId, indent + '  '))
      .join('');
    return `${indent}<div${propsStr}>\n${inner}${indent}</div>\n`;
  }
  if (node.type === 'Heading') {
    return `${indent}<h2${propsStr}>${node.content || ''}</h2>\n`;
  }
  if (node.type === 'Text') {
    return `${indent}<p${propsStr}>${node.content || ''}</p>\n`;
  }
  if (node.type === 'Badge') {
    return `${indent}<span${propsStr}>${node.content || ''}</span>\n`;
  }
  if (node.type === 'Button') {
    return `${indent}<button type="button"${propsStr}>${node.content || ''}</button>\n`;
  }
  if (node.type === 'Input') {
    return `${indent}<input${propsStr} />\n`;
  }
  if (node.type === 'Image') {
    return `${indent}<img${propsStr} />\n`;
  }
  if (node.type === 'Icon') {
    const iconTag = (props.iconName || 'Star').replace(/[^A-Za-z0-9_]/g, '') || 'Star';
    return `${indent}<${iconTag}${propsStr} />\n`;
  }
  return '';
};

const collectUsedIconNames = (nodes: NodesMap): string[] => {
  const names = new Set<string>();
  for (const node of Object.values(nodes)) {
    if (node.type === 'Icon') {
      const clean = (node.props?.iconName || 'Star').replace(/[^A-Za-z0-9_]/g, '');
      if (clean) names.add(clean);
    }
  }
  return Array.from(names).sort();
};

const escapeHtmlText = (value: string): string =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export const generateReactJSX = (
  nodes: NodesMap,
  seo?: SeoMetadata
): string => {
  const iconNames = collectUsedIconNames(nodes);
  const iconImport =
    iconNames.length > 0
      ? `import { ${iconNames.join(', ')} } from 'lucide-react';\n`
      : '';

  const seoLines: string[] = [];
  const cleanTitle = seo?.title?.trim();
  const cleanDesc = seo?.description?.trim();
  const cleanCanonical = seo?.canonicalUrl?.trim();

  if (cleanTitle) {
    seoLines.push(`      <title>${escapeHtmlText(cleanTitle)}</title>`);
  }
  if (cleanDesc) {
    seoLines.push(
      `      <meta name="description" content="${escapeAttr(cleanDesc)}" />`
    );
  }
  if (cleanCanonical) {
    seoLines.push(
      `      <link rel="canonical" href="${escapeAttr(cleanCanonical)}" />`
    );
  }

  if (seoLines.length > 0) {
    const rootMarkup = buildNodeJSX(nodes, 'root', '      ');
    return `import React from 'react';\n${iconImport}\nexport default function GeneratedUI() {\n  return (\n    <>\n${seoLines.join(
      '\n'
    )}\n${rootMarkup}    </>\n  );\n}\n`;
  }

  return `import React from 'react';\n${iconImport}\nexport default function GeneratedUI() {\n  return (\n${buildNodeJSX(
    nodes,
    'root',
    '    '
  )}  );\n}\n`;
};

export const serializeNodesToJson = (nodes: NodesMap): string =>
  JSON.stringify(nodes, null, 2);

export const generateNodeJSXSnippet = (
  nodes: NodesMap,
  nodeId: string
): string => buildNodeJSX(nodes, nodeId, '').trimEnd();

export interface SearchableComponent {
  type: string;
  label: string;
  keywords?: string;
}

export const normalizeSearchText = (value: string): string =>
  value
    .replace(/[łŁ]/g, 'l')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

export const filterComponentsByQuery = <T extends SearchableComponent>(
  items: readonly T[],
  query: string
): T[] => {
  const normalizedQuery = normalizeSearchText(query);
  if (!normalizedQuery) return [...items];

  return items.filter((item) => {
    const labelMatch = normalizeSearchText(item.label).includes(normalizedQuery);
    const typeMatch = normalizeSearchText(item.type).includes(normalizedQuery);
    const keywordsMatch = item.keywords
      ? normalizeSearchText(item.keywords).includes(normalizedQuery)
      : false;
    return labelMatch || typeMatch || keywordsMatch;
  });
};

export type PaddingPrefix = 'p' | 'px' | 'py' | 'pt' | 'pr' | 'pb' | 'pl';
export type MarginPrefix = 'm' | 'mx' | 'my' | 'mt' | 'mr' | 'mb' | 'ml';
export type SpacingPrefix = PaddingPrefix | MarginPrefix;

const SPACING_CLEAR_MAP: Record<SpacingPrefix, SpacingPrefix[]> = {
  p: ['p', 'px', 'py', 'pt', 'pr', 'pb', 'pl'],
  px: ['px', 'pl', 'pr'],
  py: ['py', 'pt', 'pb'],
  pt: ['pt'],
  pr: ['pr'],
  pb: ['pb'],
  pl: ['pl'],
  m: ['m', 'mx', 'my', 'mt', 'mr', 'mb', 'ml'],
  mx: ['mx', 'ml', 'mr'],
  my: ['my', 'mt', 'mb'],
  mt: ['mt'],
  mr: ['mr'],
  mb: ['mb'],
  ml: ['ml'],
};

export const getTailwindSpacingValue = (
  className = '',
  prefix: SpacingPrefix
): string => {
  const tokens = className.split(/\s+/).filter(Boolean);
  const pattern = new RegExp(`^${prefix}-([a-z0-9.]+)$`);
  let found = '';
  for (const token of tokens) {
    const match = token.match(pattern);
    if (match) {
      found = match[1];
    }
  }
  return found;
};

export const setTailwindSpacingValue = (
  className = '',
  prefix: SpacingPrefix,
  value: string
): string => {
  const tokens = className.split(/\s+/).filter(Boolean);
  const prefixesToClear = value ? SPACING_CLEAR_MAP[prefix] : [prefix];
  const clearPatterns = prefixesToClear.map(
    (p) => new RegExp(`^${p}-[a-z0-9.]+$`)
  );

  const filtered = tokens.filter(
    (token) => !clearPatterns.some((re) => re.test(token))
  );

  if (value) {
    filtered.push(`${prefix}-${value}`);
  }
  return filtered.join(' ');
};

export const getParentNodeId = (
  nodes: NodesMap,
  selectedId: string
): string | null => {
  const node = nodes[selectedId];
  if (!node || !node.parentId || !nodes[node.parentId]) return null;
  return node.parentId;
};

const OUTER_LAYOUT_TOKEN_PATTERNS = [
  /^-?m([trblxy])?-/,
  /^w-/,
  /^max-w-/,
  /^min-w-/,
  /^flex-(1|auto|initial|none)$/,
  /^grow(-0)?$/,
  /^shrink(-0)?$/,
  /^col-span-/,
  /^row-span-/,
  /^self-/,
  /^justify-self-/,
];

export const splitOuterLayoutClasses = (
  className = ''
): { outerClassName: string; innerClassName: string } => {
  const tokens = className.split(/\s+/).filter(Boolean);
  const outerTokens: string[] = [];
  const innerTokens: string[] = [];
  let hasWidthToken = false;

  for (const token of tokens) {
    if (OUTER_LAYOUT_TOKEN_PATTERNS.some((re) => re.test(token))) {
      outerTokens.push(token);
      if (/^(w-|flex-(1|auto)|grow)/.test(token)) {
        hasWidthToken = true;
      }
    } else {
      innerTokens.push(token);
    }
  }

  if (!hasWidthToken) {
    outerTokens.unshift('w-fit', 'max-w-full');
  } else {
    innerTokens.push('w-full');
  }

  return {
    outerClassName: outerTokens.join(' '),
    innerClassName: innerTokens.join(' '),
  };
};

export const TEXT_ALIGN_CLASSES = [
  'text-left',
  'text-center',
  'text-right',
  'text-justify',
] as const;

export const FONT_WEIGHT_CLASSES = [
  'font-light',
  'font-normal',
  'font-medium',
  'font-semibold',
  'font-bold',
  'font-extrabold',
] as const;

export const BOX_SHADOW_CLASSES = [
  'shadow-none',
  'shadow-xs',
  'shadow-sm',
  'shadow',
  'shadow-md',
  'shadow-lg',
  'shadow-xl',
  'shadow-2xl',
  'shadow-inner',
] as const;

export const BORDER_RADIUS_CLASSES = [
  'rounded-none',
  'rounded-xs',
  'rounded-sm',
  'rounded',
  'rounded-md',
  'rounded-lg',
  'rounded-xl',
  'rounded-2xl',
  'rounded-3xl',
  'rounded-full',
] as const;

const TEXT_COLOR_TOKEN_RE =
  /^text-(?:white|black|transparent|current|inherit|(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-\d{2,3}(?:\/\d{1,3})?|\[(?:(?:#|rgb|hsl|var\(--).*)\])$/;

export const isTailwindTextColorToken = (token: string): boolean =>
  TEXT_COLOR_TOKEN_RE.test(token);

export const getTailwindTextColor = (className = ''): string => {
  const tokens = className.split(/\s+/).filter(Boolean);
  let found = '';
  for (const token of tokens) {
    if (isTailwindTextColorToken(token)) {
      found = token;
    }
  }
  return found;
};

export const setTailwindTextColor = (
  className = '',
  nextColor = ''
): string => {
  const tokens = className.split(/\s+/).filter(Boolean);
  const filtered = tokens.filter((t) => !isTailwindTextColorToken(t));
  if (nextColor) {
    filtered.push(nextColor);
  }
  return filtered.join(' ');
};

export const getTailwindGroupToken = (
  className = '',
  groupClasses: readonly string[]
): string => {
  const tokens = className.split(/\s+/).filter(Boolean);
  let found = '';
  for (const token of tokens) {
    if (groupClasses.includes(token)) {
      found = token;
    }
  }
  return found;
};

export const FLEX_DIRECTION_CLASSES = [
  'flex-row',
  'flex-col',
  'flex-row-reverse',
  'flex-col-reverse',
] as const;

export const JUSTIFY_CONTENT_CLASSES = [
  'justify-start',
  'justify-center',
  'justify-end',
  'justify-between',
  'justify-around',
  'justify-evenly',
] as const;

export const ALIGN_ITEMS_CLASSES = [
  'items-start',
  'items-center',
  'items-end',
  'items-stretch',
  'items-baseline',
] as const;

export const setTailwindFlexDirection = (
  className = '',
  nextDirection = ''
): string => {
  const tokens = className.split(/\s+/).filter(Boolean);
  const removeSet = new Set<string>([
    'grid',
    'grid-cols-1',
    'grid-cols-2',
    'grid-cols-3',
    'grid-cols-4',
    ...FLEX_DIRECTION_CLASSES,
  ]);
  const filtered = tokens.filter((t) => !removeSet.has(t));

  if (nextDirection) {
    if (!filtered.includes('flex')) {
      filtered.push('flex');
    }
    filtered.push(nextDirection);
  }
  return filtered.join(' ');
};

const BG_COLOR_TOKEN_RE =
  /^bg-(?:white|black|transparent|current|inherit|(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-\d{2,3}(?:\/\d{1,3})?|\[(?:(?:#|rgb|hsl|var\(--).*)\])$/;

const FONT_SIZE_TOKEN_RE =
  /^text-(?:2xs|xs|sm|base|lg|xl|[2-9]xl|\[length:.*\])$/;

export const normalizeCssVarName = (raw: string): string => {
  const cleaned = raw
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-_]+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
  if (!cleaned) return '';
  return `--${cleaned}`;
};

export const setTailwindBgColor = (
  className = '',
  nextBg = ''
): string => {
  const tokens = className.split(/\s+/).filter(Boolean);
  const filtered = tokens.filter((t) => !BG_COLOR_TOKEN_RE.test(t));
  if (nextBg) {
    filtered.push(nextBg);
  }
  return filtered.join(' ');
};

export const setTailwindFontSize = (
  className = '',
  nextSize = ''
): string => {
  const tokens = className.split(/\s+/).filter(Boolean);
  const filtered = tokens.filter((t) => !FONT_SIZE_TOKEN_RE.test(t));
  if (nextSize) {
    filtered.push(nextSize);
  }
  return filtered.join(' ');
};

export const insertPageTemplateIntoTree = (
  prev: NodesMap,
  selectedId: string,
  blueprint: TemplateBlueprintNode,
  idFactory: () => string = generateId
): { nodes: NodesMap; createdId: string | null } => {
  const targetParentId = resolveTargetParentId(prev, selectedId);
  const parent = prev[targetParentId];
  if (!parent) return { nodes: prev, createdId: null };

  const nextNodes: NodesMap = { ...prev };

  const instantiate = (
    bp: TemplateBlueprintNode,
    parentId: string
  ): string => {
    const newId = idFactory();
    const childIds = (bp.children || []).map((childBp) =>
      instantiate(childBp, newId)
    );
    nextNodes[newId] = {
      id: newId,
      type: bp.type,
      name: bp.name,
      ...(bp.variant !== undefined ? { variant: bp.variant } : {}),
      ...(bp.content !== undefined ? { content: bp.content } : {}),
      parentId,
      props: { ...bp.props },
      children: childIds,
    };
    return newId;
  };

  const createdId = instantiate(blueprint, targetParentId);
  nextNodes[targetParentId] = {
    ...parent,
    children: [...parent.children, createdId],
  };

  return { nodes: nextNodes, createdId };
};

const escapeCssClassName = (cls: string): string =>
  cls.replace(/([[\]():])/g, '\\$1');

export const buildThemeCssRules = (themeVars: ThemeVariable[]): string => {
  if (themeVars.length === 0) return '';

  const rootDeclarations: string[] = [];
  const utilityRules: string[] = [];

  for (const item of themeVars) {
    const varName = normalizeCssVarName(item.name);
    const safeValue = item.value.replace(/[;{}<>]/g, '').trim();
    if (!varName || !safeValue) continue;

    rootDeclarations.push(`  ${varName}: ${safeValue};`);

    if (item.category === 'color') {
      const textCls = escapeCssClassName(`text-[var(${varName})]`);
      const bgCls = escapeCssClassName(`bg-[var(${varName})]`);
      const borderCls = escapeCssClassName(`border-[var(${varName})]`);
      utilityRules.push(`.${textCls} { color: var(${varName}); }`);
      utilityRules.push(`.${bgCls} { background-color: var(${varName}); }`);
      utilityRules.push(`.${borderCls} { border-color: var(${varName}); }`);
    } else if (item.category === 'fontSize') {
      const sizeCls = escapeCssClassName(`text-[length:var(${varName})]`);
      utilityRules.push(`.${sizeCls} { font-size: var(${varName}); }`);
    }
  }

  if (rootDeclarations.length === 0) return '';

  return `:root {\n${rootDeclarations.join('\n')}\n}\n${utilityRules.join('\n')}`;
};

export const getNodeBreadcrumbPath = (
  nodes: NodesMap,
  selectedId: string
): EditorNode[] => {
  const path: EditorNode[] = [];
  const visited = new Set<string>();
  let currId: string | null | undefined = nodes[selectedId] ? selectedId : 'root';

  while (currId && nodes[currId] && !visited.has(currId)) {
    visited.add(currId);
    const node: EditorNode = nodes[currId];
    path.push(node);
    currId = node.parentId;
  }

  return path.reverse();
};

export const removeTailwindTokenAt = (
  className = '',
  indexToRemove: number
): string => {
  const tokens = className.split(/\s+/).filter(Boolean);
  if (indexToRemove < 0 || indexToRemove >= tokens.length) {
    return tokens.join(' ');
  }
  return tokens.filter((_, idx) => idx !== indexToRemove).join(' ');
};

const VALID_NODE_TYPES = new Set<NodeType>([
  'Container',
  'Grid',
  'Heading',
  'Text',
  'Button',
  'Badge',
  'Input',
  'Image',
  'Icon',
]);

export const parseNodesJson = (
  jsonText: string
): { ok: true; nodes: NodesMap } | { ok: false; error: string } => {
  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonText);
  } catch {
    return { ok: false, error: 'Nieprawidłowy format JSON.' };
  }

  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return { ok: false, error: 'Drzewo JSON musi być obiektem mapy węzłów.' };
  }

  const candidate = parsed as Record<string, unknown>;
  if (!candidate.root || typeof candidate.root !== 'object') {
    return { ok: false, error: 'Brak wymaganej gałęzi głównej "root".' };
  }

  for (const [key, val] of Object.entries(candidate)) {
    if (!val || typeof val !== 'object' || Array.isArray(val)) {
      return { ok: false, error: `Nieprawidłowa struktura węzła "${key}".` };
    }
    const node = val as Partial<EditorNode>;
    if (typeof node.id !== 'string' || node.id !== key) {
      return { ok: false, error: `Węzeł "${key}" ma niezgodne pole "id".` };
    }
    if (!node.type || !VALID_NODE_TYPES.has(node.type)) {
      return {
        ok: false,
        error: `Węzeł "${key}" ma nieobsługiwany typ "${String(node.type)}".`,
      };
    }
    if (!node.props || typeof node.props !== 'object' || Array.isArray(node.props)) {
      return { ok: false, error: `Węzeł "${key}" musi zawierać obiekt "props".` };
    }
    if (!Array.isArray(node.children)) {
      return {
        ok: false,
        error: `Węzeł "${key}" musi zawierać tablicę "children".`,
      };
    }
    for (const childId of node.children) {
      if (typeof childId !== 'string' || !candidate[childId]) {
        return {
          ok: false,
          error: `Węzeł "${key}" odwołuje się do nieistniejącego dziecka "${String(
            childId
          )}".`,
        };
      }
    }
  }

  return { ok: true, nodes: candidate as NodesMap };
};

export const addIconNodeToTree = (
  prev: NodesMap,
  selectedId: string,
  iconName: string,
  idFactory: () => string = generateId
): { nodes: NodesMap; createdId: string | null } => {
  const targetParentId = resolveTargetParentId(prev, selectedId);
  const parent = prev[targetParentId];
  if (!parent) return { nodes: prev, createdId: null };

  const newId = idFactory();
  const newNode: EditorNode = {
    id: newId,
    type: 'Icon',
    name: iconName,
    parentId: targetParentId,
    props: {
      className: 'w-6 h-6 text-slate-700',
      iconName,
    },
    children: [],
  };

  return {
    createdId: newId,
    nodes: {
      ...prev,
      [newId]: newNode,
      [targetParentId]: {
        ...parent,
        children: [...parent.children, newId],
      },
    },
  };
};

export const insertIconNodeAtTarget = (
  prev: NodesMap,
  iconName: string,
  targetId: string,
  position: DropPosition,
  idFactory: () => string = generateId
): { nodes: NodesMap; createdId: string | null } => {
  const targetNode = prev[targetId];
  if (!targetNode) return { nodes: prev, createdId: null };

  let targetParentId: string;
  if (position === 'inside') {
    if (!isContainerNodeType(targetNode.type)) return { nodes: prev, createdId: null };
    targetParentId = targetId;
  } else {
    if (!targetNode.parentId) return { nodes: prev, createdId: null };
    targetParentId = targetNode.parentId;
  }

  const targetParent = prev[targetParentId];
  if (!targetParent || !isContainerNodeType(targetParent.type)) {
    return { nodes: prev, createdId: null };
  }

  const newId = idFactory();
  const newNode: EditorNode = {
    id: newId,
    type: 'Icon',
    name: iconName,
    parentId: targetParentId,
    props: {
      className: 'w-6 h-6 text-slate-700',
      iconName,
    },
    children: [],
  };

  const nextChildren = [...targetParent.children];
  if (position === 'inside') {
    nextChildren.push(newId);
  } else {
    const idx = nextChildren.indexOf(targetId);
    if (idx === -1) return { nodes: prev, createdId: null };
    nextChildren.splice(position === 'before' ? idx : idx + 1, 0, newId);
  }

  return {
    createdId: newId,
    nodes: {
      ...prev,
      [newId]: newNode,
      [targetParentId]: {
        ...targetParent,
        children: nextChildren,
      },
    },
  };
};

const ICON_SVG_TOKEN_RE = /^(?:w-|h-|size-|stroke-)/;

export const splitIconClasses = (
  className = ''
): { wrapperClassName: string; iconClassName: string } => {
  const tokens = className.split(/\s+/).filter(Boolean);
  const wrapperTokens: string[] = [];
  const iconTokens: string[] = [];
  let hasSizeToken = false;

  for (const token of tokens) {
    if (ICON_SVG_TOKEN_RE.test(token)) {
      iconTokens.push(token);
      if (/^(?:w-|h-|size-)/.test(token)) {
        hasSizeToken = true;
      }
    } else {
      wrapperTokens.push(token);
    }
  }

  if (!hasSizeToken) {
    iconTokens.unshift('w-6', 'h-6');
  }

  return {
    wrapperClassName: `inline-flex items-center justify-center w-fit ${wrapperTokens.join(' ')}`.trim(),
    iconClassName: iconTokens.join(' '),
  };
};

export const ZOOM_LEVELS = [
  0.5, 0.6, 0.7, 0.8, 0.9, 1, 1.1, 1.2, 1.3, 1.4, 1.5,
] as const;

export const DEFAULT_ZOOM = 1;

export const stepZoom = (
  currentZoom: number,
  direction: 'in' | 'out'
): number => {
  const currentIdx = ZOOM_LEVELS.findIndex(
    (z) => Math.abs(z - currentZoom) < 0.001
  );
  const safeIdx = currentIdx === -1 ? ZOOM_LEVELS.indexOf(1) : currentIdx;
  const nextIdx =
    direction === 'in'
      ? Math.min(ZOOM_LEVELS.length - 1, safeIdx + 1)
      : Math.max(0, safeIdx - 1);
  return ZOOM_LEVELS[nextIdx];
};

const ZOOM_SCALE_CLASSES: Record<number, string> = {
  0.5: '[transform:scale(0.5)]',
  0.6: '[transform:scale(0.6)]',
  0.7: '[transform:scale(0.7)]',
  0.8: '[transform:scale(0.8)]',
  0.9: '[transform:scale(0.9)]',
  1: '[transform:scale(1)]',
  1.1: '[transform:scale(1.1)]',
  1.2: '[transform:scale(1.2)]',
  1.3: '[transform:scale(1.3)]',
  1.4: '[transform:scale(1.4)]',
  1.5: '[transform:scale(1.5)]',
};

export const getZoomScaleClass = (zoom: number): string =>
  ZOOM_SCALE_CLASSES[zoom] || '[transform:scale(1)]';

export const getComponentVariants = (
  type: NodeType
): ComponentVariantOption[] => COMPONENT_VARIANTS[type] || [];

export const applyNodeVariantInTree = (
  prev: NodesMap,
  selectedId: string,
  nextVariantId: string
): NodesMap => {
  const existing = prev[selectedId];
  if (!existing) return prev;

  const variants = getComponentVariants(existing.type);
  if (variants.length === 0) return prev;

  if (!nextVariantId) {
    if (!existing.variant) return prev;
    return {
      ...prev,
      [selectedId]: {
        ...existing,
        variant: undefined,
      },
    };
  }

  const targetVariant = variants.find((v) => v.id === nextVariantId);
  if (!targetVariant) return prev;

  const allVariantTokens = new Set(
    variants.flatMap((v) => v.classes.split(/\s+/).filter(Boolean))
  );
  const nextVariantTokens = targetVariant.classes.split(/\s+/).filter(Boolean);

  const hasNextBg = nextVariantTokens.some((t) => BG_COLOR_TOKEN_RE.test(t));
  const hasNextTextColor = nextVariantTokens.some((t) =>
    isTailwindTextColorToken(t)
  );
  const hasNextBorder = nextVariantTokens.some(
    (t) => t === 'border' || t.startsWith('border-')
  );
  const hasNextHoverBg = nextVariantTokens.some((t) =>
    t.startsWith('hover:bg-')
  );
  const hasNextFocusRing = nextVariantTokens.some((t) =>
    t.startsWith('focus:ring-')
  );

  const currentTokens = (existing.props.className || '')
    .split(/\s+/)
    .filter(Boolean);

  const filteredTokens = currentTokens.filter((token) => {
    if (allVariantTokens.has(token)) return false;
    if (hasNextBg && BG_COLOR_TOKEN_RE.test(token)) return false;
    if (hasNextTextColor && isTailwindTextColorToken(token)) return false;
    if (hasNextHoverBg && token.startsWith('hover:bg-')) return false;
    if (hasNextFocusRing && token.startsWith('focus:ring-')) return false;
    if (
      hasNextBorder &&
      (token === 'border' || /^border-(?:transparent|slate-|gray-|zinc-|red-|blue-|emerald-|amber-)/.test(token))
    ) {
      return false;
    }
    return true;
  });

  const mergedClassName = [...filteredTokens, ...nextVariantTokens].join(' ');

  return {
    ...prev,
    [selectedId]: {
      ...existing,
      variant: nextVariantId,
      props: {
        ...existing.props,
        className: mergedClassName,
      },
    },
  };
};

export type HorizontalAlign = 'left' | 'center' | 'right';
export type VerticalAlign = 'top' | 'middle' | 'bottom';
export type ParentLayoutKind = 'flex-col' | 'flex-row' | 'grid' | 'block';

const SELF_ALIGN_CLASSES = [
  'self-start',
  'self-center',
  'self-end',
  'self-stretch',
] as const;

const JUSTIFY_SELF_CLASSES = [
  'justify-self-start',
  'justify-self-center',
  'justify-self-end',
  'justify-self-stretch',
] as const;

const HORIZONTAL_MARGIN_AUTO_CLASSES = ['ml-auto', 'mr-auto', 'mx-auto'] as const;
const VERTICAL_MARGIN_AUTO_CLASSES = ['mt-auto', 'mb-auto', 'my-auto'] as const;

export const ALL_ALIGNMENT_CLASSES = [
  ...SELF_ALIGN_CLASSES,
  ...JUSTIFY_SELF_CLASSES,
  ...HORIZONTAL_MARGIN_AUTO_CLASSES,
  ...VERTICAL_MARGIN_AUTO_CLASSES,
] as const;

export const detectParentLayoutKind = (
  parentClassName = ''
): ParentLayoutKind => {
  const tokens = parentClassName.split(/\s+/).filter(Boolean);
  if (tokens.some((t) => t === 'grid' || t.startsWith('grid-cols-'))) {
    return 'grid';
  }
  if (tokens.includes('flex-col') || tokens.includes('flex-col-reverse')) {
    return 'flex-col';
  }
  if (
    tokens.includes('flex') ||
    tokens.includes('flex-row') ||
    tokens.includes('flex-row-reverse')
  ) {
    return 'flex-row';
  }
  return 'block';
};

export const getNodeAlignmentState = (
  nodeClassName = '',
  parentClassName = ''
): {
  layoutKind: ParentLayoutKind;
  horizontal: HorizontalAlign | '';
  vertical: VerticalAlign | '';
} => {
  const layoutKind = detectParentLayoutKind(parentClassName);
  const tokens = nodeClassName.split(/\s+/).filter(Boolean);

  let horizontal: HorizontalAlign | '' = '';
  let vertical: VerticalAlign | '' = '';

  if (layoutKind === 'flex-col') {
    for (const token of tokens) {
      if (token === 'self-start' || token === 'mr-auto') horizontal = 'left';
      else if (token === 'self-center' || token === 'mx-auto') horizontal = 'center';
      else if (token === 'self-end' || token === 'ml-auto') horizontal = 'right';
      else if (token === 'mb-auto') vertical = 'top';
      else if (token === 'my-auto') vertical = 'middle';
      else if (token === 'mt-auto') vertical = 'bottom';
    }
  } else if (layoutKind === 'grid') {
    for (const token of tokens) {
      if (token === 'justify-self-start' || token === 'mr-auto') horizontal = 'left';
      else if (token === 'justify-self-center' || token === 'mx-auto') horizontal = 'center';
      else if (token === 'justify-self-end' || token === 'ml-auto') horizontal = 'right';
      else if (token === 'self-start' || token === 'mb-auto') vertical = 'top';
      else if (token === 'self-center' || token === 'my-auto') vertical = 'middle';
      else if (token === 'self-end' || token === 'mt-auto') vertical = 'bottom';
    }
  } else if (layoutKind === 'flex-row') {
    for (const token of tokens) {
      if (token === 'mr-auto') horizontal = 'left';
      else if (token === 'mx-auto') horizontal = 'center';
      else if (token === 'ml-auto') horizontal = 'right';
      else if (token === 'self-start' || token === 'mb-auto') vertical = 'top';
      else if (token === 'self-center' || token === 'my-auto') vertical = 'middle';
      else if (token === 'self-end' || token === 'mt-auto') vertical = 'bottom';
    }
  } else {
    for (const token of tokens) {
      if (token === 'mr-auto') horizontal = 'left';
      else if (token === 'mx-auto') horizontal = 'center';
      else if (token === 'ml-auto') horizontal = 'right';
      else if (token === 'mb-auto') vertical = 'top';
      else if (token === 'my-auto') vertical = 'middle';
      else if (token === 'mt-auto') vertical = 'bottom';
    }
  }

  return { layoutKind, horizontal, vertical };
};

export const setNodeHorizontalAlignment = (
  nodeClassName = '',
  parentClassName = '',
  align: HorizontalAlign | ''
): string => {
  const layoutKind = detectParentLayoutKind(parentClassName);
  const tokens = nodeClassName.split(/\s+/).filter(Boolean);

  const clearSet = new Set<string>([
    ...JUSTIFY_SELF_CLASSES,
    ...HORIZONTAL_MARGIN_AUTO_CLASSES,
    ...(layoutKind === 'flex-col' || layoutKind === 'block' ? SELF_ALIGN_CLASSES : []),
  ]);

  const filtered = tokens.filter((t) => !clearSet.has(t));
  if (!align) return filtered.join(' ');

  if (layoutKind === 'flex-col') {
    const token =
      align === 'left'
        ? 'self-start'
        : align === 'center'
          ? 'self-center'
          : 'self-end';
    filtered.push(token);
  } else if (layoutKind === 'grid') {
    const token =
      align === 'left'
        ? 'justify-self-start'
        : align === 'center'
          ? 'justify-self-center'
          : 'justify-self-end';
    filtered.push(token);
  } else {
    const token =
      align === 'left'
        ? 'mr-auto'
        : align === 'center'
          ? 'mx-auto'
          : 'ml-auto';
    filtered.push(token);
  }

  return filtered.join(' ');
};

export const setNodeVerticalAlignment = (
  nodeClassName = '',
  parentClassName = '',
  align: VerticalAlign | ''
): string => {
  const layoutKind = detectParentLayoutKind(parentClassName);
  const tokens = nodeClassName.split(/\s+/).filter(Boolean);

  const clearSet = new Set<string>([
    ...VERTICAL_MARGIN_AUTO_CLASSES,
    ...(layoutKind === 'flex-row' || layoutKind === 'grid' ? SELF_ALIGN_CLASSES : []),
  ]);

  const filtered = tokens.filter((t) => !clearSet.has(t));
  if (!align) return filtered.join(' ');

  if (layoutKind === 'flex-row' || layoutKind === 'grid') {
    const token =
      align === 'top'
        ? 'self-start'
        : align === 'middle'
          ? 'self-center'
          : 'self-end';
    filtered.push(token);
  } else {
    const token =
      align === 'top'
        ? 'mb-auto'
        : align === 'middle'
          ? 'my-auto'
          : 'mt-auto';
    filtered.push(token);
  }

  return filtered.join(' ');
};

export const centerNodeInParent = (
  nodeClassName = '',
  parentClassName = ''
): string => {
  const withHoriz = setNodeHorizontalAlignment(
    nodeClassName,
    parentClassName,
    'center'
  );
  return setNodeVerticalAlignment(withHoriz, parentClassName, 'middle');
};

export const clearNodeAlignment = (nodeClassName = ''): string => {
  const removeSet = new Set<string>(ALL_ALIGNMENT_CLASSES);
  return nodeClassName
    .split(/\s+/)
    .filter((t) => t && !removeSet.has(t))
    .join(' ');
};

export const TRANSITION_PROPERTY_CLASSES = [
  'transition-none',
  'transition-all',
  'transition',
  'transition-colors',
  'transition-opacity',
  'transition-shadow',
  'transition-transform',
] as const;

export const TRANSITION_DURATION_CLASSES = [
  'duration-75',
  'duration-100',
  'duration-150',
  'duration-200',
  'duration-300',
  'duration-500',
  'duration-700',
  'duration-1000',
] as const;

export const TRANSITION_EASING_CLASSES = [
  'ease-linear',
  'ease-in',
  'ease-out',
  'ease-in-out',
] as const;

export const HOVER_TRANSFORM_CLASSES = [
  'hover:scale-95',
  'hover:scale-105',
  'hover:scale-110',
  'hover:-translate-y-0.5',
  'hover:-translate-y-1',
  'active:scale-95',
] as const;

export const KEYFRAME_ANIMATION_CLASSES = [
  'animate-none',
  'animate-spin',
  'animate-ping',
  'animate-pulse',
  'animate-bounce',
] as const;

export const extractNodeSubtreeBlueprint = (
  nodes: NodesMap,
  nodeId: string
): NodeBlueprint | null => {
  const node = nodes[nodeId];
  if (!node) return null;

  const childrenBlueprints: NodeBlueprint[] = [];
  for (const childId of node.children || []) {
    const childBp = extractNodeSubtreeBlueprint(nodes, childId);
    if (childBp) childrenBlueprints.push(childBp);
  }

  return {
    type: node.type,
    name: node.name || node.type,
    ...(node.variant !== undefined ? { variant: node.variant } : {}),
    ...(node.content !== undefined ? { content: node.content } : {}),
    props: { ...node.props },
    ...(childrenBlueprints.length > 0 ? { children: childrenBlueprints } : {}),
  };
};

export const countBlueprintNodes = (bp: NodeBlueprint): number =>
  1 +
  (bp.children || []).reduce(
    (sum, child) => sum + countBlueprintNodes(child),
    0
  );

export const createComponentHistoryEntry = (
  nodes: NodesMap,
  nodeId: string,
  eventType: ComponentHistoryEventType,
  idFactory: () => string = generateId,
  timestamp: number = Date.now()
): ComponentHistoryEntry | null => {
  if (!nodeId || nodeId === 'root') return null;
  const node = nodes[nodeId];
  const snapshot = extractNodeSubtreeBlueprint(nodes, nodeId);
  if (!node || !snapshot) return null;

  return {
    historyId: idFactory(),
    eventType,
    timestamp,
    rootNodeId: nodeId,
    label: node.name || node.type,
    nodeType: node.type,
    ...(node.variant ? { variant: node.variant } : {}),
    classNameSummary: (node.props.className || '').replace(/\s+/g, ' ').trim(),
    nodeCount: countBlueprintNodes(snapshot),
    snapshot,
  };
};

export const prependComponentHistory = (
  historyList: ComponentHistoryEntry[],
  entry: ComponentHistoryEntry | null,
  maxItems = 25
): ComponentHistoryEntry[] => {
  if (!entry) return historyList;
  return [entry, ...historyList].slice(0, maxItems);
};

export const refreshAddedComponentHistoryEntry = (
  historyList: ComponentHistoryEntry[],
  nodes: NodesMap,
  nodeId: string,
  timestamp: number = Date.now()
): ComponentHistoryEntry[] => {
  if (!nodeId || nodeId === 'root') return historyList;
  const idx = historyList.findIndex(
    (item) => item.eventType === 'added' && item.rootNodeId === nodeId
  );
  if (idx === -1) return historyList;

  const node = nodes[nodeId];
  const snapshot = extractNodeSubtreeBlueprint(nodes, nodeId);
  if (!node || !snapshot) return historyList;

  const existing = historyList[idx];
  const updated: ComponentHistoryEntry = {
    ...existing,
    timestamp,
    label: node.name || node.type,
    variant: node.variant,
    classNameSummary: (node.props.className || '').replace(/\s+/g, ' ').trim(),
    nodeCount: countBlueprintNodes(snapshot),
    snapshot,
  };

  return historyList.map((item, i) => (i === idx ? updated : item));
};

export const reinsertComponentFromHistory = (
  prev: NodesMap,
  selectedId: string,
  entry: ComponentHistoryEntry,
  idFactory: () => string = generateId
): { nodes: NodesMap; createdId: string | null } =>
  insertPageTemplateIntoTree(prev, selectedId, entry.snapshot, idFactory);

export const filterComponentHistory = (
  entries: ComponentHistoryEntry[],
  filter: 'all' | ComponentHistoryEventType
): ComponentHistoryEntry[] => {
  if (filter === 'all') return entries;
  return entries.filter((entry) => entry.eventType === filter);
};

export const toggleMultiSelection = (
  currentIds: string[],
  clickedId: string,
  additive: boolean,
  validNodes?: NodesMap
): string[] => {
  if (validNodes && !validNodes[clickedId]) {
    return ['root'];
  }
  if (!additive) {
    return [clickedId];
  }
  if (clickedId === 'root') {
    return ['root'];
  }

  const nonRoot = currentIds.filter(
    (id) => id !== 'root' && (!validNodes || Boolean(validNodes[id]))
  );
  const exists = nonRoot.includes(clickedId);
  const next = exists
    ? nonRoot.filter((id) => id !== clickedId)
    : [...nonRoot, clickedId];

  return next.length > 0 ? next : ['root'];
};

export const applyBulkClassUpdaterToNodes = (
  prev: NodesMap,
  targetIds: string[],
  updater: (currentClassName: string, node: EditorNode) => string
): NodesMap => {
  const uniqueIds = Array.from(new Set(targetIds)).filter((id) => Boolean(prev[id]));
  if (uniqueIds.length === 0) return prev;

  let changed = false;
  const next: NodesMap = { ...prev };

  for (const id of uniqueIds) {
    const existing = next[id];
    if (!existing) continue;
    const prevClass = existing.props.className || '';
    const updatedClass = updater(prevClass, existing);
    if (updatedClass !== prevClass) {
      next[id] = {
        ...existing,
        props: {
          ...existing.props,
          className: updatedClass,
        },
      };
      changed = true;
    }
  }

  return changed ? next : prev;
};

export const appendBulkCustomClassesToNodes = (
  prev: NodesMap,
  targetIds: string[],
  rawExtraClasses: string
): NodesMap => {
  const extraTokens = rawExtraClasses.split(/\s+/).filter(Boolean);
  if (extraTokens.length === 0) return prev;

  return applyBulkClassUpdaterToNodes(prev, targetIds, (currClass) => {
    const existingTokens = currClass.split(/\s+/).filter(Boolean);
    const merged = [...existingTokens];
    for (const token of extraTokens) {
      if (!merged.includes(token)) {
        merged.push(token);
      }
    }
    return merged.join(' ');
  });
};

export const deleteNodesFromTree = (
  prev: NodesMap,
  targetIds: string[]
): { nodes: NodesMap; nextSelectedId: string } => {
  const deletableIds = Array.from(new Set(targetIds)).filter(
    (id) => id !== 'root' && Boolean(prev[id])
  );
  if (deletableIds.length === 0) {
    return { nodes: prev, nextSelectedId: 'root' };
  }

  let nextNodes = prev;
  for (const id of deletableIds) {
    if (nextNodes[id]) {
      nextNodes = deleteNodeFromTree(nextNodes, id).nodes;
    }
  }

  return { nodes: nextNodes, nextSelectedId: 'root' };
};

export const getSharedSpacingValueAcrossNodes = (
  nodes: NodesMap,
  targetIds: string[],
  prefix: SpacingPrefix
): string => {
  const validNodes = targetIds.map((id) => nodes[id]).filter(Boolean);
  if (validNodes.length === 0) return '';
  const first = getTailwindSpacingValue(validNodes[0].props.className || '', prefix);
  return validNodes.every(
    (n) => getTailwindSpacingValue(n.props.className || '', prefix) === first
  )
    ? first
    : '';
};

export const getSharedGroupTokenAcrossNodes = (
  nodes: NodesMap,
  targetIds: string[],
  groupClasses: readonly string[]
): string => {
  const validNodes = targetIds.map((id) => nodes[id]).filter(Boolean);
  if (validNodes.length === 0) return '';
  const first = getTailwindGroupToken(
    validNodes[0].props.className || '',
    groupClasses
  );
  return validNodes.every(
    (n) => getTailwindGroupToken(n.props.className || '', groupClasses) === first
  )
    ? first
    : '';
};

export const getSharedTextColorAcrossNodes = (
  nodes: NodesMap,
  targetIds: string[]
): string => {
  const validNodes = targetIds.map((id) => nodes[id]).filter(Boolean);
  if (validNodes.length === 0) return '';
  const first = getTailwindTextColor(validNodes[0].props.className || '');
  return validNodes.every(
    (n) => getTailwindTextColor(n.props.className || '') === first
  )
    ? first
    : '';
};

export const recordRecentComponentSearch = (
  current: RecentComponentSearch[],
  entry: Omit<RecentComponentSearch, 'timestamp'>,
  maxItems = 5,
  timestamp: number = Date.now()
): RecentComponentSearch[] => {
  const cleanQuery = entry.query.trim();
  if (!cleanQuery) return current;

  const filtered = current.filter((item) => item.type !== entry.type);
  return [
    {
      type: entry.type,
      label: entry.label,
      query: cleanQuery,
      timestamp,
    },
    ...filtered,
  ].slice(0, maxItems);
};

const COLOR_VALUE_RE =
  /^(?:#[0-9a-fA-F]{3,8}|(?:rgb|rgba|hsl|hsla|oklch|oklab|color)\([^)]+\))$/;

export const inferThemeVarCategory = (
  name: string,
  value: string,
  explicitCategory?: string
): ThemeVarCategory => {
  if (explicitCategory === 'color' || explicitCategory === 'fontSize') {
    return explicitCategory;
  }
  const lowerName = name.toLowerCase();
  const trimmedVal = value.trim();

  if (
    lowerName.includes('font') ||
    lowerName.includes('size') ||
    lowerName.includes('text-')
  ) {
    return 'fontSize';
  }
  if (COLOR_VALUE_RE.test(trimmedVal)) {
    return 'color';
  }
  if (
    lowerName.includes('color') ||
    lowerName.includes('surface') ||
    lowerName.includes('primary') ||
    lowerName.includes('secondary') ||
    lowerName.includes('accent') ||
    lowerName.includes('outline') ||
    lowerName.includes('border') ||
    lowerName.includes('bg')
  ) {
    return 'color';
  }
  if (/^\d+(?:\.\d+)?(?:rem|em|px|ch|vw|vh|%)$/.test(trimmedVal)) {
    return 'fontSize';
  }
  return 'color';
};

const camelToKebab = (key: string): string =>
  key.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();

const makeReadableLabel = (cssVarName: string): string =>
  cssVarName
    .replace(/^--/, '')
    .replace(/^(color|font-size|md-sys-color)-/, '')
    .split('-')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ') || cssVarName;

export const parseImportedTheme = (
  rawText: string,
  idFactory: () => string = generateId
): { ok: true; variables: ThemeVariable[] } | { ok: false; error: string } => {
  const trimmed = rawText.trim();
  if (!trimmed) {
    return { ok: false, error: 'Wklej zawartość JSON lub CSS zmiennych :root.' };
  }

  const normalizedMap = new Map<string, ThemeVariable>();

  const upsertVar = (
    rawName: string,
    rawValue: string,
    explicitLabel?: string,
    explicitCategory?: string
  ) => {
    const cleanName = normalizeCssVarName(camelToKebab(rawName));
    const cleanValue = rawValue.replace(/[;{}<>]/g, '').trim();
    if (!cleanName || !cleanValue) return;
    const category = inferThemeVarCategory(
      cleanName,
      cleanValue,
      explicitCategory
    );
    normalizedMap.set(cleanName, {
      id: idFactory(),
      name: cleanName,
      label: explicitLabel?.trim() || makeReadableLabel(cleanName),
      value: cleanValue,
      category,
    });
  };

  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    let parsed: unknown;
    try {
      parsed = JSON.parse(trimmed);
    } catch {
      return { ok: false, error: 'Nieprawidłowy format JSON motywu.' };
    }

    if (Array.isArray(parsed)) {
      for (const item of parsed) {
        if (!item || typeof item !== 'object') continue;
        const rec = item as Record<string, unknown>;
        if (typeof rec.name === 'string' && typeof rec.value === 'string') {
          upsertVar(
            rec.name,
            rec.value,
            typeof rec.label === 'string' ? rec.label : undefined,
            typeof rec.category === 'string' ? rec.category : undefined
          );
        }
      }
    } else if (parsed && typeof parsed === 'object') {
      const obj = parsed as Record<string, unknown>;

      // Material Theme Builder JSON support: { schemes: { light: { primary: "#6750A4", ... } } }
      const schemes = obj.schemes as Record<string, unknown> | undefined;
      if (schemes && typeof schemes === 'object') {
        const lightScheme =
          (schemes.light as Record<string, unknown> | undefined) ||
          (schemes.dark as Record<string, unknown> | undefined);
        if (lightScheme && typeof lightScheme === 'object') {
          for (const [k, v] of Object.entries(lightScheme)) {
            if (typeof v === 'string') {
              upsertVar(`color-${k}`, v, undefined, 'color');
            }
          }
        }
      }

      // Structured `{ variables: [...] }`
      if (Array.isArray(obj.variables)) {
        for (const item of obj.variables) {
          if (!item || typeof item !== 'object') continue;
          const rec = item as Record<string, unknown>;
          if (typeof rec.name === 'string' && typeof rec.value === 'string') {
            upsertVar(
              rec.name,
              rec.value,
              typeof rec.label === 'string' ? rec.label : undefined,
              typeof rec.category === 'string' ? rec.category : undefined
            );
          }
        }
      }

      // Nested `{ colors: { ... }, fontSizes: { ... } }` or `{ tokens: { ... } }`
      const nestedBuckets: Array<{
        bucket: unknown;
        cat?: ThemeVarCategory;
        prefix: string;
      }> = [
        { bucket: obj.colors, cat: 'color', prefix: 'color-' },
        { bucket: obj.fontSizes, cat: 'fontSize', prefix: 'font-size-' },
        { bucket: obj.tokens, prefix: '' },
      ];
      for (const { bucket, cat, prefix } of nestedBuckets) {
        if (bucket && typeof bucket === 'object' && !Array.isArray(bucket)) {
          for (const [k, v] of Object.entries(bucket as Record<string, unknown>)) {
            if (typeof v === 'string') {
              const keyWithPrefix = k.startsWith('--') ? k : `${prefix}${k}`;
              upsertVar(keyWithPrefix, v, undefined, cat);
            }
          }
        }
      }

      // Flat token map `{ "--color-primary": "#6750A4", ... }`
      for (const [k, v] of Object.entries(obj)) {
        if (typeof v === 'string' && k !== 'name' && k !== 'description' && k !== 'id') {
          upsertVar(k, v);
        }
      }
    }
  } else {
    // Parse CSS variables (`--name: value;`)
    const strippedComments = trimmed.replace(/\/\*[\s\S]*?\*\//g, '');
    const cssVarRe = /(--[a-zA-Z0-9_-]+)\s*:\s*([^;}\n]+)/g;
    let match: RegExpExecArray | null;
    while ((match = cssVarRe.exec(strippedComments)) !== null) {
      upsertVar(match[1], match[2]);
    }
  }

  const variables = Array.from(normalizedMap.values());
  if (variables.length === 0) {
    return {
      ok: false,
      error:
        'Nie znaleziono zmiennych motywu. Użyj formatu JSON lub CSS (--zmienna: wartość;).',
    };
  }

  return { ok: true, variables };
};

export const serializeThemeVariablesToJson = (
  themeVars: ThemeVariable[]
): string =>
  JSON.stringify(
    themeVars.map(({ name, label, value, category }) => ({
      name,
      label,
      value,
      category,
    })),
    null,
    2
  );

export const detectMatchingThemePresetId = (
  themeVars: ThemeVariable[],
  presets: ThemePreset[]
): string | null => {
  const currentMap = new Map(
    themeVars.map((v) => [v.name, v.value.trim().toLowerCase()])
  );

  for (const preset of presets) {
    if (preset.variables.length !== themeVars.length) continue;
    const allMatch = preset.variables.every(
      (pv) => currentMap.get(pv.name) === pv.value.trim().toLowerCase()
    );
    if (allMatch) return preset.id;
  }
  return null;
};









