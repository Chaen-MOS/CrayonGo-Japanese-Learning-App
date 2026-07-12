export type ScreenMetrics = {
  width: number;
  height: number;
};

export function isSmallPhone({height, width}: ScreenMetrics) {
  return Math.min(height, width) <= 380 || Math.max(height, width) <= 760;
}

export function compactValue(metrics: ScreenMetrics, normal: number, compact: number) {
  return isSmallPhone(metrics) ? compact : normal;
}
