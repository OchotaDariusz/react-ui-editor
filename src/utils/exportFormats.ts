import type { NodesMap, SeoMetadata, ThemeVariable } from '../types/editor';
import { buildThemeCssRules, isContainerNodeType } from './editorLogic';
import { buildScopedThemeOverrideCssRules } from './themeUsage';

export type CodePreviewFormat = 'react' | 'html' | 'svg';

export interface SvgBoxElement {
  id: string;
  type: NodesMap[string]['type'];
  x: number;
  y: number;
  width: number;
  height: number;
  fill: string;
  stroke: string;
  strokeWidth: number;
  rx: number;
  textColor: string;
  fontSizePx: number;
  fontWeight: string;
  textAlign: 'left' | 'center' | 'right';
  text?: string;
  imageHref?: string;
  iconInnerSvg?: string;
}

const escapeXmlAttr = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

const escapeXmlText = (value: string): string =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export const buildExportFileName = (
  seoTitle?: string,
  extension = 'html'
): string => {
  const cleaned = (seoTitle || '')
    .trim()
    .replace(/[łŁ]/g, 'l')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  const base = cleaned || 'react-ui-studio-design';
  const cleanExt = extension.replace(/^\.+/, '') || 'txt';
  return `${base}.${cleanExt}`;
};

const buildNodeHtml = (
  nodes: NodesMap,
  id: string,
  indent = '    '
): string => {
  const node = nodes[id];
  if (!node) return '';
  const props = node.props || {};
  const cleanClass = (props.className || '').replace(/\s+/g, ' ').trim();
  const hasOverrides =
    node.themeOverrides && Object.keys(node.themeOverrides).length > 0;
  let attrStr = cleanClass ? ` class="${escapeXmlAttr(cleanClass)}"` : '';
  if (hasOverrides) {
    attrStr += ` data-theme-scope="${escapeXmlAttr(id)}"`;
  }

  if (node.type === 'Input' && props.placeholder) {
    attrStr += ` placeholder="${escapeXmlAttr(props.placeholder)}"`;
  }
  if (node.type === 'Image' && props.src) {
    attrStr += ` src="${escapeXmlAttr(props.src)}" alt="${escapeXmlAttr(
      node.name || 'image'
    )}"`;
  }

  if (isContainerNodeType(node.type)) {
    if (node.children.length === 0) {
      return `${indent}<div${attrStr}></div>\n`;
    }
    const inner = node.children
      .map((childId) => buildNodeHtml(nodes, childId, indent + '  '))
      .join('');
    return `${indent}<div${attrStr}>\n${inner}${indent}</div>\n`;
  }

  if (node.type === 'Heading') {
    return `${indent}<h2${attrStr}>${escapeXmlText(node.content || '')}</h2>\n`;
  }
  if (node.type === 'Text') {
    return `${indent}<p${attrStr}>${escapeXmlText(node.content || '')}</p>\n`;
  }
  if (node.type === 'Badge') {
    return `${indent}<span${attrStr}>${escapeXmlText(node.content || '')}</span>\n`;
  }
  if (node.type === 'Button') {
    return `${indent}<button type="button"${attrStr}>${escapeXmlText(
      node.content || ''
    )}</button>\n`;
  }
  if (node.type === 'Input') {
    return `${indent}<input type="text"${attrStr} />\n`;
  }
  if (node.type === 'Image') {
    return `${indent}<img${attrStr} />\n`;
  }
  if (node.type === 'Icon') {
    const iconName = node.props?.iconName || 'Star';
    return `${indent}<svg${attrStr} data-icon="${escapeXmlAttr(
      iconName
    )}" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9" /><title>${escapeXmlText(
      iconName
    )}</title></svg>\n`;
  }

  return '';
};

export const generateHtmlExport = (
  nodes: NodesMap,
  themeVars: ThemeVariable[] = [],
  seo?: SeoMetadata
): string => {
  const title = seo?.title?.trim() || 'React UI Studio Export';
  const description = seo?.description?.trim() || '';
  const canonicalUrl = seo?.canonicalUrl?.trim() || '';
  const baseThemeCss = buildThemeCssRules(themeVars);
  const scopedOverridesCss = buildScopedThemeOverrideCssRules(
    nodes,
    'data-theme-scope'
  );
  const themeCss = [baseThemeCss, scopedOverridesCss]
    .filter(Boolean)
    .join('\n');

  const headLines: string[] = [
    '  <meta charset="UTF-8" />',
    '  <meta name="viewport" content="width=device-width, initial-scale=1.0" />',
    `  <title>${escapeXmlText(title)}</title>`,
  ];

  if (description) {
    headLines.push(
      `  <meta name="description" content="${escapeXmlAttr(description)}" />`
    );
  }
  if (canonicalUrl) {
    headLines.push(
      `  <link rel="canonical" href="${escapeXmlAttr(canonicalUrl)}" />`
    );
  }

  headLines.push('  <script src="https://cdn.tailwindcss.com"></script>');
  if (themeCss) {
    headLines.push('  <style>');
    headLines.push(
      themeCss
        .split('\n')
        .map((line) => `    ${line}`)
        .join('\n')
    );
    headLines.push('  </style>');
  }

  const bodyMarkup = buildNodeHtml(nodes, 'root', '  ');

  return `<!DOCTYPE html>\n<html lang="pl">\n<head>\n${headLines.join(
    '\n'
  )}\n</head>\n<body class="bg-slate-50 min-h-screen antialiased">\n${bodyMarkup}</body>\n</html>\n`;
};

const wrapTextLines = (
  text: string,
  maxWidthPx: number,
  fontSizePx: number
): string[] => {
  const clean = text.replace(/\s+/g, ' ').trim();
  if (!clean) return [];
  const approxCharW = Math.max(fontSizePx * 0.56, 5);
  const maxChars = Math.max(Math.floor(maxWidthPx / approxCharW), 8);
  const words = clean.split(' ');
  const lines: string[] = [];
  let current = '';

  for (const word of words) {
    if (!current) {
      current = word;
    } else if (current.length + 1 + word.length <= maxChars) {
      current += ` ${word}`;
    } else {
      lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines;
};

export const buildSvgDocumentFromElements = (
  width: number,
  height: number,
  elements: SvgBoxElement[],
  seoTitle?: string
): string => {
  const safeW = Math.max(Math.round(width), 320);
  const safeH = Math.max(Math.round(height), 200);
  const titleTag = seoTitle?.trim()
    ? `  <title>${escapeXmlText(seoTitle.trim())}</title>\n`
    : '';

  const renderedShapes: string[] = [
    `  <rect x="0" y="0" width="${safeW}" height="${safeH}" rx="16" fill="#ffffff" />`,
  ];

  for (const el of elements) {
    if (el.width <= 0 || el.height <= 0) continue;
    const x = Math.round(el.x * 10) / 10;
    const y = Math.round(el.y * 10) / 10;
    const w = Math.round(el.width * 10) / 10;
    const h = Math.round(el.height * 10) / 10;
    const rx = Math.min(Math.round(el.rx * 10) / 10, w / 2, h / 2);

    const hasFill =
      el.fill && el.fill !== 'transparent' && el.fill !== 'rgba(0, 0, 0, 0)';
    const hasStroke = el.strokeWidth > 0 && el.stroke && el.stroke !== 'transparent';

    if (hasFill || hasStroke) {
      renderedShapes.push(
        `  <rect data-node-id="${escapeXmlAttr(
          el.id
        )}" x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${escapeXmlAttr(
          hasFill ? el.fill : 'none'
        )}"${
          hasStroke
            ? ` stroke="${escapeXmlAttr(el.stroke)}" stroke-width="${el.strokeWidth}"`
            : ''
        } />`
      );
    }

    if (el.type === 'Image' && el.imageHref) {
      renderedShapes.push(
        `  <image href="${escapeXmlAttr(
          el.imageHref
        )}" x="${x}" y="${y}" width="${w}" height="${h}" preserveAspectRatio="xMidYMid slice" />`
      );
    }

    if (el.type === 'Icon' && el.iconInnerSvg) {
      const scale = Math.min(w, h) / 24;
      renderedShapes.push(
        `  <g transform="translate(${x}, ${y}) scale(${scale.toFixed(
          3
        )})" fill="none" stroke="${escapeXmlAttr(
          el.textColor || '#0f172a'
        )}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${
          el.iconInnerSvg
        }</g>`
      );
    }

    if (el.text && el.type !== 'Icon') {
      const paddingX = Math.min(14, w * 0.15);
      const lines = wrapTextLines(
        el.text,
        Math.max(w - paddingX * 2, 40),
        el.fontSizePx
      );
      const lineHeight = Math.round(el.fontSizePx * 1.35 * 10) / 10;
      const totalTextH = lines.length * lineHeight;
      const startY =
        el.type === 'Button' || el.type === 'Badge' || el.type === 'Input'
          ? y + Math.max((h - totalTextH) / 2, 2) + el.fontSizePx
          : y + el.fontSizePx + 4;

      const textAnchor =
        el.textAlign === 'center'
          ? 'middle'
          : el.textAlign === 'right'
            ? 'end'
            : 'start';
      const anchorX =
        el.textAlign === 'center'
          ? x + w / 2
          : el.textAlign === 'right'
            ? x + w - paddingX
            : el.type === 'Button' || el.type === 'Badge' || el.type === 'Input'
              ? x + paddingX
              : x + 2;

      lines.forEach((line, idx) => {
        const lineY = Math.round((startY + idx * lineHeight) * 10) / 10;
        renderedShapes.push(
          `  <text x="${Math.round(anchorX * 10) / 10}" y="${lineY}" text-anchor="${textAnchor}" font-family="Inter, system-ui, -apple-system, sans-serif" font-size="${el.fontSizePx}" font-weight="${escapeXmlAttr(
            el.fontWeight
          )}" fill="${escapeXmlAttr(el.textColor || '#0f172a')}">${escapeXmlText(
            line
          )}</text>`
        );
      });
    }
  }

  return `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" width="${safeW}" height="${safeH}" viewBox="0 0 ${safeW} ${safeH}">\n${titleTag}${renderedShapes.join(
    '\n'
  )}\n</svg>\n`;
};

const resolvePrimaryColorVar = (themeVars: ThemeVariable[]): string => {
  const found = themeVars.find((v) => v.name.includes('primary'));
  return found?.value || '#2563eb';
};

const resolveSurfaceColorVar = (themeVars: ThemeVariable[]): string => {
  const found = themeVars.find((v) => v.name.includes('surface'));
  return found?.value || '#f8fafc';
};

export const generateStaticSvgExport = (
  nodes: NodesMap,
  themeVars: ThemeVariable[] = [],
  seo?: SeoMetadata,
  canvasWidth = 860
): string => {
  const primaryColor = resolvePrimaryColorVar(themeVars);
  const surfaceColor = resolveSurfaceColorVar(themeVars);
  const elements: SvgBoxElement[] = [];
  let cursorY = 32;

  const visit = (id: string, depth: number) => {
    const node = nodes[id];
    if (!node) return;

    const insetX = Math.min(depth * 24, 96);
    const width = Math.max(canvasWidth - insetX * 2 - 48, 160);
    const cls = node.props?.className || '';

    if (id === 'root') {
      for (const childId of node.children) {
        visit(childId, depth + 1);
      }
      return;
    }

    if (isContainerNodeType(node.type)) {
      const startY = cursorY;
      const boxIndex = elements.length;
      elements.push({
        id: node.id,
        type: node.type,
        x: 24 + insetX,
        y: startY,
        width,
        height: 80,
        fill: cls.includes('bg-[var(--color-surface)]')
          ? surfaceColor
          : cls.includes('bg-slate-900')
            ? '#0f172a'
            : cls.includes('bg-slate-50')
              ? '#f8fafc'
              : '#ffffff',
        stroke: '#e2e8f0',
        strokeWidth: 1,
        rx: cls.includes('rounded-2xl') ? 16 : 10,
        textColor: '#0f172a',
        fontSizePx: 14,
        fontWeight: '400',
        textAlign: 'left',
      });
      cursorY += 24;
      for (const childId of node.children) {
        visit(childId, depth + 1);
      }
      const endY = Math.max(cursorY + 12, startY + 72);
      elements[boxIndex].height = endY - startY;
      cursorY = endY + 16;
      return;
    }

    if (node.type === 'Heading') {
      const lines = wrapTextLines(node.content || node.name, width, 26);
      const h = Math.max(lines.length * 36, 40);
      elements.push({
        id: node.id,
        type: node.type,
        x: 24 + insetX,
        y: cursorY,
        width,
        height: h,
        fill: 'transparent',
        stroke: 'transparent',
        strokeWidth: 0,
        rx: 0,
        textColor: '#0f172a',
        fontSizePx: 26,
        fontWeight: '700',
        textAlign: cls.includes('text-center') ? 'center' : 'left',
        text: node.content || node.name,
      });
      cursorY += h + 12;
      return;
    }

    if (node.type === 'Badge') {
      const text = node.content || 'Badge';
      const badgeW = Math.min(Math.max(text.length * 8 + 28, 88), width);
      elements.push({
        id: node.id,
        type: node.type,
        x: 24 + insetX,
        y: cursorY,
        width: badgeW,
        height: 28,
        fill: '#dbeafe',
        stroke: 'transparent',
        strokeWidth: 0,
        rx: 999,
        textColor: '#1d4ed8',
        fontSizePx: 12,
        fontWeight: '600',
        textAlign: 'center',
        text,
      });
      cursorY += 40;
      return;
    }

    if (node.type === 'Button') {
      const text = node.content || 'Button';
      const btnW = Math.min(Math.max(text.length * 9 + 40, 128), width);
      elements.push({
        id: node.id,
        type: node.type,
        x: 24 + insetX,
        y: cursorY,
        width: btnW,
        height: 40,
        fill: cls.includes('bg-blue-600') || cls.includes('bg-[var(--color-primary)]')
          ? primaryColor
          : '#0f172a',
        stroke: 'transparent',
        strokeWidth: 0,
        rx: 8,
        textColor: '#ffffff',
        fontSizePx: 14,
        fontWeight: '600',
        textAlign: 'center',
        text,
      });
      cursorY += 54;
      return;
    }

    if (node.type === 'Input') {
      elements.push({
        id: node.id,
        type: node.type,
        x: 24 + insetX,
        y: cursorY,
        width: Math.min(width, 320),
        height: 40,
        fill: '#ffffff',
        stroke: '#cbd5e1',
        strokeWidth: 1,
        rx: 8,
        textColor: '#94a3b8',
        fontSizePx: 13,
        fontWeight: '400',
        textAlign: 'left',
        text: node.props?.placeholder || 'Wpisz tekst...',
      });
      cursorY += 52;
      return;
    }

    if (node.type === 'Image') {
      elements.push({
        id: node.id,
        type: node.type,
        x: 24 + insetX,
        y: cursorY,
        width: Math.min(width, 400),
        height: 180,
        fill: '#e2e8f0',
        stroke: '#cbd5e1',
        strokeWidth: 1,
        rx: 12,
        textColor: '#64748b',
        fontSizePx: 13,
        fontWeight: '500',
        textAlign: 'center',
        imageHref: node.props?.src,
      });
      cursorY += 196;
      return;
    }

    const labelText = node.content || node.props?.iconName || node.name;
    const lines = wrapTextLines(labelText, width, 15);
    const h = Math.max(lines.length * 22, 26);
    elements.push({
      id: node.id,
      type: node.type,
      x: 24 + insetX,
      y: cursorY,
      width,
      height: h,
      fill: 'transparent',
      stroke: 'transparent',
      strokeWidth: 0,
      rx: 0,
      textColor: '#475569',
      fontSizePx: 15,
      fontWeight: '400',
      textAlign: cls.includes('text-center') ? 'center' : 'left',
      text: labelText,
    });
    cursorY += h + 12;
  };

  visit('root', 0);
  const totalHeight = Math.max(cursorY + 24, 280);
  return buildSvgDocumentFromElements(canvasWidth, totalHeight, elements, seo?.title);
};

export const collectSvgElementsFromDom = (
  rootElement: HTMLElement,
  nodes: NodesMap
): { width: number; height: number; elements: SvgBoxElement[] } => {
  const rootRect = rootElement.getBoundingClientRect();
  const width = Math.max(rootRect.width, rootElement.clientWidth, 320);
  const height = Math.max(rootRect.height, rootElement.clientHeight, 200);
  const nodeEls = Array.from(
    rootElement.querySelectorAll<HTMLElement>('[data-node-id]')
  );

  const elements: SvgBoxElement[] = [];

  for (const domEl of nodeEls) {
    const id = domEl.dataset.nodeId;
    if (!id || !nodes[id]) continue;
    const node = nodes[id];
    const rect = domEl.getBoundingClientRect();
    const style = window.getComputedStyle(domEl);

    const relX = rect.left - rootRect.left;
    const relY = rect.top - rootRect.top;

    let text: string | undefined;
    let imageHref: string | undefined;
    let iconInnerSvg: string | undefined;

    if (node.type === 'Image') {
      imageHref = domEl.getAttribute('src') || node.props?.src;
    } else if (node.type === 'Icon') {
      const svgEl = domEl.querySelector('svg');
      if (svgEl) {
        iconInnerSvg = svgEl.innerHTML;
      }
    } else if (node.type === 'Input') {
      text =
        (domEl as HTMLInputElement).value ||
        domEl.getAttribute('placeholder') ||
        node.props?.placeholder;
    } else if (!isContainerNodeType(node.type)) {
      text = (domEl.innerText || node.content || '').trim();
    }

    const alignRaw = style.textAlign;
    const textAlign: 'left' | 'center' | 'right' =
      alignRaw === 'center'
        ? 'center'
        : alignRaw === 'right' || alignRaw === 'end'
          ? 'right'
          : 'left';

    elements.push({
      id,
      type: node.type,
      x: relX,
      y: relY,
      width: rect.width,
      height: rect.height,
      fill: style.backgroundColor || 'transparent',
      stroke: style.borderColor || 'transparent',
      strokeWidth: parseFloat(style.borderTopWidth || '0') || 0,
      rx: parseFloat(style.borderTopLeftRadius || '0') || 0,
      textColor: style.color || '#0f172a',
      fontSizePx: parseFloat(style.fontSize || '14') || 14,
      fontWeight: style.fontWeight || '400',
      textAlign,
      text,
      imageHref,
      iconInnerSvg,
    });
  }

  return { width, height, elements };
};

export const downloadTextFile = (
  content: string,
  fileName: string,
  mimeType: string
): void => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  try {
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.rel = 'noopener';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } finally {
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
};

export const exportCanvasElementAsSvg = (
  element: HTMLElement | null,
  nodes: NodesMap,
  themeVars: ThemeVariable[],
  seo?: SeoMetadata
): { fileName: string; svgContent: string } => {
  const fileName = buildExportFileName(seo?.title, 'svg');
  let svgContent: string;

  if (element) {
    const measured = collectSvgElementsFromDom(element, nodes);
    svgContent =
      measured.elements.length > 0
        ? buildSvgDocumentFromElements(
            measured.width,
            measured.height,
            measured.elements,
            seo?.title
          )
        : generateStaticSvgExport(nodes, themeVars, seo);
  } else {
    svgContent = generateStaticSvgExport(nodes, themeVars, seo);
  }

  downloadTextFile(svgContent, fileName, 'image/svg+xml;charset=utf-8');
  return { fileName, svgContent };
};
