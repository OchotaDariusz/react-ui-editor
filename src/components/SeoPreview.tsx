import { useMemo, useState } from 'react';
import { Globe, Monitor, Smartphone } from 'lucide-react';
import type {
  NodesMap,
  SeoMetadata,
  SeoPreviewDeviceMode,
} from '../types/editor';
import { buildSeoPreviewData, type SeoFieldStatus } from '../utils/seoPreview';

interface SeoPreviewProps {
  seoMetadata: SeoMetadata;
  nodes: NodesMap;
}

function getStatusMeta(status: SeoFieldStatus): {
  label: string;
  colorClass: string;
} {
  if (status === 'too-long') {
    return {
      label: 'Za długi — może zostać skrócony',
      colorClass: 'text-amber-700',
    };
  }
  if (status === 'ok') {
    return {
      label: 'OK',
      colorClass: 'text-emerald-700',
    };
  }
  return {
    label: 'Brak',
    colorClass: 'text-slate-400',
  };
}

export function SeoPreview({ seoMetadata, nodes }: SeoPreviewProps) {
  const [device, setDevice] = useState<SeoPreviewDeviceMode>('desktop');

  const preview = useMemo(
    () => buildSeoPreviewData(seoMetadata, nodes, device),
    [seoMetadata, nodes, device]
  );

  const titleStatusMeta = getStatusMeta(preview.titleStatus);
  const descStatusMeta = getStatusMeta(preview.descriptionStatus);

  return (
    <div
      aria-label="SEO Preview"
      data-testid="seo-preview"
      className="pt-2 border-t border-slate-200/80 space-y-2"
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-bold text-slate-600 tracking-wide">
          SEO Preview
        </span>

        <div
          role="group"
          aria-label="Tryb widoku SEO Preview"
          className="flex items-center gap-0.5 p-0.5 bg-white border border-slate-200 rounded-md"
        >
          <button
            type="button"
            aria-label="Podgląd Google Desktop"
            aria-pressed={device === 'desktop'}
            onClick={() => setDevice('desktop')}
            className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
              device === 'desktop'
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Monitor className="w-3 h-3" />
            Desktop
          </button>
          <button
            type="button"
            aria-label="Podgląd Google Mobile"
            aria-pressed={device === 'mobile'}
            onClick={() => setDevice('mobile')}
            className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
              device === 'mobile'
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Smartphone className="w-3 h-3" />
            Mobile
          </button>
        </div>
      </div>

      <div
        data-serp-device={device}
        className={`bg-white border border-slate-200 rounded-lg p-3 space-y-1.5 transition-all ${
          device === 'mobile' ? 'max-w-[260px] mx-auto' : 'w-full'
        }`}
      >
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-6 h-6 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0">
            <Globe className="w-3.5 h-3.5 text-slate-600" aria-hidden="true" />
          </div>
          <div className="min-w-0 leading-tight">
            <div className="text-[11px] font-medium text-[#202124] truncate">
              {preview.siteName}
            </div>
            <div
              data-testid="seo-preview-url"
              className="text-[10px] text-[#4d5156] truncate"
              title={preview.displayUrl}
            >
              {preview.displayUrl}
            </div>
          </div>
        </div>

        <h4
          data-testid="seo-preview-title"
          className="text-[15px] leading-[1.3] font-normal text-[#1a0dab] hover:underline break-words"
        >
          {preview.title}
        </h4>

        <p
          data-testid="seo-preview-description"
          className={`text-[11.5px] leading-[1.45] break-words ${
            preview.isUsingFallbackDescription
              ? 'text-slate-500'
              : 'text-[#4d5156]'
          }`}
        >
          {preview.description}
        </p>

        {(preview.isUsingFallbackTitle ||
          preview.isUsingFallbackDescription) && (
          <p className="text-[10px] text-slate-400 pt-0.5">
            {preview.isUsingFallbackTitle && preview.isUsingFallbackDescription
              ? 'Podgląd zastępczy z treści płótna'
              : preview.isUsingFallbackTitle
                ? 'Tytuł pobrany z pierwszego nagłówka płótna'
                : 'Opis zastępczy z treści płótna'}
          </p>
        )}
      </div>

      <div className="space-y-1 text-[10px] text-slate-500 tabular-nums">
        <div className="flex items-center justify-between gap-2">
          <span>
            Tytuł: <strong className="font-semibold text-slate-700">{preview.titleLength}</strong> / {preview.titleMax} zn.
          </span>
          <span className={`font-medium ${titleStatusMeta.colorClass}`}>
            {titleStatusMeta.label}
          </span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <span>
            Opis: <strong className="font-semibold text-slate-700">{preview.descriptionLength}</strong> / {preview.descriptionMax} zn.
          </span>
          <span className={`font-medium ${descStatusMeta.colorClass}`}>
            {descStatusMeta.label}
          </span>
        </div>
      </div>
    </div>
  );
}
