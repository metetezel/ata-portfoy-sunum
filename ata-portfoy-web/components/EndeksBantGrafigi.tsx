"use client";

import { LineChart, Line, XAxis, YAxis, CartesianGrid, ReferenceLine } from "recharts";
import { GrafikKapsayici } from "./GrafikKapsayici";

const AY_KISA = [
  "Oca", "Şub", "Mar", "Nis", "May", "Haz",
  "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara",
];

function ocakEtiketi(tarih: string) {
  const [y] = tarih.split("-").map(Number);
  return `${AY_KISA[0]} ${y}`;
}

function ayEtiketi(tarih: string) {
  const [, m] = tarih.split("-").map(Number);
  return AY_KISA[m - 1];
}

// A single line plus a handful of constant horizontal reference bands
// (median/±stdev, average/±1std/max/min, etc.) — the shared shape behind
// both Sayfa 25 charts (USD-based BIST-100 index and Market Cap/GDP ratio).
// Extracted up front rather than after a 2nd usage since both charts were
// planned together and are structurally identical from the start.
export function EndeksBantGrafigi({
  veri,
  bantlar,
  cizgiRenk = "var(--accent)",
  ondalik = 0,
  yukseklik,
  tikModu = "yillik",
}: {
  veri: { tarih: string; deger: number }[];
  bantlar: { etiket: string; deger: number; renk: string; kesikli?: boolean }[];
  cizgiRenk?: string;
  ondalik?: number;
  yukseklik?: number;
  // "yillik" (varsayılan): Sayfa 25/27'nin çok-yıllı serileri için bir Ocak
  // ayı başına tek tik. Kısa (~1 yıllık) pencereli seriler için (ör. ANZ'nin
  // CDS mini-grafiği) bu neredeyse hiç tik üretmez — "aylik" her ay başına
  // bir tik üretir.
  tikModu?: "yillik" | "aylik";
}) {
  // Explicit per-year/per-month ticks (nearest sampled point on/after each
  // period's 1st) instead of Recharts' auto interval — reproduces the legacy
  // charts' exact tick spacing, which a numeric interval guess can't
  // guarantee given the irregular (adaptive-downsampled) date spacing.
  const ticks: string[] = [];
  if (tikModu === "yillik") {
    const yillar = new Set<number>();
    for (const v of veri) yillar.add(Number(v.tarih.slice(0, 4)));
    for (const yil of yillar) {
      const hedef = `${yil}-01-01`;
      const nokta = veri.find((v) => v.tarih >= hedef);
      if (nokta) ticks.push(nokta.tarih);
    }
  } else {
    const aylar = new Set<string>();
    for (const v of veri) aylar.add(v.tarih.slice(0, 7));
    for (const ay of aylar) {
      const hedef = `${ay}-01`;
      const nokta = veri.find((v) => v.tarih >= hedef);
      if (nokta) ticks.push(nokta.tarih);
    }
  }

  const degerler = [...veri.map((v) => v.deger), ...bantlar.map((b) => b.deger)];
  const veriMin = Math.min(...degerler);
  const veriMax = Math.max(...degerler);
  const pay = (veriMax - veriMin) * 0.06;
  const yEkseniAraligi: [number, number] = [Math.max(0, veriMin - pay), veriMax + pay];

  const fmt = (v: number) => v.toLocaleString("tr-TR", { minimumFractionDigits: ondalik, maximumFractionDigits: ondalik });

  return (
    <GrafikKapsayici height={yukseklik}>
      {({ width, height }) => (
        <LineChart width={width} height={height} data={veri} margin={{ top: 8, right: 44, left: 0, bottom: 24 }}>
          <CartesianGrid stroke="var(--line)" strokeDasharray="0" vertical={false} />
          <XAxis
            dataKey="tarih"
            ticks={ticks}
            tickFormatter={tikModu === "yillik" ? ocakEtiketi : ayEtiketi}
            tick={{ fill: "var(--ink-faint)", fontSize: 9 }}
            axisLine={{ stroke: "var(--line-strong)" }}
            tickLine={false}
            angle={-40}
            textAnchor="end"
            height={36}
          />
          <YAxis
            tick={{ fill: "var(--ink-faint)", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            width={40}
            domain={yEkseniAraligi}
            tickFormatter={fmt}
          />
          {bantlar.map((b) => (
            <ReferenceLine
              key={b.etiket}
              y={b.deger}
              stroke={b.renk}
              strokeWidth={1.5}
              strokeDasharray={b.kesikli ? "5 4" : undefined}
              label={{ value: fmt(b.deger), position: "right", fill: b.renk, fontSize: 10, fontWeight: 700 }}
            />
          ))}
          <Line type="monotone" dataKey="deger" stroke={cizgiRenk} strokeWidth={1.75} dot={false} isAnimationActive={false} />
        </LineChart>
      )}
    </GrafikKapsayici>
  );
}
