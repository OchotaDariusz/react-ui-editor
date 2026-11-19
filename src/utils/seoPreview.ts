import type {
  NodesMap,
  SeoMetadata,
  SeoPreviewDeviceMode,
} from '../types/editor';

export const SEO_TITLE_LIMIT = 60;
export const SEO_DESCRIPTION_LIMIT_DESKTOP = 160;
export const SEO_DESCRIPTION_LIMIT_MOBILE = 120;

export type SeoFieldStatus = 'empty' | 'ok' | 'too-long';

export interface SeoPreviewData {
  siteName: string;
  displayUrl: string;
  isCustomUrl: boolean;
  title: string;
  rawTitle: string;
  titleLength: number;
  titleMax: number;
  titleStatus: SeoFieldStatus;
  isUsingFallbackTitle: boolean;
  description: string;
  rawDescription: string;
  descriptionLength: number;
  descriptionMax: number;
  descriptionStatus: SeoFieldStatus;
  isUsingFallbackDescription: boolean;
}

export function extractCanvasSeoFallbacks(nodes: NodesMap): {
  heading: string;
  description: string;
} {
  let heading = '';
  let description = '';
  const visited = new Set<string>();

  const walk = (nodeId: string) => {
    if (visited.has(nodeId)) return;
    visited.add(nodeId);
    const node = nodes[nodeId];
    if (!node) return;

    const text = (node.content || '').replace(/\s+/g, ' ').trim();
    if (!heading && node.type === 'Heading' && text) {
      heading = text;
    } else if (!description && node.type === 'Text' && text) {
      description = text;
    }

    if (heading && description) return;
    for (const childId of node.children || []) {
      walk(childId);
      if (heading && description) return;
    }
  };

  if (nodes.root) {
    walk('root');
  }

  return { heading, description };
}

export function formatGoogleSerpBreadcrumb(canonicalUrl: string): {
  siteName: string;
  displayUrl: string;
  isCustomUrl: boolean;
} {
  const trimmed = canonicalUrl.trim();
  if (!trimmed) {
    return {
      siteName: 'example.com',
      displayUrl: 'https://example.com',
      isCustomUrl: false,
    };
  }

  const withProtocol = /^https?:\/\//i.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;

  try {
    const parsed = new URL(withProtocol);
    const hostWithoutWww = parsed.hostname.replace(/^www\./i, '');
    const siteName = hostWithoutWww || 'example.com';
    const segments = parsed.pathname
      .split('/')
      .map((seg) => {
        try {
          return decodeURIComponent(seg.trim());
        } catch {
          return seg.trim();
        }
      })
      .filter(Boolean)
      .slice(0, 4);

    const origin = `${parsed.protocol}//${parsed.hostname}`;
    const displayUrl =
      segments.length > 0 ? `${origin} › ${segments.join(' › ')}` : origin;

    return {
      siteName,
      displayUrl,
      isCustomUrl: true,
    };
  } catch {
    const sanitized = trimmed.replace(/\s+/g, '');
    return {
      siteName: sanitized.slice(0, 32) || 'example.com',
      displayUrl: sanitized,
      isCustomUrl: true,
    };
  }
}

export function truncateSerpText(
  text: string,
  maxLength: number
): { text: string; truncated: boolean } {
  const normalized = text.replace(/\s+/g, ' ').trim();
  if (normalized.length <= maxLength) {
    return { text: normalized, truncated: false };
  }

  const slice = normalized.slice(0, maxLength - 1);
  const lastSpace = slice.lastIndexOf(' ');
  const cut =
    lastSpace > Math.floor(maxLength * 0.55) ? slice.slice(0, lastSpace) : slice;
  return {
    text: `${cut.replace(/[.,;:!?-]+$/, '').trimEnd()}…`,
    truncated: true,
  };
}

export function buildSeoPreviewData(
  seoMetadata: SeoMetadata,
  nodes: NodesMap,
  device: SeoPreviewDeviceMode = 'desktop'
): SeoPreviewData {
  const fallbacks = extractCanvasSeoFallbacks(nodes);
  const breadcrumb = formatGoogleSerpBreadcrumb(seoMetadata.canonicalUrl || '');

  const userTitle = (seoMetadata.title || '').replace(/\s+/g, ' ').trim();
  const isUsingFallbackTitle = userTitle.length === 0;
  const rawTitle =
    userTitle || fallbacks.heading || 'React UI Studio — Nowoczesny interfejs';
  const titleLength = userTitle.length;
  const titleStatus: SeoFieldStatus = isUsingFallbackTitle
    ? 'empty'
    : titleLength > SEO_TITLE_LIMIT
      ? 'too-long'
      : 'ok';

  const { text: truncatedTitle } = truncateSerpText(rawTitle, SEO_TITLE_LIMIT);

  const descriptionMax =
    device === 'mobile'
      ? SEO_DESCRIPTION_LIMIT_MOBILE
      : SEO_DESCRIPTION_LIMIT_DESKTOP;
  const userDescription = (seoMetadata.description || '')
    .replace(/\s+/g, ' ')
    .trim();
  const isUsingFallbackDescription = userDescription.length === 0;
  const rawDescription =
    userDescription ||
    fallbacks.description ||
    'Dodaj opis Meta Description w panelu SEO, aby kontrolować wygląd tej strony w wynikach wyszukiwania Google.';
  const descriptionLength = userDescription.length;
  const descriptionStatus: SeoFieldStatus = isUsingFallbackDescription
    ? 'empty'
    : descriptionLength > descriptionMax
      ? 'too-long'
      : 'ok';

  const { text: truncatedDescription } = truncateSerpText(
    rawDescription,
    descriptionMax
  );

  return {
    siteName: breadcrumb.siteName,
    displayUrl: breadcrumb.displayUrl,
    isCustomUrl: breadcrumb.isCustomUrl,
    title: truncatedTitle,
    rawTitle,
    titleLength,
    titleMax: SEO_TITLE_LIMIT,
    titleStatus,
    isUsingFallbackTitle,
    description: truncatedDescription,
    rawDescription,
    descriptionLength,
    descriptionMax,
    descriptionStatus,
    isUsingFallbackDescription,
  };
}
