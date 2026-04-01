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
  LineSeries,
  HistogramSeries,
} from "lightweight-charts";

interface ChartProps {
  data: (CandlestickData<Time> | LineData<Time>)[];
  volumeData?: HistogramData<Time>[];
  type?: "line" | "candlestick";
  height?: number;
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

    const chart = createChart(containerRef.current, {
      height,
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: "#a1a1aa",
      },
      grid: {
        vertLines: { color: "#2e334520" },
        horzLines: { color: "#2e334520" },
      },
      crosshair: {
        vertLine: { color: "#3b82f680", width: 1, labelBackgroundColor: "#3b82f6" },
        horzLine: { color: "#3b82f680", width: 1, labelBackgroundColor: "#3b82f6" },
      },
      timeScale: {
        borderColor: "#2e3345",
        timeVisible: true,
      },
      rightPriceScale: {
        borderColor: "#2e3345",
      },
    });

    let series: ISeriesApi<SeriesType>;
    if (type === "candlestick") {
      series = chart.addSeries(CandlestickSeries, {
        upColor: "#22c55e",
        downColor: "#ef4444",
        borderUpColor: "#22c55e",
        borderDownColor: "#ef4444",
        wickUpColor: "#22c55e",
        wickDownColor: "#ef4444",
      });
    } else {
      series = chart.addSeries(LineSeries, {
        color: "#3b82f6",
        lineWidth: 2,
      });
    }
    series.setData(data);
    seriesRef.current = series;

    if (volumeData && volumeData.length > 0) {
      const vol = chart.addSeries(HistogramSeries, {
        color: "#3b82f630",
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
