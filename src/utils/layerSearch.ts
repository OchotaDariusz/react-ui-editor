import type { NodesMap, NodeType } from '../types/editor';
import { isNodeHiddenInTree, normalizeSearchText } from './editorLogic';
import { getNodeComments } from './nodeComments';

export interface LayerSearchMatch {
  id: string;
  name: string;
  type: NodeType;
  depth: number;
  pathLabel: string;
  hidden: boolean;
  commentCount: number;
}

export function searchNodesByName(
  nodes: NodesMap,
  query: string
): LayerSearchMatch[] {
  const normalizedQuery = normalizeSearchText(query);
  if (!nodes.root) return [];

  const results: LayerSearchMatch[] = [];
  const visited = new Set<string>();

  const walk = (nodeId: string, depth: number, ancestors: string[]) => {
    if (visited.has(nodeId)) return;
    visited.add(nodeId);

    const node = nodes[nodeId];
    if (!node) return;

    const displayName = node.name.trim() || node.type;
    const normalizedName = normalizeSearchText(displayName);
    const normalizedType = normalizeSearchText(node.type);

    const matches =
      normalizedQuery.length === 0 ||
      normalizedName.includes(normalizedQuery) ||
      normalizedType.includes(normalizedQuery);

    if (matches) {
      results.push({
        id: node.id,
        name: displayName,
        type: node.type,
        depth,
        pathLabel: ancestors.length > 0 ? ancestors.join(' › ') : 'Root',
        hidden: node.id !== 'root' && isNodeHiddenInTree(nodes, node.id),
        commentCount: getNodeComments(node).length,
      });
    }

    for (const childId of node.children || []) {
      walk(childId, depth + 1, [...ancestors, displayName]);
    }
  };

  walk('root', 0, []);

  if (normalizedQuery.length === 0) {
    return results;
  }

  // Rank exact/prefix name matches first while keeping deterministic tree order
  return [...results].sort((a, b) => {
    const aNorm = normalizeSearchText(a.name);
    const bNorm = normalizeSearchText(b.name);
    const aScore = aNorm === normalizedQuery ? 0 : aNorm.startsWith(normalizedQuery) ? 1 : aNorm.includes(normalizedQuery) ? 2 : 3;
    const bScore = bNorm === normalizedQuery ? 0 : bNorm.startsWith(normalizedQuery) ? 1 : bNorm.includes(normalizedQuery) ? 2 : 3;
    return aScore - bScore;
  });
}
