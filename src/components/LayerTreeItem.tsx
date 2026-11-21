import { memo, useEffect, useRef, useState } from 'react';
import {
  ChevronDown,
  ChevronRight,
  Eye,
  EyeOff,
  MessageSquare,
} from 'lucide-react';
import type { NodesMap } from '../types/editor';
import { isNodeHiddenInTree } from '../utils/editorLogic';
import { getNodeComments } from '../utils/nodeComments';

interface LayerTreeItemProps {
  id: string;
  nodes: NodesMap;
  selectedId: string;
  selectedIds: string[];
  depth?: number;
  highlightedNodeId?: string | null;
  matchingSearchIds?: ReadonlySet<string>;
  onSelect: (id: string, additive?: boolean) => void;
  onToggleVisibility: (id: string) => void;
}

export const LayerTreeItem = memo(function LayerTreeItem({
  id,
  nodes,
  selectedId,
  selectedIds,
  depth = 0,
  highlightedNodeId,
  matchingSearchIds,
  onSelect,
  onToggleVisibility,
}: LayerTreeItemProps) {
  const [expanded, setExpanded] = useState(true);
  const rowRef = useRef<HTMLDivElement | null>(null);
  const node = nodes[id];
  if (!node) return null;

  const hasChildren = Boolean(node.children && node.children.length > 0);
  const isSelected = selectedId === id || selectedIds.includes(id);
  const isHighlighted = highlightedNodeId === id;
  const isSearchMatch = Boolean(matchingSearchIds && matchingSearchIds.has(id));
  const isRoot = id === 'root';
  const isSelfHidden = Boolean(node.hidden);
  const isEffectivelyHidden = !isRoot && isNodeHiddenInTree(nodes, id);
  const isInheritedHidden = isEffectivelyHidden && !isSelfHidden;
  const comments = getNodeComments(node);
  const latestComment = comments[comments.length - 1];
  const label = node.name.trim() || node.type;
  const metaParts: string[] = [node.type];
  if (node.variant) {
    metaParts.push(node.variant);
  }
  if (hasChildren) {
    metaParts.push(String(node.children.length));
  }
  const metadata = metaParts.join(' · ');

  useEffect(() => {
    if (isHighlighted && rowRef.current) {
      rowRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [isHighlighted]);

  return (
    <div>
      <div
        ref={rowRef}
        data-testid={`layer-item-${id}`}
        data-layer-hidden={isEffectivelyHidden ? 'true' : undefined}
        data-layer-highlighted={isHighlighted ? 'true' : undefined}
        data-layer-search-match={isSearchMatch ? 'true' : undefined}
        style={{ paddingLeft: `${depth * 14 + 6}px` }}
        className={`flex items-center gap-1 py-1 pr-1.5 rounded-md text-xs transition-colors ${
          isHighlighted
            ? 'bg-amber-50 text-amber-900 font-semibold ring-1 ring-amber-400'
            : isSelected
              ? 'bg-blue-50 text-blue-700 font-semibold'
              : isSearchMatch
                ? 'bg-amber-50/60 text-slate-800'
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
          className={`flex-1 min-w-0 flex items-center justify-between gap-1.5 py-0.5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded ${
            isEffectivelyHidden ? 'opacity-50' : ''
          }`}
        >
          <span className={`truncate ${isEffectivelyHidden ? 'line-through' : ''}`}>
            {label}
          </span>
          <span className="flex items-center gap-1 shrink-0">
            {comments.length > 0 && (
              <span
                data-testid={`layer-comment-badge-${id}`}
                data-comment-count={comments.length}
                title={`Notatki (${comments.length}): ${latestComment?.text || ''}`}
                className="inline-flex items-center gap-0.5 px-1 py-0.5 rounded bg-amber-50 border border-amber-200 text-amber-700 text-[9px] font-semibold tabular-nums"
              >
                <MessageSquare className="w-2.5 h-2.5" aria-hidden="true" />
                <span>{comments.length}</span>
              </span>
            )}
            <span className="text-[10px] text-slate-400 font-mono tabular-nums">
              {metadata}
            </span>
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
              highlightedNodeId={highlightedNodeId}
              matchingSearchIds={matchingSearchIds}
              onSelect={onSelect}
              onToggleVisibility={onToggleVisibility}
            />
          ))}
        </div>
      )}
    </div>
  );
});
