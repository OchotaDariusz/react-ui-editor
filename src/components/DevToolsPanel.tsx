import { useEffect, useMemo, useState } from 'react';
import { Check, Copy, X } from 'lucide-react';
import type { EditorNode, NodesMap, ThemeVariable } from '../types/editor';
import {
  buildThemeCssRules,
  generateNodeJSXSnippet,
  parseNodesJson,
  removeTailwindTokenAt,
} from '../utils/editorLogic';

interface DevToolsPanelProps {
  selectedId: string;
  selectedNode: EditorNode | undefined;
  nodes: NodesMap;
  themeVars: ThemeVariable[];
  onUpdateNode: (key: string, value: string, isProp?: boolean) => void;
  onReplaceNodes: (nextNodes: NodesMap) => void;
}

type JsonScope = 'tree' | 'node';

export function DevToolsPanel({
  selectedId,
  selectedNode,
  nodes,
  themeVars,
  onUpdateNode,
  onReplaceNodes,
}: DevToolsPanelProps) {
  const [copiedTarget, setCopiedTarget] = useState<'jsx' | 'css' | 'json' | null>(
    null
  );
  const [jsonScope, setJsonScope] = useState<JsonScope>('tree');
  const [jsonDraft, setJsonDraft] = useState<string>(() =>
    JSON.stringify(nodes, null, 2)
  );
  const [jsonError, setJsonError] = useState<string>('');
  const [jsonDirty, setJsonDirty] = useState<boolean>(false);

  const classTokens = useMemo(
    () => (selectedNode?.props.className || '').split(/\s+/).filter(Boolean),
    [selectedNode]
  );

  const selectedJsx = useMemo(
    () => (selectedNode ? generateNodeJSXSnippet(nodes, selectedId) : ''),
    [nodes, selectedId, selectedNode]
  );

  const themeCss = useMemo(() => buildThemeCssRules(themeVars), [themeVars]);

  const syncedJson = useMemo(
    () =>
      JSON.stringify(
        jsonScope === 'node' && selectedNode ? selectedNode : nodes,
        null,
        2
      ),
    [jsonScope, nodes, selectedNode]
  );

  useEffect(() => {
    if (!jsonDirty) {
      setJsonDraft(syncedJson);
      setJsonError('');
    }
  }, [syncedJson, jsonDirty]);

  const handleCopy = (target: 'jsx' | 'css' | 'json', content: string) => {
    if (!content) return;
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(content).catch(() => {});
    }
    setCopiedTarget(target);
    window.setTimeout(() => {
      setCopiedTarget((curr) => (curr === target ? null : curr));
    }, 1800);
  };

  const handleApplyTreeJson = () => {
    const parsed = parseNodesJson(jsonDraft);
    if (!parsed.ok) {
      setJsonError(parsed.error);
      return;
    }
    setJsonError('');
    setJsonDirty(false);
    onReplaceNodes(parsed.nodes);
  };

  return (
    <div className="p-4 flex-1 overflow-y-auto flex flex-col gap-5">
      <section
        aria-label="Klasy Tailwind CSS"
        className="space-y-2 p-3 bg-slate-50 rounded-xl border border-slate-200/80"
      >
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-[11px] font-bold text-slate-500 tracking-wide">
            Tokeny Tailwind ({classTokens.length})
          </h3>
          {selectedNode && (
            <span className="text-[10px] font-mono text-slate-400 truncate">
              #{selectedNode.id}
            </span>
          )}
        </div>

        {!selectedNode || classTokens.length === 0 ? (
          <p className="text-[11px] text-slate-500">
            Brak przypisanych klas Tailwind.
          </p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {classTokens.map((token, idx) => (
              <span
                key={`${token}-${idx}`}
                className="inline-flex items-center gap-1 pl-2 pr-1 py-0.5 bg-white border border-slate-200 rounded-md text-[11px] font-mono text-slate-700"
              >
                <span>{token}</span>
                <button
                  type="button"
                  aria-label={`Usuń klasę ${token}`}
                  onClick={() => {
                    const updated = removeTailwindTokenAt(
                      selectedNode.props.className || '',
                      idx
                    );
                    onUpdateNode('className', updated, true);
                  }}
                  className="p-0.5 text-slate-400 hover:text-red-600 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        )}
      </section>

      <section
        aria-label="JSX zaznaczonego elementu"
        className="space-y-2 p-3 bg-slate-50 rounded-xl border border-slate-200/80"
      >
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-[11px] font-bold text-slate-500 tracking-wide">
            JSX zaznaczenia
          </h3>
          <button
            type="button"
            disabled={!selectedJsx}
            onClick={() => handleCopy('jsx', selectedJsx)}
            className="inline-flex items-center gap-1 px-2 py-0.5 bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-300 rounded text-[11px] font-medium text-slate-700 hover:text-blue-700 disabled:opacity-40 whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            {copiedTarget === 'jsx' ? (
              <>
                <Check className="w-3 h-3 text-emerald-600" /> Skopiowano
              </>
            ) : (
              <>
                <Copy className="w-3 h-3" /> Kopiuj JSX
              </>
            )}
          </button>
        </div>
        <pre className="p-2.5 bg-slate-900 text-slate-100 rounded-lg text-[11px] font-mono leading-relaxed overflow-x-auto max-h-40 whitespace-pre">
          {selectedJsx || '// Zaznacz element'}
        </pre>
      </section>

      <section
        aria-label="Zmienne motywu CSS"
        className="space-y-2 p-3 bg-slate-50 rounded-xl border border-slate-200/80"
      >
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-[11px] font-bold text-slate-500 tracking-wide">
            Zmienne CSS (:root)
          </h3>
          <button
            type="button"
            disabled={!themeCss}
            onClick={() => handleCopy('css', themeCss)}
            className="inline-flex items-center gap-1 px-2 py-0.5 bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-300 rounded text-[11px] font-medium text-slate-700 hover:text-blue-700 disabled:opacity-40 whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            {copiedTarget === 'css' ? (
              <>
                <Check className="w-3 h-3 text-emerald-600" /> Skopiowano
              </>
            ) : (
              <>
                <Copy className="w-3 h-3" /> Kopiuj CSS
              </>
            )}
          </button>
        </div>
        <pre className="p-2.5 bg-slate-900 text-slate-100 rounded-lg text-[11px] font-mono leading-relaxed overflow-x-auto max-h-36 whitespace-pre">
          {themeCss || '/* Brak zdefiniowanych zmiennych motywu */'}
        </pre>
      </section>

      <section
        aria-label="Inspektor JSON drzewa"
        className="space-y-2 p-3 bg-slate-50 rounded-xl border border-slate-200/80"
      >
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-[11px] font-bold text-slate-500 tracking-wide">
            JSON drzewa
          </h3>
          <div className="flex items-center gap-1">
            <button
              type="button"
              aria-pressed={jsonScope === 'tree'}
              onClick={() => {
                setJsonScope('tree');
                setJsonDirty(false);
                setJsonError('');
              }}
              className={`px-2 py-0.5 rounded text-[10px] font-semibold border whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                jsonScope === 'tree'
                  ? 'bg-blue-50 border-blue-300 text-blue-700'
                  : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900'
              }`}
            >
              Drzewo
            </button>
            <button
              type="button"
              aria-pressed={jsonScope === 'node'}
              onClick={() => {
                setJsonScope('node');
                setJsonDirty(false);
                setJsonError('');
              }}
              className={`px-2 py-0.5 rounded text-[10px] font-semibold border whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                jsonScope === 'node'
                  ? 'bg-blue-50 border-blue-300 text-blue-700'
                  : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900'
              }`}
            >
              Węzeł
            </button>
          </div>
        </div>

        <textarea
          aria-label="Edytor JSON drzewa"
          readOnly={jsonScope === 'node'}
          value={jsonDraft}
          onChange={(e) => {
            setJsonDraft(e.target.value);
            setJsonDirty(true);
            if (jsonError) setJsonError('');
          }}
          rows={8}
          className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-[11px] font-mono text-slate-800 leading-relaxed focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
        />

        {jsonError && (
          <p role="alert" className="text-[11px] font-medium text-red-600">
            {jsonError}
          </p>
        )}

        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => handleCopy('json', jsonDraft)}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-300 rounded-md text-[11px] font-medium text-slate-700 hover:text-blue-700 whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            {copiedTarget === 'json' ? (
              <>
                <Check className="w-3 h-3 text-emerald-600" /> Skopiowano
              </>
            ) : (
              <>
                <Copy className="w-3 h-3" /> Kopiuj JSON
              </>
            )}
          </button>

          {jsonScope === 'tree' && (
            <div className="flex items-center gap-1.5">
              {jsonDirty && (
                <button
                  type="button"
                  onClick={() => {
                    setJsonDraft(syncedJson);
                    setJsonDirty(false);
                    setJsonError('');
                  }}
                  className="px-2 py-1.5 text-[11px] font-medium text-slate-600 hover:text-slate-900 whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded"
                >
                  Resetuj
                </button>
              )}
              <button
                type="button"
                onClick={handleApplyTreeJson}
                className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-md text-[11px] font-semibold whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              >
                Zastosuj JSON
              </button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
