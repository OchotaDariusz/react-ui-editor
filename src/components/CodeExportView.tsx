import { Check, Code, Copy, Download, FileDown } from 'lucide-react';
import type { ExportFormat } from '../types/editor';
import type { CodePreviewFormat } from '../utils/exportFormats';

interface CodeExportViewProps {
  reactCode: string;
  htmlCode: string;
  svgCode: string;
  activeFormat: CodePreviewFormat;
  onChangeFormat: (format: CodePreviewFormat) => void;
  copied: boolean;
  onCopy: (content: string) => void;
  onDownloadFormat: (format: ExportFormat) => void;
  isExportingPdf: boolean;
}

const FORMAT_TABS: Array<{
  id: CodePreviewFormat;
  label: string;
  fileName: string;
}> = [
  { id: 'react', label: 'React (JSX)', fileName: 'GeneratedUI.jsx' },
  { id: 'html', label: 'HTML', fileName: 'index.html' },
  { id: 'svg', label: 'SVG', fileName: 'design.svg' },
];

export function CodeExportView({
  reactCode,
  htmlCode,
  svgCode,
  activeFormat,
  onChangeFormat,
  copied,
  onCopy,
  onDownloadFormat,
  isExportingPdf,
}: CodeExportViewProps) {
  const activeTab =
    FORMAT_TABS.find((t) => t.id === activeFormat) || FORMAT_TABS[0];

  const displayedCode =
    activeFormat === 'html'
      ? htmlCode
      : activeFormat === 'svg'
        ? svgCode
        : reactCode;

  return (
    <div
      className="max-w-4xl mx-auto bg-slate-950 rounded-2xl p-6 shadow-xl border border-slate-800 flex flex-col h-full"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex flex-wrap justify-between items-center gap-3 mb-4 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-slate-100 text-sm font-semibold">
            <Code className="w-4 h-4 text-blue-400" />
            <span>{activeTab.fileName}</span>
          </div>

          <div
            role="tablist"
            aria-label="Format kodu eksportu"
            className="flex items-center bg-slate-900 p-0.5 rounded-lg border border-slate-800"
          >
            {FORMAT_TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={activeFormat === tab.id}
                onClick={() => onChangeFormat(tab.id)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 ${
                  activeFormat === tab.id
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onCopy(displayedCode)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg transition-colors whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
          >
            {copied ? (
              <Check className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
            {copied ? 'Skopiowano!' : 'Kopiuj kod'}
          </button>

          <button
            type="button"
            onClick={() => onDownloadFormat(activeFormat)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg transition-colors whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
          >
            <Download className="w-3.5 h-3.5" />
            Pobierz .{activeFormat === 'react' ? 'jsx' : activeFormat}
          </button>

          <button
            type="button"
            disabled={isExportingPdf}
            onClick={() => onDownloadFormat('pdf')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg transition-colors whitespace-nowrap disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
          >
            <FileDown className="w-3.5 h-3.5 text-rose-400" />
            PDF
          </button>
        </div>
      </div>

      <pre className="text-slate-300 font-mono text-xs leading-relaxed overflow-auto flex-1 pb-2 pr-2">
        <code>{displayedCode}</code>
      </pre>
    </div>
  );
}
