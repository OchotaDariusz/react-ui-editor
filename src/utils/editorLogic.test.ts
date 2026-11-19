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

test('duplicateNodeInTree deep-clones containers and inserts right after original', () => {
  const nextId = makeIdFactory();
  const res = duplicateNodeInTree(INITIAL_NODES, 'hero-1', nextId);
  assert.equal(res.createdId, 'test_1');
  const clonedHero = res.nodes['test_1'];
  assert.ok(clonedHero);
  assert.equal(clonedHero.name, 'Hero Section (kopia)');
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


