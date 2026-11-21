import React, { memo, useCallback, useEffect, useRef, useState } from 'react';
import { useDrag, useDrop } from 'react-dnd';
import { ArrowLeft, GripVertical, Image as ImageIcon, Layers } from 'lucide-react';
import {
  DND_ASSET_TYPE,
  DND_ITEM_TYPE,
  DND_NEW_CARD_PRESET_TYPE,
  DND_NEW_COMPONENT_TYPE,
  DND_NEW_ICON_TYPE,
  DND_SAVED_COMPONENT_TYPE,
  type EditorNode,
  type ImportedAsset,
  type NodeBlueprint,
  type NodesMap,
  type NodeType,
  type ThemeVariable,
} from '../types/editor';
import { getLucideIcon } from '../constants/lucideIcons';
import { MaterialMuiNodeView } from './MaterialNodeRenderer';
import {
  isContainerNodeType,
  isDescendantOrSelf,
  isNodeHiddenInTree,
  splitIconClasses,
  splitOuterLayoutClasses,
  type DropPosition,
} from '../utils/editorLogic';

interface DragItem {
  id?: string;
  parentId?: string | null;
  type?: NodeType;
  newComponentType?: NodeType;
  isCardPreset?: boolean;
  iconName?: string;
  savedBlueprint?: NodeBlueprint;
  asset?: ImportedAsset;
}

interface CanvasNodeProps {
  id: string;
  nodes: NodesMap;
  selectedId: string;
  selectedIds: string[];
  previewMode: boolean;
  showGuides: boolean;
  highlightedNodeId?: string | null;
  matchingSearchIds?: ReadonlySet<string>;
  themeVars?: ThemeVariable[];
  onSelect: (id: string, additive?: boolean) => void;
  onMoveNode: (dragId: string, targetId: string, position: DropPosition) => void;
  onDropNewComponent?: (
    nodeType: NodeType,
    targetId: string,
    position: DropPosition
  ) => void;
  onDropCardPreset?: (targetId: string, position: DropPosition) => void;
  onDropNewIcon: (iconName: string, targetId: string, position: DropPosition) => void;
  onDropSavedComponent: (
    blueprint: NodeBlueprint,
    targetId: string,
    position: DropPosition
  ) => void;
  onDropAsset: (
    asset: ImportedAsset,
    targetId: string,
    position: DropPosition
  ) => void;
}

function isHorizontalLayout(parentNode: EditorNode | undefined): boolean {
  const cls = parentNode?.props?.className || '';
  const tokens = cls.split(/\s+/);
  return tokens.some(
    (t) => t === 'flex-row' || t.startsWith('grid-cols-')
  );
}

function computeDropPosition(
  clientOffset: { x: number; y: number } | null,
  rect: DOMRect,
  node: EditorNode,
  parentNode: EditorNode | undefined
): DropPosition {
  if (node.id === 'root') return 'inside';
  if (!clientOffset) {
    return isContainerNodeType(node.type) ? 'inside' : 'after';
  }

  const horizontal = isHorizontalLayout(parentNode);

  if (isContainerNodeType(node.type)) {
    const ratio = horizontal
      ? (clientOffset.x - rect.left) / Math.max(rect.width, 1)
      : (clientOffset.y - rect.top) / Math.max(rect.height, 1);

    if (ratio < 0.22) return 'before';
    if (ratio > 0.78) return 'after';
    return 'inside';
  }

  if (horizontal) {
    const middleX = rect.left + rect.width / 2;
    return clientOffset.x < middleX ? 'before' : 'after';
  }

  const middleY = rect.top + rect.height / 2;
  return clientOffset.y < middleY ? 'before' : 'after';
}

export const CanvasNode = memo(function CanvasNode({
  id,
  nodes,
  selectedId,
  selectedIds,
  previewMode,
  showGuides,
  highlightedNodeId,
  matchingSearchIds,
  themeVars,
  onSelect,
  onMoveNode,
  onDropNewComponent,
  onDropCardPreset,
  onDropNewIcon,
  onDropSavedComponent,
  onDropAsset,
}: CanvasNodeProps) {
  const node = nodes[id];
  const parentNode = node?.parentId ? nodes[node.parentId] : undefined;
  const elementRef = useRef<HTMLElement | null>(null);
  const [imgError, setImgError] = useState(false);
  const [dropPosition, setDropPosition] = useState<DropPosition | null>(null);

  const src = node?.props?.src;
  useEffect(() => {
    setImgError(false);
  }, [src]);

  useEffect(() => {
    if (!previewMode && highlightedNodeId === id && elementRef.current) {
      elementRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
        inline: 'nearest',
      });
    }
  }, [highlightedNodeId, id, previewMode]);

  const [{ isDragging }, drag] = useDrag<
    DragItem,
    void,
    { isDragging: boolean }
  >(
    () => ({
      type: DND_ITEM_TYPE,
      item: () => ({
        id,
        parentId: node?.parentId ?? null,
        type: node?.type ?? 'Container',
      }),
      canDrag: () => !previewMode && id !== 'root',
      collect: (monitor) => ({
        isDragging: monitor.isDragging(),
      }),
    }),
    [id, node?.parentId, node?.type, previewMode]
  );

  const [{ isOverShallow }, drop] = useDrop<
    DragItem,
    void,
    { isOverShallow: boolean }
  >(
    () => ({
      accept: [
        DND_ITEM_TYPE,
        DND_NEW_COMPONENT_TYPE,
        DND_NEW_CARD_PRESET_TYPE,
        DND_NEW_ICON_TYPE,
        DND_SAVED_COMPONENT_TYPE,
        DND_ASSET_TYPE,
      ],
      canDrop: (item, monitor) => {
        if (previewMode || !node) return false;
        const itemType = monitor.getItemType();
        if (itemType === DND_NEW_COMPONENT_TYPE) {
          return Boolean(item.newComponentType);
        }
        if (itemType === DND_NEW_CARD_PRESET_TYPE) {
          return Boolean(item.isCardPreset);
        }
        if (itemType === DND_NEW_ICON_TYPE) {
          return Boolean(item.iconName);
        }
        if (itemType === DND_SAVED_COMPONENT_TYPE) {
          return Boolean(item.savedBlueprint);
        }
        if (itemType === DND_ASSET_TYPE) {
          return Boolean(item.asset);
        }
        if (!item.id || item.id === id) return false;
        if (isDescendantOrSelf(nodes, id, item.id)) return false;
        return true;
      },
      hover: (item, monitor) => {
        if (!monitor.isOver({ shallow: true }) || !node) {
          setDropPosition(null);
          return;
        }
        const itemType = monitor.getItemType();
        const isPaletteItem =
          itemType === DND_NEW_COMPONENT_TYPE ||
          itemType === DND_NEW_CARD_PRESET_TYPE ||
          itemType === DND_NEW_ICON_TYPE ||
          itemType === DND_SAVED_COMPONENT_TYPE ||
          itemType === DND_ASSET_TYPE;
        if (
          !isPaletteItem &&
          (!item.id || item.id === id || isDescendantOrSelf(nodes, id, item.id))
        ) {
          setDropPosition(null);
          return;
        }
        const el = elementRef.current;
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const pos = computeDropPosition(
          monitor.getClientOffset(),
          rect,
          node,
          parentNode
        );
        setDropPosition((curr) => (curr === pos ? curr : pos));
      },
      drop: (item, monitor) => {
        if (monitor.didDrop() || !node) return;
        const itemType = monitor.getItemType();
        const isNewComponent = itemType === DND_NEW_COMPONENT_TYPE;
        const isCardPreset = itemType === DND_NEW_CARD_PRESET_TYPE;
        const isNewIcon = itemType === DND_NEW_ICON_TYPE;
        const isSavedComponent = itemType === DND_SAVED_COMPONENT_TYPE;
        const isAsset = itemType === DND_ASSET_TYPE;
        if (
          !isNewComponent &&
          !isCardPreset &&
          !isNewIcon &&
          !isSavedComponent &&
          !isAsset &&
          (!item.id || item.id === id || isDescendantOrSelf(nodes, id, item.id))
        ) {
          return;
        }

        const el = elementRef.current;
        const pos = el
          ? computeDropPosition(
              monitor.getClientOffset(),
              el.getBoundingClientRect(),
              node,
              parentNode
            )
          : dropPosition || (isContainerNodeType(node.type) ? 'inside' : 'after');

        setDropPosition(null);
        if (isNewComponent && item.newComponentType) {
          onDropNewComponent?.(item.newComponentType, id, pos);
        } else if (isCardPreset && item.isCardPreset) {
          onDropCardPreset?.(id, pos);
        } else if (isNewIcon && item.iconName) {
          onDropNewIcon(item.iconName, id, pos);
        } else if (isSavedComponent && item.savedBlueprint) {
          onDropSavedComponent(item.savedBlueprint, id, pos);
        } else if (isAsset && item.asset) {
          onDropAsset(item.asset, id, pos);
        } else if (item.id) {
          onMoveNode(item.id, id, pos);
        }
      },
      collect: (monitor) => ({
        isOverShallow: monitor.isOver({ shallow: true }),
      }),
    }),
    [
      id,
      node,
      parentNode,
      nodes,
      previewMode,
      dropPosition,
      onMoveNode,
      onDropNewComponent,
      onDropCardPreset,
      onDropNewIcon,
      onDropSavedComponent,
      onDropAsset,
    ]
  );

  useEffect(() => {
    if (!isOverShallow && dropPosition !== null) {
      setDropPosition(null);
    }
  }, [isOverShallow, dropPosition]);

  const attachRef = useCallback(
    (el: HTMLElement | null) => {
      elementRef.current = el;
      if (previewMode) {
        drag(null);
        drop(null);
        return;
      }
      if (id !== 'root') {
        drag(el);
      } else {
        drag(null);
      }
      drop(el);
    },
    [drag, drop, id, previewMode]
  );

  if (!node) return null;
  if (id !== 'root' && isNodeHiddenInTree(nodes, id)) return null;

  const isSelected = !previewMode && (selectedId === id || selectedIds.includes(id));
  const isMultiSelected = !previewMode && selectedIds.length > 1 && selectedIds.includes(id);
  const isSearchHighlighted = !previewMode && highlightedNodeId === id;
  const isSearchMatch = !previewMode && Boolean(matchingSearchIds?.has(id));
  const isRoot = id === 'root';
  const horizontal = isHorizontalLayout(parentNode);

  const handleClick = (e: React.MouseEvent) => {
    if (previewMode) return;
    e.stopPropagation();
    onSelect(id, e.shiftKey || e.ctrlKey || e.metaKey);
  };

  const canShowDragHandle = !previewMode && !isRoot;

  const editorOutlineClass = previewMode
    ? ''
    : isSearchHighlighted
      ? 'ring-2 ring-amber-400 ring-offset-2 shadow-[0_0_0_4px_rgba(251,191,36,0.28)] relative z-20 cursor-grab active:cursor-grabbing'
      : isMultiSelected
        ? 'ring-2 ring-violet-500 ring-offset-1 relative z-10 cursor-grab active:cursor-grabbing'
        : isSelected
          ? isRoot
            ? 'ring-2 ring-inset ring-blue-500 rounded-2xl relative z-10'
            : 'ring-2 ring-blue-500 ring-offset-1 relative z-10 cursor-grab active:cursor-grabbing'
          : isSearchMatch
            ? 'ring-1 ring-amber-300 relative z-10 transition-shadow duration-150 cursor-grab active:cursor-grabbing'
            : isRoot
              ? 'relative transition-shadow duration-150 cursor-pointer'
              : 'hover:ring-1 hover:ring-blue-300 relative transition-shadow duration-150 cursor-grab active:cursor-grabbing';

  const hoverDragHandleClass =
    canShowDragHandle && !isDragging
      ? '[&:hover:not(:has([data-node-id]:hover))>[data-drag-handle]]:opacity-100 [&:hover:not(:has([data-node-id]:hover))>[data-drag-handle]]:pointer-events-auto'
      : '';

  const dragStateClass = !previewMode && isDragging ? 'opacity-40' : '';

  const dropIndicatorClass =
    !previewMode && isOverShallow && dropPosition
      ? dropPosition === 'inside'
        ? isRoot
          ? 'ring-2 ring-inset ring-blue-500 bg-blue-50/30 rounded-2xl'
          : 'ring-2 ring-blue-500 bg-blue-50/40'
        : dropPosition === 'before'
          ? horizontal
            ? 'shadow-[-3px_0_0_0_#2563eb]'
            : 'shadow-[0_-3px_0_0_#2563eb]'
          : horizontal
            ? 'shadow-[3px_0_0_0_#2563eb]'
            : 'shadow-[0_3px_0_0_#2563eb]'
      : '';

  const rootFillClass = isRoot ? 'flex-1' : '';
  const guideOutlineClass =
    !previewMode && showGuides
      ? isRoot
        ? 'outline-1 outline-dashed outline-indigo-400/75 -outline-offset-2'
        : 'outline-1 outline-dashed outline-indigo-400/75 -outline-offset-1'
      : '';
  const baseClassName =
    `${node.props.className || ''} ${rootFillClass} ${editorOutlineClass} ${guideOutlineClass} ${hoverDragHandleClass} ${dragStateClass} ${dropIndicatorClass}`.trim();

  const dndDataProps = {
    'data-node-id': id,
    'data-node-type': node.type,
    'data-selected': isSelected ? 'true' : undefined,
    'data-search-highlighted': isSearchHighlighted ? 'true' : undefined,
    'data-search-match': isSearchMatch ? 'true' : undefined,
    'data-guides': !previewMode && showGuides ? 'on' : undefined,
    'data-drop-position':
      !previewMode && isOverShallow && dropPosition ? dropPosition : undefined,
  };

  const dragHandle = canShowDragHandle ? (
    <span
      data-drag-handle="true"
      aria-hidden="true"
      title="Przeciągnij, aby zmienić kolejność"
      className="absolute -top-2.5 right-2 z-30 inline-flex items-center justify-center w-5 h-5 rounded-md bg-white border border-slate-200 text-slate-500 shadow-sm hover:text-blue-600 hover:border-blue-300 hover:bg-blue-50 cursor-grab active:cursor-grabbing opacity-0 pointer-events-none transition-opacity duration-150 select-none"
    >
      <GripVertical className="w-3.5 h-3.5 pointer-events-none" />
    </span>
  ) : null;

  const renderedChildNodes = node.children.map((childId) => (
    <CanvasNode
      key={childId}
      id={childId}
      nodes={nodes}
      selectedId={selectedId}
      selectedIds={selectedIds}
      previewMode={previewMode}
      showGuides={showGuides}
      highlightedNodeId={highlightedNodeId}
      matchingSearchIds={matchingSearchIds}
      themeVars={themeVars}
      onSelect={onSelect}
      onMoveNode={onMoveNode}
      onDropNewComponent={onDropNewComponent}
      onDropCardPreset={onDropCardPreset}
      onDropNewIcon={onDropNewIcon}
      onDropSavedComponent={onDropSavedComponent}
      onDropAsset={onDropAsset}
    />
  ));

  if (
    !isRoot &&
    node.sourceLibrary === 'mui-v9' &&
    node.materialMeta?.componentTag
  ) {
    return (
      <div
        ref={attachRef}
        {...dndDataProps}
        data-source-library="mui-v9"
        onClick={handleClick}
        className={`${editorOutlineClass} ${guideOutlineClass} ${hoverDragHandleClass} ${dragStateClass} ${dropIndicatorClass} relative`.trim()}
      >
        {dragHandle}
        <MaterialMuiNodeView node={node} themeVars={themeVars}>
          {renderedChildNodes}
        </MaterialMuiNodeView>
      </div>
    );
  }

  switch (node.type) {
    case 'Container':
    case 'Grid':
      return (
        <div
          ref={attachRef}
          {...dndDataProps}
          className={baseClassName}
          onClick={handleClick}
        >
          {dragHandle}
          {node.children.length === 0 && !previewMode && isRoot && (
            <div
              data-testid="empty-canvas-cue"
              className={`flex-1 flex flex-col items-center justify-center min-h-[420px] px-6 py-12 text-center border-2 border-dashed rounded-xl transition-colors pointer-events-none select-none col-span-full ${
                isOverShallow
                  ? 'border-blue-400 bg-blue-50/60'
                  : 'border-slate-300/90 bg-slate-50/50'
              }`}
            >
              <div
                className={`w-12 h-12 rounded-xl border flex items-center justify-center mb-4 transition-colors ${
                  isOverShallow
                    ? 'bg-blue-100 border-blue-300 text-blue-700'
                    : 'bg-white border-slate-200 text-slate-600 shadow-xs'
                }`}
              >
                <Layers className="w-5 h-5" aria-hidden="true" />
              </div>
              <h3 className="text-sm font-semibold text-slate-800 mb-1.5">
                {isOverShallow
                  ? 'Upuść element na płótno'
                  : 'Płótno jest jeszcze puste'}
              </h3>
              <p className="text-xs text-slate-500 max-w-sm leading-relaxed mb-3">
                Przeciągnij elementy z lewego panelu na obszar roboczy, aby rozpocząć budowanie interfejsu.
              </p>
              <div className="inline-flex items-center gap-1.5 text-[11px] font-medium text-blue-600">
                <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Wybierz lub przeciągnij komponent z panelu po lewej</span>
              </div>
            </div>
          )}
          {node.children.length === 0 && !previewMode && !isRoot && (
            <span className="text-xs text-slate-400 pointer-events-none select-none italic col-span-full">
              {node.type === 'Grid' ? 'Pusty grid' : 'Pusty kontener'} (
              {node.name || node.id})
            </span>
          )}
          {renderedChildNodes}
        </div>
      );
    case 'Heading':
      return (
        <h2
          ref={attachRef}
          {...dndDataProps}
          className={baseClassName}
          onClick={handleClick}
        >
          {dragHandle}
          {node.content}
        </h2>
      );
    case 'Text':
      return (
        <p
          ref={attachRef}
          {...dndDataProps}
          className={baseClassName}
          onClick={handleClick}
        >
          {dragHandle}
          {node.content}
        </p>
      );
    case 'Badge':
      return (
        <span
          ref={attachRef}
          {...dndDataProps}
          className={baseClassName}
          onClick={handleClick}
        >
          {dragHandle}
          {node.content}
        </span>
      );
    case 'Button':
      return (
        <button
          ref={attachRef}
          type="button"
          {...dndDataProps}
          className={baseClassName}
          onClick={handleClick}
        >
          {dragHandle}
          {node.content}
        </button>
      );
    case 'Input': {
      if (previewMode) {
        return (
          <input
            ref={attachRef}
            {...dndDataProps}
            className={baseClassName}
            placeholder={node.props.placeholder}
            readOnly={false}
          />
        );
      }
      const { outerClassName, innerClassName } = splitOuterLayoutClasses(
        node.props.className
      );
      return (
        <div
          ref={attachRef}
          {...dndDataProps}
          onClick={handleClick}
          className={`${outerClassName} relative ${hoverDragHandleClass} ${dragStateClass}`.trim()}
        >
          {dragHandle}
          <input
            className={`${innerClassName} ${editorOutlineClass} ${guideOutlineClass} ${dropIndicatorClass}`.trim()}
            placeholder={node.props.placeholder}
            readOnly
          />
        </div>
      );
    }
    case 'Image': {
      if (imgError || !node.props.src) {
        return (
          <div
            ref={attachRef}
            {...dndDataProps}
            onClick={handleClick}
            className={`${baseClassName} bg-slate-100 border border-slate-200 flex flex-col items-center justify-center gap-1.5 text-slate-400 min-h-[120px]`.trim()}
          >
            {dragHandle}
            <ImageIcon className="w-6 h-6" />
            <span className="text-xs font-medium text-slate-500">
              {node.name || 'Obraz niedostępny'}
            </span>
          </div>
        );
      }
      if (previewMode) {
        return (
          <img
            ref={attachRef}
            {...dndDataProps}
            className={baseClassName}
            src={node.props.src}
            alt={node.name || 'Element graficzny'}
            referrerPolicy="no-referrer"
            onError={() => setImgError(true)}
          />
        );
      }
      const { outerClassName, innerClassName } = splitOuterLayoutClasses(
        node.props.className
      );
      return (
        <div
          ref={attachRef}
          {...dndDataProps}
          onClick={handleClick}
          className={`${outerClassName} relative ${hoverDragHandleClass} ${dragStateClass}`.trim()}
        >
          {dragHandle}
          <img
            className={`${innerClassName} ${editorOutlineClass} ${guideOutlineClass} ${dropIndicatorClass}`.trim()}
            src={node.props.src}
            alt={node.name || 'Element graficzny'}
            referrerPolicy="no-referrer"
            onError={() => setImgError(true)}
          />
        </div>
      );
    }
    case 'Icon': {
      const IconComponent = getLucideIcon(node.props.iconName);
      const { wrapperClassName, iconClassName } = splitIconClasses(
        node.props.className
      );
      return (
        <span
          ref={attachRef}
          {...dndDataProps}
          data-icon-name={node.props.iconName || 'Star'}
          onClick={handleClick}
          className={`${wrapperClassName} ${editorOutlineClass} ${guideOutlineClass} ${hoverDragHandleClass} ${dragStateClass} ${dropIndicatorClass}`.trim()}
        >
          {dragHandle}
          <IconComponent className={iconClassName} aria-hidden="true" />
        </span>
      );
    }
    default:
      return null;
  }
});
