import { useMemo, useState } from 'react';
import { Check, CheckCircle2, Sparkles, Wrench } from 'lucide-react';
import type { NodesMap, ThemeVariable } from '../types/editor';
import {
  lintNodeTree,
  type DesignLintCategory,
  type DesignLintIssue,
} from '../utils/designLint';

interface DesignLintPanelProps {
  selectedId: string;
  nodes: NodesMap;
  themeVars: ThemeVariable[];
  onSelectNode: (nodeId: string) => void;
  onFixIssue: (issue: DesignLintIssue) => void;
  onFixAll: () => number;
}

const FILTER_OPTIONS: Array<{
  id: 'all' | DesignLintCategory;
  label: string;
}> = [
  { id: 'all', label: 'Wszystkie' },
  { id: 'color', label: 'Kolory' },
  { id: 'spacing', label: 'Odstępy' },
  { id: 'typography', label: 'Tekst' },
];

const CATEGORY_LABEL: Record<DesignLintCategory, string> = {
  color: 'Kolor',
  spacing: 'Odstęp',
  typography: 'Typografia',
};

export function DesignLintPanel({
  selectedId,
  nodes,
  themeVars,
  onSelectNode,
  onFixIssue,
  onFixAll,
}: DesignLintPanelProps) {
  const [filter, setFilter] = useState<'all' | DesignLintCategory>('all');
  const [statusMessage, setStatusMessage] = useState('');

  const report = useMemo(
    () => lintNodeTree(nodes, selectedId, themeVars),
    [nodes, selectedId, themeVars]
  );

  const visibleIssues = useMemo(() => {
    if (filter === 'all') return report.issues;
    return report.issues.filter((issue) => issue.category === filter);
  }, [report.issues, filter]);

  const showTempStatus = (msg: string) => {
    setStatusMessage(msg);
    window.setTimeout(() => setStatusMessage(''), 2400);
  };

  return (
    <section
      aria-label="Design Lint"
      data-testid="design-lint-panel"
      className="space-y-3 p-3 bg-slate-50 rounded-xl border border-slate-200/80"
    >
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <h3 className="text-[11px] font-bold text-slate-600 tracking-wide">
            Design Lint
          </h3>
          <p className="text-[11px] text-slate-500 tabular-nums truncate">
            {report.rootNodeName} · {report.scannedNodeCount} węzłów ·{' '}
            {report.issues.length} uwag
          </p>
        </div>

        <button
          type="button"
          aria-label="Fix All"
          disabled={report.fixableCount === 0}
          onClick={() => {
            const count = onFixAll();
            if (count > 0) {
              showTempStatus(`Naprawiono ${count} niezgodności`);
            }
          }}
          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-slate-900 hover:bg-slate-800 disabled:opacity-40 disabled:hover:bg-slate-900 text-white text-[11px] font-semibold transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        >
          <Wrench className="w-3 h-3" />
          Fix All{report.fixableCount > 0 ? ` (${report.fixableCount})` : ''}
        </button>
      </div>

      {statusMessage && (
        <div
          role="status"
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-medium"
        >
          <Check className="w-3.5 h-3.5 shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}

      {report.issues.length > 0 && (
        <div
          role="group"
          aria-label="Filtruj problemy Design Lint"
          className="flex items-center gap-0.5 p-0.5 bg-slate-200/70 rounded-lg"
        >
          {FILTER_OPTIONS.map((opt) => {
            const count =
              opt.id === 'all'
                ? report.issues.length
                : report.countsByCategory[opt.id];
            const isActive = filter === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                aria-pressed={isActive}
                onClick={() => setFilter(opt.id)}
                className={`flex-1 py-1 px-1.5 rounded-md text-[10px] font-semibold tabular-nums transition-colors whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                  isActive
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {opt.label} ({count})
              </button>
            );
          })}
        </div>
      )}

      {report.issues.length === 0 ? (
        <div
          data-testid="design-lint-clean"
          className="p-2.5 bg-white border border-slate-200 rounded-lg space-y-2"
        >
          <div className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
            <div className="space-y-0.5">
              <span className="block text-[11px] font-semibold text-slate-800">
                Brak niezgodności w poddrzewie
              </span>
              <span className="block text-[10px] text-slate-500 leading-relaxed">
                Wszystkie kolory, odstępy i rozmiary fontów są spójne z motywem.
              </span>
            </div>
          </div>
          {report.rootNodeId !== 'root' && (
            <button
              type="button"
              onClick={() => onSelectNode('root')}
              className="w-full inline-flex items-center justify-center gap-1 px-2.5 py-1.5 bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 text-slate-700 hover:text-blue-700 text-[11px] font-medium rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              <Sparkles className="w-3 h-3" />
              Skanuj całe płótno (Root)
            </button>
          )}
        </div>
      ) : visibleIssues.length === 0 ? (
        <div className="p-2.5 bg-white border border-slate-200 rounded-lg text-[11px] text-slate-500 text-center">
          Brak uwag w wybranej kategorii.
        </div>
      ) : (
        <div className="divide-y divide-slate-200 border border-slate-200 rounded-lg bg-white max-h-60 overflow-y-auto">
          {visibleIssues.map((issue) => (
            <div
              key={issue.id}
              data-testid={`design-lint-issue-${issue.token}`}
              className="p-2.5 space-y-1.5"
            >
              <div className="flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => onSelectNode(issue.nodeId)}
                  className="text-[11px] font-semibold text-slate-800 hover:text-blue-700 truncate text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded"
                >
                  {issue.nodeName}
                  <span className="text-[10px] font-normal text-slate-400">
                    {' '}
                    · {CATEGORY_LABEL[issue.category]}
                  </span>
                </button>

                {issue.replacement && (
                  <button
                    type="button"
                    aria-label={`Napraw ${issue.token} w ${issue.nodeName}`}
                    onClick={() => {
                      onFixIssue(issue);
                      showTempStatus(`Naprawiono ${issue.token}`);
                    }}
                    className="px-2 py-0.5 rounded bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 text-[10px] font-semibold whitespace-nowrap shrink-0 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                  >
                    Napraw
                  </button>
                )}
              </div>

              <div className="flex items-center gap-1.5 text-[10px] font-mono flex-wrap">
                <span className="text-red-600 line-through">{issue.token}</span>
                {issue.replacement && (
                  <>
                    <span className="text-slate-400" aria-hidden="true">
                      →
                    </span>
                    <span className="text-emerald-700 font-semibold break-all">
                      {issue.replacement}
                    </span>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
