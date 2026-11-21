import { useEffect, useMemo, useRef, useState } from 'react';
import { Monitor, Smartphone, Tablet, X } from 'lucide-react';
import type {
  ImportedAsset,
  NodeBlueprint,
  NodesMap,
  NodeType,
  ViewportMode,
} from '../types/editor';
import type { DropPosition } from '../utils/editorLogic';
import {
  RESPONSIVE_PREVIEW_VIEWPORTS,
  buildResponsivePreviewCss,
  computeViewportFrameScale,
  getResponsivePreviewColumns,
} from '../utils/responsivePreview';
import { CanvasNode } from './CanvasNode';

interface ResponsivePreviewProps {
  nodes: NodesMap;
  selectedId: string;
  selectedIds: string[];
  onSelectViewportForEditing: (viewport: ViewportMode) => void;
  onExitResponsivePreview: () => void;
  onSelectNode: (id: string, additive?: boolean) => void;
  onMoveNode: (dragId: string, targetId: string, position: DropPosition) => void;
  onDropNewComponent: (
    nodeType: NodeType,
    targetId: string,
    position: DropPosition
  ) => void;
  onDropCardPreset: (targetId: string, position: DropPosition) => void;
  onDropNewIcon: (
    iconName: string,
    targetId: string,
    position: DropPosition
  ) => void;
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

const VIEWPORT_ICONS: Record<ViewportMode, typeof Monitor> = {
  mobile: Smartphone,
  tablet: Tablet,
  desktop: Monitor,
};

export function ResponsivePreview({
  nodes,
  selectedId,
  selectedIds,
  onSelectViewportForEditing,
  onExitResponsivePreview,
  onSelectNode,
  onMoveNode,
  onDropNewComponent,
  onDropCardPreset,
  onDropNewIcon,
  onDropSavedComponent,
  onDropAsset,
}: ResponsivePreviewProps) {
  const gridRef = useRef<HTMLDivElement | null>(null);
  const frameRefs = useRef<Record<ViewportMode, HTMLDivElement | null>>({
    mobile: null,
    tablet: null,
    desktop: null,
  });

  const [containerWidth, setContainerWidth] = useState<number>(960);
  const [contentHeights, setContentHeights] = useState<
    Record<ViewportMode, number>
  >({
    mobile: 560,
    tablet: 560,
    desktop: 560,
  });

  useEffect(() => {
    const gridEl = gridRef.current;
    if (!gridEl) return;

    const measureAll = () => {
      const nextWidth = gridEl.clientWidth;
      if (nextWidth > 0) {
        setContainerWidth((prev) => (prev === nextWidth ? prev : nextWidth));
      }

      setContentHeights((prev) => {
        const mobileH = Math.max(
          frameRefs.current.mobile?.scrollHeight ?? prev.mobile,
          360
        );
        const tabletH = Math.max(
          frameRefs.current.tablet?.scrollHeight ?? prev.tablet,
          360
        );
        const desktopH = Math.max(
          frameRefs.current.desktop?.scrollHeight ?? prev.desktop,
          360
        );
        if (
          prev.mobile === mobileH &&
          prev.tablet === tabletH &&
          prev.desktop === desktopH
        ) {
          return prev;
        }
        return { mobile: mobileH, tablet: tabletH, desktop: desktopH };
      });
    };

    measureAll();

    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', measureAll);
      return () => window.removeEventListener('resize', measureAll);
    }

    const observer = new ResizeObserver(measureAll);
    observer.observe(gridEl);
    for (const key of ['mobile', 'tablet', 'desktop'] as const) {
      const frame = frameRefs.current[key];
      if (frame) observer.observe(frame);
    }
    return () => observer.disconnect();
  }, [nodes]);

  const columnCount = getResponsivePreviewColumns(containerWidth);
  const gapPx = 16;
  const totalGaps = Math.max(columnCount - 1, 0) * gapPx;
  const columnInnerWidth = Math.max(
    Math.floor((containerWidth - totalGaps) / columnCount) - 24,
    120
  );

  const paneLayout = useMemo(() => {
    return RESPONSIVE_PREVIEW_VIEWPORTS.map((spec) => {
      const scale = computeViewportFrameScale(columnInnerWidth, spec.widthPx);
      return {
        ...spec,
        scale,
        scalePercent: Math.round(scale * 100),
        contentHeightPx: contentHeights[spec.id],
      };
    });
  }, [columnInnerWidth, contentHeights]);

  const dynamicCss = useMemo(
    () =>
      buildResponsivePreviewCss(
        paneLayout.map((p) => ({
          id: p.id,
          widthPx: p.widthPx,
          scale: p.scale,
          contentHeightPx: p.contentHeightPx,
        }))
      ),
    [paneLayout]
  );

  const gridColsClass =
    columnCount === 3
      ? 'grid-cols-3'
      : columnCount === 2
        ? 'grid-cols-2'
        : 'grid-cols-1';

  return (
    <section
      data-testid="responsive-preview-view"
      aria-label="Podgląd responsywny"
      className="flex flex-col gap-4 max-w-full"
      onClick={(e) => e.stopPropagation()}
    >
      {dynamicCss && (
        <style id="responsive-preview-layout-styles">{dynamicCss}</style>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 bg-white border border-slate-200 rounded-xl px-4 py-2.5 shadow-xs">
        <div className="min-w-0">
          <h2 className="text-xs font-bold text-slate-900">
            Podgląd responsywny (Multi-Viewport)
          </h2>
          <p className="text-[11px] text-slate-500">
            Jednoczesny podgląd bieżącej strony w widokach Mobile, Tablet i Desktop.
          </p>
        </div>

        <button
          type="button"
          onClick={onExitResponsivePreview}
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white transition-colors whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        >
          <X className="w-3.5 h-3.5" />
          Wróć do edytora
        </button>
      </div>

      <div
        ref={gridRef}
        data-columns={columnCount}
        className={`grid ${gridColsClass} gap-4 items-start`}
      >
        {paneLayout.map((pane) => {
          const Icon = VIEWPORT_ICONS[pane.id];
          return (
            <article
              key={pane.id}
              data-testid={`responsive-viewport-${pane.id}`}
              aria-label={`Widok ${pane.label} ${pane.badge}`}
              className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col min-w-0"
            >
              <header className="px-2.5 py-2 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-1.5">
                <div className="flex items-center gap-1 min-w-0">
                  <Icon
                    className="w-3.5 h-3.5 text-blue-600 shrink-0"
                    aria-hidden="true"
                  />
                  <span className="text-[11px] font-semibold text-slate-800 whitespace-nowrap shrink-0">
                    {pane.label}
                  </span>
                  <span className="text-[10px] font-mono text-slate-500 bg-white border border-slate-200 px-1 py-0.5 rounded shrink-0">
                    {pane.badge}
                  </span>
                  <span className="hidden xl:inline text-[10px] font-mono text-slate-400 tabular-nums shrink-0">
                    {pane.scalePercent}%
                  </span>
                </div>

                <button
                  type="button"
                  aria-label={`Edytuj w widoku ${pane.label}`}
                  onClick={() => onSelectViewportForEditing(pane.id)}
                  className="text-[11px] font-semibold text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-1.5 py-0.5 rounded-md transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                >
                  Edytuj
                </button>
              </header>

              <div className="p-3 bg-slate-100/70 overflow-auto flex justify-center">
                <div
                  data-canvas-artboard="true"
                  className={`rp-wrap-${pane.id} relative overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs shrink-0`}
                >
                  <div
                    ref={(el) => {
                      frameRefs.current[pane.id] = el;
                    }}
                    className={`rp-frame-${pane.id} min-h-[360px] flex flex-col bg-white`}
                  >
                    <CanvasNode
                      id="root"
                      nodes={nodes}
                      selectedId={selectedId}
                      selectedIds={selectedIds}
                      previewMode={true}
                      showGuides={false}
                      onSelect={onSelectNode}
                      onMoveNode={onMoveNode}
                      onDropNewComponent={onDropNewComponent}
                      onDropCardPreset={onDropCardPreset}
                      onDropNewIcon={onDropNewIcon}
                      onDropSavedComponent={onDropSavedComponent}
                      onDropAsset={onDropAsset}
                    />
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
