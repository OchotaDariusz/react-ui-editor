export type NodeType =
  | 'Container'
  | 'Grid'
  | 'Heading'
  | 'Text'
  | 'Button'
  | 'Badge'
  | 'Input'
  | 'Image';

export interface NodeProps {
  className?: string;
  placeholder?: string;
  src?: string;
  [key: string]: string | undefined;
}

export interface EditorNode {
  id: string;
  type: NodeType;
  name: string;
  content?: string;
  parentId: string | null;
  props: NodeProps;
  children: string[];
}

export type NodesMap = Record<string, EditorNode>;

export interface HistoryState {
  past: NodesMap[];
  present: NodesMap;
  future: NodesMap[];
}

export type ViewportMode = 'desktop' | 'tablet' | 'mobile';
export type LeftTab = 'components' | 'templates' | 'layers';

export type ThemeVarCategory = 'color' | 'fontSize';

export interface ThemeVariable {
  id: string;
  name: string;
  label: string;
  value: string;
  category: ThemeVarCategory;
}

