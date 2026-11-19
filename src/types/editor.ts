export type NodeType =
  | 'Container'
  | 'Grid'
  | 'Heading'
  | 'Text'
  | 'Button'
  | 'Badge'
  | 'Input'
  | 'Image'
  | 'Icon';

export interface NodeProps {
  className?: string;
  placeholder?: string;
  src?: string;
  iconName?: string;
  [key: string]: string | undefined;
}

export interface EditorNode {
  id: string;
  type: NodeType;
  name: string;
  variant?: string;
  content?: string;
  parentId: string | null;
  props: NodeProps;
  themeOverrides?: Record<string, string>;
  children: string[];
}

export type NodesMap = Record<string, EditorNode>;

export interface HistoryState {
  past: NodesMap[];
  present: NodesMap;
  future: NodesMap[];
}

export type ViewportMode = 'desktop' | 'tablet' | 'mobile';
export type LeftTab =
  | 'components'
  | 'icons'
  | 'templates'
  | 'saved'
  | 'assets'
  | 'history'
  | 'layers';

export type AssetKind = 'image' | 'icon';

export interface ImportedAsset {
  id: string;
  name: string;
  kind: AssetKind;
  mimeType: string;
  dataUrl: string;
  sizeBytes: number;
  createdAt: number;
}

export interface NodeBlueprint {
  type: NodeType;
  name: string;
  variant?: string;
  content?: string;
  props: NodeProps;
  themeOverrides?: Record<string, string>;
  children?: NodeBlueprint[];
}

export interface SavedComponentEntry {
  id: string;
  name: string;
  nodeType: NodeType;
  variant?: string;
  classNameSummary: string;
  nodeCount: number;
  createdAt: number;
  snapshot: NodeBlueprint;
}

export type ComponentHistoryEventType = 'added' | 'deleted';

export interface ComponentHistoryEntry {
  historyId: string;
  eventType: ComponentHistoryEventType;
  timestamp: number;
  rootNodeId: string;
  label: string;
  nodeType: NodeType;
  variant?: string;
  classNameSummary: string;
  nodeCount: number;
  snapshot: NodeBlueprint;
}

export interface RecentComponentSearch {
  type: NodeType | 'CardPreset';
  label: string;
  query: string;
  timestamp: number;
}

export type ThemeVarCategory = 'color' | 'fontSize';

export interface ThemeVariable {
  id: string;
  name: string;
  label: string;
  value: string;
  category: ThemeVarCategory;
}

export interface SeoMetadata {
  title: string;
  description: string;
  canonicalUrl: string;
}

export type SeoPreviewDeviceMode = 'desktop' | 'mobile';

export type ExportFormat = 'react' | 'html' | 'svg' | 'pdf';

export type InspectorTab = 'properties' | 'grid-layout' | 'devtools' | 'shortcuts';

export type KeyboardShortcutCategory = 'selection' | 'editing' | 'history' | 'view';

export interface KeyboardShortcutItem {
  id: string;
  action: string;
  description: string;
  keys: string[];
  category: KeyboardShortcutCategory;
}

export interface ThemePreset {
  id: string;
  name: string;
  description: string;
  variables: ThemeVariable[];
}

export const DND_ITEM_TYPE = 'CANVAS_NODE' as const;
export const DND_NEW_COMPONENT_TYPE = 'NEW_COMPONENT' as const;
export const DND_NEW_CARD_PRESET_TYPE = 'NEW_CARD_PRESET' as const;
export const DND_NEW_ICON_TYPE = 'NEW_ICON' as const;
export const DND_SAVED_COMPONENT_TYPE = 'SAVED_COMPONENT' as const;
export const DND_ASSET_TYPE = 'ASSET_ITEM' as const;
