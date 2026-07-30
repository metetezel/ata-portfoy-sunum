"use client";

import { BarChart, Bar, XAxis, YAxis, Cell, LabelList } from "recharts";
import type { FonPerformansOzetSatiri } from "@/lib/veriKaynagi";
import { GrafikKapsayici } from "./GrafikKapsayici";

function fmtPct(v: number) {
  return `${v.toLocaleString("tr-TR", { maximumFractionDigits: 2 })}%`;
}

// Fon = accent (teal), Benchmark = accent-warm (orange) — matches every
// fund-detail page's own fon-vs-benchmark convention, kept consistent here
// even though the legacy source page happened to color this one chart the
// other way around (fund bars orange, benchmark bars teal).
export function FonlarPerformansBarGrafik({ satirlar }: { satirlar: FonPerformansOzetSatiri[] }) {
  const veri: { ad: string; deger: number; tip?: "Fon" | "Benchmark" }[] = [];
  let sonGrup: number | null = null;
  let bosluklar = 0;
  for (const s of satirlar) {
    if (sonGrup !== null && s.Grup !== sonGrup) {
      bosluklar += 1;
      // Unique blank category label (increasing whitespace) so Recharts
      // renders it as its own empty row, creating the gap between clusters.
      veri.push({ ad: " ".repeat(bosluklar), deger: 0 });
    }
    veri.push({ ad: s.Ad, deger: s.Getiri_Yuzde, tip: s.Tip });
    sonGrup = s.Grup;
  }

  return (
    <GrafikKapsayici>
      {({ width, height }) => (
        <BarChart
          layout="vertical"
          width={width}
          height={height}
          data={veri}
          margin={{ top: 4, right: 44, left: 4, bottom: 4 }}
        >
          <XAxis
            type="number"
            hide
            // Floor stays at 0 for the common all-positive case, but extends
            // below zero when a fund actually posted a negative return —
            // a hardcoded [0, ...] domain clips negative bars off entirely.
            domain={[(dataMin: number) => Math.min(0, dataMin) - 3, (dataMax: number) => dataMax + 8]}
          />
          <YAxis
            type="category"
            dataKey="ad"
            width={230}
            interval={0}
            tick={{ fill: "var(--ink)", fontSize: 11, fontWeight: 600 }}
            axisLine={false}
            tickLine={false}
          />
          <Bar dataKey="deger" radius={[0, 3, 3, 0]} maxBarSize={14} isAnimationActive={false}>
            {veri.map((d, i) => (
              <Cell
                key={i}
                fill={d.tip === "Benchmark" ? "var(--accent-warm)" : d.tip === "Fon" ? "var(--accent)" : "transparent"}
              />
            ))}
            <LabelList
              dataKey="deger"
              position="right"
              // Recharts' real `formatter` types its argument as a broad
              // `RenderableText` union (incl. undefined), not a plain
              // `number` — narrowing to `number` type-checks under `next
              // dev` but fails `next build`'s stricter check.
              formatter={(v: unknown) => (typeof v === "number" && v !== 0 ? fmtPct(v) : "")}
              fill="var(--ink)"
              fontSize={11}
              fontWeight={600}
            />
          </Bar>
        </BarChart>
      )}
    </GrafikKapsayici>
  );
}
