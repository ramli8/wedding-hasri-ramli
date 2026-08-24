export interface JustifiedRow {
  indexes: number[];
  height: number;
  justify: "fill" | "center";
}

interface ComputeJustifiedRowsParams {
  ratios: number[];
  containerWidth: number;
  gap?: number;
  itemsPerRow?: number;
}

const DEFAULT_GAP = 12;
const DEFAULT_ITEMS_PER_ROW = 4;
const ABSOLUTE_MAX_ROW_HEIGHT = 560;

export function rowMetrics(containerWidth: number): { gap: number; itemsPerRow: number } {
  if (containerWidth <= 448) return { gap: 8, itemsPerRow: 2 };
  if (containerWidth <= 896) return { gap: 10, itemsPerRow: 3 };
  return { gap: 12, itemsPerRow: 4 };
}

export function computeJustifiedRows({
  ratios,
  containerWidth,
  gap = DEFAULT_GAP,
  itemsPerRow = DEFAULT_ITEMS_PER_ROW,
}: ComputeJustifiedRowsParams): JustifiedRow[] {
  if (containerWidth <= 0 || ratios.length === 0 || itemsPerRow < 1) return [];

  const size = Math.round(itemsPerRow);
  const rows: JustifiedRow[] = [];

  for (let start = 0; start < ratios.length; start += size) {
    const indexes = ratios.map((_, index) => index).slice(start, start + size);
    const sum = indexes.reduce((total, index) => total + ratios[index], 0);
    if (sum <= 0) continue;

    const rawHeight = (containerWidth - gap * (indexes.length - 1)) / sum;
    const capped = rawHeight > ABSOLUTE_MAX_ROW_HEIGHT;

    rows.push({
      indexes,
      height: capped ? ABSOLUTE_MAX_ROW_HEIGHT : rawHeight,
      justify: capped ? "center" : "fill",
    });
  }

  return rows;
}
