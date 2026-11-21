import test from 'node:test';
import assert from 'node:assert/strict';
import { INITIAL_NODES } from '../constants/editorDefaults';
import {
  addCardPresetToTree,
  addNodeToTree,
  deleteNodeFromTree,
  duplicateNodeInTree,
  filterComponentsByQuery,
  generateReactJSX,
  getParentNodeId,
  getTailwindSpacingValue,
  moveNodeInTree,
  moveNodeRelativeToTarget,
  setTailwindSpacingValue,
  toggleTailwindGroup,
  updateNodeInTree,
} from './editorLogic';

const makeIdFactory = () => {
  let counter = 0;
  return () => `test_${++counter}`;
};

test('toggleTailwindGroup replaces conflicting layout classes cleanly', () => {
  const result = toggleTailwindGroup(
    'p-4 flex flex-col gap-3 rounded-lg',
    ['flex', 'grid', 'flex-col', 'flex-row', 'grid-cols-2'],
    'grid grid-cols-2'
  );
  assert.equal(result, 'p-4 gap-3 rounded-lg grid grid-cols-2');
});

test('addNodeToTree appends to selected Container or parent Container when leaf is selected', () => {
  const nextId = makeIdFactory();
  const res1 = addNodeToTree(INITIAL_NODES, 'hero-1', 'Heading', nextId);
  assert.equal(res1.createdId, 'test_1');
  assert.equal(res1.nodes['test_1']?.parentId, 'hero-1');
  assert.ok(res1.nodes['hero-1']?.children.includes('test_1'));

  // Selecting a leaf node (btn-1) should add sibling inside its parent (hero-1)
  const res2 = addNodeToTree(INITIAL_NODES, 'btn-1', 'Button', nextId);
  assert.equal(res2.createdId, 'test_2');
  assert.equal(res2.nodes['test_2']?.parentId, 'hero-1');
  assert.ok(res2.nodes['hero-1']?.children.includes('test_2'));
});

test('addCardPresetToTree creates card container with 4 children', () => {
  const nextId = makeIdFactory();
  const res = addCardPresetToTree(INITIAL_NODES, 'root', nextId);
  assert.equal(res.createdId, 'test_1');
  const card = res.nodes['test_1'];
  assert.ok(card);
  assert.equal(card.type, 'Container');
  assert.equal(card.name, 'Karta Produktu');
  assert.equal(card.children.length, 4);
  assert.equal(res.nodes['test_2']?.type, 'Image');
  assert.equal(res.nodes['test_3']?.type, 'Heading');
  assert.equal(res.nodes['test_4']?.type, 'Text');
  assert.equal(res.nodes['test_5']?.type, 'Button');
});

test('updateNodeInTree updates direct property and nested props immutably', () => {
  const updatedContent = updateNodeInTree(
    INITIAL_NODES,
    'heading-1',
    'content',
    'Nowy tytuł'
  );
  assert.equal(updatedContent['heading-1']?.content, 'Nowy tytuł');
  assert.equal(
    INITIAL_NODES['heading-1']?.content,
    'Zbuduj interfejs React wizualnie'
  );

  const updatedClass = updateNodeInTree(
    updatedContent,
    'heading-1',
    'className',
    'text-4xl font-bold',
    true
  );
  assert.equal(updatedClass['heading-1']?.props.className, 'text-4xl font-bold');
});

test('duplicateNodeInTree deep-clones containers, inserts right after original, and appends Copy N suffix', () => {
  const nextId = makeIdFactory();
  const res = duplicateNodeInTree(INITIAL_NODES, 'hero-1', nextId);
  assert.equal(res.createdId, 'test_1');
  const clonedHero = res.nodes['test_1'];
  assert.ok(clonedHero);
  assert.equal(clonedHero.name, 'Hero Section Copy 1');
  assert.equal(clonedHero.children.length, 4);
  assert.deepEqual(res.nodes['root']?.children, ['hero-1', 'test_1']);
  // Children should also have distinct IDs and point to cloned parent
  for (const childId of clonedHero.children) {
    assert.equal(res.nodes[childId]?.parentId, 'test_1');
  }
});

test('moveNodeInTree reorders sibling within parent bounds', () => {
  const movedUp = moveNodeInTree(INITIAL_NODES, 'heading-1', -1);
  assert.deepEqual(movedUp['hero-1']?.children, [
    'heading-1',
    'badge-1',
    'text-1',
    'btn-1',
  ]);

  // Boundary no-op when already first
  const boundary = moveNodeInTree(movedUp, 'heading-1', -1);
  assert.equal(boundary, movedUp);
});

test('deleteNodeFromTree removes container and all descendants recursively', () => {
  const res = deleteNodeFromTree(INITIAL_NODES, 'hero-1');
  assert.equal(res.nextSelectedId, 'root');
  assert.deepEqual(res.nodes['root']?.children, []);
  assert.equal(res.nodes['hero-1'], undefined);
  assert.equal(res.nodes['badge-1'], undefined);
  assert.equal(res.nodes['heading-1'], undefined);
  assert.equal(res.nodes['text-1'], undefined);
  assert.equal(res.nodes['btn-1'], undefined);

  // Root cannot be deleted
  const rootAttempt = deleteNodeFromTree(INITIAL_NODES, 'root');
  assert.equal(rootAttempt.nodes, INITIAL_NODES);
});

test('generateReactJSX outputs valid React component markup for tree', () => {
  const jsx = generateReactJSX(INITIAL_NODES);
  assert.ok(jsx.includes('export default function GeneratedUI()'));
  assert.ok(jsx.includes('<h2 className="text-3xl font-bold text-slate-900 tracking-tight">Zbuduj interfejs React wizualnie</h2>'));
  assert.ok(jsx.includes('<button type="button" className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm shadow-sm">Rozpocznij projekt</button>'));
});

test('moveNodeRelativeToTarget reorders siblings before and after targets cleanly', () => {
  // Move btn-1 (index 3) before heading-1 (index 1)
  const movedBefore = moveNodeRelativeToTarget(
    INITIAL_NODES,
    'btn-1',
    'heading-1',
    'before'
  );
  assert.deepEqual(movedBefore['hero-1']?.children, [
    'badge-1',
    'btn-1',
    'heading-1',
    'text-1',
  ]);

  // Move badge-1 (index 0) after text-1 (index 2)
  const movedAfter = moveNodeRelativeToTarget(
    INITIAL_NODES,
    'badge-1',
    'text-1',
    'after'
  );
  assert.deepEqual(movedAfter['hero-1']?.children, [
    'heading-1',
    'text-1',
    'badge-1',
    'btn-1',
  ]);

  // No-op when dropping right before the next sibling
  const noOp = moveNodeRelativeToTarget(
    INITIAL_NODES,
    'badge-1',
    'heading-1',
    'before'
  );
  assert.equal(noOp, INITIAL_NODES);
});

test('moveNodeRelativeToTarget reparents nodes across containers and prevents cycles', () => {
  // Move btn-1 from hero-1 inside root
  const movedToRoot = moveNodeRelativeToTarget(
    INITIAL_NODES,
    'btn-1',
    'root',
    'inside'
  );
  assert.equal(movedToRoot['btn-1']?.parentId, 'root');
  assert.deepEqual(movedToRoot['hero-1']?.children, [
    'badge-1',
    'heading-1',
    'text-1',
  ]);
  assert.deepEqual(movedToRoot['root']?.children, ['hero-1', 'btn-1']);

  // Cycle prevention: hero-1 cannot be dropped into its own descendant or itself
  const selfDrop = moveNodeRelativeToTarget(
    INITIAL_NODES,
    'hero-1',
    'hero-1',
    'inside'
  );
  assert.equal(selfDrop, INITIAL_NODES);

  const nestedState = addNodeToTree(INITIAL_NODES, 'hero-1', 'Container', () => 'sub-box').nodes;
  const cycleDrop = moveNodeRelativeToTarget(
    nestedState,
    'hero-1',
    'sub-box',
    'inside'
  );
  assert.equal(cycleDrop, nestedState);

  // Root cannot be moved
  const rootMove = moveNodeRelativeToTarget(
    INITIAL_NODES,
    'root',
    'hero-1',
    'before'
  );
  assert.equal(rootMove, INITIAL_NODES);
});

test('filterComponentsByQuery matches Polish labels, diacritic-folded text, and React component types', () => {
  const sample = [
    { type: 'Container', label: 'Kontener' },
    { type: 'Heading', label: 'Nagłówek' },
    { type: 'Button', label: 'Przycisk' },
    { type: 'Badge', label: 'Odznaka' },
  ];

  assert.equal(filterComponentsByQuery(sample, '').length, 4);
  assert.equal(filterComponentsByQuery(sample, '   ').length, 4);

  // Polish label with diacritics
  assert.deepEqual(
    filterComponentsByQuery(sample, 'Nagłówek').map((x) => x.type),
    ['Heading']
  );

  // Diacritic-folded Polish query (including ł -> l)
  assert.deepEqual(
    filterComponentsByQuery(sample, 'naglowek').map((x) => x.type),
    ['Heading']
  );

  // React component type query
  assert.deepEqual(
    filterComponentsByQuery(sample, 'button').map((x) => x.type),
    ['Button']
  );

  // Non-matching query
  assert.deepEqual(filterComponentsByQuery(sample, 'xyz123'), []);
});

test('getTailwindSpacingValue and setTailwindSpacingValue manage margin and padding classes cleanly', () => {
  assert.equal(getTailwindSpacingValue('px-5 py-2.5 bg-blue-600', 'px'), '5');
  assert.equal(getTailwindSpacingValue('px-5 py-2.5 bg-blue-600', 'py'), '2.5');
  assert.equal(getTailwindSpacingValue('mx-auto mt-1', 'mx'), 'auto');
  assert.equal(getTailwindSpacingValue('p-8 bg-white', 'm'), '');

  // Setting px replaces existing px without clobbering py or bg
  assert.equal(
    setTailwindSpacingValue('px-5 py-2.5 bg-blue-600', 'px', '8'),
    'py-2.5 bg-blue-600 px-8'
  );

  // Setting all-sides p clears conflicting px/py/pt/etc.
  assert.equal(
    setTailwindSpacingValue('px-5 py-2.5 bg-blue-600', 'p', '4'),
    'bg-blue-600 p-4'
  );

  // Clearing a value removes only that prefix
  assert.equal(
    setTailwindSpacingValue('mx-auto mt-2 bg-white', 'mx', ''),
    'mt-2 bg-white'
  );
});

test('getParentNodeId resolves parent for child nodes and returns null for root', () => {
  assert.equal(getParentNodeId(INITIAL_NODES, 'btn-1'), 'hero-1');
  assert.equal(getParentNodeId(INITIAL_NODES, 'hero-1'), 'root');
  assert.equal(getParentNodeId(INITIAL_NODES, 'root'), null);
});

test('addNodeToTree supports Grid component and allows adding/reparenting children inside Grid', () => {
  const withGrid = addNodeToTree(INITIAL_NODES, 'root', 'Grid', () => 'grid-1');
  assert.equal(withGrid.createdId, 'grid-1');
  assert.equal(withGrid.nodes['grid-1']?.type, 'Grid');
  assert.ok(withGrid.nodes['grid-1']?.props.className?.includes('grid-cols-2'));

  // Adding a Button while Grid is selected inserts it inside Grid
  const withChild = addNodeToTree(withGrid.nodes, 'grid-1', 'Button', () => 'grid-btn');
  assert.equal(withChild.createdId, 'grid-btn');
  assert.equal(withChild.nodes['grid-btn']?.parentId, 'grid-1');
  assert.deepEqual(withChild.nodes['grid-1']?.children, ['grid-btn']);

  // Dropping an existing node inside Grid reparents it cleanly
  const movedIntoGrid = moveNodeRelativeToTarget(
    withChild.nodes,
    'badge-1',
    'grid-1',
    'inside'
  );
  assert.equal(movedIntoGrid['badge-1']?.parentId, 'grid-1');
  assert.deepEqual(movedIntoGrid['grid-1']?.children, ['grid-btn', 'badge-1']);

  // JSX export renders Grid as a <div> with its grid Tailwind classes and children
  const jsx = generateReactJSX(movedIntoGrid);
  assert.ok(jsx.includes('grid grid-cols-2 gap-4'));
  assert.ok(jsx.includes('>Kliknij mnie</button>'));
});

test('splitOuterLayoutClasses separates wrapper sizing and margin tokens cleanly', async () => {
  const { splitOuterLayoutClasses } = await import('./editorLogic.ts');

  const fullImg = splitOuterLayoutClasses(
    'w-full max-w-md mt-4 h-48 rounded-xl object-cover'
  );
  assert.equal(fullImg.outerClassName, 'w-full max-w-md mt-4');
  assert.equal(fullImg.innerClassName, 'h-48 rounded-xl object-cover w-full');

  const naturalImg = splitOuterLayoutClasses('h-40 rounded-xl border');
  assert.equal(naturalImg.outerClassName, 'w-fit max-w-full');
  assert.equal(naturalImg.innerClassName, 'h-40 rounded-xl border');
});

test('Typography and Effects Tailwind helpers read and update classes without clobbering unrelated tokens', async () => {
  const {
    BOX_SHADOW_CLASSES,
    BORDER_RADIUS_CLASSES,
    FONT_WEIGHT_CLASSES,
    TEXT_ALIGN_CLASSES,
    getTailwindGroupToken,
    getTailwindTextColor,
    setTailwindTextColor,
    toggleTailwindGroup,
  } = await import('./editorLogic.ts');

  const base = 'text-3xl font-bold text-slate-900 tracking-tight rounded-2xl shadow-sm';

  // Reading tokens
  assert.equal(getTailwindTextColor(base), 'text-slate-900');
  assert.equal(getTailwindGroupToken(base, FONT_WEIGHT_CLASSES), 'font-bold');
  assert.equal(getTailwindGroupToken(base, TEXT_ALIGN_CLASSES), '');
  assert.equal(getTailwindGroupToken(base, BORDER_RADIUS_CLASSES), 'rounded-2xl');
  assert.equal(getTailwindGroupToken(base, BOX_SHADOW_CLASSES), 'shadow-sm');

  // Updating text color preserves text-3xl and text-center
  const withCenter = toggleTailwindGroup(base, [...TEXT_ALIGN_CLASSES], 'text-center');
  assert.ok(withCenter.includes('text-center'));
  assert.ok(withCenter.includes('text-3xl'));

  const withBlueText = setTailwindTextColor(withCenter, 'text-blue-600');
  assert.ok(withBlueText.includes('text-blue-600'));
  assert.ok(!withBlueText.includes('text-slate-900'));
  assert.ok(withBlueText.includes('text-3xl'));
  assert.ok(withBlueText.includes('text-center'));

  // Toggling font weight, box-shadow, and border-radius
  const updatedWeight = toggleTailwindGroup(
    withBlueText,
    [...FONT_WEIGHT_CLASSES],
    'font-medium'
  );
  assert.ok(updatedWeight.includes('font-medium'));
  assert.ok(!updatedWeight.includes('font-bold'));

  const noShadow = toggleTailwindGroup(updatedWeight, [...BOX_SHADOW_CLASSES], '');
  assert.ok(!noShadow.includes('shadow-sm'));
  assert.ok(noShadow.includes('rounded-2xl'));

  const withXlRadius = toggleTailwindGroup(
    noShadow,
    [...BORDER_RADIUS_CLASSES],
    'rounded-xl'
  );
  assert.ok(withXlRadius.includes('rounded-xl'));
  assert.ok(!withXlRadius.includes('rounded-2xl'));
});

test('Flexbox Tailwind helpers manage flex-direction, justify-content, and align-items cleanly', async () => {
  const {
    ALIGN_ITEMS_CLASSES,
    FLEX_DIRECTION_CLASSES,
    JUSTIFY_CONTENT_CLASSES,
    getTailwindGroupToken,
    setTailwindFlexDirection,
    toggleTailwindGroup,
  } = await import('./editorLogic.ts');

  const gridContainer = 'p-8 bg-slate-50 grid grid-cols-2 gap-4';
  const asRow = setTailwindFlexDirection(gridContainer, 'flex-row');
  assert.ok(asRow.includes('flex'));
  assert.ok(asRow.includes('flex-row'));
  assert.ok(!asRow.includes('grid'));
  assert.ok(!asRow.includes('grid-cols-2'));
  assert.equal(getTailwindGroupToken(asRow, FLEX_DIRECTION_CLASSES), 'flex-row');

  const asColRev = setTailwindFlexDirection(asRow, 'flex-col-reverse');
  assert.ok(asColRev.includes('flex-col-reverse'));
  assert.ok(!asColRev.includes('flex-row'));

  const withJustify = toggleTailwindGroup(
    asColRev,
    [...JUSTIFY_CONTENT_CLASSES],
    'justify-between'
  );
  assert.equal(
    getTailwindGroupToken(withJustify, JUSTIFY_CONTENT_CLASSES),
    'justify-between'
  );

  const withAlign = toggleTailwindGroup(
    withJustify,
    [...ALIGN_ITEMS_CLASSES],
    'items-center'
  );
  assert.equal(
    getTailwindGroupToken(withAlign, ALIGN_ITEMS_CLASSES),
    'items-center'
  );
});

test('Theme CSS variable helpers normalize names and apply color/fontSize Tailwind utilities cleanly', async () => {
  const {
    normalizeCssVarName,
    setTailwindBgColor,
    setTailwindFontSize,
    setTailwindTextColor,
  } = await import('./editorLogic.ts');

  assert.equal(normalizeCssVarName('Accent Color'), '--accent-color');
  assert.equal(normalizeCssVarName('--color-primary'), '--color-primary');

  const base = 'text-3xl font-bold text-slate-900 bg-blue-600 px-5';

  // Applying CSS var text color replaces text-slate-900 without touching text-3xl
  const withVarText = setTailwindTextColor(base, 'text-[var(--color-primary)]');
  assert.ok(withVarText.includes('text-[var(--color-primary)]'));
  assert.ok(!withVarText.includes('text-slate-900'));
  assert.ok(withVarText.includes('text-3xl'));

  // Applying CSS var background replaces bg-blue-600
  const withVarBg = setTailwindBgColor(withVarText, 'bg-[var(--color-primary)]');
  assert.ok(withVarBg.includes('bg-[var(--color-primary)]'));
  assert.ok(!withVarBg.includes('bg-blue-600'));

  // Applying CSS var font size replaces text-3xl without touching text-[var(--color-primary)]
  const withVarSize = setTailwindFontSize(
    withVarBg,
    'text-[length:var(--font-size-title)]'
  );
  assert.ok(withVarSize.includes('text-[length:var(--font-size-title)]'));
  assert.ok(!withVarSize.includes('text-3xl'));
  assert.ok(withVarSize.includes('text-[var(--color-primary)]'));
});

test('insertPageTemplateIntoTree instantiates multi-level page templates into canvas tree', async () => {
  const { PAGE_TEMPLATES } = await import('../constants/editorDefaults.ts');
  const { insertPageTemplateIntoTree } = await import('./editorLogic.ts');

  const pricing = PAGE_TEMPLATES.find((t) => t.id === 'pricing-table');
  assert.ok(pricing);

  let counter = 1;
  const result = insertPageTemplateIntoTree(
    INITIAL_NODES,
    'root',
    pricing.root,
    () => `tpl_${counter++}`
  );

  assert.ok(result.createdId);
  const section = result.nodes[result.createdId];
  assert.equal(section?.type, 'Container');
  assert.equal(section?.parentId, 'root');
  assert.ok(result.nodes.root.children.includes(result.createdId));
  assert.equal(section.children.length, 2);
  const pricingGridId = section.children[1];
  assert.equal(result.nodes[pricingGridId]?.type, 'Grid');
  assert.equal(result.nodes[pricingGridId]?.children.length, 3);
});

test('buildThemeCssRules emits :root CSS variables and escaped Tailwind arbitrary utility rules', async () => {
  const { buildThemeCssRules } = await import('./editorLogic.ts');
  const css = buildThemeCssRules([
    {
      id: '1',
      name: '--color-primary',
      label: 'Primary',
      value: '#2563eb',
      category: 'color',
    },
    {
      id: '2',
      name: '--font-size-title',
      label: 'Title',
      value: '2.5rem',
      category: 'fontSize',
    },
  ]);

  assert.ok(css.includes('--color-primary: #2563eb;'));
  assert.ok(css.includes('.bg-\\[var\\(--color-primary\\)\\] { background-color: var(--color-primary); }'));
  assert.ok(css.includes('.text-\\[var\\(--color-primary\\)\\] { color: var(--color-primary); }'));
  assert.ok(css.includes('--font-size-title: 2.5rem;'));
  assert.ok(css.includes('.text-\\[length\\:var\\(--font-size-title\\)\\] { font-size: var(--font-size-title); }'));
});

test('getNodeBreadcrumbPath returns ordered hierarchy from root to selected node', async () => {
  const { getNodeBreadcrumbPath } = await import('./editorLogic.ts');

  const btnPath = getNodeBreadcrumbPath(INITIAL_NODES, 'btn-1');
  assert.deepEqual(
    btnPath.map((n) => n.id),
    ['root', 'hero-1', 'btn-1']
  );

  const rootPath = getNodeBreadcrumbPath(INITIAL_NODES, 'root');
  assert.deepEqual(
    rootPath.map((n) => n.id),
    ['root']
  );

  // Unknown id safely falls back to root
  const fallbackPath = getNodeBreadcrumbPath(INITIAL_NODES, 'missing-id');
  assert.deepEqual(
    fallbackPath.map((n) => n.id),
    ['root']
  );
});

test('generateNodeJSXSnippet renders scoped JSX for selected subtree', async () => {
  const { generateNodeJSXSnippet } = await import('./editorLogic.ts');

  const btnSnippet = generateNodeJSXSnippet(INITIAL_NODES, 'btn-1');
  assert.equal(
    btnSnippet,
    '<button type="button" className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm shadow-sm">Rozpocznij projekt</button>'
  );

  const heroSnippet = generateNodeJSXSnippet(INITIAL_NODES, 'hero-1');
  assert.ok(heroSnippet.startsWith('<div className="p-8 bg-slate-50'));
  assert.ok(heroSnippet.includes('  <span '));
  assert.ok(heroSnippet.endsWith('</div>'));
  assert.equal(generateNodeJSXSnippet(INITIAL_NODES, 'non-existent'), '');
});

test('removeTailwindTokenAt strips only the targeted token index', async () => {
  const { removeTailwindTokenAt } = await import('./editorLogic.ts');
  assert.equal(
    removeTailwindTokenAt('p-8 bg-slate-50 rounded-2xl', 1),
    'p-8 rounded-2xl'
  );
  assert.equal(removeTailwindTokenAt('p-8', 5), 'p-8');
});

test('parseNodesJson validates structure and catches malformed or dangling trees', async () => {
  const { parseNodesJson } = await import('./editorLogic.ts');

  const validRes = parseNodesJson(JSON.stringify(INITIAL_NODES));
  assert.equal(validRes.ok, true);
  if (validRes.ok) {
    assert.equal(validRes.nodes.root.id, 'root');
  }

  const invalidSyntax = parseNodesJson('{bad json');
  assert.equal(invalidSyntax.ok, false);

  const missingRoot = parseNodesJson(JSON.stringify({ other: INITIAL_NODES['btn-1'] }));
  assert.equal(missingRoot.ok, false);

  const danglingChild = parseNodesJson(
    JSON.stringify({
      root: { ...INITIAL_NODES.root, children: ['does-not-exist'] },
    })
  );
  assert.equal(danglingChild.ok, false);
});

test('insertIconNodeAtTarget and addIconNodeToTree insert Icon nodes and export Lucide JSX', async () => {
  const {
    addIconNodeToTree,
    generateNodeJSXSnippet,
    insertIconNodeAtTarget,
    parseNodesJson,
    splitIconClasses,
  } = await import('./editorLogic.ts');

  // Drop before btn-1 inside hero-1
  const dropped = insertIconNodeAtTarget(
    INITIAL_NODES,
    'Rocket',
    'btn-1',
    'before',
    () => 'icon-1'
  );
  assert.equal(dropped.createdId, 'icon-1');
  assert.equal(dropped.nodes['icon-1']?.type, 'Icon');
  assert.equal(dropped.nodes['icon-1']?.props.iconName, 'Rocket');
  assert.equal(dropped.nodes['icon-1']?.parentId, 'hero-1');
  assert.deepEqual(dropped.nodes['hero-1']?.children, [
    'badge-1',
    'heading-1',
    'text-1',
    'icon-1',
    'btn-1',
  ]);

  // Click-to-add adds into selected parent container
  const clicked = addIconNodeToTree(
    dropped.nodes,
    'hero-1',
    'Sparkles',
    () => 'icon-2'
  );
  assert.equal(clicked.createdId, 'icon-2');
  assert.equal(clicked.nodes['icon-2']?.props.iconName, 'Sparkles');

  // JSX export includes lucide-react import and <Rocket ... />
  const fullJsx = generateReactJSX(clicked.nodes);
  assert.ok(fullJsx.includes("import { Rocket, Sparkles } from 'lucide-react';"));
  assert.ok(fullJsx.includes('<Rocket className="w-6 h-6 text-slate-700" />'));
  assert.equal(
    generateNodeJSXSnippet(clicked.nodes, 'icon-1'),
    '<Rocket className="w-6 h-6 text-slate-700" />'
  );

  // parseNodesJson accepts Icon nodes
  const parsed = parseNodesJson(JSON.stringify(clicked.nodes));
  assert.equal(parsed.ok, true);

  // splitIconClasses separates svg dimensions from wrapper styles
  const split = splitIconClasses('w-8 h-8 p-2 bg-blue-50 text-blue-600 rounded-xl');
  assert.equal(split.iconClassName, 'w-8 h-8');
  assert.equal(
    split.wrapperClassName,
    'inline-flex items-center justify-center w-fit p-2 bg-blue-50 text-blue-600 rounded-xl'
  );
});

test('stepZoom and getZoomScaleClass step within bounds and map to Tailwind transform scale classes', async () => {
  const { DEFAULT_ZOOM, getZoomScaleClass, stepZoom } = await import(
    './editorLogic.ts'
  );

  assert.equal(DEFAULT_ZOOM, 1);
  assert.equal(stepZoom(1, 'in'), 1.1);
  assert.equal(stepZoom(1, 'out'), 0.9);
  assert.equal(stepZoom(1.5, 'in'), 1.5);
  assert.equal(stepZoom(0.5, 'out'), 0.5);

  assert.equal(getZoomScaleClass(1), '[transform:scale(1)]');
  assert.equal(getZoomScaleClass(1.2), '[transform:scale(1.2)]');
  assert.equal(getZoomScaleClass(0.7), '[transform:scale(0.7)]');
});

test('applyNodeVariantInTree switches component variants while preserving unrelated layout tokens', async () => {
  const { applyNodeVariantInTree, getComponentVariants } = await import(
    './editorLogic.ts'
  );

  assert.ok(getComponentVariants('Button').length >= 4);
  assert.deepEqual(getComponentVariants('Heading'), []);

  // Switch btn-1 from primary to secondary
  const secondaryNodes = applyNodeVariantInTree(
    INITIAL_NODES,
    'btn-1',
    'secondary'
  );
  const secBtn = secondaryNodes['btn-1'];
  assert.equal(secBtn?.variant, 'secondary');
  assert.ok(secBtn?.props.className?.includes('bg-slate-100'));
  assert.ok(secBtn?.props.className?.includes('text-slate-900'));
  assert.ok(!secBtn?.props.className?.includes('bg-blue-600'));
  assert.ok(!secBtn?.props.className?.includes('text-white'));
  // Preserves padding, radius, and font size
  assert.ok(secBtn?.props.className?.includes('px-5'));
  assert.ok(secBtn?.props.className?.includes('py-2.5'));
  assert.ok(secBtn?.props.className?.includes('rounded-lg'));
  assert.ok(secBtn?.props.className?.includes('text-sm'));

  // Switch badge-1 from info to warning
  const warningNodes = applyNodeVariantInTree(
    secondaryNodes,
    'badge-1',
    'warning'
  );
  assert.equal(warningNodes['badge-1']?.variant, 'warning');
  assert.ok(warningNodes['badge-1']?.props.className?.includes('bg-amber-100'));
  assert.ok(!warningNodes['badge-1']?.props.className?.includes('bg-blue-100'));
});

test('generateReactJSX includes SEO title, meta description, and canonical URL when configured', async () => {
  const { generateReactJSX, parseNodesJson, serializeNodesToJson } = await import(
    './editorLogic.ts'
  );

  const jsxWithSeo = generateReactJSX(INITIAL_NODES, {
    title: 'Landing Page',
    description: 'Nowoczesny interfejs w React',
    canonicalUrl: 'https://example.com/landing',
  });

  assert.ok(jsxWithSeo.includes('<>'));
  assert.ok(jsxWithSeo.includes('<title>Landing Page</title>'));
  assert.ok(
    jsxWithSeo.includes(
      '<meta name="description" content="Nowoczesny interfejs w React" />'
    )
  );
  assert.ok(
    jsxWithSeo.includes(
      '<link rel="canonical" href="https://example.com/landing" />'
    )
  );
  assert.ok(jsxWithSeo.includes('</>'));

  const json = serializeNodesToJson(INITIAL_NODES);
  const roundTrip = parseNodesJson(json);
  assert.equal(roundTrip.ok, true);
  if (roundTrip.ok) {
    assert.equal(roundTrip.nodes['btn-1']?.content, 'Rozpocznij projekt');
  }
});

test('Alignment quick-action helpers pin and center elements accurately across flex-col, flex-row, and grid parents', async () => {
  const {
    centerNodeInParent,
    clearNodeAlignment,
    detectParentLayoutKind,
    getNodeAlignmentState,
    setNodeHorizontalAlignment,
    setNodeVerticalAlignment,
    splitOuterLayoutClasses,
  } = await import('./editorLogic.ts');

  const flexColParent = 'p-8 bg-slate-50 flex flex-col items-start gap-4';
  const flexRowParent = 'p-4 flex flex-row items-center gap-3';
  const gridParent = 'grid grid-cols-2 gap-4';

  assert.equal(detectParentLayoutKind(flexColParent), 'flex-col');
  assert.equal(detectParentLayoutKind(flexRowParent), 'flex-row');
  assert.equal(detectParentLayoutKind(gridParent), 'grid');

  // flex-col: horizontal uses self-*, vertical uses mt-auto/my-auto/mb-auto
  const pinnedRightCol = setNodeHorizontalAlignment('px-4 py-2', flexColParent, 'right');
  assert.ok(pinnedRightCol.includes('self-end'));
  const pinnedBottomCol = setNodeVerticalAlignment(pinnedRightCol, flexColParent, 'bottom');
  assert.ok(pinnedBottomCol.includes('self-end'));
  assert.ok(pinnedBottomCol.includes('mt-auto'));
  assert.deepEqual(getNodeAlignmentState(pinnedBottomCol, flexColParent), {
    layoutKind: 'flex-col',
    horizontal: 'right',
    vertical: 'bottom',
  });

  // flex-row: horizontal uses ml-auto/mx-auto/mr-auto without wiping vertical self-*
  const pinnedTopRow = setNodeVerticalAlignment('px-4 py-2', flexRowParent, 'top');
  assert.ok(pinnedTopRow.includes('self-start'));
  const pinnedRightTopRow = setNodeHorizontalAlignment(pinnedTopRow, flexRowParent, 'right');
  assert.ok(pinnedRightTopRow.includes('self-start'));
  assert.ok(pinnedRightTopRow.includes('ml-auto'));
  assert.deepEqual(getNodeAlignmentState(pinnedRightTopRow, flexRowParent), {
    layoutKind: 'flex-row',
    horizontal: 'right',
    vertical: 'top',
  });

  // grid: horizontal uses justify-self-*, vertical uses self-*
  const centeredGrid = centerNodeInParent('p-2 bg-white', gridParent);
  assert.ok(centeredGrid.includes('justify-self-center'));
  assert.ok(centeredGrid.includes('self-center'));
  assert.deepEqual(getNodeAlignmentState(centeredGrid, gridParent), {
    layoutKind: 'grid',
    horizontal: 'center',
    vertical: 'middle',
  });

  // Input/Image outer wrapper preserves alignment classes cleanly
  const split = splitOuterLayoutClasses(centeredGrid);
  assert.ok(split.outerClassName.includes('justify-self-center'));
  assert.ok(split.outerClassName.includes('self-center'));

  // clearNodeAlignment removes all alignment tokens cleanly
  assert.equal(clearNodeAlignment(centeredGrid), 'p-2 bg-white');
});

test('Animation class groups toggle and read transition, duration, easing, hover transform, and keyframe classes', async () => {
  const {
    HOVER_TRANSFORM_CLASSES,
    KEYFRAME_ANIMATION_CLASSES,
    TRANSITION_DURATION_CLASSES,
    TRANSITION_EASING_CLASSES,
    TRANSITION_PROPERTY_CLASSES,
    getTailwindGroupToken,
  } = await import('./editorLogic.ts');

  let cls = 'px-5 py-2.5 bg-blue-600 text-white rounded-lg transition-colors';
  assert.equal(
    getTailwindGroupToken(cls, TRANSITION_PROPERTY_CLASSES),
    'transition-colors'
  );

  cls = toggleTailwindGroup(cls, [...TRANSITION_PROPERTY_CLASSES], 'transition-all');
  cls = toggleTailwindGroup(cls, [...TRANSITION_DURATION_CLASSES], 'duration-300');
  cls = toggleTailwindGroup(cls, [...TRANSITION_EASING_CLASSES], 'ease-in-out');
  cls = toggleTailwindGroup(cls, [...HOVER_TRANSFORM_CLASSES], 'hover:scale-105');
  cls = toggleTailwindGroup(cls, [...KEYFRAME_ANIMATION_CLASSES], 'animate-pulse');

  assert.ok(cls.includes('transition-all'));
  assert.ok(!cls.includes('transition-colors'));
  assert.ok(cls.includes('duration-300'));
  assert.ok(cls.includes('ease-in-out'));
  assert.ok(cls.includes('hover:scale-105'));
  assert.ok(cls.includes('animate-pulse'));

  assert.equal(getTailwindGroupToken(cls, TRANSITION_DURATION_CLASSES), 'duration-300');
  assert.equal(getTailwindGroupToken(cls, TRANSITION_EASING_CLASSES), 'ease-in-out');
  assert.equal(getTailwindGroupToken(cls, HOVER_TRANSFORM_CLASSES), 'hover:scale-105');
  assert.equal(getTailwindGroupToken(cls, KEYFRAME_ANIMATION_CLASSES), 'animate-pulse');
});

test('Component History utilities capture added/deleted custom subtrees and reinsert them accurately', async () => {
  const {
    addCardPresetToTree,
    applyNodeVariantInTree,
    createComponentHistoryEntry,
    deleteNodeFromTree,
    filterComponentHistory,
    prependComponentHistory,
    refreshAddedComponentHistoryEntry,
    reinsertComponentFromHistory,
    updateNodeInTree,
  } = await import('./editorLogic.ts');

  // Add a custom card preset and customize its button
  let seq = 1;
  const added = addCardPresetToTree(INITIAL_NODES, 'root', () => `card_${seq++}`);
  assert.ok(added.createdId);
  const addedEntry = createComponentHistoryEntry(
    added.nodes,
    added.createdId,
    'added',
    () => 'hist_1',
    1000
  );
  assert.ok(addedEntry);
  assert.equal(addedEntry.eventType, 'added');
  assert.equal(addedEntry.nodeCount, 5); // Card + 4 children

  // Customize card name + variant and refresh its added history entry
  let modifiedNodes = updateNodeInTree(added.nodes, added.createdId, 'name', 'Custom Promo Card');
  modifiedNodes = applyNodeVariantInTree(modifiedNodes, added.createdId, 'dark');
  let historyList = prependComponentHistory([], addedEntry);
  historyList = refreshAddedComponentHistoryEntry(
    historyList,
    modifiedNodes,
    added.createdId,
    2000
  );
  assert.equal(historyList[0]?.label, 'Custom Promo Card');
  assert.equal(historyList[0]?.variant, 'dark');
  assert.ok(historyList[0]?.snapshot.props.className?.includes('bg-slate-900'));

  // Capture deleted custom subtree (e.g. btn-1 customized)
  const customBtnNodes = updateNodeInTree(modifiedNodes, 'btn-1', 'content', 'Start Free');
  const deletedEntry = createComponentHistoryEntry(
    customBtnNodes,
    'btn-1',
    'deleted',
    () => 'hist_2',
    3000
  );
  assert.ok(deletedEntry);
  historyList = prependComponentHistory(historyList, deletedEntry);
  const afterDelete = deleteNodeFromTree(customBtnNodes, 'btn-1');
  assert.equal(afterDelete.nodes['btn-1'], undefined);

  // Filter added vs deleted
  assert.equal(filterComponentHistory(historyList, 'all').length, 2);
  assert.equal(filterComponentHistory(historyList, 'added').length, 1);
  assert.equal(filterComponentHistory(historyList, 'deleted').length, 1);

  // Reinsert deleted custom button back into canvas
  const reinserted = reinsertComponentFromHistory(
    afterDelete.nodes,
    'hero-1',
    deletedEntry,
    () => `re_${seq++}`
  );
  assert.ok(reinserted.createdId);
  const restoredBtn = reinserted.nodes[reinserted.createdId];
  assert.equal(restoredBtn?.type, 'Button');
  assert.equal(restoredBtn?.content, 'Start Free');
  assert.equal(restoredBtn?.variant, 'primary');
  assert.equal(restoredBtn?.parentId, 'hero-1');
});

test('PDF export helpers sanitize filenames, compute A4 geometry, and produce valid PDF blob bytes', async () => {
  const {
    buildPdfFileName,
    computePdfPageGeometry,
    createPdfBlobFromImageDataUrl,
  } = await import('./pdfExport.ts');

  assert.equal(buildPdfFileName(''), 'react-ui-studio-canvas.pdf');
  assert.equal(
    buildPdfFileName('Ładna Strona | Landing Page 2026!'),
    'ladna-strona-landing-page-2026.pdf'
  );

  // Wide canvas -> landscape A4
  const wide = computePdfPageGeometry(1200, 600);
  assert.equal(wide.orientation, 'landscape');
  assert.equal(wide.pageWidthMm, 297);
  assert.equal(wide.pageHeightMm, 210);
  assert.ok(wide.drawWidthMm <= 277.01);
  assert.ok(Math.abs(wide.drawWidthMm / wide.drawHeightMm - 2) < 0.01);

  // Tall canvas -> portrait A4
  const tall = computePdfPageGeometry(500, 1000);
  assert.equal(tall.orientation, 'portrait');
  assert.equal(tall.pageWidthMm, 210);
  assert.equal(tall.pageHeightMm, 297);
  assert.ok(tall.drawHeightMm <= 277.01);
  assert.ok(Math.abs(tall.drawWidthMm / tall.drawHeightMm - 0.5) < 0.01);

  // 1x1 transparent PNG data URI -> valid %PDF- binary blob
  const tinyPngDataUrl =
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
  const pdfBlob = createPdfBlobFromImageDataUrl(tinyPngDataUrl, 800, 600);
  assert.ok(pdfBlob.size > 100);
  const headerText = await pdfBlob.slice(0, 5).text();
  assert.equal(headerText, '%PDF-');
});

test('Multi-Selection and Bulk Styling helpers manage selection sets, bulk class updates, shared token reading, and bulk deletion', async () => {
  const {
    TEXT_ALIGN_CLASSES,
    appendBulkCustomClassesToNodes,
    applyBulkClassUpdaterToNodes,
    deleteNodesFromTree,
    getSharedGroupTokenAcrossNodes,
    getSharedSpacingValueAcrossNodes,
    getSharedTextColorAcrossNodes,
    setTailwindSpacingValue,
    setTailwindTextColor,
    toggleMultiSelection,
  } = await import('./editorLogic.ts');

  // Toggle selection behavior
  let selected = toggleMultiSelection(['root'], 'heading-1', false, INITIAL_NODES);
  assert.deepEqual(selected, ['heading-1']);
  selected = toggleMultiSelection(selected, 'text-1', true, INITIAL_NODES);
  assert.deepEqual(selected, ['heading-1', 'text-1']);
  // Deselecting one leaves the remaining node
  selected = toggleMultiSelection(selected, 'heading-1', true, INITIAL_NODES);
  assert.deepEqual(selected, ['text-1']);
  // Additive re-add back to two
  selected = toggleMultiSelection(selected, 'heading-1', true, INITIAL_NODES);
  assert.deepEqual(selected, ['text-1', 'heading-1']);
  // Selecting root resets back to ['root']
  assert.deepEqual(
    toggleMultiSelection(selected, 'root', true, INITIAL_NODES),
    ['root']
  );

  // Bulk text color + bulk spacing update across multiple nodes
  let bulkUpdated = applyBulkClassUpdaterToNodes(
    INITIAL_NODES,
    ['heading-1', 'text-1'],
    (cls) => setTailwindTextColor(cls, 'text-blue-600')
  );
  bulkUpdated = applyBulkClassUpdaterToNodes(
    bulkUpdated,
    ['heading-1', 'text-1'],
    (cls) => setTailwindSpacingValue(cls, 'p', '4')
  );

  assert.ok(bulkUpdated['heading-1']?.props.className?.includes('text-blue-600'));
  assert.ok(bulkUpdated['heading-1']?.props.className?.includes('p-4'));
  assert.ok(bulkUpdated['text-1']?.props.className?.includes('text-blue-600'));
  assert.ok(bulkUpdated['text-1']?.props.className?.includes('p-4'));
  // Original node sizes preserved cleanly
  assert.ok(bulkUpdated['heading-1']?.props.className?.includes('text-3xl'));
  assert.ok(bulkUpdated['text-1']?.props.className?.includes('text-base'));

  // Shared token readers report common values and '' when divergent
  assert.equal(
    getSharedTextColorAcrossNodes(bulkUpdated, ['heading-1', 'text-1']),
    'text-blue-600'
  );
  assert.equal(
    getSharedSpacingValueAcrossNodes(bulkUpdated, ['heading-1', 'text-1'], 'p'),
    '4'
  );
  assert.equal(
    getSharedGroupTokenAcrossNodes(bulkUpdated, ['heading-1', 'btn-1'], TEXT_ALIGN_CLASSES),
    ''
  );

  // Append arbitrary bulk classes without duplicating existing tokens
  const withBulkExtra = appendBulkCustomClassesToNodes(
    bulkUpdated,
    ['heading-1', 'text-1'],
    'tracking-wide p-4 shadow-sm'
  );
  assert.ok(withBulkExtra['heading-1']?.props.className?.includes('tracking-wide'));
  assert.ok(withBulkExtra['text-1']?.props.className?.includes('shadow-sm'));
  assert.equal(
    withBulkExtra['heading-1']?.props.className
      ?.split(/\s+/)
      .filter((t) => t === 'p-4').length,
    1
  );

  // Bulk delete removes selected non-root nodes cleanly
  const afterBulkDelete = deleteNodesFromTree(withBulkExtra, ['heading-1', 'text-1']);
  assert.equal(afterBulkDelete.nextSelectedId, 'root');
  assert.equal(afterBulkDelete.nodes['heading-1'], undefined);
  assert.equal(afterBulkDelete.nodes['text-1'], undefined);
  assert.ok(afterBulkDelete.nodes['badge-1']);
  assert.ok(afterBulkDelete.nodes['btn-1']);
});

test('recordRecentComponentSearch deduplicates by type, ignores blank queries, and caps at 5 newest items', async () => {
  const { recordRecentComponentSearch } = await import('./editorLogic.ts');

  let list = recordRecentComponentSearch([], {
    type: 'Grid',
    label: 'Grid',
    query: '   ',
  });
  assert.equal(list.length, 0);

  const items = [
    { type: 'Container' as const, label: 'Kontener', query: 'Kontener' },
    { type: 'Grid' as const, label: 'Grid', query: 'Grid' },
    { type: 'Heading' as const, label: 'Nagłówek', query: 'Nagłówek' },
    { type: 'Text' as const, label: 'Tekst', query: 'Tekst' },
    { type: 'Button' as const, label: 'Przycisk', query: 'Przycisk' },
    { type: 'Badge' as const, label: 'Odznaka', query: 'Odznaka' },
  ];

  items.forEach((item, idx) => {
    list = recordRecentComponentSearch(list, item, 5, 1000 + idx);
  });

  // Only last 5 remain, newest first
  assert.equal(list.length, 5);
  assert.deepEqual(
    list.map((i) => i.type),
    ['Badge', 'Button', 'Text', 'Heading', 'Grid']
  );

  // Searching an already-present type moves it to the top with updated query
  list = recordRecentComponentSearch(
    list,
    { type: 'Grid', label: 'Grid', query: 'siatka' },
    5,
    2000
  );
  assert.equal(list.length, 5);
  assert.equal(list[0]?.type, 'Grid');
  assert.equal(list[0]?.query, 'siatka');
});

test('generateHtmlExport, generateStaticSvgExport, and buildExportFileName emit valid HTML and SVG exports', async () => {
  const {
    buildExportFileName,
    generateHtmlExport,
    generateStaticSvgExport,
  } = await import('./exportFormats.ts');
  const { DEFAULT_THEME_VARS } = await import('../constants/editorDefaults.ts');

  assert.equal(
    buildExportFileName('Moja Aplikacja', 'html'),
    'moja-aplikacja.html'
  );
  assert.equal(buildExportFileName('', 'svg'), 'react-ui-studio-design.svg');

  const seo = {
    title: 'Landing M3',
    description: 'Nowoczesny szablon UI',
    canonicalUrl: 'https://example.com/landing',
  };

  const html = generateHtmlExport(INITIAL_NODES, DEFAULT_THEME_VARS, seo);
  assert.ok(html.startsWith('<!DOCTYPE html>'));
  assert.ok(html.includes('<title>Landing M3</title>'));
  assert.ok(html.includes('<meta name="description" content="Nowoczesny szablon UI" />'));
  assert.ok(html.includes('<link rel="canonical" href="https://example.com/landing" />'));
  assert.ok(html.includes('--color-primary: #2563eb;'));
  assert.ok(html.includes('Zbuduj interfejs React wizualnie'));

  const svg = generateStaticSvgExport(INITIAL_NODES, DEFAULT_THEME_VARS, seo);
  assert.ok(svg.startsWith('<?xml version="1.0" encoding="UTF-8"?>'));
  assert.ok(svg.includes('<svg xmlns="http://www.w3.org/2000/svg"'));
  assert.ok(svg.includes('<title>Landing M3</title>'));
  assert.ok(svg.includes('<rect '));
  assert.ok(svg.includes('<text '));
  assert.ok(svg.includes('Rozpocznij projekt'));
});

test('THEME_PRESETS includes Material Design 3 and matches presets deterministically', async () => {
  const { THEME_PRESETS } = await import('../constants/editorDefaults.ts');
  const { detectMatchingThemePresetId } = await import('./editorLogic.ts');

  const m3 = THEME_PRESETS.find((p) => p.id === 'material-design-3');
  assert.ok(m3, 'Expected material-design-3 preset');
  assert.equal(m3.name, 'Material Design 3');
  assert.equal(
    m3.variables.find((v) => v.name === '--color-primary')?.value,
    '#6750A4'
  );
  assert.equal(
    m3.variables.find((v) => v.name === '--color-surface')?.value,
    '#FEF7FF'
  );

  assert.equal(
    detectMatchingThemePresetId(m3.variables, THEME_PRESETS),
    'material-design-3'
  );
  const tweaked = m3.variables.map((v, i) =>
    i === 0 ? { ...v, value: '#000000' } : v
  );
  assert.equal(detectMatchingThemePresetId(tweaked, THEME_PRESETS), null);
});

test('parseImportedTheme parses CSS :root, flat JSON, ThemeVariable array, and Material Theme Builder schemes', async () => {
  const {
    parseImportedTheme,
    serializeThemeVariablesToJson,
  } = await import('./editorLogic.ts');

  // 1. CSS :root block
  const cssRes = parseImportedTheme(
    `:root { --color-primary: #6750A4; --color-surface: #FEF7FF; --font-size-title: 2rem; }`,
    () => 'var_id'
  );
  assert.equal(cssRes.ok, true);
  if (cssRes.ok) {
    assert.equal(cssRes.variables.length, 3);
    assert.equal(cssRes.variables[0]?.category, 'color');
    assert.equal(cssRes.variables[2]?.category, 'fontSize');
  }

  // 2. Round-trip ThemeVariable[] JSON
  if (cssRes.ok) {
    const serialized = serializeThemeVariablesToJson(cssRes.variables);
    const jsonArrRes = parseImportedTheme(serialized, () => 'arr_id');
    assert.equal(jsonArrRes.ok, true);
    if (jsonArrRes.ok) {
      assert.equal(jsonArrRes.variables.length, 3);
      assert.equal(jsonArrRes.variables[0]?.name, '--color-primary');
    }
  }

  // 3. Material Theme Builder JSON `{ schemes: { light: { primary, onPrimary, surface } } }`
  const m3Json = JSON.stringify({
    schemes: {
      light: {
        primary: '#6750A4',
        onPrimary: '#FFFFFF',
        surface: '#FEF7FF',
      },
    },
  });
  const m3Res = parseImportedTheme(m3Json, () => 'm3_id');
  assert.equal(m3Res.ok, true);
  if (m3Res.ok) {
    assert.ok(
      m3Res.variables.some(
        (v) => v.name === '--color-on-primary' && v.value === '#FFFFFF'
      )
    );
  }

  // 4. Invalid inputs return descriptive errors
  const badJson = parseImportedTheme('{ invalid json');
  assert.equal(badJson.ok, false);
  const empty = parseImportedTheme('   ');
  assert.equal(empty.ok, false);
});

test('KEYBOARD_SHORTCUTS and filterKeyboardShortcuts expose Delete, Duplicate, and Parent selection', async () => {
  const { KEYBOARD_SHORTCUTS } = await import('../constants/editorDefaults.ts');
  const { filterKeyboardShortcuts } = await import('./editorLogic.ts');

  const actions = KEYBOARD_SHORTCUTS.map((s) => s.action);
  assert.ok(actions.includes('Delete'));
  assert.ok(actions.includes('Duplicate'));
  assert.ok(actions.includes('Parent selection'));
  assert.ok(KEYBOARD_SHORTCUTS.every((s) => s.keys.length > 0));

  assert.equal(filterKeyboardShortcuts(KEYBOARD_SHORTCUTS, '').length, KEYBOARD_SHORTCUTS.length);
  assert.deepEqual(
    filterKeyboardShortcuts(KEYBOARD_SHORTCUTS, 'Duplicate').map((s) => s.id),
    ['duplicate-node']
  );
  assert.deepEqual(
    filterKeyboardShortcuts(KEYBOARD_SHORTCUTS, 'nadrzędnego').map((s) => s.id),
    ['parent-selection']
  );
  assert.deepEqual(
    filterKeyboardShortcuts(KEYBOARD_SHORTCUTS, 'Escape').map((s) => s.id),
    ['parent-selection']
  );
});

test('THEME_PRESETS includes Modern Minimal, Playful Vibrant, Dark High-Contrast, and Material Design 3', async () => {
  const { THEME_PRESETS } = await import('../constants/editorDefaults.ts');
  const { detectMatchingThemePresetId } = await import('./editorLogic.ts');

  const names = THEME_PRESETS.map((p) => p.name);
  assert.ok(names.includes('Material Design 3'));
  assert.ok(names.includes('Modern Minimal'));
  assert.ok(names.includes('Playful Vibrant'));
  assert.ok(names.includes('Dark High-Contrast'));

  for (const preset of THEME_PRESETS) {
    assert.equal(
      detectMatchingThemePresetId(preset.variables, THEME_PRESETS),
      preset.id
    );
  }
});

test('Saved Components helpers snapshot subtrees with styles/children and insert at any drop position', async () => {
  const {
    createSavedComponentEntry,
    insertBlueprintAtTarget,
    insertSavedComponentIntoTree,
  } = await import('./editorLogic.ts');

  const entry = createSavedComponentEntry(
    INITIAL_NODES,
    'hero-1',
    'Custom Hero Snippet',
    () => 'saved_1',
    5000
  );
  assert.ok(entry);
  assert.equal(entry.name, 'Custom Hero Snippet');
  assert.equal(entry.nodeCount, 5);
  assert.equal(entry.snapshot.children?.length, 4);

  let seq = 1;
  const droppedBefore = insertBlueprintAtTarget(
    INITIAL_NODES,
    entry.snapshot,
    'hero-1',
    'before',
    () => `snip_${seq++}`
  );
  assert.equal(droppedBefore.createdId, 'snip_1');
  assert.deepEqual(droppedBefore.nodes['root']?.children, ['snip_1', 'hero-1']);
  assert.equal(droppedBefore.nodes['snip_1']?.name, 'Custom Hero Snippet');
  assert.equal(droppedBefore.nodes['snip_1']?.children.length, 4);

  const clickedInsert = insertSavedComponentIntoTree(
    droppedBefore.nodes,
    'root',
    entry,
    () => `click_${seq++}`
  );
  assert.ok(clickedInsert.createdId);
  assert.equal(clickedInsert.nodes['root']?.children.length, 3);
});

test('Descriptive auto-naming derives Info Header for icon + text containers and Smart Layout replaces layout tokens', async () => {
  const {
    addIconNodeToTree,
    applySmartLayoutClasses,
    generateDescriptiveNodeName,
  } = await import('./editorLogic.ts');

  let seq = 1;
  const withBox = addNodeToTree(INITIAL_NODES, 'root', 'Container', () => `box_${seq++}`);
  assert.ok(withBox.createdId);
  const boxId = withBox.createdId;
  assert.equal(withBox.nodes[boxId]?.name, 'Kontener');

  const withIcon = addIconNodeToTree(withBox.nodes, boxId, 'Info', () => `ico_${seq++}`);
  assert.equal(withIcon.nodes[withIcon.createdId!]?.name, 'Info Icon');

  const withText = addNodeToTree(withIcon.nodes, boxId, 'Text', () => `txt_${seq++}`);
  assert.equal(withText.nodes[boxId]?.name, 'Info Header');
  assert.equal(generateDescriptiveNodeName(withText.nodes, boxId), 'Info Header');

  // Content update renames default-named Heading cleanly without touching manually named nodes
  const withHeading = addNodeToTree(withText.nodes, 'root', 'Heading', () => `hd_${seq++}`);
  const hId = withHeading.createdId!;
  const updatedHeading = updateNodeInTree(withHeading.nodes, hId, 'content', 'Pricing Plans for Teams');
  assert.equal(updatedHeading[hId]?.name, 'Pricing Plans for');

  const manuallyNamed = updateNodeInTree(updatedHeading, boxId, 'name', 'My Locked Box');
  const afterExtraBtn = addNodeToTree(manuallyNamed, boxId, 'Button', () => `extra_${seq++}`);
  assert.equal(afterExtraBtn.nodes[boxId]?.name, 'My Locked Box');

  // Smart layout replaces layout/gap/padding while keeping bg/border/rounded
  const merged = applySmartLayoutClasses(
    'p-4 bg-white border border-slate-200 rounded-2xl flex flex-col gap-3',
    'grid grid-cols-1 md:grid-cols-2 gap-6 items-center max-w-4xl mx-auto'
  );
  assert.ok(merged.includes('bg-white'));
  assert.ok(merged.includes('border-slate-200'));
  assert.ok(merged.includes('rounded-2xl'));
  assert.ok(merged.includes('grid-cols-1'));
  assert.ok(merged.includes('md:grid-cols-2'));
  assert.ok(merged.includes('gap-6'));
  assert.ok(!merged.includes('flex-col'));
  assert.ok(!merged.includes('gap-3'));
  assert.ok(!merged.includes('p-4'));
});

test('Assets helpers classify images vs SVG icons, filter assets, and insert Base64 nodes cleanly without garbling data URIs', async () => {
  const {
    createImportedAssetRecord,
    filterImportedAssets,
    formatAssetFileNameToLabel,
    formatBytes,
    generateDescriptiveNodeName,
    insertAssetAtTarget,
    insertAssetIntoTree,
    isSupportedAssetFile,
  } = await import('./editorLogic.ts');

  assert.equal(isSupportedAssetFile('image/png', 'photo.png'), true);
  assert.equal(isSupportedAssetFile('image/svg+xml', 'spark.svg'), true);
  assert.equal(isSupportedAssetFile('application/pdf', 'doc.pdf'), false);

  assert.equal(formatAssetFileNameToLabel('hero-banner_v2.png'), 'Hero banner v2');
  assert.equal(formatBytes(512), '512 B');
  assert.equal(formatBytes(2048), '2.0 KB');

  const pngAsset = createImportedAssetRecord(
    {
      fileName: 'team_photo.png',
      mimeType: 'image/png',
      dataUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
      sizeBytes: 12800,
    },
    () => 'asset_png',
    1000
  );
  assert.equal(pngAsset.kind, 'image');
  assert.equal(pngAsset.name, 'Team photo');

  const svgAsset = createImportedAssetRecord(
    {
      fileName: 'brand-logo.svg',
      mimeType: 'image/svg+xml',
      dataUrl: 'data:image/svg+xml;base64,PHN2Zy8+',
      sizeBytes: 1450,
    },
    () => 'asset_svg',
    2000
  );
  assert.equal(svgAsset.kind, 'icon');
  assert.equal(svgAsset.name, 'Brand logo');

  const allAssets = [pngAsset, svgAsset];
  assert.equal(filterImportedAssets(allAssets, 'all', '').length, 2);
  assert.equal(filterImportedAssets(allAssets, 'icon', '').length, 1);
  assert.equal(filterImportedAssets(allAssets, 'image', 'team').length, 1);

  const inserted = insertAssetIntoTree(
    INITIAL_NODES,
    'hero-1',
    pngAsset,
    () => 'img_node_1'
  );
  assert.equal(inserted.createdId, 'img_node_1');
  const createdImg = inserted.nodes['img_node_1'];
  assert.equal(createdImg?.type, 'Image');
  assert.equal(createdImg?.name, 'Team photo');
  assert.equal(createdImg?.props.src, pngAsset.dataUrl);
  assert.equal(
    generateDescriptiveNodeName(inserted.nodes, 'img_node_1'),
    'Team photo'
  );

  // Changing another Image node src to a Base64 URI preserves its human label instead of turning base64 text into a name
  const swapped = updateNodeInTree(
    inserted.nodes,
    'img_node_1',
    'src',
    svgAsset.dataUrl,
    true
  );
  assert.equal(swapped['img_node_1']?.name, 'Team photo');

  const droppedBefore = insertAssetAtTarget(
    INITIAL_NODES,
    svgAsset,
    'hero-1',
    'before',
    () => 'icon_node_1'
  );
  assert.equal(droppedBefore.createdId, 'icon_node_1');
  assert.deepEqual(droppedBefore.nodes['root']?.children, ['icon_node_1', 'hero-1']);
  assert.ok(droppedBefore.nodes['icon_node_1']?.props.className?.includes('w-12 h-12'));
});

test('SEO Preview helpers format Google SERP breadcrumbs, extract canvas fallbacks, and enforce desktop/mobile character limits', async () => {
  const {
    SEO_DESCRIPTION_LIMIT_DESKTOP,
    SEO_DESCRIPTION_LIMIT_MOBILE,
    SEO_TITLE_LIMIT,
    buildSeoPreviewData,
    extractCanvasSeoFallbacks,
    formatGoogleSerpBreadcrumb,
  } = await import('./seoPreview.ts');

  const fallbacks = extractCanvasSeoFallbacks(INITIAL_NODES);
  assert.equal(fallbacks.heading, 'Zbuduj interfejs React wizualnie');
  assert.ok(fallbacks.description.includes('Kliknij dowolny element'));

  // Empty SEO metadata falls back cleanly to canvas heading/text + default host
  const emptyPreview = buildSeoPreviewData(
    { title: '', description: '', canonicalUrl: '' },
    INITIAL_NODES,
    'desktop'
  );
  assert.equal(emptyPreview.isUsingFallbackTitle, true);
  assert.equal(emptyPreview.isUsingFallbackDescription, true);
  assert.equal(emptyPreview.titleStatus, 'empty');
  assert.equal(emptyPreview.descriptionStatus, 'empty');
  assert.equal(emptyPreview.title, 'Zbuduj interfejs React wizualnie');
  assert.equal(emptyPreview.siteName, 'example.com');
  assert.equal(emptyPreview.displayUrl, 'https://example.com');

  // Valid canonical URL with nested path builds Google breadcrumb
  const breadcrumb = formatGoogleSerpBreadcrumb('https://www.acme.dev/docs/getting-started/');
  assert.equal(breadcrumb.siteName, 'acme.dev');
  assert.equal(
    breadcrumb.displayUrl,
    'https://www.acme.dev › docs › getting-started'
  );

  // Over-limit SEO metadata triggers truncation + 'too-long' status on Desktop & tighter truncation on Mobile
  const longTitle = 'Ultra Modern Visual React UI Studio & Tailwind Design Builder Platform';
  const longDesc =
    'Build responsive production React interfaces visually with Flexbox, CSS Grid, instant theme tokens, saved component snippets, and clean export workflows across devices.';
  assert.ok(longTitle.length > SEO_TITLE_LIMIT);
  assert.ok(longDesc.length > SEO_DESCRIPTION_LIMIT_DESKTOP);

  const desktopLong = buildSeoPreviewData(
    { title: longTitle, description: longDesc, canonicalUrl: 'acme.dev/studio' },
    INITIAL_NODES,
    'desktop'
  );
  assert.equal(desktopLong.titleStatus, 'too-long');
  assert.equal(desktopLong.descriptionStatus, 'too-long');
  assert.ok(desktopLong.title.endsWith('…'));
  assert.ok(desktopLong.title.length <= SEO_TITLE_LIMIT);
  assert.ok(desktopLong.description.endsWith('…'));
  assert.ok(desktopLong.description.length <= SEO_DESCRIPTION_LIMIT_DESKTOP);
  assert.equal(desktopLong.displayUrl, 'https://acme.dev › studio');

  const mobileMedium = buildSeoPreviewData(
    {
      title: 'React UI Studio',
      description:
        'Twórz interfejsy React wizualnie i eksportuj czysty kod Tailwind CSS bezpośrednio z przeglądarki w kilka chwil dla całego zespołu.',
      canonicalUrl: 'https://studio.example.com/editor',
    },
    INITIAL_NODES,
    'mobile'
  );
  assert.equal(mobileMedium.titleStatus, 'ok');
  assert.equal(mobileMedium.descriptionStatus, 'too-long');
  assert.equal(mobileMedium.descriptionMax, SEO_DESCRIPTION_LIMIT_MOBILE);
  assert.ok(mobileMedium.description.length <= SEO_DESCRIPTION_LIMIT_MOBILE);
});

test('Grid Layout helpers manage grid-template-columns, grid-gap, auto-placement, child spans, and arbitrary CSS rules', async () => {
  const {
    buildArbitraryGridCssRules,
    buildGridPreviewSummary,
    extractCustomGridTemplateText,
    formatCustomGapToToken,
    formatCustomGridTemplateToToken,
    getGridAutoCols,
    getGridAutoFlow,
    getGridAutoRows,
    getGridChildSpan,
    getGridColsToken,
    getGridDisplayMode,
    getGridGapState,
    getGridPlaceContent,
    getGridPlaceItems,
    resetGridLayoutClasses,
    setGridAutoCols,
    setGridAutoFlow,
    setGridAutoRows,
    setGridAxisGap,
    setGridChildSpan,
    setGridColsToken,
    setGridDisplayMode,
    setGridPlaceContent,
    setGridPlaceItems,
    setGridUniformGap,
  } = await import('./gridLayout.ts');

  const initialCls = 'grid grid-cols-2 gap-4 items-start p-4 bg-white rounded-lg';

  // Display mode + base & responsive grid-template-columns
  const inlineCls = setGridDisplayMode(initialCls, 'inline-grid');
  assert.equal(getGridDisplayMode(inlineCls), 'inline-grid');

  const threeCols = setGridColsToken(inlineCls, 'grid-cols-3', '');
  assert.equal(getGridColsToken(threeCols, ''), 'grid-cols-3');
  assert.ok(threeCols.includes('inline-grid'));
  assert.ok(threeCols.includes('p-4'));

  const responsiveCols = setGridColsToken(threeCols, 'lg:grid-cols-6', 'lg');
  assert.equal(getGridColsToken(responsiveCols, ''), 'grid-cols-3');
  assert.equal(getGridColsToken(responsiveCols, 'lg'), 'lg:grid-cols-6');

  // Custom arbitrary grid-template-columns formatting & extraction
  const customToken = formatCustomGridTemplateToToken('200px 1fr 2fr');
  assert.equal(customToken, 'grid-cols-[200px_1fr_2fr]');
  assert.equal(extractCustomGridTemplateText(customToken), '200px 1fr 2fr');

  const customColsCls = setGridColsToken(responsiveCols, customToken, '');
  assert.equal(getGridColsToken(customColsCls, ''), 'grid-cols-[200px_1fr_2fr]');
  assert.equal(getGridColsToken(customColsCls, 'lg'), 'lg:grid-cols-6');

  // Grid gap uniform -> split axis preservation -> uniform reset
  assert.deepEqual(getGridGapState(customColsCls), {
    mode: 'uniform',
    uniform: 'gap-4',
    x: '',
    y: '',
  });

  const splitGapX = setGridAxisGap(customColsCls, 'x', 'gap-x-8');
  assert.deepEqual(getGridGapState(splitGapX), {
    mode: 'split',
    uniform: '',
    x: 'gap-x-8',
    y: 'gap-y-4',
  });

  const splitGapBoth = setGridAxisGap(splitGapX, 'y', 'gap-y-2');
  assert.deepEqual(getGridGapState(splitGapBoth), {
    mode: 'split',
    uniform: '',
    x: 'gap-x-8',
    y: 'gap-y-2',
  });

  const customGapCls = setGridUniformGap(
    splitGapBoth,
    formatCustomGapToToken('18px')
  );
  assert.deepEqual(getGridGapState(customGapCls), {
    mode: 'uniform',
    uniform: 'gap-[18px]',
    x: '',
    y: '',
  });

  // Auto-placement controls (flow, auto-cols, auto-rows, place-items, place-content)
  let autoCls = setGridAutoFlow(customGapCls, 'grid-flow-row-dense');
  autoCls = setGridAutoCols(autoCls, 'auto-cols-fr');
  autoCls = setGridAutoRows(autoCls, 'auto-rows-min');
  autoCls = setGridPlaceItems(`${autoCls} items-start`, 'place-items-center');
  autoCls = setGridPlaceContent(autoCls, 'place-content-between');

  assert.equal(getGridAutoFlow(autoCls), 'grid-flow-row-dense');
  assert.equal(getGridAutoCols(autoCls), 'auto-cols-fr');
  assert.equal(getGridAutoRows(autoCls), 'auto-rows-min');
  assert.equal(getGridPlaceItems(autoCls), 'place-items-center');
  assert.ok(!autoCls.split(/\s+/).includes('items-start'));
  assert.equal(getGridPlaceContent(autoCls), 'place-content-between');

  const summary = buildGridPreviewSummary(autoCls);
  assert.equal(summary.colsLabel, 'grid-cols-[200px_1fr_2fr]');
  assert.equal(summary.gapLabel, 'gap-[18px]');
  assert.equal(summary.flowLabel, 'row-dense');

  // Arbitrary CSS rules generation for custom user templates & gaps
  const css = buildArbitraryGridCssRules({
    ...INITIAL_NODES,
    grid1: {
      id: 'grid1',
      type: 'Grid',
      name: 'Custom Grid',
      parentId: 'root',
      props: { className: autoCls },
      children: [],
    },
  });
  assert.ok(css.includes('@layer utilities'));
  assert.ok(css.includes(':where(.grid-cols-'));
  assert.ok(css.includes('grid-template-columns: 200px 1fr 2fr;'));
  assert.ok(css.includes('gap: 18px;'));

  // Child span management & grid reset preserving padding/surface classes
  const childSpanCls = setGridChildSpan(
    setGridChildSpan('p-4 bg-white', 'col', 'col-span-2'),
    'row',
    'row-span-full'
  );
  assert.equal(getGridChildSpan(childSpanCls, 'col'), 'col-span-2');
  assert.equal(getGridChildSpan(childSpanCls, 'row'), 'row-span-full');

  const resetCls = resetGridLayoutClasses(autoCls);
  assert.equal(getGridColsToken(resetCls, ''), 'grid-cols-2');
  assert.equal(getGridGapState(resetCls).uniform, 'gap-4');
  assert.equal(getGridAutoFlow(resetCls), '');
  assert.ok(resetCls.includes('p-4'));
  assert.ok(resetCls.includes('bg-white'));
});

test('Theme Usage helpers extract used CSS variables, resolve ancestor overrides, and scope local overrides', async () => {
  const { DEFAULT_THEME_VARS } = await import('../constants/editorDefaults.ts');
  const {
    analyzeNodeThemeUsage,
    buildScopedThemeOverrideCssRules,
    clearAllNodeThemeOverridesInTree,
    setNodeThemeOverrideInTree,
  } = await import('./themeUsage.ts');
  const { buildThemeCssRules } = await import('./editorLogic.ts');
  const { generateHtmlExport } = await import('./exportFormats.ts');

  let tree: typeof INITIAL_NODES = {
    ...INITIAL_NODES,
    card_1: {
      id: 'card_1',
      type: 'Container',
      name: 'Karta Promo',
      parentId: 'root',
      props: {
        className: 'p-6 bg-[var(--color-surface)] border border-[var(--color-primary)]',
      },
      children: ['btn_1'],
    },
    btn_1: {
      id: 'btn_1',
      type: 'Button',
      name: 'Przycisk CTA',
      content: 'Kup teraz',
      parentId: 'card_1',
      props: {
        className:
          'px-4 py-2 bg-[var(--color-primary)] text-[length:var(--font-size-body)] text-white',
      },
      children: [],
    },
    root: {
      ...INITIAL_NODES.root,
      children: [...INITIAL_NODES.root.children, 'card_1'],
    },
  };

  // Analyze direct variable usage on btn_1 before any overrides
  const initialReport = analyzeNodeThemeUsage(tree.btn_1, tree, DEFAULT_THEME_VARS);
  assert.ok(initialReport);
  assert.equal(initialReport.usedCount, 2);
  assert.equal(initialReport.overriddenCount, 0);
  assert.deepEqual(
    initialReport.items.map((i) => i.varName),
    ['--color-primary', '--font-size-body']
  );
  assert.deepEqual(initialReport.items[0]?.channels, ['Bg']);
  assert.equal(initialReport.items[0]?.effectiveValue, '#2563eb');

  // Override --color-primary on parent container card_1 -> btn_1 inherits it
  tree = setNodeThemeOverrideInTree(tree, 'card_1', '--color-primary', '#059669');
  const inheritedReport = analyzeNodeThemeUsage(tree.btn_1, tree, DEFAULT_THEME_VARS);
  assert.ok(inheritedReport);
  assert.equal(inheritedReport.items[0]?.inheritedValue, '#059669');
  assert.equal(inheritedReport.items[0]?.effectiveValue, '#059669');
  assert.equal(inheritedReport.items[0]?.isLocallyOverridden, false);

  // Locally override --color-primary directly on btn_1 -> local wins over ancestor
  tree = setNodeThemeOverrideInTree(tree, 'btn_1', '--color-primary', '#e11d48');
  const localReport = analyzeNodeThemeUsage(tree.btn_1, tree, DEFAULT_THEME_VARS);
  assert.ok(localReport);
  assert.equal(localReport.overriddenCount, 1);
  assert.equal(localReport.items[0]?.localOverride, '#e11d48');
  assert.equal(localReport.items[0]?.effectiveValue, '#e11d48');
  assert.equal(localReport.items[0]?.isLocallyOverridden, true);

  // Scoped CSS rules emitted cleanly
  const scopedCss = buildScopedThemeOverrideCssRules(tree);
  assert.ok(scopedCss.includes('[data-node-id="btn_1"]'));
  assert.ok(scopedCss.includes('--color-primary: #e11d48;'));

  const combinedThemeCss = buildThemeCssRules(DEFAULT_THEME_VARS, tree);
  assert.ok(combinedThemeCss.includes(':root {'));
  assert.ok(combinedThemeCss.includes('[data-node-id="btn_1"]'));

  // Exported HTML preserves local overrides via data-theme-scope
  const exportedHtml = generateHtmlExport(tree, DEFAULT_THEME_VARS);
  assert.ok(exportedHtml.includes('data-theme-scope="btn_1"'));
  assert.ok(exportedHtml.includes('[data-theme-scope="btn_1"]'));

  // Clear local overrides on btn_1 restores clean node without themeOverrides
  tree = clearAllNodeThemeOverridesInTree(tree, 'btn_1');
  assert.equal(tree.btn_1.themeOverrides, undefined);
});

test('Sitemap generator builds hierarchical XML sitemap from component tree and SEO canonical URL', async () => {
  const {
    buildSitemapEntries,
    extractSitemapBaseOrigin,
    generateXmlSitemap,
    slugifySitemapSegment,
  } = await import('./sitemap.ts');

  assert.equal(extractSitemapBaseOrigin(''), 'https://example.com');
  assert.equal(
    extractSitemapBaseOrigin('https://studio.example.pl/app/'),
    'https://studio.example.pl'
  );
  assert.equal(slugifySitemapSegment('Cześć Świat & Łódź!'), 'czesc-swiat-lodz');

  const tree: typeof INITIAL_NODES = {
    ...INITIAL_NODES,
    pricing_sec: {
      id: 'pricing_sec',
      type: 'Container',
      name: 'Cennik',
      parentId: 'root',
      props: { className: 'p-8' },
      children: ['pricing_heading'],
    },
    pricing_heading: {
      id: 'pricing_heading',
      type: 'Heading',
      name: 'Plany cenowe',
      content: 'Plany cenowe',
      parentId: 'pricing_sec',
      props: { className: 'text-2xl' },
      children: [],
    },
    root: {
      ...INITIAL_NODES.root,
      children: [...INITIAL_NODES.root.children, 'pricing_sec'],
    },
  };

  const seo = {
    title: 'React UI Studio',
    description: 'Opis SEO',
    canonicalUrl: 'https://acme-ui.dev/landing',
  };

  const entries = buildSitemapEntries(tree, seo, {
    scope: 'sections',
    changefreq: 'daily',
    includeLastmod: true,
    lastmodDate: '2026-11-19',
  });

  assert.equal(entries[0]?.loc, 'https://acme-ui.dev/landing');
  assert.equal(entries[0]?.priority, '1.0');
  assert.ok(
    entries.some((e) => e.loc === 'https://acme-ui.dev/landing/plany-cenowe' && e.priority === '0.8'),
    'Expected section URL derived from container heading'
  );

  const { xml } = generateXmlSitemap(tree, seo, {
    scope: 'sections',
    changefreq: 'daily',
    includeLastmod: true,
    lastmodDate: '2026-11-19',
  });

  assert.ok(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>'));
  assert.ok(xml.includes('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'));
  assert.ok(xml.includes('<loc>https://acme-ui.dev/landing</loc>'));
  assert.ok(xml.includes('<lastmod>2026-11-19</lastmod>'));
  assert.ok(xml.includes('<changefreq>daily</changefreq>'));
  assert.ok(xml.includes('</urlset>'));
});

test('Design Lint scans subtree for hardcoded colors, spacing, and typography and Fix All normalizes tokens cleanly', async () => {
  const { DEFAULT_THEME_VARS } = await import('../constants/editorDefaults.ts');
  const {
    applyDesignLintFix,
    collectSubtreeNodeIds,
    fixAllDesignLintIssues,
    lintNodeTree,
  } = await import('./designLint.ts');

  const subtreeIds = collectSubtreeNodeIds(INITIAL_NODES, 'hero-1');
  assert.ok(subtreeIds.includes('hero-1'));
  assert.ok(subtreeIds.includes('btn-1'));
  assert.ok(!subtreeIds.includes('root'));

  // INITIAL_NODES has multiple hardcoded colors, spacing (py-2.5), and typography (text-3xl, text-base)
  const initialReport = lintNodeTree(INITIAL_NODES, 'root', DEFAULT_THEME_VARS);
  assert.ok(initialReport.issues.length >= 6);
  assert.ok(initialReport.countsByCategory.color > 0);
  assert.ok(initialReport.countsByCategory.spacing > 0);
  assert.ok(initialReport.countsByCategory.typography > 0);
  assert.ok(
    initialReport.issues.some((i) => i.nodeId === 'btn-1' && i.token === 'py-2.5' && i.replacement === 'py-2')
  );

  // Custom node with arbitrary hex color, arbitrary px spacing, arbitrary px font size, plus badge collision test
  const customTree: typeof INITIAL_NODES = {
    ...INITIAL_NODES,
    custom_box: {
      id: 'custom_box',
      type: 'Container',
      name: 'Karta Testowa',
      parentId: 'root',
      props: {
        className: 'p-[17px] bg-[#e11d48] text-slate-900 border-slate-200 text-[22px]',
      },
      children: ['custom_badge'],
    },
    custom_badge: {
      id: 'custom_badge',
      type: 'Badge',
      name: 'Plakietka',
      content: 'Nowość',
      parentId: 'custom_box',
      props: {
        className: 'bg-blue-100 text-blue-700 px-3 py-1',
      },
      children: [],
    },
    root: {
      ...INITIAL_NODES.root,
      children: [...INITIAL_NODES.root.children, 'custom_box'],
    },
  };

  const customReport = lintNodeTree(customTree, 'custom_box', DEFAULT_THEME_VARS);
  assert.equal(customReport.scannedNodeCount, 2);

  const spacingIssue = customReport.issues.find(
    (i) => i.nodeId === 'custom_box' && i.token === 'p-[17px]'
  );
  assert.equal(spacingIssue?.replacement, 'p-4');

  const sizeIssue = customReport.issues.find(
    (i) => i.nodeId === 'custom_box' && i.token === 'text-[22px]'
  );
  assert.equal(sizeIssue?.replacement, 'text-[length:var(--font-size-body)]');

  // Verify badge bg-blue-100 and text-blue-700 do not collide onto the exact same variable
  const badgeBg = customReport.issues.find(
    (i) => i.nodeId === 'custom_badge' && i.token === 'bg-blue-100'
  );
  const badgeText = customReport.issues.find(
    (i) => i.nodeId === 'custom_badge' && i.token === 'text-blue-700'
  );
  assert.ok(badgeBg?.replacement);
  assert.ok(badgeText?.replacement);
  assert.notEqual(
    badgeBg.replacement.replace('bg-', ''),
    badgeText.replacement.replace('text-', '')
  );

  // Single-issue fix updates only target token
  const afterSingle = applyDesignLintFix(customTree, spacingIssue!);
  assert.ok(afterSingle.custom_box.props.className?.includes('p-4'));
  assert.ok(!afterSingle.custom_box.props.className?.includes('p-[17px]'));
  assert.ok(afterSingle.custom_box.props.className?.includes('bg-[#e11d48]'));

  // Fix All resolves all fixable issues across subtree and leaves 0 fixable issues
  const { nodes: fixedTree, fixedCount } = fixAllDesignLintIssues(
    customTree,
    'custom_box',
    DEFAULT_THEME_VARS
  );
  assert.ok(fixedCount >= 6);
  assert.ok(fixedTree.custom_box.props.className?.includes('p-4'));
  assert.ok(fixedTree.custom_box.props.className?.includes('bg-[var('));
  assert.ok(fixedTree.custom_box.props.className?.includes('text-[var('));
  assert.ok(fixedTree.custom_box.props.className?.includes('border-[var('));
  assert.ok(fixedTree.custom_box.props.className?.includes('text-[length:var('));
  const boxBgVar = fixedTree.custom_box.props.className?.match(/bg-\[var\((--[^)]+)\)\]/)?.[1];
  const boxTextVar = fixedTree.custom_box.props.className?.match(/text-\[var\((--[^)]+)\)\]/)?.[1];
  assert.ok(boxBgVar && boxTextVar && boxBgVar !== boxTextVar);

  const postFixReport = lintNodeTree(fixedTree, 'custom_box', DEFAULT_THEME_VARS);
  assert.equal(postFixReport.fixableCount, 0);
  assert.equal(postFixReport.issues.length, 0);
});

test('Canvas ruler math generates zoomed ticks, computes selection bands, and converts client coords', async () => {
  const {
    clientCoordToCanvasPx,
    computeAxisSelectionBand,
    generateRulerTicks,
    getRulerIntervals,
  } = await import('./rulers.ts');

  assert.deepEqual(getRulerIntervals(1), { major: 100, medium: 50, minor: 10 });
  assert.deepEqual(getRulerIntervals(0.75), { major: 100, medium: 50, minor: 25 });
  assert.deepEqual(getRulerIntervals(1.5), { major: 100, medium: 50, minor: 10 });

  const ticksAt1x = generateRulerTicks(0, 120, 1);
  const tick0 = ticksAt1x.find((t) => t.canvasPx === 0);
  const tick50 = ticksAt1x.find((t) => t.canvasPx === 50);
  const tick10 = ticksAt1x.find((t) => t.canvasPx === 10);
  const tick100 = ticksAt1x.find((t) => t.canvasPx === 100);

  assert.equal(tick0?.kind, 'major');
  assert.equal(tick0?.label, '0');
  assert.equal(tick0?.screenOffsetPx, 0);
  assert.equal(tick50?.kind, 'medium');
  assert.equal(tick50?.label, undefined);
  assert.equal(tick10?.kind, 'minor');
  assert.equal(tick100?.kind, 'major');
  assert.equal(tick100?.label, '100');
  assert.equal(tick100?.screenOffsetPx, 100);

  const ticksAt150 = generateRulerTicks(0, 100, 1.5);
  assert.equal(ticksAt150.find((t) => t.canvasPx === 100)?.screenOffsetPx, 150);

  assert.equal(computeAxisSelectionBand(100, 0, 80, 1), null);
  const band = computeAxisSelectionBand(250, 300, 100, 1.5);
  assert.deepEqual(band, {
    canvasStartPx: 100,
    canvasSizePx: 200,
    screenStartPx: 150,
    screenSizePx: 300,
  });

  assert.equal(clientCoordToCanvasPx(250, 100, 1.5), 100);
  assert.equal(clientCoordToCanvasPx(80, 100, 1), -20);
});

test('removeRecentComponentSearch and normalizeRecentSearchesStorage manage persisted search history cleanly', async () => {
  const {
    normalizeRecentSearchesStorage,
    removeRecentComponentSearch,
  } = await import('./editorLogic.ts');

  const sample = [
    { type: 'Grid' as const, label: 'Grid', query: 'grid', timestamp: 100 },
    { type: 'Button' as const, label: 'Przycisk', query: 'przycisk', timestamp: 90 },
  ];

  const afterRemove = removeRecentComponentSearch(sample, 'Grid', '  GRID ');
  assert.equal(afterRemove.length, 1);
  assert.equal(afterRemove[0]?.type, 'Button');

  assert.deepEqual(normalizeRecentSearchesStorage('invalid-json-shape'), []);

  const normalized = normalizeRecentSearchesStorage(
    [
      null,
      { type: 'Grid', label: 'Grid', query: '   ', timestamp: 10 },
      { type: 'Grid', label: 'Grid', query: '  siatka ', timestamp: 200 },
      { type: 'Grid', label: 'Grid', query: 'duplicate-type', timestamp: 210 },
      { type: 'Button', label: 'Przycisk', query: 'cta' },
      { type: 'Text', label: 'Tekst', query: 'akapit', timestamp: 300 },
    ],
    2
  );

  assert.equal(normalized.length, 2);
  assert.equal(normalized[0]?.type, 'Grid');
  assert.equal(normalized[0]?.query, 'siatka');
  assert.equal(normalized[0]?.timestamp, 200);
  assert.equal(normalized[1]?.type, 'Button');
  assert.equal(normalized[1]?.query, 'cta');
  assert.equal(typeof normalized[1]?.timestamp, 'number');
});

test('duplicateNodeInTree appends incrementing Copy 1 / Copy 2 suffixes and avoids nested Copy chains', async () => {
  const {
    duplicateNodeInTree,
    getNextDuplicateNodeName,
    insertCardPresetAtTarget,
    insertNewNodeAtTarget,
  } = await import('./editorLogic.ts');

  let seq = 0;
  const idFactory = () => `dup_${++seq}`;

  // Start with a node explicitly named 'Button'
  let tree: typeof INITIAL_NODES = {
    ...INITIAL_NODES,
    btn_plain: {
      id: 'btn_plain',
      type: 'Button',
      name: 'Button',
      content: 'Click',
      parentId: 'hero-1',
      props: { className: 'px-4 py-2' },
      children: [],
    },
    'hero-1': {
      ...INITIAL_NODES['hero-1'],
      children: [...INITIAL_NODES['hero-1'].children, 'btn_plain'],
    },
  };

  // First duplicate of 'Button' -> 'Button Copy 1'
  const firstDup = duplicateNodeInTree(tree, 'btn_plain', idFactory);
  assert.ok(firstDup.createdId);
  assert.equal(firstDup.nodes[firstDup.createdId]?.name, 'Button Copy 1');
  tree = firstDup.nodes;

  // Second duplicate of 'Button' -> 'Button Copy 2'
  const secondDup = duplicateNodeInTree(tree, 'btn_plain', idFactory);
  assert.ok(secondDup.createdId);
  assert.equal(secondDup.nodes[secondDup.createdId]?.name, 'Button Copy 2');
  tree = secondDup.nodes;

  // Duplicating 'Button Copy 1' -> 'Button Copy 3' (strips Copy 1 base, picks next free index)
  const cloneOfCopy = duplicateNodeInTree(tree, firstDup.createdId, idFactory);
  assert.ok(cloneOfCopy.createdId);
  assert.equal(cloneOfCopy.nodes[cloneOfCopy.createdId]?.name, 'Button Copy 3');

  // Empty name helper fallback
  assert.equal(getNextDuplicateNodeName('', new Set()), 'Element Copy 1');

  // Empty root canvas drop helpers insert basic components & card preset cleanly
  const emptyTree: typeof INITIAL_NODES = {
    root: {
      ...INITIAL_NODES.root,
      children: [],
    },
  };
  const droppedBtn = insertNewNodeAtTarget(emptyTree, 'Button', 'root', 'inside', idFactory);
  assert.ok(droppedBtn.createdId);
  assert.deepEqual(droppedBtn.nodes.root.children, [droppedBtn.createdId]);

  const droppedCard = insertCardPresetAtTarget(droppedBtn.nodes, droppedBtn.createdId, 'before', idFactory);
  assert.ok(droppedCard.createdId);
  assert.deepEqual(droppedCard.nodes.root.children, [droppedCard.createdId, droppedBtn.createdId]);
});

test('generateReactJSX supports pretty and minified formats with SEO and icons', async () => {
  const { addIconNodeToTree, generateReactJSX } = await import('./editorLogic.ts');

  const withIcon = addIconNodeToTree(INITIAL_NODES, 'hero-1', 'Rocket', () => 'icon_1');
  const seo = {
    title: 'Landing Page',
    description: 'Fast builder',
    canonicalUrl: 'https://example.com',
  };

  const pretty = generateReactJSX(withIcon.nodes, seo, 'pretty');
  const minified = generateReactJSX(withIcon.nodes, seo, 'minified');

  assert.ok(pretty.includes('\n'));
  assert.ok(pretty.includes("import { Rocket } from 'lucide-react';"));
  assert.ok(pretty.includes('<title>Landing Page</title>'));

  assert.equal(minified.includes('\n'), false);
  assert.ok(minified.startsWith("import React from'react';import{Rocket}from'lucide-react';export default function GeneratedUI(){return(<>"));
  assert.ok(minified.includes('<title>Landing Page</title>'));
  assert.ok(minified.includes('<Rocket className='));
  assert.ok(minified.endsWith('</>);}'));

  const minifiedNoSeo = generateReactJSX(INITIAL_NODES, undefined, 'minified');
  assert.equal(minifiedNoSeo.includes('\n'), false);
  assert.ok(minifiedNoSeo.startsWith("import React from'react';export default function GeneratedUI(){return(<div"));
});

test('toggleNodeVisibilityInTree and isNodeHiddenInTree hide a node and all its descendants without deleting', async () => {
  const { isNodeHiddenInTree, toggleNodeVisibilityInTree } = await import('./editorLogic.ts');

  assert.equal(isNodeHiddenInTree(INITIAL_NODES, 'hero-1'), false);
  assert.equal(isNodeHiddenInTree(INITIAL_NODES, 'heading-1'), false);

  // Root cannot be hidden
  const rootAttempt = toggleNodeVisibilityInTree(INITIAL_NODES, 'root');
  assert.equal(rootAttempt, INITIAL_NODES);

  // Hide hero-1 -> hero-1 and all its descendants become effectively hidden, but remain in tree
  const hiddenHero = toggleNodeVisibilityInTree(INITIAL_NODES, 'hero-1');
  assert.equal(hiddenHero['hero-1'].hidden, true);
  assert.equal(isNodeHiddenInTree(hiddenHero, 'hero-1'), true);
  assert.equal(isNodeHiddenInTree(hiddenHero, 'badge-1'), true);
  assert.equal(isNodeHiddenInTree(hiddenHero, 'heading-1'), true);
  assert.equal(isNodeHiddenInTree(hiddenHero, 'btn-1'), true);
  assert.equal(isNodeHiddenInTree(hiddenHero, 'root'), false);
  assert.ok(hiddenHero['hero-1'].children.includes('heading-1'));

  // Unhide hero-1 -> node and descendants become visible again
  const restoredHero = toggleNodeVisibilityInTree(hiddenHero, 'hero-1');
  assert.equal(restoredHero['hero-1'].hidden, undefined);
  assert.equal(isNodeHiddenInTree(restoredHero, 'hero-1'), false);
  assert.equal(isNodeHiddenInTree(restoredHero, 'heading-1'), false);
});

test('autoSave controller persists tree state on 5000ms intervals and flush()', async () => {
  const {
    AUTO_SAVE_INTERVAL_MS,
    createAutoSaveController,
    persistTreeState,
  } = await import('./autoSave.ts');

  assert.equal(AUTO_SAVE_INTERVAL_MS, 5000);

  const memStore = new Map<string, string>();
  const mockStorage = {
    getItem: (key: string) => memStore.get(key) ?? null,
    setItem: (key: string, val: string) => {
      memStore.set(key, val);
    },
  };

  let currentNodes = INITIAL_NODES;
  let scheduledCallback: (() => void) | null = null;
  let clearedId: number | null = null;

  const controller = createAutoSaveController({
    getNodes: () => currentNodes,
    storage: mockStorage,
    storageKey: 'test_tree_key',
    setIntervalFn: (fn, ms) => {
      assert.equal(ms, 5000);
      scheduledCallback = fn;
      return 42;
    },
    clearIntervalFn: (id) => {
      clearedId = id;
    },
  });

  controller.start();
  if (!scheduledCallback) {
    assert.fail('Expected interval callback to be registered');
  }
  assert.equal(memStore.get('test_tree_key'), undefined);

  // Trigger 5-second interval tick
  (scheduledCallback as () => void)();
  const saved1 = JSON.parse(memStore.get('test_tree_key') || '{}');
  assert.equal(saved1.root?.name, 'Root Canvas');

  // Modify state and flush immediately (simulating beforeunload / tab close)
  currentNodes = {
    ...INITIAL_NODES,
    root: { ...INITIAL_NODES.root, name: 'Updated Before Unload' },
  };
  assert.equal(controller.flush(), true);
  const saved2 = JSON.parse(memStore.get('test_tree_key') || '{}');
  assert.equal(saved2.root?.name, 'Updated Before Unload');

  controller.stop();
  assert.equal(clearedId, 42);

  // Error resilience if storage throws quota error
  const failingStorage = {
    getItem: () => null,
    setItem: () => {
      throw new Error('QuotaExceededError');
    },
  };
  assert.equal(persistTreeState(failingStorage, 'k', INITIAL_NODES), null);
});

test('responsivePreview calculates column counts, clamped scales, and valid CSS rules', async () => {
  const {
    RESPONSIVE_PREVIEW_VIEWPORTS,
    buildResponsivePreviewCss,
    computeViewportFrameScale,
    getResponsivePreviewColumns,
  } = await import('./responsivePreview.ts');

  assert.deepEqual(
    RESPONSIVE_PREVIEW_VIEWPORTS.map((v) => v.id),
    ['mobile', 'tablet', 'desktop']
  );

  assert.equal(getResponsivePreviewColumns(1200), 3);
  assert.equal(getResponsivePreviewColumns(710), 3);
  assert.equal(getResponsivePreviewColumns(540), 2);
  assert.equal(getResponsivePreviewColumns(380), 1);

  assert.equal(computeViewportFrameScale(500, 375), 1);
  assert.equal(computeViewportFrameScale(384, 768), 0.5);
  assert.equal(computeViewportFrameScale(50, 1024), 0.2);

  const css = buildResponsivePreviewCss([
    { id: 'mobile', widthPx: 375, scale: 1, contentHeightPx: 500 },
    { id: 'tablet', widthPx: 768, scale: 0.5, contentHeightPx: 600 },
  ]);
  assert.ok(css.includes('.rp-wrap-mobile { width: 375px; height: 500px; }'));
  assert.ok(css.includes('.rp-frame-tablet { width: 768px; transform: scale(0.5); transform-origin: top left; }'));
});

test('themePalette sanitizes hex/token names and merges generated colors while preserving fontSize variables', async () => {
  const { DEFAULT_THEME_VARS } = await import('../constants/editorDefaults.ts');
  const {
    mergeGeneratedPaletteIntoThemeVars,
    normalizeHexColor,
    normalizeThemeColorVarName,
    sanitizeGeneratedColors,
  } = await import('./themePalette.ts');

  assert.equal(normalizeHexColor('#Ab3'), '#aabb33');
  assert.equal(normalizeHexColor('#D97706'), '#d97706');
  assert.equal(normalizeHexColor('rgb(0,0,0)'), null);
  assert.equal(normalizeThemeColorVarName('var(color-primary)'), '--color-primary');
  assert.equal(normalizeThemeColorVarName(' Accent Glow! '), '--accent-glow');

  const sanitized = sanitizeGeneratedColors([
    { name: '--color-primary', label: 'Primary', value: '#D97706' },
    { name: 'var(--color-primary)', label: 'Dup', value: '#000000' },
    { name: '--color-surface', label: 'Surface', value: '#FFFBEB' },
    { name: '--bad-color', label: 'Bad', value: 'not-hex' },
    { name: 'color-accent', label: 'Accent', value: '#92400e' },
  ]);

  assert.equal(sanitized.length, 3);
  assert.deepEqual(
    sanitized.map((c) => [c.name, c.value]),
    [
      ['--color-primary', '#d97706'],
      ['--color-surface', '#fffbeb'],
      ['--color-accent', '#92400e'],
    ]
  );

  let seq = 0;
  const merged = mergeGeneratedPaletteIntoThemeVars(
    DEFAULT_THEME_VARS,
    sanitized,
    () => `gen_${++seq}`
  );

  const primary = merged.find((v) => v.name === '--color-primary');
  const secondary = merged.find((v) => v.name === '--color-secondary');
  const surface = merged.find((v) => v.name === '--color-surface');
  const fontSize = merged.find((v) => v.category === 'fontSize');
  const accent = merged.find((v) => v.name === '--color-accent');

  assert.equal(primary?.value, '#d97706');
  assert.equal(secondary?.value, DEFAULT_THEME_VARS.find((v) => v.name === '--color-secondary')?.value);
  assert.equal(surface?.value, '#fffbeb');
  assert.equal(fontSize?.value, DEFAULT_THEME_VARS.find((v) => v.category === 'fontSize')?.value);
  assert.equal(accent?.id, 'gen_1');
  assert.equal(accent?.category, 'color');
  assert.equal(accent?.value, '#92400e');
});

test('nodeComments and layerSearch manage persistent node notes and rank matching layers cleanly', async () => {
  const {
    addNodeCommentInTree,
    deleteNodeCommentInTree,
    getNodeComments,
  } = await import('./nodeComments.ts');
  const { searchNodesByName } = await import('./layerSearch.ts');

  // Empty comment ignored cleanly
  const unchanged = addNodeCommentInTree(INITIAL_NODES, 'btn-1', '   ');
  assert.equal(unchanged, INITIAL_NODES);

  // Add comment to btn-1
  const withComment1 = addNodeCommentInTree(
    INITIAL_NODES,
    'btn-1',
    '  Sprawdzić kontrast CTA  ',
    () => 'c_1',
    1000
  );
  const btnComments = getNodeComments(withComment1['btn-1']);
  assert.equal(btnComments.length, 1);
  assert.deepEqual(btnComments[0], {
    id: 'c_1',
    text: 'Sprawdzić kontrast CTA',
    createdAt: 1000,
  });

  // Add second comment, then delete first
  const withComment2 = addNodeCommentInTree(
    withComment1,
    'btn-1',
    'Dodać hover transition',
    () => 'c_2',
    2000
  );
  assert.equal(getNodeComments(withComment2['btn-1']).length, 2);

  const afterDelete = deleteNodeCommentInTree(withComment2, 'btn-1', 'c_1');
  assert.deepEqual(
    getNodeComments(afterDelete['btn-1']).map((c) => c.id),
    ['c_2']
  );

  // Deleting last comment clears node.comments cleanly
  const afterDeleteAll = deleteNodeCommentInTree(afterDelete, 'btn-1', 'c_2');
  assert.equal(afterDeleteAll['btn-1'].comments, undefined);

  // layerSearch finds components by name case-insensitively and preserves comment counts & ancestor paths
  const matchesAll = searchNodesByName(withComment2, '');
  assert.equal(matchesAll.length, 6);

  const ctaMatches = searchNodesByName(withComment2, 'cta');
  assert.equal(ctaMatches.length, 1);
  assert.equal(ctaMatches[0]?.id, 'btn-1');
  assert.equal(ctaMatches[0]?.commentCount, 2);
  assert.equal(ctaMatches[0]?.pathLabel, 'Root Canvas › Hero Section');

  const noMatches = searchNodesByName(withComment2, 'nieistniejący');
  assert.equal(noMatches.length, 0);
});

test('cssEditor supports Tailwind v3/v4 catalogs, syntax tokenization, validation, and autocomplete', async () => {
  const {
    buildElementCustomStyleCssRules,
    getClassAutocompleteSuggestions,
    getDeclarationAutocompleteSuggestions,
    getTailwindClassCatalog,
    setNodeCustomStyleCssInTree,
    tokenizeCssForHighlight,
    validateRawCssAgainstTailwind,
  } = await import('./cssEditor.ts');

  const v3Classes = getTailwindClassCatalog('v3').map((c) => c.className);
  const v4Classes = getTailwindClassCatalog('v4').map((c) => c.className);
  assert.ok(v3Classes.includes('shadow-sm'));
  assert.ok(!v3Classes.includes('shadow-xs'));
  assert.ok(v4Classes.includes('shadow-xs'));
  assert.ok(v4Classes.includes('ring-3'));

  const tokens = tokenizeCssForHighlight(
    'background-color: var(--color-primary); border-radius: 12px; /* note */'
  );
  assert.ok(tokens.some((t) => t.kind === 'property' && t.text === 'background-color'));
  assert.ok(tokens.some((t) => t.kind === 'var' && t.text === 'var(--color-primary)'));
  assert.ok(tokens.some((t) => t.kind === 'number' && t.text === '12px'));
  assert.ok(tokens.some((t) => t.kind === 'comment'));

  const report = validateRawCssAgainstTailwind(
    'padding: 16px;\nbadline',
    'p-6 text-slate-900',
    'v4'
  );
  assert.equal(report.syntaxErrorCount, 1);
  assert.equal(report.conflictCount, 1);
  assert.equal(report.equivalentCount, 1);
  assert.equal(report.issues.find((i) => i.tailwindEquivalent)?.tailwindEquivalent, 'p-4');

  const classSugs = getClassAutocompleteSuggestions(
    'btn',
    'v4',
    { themeClasses: ['btn-theme'], stylesheetClasses: [] },
    12,
    '5.2.3'
  );
  assert.ok(classSugs.some((s) => s.label === 'btn-theme'));
  assert.ok(classSugs.some((s) => s.badge === 'BS v5'));

  const declSugs = getDeclarationAutocompleteSuggestions(
    'color: var',
    'v4',
    [{ name: '--color-primary', value: '#2563eb', source: 'theme' }],
    8
  );
  assert.ok(declSugs.some((s) => s.label === 'var(--color-primary)'));

  const withCss = setNodeCustomStyleCssInTree(
    INITIAL_NODES,
    'btn-1',
    'border-radius: 14px;'
  );
  const rules = buildElementCustomStyleCssRules(withCss);
  assert.ok(rules.includes('[data-node-id="btn-1"]'));
  assert.ok(rules.includes('border-radius: 14px;'));
});

test('bootstrapSupport switches v4 (4.6.2) vs v5 (5.2.3) assets, components, classes, and plain HTML output cleanly', async () => {
  const {
    buildBootstrapPlainHtmlDocument,
    getBootstrapAssets,
    getBootstrapClassesForVersion,
    getBootstrapComponentsForVersion,
  } = await import('./bootstrapSupport.ts');
  const { DEFAULT_THEME_VARS } = await import('../constants/editorDefaults.ts');

  const assetsV4 = getBootstrapAssets('4.6.2');
  const assetsV5 = getBootstrapAssets('5.2.3');
  assert.ok(assetsV4.cssUrl.includes('bootstrap@4.6.2'));
  assert.equal(assetsV4.scriptUrls.length, 2);
  assert.ok(assetsV4.scriptUrls[0].includes('jquery'));
  assert.ok(assetsV5.cssUrl.includes('bootstrap@5.2.3'));
  assert.equal(assetsV5.scriptUrls.length, 1);

  const compsV4 = getBootstrapComponentsForVersion('4.6.2', 'Components');
  const compsV5 = getBootstrapComponentsForVersion('5.2.3', 'Forms');
  assert.ok(compsV4.some((c) => c.html.includes('data-dismiss="alert"')));
  assert.ok(compsV5.some((c) => c.html.includes('form-floating')));

  const helpersV5 = getBootstrapClassesForVersion('5.2.3', '', 'Helpers');
  assert.ok(helpersV5.some((c) => c.className === 'visually-hidden'));

  const htmlDoc = buildBootstrapPlainHtmlDocument({
    nodes: INITIAL_NODES,
    themeVars: DEFAULT_THEME_VARS,
    sharedThemeCss: '.demo { color: red; }',
    bootstrapVersion: '4.6.2',
  });
  assert.ok(htmlDoc.includes('bootstrap@4.6.2'));
  assert.ok(!htmlDoc.includes('bootstrap@5.2.3'));
});

test('materialSupport supports MUI v9 + optional MD2/MD3, excludes generated hashes, and conditionally loads plain HTML deps', async () => {
  const {
    buildConditionalPlainHtmlDocument,
    detectUsedLibrariesInTree,
    filterMaterialComponents,
    filterMaterialStyleEntries,
    generateMuiReactJsxExport,
  } = await import('./materialSupport.ts');
  const { DEFAULT_THEME_VARS } = await import('../constants/editorDefaults.ts');

  const onlyMui = filterMaterialComponents({
    sourceFilter: 'all',
    enableMd2: false,
    enableMd3: false,
  });
  assert.ok(onlyMui.every((c) => c.source === 'mui-v9'));
  assert.ok(onlyMui.some((c) => c.componentTag === 'NumberField'));
  assert.ok(onlyMui.some((c) => c.componentTag === 'Menubar'));

  const withMd2And3 = filterMaterialComponents({
    sourceFilter: 'all',
    enableMd2: true,
    enableMd3: true,
  });
  assert.ok(withMd2And3.some((c) => c.source === 'md2'));
  assert.ok(withMd2And3.some((c) => c.source === 'md3'));

  const styles = filterMaterialStyleEntries({
    enableMd2: true,
    enableMd3: true,
  });
  assert.ok(styles.every((s) => !/\.css-[a-z0-9]+/i.test(s.name)));
  assert.ok(styles.some((s) => s.name === '.MuiButton-root'));
  assert.ok(styles.some((s) => s.name === 'mdc-button'));
  assert.ok(styles.some((s) => s.name === '--md-filled-button-container-color'));

  const treeWithMd3: typeof INITIAL_NODES = {
    ...INITIAL_NODES,
    root: {
      ...INITIAL_NODES.root,
      children: ['md3-btn', 'mui-btn'],
    },
    'md3-btn': {
      id: 'md3-btn',
      type: 'Button',
      name: 'MD3',
      content: 'Click',
      parentId: 'root',
      props: { className: '' },
      sourceLibrary: 'md3',
      materialMeta: { mdCustomTag: 'md-filled-button' },
      children: [],
    },
    'mui-btn': {
      id: 'mui-btn',
      type: 'Button',
      name: 'MUI',
      content: 'Save',
      parentId: 'root',
      props: { className: '' },
      sourceLibrary: 'mui-v9',
      materialMeta: {
        componentTag: 'Button',
        muiProps: { variant: 'contained', color: 'primary' },
        slotOverrides: { '.MuiButton-startIcon': 'marginRight: 8px;' },
      },
      children: [],
    },
  };

  const detected = detectUsedLibrariesInTree(treeWithMd3);
  assert.equal(detected.usesMuiV9, true);
  assert.equal(detected.usesMd2, false);
  assert.equal(detected.usesMd3, true);
  assert.ok(detected.md3Modules.includes('@material/web/button/filled-button.js'));

  const html = buildConditionalPlainHtmlDocument({
    nodes: treeWithMd3,
    themeVars: DEFAULT_THEME_VARS,
    sharedThemeCss: '',
  });
  assert.ok(html.includes('data-material-library="md3"'));
  assert.ok(!html.includes('data-material-library="md2"'));
  assert.ok(html.includes('<md-filled-button'));

  const jsx = generateMuiReactJsxExport(treeWithMd3, DEFAULT_THEME_VARS, true);
  assert.ok(jsx.includes("from '@mui/material'"));
  assert.ok(jsx.includes('<Button variant="contained" color="primary"'));
  assert.ok(jsx.includes('.MuiButton-startIcon'));
});

test('webpageImporter reconstructs HTML structure and inserts informative placeholders for missing logos, images, and JS widgets', async () => {
  const { parseHtmlToWebpageBlueprint } = await import('./webpageImporter.ts');

  const sampleHtml = `<!DOCTYPE html>
  <html>
    <head>
      <title>Acme Studio</title>
      <meta name="description" content="Sample design page" />
      <style>.hero { color: #2563eb; background: #f8fafc; }</style>
    </head>
    <body>
      <header>
        <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/></svg>
        <a href="/pricing">Pricing</a>
      </header>
      <main>
        <h1>Build faster UI</h1>
        <p>Visual builder with automatic placeholders.</p>
        <img src="/hero.png" alt="Hero preview" />
        <img alt="Missing banner" />
        <video src="/demo.mp4"></video>
        <div id="chart-root" class="chart-widget"></div>
      </main>
    </body>
  </html>`;

  const result = parseHtmlToWebpageBlueprint(sampleHtml, 'https://acme.example.com');
  assert.equal(result.title, 'Acme Studio');
  assert.equal(result.description, 'Sample design page');
  assert.ok(result.detectedThemeColors.includes('#2563eb'));
  assert.ok(result.stats.headings >= 1);
  assert.ok(result.stats.images >= 1);
  assert.ok(result.placeholders.length >= 3);
  assert.ok(result.placeholders.some((p) => p.kind === 'logo'));
  assert.ok(result.placeholders.some((p) => p.kind === 'image'));
  assert.ok(
    result.placeholders.some((p) => p.kind === 'media' || p.kind === 'widget')
  );
  assert.ok((result.blueprint.children || []).length >= 2);
});

test('projectStorage saves, updates, renames, deletes, and serializes/parses project files cleanly', async () => {
  const {
    buildProjectFileName,
    deleteSavedProject,
    parseImportedProjectJson,
    renameSavedProject,
    serializeProjectToFileContent,
    upsertSavedProject,
  } = await import('./projectStorage.ts');

  const { DEFAULT_THEME_VARS } = await import('../constants/editorDefaults.ts');
  const baseInput = {
    name: 'Portfolio  Landing ',
    description: 'Clean studio hero',
    nodes: INITIAL_NODES,
    themeVars: DEFAULT_THEME_VARS,
    seoMeta: { title: 'Portfolio', description: 'Hero', canonicalUrl: '' },
    sharedThemeCss: '.demo { color: red; }',
    tailwindVersion: 'v4' as const,
    bootstrapVersion: '5.2.3' as const,
    enableMd2: true,
    enableMd3: false,
    now: 1700000000000,
  };

  const firstSave = upsertSavedProject([], baseInput);
  assert.equal(firstSave.projects.length, 1);
  assert.equal(firstSave.saved.name, 'Portfolio Landing');
  assert.equal(firstSave.saved.nodeCount, Object.keys(INITIAL_NODES).length);

  // Overwrite existing project keeps createdAt & id, updates updatedAt & content
  const updatedSave = upsertSavedProject(firstSave.projects, {
    ...baseInput,
    id: firstSave.saved.id,
    name: 'Portfolio v2',
    enableMd3: true,
    now: 1700000005000,
  });
  assert.equal(updatedSave.projects.length, 1);
  assert.equal(updatedSave.saved.id, firstSave.saved.id);
  assert.equal(updatedSave.saved.createdAt, 1700000000000);
  assert.equal(updatedSave.saved.updatedAt, 1700000005000);
  assert.equal(updatedSave.saved.enableMd3, true);

  // Save as new adds second record
  const secondSave = upsertSavedProject(updatedSave.projects, {
    ...baseInput,
    id: null,
    name: 'SaaS Pricing',
    now: 1700000010000,
  });
  assert.equal(secondSave.projects.length, 2);

  // Rename & delete
  const renamed = renameSavedProject(
    secondSave.projects,
    firstSave.saved.id,
    'Portfolio Final',
    1700000015000
  );
  assert.equal(
    renamed.find((p) => p.id === firstSave.saved.id)?.name,
    'Portfolio Final'
  );
  const afterDelete = deleteSavedProject(renamed, secondSave.saved.id);
  assert.equal(afterDelete.length, 1);

  // Serialize -> Parse round-trip
  const serialized = serializeProjectToFileContent(afterDelete[0]);
  const parsed = parseImportedProjectJson(serialized);
  assert.ok(parsed);
  assert.equal(parsed?.name, 'Portfolio Final');
  assert.equal(parsed?.sharedThemeCss, '.demo { color: red; }');
  assert.equal(parsed?.enableMd2, true);
  assert.equal(buildProjectFileName('Łódź Studio v2!'), 'lodz-studio-v2.ui-project.json');
  assert.equal(parseImportedProjectJson('{"bad": true}'), null);
});


