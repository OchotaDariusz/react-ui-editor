import { memo, useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import type { NodesMap } from '../types/editor';

interface LayerTreeItemProps {
  id: string;
  nodes: NodesMap;
  selectedId: string;
  depth?: number;
  onSelect: (id: string) => void;
}

export const LayerTreeItem = memo(function LayerTreeItem({
  id,
  nodes,
  selectedId,
  depth = 0,
  onSelect,
}: LayerTreeItemProps) {
  const [expanded, setExpanded] = useState(true);
  const node = nodes[id];
  if (!node) return null;

  const hasChildren = Boolean(node.children && node.children.length > 0);
  const isSelected = selectedId === id;
  const label = node.name.trim() || node.type;
  const metadata = hasChildren
    ? `${node.type} · ${node.children.length}`
    : node.type;

  return (
    <div>
      <div
        style={{ paddingLeft: `${depth * 14 + 6}px` }}
        className={`flex items-center gap-1 py-1 pr-2 rounded-md text-xs transition-colors ${
          isSelected
            ? 'bg-blue-50 text-blue-700 font-semibold'
            : 'text-slate-700 hover:bg-slate-100'
        }`}
      >
        {hasChildren ? (
          <button
            type="button"
            aria-label={expanded ? `Zwiń ${label}` : `Rozwiń ${label}`}
            aria-expanded={expanded}
            onClick={() => setExpanded((prev) => !prev)}
            className="p-0.5 hover:bg-slate-200 rounded shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            {expanded ? (
              <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
            )}
          </button>
        ) : (
          <span className="w-4 shrink-0 inline-block" aria-hidden="true" />
        )}

        <button
          type="button"
          onClick={() => onSelect(id)}
          className="flex-1 min-w-0 flex items-center justify-between gap-2 py-0.5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded"
        >
          <span className="truncate">{label}</span>
          <span className="text-[10px] text-slate-400 font-mono tabular-nums shrink-0">
            {metadata}
          </span>
        </button>
      </div>

      {hasChildren && expanded && (
        <div>
          {node.children.map((childId) => (
            <LayerTreeItem
              key={childId}
              id={childId}
              nodes={nodes}
              selectedId={selectedId}
              depth={depth + 1}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
});
