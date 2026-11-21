import type {
  BootstrapVersion,
  NodesMap,
  ThemeVariable,
  TailwindVersion,
} from '../types/editor';
import { BOOTSTRAP_CLASSES_BY_VERSION } from './bootstrapSupport';

export const TAILWIND_VERSION_STORAGE_KEY =
  'react_ui_editor_tailwind_version_v1';
export const THEME_SHARED_CSS_STORAGE_KEY =
  'react_ui_editor_theme_shared_css_v1';

export const DEFAULT_SHARED_THEME_CSS = `.ui-surface-card {
  background-color: var(--color-surface);
  border-radius: 1rem;
  border: 1px solid #e2e8f0;
}
.ui-accent-btn {
  background-color: var(--color-primary);
  color: #ffffff;
  border-radius: 0.5rem;
}`;

export interface ClassCatalogEntry {
  className: string;
  category: 'layout' | 'spacing' | 'typography' | 'surface' | 'effects' | 'ui';
  source: 'tailwind' | 'stylesheet' | 'theme';
  description: string;
  minVersion?: TailwindVersion;
  onlyVersion?: TailwindVersion;
}

export interface DiscoveredStylesheetInfo {
  stylesheetCount: number;
  tailwindDetected: boolean;
  stylesheetClasses: string[];
  themeClasses: string[];
  cssVariables: Array<{ name: string; value: string; source: 'theme' | 'stylesheet' }>;
}

export interface CssTokenSpan {
  text: string;
  kind:
    | 'comment'
    | 'property'
    | 'var'
    | 'color'
    | 'number'
    | 'selector'
    | 'punctuation'
    | 'plain';
}

export interface CssValidationIssue {
  id: string;
  severity: 'error' | 'warning' | 'info';
  message: string;
  property?: string;
  tailwindEquivalent?: string;
  conflictingClass?: string;
}

export interface CssValidationReport {
  issues: CssValidationIssue[];
  syntaxErrorCount: number;
  equivalentCount: number;
  conflictCount: number;
  parsedDeclarations: Record<string, string>;
}

export interface CssPropertySuggestion {
  property: string;
  description: string;
  sampleValues: string[];
}

export interface CssAutocompleteItem {
  label: string;
  insertText: string;
  detail: string;
  badge: string;
  kind: 'class' | 'property' | 'value' | 'variable';
}

const SHARED_TAILWIND_CLASSES: ClassCatalogEntry[] = [
  {
    className: 'flex',
    category: 'layout',
    source: 'tailwind',
    description: 'display: flex',
  },
  {
    className: 'inline-flex',
    category: 'layout',
    source: 'tailwind',
    description: 'display: inline-flex',
  },
  {
    className: 'grid',
    category: 'layout',
    source: 'tailwind',
    description: 'display: grid',
  },
  {
    className: 'flex-col',
    category: 'layout',
    source: 'tailwind',
    description: 'flex-direction: column',
  },
  {
    className: 'flex-row',
    category: 'layout',
    source: 'tailwind',
    description: 'flex-direction: row',
  },
  {
    className: 'items-center',
    category: 'layout',
    source: 'tailwind',
    description: 'align-items: center',
  },
  {
    className: 'justify-center',
    category: 'layout',
    source: 'tailwind',
    description: 'justify-content: center',
  },
  {
    className: 'justify-between',
    category: 'layout',
    source: 'tailwind',
    description: 'justify-content: space-between',
  },
  {
    className: 'grid-cols-2',
    category: 'layout',
    source: 'tailwind',
    description: '2 equal grid columns',
  },
  {
    className: 'grid-cols-3',
    category: 'layout',
    source: 'tailwind',
    description: '3 equal grid columns',
  },
  {
    className: 'gap-2',
    category: 'spacing',
    source: 'tailwind',
    description: 'gap: 0.5rem (8px)',
  },
  {
    className: 'gap-4',
    category: 'spacing',
    source: 'tailwind',
    description: 'gap: 1rem (16px)',
  },
  {
    className: 'gap-6',
    category: 'spacing',
    source: 'tailwind',
    description: 'gap: 1.5rem (24px)',
  },
  {
    className: 'p-4',
    category: 'spacing',
    source: 'tailwind',
    description: 'padding: 1rem (16px)',
  },
  {
    className: 'p-6',
    category: 'spacing',
    source: 'tailwind',
    description: 'padding: 1.5rem (24px)',
  },
  {
    className: 'px-4',
    category: 'spacing',
    source: 'tailwind',
    description: 'padding-inline: 1rem',
  },
  {
    className: 'py-2',
    category: 'spacing',
    source: 'tailwind',
    description: 'padding-block: 0.5rem',
  },
  {
    className: 'mx-auto',
    category: 'spacing',
    source: 'tailwind',
    description: 'margin-inline: auto',
  },
  {
    className: 'w-full',
    category: 'layout',
    source: 'tailwind',
    description: 'width: 100%',
  },
  {
    className: 'max-w-4xl',
    category: 'layout',
    source: 'tailwind',
    description: 'max-width: 56rem',
  },
  {
    className: 'text-sm',
    category: 'typography',
    source: 'tailwind',
    description: 'font-size: 0.875rem',
  },
  {
    className: 'text-base',
    category: 'typography',
    source: 'tailwind',
    description: 'font-size: 1rem',
  },
  {
    className: 'text-2xl',
    category: 'typography',
    source: 'tailwind',
    description: 'font-size: 1.5rem',
  },
  {
    className: 'font-semibold',
    category: 'typography',
    source: 'tailwind',
    description: 'font-weight: 600',
  },
  {
    className: 'font-bold',
    category: 'typography',
    source: 'tailwind',
    description: 'font-weight: 700',
  },
  {
    className: 'text-slate-900',
    category: 'typography',
    source: 'tailwind',
    description: 'Slate 900 text color',
  },
  {
    className: 'text-white',
    category: 'typography',
    source: 'tailwind',
    description: 'White text color',
  },
  {
    className: 'bg-white',
    category: 'surface',
    source: 'tailwind',
    description: 'White background',
  },
  {
    className: 'bg-slate-50',
    category: 'surface',
    source: 'tailwind',
    description: 'Slate 50 surface background',
  },
  {
    className: 'bg-[var(--color-primary)]',
    category: 'surface',
    source: 'tailwind',
    description: 'Theme primary CSS variable bg',
  },
  {
    className: 'bg-[var(--color-surface)]',
    category: 'surface',
    source: 'tailwind',
    description: 'Theme surface CSS variable bg',
  },
  {
    className: 'text-[var(--color-secondary)]',
    category: 'typography',
    source: 'tailwind',
    description: 'Theme secondary CSS variable text',
  },
  {
    className: 'border',
    category: 'surface',
    source: 'tailwind',
    description: '1px solid border',
  },
  {
    className: 'border-slate-200',
    category: 'surface',
    source: 'tailwind',
    description: 'Slate 200 border color',
  },
  {
    className: 'rounded-lg',
    category: 'effects',
    source: 'tailwind',
    description: 'border-radius: 0.5rem',
  },
  {
    className: 'rounded-xl',
    category: 'effects',
    source: 'tailwind',
    description: 'border-radius: 0.75rem',
  },
  {
    className: 'rounded-full',
    category: 'effects',
    source: 'tailwind',
    description: 'border-radius: 9999px',
  },
  {
    className: 'shadow-md',
    category: 'effects',
    source: 'tailwind',
    description: 'Medium box-shadow elevation',
  },
  {
    className: 'transition-all',
    category: 'effects',
    source: 'tailwind',
    description: 'Smooth property transition',
  },
];

const V3_SPECIFIC_CLASSES: ClassCatalogEntry[] = [
  {
    className: 'shadow-sm',
    category: 'effects',
    source: 'tailwind',
    onlyVersion: 'v3',
    description: 'Subtle shadow (renamed shadow-xs in v4)',
  },
  {
    className: 'shadow',
    category: 'effects',
    source: 'tailwind',
    onlyVersion: 'v3',
    description: 'Default base shadow (renamed shadow-sm in v4)',
  },
  {
    className: 'rounded',
    category: 'effects',
    source: 'tailwind',
    onlyVersion: 'v3',
    description: '0.25rem border radius (renamed rounded-sm in v4)',
  },
  {
    className: 'rounded-sm',
    category: 'effects',
    source: 'tailwind',
    onlyVersion: 'v3',
    description: '0.125rem border radius (renamed rounded-xs in v4)',
  },
  {
    className: 'outline-none',
    category: 'effects',
    source: 'tailwind',
    onlyVersion: 'v3',
    description: 'Hide outline cleanly (outline-hidden in v4)',
  },
  {
    className: 'bg-gradient-to-r',
    category: 'surface',
    source: 'tailwind',
    onlyVersion: 'v3',
    description: 'Rightward linear gradient (bg-linear-to-r in v4)',
  },
  {
    className: 'flex-shrink-0',
    category: 'layout',
    source: 'tailwind',
    onlyVersion: 'v3',
    description: 'Prevent flex shrink (shrink-0 alias in v3)',
  },
  {
    className: 'flex-grow',
    category: 'layout',
    source: 'tailwind',
    onlyVersion: 'v3',
    description: 'Allow flex grow (grow alias in v3)',
  },
  {
    className: 'bg-opacity-80',
    category: 'surface',
    source: 'tailwind',
    onlyVersion: 'v3',
    description: 'Background opacity modifier (use bg-color/80 in v4)',
  },
  {
    className: 'ring',
    category: 'effects',
    source: 'tailwind',
    onlyVersion: 'v3',
    description: 'Default 3px focus ring (ring-3 in v4)',
  },
];

const V4_SPECIFIC_CLASSES: ClassCatalogEntry[] = [
  {
    className: 'shadow-xs',
    category: 'effects',
    source: 'tailwind',
    onlyVersion: 'v4',
    description: 'v4 extra-small elevation shadow',
  },
  {
    className: 'rounded-xs',
    category: 'effects',
    source: 'tailwind',
    onlyVersion: 'v4',
    description: 'v4 extra-small 2px radius',
  },
  {
    className: 'outline-hidden',
    category: 'effects',
    source: 'tailwind',
    onlyVersion: 'v4',
    description: 'v4 accessible outline-hidden for forced-colors',
  },
  {
    className: 'bg-linear-to-r',
    category: 'surface',
    source: 'tailwind',
    onlyVersion: 'v4',
    description: 'v4 linear gradient syntax',
  },
  {
    className: 'inset-shadow-sm',
    category: 'effects',
    source: 'tailwind',
    onlyVersion: 'v4',
    description: 'v4 inner inset box-shadow utility',
  },
  {
    className: 'inset-ring-1',
    category: 'effects',
    source: 'tailwind',
    onlyVersion: 'v4',
    description: 'v4 inset focus/border ring',
  },
  {
    className: 'size-10',
    category: 'layout',
    source: 'tailwind',
    onlyVersion: 'v4',
    description: 'Equal width & height (2.5rem)',
  },
  {
    className: 'field-sizing-content',
    category: 'layout',
    source: 'tailwind',
    onlyVersion: 'v4',
    description: 'v4 auto-growing input/textarea sizing',
  },
  {
    className: 'wrap-break-word',
    category: 'typography',
    source: 'tailwind',
    onlyVersion: 'v4',
    description: 'v4 overflow-wrap: break-word',
  },
  {
    className: '@container',
    category: 'layout',
    source: 'tailwind',
    onlyVersion: 'v4',
    description: 'v4 native CSS container query context',
  },
  {
    className: 'text-shadow-sm',
    category: 'typography',
    source: 'tailwind',
    onlyVersion: 'v4',
    description: 'v4 subtle text shadow utility',
  },
  {
    className: 'ring-3',
    category: 'effects',
    source: 'tailwind',
    onlyVersion: 'v4',
    description: 'v4 default 3px focus ring (replaces v3 ring)',
  },
];

export const CSS_PROPERTY_CATALOG: CssPropertySuggestion[] = [
  {
    property: 'display',
    description: 'Box layout model',
    sampleValues: ['flex', 'grid', 'inline-flex', 'block', 'none'],
  },
  {
    property: 'flex-direction',
    description: 'Flex main axis direction',
    sampleValues: ['row', 'column', 'row-reverse', 'column-reverse'],
  },
  {
    property: 'justify-content',
    description: 'Main axis distribution',
    sampleValues: ['flex-start', 'center', 'space-between', 'space-around', 'flex-end'],
  },
  {
    property: 'align-items',
    description: 'Cross axis alignment',
    sampleValues: ['stretch', 'center', 'flex-start', 'flex-end', 'baseline'],
  },
  {
    property: 'gap',
    description: 'Flex / Grid spacing between items',
    sampleValues: ['0.5rem', '1rem', '1.5rem', '12px', '24px'],
  },
  {
    property: 'padding',
    description: 'Inner box spacing',
    sampleValues: ['0.5rem', '1rem', '1.5rem', '12px 16px'],
  },
  {
    property: 'margin',
    description: 'Outer spacing around box',
    sampleValues: ['0', '0 auto', '1rem', '16px 0'],
  },
  {
    property: 'width',
    description: 'Element width',
    sampleValues: ['100%', 'auto', 'fit-content', '320px'],
  },
  {
    property: 'max-width',
    description: 'Maximum element width',
    sampleValues: ['100%', '48rem', '64rem', '600px'],
  },
  {
    property: 'background-color',
    description: 'Background fill color',
    sampleValues: ['var(--color-surface)', 'var(--color-primary)', '#ffffff', '#f8fafc'],
  },
  {
    property: 'color',
    description: 'Foreground text color',
    sampleValues: ['var(--color-secondary)', 'var(--color-primary)', '#0f172a', '#ffffff'],
  },
  {
    property: 'border',
    description: 'Shorthand border thickness, style & color',
    sampleValues: ['1px solid #e2e8f0', '1px solid var(--color-primary)', 'none'],
  },
  {
    property: 'border-radius',
    description: 'Corner roundness',
    sampleValues: ['0.375rem', '0.5rem', '0.75rem', '1rem', '9999px'],
  },
  {
    property: 'box-shadow',
    description: 'Elevation shadow effect',
    sampleValues: ['0 1px 3px rgba(15, 23, 42, 0.1)', '0 10px 25px -5px rgba(15, 23, 42, 0.15)', 'none'],
  },
  {
    property: 'font-size',
    description: 'Text font size',
    sampleValues: ['var(--font-size-body)', 'var(--font-size-title)', '0.875rem', '1rem', '1.5rem'],
  },
  {
    property: 'font-weight',
    description: 'Text weight',
    sampleValues: ['400', '500', '600', '700'],
  },
  {
    property: 'line-height',
    description: 'Vertical spacing between lines',
    sampleValues: ['1.25', '1.5', '1.65'],
  },
  {
    property: 'letter-spacing',
    description: 'Tracking between glyphs',
    sampleValues: ['-0.025em', '0', '0.025em', '0.05em'],
  },
  {
    property: 'opacity',
    description: 'Element transparency (0..1)',
    sampleValues: ['1', '0.9', '0.75', '0.5'],
  },
  {
    property: 'transition',
    description: 'CSS property animation timing',
    sampleValues: ['all 150ms ease', 'color 200ms ease, background-color 200ms ease'],
  },
  {
    property: 'transform',
    description: '2D/3D spatial transform',
    sampleValues: ['translateY(-2px)', 'scale(1.02)', 'none'],
  },
  {
    property: 'cursor',
    description: 'Mouse pointer style',
    sampleValues: ['pointer', 'default', 'grab'],
  },
  {
    property: 'overflow',
    description: 'Content clipping behavior',
    sampleValues: ['hidden', 'auto', 'visible'],
  },
];

export function getTailwindClassCatalog(
  version: TailwindVersion
): ClassCatalogEntry[] {
  const versionEntries =
    version === 'v3' ? V3_SPECIFIC_CLASSES : V4_SPECIFIC_CLASSES;
  return [...versionEntries, ...SHARED_TAILWIND_CLASSES];
}

export function extractCssClassNamesFromRules(rawCss: string): string[] {
  if (!rawCss.trim()) return [];
  const withoutComments = rawCss.replace(/\/\*[\s\S]*?\*\//g, '');
  const classes = new Set<string>();
  const regex = /(?:^|[\s,{>+~])\.([a-zA-Z_-][a-zA-Z0-9_-]*)/g;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(withoutComments)) !== null) {
    const cls = match[1];
    if (cls && !cls.startsWith('node-')) {
      classes.add(cls);
    }
  }
  return Array.from(classes);
}

export function extractCssVariablesFromRules(
  rawCss: string
): Array<{ name: string; value: string }> {
  if (!rawCss.trim()) return [];
  const withoutComments = rawCss.replace(/\/\*[\s\S]*?\*\//g, '');
  const map = new Map<string, string>();
  const regex = /(--[a-zA-Z0-9_-]+)\s*:\s*([^;{}]+)\s*;/g;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(withoutComments)) !== null) {
    const name = match[1].trim();
    const val = match[2].trim();
    if (name && val) {
      map.set(name, val);
    }
  }
  return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
}

export function discoverPageStylesheets(
  doc: Document | null = typeof document !== 'undefined' ? document : null,
  sharedThemeCss = '',
  themeVars: readonly ThemeVariable[] = []
): DiscoveredStylesheetInfo {
  const themeClasses = extractCssClassNamesFromRules(sharedThemeCss);
  const stylesheetClassSet = new Set<string>();
  const varMap = new Map<
    string,
    { name: string; value: string; source: 'theme' | 'stylesheet' }
  >();

  for (const tv of themeVars) {
    const cleanName = tv.name.trim().startsWith('--')
      ? tv.name.trim()
      : `--${tv.name.trim()}`;
    varMap.set(cleanName, {
      name: cleanName,
      value: tv.value.trim(),
      source: 'theme',
    });
  }

  for (const sharedVar of extractCssVariablesFromRules(sharedThemeCss)) {
    if (!varMap.has(sharedVar.name)) {
      varMap.set(sharedVar.name, {
        name: sharedVar.name,
        value: sharedVar.value,
        source: 'theme',
      });
    }
  }

  let stylesheetCount = 0;
  let tailwindDetected = false;

  if (doc && doc.styleSheets) {
    const sheets = Array.from(doc.styleSheets);
    stylesheetCount = sheets.length;

    for (const sheet of sheets) {
      let rules: CSSRuleList | undefined;
      try {
        rules = sheet.cssRules;
      } catch {
        // Cross-origin stylesheet cannot be inspected; skip safely without failing
        continue;
      }
      if (!rules) continue;

      const scanRules = (ruleList: CSSRuleList) => {
        for (let i = 0; i < ruleList.length; i += 1) {
          const rule = ruleList[i];
          if (!rule) continue;
          const cssText = rule.cssText || '';

          if (
            cssText.includes('--tw-') ||
            cssText.includes('--spacing') ||
            cssText.includes('@layer utilities')
          ) {
            tailwindDetected = true;
          }

          if ('selectorText' in rule && typeof (rule as CSSStyleRule).selectorText === 'string') {
            const styleRule = rule as CSSStyleRule;
            const selector = styleRule.selectorText;
            const clsRegex = /\.([a-zA-Z_-][a-zA-Z0-9_-]*)/g;
            let clsMatch: RegExpExecArray | null;
            while ((clsMatch = clsRegex.exec(selector)) !== null) {
              const clsName = clsMatch[1];
              // Skip massive Tailwind single-utility dump bloat if huge; retain semantic/UI library classes first
              if (
                clsName &&
                !clsName.startsWith('tw-') &&
                stylesheetClassSet.size < 180
              ) {
                stylesheetClassSet.add(clsName);
              }
            }

            if (selector.includes(':root') && styleRule.style) {
              for (let s = 0; s < styleRule.style.length; s += 1) {
                const propName = styleRule.style[s];
                if (propName && propName.startsWith('--')) {
                  if (!varMap.has(propName)) {
                    const val = styleRule.style.getPropertyValue(propName).trim();
                    if (val) {
                      varMap.set(propName, {
                        name: propName,
                        value: val,
                        source: 'stylesheet',
                      });
                    }
                  }
                }
              }
            }
          }

          if ('cssRules' in rule && (rule as CSSGroupingRule).cssRules) {
            scanRules((rule as CSSGroupingRule).cssRules);
          }
        }
      };

      scanRules(rules);
    }
  }

  return {
    stylesheetCount,
    tailwindDetected,
    stylesheetClasses: Array.from(stylesheetClassSet),
    themeClasses,
    cssVariables: Array.from(varMap.values()),
  };
}

export function buildClassExplorerCatalog(
  version: TailwindVersion,
  discovered: Pick<DiscoveredStylesheetInfo, 'themeClasses' | 'stylesheetClasses'>
): ClassCatalogEntry[] {
  const seen = new Set<string>();
  const combined: ClassCatalogEntry[] = [];

  for (const cls of discovered.themeClasses) {
    if (seen.has(cls)) continue;
    seen.add(cls);
    combined.push({
      className: cls,
      category: 'ui',
      source: 'theme',
      description: 'Klasa zdefiniowana w Theme Shared CSS',
    });
  }

  for (const cls of discovered.stylesheetClasses) {
    if (seen.has(cls)) continue;
    seen.add(cls);
    combined.push({
      className: cls,
      category: 'ui',
      source: 'stylesheet',
      description: 'Klasa z załączonego arkusza stylów strony',
    });
  }

  for (const tw of getTailwindClassCatalog(version)) {
    if (seen.has(tw.className)) continue;
    seen.add(tw.className);
    combined.push(tw);
  }

  return combined;
}

export function filterClassExplorerItems(
  items: readonly ClassCatalogEntry[],
  searchQuery: string,
  categoryFilter: 'all' | 'tailwind' | 'ui' = 'all'
): ClassCatalogEntry[] {
  const q = searchQuery.trim().toLowerCase();
  return items.filter((item) => {
    if (categoryFilter === 'tailwind' && item.source !== 'tailwind') {
      return false;
    }
    if (categoryFilter === 'ui' && item.source === 'tailwind') {
      return false;
    }
    if (!q) return true;
    return (
      item.className.toLowerCase().includes(q) ||
      item.description.toLowerCase().includes(q)
    );
  });
}

export function parseCssDeclarations(rawCss: string): Record<string, string> {
  const result: Record<string, string> = {};
  if (!rawCss.trim()) return result;

  // Strip optional single wrapper selector `{ ... }` and comments cleanly
  let body = rawCss.replace(/\/\*[\s\S]*?\*\//g, '').trim();
  const blockMatch = body.match(/^[^{}]*\{([\s\S]*)\}\s*$/);
  if (blockMatch) {
    body = blockMatch[1];
  }

  const lines = body.split(';');
  for (const segment of lines) {
    const trimmed = segment.trim();
    if (!trimmed) continue;
    const colonIdx = trimmed.indexOf(':');
    if (colonIdx <= 0) continue;
    const prop = trimmed.slice(0, colonIdx).trim();
    const val = trimmed.slice(colonIdx + 1).trim();
    if (/^(--[a-zA-Z0-9_-]+|[a-zA-Z-]+)$/.test(prop) && val.length > 0) {
      result[prop] = val;
    }
  }
  return result;
}

export function formatCssDeclarations(decls: Record<string, string>): string {
  return Object.entries(decls)
    .map(([prop, val]) => `${prop}: ${val};`)
    .join('\n');
}

export function setNodeCustomStyleCssInTree(
  nodes: NodesMap,
  nodeId: string,
  customStyleCss: string
): NodesMap {
  const target = nodes[nodeId];
  if (!target) return nodes;

  const normalized = customStyleCss;
  if ((target.customStyleCss || '') === normalized) {
    return nodes;
  }

  const nextNode: NodesMap[string] = { ...target };
  if (normalized.trim().length > 0) {
    nextNode.customStyleCss = normalized;
  } else {
    delete nextNode.customStyleCss;
  }

  return {
    ...nodes,
    [nodeId]: nextNode,
  };
}

export function buildElementCustomStyleCssRules(nodes: NodesMap): string {
  const blocks: string[] = [];
  for (const node of Object.values(nodes)) {
    const raw = (node.customStyleCss || '').trim();
    if (!raw) continue;
    const decls = parseCssDeclarations(raw);
    const declEntries = Object.entries(decls);
    if (declEntries.length === 0) continue;
    const serialized = declEntries
      .map(([prop, val]) => `  ${prop}: ${val};`)
      .join('\n');
    blocks.push(`[data-node-id="${node.id}"] {\n${serialized}\n}`);
  }
  return blocks.join('\n');
}

export function tokenizeCssForHighlight(cssText: string): CssTokenSpan[] {
  if (!cssText) return [];
  const spans: CssTokenSpan[] = [];
  const tokenRegex =
    /(\/\*[\s\S]*?\*\/|var\(\s*--[a-zA-Z0-9_-]+\s*\)|--[a-zA-Z0-9_-]+|#[0-9a-fA-F]{3,8}\b|[+-]?\d*\.?\d+(?:px|rem|em|%|vh|vw|ms|s|deg)?\b|[{}:;()]|\.[a-zA-Z_-][a-zA-Z0-9_-]*|[a-zA-Z-]+(?=\s*:))/g;

  let lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = tokenRegex.exec(cssText)) !== null) {
    if (match.index > lastIndex) {
      spans.push({
        text: cssText.slice(lastIndex, match.index),
        kind: 'plain',
      });
    }
    const token = match[0];
    let kind: CssTokenSpan['kind'] = 'plain';
    if (token.startsWith('/*')) {
      kind = 'comment';
    } else if (token.startsWith('var(') || token.startsWith('--')) {
      kind = 'var';
    } else if (token.startsWith('#')) {
      kind = 'color';
    } else if (/^[+-]?\d/.test(token)) {
      kind = 'number';
    } else if (token.startsWith('.')) {
      kind = 'selector';
    } else if (/^[{}:;()]$/.test(token)) {
      kind = 'punctuation';
    } else {
      kind = 'property';
    }

    spans.push({ text: token, kind });
    lastIndex = match.index + token.length;
  }

  if (lastIndex < cssText.length) {
    spans.push({ text: cssText.slice(lastIndex), kind: 'plain' });
  }
  return spans;
}

const TAILWIND_CONFLICT_MAP: Array<{
  property: string;
  classPrefix: RegExp;
  label: string;
}> = [
  { property: 'padding', classPrefix: /^p(?:x|y|t|r|b|l)?-/, label: 'padding' },
  { property: 'margin', classPrefix: /^m(?:x|y|t|r|b|l)?-/, label: 'margin' },
  { property: 'background-color', classPrefix: /^bg-/, label: 'background' },
  { property: 'color', classPrefix: /^text-(?!xs$|sm$|base$|lg$|xl$|\d+xl$|left$|center$|right$|justify$)/, label: 'text color' },
  { property: 'border-radius', classPrefix: /^rounded/, label: 'border-radius' },
  { property: 'box-shadow', classPrefix: /^shadow/, label: 'box-shadow' },
  { property: 'display', classPrefix: /^(flex|inline-flex|grid|block|inline-block|hidden)$/, label: 'display' },
  { property: 'gap', classPrefix: /^gap-/, label: 'gap' },
  { property: 'font-size', classPrefix: /^text-(?:xs|sm|base|lg|xl|\d+xl|\[length:)/, label: 'font-size' },
];

export function suggestTailwindEquivalentForDeclaration(
  property: string,
  value: string,
  version: TailwindVersion
): string | null {
  const prop = property.trim().toLowerCase();
  const val = value.trim().toLowerCase();

  if (prop === 'display') {
    if (val === 'flex') return 'flex';
    if (val === 'inline-flex') return 'inline-flex';
    if (val === 'grid') return 'grid';
    if (val === 'block') return 'block';
    if (val === 'none') return 'hidden';
  }
  if (prop === 'flex-direction') {
    if (val === 'column') return 'flex-col';
    if (val === 'row') return 'flex-row';
  }
  if (prop === 'justify-content') {
    if (val === 'center') return 'justify-center';
    if (val === 'space-between') return 'justify-between';
    if (val === 'flex-start') return 'justify-start';
    if (val === 'flex-end') return 'justify-end';
  }
  if (prop === 'align-items') {
    if (val === 'center') return 'items-center';
    if (val === 'flex-start') return 'items-start';
    if (val === 'flex-end') return 'items-end';
    if (val === 'stretch') return 'items-stretch';
  }
  if (prop === 'padding') {
    if (val === '8px' || val === '0.5rem') return 'p-2';
    if (val === '16px' || val === '1rem') return 'p-4';
    if (val === '24px' || val === '1.5rem') return 'p-6';
    if (val === '32px' || val === '2rem') return 'p-8';
  }
  if (prop === 'gap') {
    if (val === '8px' || val === '0.5rem') return 'gap-2';
    if (val === '16px' || val === '1rem') return 'gap-4';
    if (val === '24px' || val === '1.5rem') return 'gap-6';
  }
  if (prop === 'border-radius') {
    if (val === '4px' || val === '0.25rem') {
      return version === 'v3' ? 'rounded' : 'rounded-sm';
    }
    if (val === '8px' || val === '0.5rem') return 'rounded-lg';
    if (val === '12px' || val === '0.75rem') return 'rounded-xl';
    if (val === '16px' || val === '1rem') return 'rounded-2xl';
    if (val === '9999px') return 'rounded-full';
  }
  if (prop === 'box-shadow') {
    if (val !== 'none') {
      return version === 'v3' ? 'shadow-sm' : 'shadow-xs';
    }
  }
  if (prop === 'background-color' && val.startsWith('var(')) {
    return `bg-[${val}]`;
  }
  if (prop === 'color' && val.startsWith('var(')) {
    return `text-[${val}]`;
  }
  return null;
}

export function validateRawCssAgainstTailwind(
  rawCss: string,
  elementClassName: string,
  version: TailwindVersion
): CssValidationReport {
  const issues: CssValidationIssue[] = [];
  const parsedDeclarations = parseCssDeclarations(rawCss);
  const classTokens = elementClassName.split(/\s+/).filter(Boolean);

  if (!rawCss.trim()) {
    return {
      issues: [],
      syntaxErrorCount: 0,
      equivalentCount: 0,
      conflictCount: 0,
      parsedDeclarations,
    };
  }

  // 1. Check brace balance
  const openBraces = (rawCss.match(/\{/g) || []).length;
  const closeBraces = (rawCss.match(/\}/g) || []).length;
  if (openBraces !== closeBraces) {
    issues.push({
      id: 'syntax-braces',
      severity: 'error',
      message: 'Niezamknięty nawias klamrowy `{` lub `}` w regułach CSS.',
    });
  }

  // 2. Check lines/segments for missing ':' or empty values
  const stripped = rawCss
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^[^{}]*\{/, '')
    .replace(/\}\s*$/, '');
  const segments = stripped.split('\n');
  segments.forEach((line, idx) => {
    const clean = line.trim();
    if (!clean || clean === '{' || clean === '}' || clean.startsWith('.')) {
      return;
    }
    const cleanNoSemi = clean.replace(/;$/, '').trim();
    if (!cleanNoSemi) return;
    const colonPos = cleanNoSemi.indexOf(':');
    if (colonPos === -1) {
      issues.push({
        id: `syntax-colon-${idx}`,
        severity: 'error',
        message: `Linia ${idx + 1} („${cleanNoSemi}”) wymaga dwukropka i wartości CSS (np. color: #0f172a;).`,
      });
      return;
    }
    const propPart = cleanNoSemi.slice(0, colonPos).trim();
    const valPart = cleanNoSemi.slice(colonPos + 1).trim();
    if (!valPart) {
      issues.push({
        id: `syntax-value-${idx}`,
        severity: 'error',
        message: `Brak wartości po „${propPart}:” w linii ${idx + 1}.`,
        property: propPart,
      });
    }
  });

  // 3. Check Tailwind equivalents & conflicts
  for (const [prop, val] of Object.entries(parsedDeclarations)) {
    const lowerProp = prop.toLowerCase();
    const conflictSpec = TAILWIND_CONFLICT_MAP.find(
      (c) => c.property === lowerProp
    );
    const overlappingToken = conflictSpec
      ? classTokens.find((tok) => conflictSpec.classPrefix.test(tok))
      : undefined;

    if (overlappingToken) {
      issues.push({
        id: `conflict-${lowerProp}`,
        severity: 'warning',
        property: prop,
        conflictingClass: overlappingToken,
        message: `Właściwość \`${prop}\` może nadpisywać lub kolidować z klasą Tailwind \`${overlappingToken}\`.`,
      });
    }

    const eq = suggestTailwindEquivalentForDeclaration(prop, val, version);
    if (eq && !classTokens.includes(eq)) {
      issues.push({
        id: `tw-eq-${lowerProp}`,
        severity: 'info',
        property: prop,
        tailwindEquivalent: eq,
        message: `W Tailwind ${version} możesz zastąpić \`${prop}: ${val}\` klasą \`${eq}\`.`,
      });
    }
  }

  return {
    issues,
    syntaxErrorCount: issues.filter((i) => i.severity === 'error').length,
    equivalentCount: issues.filter((i) => i.severity === 'info').length,
    conflictCount: issues.filter((i) => i.severity === 'warning').length,
    parsedDeclarations,
  };
}

export function getClassAutocompleteSuggestions(
  query: string,
  version: TailwindVersion,
  discovered: Pick<DiscoveredStylesheetInfo, 'themeClasses' | 'stylesheetClasses'>,
  limit = 10,
  bootstrapVersion?: BootstrapVersion
): CssAutocompleteItem[] {
  const tokens = query.split(/\s+/);
  const currentWord = (tokens[tokens.length - 1] || '').trim().toLowerCase();
  const catalog = buildClassExplorerCatalog(version, discovered);

  const combinedCatalog: Array<{
    className: string;
    detail: string;
    badge: string;
  }> = catalog.map((item) => ({
    className: item.className,
    detail: item.description,
    badge:
      item.source === 'tailwind'
        ? `TW ${version}`
        : item.source === 'theme'
          ? 'Theme'
          : 'CSS',
  }));

  if (bootstrapVersion) {
    for (const bsEntry of BOOTSTRAP_CLASSES_BY_VERSION) {
      if (bsEntry.version !== bootstrapVersion) continue;
      for (const token of bsEntry.className.split(/\s+/)) {
        if (!token) continue;
        if (!combinedCatalog.some((c) => c.className === token)) {
          combinedCatalog.push({
            className: token,
            detail: `${bsEntry.category}: ${bsEntry.description}`,
            badge: `BS ${bootstrapVersion === '4.6.2' ? 'v4' : 'v5'}`,
          });
        }
      }
    }
  }

  const filtered = currentWord
    ? combinedCatalog.filter((item) =>
        item.className.toLowerCase().includes(currentWord)
      )
    : combinedCatalog.slice(0, limit);

  const sorted = [...filtered].sort((a, b) => {
    const aStarts = currentWord
      ? a.className.toLowerCase().startsWith(currentWord)
        ? 0
        : 1
      : 0;
    const bStarts = currentWord
      ? b.className.toLowerCase().startsWith(currentWord)
        ? 0
        : 1
      : 0;
    if (aStarts !== bStarts) return aStarts - bStarts;
    return a.className.localeCompare(b.className);
  });

  return sorted.slice(0, limit).map((item) => ({
    label: item.className,
    insertText: item.className,
    detail: item.detail,
    badge: item.badge,
    kind: 'class',
  }));
}

export function getDeclarationAutocompleteSuggestions(
  rawCssText: string,
  version: TailwindVersion,
  discoveredVars: DiscoveredStylesheetInfo['cssVariables'],
  limit = 8
): CssAutocompleteItem[] {
  const lines = rawCssText.split('\n');
  const activeLine = (lines[lines.length - 1] || '').trim();
  const colonIdx = activeLine.indexOf(':');

  // Expecting property name
  if (colonIdx === -1) {
    const propPrefix = activeLine.toLowerCase();
    const matches = propPrefix
      ? CSS_PROPERTY_CATALOG.filter((p) =>
          p.property.toLowerCase().includes(propPrefix)
        )
      : CSS_PROPERTY_CATALOG;

    return matches.slice(0, limit).map((p) => ({
      label: p.property,
      insertText: `${p.property}: `,
      detail: `${p.description} (TW ${version})`,
      badge: 'Prop',
      kind: 'property',
    }));
  }

  // Expecting property value or CSS variable
  const propName = activeLine.slice(0, colonIdx).trim().toLowerCase();
  const valFragment = activeLine
    .slice(colonIdx + 1)
    .replace(/;$/, '')
    .trim()
    .toLowerCase();

  const items: CssAutocompleteItem[] = [];

  for (const v of discoveredVars) {
    const varExpr = `var(${v.name})`;
    if (
      !valFragment ||
      v.name.toLowerCase().includes(valFragment) ||
      varExpr.toLowerCase().includes(valFragment) ||
      valFragment.startsWith('var')
    ) {
      items.push({
        label: varExpr,
        insertText: `${varExpr};`,
        detail: `${v.value} (${v.source === 'theme' ? 'Motyw' : 'Arkusz CSS'})`,
        badge: 'Var',
        kind: 'variable',
      });
    }
  }

  const matchedProp = CSS_PROPERTY_CATALOG.find(
    (p) => p.property.toLowerCase() === propName
  );
  if (matchedProp) {
    for (const sample of matchedProp.sampleValues) {
      if (!valFragment || sample.toLowerCase().includes(valFragment)) {
        items.push({
          label: sample,
          insertText: `${sample};`,
          detail: matchedProp.description,
          badge: 'Value',
          kind: 'value',
        });
      }
    }
  }

  return items.slice(0, limit);
}
