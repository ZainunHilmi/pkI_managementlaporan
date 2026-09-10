"use client";

import { useMemo, useState } from "react";
import type { DailyStat } from "@/lib/dummy-stats";

// Grafik aktivitas 7 hari yang interaktif: tab pemilih metrik
// (Masuk / Keluar / Total), batang animasi, tooltip per hari,
// garis rata-rata, dan penanda hari tersibuk.
// Murni HTML/CSS — tanpa library grafik tambahan agar ringan.
type MetricKey = "masuk" | "keluar" | "total";

const METRICS: Record<
  MetricKey,
  { label: string; bar: string; soft: string; tabActive: string; hex: string }
> = {
  masuk: {
    label: "Masuk",
    bar: "bg-emerald-500",
    soft: "bg-emerald-50 text-emerald-700",
    tabActive: "bg-emerald-600 text-white shadow-sm",
    hex: "#10b981",
  },
  keluar: {
    label: "Keluar",
    bar: "bg-rose-500",
    soft: "bg-rose-50 text-rose-700",
    tabActive: "bg-rose-500 text-white shadow-sm",
    hex: "#f43f5e",
  },
  total: {
    label: "Total",
    bar: "bg-indigo-500",
    soft: "bg-indigo-50 text-indigo-700",
    tabActive: "bg-indigo-600 text-white shadow-sm",
    hex: "#6366f1",
  },
};

const ORDER: MetricKey[] = ["masuk", "keluar", "total"];

export default function WeeklyChart({ data }: { data: DailyStat[] }) {
  const [metric, setMetric] = useState<MetricKey>("masuk");
  const [hover, setHover] = useState<number | null>(null);

  const totals = useMemo(
    () => ({
      masuk: data.reduce((a, d) => a + d.masuk, 0),
      keluar: data.reduce((a, d) => a + d.keluar, 0),
      total: data.reduce((a, d) => a + d.total, 0),
    }),
    [data]
  );

  const cfg = METRICS[metric];
  const values = data.map((d) => d[metric]);
  const maxV = Math.max(10, ...values);
  const avg = values.reduce((a, v) => a + v, 0) / values.length;
  const peakIdx = values.indexOf(Math.max(...values));
  const peakDay = data[peakIdx];

  return (
    <div>
      {/* Tab pemilih metrik */}
      <div className="mb-4 flex flex-wrap gap-2" role="tablist" aria-label="Pilih metrik grafik">
        {ORDER.map((k) => (
          <button
            key={k}
            type="button"
            role="tab"
            aria-selected={metric === k}
            onClick={() => setMetric(k)}
            className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition-all duration-200 active:scale-[0.97] ${
              metric === k
                ? METRICS[k].tabActive
                : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
            }`}
          >
            <span className={`h-2.5 w-2.5 rounded-sm ${METRICS[k].bar}`} />
            {METRICS[k].label}
            <span
              className={`rounded-md px-1.5 py-0.5 text-xs font-semibold tabular-nums ${
                metric === k ? "bg-white/20" : METRICS[k].soft
              }`}
            >
              {totals[k]}
            </span>
          </button>
        ))}
      </div>

      {/* Area batang */}
      <div
        className="relative h-52"
        role="img"
        aria-label={`Grafik ${cfg.label} 7 hari terakhir`}
        onMouseLeave={() => setHover(null)}
      >
        {/* Grid */}
        {[25, 50, 75, 100].map((p) => (
          <div
            key={p}
            className="absolute inset-x-0 border-t border-dashed border-slate-200"
            style={{ bottom: `${p}%` }}
          />
        ))}

        {/* Garis rata-rata */}
        <div
          className="pointer-events-none absolute inset-x-0 border-t-2 border-dashed border-slate-400/70"
          style={{ bottom: `${(avg / maxV) * 100}%` }}
        >
          <span className="absolute -top-5 right-0 text-[11px] tabular-nums text-slate-400">
            rata-rata {avg.toFixed(1)}
          </span>
        </div>

        {/* Batang */}
        <div className="absolute inset-0 flex items-stretch justify-around gap-1 sm:gap-2">
          {data.map((d, i) => (
            <div
              key={d.key}
              className="relative flex h-full flex-1 cursor-pointer flex-col items-center justify-end"
              onMouseEnter={() => setHover(i)}
              onClick={() => setHover(hover === i ? null : i)}
            >
              {/* Tooltip */}
              {hover === i && (
                <div
                  className={`absolute bottom-full z-10 mb-2 whitespace-nowrap rounded-xl border border-slate-200 bg-white px-3 py-2 text-left shadow-lg ${
                    i === 0
                      ? "left-0"
                      : i === data.length - 1
                        ? "right-0"
                        : "left-1/2 -translate-x-1/2"
                  }`}
                >
                  <p className="text-xs font-semibold text-slate-800">
                    {d.dayName}, {d.label}
                  </p>
                  <p className="mt-1 text-xs tabular-nums text-emerald-600">
                    Masuk: +{d.masuk}
                  </p>
                  <p className="text-xs tabular-nums text-rose-600">
                    Keluar: −{d.keluar}
                  </p>
                  <p className="text-xs font-semibold tabular-nums text-slate-700">
                    Total: {d.total}
                  </p>
                </div>
              )}
              <div
                className={`w-full max-w-10 rounded-t-lg ${cfg.bar} transition-[height] duration-500 ease-out ${
                  hover === i ? "opacity-100" : "opacity-85"
                }`}
                style={{
                  height: `${Math.max(3, (values[i] / maxV) * 100)}%`,
                  boxShadow:
                    i === peakIdx ? `0 0 0 2px ${cfg.hex}` : undefined,
                }}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Label sumbu X */}
      <div className="mt-2 flex justify-around gap-1 sm:gap-2">
        {data.map((d) => (
          <div key={d.key} className="flex-1 text-center">
            <p className="text-[11px] font-semibold text-slate-600">{d.dayName}</p>
            <p className="text-[10px] tabular-nums text-slate-400">{d.label}</p>
          </div>
        ))}
      </div>

      {/* Ringkasan */}
      <div className="mt-4 grid grid-cols-3 gap-2 border-t border-slate-100 pt-3 text-center">
        <div>
          <p className="text-[11px] uppercase tracking-wide text-slate-400">Rata-rata/hari</p>
          <p className="text-sm font-semibold tabular-nums text-slate-800">{avg.toFixed(1)}</p>
        </div>
        <div>
          <p className="text-[11px] uppercase tracking-wide text-slate-400">Hari tersibuk</p>
          <p className="text-sm font-semibold text-slate-800">
            {peakDay.dayName} <span className="tabular-nums text-slate-400">({peakDay[metric]})</span>
          </p>
        </div>
        <div>
          <p className="text-[11px] uppercase tracking-wide text-slate-400">Total minggu</p>
          <p className="text-sm font-semibold tabular-nums text-slate-800">{totals[metric]}</p>
        </div>
      </div>
    </div>
  );
}
