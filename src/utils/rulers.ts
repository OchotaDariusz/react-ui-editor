export const RULER_THICKNESS_PX = 22;
export const DEFAULT_RULER_SPAN_PX = 1800;

export interface RulerTick {
  canvasPx: number;
  screenOffsetPx: number;
  kind: 'major' | 'medium' | 'minor';
  label?: string;
}

export interface RulerIntervals {
  major: number;
  medium: number;
  minor: number;
}

export interface SelectionRulerBand {
  canvasStartPx: number;
  canvasSizePx: number;
  screenStartPx: number;
  screenSizePx: number;
}

export const getRulerIntervals = (zoom: number): RulerIntervals => {
  if (zoom <= 0.75) {
    return { major: 100, medium: 50, minor: 25 };
  }
  return { major: 100, medium: 50, minor: 10 };
};

export const generateRulerTicks = (
  minCanvasPx: number,
  maxCanvasPx: number,
  zoom: number
): RulerTick[] => {
  const safeZoom = zoom > 0 ? zoom : 1;
  const intervals = getRulerIntervals(safeZoom);
  const startStep = Math.floor(minCanvasPx / intervals.minor) * intervals.minor;
  const endStep = Math.ceil(maxCanvasPx / intervals.minor) * intervals.minor;

  const ticks: RulerTick[] = [];
  for (let px = startStep; px <= endStep; px += intervals.minor) {
    const isMajor = Math.abs(px % intervals.major) === 0;
    const isMedium = !isMajor && Math.abs(px % intervals.medium) === 0;
    ticks.push({
      canvasPx: px,
      screenOffsetPx: Math.round(px * safeZoom * 100) / 100,
      kind: isMajor ? 'major' : isMedium ? 'medium' : 'minor',
      label: isMajor ? String(px) : undefined,
    });
  }
  return ticks;
};

export const computeAxisSelectionBand = (
  elementStartClient: number,
  elementSizeClient: number,
  canvasOriginClient: number,
  zoom: number
): SelectionRulerBand | null => {
  const safeZoom = zoom > 0 ? zoom : 1;
  if (!Number.isFinite(elementSizeClient) || elementSizeClient <= 0) {
    return null;
  }
  const screenStartPx = elementStartClient - canvasOriginClient;
  const screenSizePx = elementSizeClient;
  return {
    canvasStartPx: Math.round(screenStartPx / safeZoom),
    canvasSizePx: Math.round(screenSizePx / safeZoom),
    screenStartPx,
    screenSizePx,
  };
};

export const clientCoordToCanvasPx = (
  clientCoord: number,
  canvasOriginClient: number,
  zoom: number
): number => {
  const safeZoom = zoom > 0 ? zoom : 1;
  return Math.round((clientCoord - canvasOriginClient) / safeZoom);
};
