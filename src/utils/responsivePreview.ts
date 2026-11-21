import type { ViewportMode } from '../types/editor';

export interface ResponsiveViewportSpec {
  id: ViewportMode;
  label: string;
  widthPx: number;
  badge: string;
}

export const RESPONSIVE_PREVIEW_VIEWPORTS: readonly ResponsiveViewportSpec[] = [
  { id: 'mobile', label: 'Mobile', widthPx: 375, badge: '375px' },
  { id: 'tablet', label: 'Tablet', widthPx: 768, badge: '768px' },
  { id: 'desktop', label: 'Desktop', widthPx: 1024, badge: '1024px' },
];

export function getResponsivePreviewColumns(containerWidthPx: number): 1 | 2 | 3 {
  if (containerWidthPx >= 680) return 3;
  if (containerWidthPx >= 460) return 2;
  return 1;
}

export function computeViewportFrameScale(
  availableWidthPx: number,
  targetWidthPx: number
): number {
  if (availableWidthPx <= 0 || targetWidthPx <= 0) return 1;
  const raw = availableWidthPx / targetWidthPx;
  const clamped = Math.min(1, Math.max(0.2, raw));
  return Math.floor(clamped * 1000) / 1000;
}

export interface ResponsivePaneCssInput {
  id: ViewportMode;
  widthPx: number;
  scale: number;
  contentHeightPx: number;
}

export function buildResponsivePreviewCss(
  panes: readonly ResponsivePaneCssInput[]
): string {
  return panes
    .map(({ id, widthPx, scale, contentHeightPx }) => {
      const scaledWidth = Math.max(Math.round(widthPx * scale), 80);
      const scaledHeight = Math.max(Math.round(contentHeightPx * scale), 140);
      return [
        `.rp-wrap-${id} { width: ${scaledWidth}px; height: ${scaledHeight}px; }`,
        `.rp-frame-${id} { width: ${widthPx}px; transform: scale(${scale}); transform-origin: top left; }`,
      ].join('\n');
    })
    .join('\n');
}
