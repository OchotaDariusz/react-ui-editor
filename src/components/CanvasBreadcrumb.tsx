import { ChevronRight, Home } from 'lucide-react';
import type { NodesMap } from '../types/editor';
import { getNodeBreadcrumbPath } from '../utils/editorLogic';

interface CanvasBreadcrumbProps {
  nodes: NodesMap;
  selectedId: string;
  onSelectNode: (id: string) => void;
}

export function CanvasBreadcrumb({
  nodes,
  selectedId,
  onSelectNode,
}: CanvasBreadcrumbProps) {
  const path = getNodeBreadcrumbPath(nodes, selectedId);

  if (path.length === 0) return null;

  return (
    <nav
      aria-label="Ścieżka elementu"
      className="h-9 px-4 bg-white border-b border-slate-200 flex items-center gap-1.5 overflow-x-auto shrink-0"
    >
      <ol className="flex items-center gap-1 min-w-0">
        {path.map((node, index) => {
          const isLast = index === path.length - 1;
          const displayName = node.name?.trim() || node.type;
          const showTypeHint = displayName !== node.type;

          return (
            <li key={node.id} className="flex items-center gap-1 shrink-0">
              {index > 0 && (
                <ChevronRight
                  className="w-3.5 h-3.5 text-slate-300 shrink-0"
                  aria-hidden="true"
                />
              )}
              <button
                type="button"
                onClick={() => onSelectNode(node.id)}
                aria-current={isLast ? 'location' : undefined}
                title={`${displayName} (${node.type})`}
                className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs transition-colors whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                  isLast
                    ? 'bg-blue-50 text-blue-700 border border-blue-200 font-semibold'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 font-medium border border-transparent'
                }`}
              >
                {node.id === 'root' && (
                  <Home className="w-3 h-3 shrink-0" aria-hidden="true" />
                )}
                <span>{displayName}</span>
                {showTypeHint && (
                  <span
                    className={`text-[10px] font-mono ${
                      isLast ? 'text-blue-500' : 'text-slate-400'
                    }`}
                  >
                    {node.type}
                  </span>
                )}
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
