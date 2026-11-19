import type { EditorNode, NodesMap, SeoMetadata } from '../types/editor';
import { isContainerNodeType } from './editorLogic';

export type SitemapScope = 'sections' | 'top-level' | 'all';
export type SitemapChangeFreq = 'always' | 'daily' | 'weekly' | 'monthly' | 'never';

export interface SitemapEntry {
  nodeId: string;
  nodeType: EditorNode['type'];
  label: string;
  depth: number;
  path: string;
  loc: string;
  lastmod?: string;
  changefreq: SitemapChangeFreq;
  priority: string;
}

export interface SitemapOptions {
  scope?: SitemapScope;
  changefreq?: SitemapChangeFreq;
  includeLastmod?: boolean;
  lastmodDate?: string;
}

const escapeXml = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

export const extractSitemapBaseOrigin = (canonicalUrl = ''): string => {
  const raw = canonicalUrl.trim();
  if (!raw) return 'https://example.com';

  const withProtocol = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  try {
    const parsed = new URL(withProtocol);
    if (!parsed.hostname || !parsed.hostname.includes('.')) {
      return parsed.hostname === 'localhost'
        ? parsed.origin
        : 'https://example.com';
    }
    return parsed.origin;
  } catch {
    return 'https://example.com';
  }
};

export const extractCanonicalRootPath = (canonicalUrl = ''): string => {
  const raw = canonicalUrl.trim();
  if (!raw) return '/';

  const withProtocol = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  try {
    const parsed = new URL(withProtocol);
    const cleaned = parsed.pathname.replace(/\/+$/, '');
    return cleaned ? cleaned : '/';
  } catch {
    return '/';
  }
};

export const slugifySitemapSegment = (
  input: string,
  fallback = 'section'
): string => {
  const slug = (input || '')
    .trim()
    .replace(/[łŁ]/g, 'l')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48)
    .replace(/-+$/g, '');

  return slug || fallback;
};

const resolveNodeLabel = (nodes: NodesMap, node: EditorNode): string => {
  if (node.id === 'root') return 'Strona główna';
  if (isContainerNodeType(node.type)) {
    for (const childId of node.children || []) {
      const child = nodes[childId];
      if (child?.type === 'Heading' && child.content?.trim()) {
        return child.content.trim();
      }
    }
  }
  const explicitName = (node.name || '').trim();
  if (explicitName && explicitName.toLowerCase() !== node.type.toLowerCase()) {
    return explicitName;
  }
  if (node.content?.trim()) return node.content.trim();
  return explicitName || node.type;
};

const computePriorityForDepth = (depth: number): string => {
  if (depth <= 0) return '1.0';
  if (depth === 1) return '0.8';
  if (depth === 2) return '0.6';
  if (depth === 3) return '0.5';
  return '0.4';
};

const shouldIncludeNodeInScope = (
  node: EditorNode,
  depth: number,
  scope: SitemapScope
): boolean => {
  if (node.id === 'root') return true;
  if (scope === 'all') return true;
  if (scope === 'top-level') {
    return depth === 1;
  }
  return isContainerNodeType(node.type) || node.type === 'Heading';
};

export const buildSitemapEntries = (
  nodes: NodesMap,
  seoMetadata: SeoMetadata,
  options: SitemapOptions = {}
): SitemapEntry[] => {
  const root = nodes.root;
  if (!root) return [];

  const scope = options.scope ?? 'sections';
  const changefreq = options.changefreq ?? 'weekly';
  const includeLastmod = options.includeLastmod ?? true;
  const lastmodDate =
    options.lastmodDate || new Date().toISOString().slice(0, 10);

  const origin = extractSitemapBaseOrigin(seoMetadata.canonicalUrl);
  const rootPath = extractCanonicalRootPath(seoMetadata.canonicalUrl);
  const basePrefix = rootPath === '/' ? '' : rootPath;

  const entries: SitemapEntry[] = [];
  const usedPaths = new Set<string>();
  const visited = new Set<string>();

  const claimUniquePath = (desiredPath: string): string => {
    const normalized = desiredPath.startsWith('/') ? desiredPath : `/${desiredPath}`;
    if (!usedPaths.has(normalized)) {
      usedPaths.add(normalized);
      return normalized;
    }
    let counter = 2;
    while (usedPaths.has(`${normalized}-${counter}`)) {
      counter += 1;
    }
    const deduped = `${normalized}-${counter}`;
    usedPaths.add(deduped);
    return deduped;
  };

  const walk = (nodeId: string, depth: number, parentPath: string) => {
    if (visited.has(nodeId)) return;
    visited.add(nodeId);

    const node = nodes[nodeId];
    if (!node) return;

    const label = resolveNodeLabel(nodes, node);
    let currentPath = parentPath;

    if (nodeId === 'root') {
      currentPath = claimUniquePath(rootPath);
      entries.push({
        nodeId,
        nodeType: node.type,
        label,
        depth: 0,
        path: currentPath,
        loc: `${origin}${currentPath}`,
        ...(includeLastmod ? { lastmod: lastmodDate } : {}),
        changefreq,
        priority: '1.0',
      });
    } else if (shouldIncludeNodeInScope(node, depth, scope)) {
      const segment = slugifySitemapSegment(
        label,
        slugifySitemapSegment(node.type, 'section')
      );
      const rawPrefix =
        parentPath === '/' ? '' : parentPath;
      currentPath = claimUniquePath(`${rawPrefix}/${segment}`);
      entries.push({
        nodeId,
        nodeType: node.type,
        label,
        depth,
        path: currentPath,
        loc: `${origin}${currentPath}`,
        ...(includeLastmod ? { lastmod: lastmodDate } : {}),
        changefreq,
        priority: computePriorityForDepth(depth),
      });
    } else if (isContainerNodeType(node.type)) {
      const segment = slugifySitemapSegment(label, 'section');
      const rawPrefix = parentPath === '/' ? '' : parentPath;
      currentPath = `${rawPrefix}/${segment}`;
    } else {
      currentPath = parentPath || basePrefix || '/';
    }

    const nextParentPath = isContainerNodeType(node.type)
      ? currentPath
      : parentPath;

    for (const childId of node.children || []) {
      walk(childId, depth + 1, nextParentPath);
    }
  };

  walk('root', 0, basePrefix);
  return entries;
};

export const generateXmlSitemap = (
  nodes: NodesMap,
  seoMetadata: SeoMetadata,
  options: SitemapOptions = {}
): { xml: string; entries: SitemapEntry[]; baseOrigin: string } => {
  const entries = buildSitemapEntries(nodes, seoMetadata, options);
  const baseOrigin = extractSitemapBaseOrigin(seoMetadata.canonicalUrl);

  const urlBlocks = entries.map((entry) => {
    const lines = [
      '  <url>',
      `    <loc>${escapeXml(entry.loc)}</loc>`,
    ];
    if (entry.lastmod) {
      lines.push(`    <lastmod>${escapeXml(entry.lastmod)}</lastmod>`);
    }
    lines.push(`    <changefreq>${escapeXml(entry.changefreq)}</changefreq>`);
    lines.push(`    <priority>${escapeXml(entry.priority)}</priority>`);
    lines.push('  </url>');
    return lines.join('\n');
  });

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...urlBlocks,
    '</urlset>',
    '',
  ].join('\n');

  return { xml, entries, baseOrigin };
};
