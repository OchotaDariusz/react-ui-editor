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





