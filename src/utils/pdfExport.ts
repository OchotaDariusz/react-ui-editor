import { toPng } from 'html-to-image';
import { jsPDF } from 'jspdf';

export interface PdfPageGeometry {
  orientation: 'portrait' | 'landscape';
  pageWidthMm: number;
  pageHeightMm: number;
  marginMm: number;
  drawWidthMm: number;
  drawHeightMm: number;
  offsetXMm: number;
  offsetYMm: number;
}

export const buildPdfFileName = (seoTitle?: string): string => {
  const cleaned = (seoTitle || '')
    .trim()
    .replace(/[łŁ]/g, 'l')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return cleaned ? `${cleaned}.pdf` : 'react-ui-studio-canvas.pdf';
};

export const computePdfPageGeometry = (
  contentWidthPx: number,
  contentHeightPx: number
): PdfPageGeometry => {
  const safeW = Math.max(contentWidthPx, 1);
  const safeH = Math.max(contentHeightPx, 1);
  const orientation: 'portrait' | 'landscape' =
    safeW > safeH ? 'landscape' : 'portrait';

  // Standard ISO A4 dimensions in mm
  const pageWidthMm = orientation === 'landscape' ? 297 : 210;
  const pageHeightMm = orientation === 'landscape' ? 210 : 297;
  const marginMm = 10;

  const printableW = pageWidthMm - marginMm * 2;
  const printableH = pageHeightMm - marginMm * 2;

  const contentRatio = safeW / safeH;
  const printableRatio = printableW / printableH;

  let drawWidthMm: number;
  let drawHeightMm: number;

  if (contentRatio > printableRatio) {
    drawWidthMm = printableW;
    drawHeightMm = printableW / contentRatio;
  } else {
    drawHeightMm = printableH;
    drawWidthMm = printableH * contentRatio;
  }

  return {
    orientation,
    pageWidthMm,
    pageHeightMm,
    marginMm,
    drawWidthMm,
    drawHeightMm,
    offsetXMm: (pageWidthMm - drawWidthMm) / 2,
    offsetYMm: marginMm,
  };
};

export const createPdfBlobFromImageDataUrl = (
  imageDataUrl: string,
  widthPx: number,
  heightPx: number
): Blob => {
  const geometry = computePdfPageGeometry(widthPx, heightPx);
  const doc = new jsPDF({
    orientation: geometry.orientation,
    unit: 'mm',
    format: 'a4',
    compress: true,
  });

  doc.addImage(
    imageDataUrl,
    'PNG',
    geometry.offsetXMm,
    geometry.offsetYMm,
    geometry.drawWidthMm,
    geometry.drawHeightMm,
    undefined,
    'FAST'
  );

  return doc.output('blob');
};

const renderFallbackPngDataUrl = (
  widthPx: number,
  heightPx: number,
  textLines: string[]
): string => {
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(Math.round(widthPx), 600);
  canvas.height = Math.max(Math.round(heightPx), 400);
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 20px sans-serif';
    textLines.slice(0, 24).forEach((line, idx) => {
      ctx.fillText(line.slice(0, 80), 32, 48 + idx * 28);
    });
  }
  return canvas.toDataURL('image/png');
};

export const exportCanvasElementAsPdf = async (
  element: HTMLElement,
  seoTitle?: string
): Promise<{ fileName: string; byteLength: number }> => {
  const fileName = buildPdfFileName(seoTitle);
  const widthPx = Math.max(element.scrollWidth, element.clientWidth, 320);
  const heightPx = Math.max(element.scrollHeight, element.clientHeight, 240);

  let imageDataUrl: string;
  try {
    imageDataUrl = await toPng(element, {
      cacheBust: true,
      backgroundColor: '#ffffff',
      pixelRatio: 2,
      style: {
        transform: 'none',
      },
      filter: (node) => {
        if (node instanceof HTMLElement && node.dataset.dragHandle === 'true') {
          return false;
        }
        return true;
      },
    });
  } catch {
    const textLines = (element.innerText || 'React UI Studio Export')
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);
    imageDataUrl = renderFallbackPngDataUrl(widthPx, heightPx, textLines);
  }

  const blob = createPdfBlobFromImageDataUrl(imageDataUrl, widthPx, heightPx);
  const url = URL.createObjectURL(blob);

  try {
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.rel = 'noopener';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } finally {
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  return { fileName, byteLength: blob.size };
};
