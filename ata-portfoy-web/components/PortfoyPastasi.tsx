"use client";

import { PieChart, Pie, Cell, Tooltip, Legend } from "recharts";
import type { FonDagilimSatiri } from "@/lib/veriKaynagi";
import { GrafikKapsayici } from "./GrafikKapsayici";

// Validated categorical ramp (see dataviz skill reference palette) — fixed order,
// never cycled/reassigned per render so a category keeps its color across weeks.
// Exported so other pie/donut charts in the deck (e.g. Yatirim100TLPastasi)
// share the same palette instead of each picking their own.
export const KATEGORIK_LIGHT = ["#2a78d6", "#eb6834", "#1baf7a", "#eda100", "#e87ba4", "#008300", "#4a3aa7", "#e34948"];
export const KATEGORIK_DARK = ["#3987e5", "#d95926", "#199e70", "#c98500", "#d55181", "#008300", "#9085e9", "#e66767"];

function useTemaRengi() {
  if (typeof window === "undefined") return KATEGORIK_LIGHT;
  const isDark = document.documentElement.getAttribute("data-theme") === "dark" ||
    (window.matchMedia?.("(prefers-color-scheme: dark)").matches &&
      document.documentElement.getAttribute("data-theme") !== "light");
  return isDark ? KATEGORIK_DARK : KATEGORIK_LIGHT;
}

export function PortfoyPastasi({
  veri,
  yukseklik = 240,
  tema,
}: {
  veri: FonDagilimSatiri[];
  yukseklik?: number;
  tema?: "light" | "dark";
}) {
  const otoTema = useTemaRengi();
  const renkler = tema ? (tema === "dark" ? KATEGORIK_DARK : KATEGORIK_LIGHT) : otoTema;
  const data = veri.map((v, i) => ({
    name: v.Varlik_Sinifi,
    value: v.Yuzde,
    fill: renkler[i % renkler.length],
  }));

  // Legend space must scale with the actual number of categories, not a
  // fixed ~28px slice of whatever height the caller happened to pass — that
  // fixed cap was only ever "enough" by coincidence for every fund built so
  // far (2-4 categories each). AED's portfolio pie has 5, and the legend's
  // 5th line silently overflowed below this component's fixed-height box
  // into whatever followed it on the page (found 2026-07-29). Computing a
  // minimum container height from data.length here — rather than requiring
  // every caller to know and pass the right number — means a future fund
  // with even more categories keeps working with zero extra code.
  //
  // data.length alone isn't enough, though (found 2026-07-30, ANZ): a
  // single LONG category name (e.g. "Kamu Dış Borçlanma Araçları — 96,88%")
  // wraps to 2 lines by itself in this narrow sidebar column even with only
  // 2 categories total — the old 1-line-per-category budget under-counted
  // it, and the legend's real (wrapped) height overflowed into whatever
  // followed the pie on the page (here, the CDS mini-chart below it).
  // Estimating 2 lines for any name+percent long enough to plausibly wrap,
  // instead of assuming every category is exactly 1 line.
  const legendSatirYuksekligi = 15;
  const satirSayisi = data.reduce((toplam, d) => toplam + (d.name.length > 20 ? 2 : 1), 0);
  const minCizimYuksekligi = 70;
  const efektifYukseklik = Math.max(yukseklik, minCizimYuksekligi + satirSayisi * legendSatirYuksekligi);

  return (
    <GrafikKapsayici height={efektifYukseklik}>
      {({ width, height }) => {
        // Legend reserves space at the bottom — keep the arc inside what's left,
        // sized off the actual measured box instead of a fixed px radius that
        // overflows a narrow sidebar column.
        const legendYuksekligi = satirSayisi * legendSatirYuksekligi;
        const cizimYuksekligi = height - legendYuksekligi;
        const disYaricap = Math.max(24, Math.min(width, cizimYuksekligi) / 2 - 6);
        const icYaricap = disYaricap * 0.6;

        return (
          <PieChart width={width} height={height}>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy={cizimYuksekligi / 2}
              innerRadius={icYaricap}
              outerRadius={disYaricap}
              paddingAngle={2}
              strokeWidth={2}
              stroke="var(--bg-raised)"
              isAnimationActive={false}
            >
              {data.map((d, i) => (
                <Cell key={i} fill={d.fill} />
              ))}
            </Pie>
            <Tooltip
              // Recharts' real Tooltip `formatter` types `value` as possibly
              // undefined — narrowing to `number` type-checks under `next
              // dev` but fails `next build`'s stricter check.
              formatter={(value: unknown, name: unknown) => [`${value}%`, `${name}`]}
              contentStyle={{
                background: "var(--bg-raised)",
                border: "1px solid var(--line-strong)",
                borderRadius: 8,
                fontSize: 12,
              }}
            />
            <Legend
              verticalAlign="bottom"
              height={legendYuksekligi}
              formatter={(value, entry) => {
                const yuzde = (entry?.payload as unknown as { value?: number })?.value;
                return (
                  <span className="text-xs text-ink-soft">
                    {value}
                    {yuzde !== undefined ? ` — ${yuzde}%` : ""}
                  </span>
                );
              }}
            />
          </PieChart>
        );
      }}
    </GrafikKapsayici>
  );
}
