import { memo, useState } from 'react';
import { ChevronDown, ChevronRight, Eye, EyeOff } from 'lucide-react';
import type { NodesMap } from '../types/editor';
import { isNodeHiddenInTree } from '../utils/editorLogic';

interface LayerTreeItemProps {
  id: string;
  nodes: NodesMap;
  selectedId: string;
  selectedIds: string[];
  depth?: number;
  onSelect: (id: string, additive?: boolean) => void;
  onToggleVisibility: (id: string) => void;
}

export const LayerTreeItem = memo(function LayerTreeItem({
  id,
  nodes,
  selectedId,
  selectedIds,
  depth = 0,
  onSelect,
  onToggleVisibility,
}: LayerTreeItemProps) {
  const [expanded, setExpanded] = useState(true);
  const node = nodes[id];
  if (!node) return null;

  const hasChildren = Boolean(node.children && node.children.length > 0);
  const isSelected = selectedId === id || selectedIds.includes(id);
  const isRoot = id === 'root';
  const isSelfHidden = Boolean(node.hidden);
  const isEffectivelyHidden = !isRoot && isNodeHiddenInTree(nodes, id);
  const isInheritedHidden = isEffectivelyHidden && !isSelfHidden;
  const label = node.name.trim() || node.type;
  const metaParts: string[] = [node.type];
  if (node.variant) {
    metaParts.push(node.variant);
  }
  if (hasChildren) {
    metaParts.push(String(node.children.length));
  }
  const metadata = metaParts.join(' · ');

  return (
    <div>
      <div
        style={{ paddingLeft: `${depth * 14 + 6}px` }}
        data-layer-hidden={isEffectivelyHidden ? 'true' : undefined}
        className={`flex items-center gap-1 py-1 pr-1.5 rounded-md text-xs transition-colors ${
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
          onClick={(e) => onSelect(id, e.shiftKey || e.ctrlKey || e.metaKey)}
          className={`flex-1 min-w-0 flex items-center justify-between gap-2 py-0.5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded ${
            isEffectivelyHidden ? 'opacity-50' : ''
          }`}
        >
          <span className={`truncate ${isEffectivelyHidden ? 'line-through' : ''}`}>
            {label}
          </span>
          <span className="text-[10px] text-slate-400 font-mono tabular-nums shrink-0">
            {metadata}
          </span>
        </button>

        {!isRoot && (
          <button
            type="button"
            data-testid={`layer-visibility-toggle-${id}`}
            aria-label={isSelfHidden ? `Pokaż ${label}` : `Ukryj ${label}`}
            aria-pressed={isSelfHidden}
            title={
              isSelfHidden
                ? 'Pokaż element na płótnie'
                : isInheritedHidden
                  ? 'Ukryto przez element nadrzędny'
                  : 'Ukryj element na płótnie'
            }
            onClick={(e) => {
              e.stopPropagation();
              onToggleVisibility(id);
            }}
            className={`p-1 rounded shrink-0 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
              isSelfHidden
                ? 'text-amber-600 bg-amber-50 hover:bg-amber-100'
                : isInheritedHidden
                  ? 'text-slate-400 opacity-60 hover:opacity-100 hover:bg-slate-200'
                  : 'text-slate-400 hover:text-slate-700 hover:bg-slate-200'
            }`}
          >
            {isEffectivelyHidden ? (
              <EyeOff className="w-3.5 h-3.5" aria-hidden="true" />
            ) : (
              <Eye className="w-3.5 h-3.5" aria-hidden="true" />
            )}
          </button>
        )}
      </div>

      {hasChildren && expanded && (
        <div>
          {node.children.map((childId) => (
            <LayerTreeItem
              key={childId}
              id={childId}
              nodes={nodes}
              selectedId={selectedId}
              selectedIds={selectedIds}
              depth={depth + 1}
              onSelect={onSelect}
              onToggleVisibility={onToggleVisibility}
            />
          ))}
        </div>
      )}
    </div>
  );
});
