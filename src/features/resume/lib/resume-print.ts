import type {
  ResumeDensity,
  ResumePageSize,
  StructuredResume,
} from '@/types/resume';

export interface PrintPageMetrics {
  pageSize: ResumePageSize;
  printPageSize: string;
  marginMm: number;
  sheetWidthPx: number;
  printableHeightPx: number;
  safePrintableHeightPx: number;
}

export interface DensityPrintMetrics {
  fontSizePx: number;
  lineHeight: number;
  screenPadTopPx: number;
  screenPadYPx: number;
}

export interface PrintLayoutSummary {
  pageSize: ResumePageSize;
  naturalPages: number;
  outputPages: number;
  fitScale: number;
  fitPercent: number;
  isScaledToFit: boolean;
  overflowPx: number;
  safePrintableHeightPx: number;
  pageBoundaryPx: number;
}

export const RESUME_PRINT_REQUEST_EVENT = 'pahirepo:print-resume';

// 96 CSS px = 25.4 mm. Printable height = pageHeightPx - 2 * (8mm * 96 / 25.4 ≈ 30.24px)
// A4: 1122.5 - 60.5 = 1062px | Letter: 1056 - 60.5 = 995px | Legal: 1344 - 60.5 = 1283px
export const PRINT_PAGE_METRICS: Record<ResumePageSize, PrintPageMetrics> = {
  a4: {
    pageSize: 'a4',
    printPageSize: 'A4 portrait',
    marginMm: 8,
    sheetWidthPx: 794,
    printableHeightPx: 1062,
    safePrintableHeightPx: 1048,
  },
  letter: {
    pageSize: 'letter',
    printPageSize: 'letter portrait',
    marginMm: 8,
    sheetWidthPx: 816,
    printableHeightPx: 995,
    safePrintableHeightPx: 981,
  },
  legal: {
    pageSize: 'legal',
    printPageSize: 'legal portrait',
    marginMm: 8,
    sheetWidthPx: 816,
    printableHeightPx: 1283,
    safePrintableHeightPx: 1269,
  },
  auto: {
    pageSize: 'auto',
    printPageSize: 'A4 portrait',
    marginMm: 8,
    sheetWidthPx: 794,
    printableHeightPx: 1062,
    safePrintableHeightPx: 1048,
  },
};

export const DENSITY_PRINT_METRICS: Record<ResumeDensity, DensityPrintMetrics> = {
  compact: {
    fontSizePx: 10.2,
    lineHeight: 1.28,
    screenPadTopPx: 20,
    screenPadYPx: 40,
  },
  standard: {
    fontSizePx: 11,
    lineHeight: 1.35,
    screenPadTopPx: 24,
    screenPadYPx: 48,
  },
  comfortable: {
    fontSizePx: 11.5,
    lineHeight: 1.42,
    screenPadTopPx: 28,
    screenPadYPx: 56,
  },
};

/**
 * Resolves whether 1-page print fit is enabled (defaults ON for A4, US Letter, and US Legal).
 */
export function resolveFitOnePage(
  resume: Pick<StructuredResume, 'pageSize' | 'fitOnePage'>
): boolean {
  if (typeof resume.fitOnePage === 'boolean') {
    return resume.fitOnePage;
  }
  return (resume.pageSize || 'a4') !== 'auto';
}

/**
 * Computes natural page count, printable boundary offset, and 1-page print scale
 * from measured inner resume content height (excluding screen padding/min-height).
 */
export function computePrintLayoutSummary(params: {
  pageSize: ResumePageSize;
  density: ResumeDensity;
  contentHeightPx: number;
  fitOnePage: boolean;
}): PrintLayoutSummary {
  const metrics = PRINT_PAGE_METRICS[params.pageSize] || PRINT_PAGE_METRICS.a4;
  const densityMetrics =
    DENSITY_PRINT_METRICS[params.density] || DENSITY_PRINT_METRICS.standard;

  const measured = Math.max(0, params.contentHeightPx);
  const naturalPages =
    measured > 0
      ? Math.max(1, Math.ceil(measured / metrics.safePrintableHeightPx))
      : 1;
  const overflowPx = Math.max(
    0,
    Math.round(measured - metrics.safePrintableHeightPx)
  );

  const shouldScale =
    params.fitOnePage &&
    params.pageSize !== 'auto' &&
    measured > metrics.safePrintableHeightPx;

  const fitScale = shouldScale
    ? Math.max(
        0.72,
        Math.min(
          1,
          Number(((metrics.safePrintableHeightPx / measured) * 0.985).toFixed(4))
        )
      )
    : 1;

  const scaledContentHeightPx = Math.ceil(measured * fitScale);
  const outputPages =
    params.pageSize === 'auto'
      ? naturalPages
      : shouldScale && scaledContentHeightPx <= metrics.printableHeightPx
        ? 1
        : Math.max(
            1,
            Math.ceil(scaledContentHeightPx / metrics.safePrintableHeightPx)
          );

  const pageBoundaryPx =
    densityMetrics.screenPadTopPx + metrics.safePrintableHeightPx;

  return {
    pageSize: metrics.pageSize,
    naturalPages,
    outputPages,
    fitScale,
    fitPercent: Math.round(fitScale * 100),
    isScaledToFit: fitScale < 0.999,
    overflowPx,
    safePrintableHeightPx: metrics.safePrintableHeightPx,
    pageBoundaryPx,
  };
}

/**
 * Generates density-matched @media print CSS with optional 1-page zoom scaling
 * (plus @supports fallback for engines without CSS zoom).
 */
export function buildResumePrintStyles(params: {
  pageSize: ResumePageSize;
  density: ResumeDensity;
  fontFamily: string;
  fitScale: number;
}): string {
  const metrics = PRINT_PAGE_METRICS[params.pageSize] || PRINT_PAGE_METRICS.a4;
  const densityMetrics =
    DENSITY_PRINT_METRICS[params.density] || DENSITY_PRINT_METRICS.standard;

  const scaleCss =
    params.fitScale < 0.999
      ? `#a4-resume-sheet { zoom: ${params.fitScale} !important; } @supports not (zoom: 0.9) { #a4-resume-sheet { font-size: ${(
          densityMetrics.fontSizePx * params.fitScale
        ).toFixed(2)}px !important; line-height: ${Math.max(
          1.16,
          Number(
            (
              densityMetrics.lineHeight *
              Math.min(1, params.fitScale + 0.04)
            ).toFixed(2)
          )
        )} !important; } }`
      : '';

  return `@media print { @page { size: ${metrics.printPageSize}; margin: ${metrics.marginMm}mm; } html, body { background: #ffffff !important; height: auto !important; } #a4-resume-sheet { font-family: ${params.fontFamily} !important; font-size: ${densityMetrics.fontSizePx}px !important; line-height: ${densityMetrics.lineHeight} !important; font-variant-ligatures: none !important; transform: none !important; margin: 0 !important; padding: 0 !important; background: #ffffff !important; box-shadow: none !important; border: none !important; width: 100% !important; min-height: 0 !important; height: auto !important; } ${scaleCss} }`;
}
