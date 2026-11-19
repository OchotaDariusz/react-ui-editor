import { useMemo, useState } from 'react';
import { Check, Copy, Download, Network } from 'lucide-react';
import type { NodesMap, SeoMetadata } from '../types/editor';
import {
  generateXmlSitemap,
  type SitemapChangeFreq,
  type SitemapScope,
} from '../utils/sitemap';
import { downloadTextFile } from '../utils/exportFormats';

interface SitemapGeneratorProps {
  nodes: NodesMap;
  seoMetadata: SeoMetadata;
  onSelectNode: (nodeId: string) => void;
}

const SCOPE_OPTIONS: Array<{ value: SitemapScope; label: string }> = [
  { value: 'sections', label: 'Sekcje i nagłówki' },
  { value: 'top-level', label: 'Tylko poziom 1' },
  { value: 'all', label: 'Wszystkie węzły drzewa' },
];

const CHANGEFREQ_OPTIONS: SitemapChangeFreq[] = [
  'weekly',
  'daily',
  'monthly',
  'always',
  'never',
];

export function SitemapGenerator({
  nodes,
  seoMetadata,
  onSelectNode,
}: SitemapGeneratorProps) {
  const [scope, setScope] = useState<SitemapScope>('sections');
  const [changefreq, setChangefreq] = useState<SitemapChangeFreq>('weekly');
  const [includeLastmod, setIncludeLastmod] = useState(true);
  const [showXmlCode, setShowXmlCode] = useState(true);
  const [copiedXml, setCopiedXml] = useState(false);

  const sitemapResult = useMemo(
    () =>
      generateXmlSitemap(nodes, seoMetadata, {
        scope,
        changefreq,
        includeLastmod,
      }),
    [nodes, seoMetadata, scope, changefreq, includeLastmod]
  );

  const handleCopyXml = () => {
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(sitemapResult.xml).catch(() => {});
    }
    setCopiedXml(true);
    window.setTimeout(() => setCopiedXml(false), 1800);
  };

  return (
    <div
      aria-label="Sitemap"
      data-testid="seo-sitemap-tool"
      className="pt-2.5 border-t border-slate-200/80 space-y-2.5"
    >
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-1.5 whitespace-nowrap">
          <Network className="w-3.5 h-3.5 text-slate-500 shrink-0" />
          <span className="text-[11px] font-bold text-slate-700">
            Sitemap
          </span>
          <span className="text-[10px] font-mono text-slate-500 tabular-nums">
            · {sitemapResult.entries.length} URL
          </span>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            aria-label="Kopiuj XML sitemap"
            onClick={handleCopyXml}
            className={`inline-flex items-center gap-1 px-2 py-1 rounded border text-[10px] font-semibold transition-colors whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
              copiedXml
                ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
            }`}
          >
            {copiedXml ? (
              <>
                <Check className="w-3 h-3" />
                Skopiowano
              </>
            ) : (
              <>
                <Copy className="w-3 h-3" />
                Kopiuj
              </>
            )}
          </button>

          <button
            type="button"
            aria-label="Pobierz sitemap.xml"
            onClick={() =>
              downloadTextFile(
                sitemapResult.xml,
                'sitemap.xml',
                'application/xml;charset=utf-8'
              )
            }
            className="inline-flex items-center gap-1 px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 text-white text-[10px] font-semibold transition-colors whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            <Download className="w-3 h-3" />
            sitemap.xml
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-1.5">
        <label className="block space-y-1">
          <span className="block text-[10px] font-semibold text-slate-600">
            Zakres hierarchii
          </span>
          <select
            aria-label="Zakres sitemap"
            value={scope}
            onChange={(e) => setScope(e.target.value as SitemapScope)}
            className="w-full px-2 py-1 bg-white border border-slate-200 rounded-md text-[11px] text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {SCOPE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>

        <label className="block space-y-1">
          <span className="block text-[10px] font-semibold text-slate-600">
            Częstotliwość (changefreq)
          </span>
          <select
            aria-label="Częstotliwość zmian sitemap"
            value={changefreq}
            onChange={(e) => setChangefreq(e.target.value as SitemapChangeFreq)}
            className="w-full px-2 py-1 bg-white border border-slate-200 rounded-md text-[11px] font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {CHANGEFREQ_OPTIONS.map((freq) => (
              <option key={freq} value={freq}>
                {freq}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="flex items-center justify-between gap-2 text-[10px] text-slate-500">
        <label className="inline-flex items-center gap-1.5 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={includeLastmod}
            onChange={(e) => setIncludeLastmod(e.target.checked)}
            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
          />
          <span>Uwzględnij &lt;lastmod&gt;</span>
        </label>

        <button
          type="button"
          onClick={() => setShowXmlCode((prev) => !prev)}
          className="text-[10px] font-semibold text-blue-600 hover:text-blue-700 whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded"
        >
          {showXmlCode ? 'Ukryj kod XML' : 'Pokaż kod XML'}
        </button>
      </div>

      <div className="divide-y divide-slate-200 border border-slate-200 rounded-lg bg-white max-h-36 overflow-y-auto">
        {sitemapResult.entries.map((entry) => (
          <button
            key={entry.nodeId}
            type="button"
            onClick={() => onSelectNode(entry.nodeId)}
            className="w-full px-2.5 py-1.5 flex items-center justify-between gap-2 text-left hover:bg-blue-50/70 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            <div className="min-w-0">
              <span className="block text-[11px] font-mono text-slate-800 truncate">
                {entry.path}
              </span>
              <span className="block text-[10px] text-slate-500 truncate">
                {entry.label} · {entry.nodeType}
              </span>
            </div>
            <span className="text-[10px] font-mono text-slate-500 tabular-nums shrink-0">
              {entry.priority}
            </span>
          </button>
        ))}
      </div>

      {showXmlCode && (
        <pre
          data-testid="sitemap-xml-preview"
          className="p-2.5 bg-slate-900 text-slate-100 rounded-lg text-[10px] font-mono leading-relaxed max-h-44 overflow-auto select-all"
        >
          {sitemapResult.xml}
        </pre>
      )}
    </div>
  );
}
