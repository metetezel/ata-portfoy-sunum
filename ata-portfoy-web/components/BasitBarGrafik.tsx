"use client";

import { BarChart, Bar, XAxis, YAxis, Cell, LabelList } from "recharts";
import { GrafikKapsayici } from "./GrafikKapsayici";

// Recharts' own LabelList `content` prop types x/y/width/height as
// `number | string | undefined` (it also supports categorical/string axes in
// general) — narrowing straight to `number` here type-checked fine under
// `next dev` but failed the stricter `next build` type-check (never run
// until the C:/Z: colleague-flow verification), since a function parameter
// type must accept everything the real prop type can pass. Coerce to Number
// below rather than narrowing the prop type itself.
// `value` is typed `unknown` for the same reason (Recharts' real type is a
// broad `RenderableText` union, e.g. can carry `null`) — coerced below.
type EtiketProps = { x?: number | string; y?: number | string; width?: number | string; height?: number | string; value?: unknown };

function ozelEtiket({ x, y, width, height, value }: EtiketProps, ondalik: number) {
  const valueN = typeof value === "number" ? value : typeof value === "string" ? Number(value) : NaN;
  if (Number.isNaN(valueN) || x == null || y == null || width == null || height == null) return null;
  const xN = Number(x);
  const yN = Number(y);
  const widthN = Number(width);
  const heightN = Number(height);
  const pozitif = valueN >= 0;
  return (
    <text
      x={xN + widthN / 2}
      y={pozitif ? yN - 4 : yN + heightN + 12}
      textAnchor="middle"
      fontSize={10}
      fontWeight={600}
      fill="var(--ink)"
    >
      {valueN.toLocaleString("tr-TR", { minimumFractionDigits: ondalik, maximumFractionDigits: ondalik })}
    </text>
  );
}

// Generic single-series vertical bar chart (category on X, value on top of
// each bar) — extracted after the 2nd real usage (Sayfa 24's 3-bar F/K
// comparison and its 10-country peer F/K chart), then generalized further
// (per-bar color, negative values) for Sayfa 26's 38-year BIST return chart.
export function BasitBarGrafik({
  veri,
  renk = "var(--accent)",
  ondalik = 1,
  etiketAcisi = 0,
  negatifRenk,
}: {
  veri: { kategori: string; deger: number; renk?: string }[];
  renk?: string;
  ondalik?: number;
  // Long category names (e.g. "Güney Afrika") need a rotated tick to avoid
  // overlapping their neighbors — 0 leaves labels horizontal. 90 stacks them
  // fully vertical, for charts with many narrow bars (e.g. 38 years).
  etiketAcisi?: number;
  // When set, bars with a negative value use this color instead of `renk`
  // (or the item's own `renk`) — e.g. "down years" in red.
  negatifRenk?: string;
}) {
  const negatifVar = veri.some((v) => v.deger < 0);
  const degerler = veri.map((v) => v.deger);
  const dataMin = Math.min(0, ...degerler);
  const dataMax = Math.max(0, ...degerler);
  // A reserved minimum share of the vertical range for the negative side
  // (not just dataMin*1.3) — when positive bars are much taller than
  // negative ones (e.g. +493 vs -52), a plain proportional pad leaves the
  // negative bars' value labels almost touching the zero line, right where
  // the rotated category-axis labels sit too. Computed here (not via
  // Recharts' own domain-function shorthand) since that only hands each
  // function its own single boundary value, not both at once.
  const yDomain: [number, number] = negatifVar
    ? [Math.min(dataMin * 1.3, -dataMax * 0.22), dataMax * 1.15]
    : [0, dataMax * 1.15];
  return (
    <GrafikKapsayici>
      {({ width, height }) => (
        <BarChart
          width={width}
          height={height}
          data={veri}
          margin={{ top: 20, right: 8, left: etiketAcisi ? 28 : 8, bottom: etiketAcisi ? (etiketAcisi >= 90 ? 40 : 28) : 4 }}
        >
          <XAxis
            dataKey="kategori"
            interval={0}
            angle={etiketAcisi ? -etiketAcisi : 0}
            textAnchor={etiketAcisi ? "end" : "middle"}
            tick={{ fill: "var(--ink)", fontSize: etiketAcisi >= 90 ? 8 : 11, fontWeight: 600 }}
            axisLine={{ stroke: "var(--line-strong)" }}
            tickLine={false}
          />
          <YAxis hide domain={yDomain} />
          <Bar dataKey="deger" radius={2} maxBarSize={36} isAnimationActive={false}>
            {veri.map((d, i) => (
              <Cell key={i} fill={negatifRenk && d.deger < 0 ? negatifRenk : (d.renk ?? renk)} />
            ))}
            <LabelList dataKey="deger" content={(props: EtiketProps) => ozelEtiket(props, ondalik)} />
          </Bar>
        </BarChart>
      )}
    </GrafikKapsayici>
  );
}
