"use client";

import { useEffect, useRef } from "react";
import {
  Chart,
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";

Chart.register(
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Tooltip,
  Legend,
  Filler
);

/** Simple linear regression — used to draw dashed trend lines. */
function linearFit(ys: number[]): number[] {
  const n = ys.length;
  if (n < 2) return ys.slice();
  const xs = ys.map((_, i) => i);
  const mx = xs.reduce((a, b) => a + b, 0) / n;
  const my = ys.reduce((a, b) => a + b, 0) / n;
  let num = 0;
  let den = 0;
  for (let i = 0; i < n; i++) {
    num += (xs[i] - mx) * (ys[i] - my);
    den += (xs[i] - mx) * (xs[i] - mx);
  }
  const m = den === 0 ? 0 : num / den;
  const b = my - m * mx;
  return xs.map((x) => m * x + b);
}

export function TrendChart({
  years,
  revenues,
  sdes,
}: {
  years: string[];
  revenues: number[];
  sdes: number[];
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<Chart | null>(null);

  useEffect(() => {
    const el = canvasRef.current;
    if (!el || years.length < 2) return;

    chartRef.current?.destroy();

    chartRef.current = new Chart(el, {
      type: "line",
      data: {
        labels: years,
        datasets: [
          {
            label: "Revenue",
            data: revenues,
            borderColor: "#F5F2EC",
            backgroundColor: "rgba(245,242,236,0.06)",
            pointBackgroundColor: "#F5F2EC",
            pointRadius: 5,
            tension: 0.3,
            borderWidth: 2,
          },
          {
            label: "SDE",
            data: sdes,
            borderColor: "#00C9A7",
            backgroundColor: "rgba(0,201,167,0.06)",
            pointBackgroundColor: "#00C9A7",
            pointRadius: 5,
            tension: 0.3,
            borderWidth: 2,
          },
          {
            label: "Revenue trend",
            data: linearFit(revenues),
            borderColor: "rgba(245,242,236,0.3)",
            borderDash: [6, 4],
            pointRadius: 0,
            borderWidth: 1.5,
          },
          {
            label: "SDE trend",
            data: linearFit(sdes),
            borderColor: "rgba(0,201,167,0.3)",
            borderDash: [6, 4],
            pointRadius: 0,
            borderWidth: 1.5,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            labels: { color: "#9AA5B4", font: { size: 11 }, boxWidth: 14, padding: 14 },
          },
          tooltip: {
            backgroundColor: "#1A2F50",
            borderColor: "rgba(0,201,167,0.3)",
            borderWidth: 1,
            titleColor: "#F5F2EC",
            bodyColor: "#9AA5B4",
            callbacks: {
              label: (c) =>
                ` ${c.dataset.label}: $${Math.round(c.parsed.y).toLocaleString()}`,
            },
          },
        },
        scales: {
          x: {
            grid: { color: "rgba(154,165,180,0.08)" },
            ticks: { color: "#9AA5B4", font: { size: 11 } },
          },
          y: {
            grid: { color: "rgba(154,165,180,0.08)" },
            ticks: {
              color: "#9AA5B4",
              font: { size: 11 },
              callback: (v) => {
                const n = typeof v === "number" ? v : parseFloat(String(v));
                return n >= 1_000_000
                  ? `$${(n / 1_000_000).toFixed(1)}M`
                  : n >= 1000
                    ? `$${(n / 1000).toFixed(0)}k`
                    : `$${n}`;
              },
            },
          },
        },
      },
    });

    return () => {
      chartRef.current?.destroy();
      chartRef.current = null;
    };
  }, [years, revenues, sdes]);

  if (years.length < 2) {
    return (
      <p className="rounded-lg border border-[0.5px] border-border bg-navy/50 p-4 text-xs text-muted">
        Enter at least 2 years of data to see the trend chart.
      </p>
    );
  }

  return (
    <div className="relative h-64 w-full">
      <canvas ref={canvasRef} />
    </div>
  );
}
