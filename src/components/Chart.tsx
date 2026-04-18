import { useRef, useEffect } from "react";
import {
  createChart,
  type IChartApi,
  type ISeriesApi,
  type SeriesType,
  ColorType,
  type CandlestickData,
  type LineData,
  type HistogramData,
  type Time,
  CandlestickSeries,
  AreaSeries,
  HistogramSeries,
} from "lightweight-charts";

interface ChartProps {
  data: (CandlestickData<Time> | LineData<Time>)[];
  volumeData?: HistogramData<Time>[];
  type?: "line" | "candlestick";
  height?: number;
}

const GOLD = "#d4a574";
const GOLD_UP = "#d4a574";
const GOLD_DOWN = "#b94d3a";

function resolveAccent(): string {
  if (typeof document === "undefined") return GOLD;
  return (
    getComputedStyle(document.documentElement)
      .getPropertyValue("--color-accent")
      .trim() || GOLD
  );
}

export default function Chart({
  data,
  volumeData,
  type = "line",
  height = 400,
}: ChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<SeriesType> | null>(null);
  const volumeRef = useRef<ISeriesApi<SeriesType> | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const accent = resolveAccent();

    const chart = createChart(containerRef.current, {
      height,
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: "#a1a1aa",
        attributionLogo: false,
      },
      grid: {
        vertLines: { color: "#2e334520" },
        horzLines: { color: "#2e334520" },
      },
      crosshair: {
        vertLine: { color: `${accent}80`, width: 1, labelBackgroundColor: accent },
        horzLine: { color: `${accent}80`, width: 1, labelBackgroundColor: accent },
      },
      timeScale: {
        borderColor: "#2e3345",
        timeVisible: true,
      },
      rightPriceScale: {
        borderColor: "#2e3345",
      },
      localization: {
        priceFormatter: (price: number) => {
          const abs = Math.abs(price);
          if (abs >= 1_000_000_000) return `${(price / 1_000_000_000).toFixed(2)}B`;
          if (abs >= 1_000_000) return `${(price / 1_000_000).toFixed(2)}M`;
          if (abs >= 1_000) return `${(price / 1_000).toFixed(1)}K`;
          return price.toFixed(0);
        },
      },
    });

    let series: ISeriesApi<SeriesType>;
    if (type === "candlestick") {
      series = chart.addSeries(CandlestickSeries, {
        upColor: GOLD_UP,
        downColor: GOLD_DOWN,
        borderUpColor: GOLD_UP,
        borderDownColor: GOLD_DOWN,
        wickUpColor: GOLD_UP,
        wickDownColor: GOLD_DOWN,
      });
    } else {
      series = chart.addSeries(AreaSeries, {
        lineColor: accent,
        lineWidth: 2,
        topColor: "rgba(212, 165, 116, 0.28)",
        bottomColor: "rgba(212, 165, 116, 0)",
      });
    }
    series.setData(data);
    seriesRef.current = series;

    if (volumeData && volumeData.length > 0) {
      const vol = chart.addSeries(HistogramSeries, {
        color: `${GOLD_UP}30`,
        priceFormat: { type: "volume" },
        priceScaleId: "volume",
      });
      vol.setData(volumeData);
      chart.priceScale("volume").applyOptions({
        scaleMargins: { top: 0.8, bottom: 0 },
      });
      volumeRef.current = vol;
    }

    chart.timeScale().fitContent();
    chartRef.current = chart;

    const observer = new ResizeObserver(() => {
      if (containerRef.current) {
        chart.applyOptions({ width: containerRef.current.clientWidth });
      }
    });
    observer.observe(containerRef.current);

    return () => {
      observer.disconnect();
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
      volumeRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps -- data/volumeData handled by separate effects below
  }, [type, height]);

  // Effect for data updates (without chart recreation)
  useEffect(() => {
    if (seriesRef.current) {
      seriesRef.current.setData(data);
      chartRef.current?.timeScale().fitContent();
    }
  }, [data]);

  // Effect for volume data updates
  useEffect(() => {
    if (volumeRef.current && volumeData) {
      volumeRef.current.setData(volumeData);
    }
  }, [volumeData]);

  return <div ref={containerRef} className="w-full" />;
}
