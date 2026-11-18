import { Check, Code, Copy } from 'lucide-react';

interface CodeExportViewProps {
  generatedCode: string;
  copied: boolean;
  onCopy: () => void;
}

export function CodeExportView({
  generatedCode,
  copied,
  onCopy,
}: CodeExportViewProps) {
  return (
    <div
      className="max-w-4xl mx-auto bg-slate-950 rounded-2xl p-6 shadow-xl border border-slate-800 flex flex-col h-full"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2 text-slate-100 text-sm font-semibold">
          <Code className="w-4 h-4 text-blue-400" />
          GeneratedUI.jsx
        </div>
        <button
          type="button"
          onClick={onCopy}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg transition-colors whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
        >
          {copied ? (
            <Check className="w-3.5 h-3.5 text-emerald-400" />
          ) : (
            <Copy className="w-3.5 h-3.5" />
          )}
          {copied ? 'Skopiowano!' : 'Kopiuj komponent'}
        </button>
      </div>
      <pre className="text-slate-300 font-mono text-xs leading-relaxed overflow-auto flex-1 pb-2 pr-2">
        <code>{generatedCode}</code>
      </pre>
    </div>
  );
}
