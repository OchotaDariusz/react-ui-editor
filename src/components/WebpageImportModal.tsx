import { useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Globe,
  Loader2,
  Plus,
  Replace,
  X,
} from 'lucide-react';
import type { WebpageImportResult } from '../utils/webpageImporter';

interface WebpageImportModalProps {
  open: boolean;
  onClose: () => void;
  onApplyImportedBlueprint: (
    result: WebpageImportResult,
    mode: 'append' | 'replace'
  ) => void;
}

export function WebpageImportModal({
  open,
  onClose,
  onApplyImportedBlueprint,
}: WebpageImportModalProps) {
  const [urlInput, setUrlInput] = useState('https://example.com');
  const [htmlFallback, setHtmlFallback] = useState('');
  const [showRawHtmlMode, setShowRawHtmlMode] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [scanResult, setScanResult] = useState<WebpageImportResult | null>(null);

  if (!open) return null;

  const handleScan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (showRawHtmlMode && !htmlFallback.trim()) {
      setErrorMsg('Wklej kod HTML do zeskanowania.');
      return;
    }
    if (!showRawHtmlMode && !urlInput.trim()) {
      setErrorMsg('Podaj adres URL strony WWW.');
      return;
    }

    setIsScanning(true);
    setErrorMsg('');
    setScanResult(null);

    try {
      const response = await fetch('/api/import-webpage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          showRawHtmlMode
            ? { url: urlInput.trim(), html: htmlFallback }
            : { url: urlInput.trim() }
        ),
      });
      const payload = (await response.json()) as WebpageImportResult & {
        error?: string;
      };
      if (!response.ok) {
        setErrorMsg(
          payload.error || 'Nie udało się zeskanować podanej strony.'
        );
        return;
      }
      setScanResult(payload);
    } catch {
      setErrorMsg('Błąd sieci podczas łączenia z usługą importu.');
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div
      data-testid="webpage-import-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="webpage-import-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[88vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between gap-3 bg-slate-50/70">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0">
              <Globe className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h2
                id="webpage-import-title"
                className="text-sm font-bold text-slate-900 truncate"
              >
                Import Webpage (Skanuj URL i odtwórz UI)
              </h2>
              <p className="text-[11px] text-slate-500 truncate">
                Skanuje strukturę HTML strony; brakujące loga, media i skrypty zastępuje opisowym placeholderem.
              </p>
            </div>
          </div>
          <button
            type="button"
            aria-label="Zamknij modal importu strony"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-200/70 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto space-y-4">
          <form onSubmit={handleScan} className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <label
                htmlFor="webpage-import-url-input"
                className="text-xs font-semibold text-slate-700"
              >
                Adres URL strony WWW
              </label>
              <button
                type="button"
                onClick={() => setShowRawHtmlMode((v) => !v)}
                className="text-[11px] font-semibold text-blue-600 hover:text-blue-800"
              >
                {showRawHtmlMode
                  ? 'Wróć do skanowania samego URL'
                  : 'Lub wklej kod HTML strony'}
              </button>
            </div>

            <div className="flex gap-2">
              <input
                id="webpage-import-url-input"
                type="text"
                data-testid="webpage-import-url-input"
                placeholder="https://example.com"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                className="flex-1 min-w-0 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
              />
              <button
                type="submit"
                data-testid="webpage-import-scan-btn"
                disabled={isScanning}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white text-xs font-semibold rounded-lg transition-colors whitespace-nowrap"
              >
                {isScanning ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Skanowanie...
                  </>
                ) : (
                  <>
                    <Globe className="w-3.5 h-3.5" />
                    Skanuj URL
                  </>
                )}
              </button>
            </div>

            {showRawHtmlMode && (
              <textarea
                data-testid="webpage-import-html-input"
                aria-label="Kod HTML strony do zaimportowania"
                rows={5}
                value={htmlFallback}
                onChange={(e) => setHtmlFallback(e.target.value)}
                placeholder="<header><svg>Logo</svg></header><main><h1>Witaj</h1><p>Opis...</p></main>"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            )}
          </form>

          {errorMsg && (
            <div
              role="alert"
              data-testid="webpage-import-error"
              className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800 flex items-start gap-2"
            >
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {scanResult && (
            <div
              data-testid="webpage-import-result"
              className="space-y-3 p-4 bg-slate-50 rounded-xl border border-slate-200"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 text-emerald-700 text-xs font-bold">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span className="truncate">{scanResult.title}</span>
                  </div>
                  {scanResult.sourceUrl && (
                    <p className="text-[11px] font-mono text-slate-500 truncate mt-0.5">
                      {scanResult.sourceUrl}
                    </p>
                  )}
                </div>
                <div className="flex flex-wrap gap-1.5 shrink-0 text-[10px] font-mono">
                  <span className="px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-700">
                    Sekcje: {scanResult.stats.sections}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-700">
                    Nagłówki: {scanResult.stats.headings}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-amber-50 border border-amber-200 text-amber-800 font-semibold">
                    Placeholdery: {scanResult.stats.placeholders}
                  </span>
                </div>
              </div>

              {scanResult.placeholders.length > 0 && (
                <div className="space-y-1.5">
                  <span className="block text-[11px] font-bold text-amber-800">
                    Elementy zastąpione placeholderami z opisem ({scanResult.placeholders.length}):
                  </span>
                  <div className="max-h-36 overflow-y-auto space-y-1">
                    {scanResult.placeholders.map((ph) => (
                      <div
                        key={ph.id}
                        className="p-2 bg-amber-50 border border-amber-200 rounded-lg text-[11px] text-amber-900"
                      >
                        <strong className="font-semibold">
                          [{ph.kind.toUpperCase()}] {ph.label}:
                        </strong>{' '}
                        {ph.reason}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  data-testid="webpage-import-append-btn"
                  onClick={() => {
                    onApplyImportedBlueprint(scanResult, 'append');
                    onClose();
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-100 border border-slate-300 text-slate-800 text-xs font-semibold rounded-lg transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Dodaj do bieżącego płótna
                </button>
                <button
                  type="button"
                  data-testid="webpage-import-replace-btn"
                  onClick={() => {
                    onApplyImportedBlueprint(scanResult, 'replace');
                    onClose();
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-colors"
                >
                  <Replace className="w-3.5 h-3.5" />
                  Zastąp płótno tym układem
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
