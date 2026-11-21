import type { NodeBlueprint } from '../types/editor';

export interface ImportedPlaceholderInfo {
  id: string;
  kind: 'logo' | 'image' | 'widget' | 'media';
  label: string;
  reason: string;
}

export interface WebpageImportResult {
  title: string;
  description: string;
  sourceUrl: string;
  detectedThemeColors: string[];
  placeholders: ImportedPlaceholderInfo[];
  stats: {
    sections: number;
    headings: number;
    buttons: number;
    inputs: number;
    images: number;
    placeholders: number;
  };
  blueprint: NodeBlueprint;
}

const decodeHtmlEntities = (text: string): string =>
  text
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/\s+/g, ' ')
    .trim();

const stripTags = (html: string): string =>
  decodeHtmlEntities(html.replace(/<[^>]*>/g, ' '));

const extractAttr = (tagHtml: string, attrName: string): string => {
  const re = new RegExp(
    `\\b${attrName}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s"'>]+))`,
    'i'
  );
  const match = tagHtml.match(re);
  if (!match) return '';
  return (match[1] ?? match[2] ?? match[3] ?? '').trim();
};

const resolveRelativeUrl = (rawUrl: string, baseUrl?: string): string => {
  const trimmed = rawUrl.trim();
  if (!trimmed || trimmed.startsWith('data:')) return trimmed;
  if (!baseUrl) return trimmed;
  try {
    return new URL(trimmed, baseUrl).toString();
  } catch {
    return trimmed;
  }
};

function createPlaceholderBlueprint(
  kind: ImportedPlaceholderInfo['kind'],
  label: string,
  reason: string,
  placeholders: ImportedPlaceholderInfo[],
  suffixName = ''
): NodeBlueprint {
  const id = `ph-${placeholders.length + 1}`;
  placeholders.push({ id, kind, label, reason });
  const badgePrefix =
    kind === 'logo'
      ? 'Placeholder: Logo'
      : kind === 'image'
        ? 'Placeholder: Obraz'
        : kind === 'media'
          ? 'Placeholder: Media'
          : 'Placeholder: Komponent';

  return {
    type: 'Container',
    name: `${badgePrefix}${suffixName ? ` (${suffixName})` : ''}`,
    sourceLibrary: 'imported-web',
    props: {
      className:
        'flex flex-col gap-1 p-3 rounded-xl border-2 border-dashed border-amber-400 bg-amber-50/70 text-amber-900',
    },
    children: [
      {
        type: 'Badge',
        name: 'Placeholder Label',
        content: badgePrefix,
        sourceLibrary: 'imported-web',
        props: {
          className:
            'self-start px-2 py-0.5 rounded bg-amber-200/80 text-amber-900 text-[11px] font-bold',
        },
      },
      {
        type: 'Text',
        name: 'Placeholder Info',
        content: `${label} — ${reason}`,
        sourceLibrary: 'imported-web',
        props: {
          className: 'text-xs text-amber-800',
        },
      },
    ],
  };
}

export function parseHtmlToWebpageBlueprint(
  rawHtml: string,
  sourceUrl = ''
): WebpageImportResult {
  const cleanedHtml = (rawHtml || '')
    .replace(/<script\b[\s\S]*?<\/script>/gi, (scriptTag) => {
      const src = extractAttr(scriptTag, 'src');
      return src ? `<!-- script:${src} -->` : '';
    })
    .replace(/<noscript\b[\s\S]*?<\/noscript>/gi, '');

  const titleMatch = cleanedHtml.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i);
  const title = titleMatch
    ? stripTags(titleMatch[1]).slice(0, 120)
    : sourceUrl
      ? new URL(sourceUrl).hostname
      : 'Zaimportowana strona';

  const descMatch = cleanedHtml.match(
    /<meta\b[^>]*name=["']description["'][^>]*>/i
  );
  const description = descMatch ? extractAttr(descMatch[0], 'content') : '';

  // Extract inline/style CSS hex colors (unique, clean 6-digit hex)
  const colorMatches = cleanedHtml.match(/#[0-9a-fA-F]{6}\b/g) || [];
  const detectedThemeColors = Array.from(
    new Set(colorMatches.map((c) => c.toLowerCase()))
  ).slice(0, 6);

  const placeholders: ImportedPlaceholderInfo[] = [];
  const children: NodeBlueprint[] = [];
  const stats = {
    sections: 0,
    headings: 0,
    buttons: 0,
    inputs: 0,
    images: 0,
    placeholders: 0,
  };

  // 1. Scan Header / Navbar first to capture brand / logo & top links
  const headerMatch = cleanedHtml.match(/<(header|nav)\b[^>]*>([\s\S]*?)<\/\1>/i);
  if (headerMatch) {
    const headerInner = headerMatch[2];
    const headerChildren: NodeBlueprint[] = [];

    const hasInlineLogoSvg = /<svg\b[\s\S]*?<\/svg>/i.test(headerInner);
    const logoImgMatch = headerInner.match(/<img\b[^>]*>/i);
    const logoSrc = logoImgMatch
      ? resolveRelativeUrl(extractAttr(logoImgMatch[0], 'src'), sourceUrl)
      : '';
    const logoAlt = logoImgMatch
      ? extractAttr(logoImgMatch[0], 'alt') || title
      : title;

    if (logoSrc && /^https?:\/\//i.test(logoSrc)) {
      headerChildren.push({
        type: 'Image',
        name: `Logo (${logoAlt})`,
        sourceLibrary: 'imported-web',
        props: {
          src: logoSrc,
          className: 'h-9 w-auto rounded-lg object-contain',
        },
      });
      stats.images += 1;
    } else {
      headerChildren.push(
        createPlaceholderBlueprint(
          'logo',
          `Logo witryny "${title}"`,
          hasInlineLogoSvg
            ? 'Wykryto osadzone wektorowe logo SVG — wstawiono zastępczy placeholder logo.'
            : 'Brak bezpośrednio osadzalnego pliku logo na skanowanej stronie.',
          placeholders,
          title
        )
      );
    }

    const navLinkRegex = /<(a|button)\b[^>]*>([\s\S]*?)<\/\1>/gi;
    const navButtons: NodeBlueprint[] = [];
    let navMatch: RegExpExecArray | null;
    while (
      (navMatch = navLinkRegex.exec(headerInner)) !== null &&
      navButtons.length < 4
    ) {
      const label = stripTags(navMatch[2]);
      if (!label || label.length > 32) continue;
      navButtons.push({
        type: 'Button',
        name: `Nav: ${label}`,
        content: label,
        sourceLibrary: 'imported-web',
        props: {
          className:
            'px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 text-slate-800',
        },
      });
      stats.buttons += 1;
    }

    if (navButtons.length > 0) {
      headerChildren.push({
        type: 'Container',
        name: 'Navigation Links',
        sourceLibrary: 'imported-web',
        props: { className: 'flex flex-wrap items-center gap-2' },
        children: navButtons,
      });
    }

    children.push({
      type: 'Container',
      name: 'Imported Header',
      sourceLibrary: 'imported-web',
      props: {
        className:
          'w-full flex flex-wrap items-center justify-between gap-4 p-4 bg-white rounded-xl border border-slate-200',
      },
      children: headerChildren,
    });
    stats.sections += 1;
  } else {
    children.push(
      createPlaceholderBlueprint(
        'logo',
        `Nagłówek / Logo "${title}"`,
        'Nie wykryto znacznika <header> ani <nav> z logo na stronie źródłowej.',
        placeholders,
        title
      )
    );
  }

  // 2. Scan main content elements in source order (excluding header already handled)
  const bodyMatch = cleanedHtml.match(/<body\b[^>]*>([\s\S]*?)<\/body>/i);
  let bodyContent = bodyMatch ? bodyMatch[1] : cleanedHtml;
  if (headerMatch) {
    bodyContent = bodyContent.replace(headerMatch[0], ' ');
  }

  const elementRegex =
    /<(h[1-6]|p|button|a|input|textarea|select|img|svg|video|iframe|canvas|form)\b([^>]*)(?:\/>|>([\s\S]*?)<\/\1>)/gi;

  const mainChildren: NodeBlueprint[] = [];
  const formInputs: NodeBlueprint[] = [];
  let elMatch: RegExpExecArray | null;
  let scannedCount = 0;

  while ((elMatch = elementRegex.exec(bodyContent)) !== null && scannedCount < 45) {
    const tag = elMatch[1].toLowerCase();
    const attrs = `<${tag} ${elMatch[2] || ''}>`;
    const innerHtml = elMatch[3] || '';
    scannedCount += 1;

    if (tag.startsWith('h')) {
      const text = stripTags(innerHtml);
      if (!text) continue;
      mainChildren.push({
        type: 'Heading',
        name: `Heading (${tag.toUpperCase()})`,
        content: text.slice(0, 180),
        sourceLibrary: 'imported-web',
        props: {
          className:
            tag === 'h1'
              ? 'text-3xl font-bold text-slate-900 leading-tight'
              : 'text-xl font-semibold text-slate-800',
        },
      });
      stats.headings += 1;
      continue;
    }

    if (tag === 'p') {
      const text = stripTags(innerHtml);
      if (text.length < 4) continue;
      mainChildren.push({
        type: 'Text',
        name: 'Paragraph',
        content: text.slice(0, 320),
        sourceLibrary: 'imported-web',
        props: { className: 'text-sm text-slate-600 leading-relaxed' },
      });
      continue;
    }

    if (tag === 'button' || (tag === 'a' && /btn|button|cta/i.test(attrs))) {
      const text = stripTags(innerHtml);
      if (!text || text.length > 48) continue;
      mainChildren.push({
        type: 'Button',
        name: `CTA: ${text}`,
        content: text,
        sourceLibrary: 'imported-web',
        props: {
          className:
            'self-start px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold',
        },
      });
      stats.buttons += 1;
      continue;
    }

    if (tag === 'input' || tag === 'textarea' || tag === 'select') {
      const inputType = extractAttr(attrs, 'type').toLowerCase();
      if (inputType === 'hidden' || inputType === 'submit') continue;
      const placeholder =
        extractAttr(attrs, 'placeholder') ||
        extractAttr(attrs, 'aria-label') ||
        extractAttr(attrs, 'name') ||
        'Pole formularza';
      formInputs.push({
        type: 'Input',
        name: `Input (${placeholder})`,
        sourceLibrary: 'imported-web',
        props: {
          placeholder,
          className:
            'w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-sm text-slate-800',
        },
      });
      stats.inputs += 1;
      continue;
    }

    if (tag === 'img') {
      const rawSrc = extractAttr(attrs, 'src');
      const alt = extractAttr(attrs, 'alt') || 'Obraz ze strony';
      const resolved = resolveRelativeUrl(rawSrc, sourceUrl);
      if (resolved && /^https?:\/\//i.test(resolved)) {
        mainChildren.push({
          type: 'Image',
          name: alt.slice(0, 50),
          sourceLibrary: 'imported-web',
          props: {
            src: resolved,
            className: 'w-full max-w-md rounded-xl object-cover border border-slate-200',
          },
        });
        stats.images += 1;
      } else {
        mainChildren.push(
          createPlaceholderBlueprint(
            'image',
            alt,
            rawSrc
              ? `Nieobsługiwany lub względny URL obrazu (${rawSrc}) — wstawiono placeholder.`
              : 'Brak atrybutu src obrazu na skanowanej stronie.',
            placeholders,
            alt.slice(0, 24)
          )
        );
      }
      continue;
    }

    if (tag === 'svg') {
      mainChildren.push(
        createPlaceholderBlueprint(
          'logo',
          'Grafika / Ikona SVG ze strony',
          'Złożony element <svg> zastąpiono placeholderem z informacją o oryginalnej grafice.',
          placeholders,
          'SVG'
        )
      );
      continue;
    }

    if (tag === 'video' || tag === 'iframe' || tag === 'canvas') {
      const src = extractAttr(attrs, 'src') || 'osadzony komponent';
      mainChildren.push(
        createPlaceholderBlueprint(
          'media',
          `Osadzony element <${tag}> (${src})`,
          `Dynamiczny element <${tag}> nie może zostać bezpośrednio uruchomiony jako statyczny węzeł — dodano placeholder.`,
          placeholders,
          tag
        )
      );
    }
  }

  // Detect dynamic SPA / script-only component shells (e.g., <div id="root"></div> or widgets)
  const widgetShellMatches =
    bodyContent.match(
      /<div\b[^>]*(?:id=["'](?:app|root|chart|map|carousel|widget)[^"']*["']|class=["'][^"']*(?:carousel|slider|chart|widget|map|accordion)[^"']*["'])[^>]*>/gi
    ) || [];

  for (const shellTag of widgetShellMatches.slice(0, 3)) {
    const idAttr = extractAttr(shellTag, 'id');
    const clsAttr = extractAttr(shellTag, 'class');
    const widgetLabel = idAttr ? `#${idAttr}` : clsAttr.split(/\s+/)[0] || 'widget';
    mainChildren.push(
      createPlaceholderBlueprint(
        'widget',
        `Interaktywny komponent (${widgetLabel})`,
        'Komponent renderowany skryptem JavaScript ze skanowanego URL — zastąpiono opisowym placeholderem.',
        placeholders,
        widgetLabel
      )
    );
  }

  if (formInputs.length > 0) {
    mainChildren.push({
      type: 'Container',
      name: 'Imported Form Section',
      sourceLibrary: 'imported-web',
      props: {
        className:
          'w-full flex flex-col gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200',
      },
      children: formInputs,
    });
    stats.sections += 1;
  }

  if (mainChildren.length === 0) {
    mainChildren.push(
      createPlaceholderBlueprint(
        'widget',
        `Zawartość strony "${title}"`,
        'Strona może być renderowana dynamicznie po stronie klienta (SPA/JS) — nie znaleziono statycznych sekcji tekstowych.',
        placeholders,
        title
      )
    );
  }

  children.push({
    type: 'Container',
    name: `Imported Main (${title})`,
    sourceLibrary: 'imported-web',
    props: {
      className:
        'w-full flex flex-col gap-4 p-5 bg-white rounded-xl border border-slate-200',
    },
    children: mainChildren,
  });
  stats.sections += 1;
  stats.placeholders = placeholders.length;

  return {
    title,
    description,
    sourceUrl,
    detectedThemeColors,
    placeholders,
    stats,
    blueprint: {
      type: 'Container',
      name: `Imported: ${title}`,
      sourceLibrary: 'imported-web',
      props: {
        className: 'w-full flex flex-col gap-5 p-4 bg-slate-50/70 rounded-2xl',
      },
      children,
    },
  };
}
