"use client";

import { BarChart, Bar, XAxis, YAxis, Cell, LabelList } from "recharts";
import type { FonPerformansOzetSatiri } from "@/lib/veriKaynagi";
import { GrafikKapsayici } from "./GrafikKapsayici";

function fmtPct(v: number) {
  return `${v.toLocaleString("tr-TR", { maximumFractionDigits: 2 })}%`;
}

// A single deep loser (RTG at ~-58%) used to stretch the negative side of the
// axis so far that every other bar got squeezed into the right half. Bars
// below this floor are drawn cut at the floor with a "//" axis-break mark,
// while the label still shows the real value.
const NEGATIF_TABAN = -12;

type BarVerisi = { ad: string; deger: number; gosterim: number; kirik: boolean; tip?: "Fon" | "Benchmark" };

type SekilProps = { x?: number; y?: number; width?: number; height?: number; fill?: string; payload?: BarVerisi };

function BarSekli({ x = 0, y = 0, width = 0, height = 0, fill, payload }: SekilProps) {
  // Recharts hands negative bars a negative width; normalize to left/right edges.
  const sol = Math.min(x, x + width);
  const genislik = Math.abs(width);
  if (genislik === 0 || height === 0) return null;
  const negatif = width < 0;
  const r = Math.min(3, genislik / 2, height / 2);
  // Round only the outer end (away from zero).
  const yol = negatif
    ? `M${sol + r},${y} H${sol + genislik} V${y + height} H${sol + r} A${r},${r} 0 0 1 ${sol},${y + height - r} V${y + r} A${r},${r} 0 0 1 ${sol + r},${y} Z`
    : `M${sol},${y} H${sol + genislik - r} A${r},${r} 0 0 1 ${sol + genislik},${y + r} V${y + height - r} A${r},${r} 0 0 1 ${sol + genislik - r},${y + height} H${sol} Z`;
  return (
    <g>
      <path d={yol} fill={fill} />
      {payload?.kirik && (
        <g stroke="#ffffff" strokeWidth={2.5}>
          <line x1={sol + 10} y1={y + height + 2} x2={sol + 15} y2={y - 2} />
          <line x1={sol + 17} y1={y + height + 2} x2={sol + 22} y2={y - 2} />
        </g>
      )}
    </g>
  );
}

type EtiketProps = { x?: number | string; y?: number | string; width?: number | string; height?: number | string; index?: number };

// Fon = accent (teal), Benchmark = accent-warm (orange) — matches every
// fund-detail page's own fon-vs-benchmark convention, kept consistent here
// even though the legacy source page happened to color this one chart the
// other way around (fund bars orange, benchmark bars teal).
export function FonlarPerformansBarGrafik({ satirlar }: { satirlar: FonPerformansOzetSatiri[] }) {
  const veri: BarVerisi[] = [];
  let sonGrup: number | null = null;
  let bosluklar = 0;
  for (const s of satirlar) {
    if (sonGrup !== null && s.Grup !== sonGrup) {
      bosluklar += 1;
      // Unique blank category label (increasing whitespace) so Recharts
      // renders it as its own empty row, creating the gap between clusters.
      veri.push({ ad: " ".repeat(bosluklar), deger: 0, gosterim: 0, kirik: false });
    }
    const kirik = s.Getiri_Yuzde < NEGATIF_TABAN;
    veri.push({
      ad: s.Ad,
      deger: s.Getiri_Yuzde,
      gosterim: kirik ? NEGATIF_TABAN : s.Getiri_Yuzde,
      kirik,
      tip: s.Tip,
    });
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
            // The extra 10 points on the negative side leave room for the
            // value label that sits left of a negative bar.
            domain={[(dataMin: number) => (dataMin < 0 ? dataMin - 10 : 0), (dataMax: number) => dataMax + 8]}
          />
          <YAxis
            type="category"
            dataKey="ad"
            width={290}
            interval={0}
            tick={{ fill: "var(--ink)", fontSize: 11, fontWeight: 600 }}
            axisLine={false}
            tickLine={false}
          />
          <Bar dataKey="gosterim" shape={BarSekli} maxBarSize={14} isAnimationActive={false}>
            {veri.map((d, i) => (
              <Cell
                key={i}
                fill={d.tip === "Benchmark" ? "var(--accent-warm)" : d.tip === "Fon" ? "var(--accent)" : "transparent"}
              />
            ))}
            <LabelList
              dataKey="gosterim"
              // Custom content so the label reads the REAL value (not the
              // floored display value) and so negative bars get their label
              // on the left of the bar end instead of overlapping it.
              content={(p: EtiketProps) => {
                const d = p.index !== undefined ? veri[p.index] : undefined;
                if (!d || d.deger === 0) return null;
                const x = Number(p.x ?? 0);
                const w = Number(p.width ?? 0);
                const y = Number(p.y ?? 0) + Number(p.height ?? 0) / 2;
                const negatif = d.gosterim < 0;
                const uc = negatif ? Math.min(x, x + w) - 4 : Math.max(x, x + w) + 4;
                return (
                  <text
                    x={uc}
                    y={y}
                    dy="0.35em"
                    textAnchor={negatif ? "end" : "start"}
                    fill="var(--ink)"
                    fontSize={11}
                    fontWeight={600}
                  >
                    {fmtPct(d.deger)}
                  </text>
                );
              }}
            />
          </Bar>
        </BarChart>
      )}
    </GrafikKapsayici>
  );
}
