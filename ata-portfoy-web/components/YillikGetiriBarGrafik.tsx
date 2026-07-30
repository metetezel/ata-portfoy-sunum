"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, LabelList } from "recharts";
import type { FonYillikKarsilastirmaSatiri } from "@/lib/veriKaynagi";
import { GrafikKapsayici } from "./GrafikKapsayici";

// Recharts' real Tooltip/LabelList `formatter` types their value argument as
// possibly undefined/non-numeric — narrowing to `number` type-checks under
// `next dev` but fails `next build`'s stricter check.
function fmtPct(v: unknown) {
  const n = typeof v === "number" ? v : typeof v === "string" ? Number(v) : NaN;
  return Number.isNaN(n) ? "" : `${n.toLocaleString("tr-TR", { maximumFractionDigits: 1 })}%`;
}

export function YillikGetiriBarGrafik({
  donem,
  satirlar,
  fonAdi,
  benchmarkAdi,
  yukseklik = 200,
  donemAraligi,
}: {
  donem: string;
  satirlar: FonYillikKarsilastirmaSatiri[];
  fonAdi: string;
  benchmarkAdi: string;
  yukseklik?: number;
  donemAraligi?: string;
}) {
  const veri = satirlar
    .filter((s) => s.Donem === donem)
    .map((s) => ({
      paraBirimi: s.Para_Birimi,
      fon: s.Fon_Getiri_Yillik,
      benchmark: s.Benchmark_Getiri_Yillik,
    }));

  if (veri.length === 0) return null;

  return (
    <div>
      <div className="mb-2 text-sm font-semibold text-ink">{donem.replace("Son ", "Son ")}</div>
      <GrafikKapsayici height={yukseklik}>
        {({ width, height }) => (
          <BarChart width={width} height={height} data={veri} margin={{ top: 16, right: 12, left: 0, bottom: 0 }} barGap={4}>
            <CartesianGrid stroke="var(--line)" vertical={false} />
            <XAxis
              dataKey="paraBirimi"
              tick={{ fill: "var(--ink-faint)", fontSize: 11 }}
              axisLine={{ stroke: "var(--line-strong)" }}
              tickLine={false}
            />
            <YAxis tick={{ fill: "var(--ink-faint)", fontSize: 11 }} axisLine={false} tickLine={false} width={40} />
            <Tooltip
              formatter={(value: unknown) => fmtPct(value)}
              contentStyle={{
                background: "var(--bg-raised)",
                border: "1px solid var(--line-strong)",
                borderRadius: 8,
                fontSize: 12,
              }}
            />
            <Legend
              formatter={(value) => (
                <span className="text-xs text-ink-soft">{value === "fon" ? fonAdi : benchmarkAdi}</span>
              )}
            />
            <Bar dataKey="fon" name="fon" fill="var(--accent)" radius={[4, 4, 0, 0]} maxBarSize={48} isAnimationActive={false}>
              <LabelList dataKey="fon" position="top" formatter={fmtPct} fill="var(--ink-soft)" fontSize={11} />
            </Bar>
            <Bar dataKey="benchmark" name="benchmark" fill="var(--accent-warm)" radius={[4, 4, 0, 0]} maxBarSize={48} isAnimationActive={false}>
              <LabelList dataKey="benchmark" position="top" formatter={fmtPct} fill="var(--ink-soft)" fontSize={11} />
            </Bar>
          </BarChart>
        )}
      </GrafikKapsayici>
      {donemAraligi && (
        <div className="mt-1 text-center font-data text-xs text-ink-faint">{donemAraligi}</div>
      )}
    </div>
  );
}
