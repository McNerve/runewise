import type {
  CandlestickData,
  HistogramData,
  LineData,
  Time,
  UTCTimestamp,
} from "lightweight-charts";
import type { ItemMapping, ItemPrice } from "../../lib/api/ge";
import type { TimeseriesPoint, Timestep } from "../../lib/api/ge-timeseries";
import { formatGp, timeAgo } from "../../lib/format";

export type Period = "1D" | "1W" | "1M" | "3M" | "6M" | "1Y";
export type ChartMode = "line" | "candlestick";

export const PERIODS: Period[] = ["1D", "1W", "1M", "3M", "6M", "1Y"];

export const PERIOD_TIMESTEP: Record<Period, Timestep> = {
  "1D": "5m",
  "1W": "1h",
  "1M": "6h",
  "3M": "24h",
  "6M": "24h",
  "1Y": "24h",
};

const PERIOD_SECONDS: Record<Period, number> = {
  "1D": 86400,
  "1W": 7 * 86400,
  "1M": 30 * 86400,
  "3M": 90 * 86400,
  "6M": 180 * 86400,
  "1Y": 365 * 86400,
};

export function filterByPeriod(
  points: TimeseriesPoint[],
  period: Period
): TimeseriesPoint[] {
  const cutoff = Math.floor(Date.now() / 1000) - PERIOD_SECONDS[period];
  return points.filter((point) => point.timestamp >= cutoff);
}

export function toLineData(points: TimeseriesPoint[]): LineData<Time>[] {
  return points
    .filter((point) => point.avgHighPrice != null)
    .map((point) => ({
      time: point.timestamp as UTCTimestamp,
      value: point.avgHighPrice!,
    }));
}

export function toCandlestickData(
  points: TimeseriesPoint[]
): CandlestickData<Time>[] {
  const result: CandlestickData<Time>[] = [];
  let prevClose: number | null = null;

  for (const point of points) {
    const high = point.avgHighPrice;
    const low = point.avgLowPrice;
    if (high == null && low == null) continue;

    const close = high ?? low!;
    const open = prevClose ?? close;
    const candleHigh = Math.max(high ?? close, low ?? close);
    const candleLow = Math.min(high ?? close, low ?? close);

    result.push({
      time: point.timestamp as UTCTimestamp,
      open,
      high: candleHigh,
      low: candleLow,
      close,
    });

    prevClose = close;
  }

  return result;
}

export function toVolumeData(points: TimeseriesPoint[]): HistogramData<Time>[] {
  const result: HistogramData<Time>[] = [];
  let prevPrice: number | null = null;

  for (const point of points) {
    const volume = point.highPriceVolume + point.lowPriceVolume;
    if (volume === 0) continue;

    const price = point.avgHighPrice ?? point.avgLowPrice;
    const isUp = prevPrice == null || (price != null && price >= prevPrice);

    result.push({
      time: point.timestamp as UTCTimestamp,
      value: volume,
      color: isUp ? "#22c55e30" : "#ef444430",
    });

    if (price != null) prevPrice = price;
  }

  return result;
}

export function itemToWikiUrl(itemName: string) {
  return `https://oldschool.runescape.wiki/w/${encodeURIComponent(itemName.replace(/ /g, "_"))}`;
}

export function buildItemStats(item: ItemMapping, price?: ItemPrice) {
  const margin =
    price?.high != null && price?.low != null ? price.high - price.low : null;

  return [
    {
      label: "Buy Price",
      value: formatGp(price?.high ?? null),
      meta: timeAgo(price?.highTime ?? null),
      className: "text-success",
    },
    {
      label: "Sell Price",
      value: formatGp(price?.low ?? null),
      meta: timeAgo(price?.lowTime ?? null),
      className: "text-danger",
    },
    ...(margin != null
      ? [
          {
            label: "Margin",
            value: `${margin > 0 ? "+" : ""}${formatGp(margin)}`,
            className: margin >= 0 ? "text-success" : "text-danger",
          },
        ]
      : []),
    {
      label: "High Alch",
      value: formatGp(item.highalch),
      className: "text-warning",
    },
    {
      label: "Low Alch",
      value: formatGp(item.lowalch),
    },
    {
      label: "Store Value",
      value: formatGp(item.value),
    },
    {
      label: "Buy Limit",
      value: item.limit?.toLocaleString() ?? "\u2014",
    },
  ];
}
