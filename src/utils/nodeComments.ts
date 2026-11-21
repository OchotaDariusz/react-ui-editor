import type { EditorNode, NodeComment, NodesMap } from '../types/editor';
import { generateId } from './editorLogic';

export function getNodeComments(node: EditorNode | undefined): NodeComment[] {
  if (!node || !Array.isArray(node.comments)) return [];
  return node.comments.filter(
    (c): c is NodeComment =>
      Boolean(c) &&
      typeof c.id === 'string' &&
      typeof c.text === 'string' &&
      c.text.trim().length > 0 &&
      typeof c.createdAt === 'number'
  );
}

export function addNodeCommentInTree(
  nodes: NodesMap,
  nodeId: string,
  text: string,
  idFactory: () => string = generateId,
  createdAt: number = Date.now()
): NodesMap {
  const target = nodes[nodeId];
  const trimmed = text.trim();
  if (!target || !trimmed) return nodes;

  const nextComment: NodeComment = {
    id: idFactory(),
    text: trimmed,
    createdAt,
  };

  const existing = getNodeComments(target);
  return {
    ...nodes,
    [nodeId]: {
      ...target,
      comments: [...existing, nextComment],
    },
  };
}

export function deleteNodeCommentInTree(
  nodes: NodesMap,
  nodeId: string,
  commentId: string
): NodesMap {
  const target = nodes[nodeId];
  if (!target) return nodes;

  const existing = getNodeComments(target);
  const filtered = existing.filter((c) => c.id !== commentId);
  if (filtered.length === existing.length) return nodes;

  const nextNode: EditorNode = { ...target };
  if (filtered.length > 0) {
    nextNode.comments = filtered;
  } else {
    delete nextNode.comments;
  }

  return {
    ...nodes,
    [nodeId]: nextNode,
  };
}
