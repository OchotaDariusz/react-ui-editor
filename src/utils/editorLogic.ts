import {
  ELEMENT_TEMPLATES,
  type TemplateBlueprintNode,
} from '../constants/editorDefaults';
import type {
  EditorNode,
  NodesMap,
  NodeType,
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

export const generateReactJSX = (nodes: NodesMap): string => {
  const buildNodeJSX = (id: string, indent = '    '): string => {
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
        .map((cId) => buildNodeJSX(cId, indent + '  '))
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
    return '';
  };

  return `import React from 'react';\n\nexport default function GeneratedUI() {\n  return (\n${buildNodeJSX(
    'root'
  )}  );\n}\n`;
};

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





