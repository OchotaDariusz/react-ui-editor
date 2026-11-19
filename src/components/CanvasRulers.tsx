import { useEffect, useMemo, useRef, useState, type RefObject } from 'react';
import type { NodesMap, ViewportMode } from '../types/editor';
import {
  DEFAULT_RULER_SPAN_PX,
  RULER_THICKNESS_PX,
  clientCoordToCanvasPx,
  computeAxisSelectionBand,
  generateRulerTicks,
  type SelectionRulerBand,
} from '../utils/rulers';

interface CanvasRulersProps {
  scrollContainerRef: RefObject<HTMLDivElement | null>;
  canvasViewportRef: RefObject<HTMLDivElement | null>;
  selectedId: string;
  nodes: NodesMap;
  viewport: ViewportMode;
  zoom: number;
}

interface RulerMetrics {
  rulerWidth: number;
  rulerHeight: number;
  originX: number;
  originY: number;
  canvasWidthPx: number;
  canvasHeightPx: number;
  xBand: SelectionRulerBand | null;
  yBand: SelectionRulerBand | null;
}

export function CanvasRulers({
  scrollContainerRef,
  canvasViewportRef,
  selectedId,
  nodes,
  viewport,
  zoom,
}: CanvasRulersProps) {
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const [metrics, setMetrics] = useState<RulerMetrics>({
    rulerWidth: 900,
    rulerHeight: 700,
    originX: 24,
    originY: 24,
    canvasWidthPx: 1024,
    canvasHeightPx: 600,
    xBand: null,
    yBand: null,
  });
  const [pointerPos, setPointerPos] = useState<{
    screenX: number;
    screenY: number;
    canvasX: number;
    canvasY: number;
  } | null>(null);

  useEffect(() => {
    let rafId = 0;

    const measure = () => {
      const overlayEl = overlayRef.current;
      const viewportEl = canvasViewportRef.current;
      if (!overlayEl || !viewportEl) return;

      const overlayRect = overlayEl.getBoundingClientRect();
      const viewportRect = viewportEl.getBoundingClientRect();

      const horizontalOriginClient = viewportRect.left;
      const verticalOriginClient = viewportRect.top;
      const originX = horizontalOriginClient - (overlayRect.left + RULER_THICKNESS_PX);
      const originY = verticalOriginClient - (overlayRect.top + RULER_THICKNESS_PX);

      const safeZoom = zoom > 0 ? zoom : 1;
      const canvasWidthPx = Math.max(
        Math.round(viewportRect.width / safeZoom),
        320
      );
      const canvasHeightPx = Math.max(
        Math.round(viewportRect.height / safeZoom),
        480
      );

      let xBand: SelectionRulerBand | null = null;
      let yBand: SelectionRulerBand | null = null;
      const selectedEl = viewportEl.querySelector<HTMLElement>(
        `[data-node-id="${selectedId}"]`
      );
      if (selectedEl) {
        const selRect = selectedEl.getBoundingClientRect();
        xBand = computeAxisSelectionBand(
          selRect.left,
          selRect.width,
          horizontalOriginClient,
          safeZoom
        );
        yBand = computeAxisSelectionBand(
          selRect.top,
          selRect.height,
          verticalOriginClient,
          safeZoom
        );
      }

      setMetrics({
        rulerWidth: Math.max(overlayRect.width - RULER_THICKNESS_PX, 100),
        rulerHeight: Math.max(overlayRect.height - RULER_THICKNESS_PX, 100),
        originX,
        originY,
        canvasWidthPx,
        canvasHeightPx,
        xBand,
        yBand,
      });
    };

    const scheduleMeasure = () => {
      window.cancelAnimationFrame(rafId);
      rafId = window.requestAnimationFrame(measure);
    };

    measure();
    const timer = window.setTimeout(measure, 220);

    const scrollEl = scrollContainerRef.current;
    const viewportEl = canvasViewportRef.current;
    const overlayEl = overlayRef.current;

    scrollEl?.addEventListener('scroll', scheduleMeasure, { passive: true });
    window.addEventListener('resize', scheduleMeasure);

    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(scheduleMeasure);
      if (overlayEl) resizeObserver.observe(overlayEl);
      if (viewportEl) resizeObserver.observe(viewportEl);
    }

    return () => {
      window.cancelAnimationFrame(rafId);
      window.clearTimeout(timer);
      scrollEl?.removeEventListener('scroll', scheduleMeasure);
      window.removeEventListener('resize', scheduleMeasure);
      resizeObserver?.disconnect();
    };
  }, [scrollContainerRef, canvasViewportRef, selectedId, nodes, viewport, zoom]);

  useEffect(() => {
    const scrollEl = scrollContainerRef.current;
    if (!scrollEl) return;

    const handleMouseMove = (event: MouseEvent) => {
      const overlayEl = overlayRef.current;
      const viewportEl = canvasViewportRef.current;
      if (!overlayEl || !viewportEl) return;

      const overlayRect = overlayEl.getBoundingClientRect();
      const viewportRect = viewportEl.getBoundingClientRect();
      const screenX = event.clientX - (overlayRect.left + RULER_THICKNESS_PX);
      const screenY = event.clientY - (overlayRect.top + RULER_THICKNESS_PX);

      setPointerPos({
        screenX,
        screenY,
        canvasX: clientCoordToCanvasPx(event.clientX, viewportRect.left, zoom),
        canvasY: clientCoordToCanvasPx(event.clientY, viewportRect.top, zoom),
      });
    };

    const handleMouseLeave = () => {
      setPointerPos(null);
    };

    scrollEl.addEventListener('mousemove', handleMouseMove, { passive: true });
    scrollEl.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      scrollEl.removeEventListener('mousemove', handleMouseMove);
      scrollEl.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [scrollContainerRef, canvasViewportRef, zoom]);

  const horizontalTicks = useMemo(() => {
    const safeZoom = zoom > 0 ? zoom : 1;
    const minCanvasPx = Math.floor(-metrics.originX / safeZoom) - 100;
    const maxCanvasPx = Math.max(
      DEFAULT_RULER_SPAN_PX,
      metrics.canvasWidthPx + 200,
      Math.ceil((metrics.rulerWidth - metrics.originX) / safeZoom) + 100
    );
    return generateRulerTicks(minCanvasPx, maxCanvasPx, safeZoom);
  }, [metrics.originX, metrics.rulerWidth, metrics.canvasWidthPx, zoom]);

  const verticalTicks = useMemo(() => {
    const safeZoom = zoom > 0 ? zoom : 1;
    const minCanvasPx = Math.floor(-metrics.originY / safeZoom) - 100;
    const maxCanvasPx = Math.max(
      DEFAULT_RULER_SPAN_PX,
      metrics.canvasHeightPx + 200,
      Math.ceil((metrics.rulerHeight - metrics.originY) / safeZoom) + 100
    );
    return generateRulerTicks(minCanvasPx, maxCanvasPx, safeZoom);
  }, [metrics.originY, metrics.rulerHeight, metrics.canvasHeightPx, zoom]);

  return (
    <div
      ref={overlayRef}
      data-testid="canvas-rulers-overlay"
      aria-label="Linijki pikselowe płótna"
      className="pointer-events-none absolute inset-0 z-10 select-none overflow-hidden"
    >
      {/* Top-left origin corner */}
      <div
        data-testid="canvas-ruler-corner"
        className="absolute top-0 left-0 w-[22px] h-[22px] bg-slate-100 border-r border-b border-slate-300 flex items-center justify-center text-[9px] font-mono font-semibold text-slate-500 z-20"
      >
        px
      </div>

      {/* Horizontal top ruler */}
      <div
        data-testid="canvas-ruler-horizontal"
        aria-label="Linijka pozioma"
        className="absolute top-0 left-[22px] right-0 h-[22px] bg-slate-50/95 border-b border-slate-200 overflow-hidden"
      >
        <svg
          width={metrics.rulerWidth}
          height={RULER_THICKNESS_PX}
          className="block"
          aria-hidden="true"
        >
          {metrics.xBand && (
            <rect
              x={metrics.originX + metrics.xBand.screenStartPx}
              y={0}
              width={Math.max(metrics.xBand.screenSizePx, 1)}
              height={RULER_THICKNESS_PX}
              fill="rgba(37, 99, 235, 0.14)"
            />
          )}

          {horizontalTicks.map((tick) => {
            const x = metrics.originX + tick.screenOffsetPx;
            if (x < -40 || x > metrics.rulerWidth + 40) return null;
            const tickTop =
              tick.kind === 'major' ? 4 : tick.kind === 'medium' ? 11 : 16;
            return (
              <g key={`h-${tick.canvasPx}`}>
                <line
                  x1={x}
                  y1={tickTop}
                  x2={x}
                  y2={RULER_THICKNESS_PX}
                  stroke={tick.kind === 'major' ? '#64748b' : '#cbd5e1'}
                  strokeWidth={1}
                />
                {tick.label !== undefined && (
                  <text
                    x={x + 3}
                    y={10}
                    fill="#475569"
                    fontSize="9"
                    fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
                  >
                    {tick.label}
                  </text>
                )}
              </g>
            );
          })}

          {metrics.xBand && (
            <>
              <line
                x1={metrics.originX + metrics.xBand.screenStartPx}
                y1={0}
                x2={metrics.originX + metrics.xBand.screenStartPx}
                y2={RULER_THICKNESS_PX}
                stroke="#2563eb"
                strokeWidth={1}
              />
              <line
                x1={
                  metrics.originX +
                  metrics.xBand.screenStartPx +
                  metrics.xBand.screenSizePx
                }
                y1={0}
                x2={
                  metrics.originX +
                  metrics.xBand.screenStartPx +
                  metrics.xBand.screenSizePx
                }
                y2={RULER_THICKNESS_PX}
                stroke="#2563eb"
                strokeWidth={1}
              />
            </>
          )}

          {pointerPos && (
            <line
              x1={pointerPos.screenX}
              y1={0}
              x2={pointerPos.screenX}
              y2={RULER_THICKNESS_PX}
              stroke="#dc2626"
              strokeWidth={1}
            />
          )}
        </svg>
      </div>

      {/* Vertical left ruler */}
      <div
        data-testid="canvas-ruler-vertical"
        aria-label="Linijka pionowa"
        className="absolute top-[22px] left-0 bottom-0 w-[22px] bg-slate-50/95 border-r border-slate-200 overflow-hidden"
      >
        <svg
          width={RULER_THICKNESS_PX}
          height={metrics.rulerHeight}
          className="block"
          aria-hidden="true"
        >
          {metrics.yBand && (
            <rect
              x={0}
              y={metrics.originY + metrics.yBand.screenStartPx}
              width={RULER_THICKNESS_PX}
              height={Math.max(metrics.yBand.screenSizePx, 1)}
              fill="rgba(37, 99, 235, 0.14)"
            />
          )}

          {verticalTicks.map((tick) => {
            const y = metrics.originY + tick.screenOffsetPx;
            if (y < -40 || y > metrics.rulerHeight + 40) return null;
            const tickLeft =
              tick.kind === 'major' ? 4 : tick.kind === 'medium' ? 11 : 16;
            return (
              <g key={`v-${tick.canvasPx}`}>
                <line
                  x1={tickLeft}
                  y1={y}
                  x2={RULER_THICKNESS_PX}
                  y2={y}
                  stroke={tick.kind === 'major' ? '#64748b' : '#cbd5e1'}
                  strokeWidth={1}
                />
                {tick.label !== undefined && (
                  <text
                    x={9}
                    y={y + 3}
                    fill="#475569"
                    fontSize="9"
                    fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
                    transform={`rotate(-90, 9, ${y + 3})`}
                    textAnchor="end"
                  >
                    {tick.label}
                  </text>
                )}
              </g>
            );
          })}

          {metrics.yBand && (
            <>
              <line
                x1={0}
                y1={metrics.originY + metrics.yBand.screenStartPx}
                x2={RULER_THICKNESS_PX}
                y2={metrics.originY + metrics.yBand.screenStartPx}
                stroke="#2563eb"
                strokeWidth={1}
              />
              <line
                x1={0}
                y1={
                  metrics.originY +
                  metrics.yBand.screenStartPx +
                  metrics.yBand.screenSizePx
                }
                x2={RULER_THICKNESS_PX}
                y2={
                  metrics.originY +
                  metrics.yBand.screenStartPx +
                  metrics.yBand.screenSizePx
                }
                stroke="#2563eb"
                strokeWidth={1}
              />
            </>
          )}

          {pointerPos && (
            <line
              x1={0}
              y1={pointerPos.screenY}
              x2={RULER_THICKNESS_PX}
              y2={pointerPos.screenY}
              stroke="#dc2626"
              strokeWidth={1}
            />
          )}
        </svg>
      </div>

      {/* Live coordinate & selected node dimensions readout */}
      <div
        data-testid="canvas-ruler-readout"
        className="absolute top-[28px] right-3 bg-white/90 border border-slate-200 rounded-md px-2 py-0.5 text-[10px] font-mono tabular-nums text-slate-600 flex items-center gap-2"
      >
        {metrics.xBand && metrics.yBand && (
          <span>
            {metrics.xBand.canvasSizePx} × {metrics.yBand.canvasSizePx} px
          </span>
        )}
        {pointerPos && (
          <>
            {metrics.xBand && metrics.yBand && (
              <span aria-hidden="true" className="text-slate-300">
                |
              </span>
            )}
            <span>
              X {pointerPos.canvasX} · Y {pointerPos.canvasY}
            </span>
          </>
        )}
      </div>
    </div>
  );
}
