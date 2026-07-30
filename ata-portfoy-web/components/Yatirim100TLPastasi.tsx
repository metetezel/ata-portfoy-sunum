"use client";

import { PieChart, Pie, Cell } from "recharts";
import type { Yatirim100TLDagilimSatiri } from "@/lib/veriKaynagi";
import { KATEGORIK_LIGHT } from "./PortfoyPastasi";
import { GrafikKapsayici } from "./GrafikKapsayici";

const RAD = Math.PI / 180;

// Hero-sized donut with labels planted just outside the ring (name + percent,
// leader line back to the slice) — distinct from PortfoyPastasi's small
// sidebar style (legend below), which would read as too minor for what's a
// brand-statement page, not a comparative data chart.
export function Yatirim100TLPastasi({
  veri,
  yukseklik = 260,
}: {
  veri: Yatirim100TLDagilimSatiri[];
  yukseklik?: number;
}) {
  const data = veri.map((v, i) => ({
    name: v.Varlik_Sinifi,
    value: v.Yuzde,
    fill: KATEGORIK_LIGHT[i % KATEGORIK_LIGHT.length],
  }));

  return (
    <GrafikKapsayici height={yukseklik}>
      {({ width, height }) => {
        const yaricap = Math.min(width, height) / 2 - 56;
        return (
          <PieChart width={width} height={height}>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={yaricap * 0.55}
              outerRadius={yaricap}
              startAngle={90}
              endAngle={-270}
              paddingAngle={2}
              strokeWidth={2}
              stroke="var(--bg-raised)"
              isAnimationActive={false}
              labelLine={{ stroke: "var(--line-strong)" }}
              // Recharts' real PieLabelRenderProps types every field as
              // possibly undefined — narrowing to required `number`/`string`
              // type-checks under `next dev` but fails `next build`'s
              // stricter check.
              label={(props: { cx?: number; cy?: number; midAngle?: number; outerRadius?: number; name?: string; value?: number }) => {
                const { cx, cy, midAngle, outerRadius, name, value } = props;
                if (cx == null || cy == null || midAngle == null || outerRadius == null) return null;
                const r = outerRadius + 22;
                const x = cx + r * Math.cos(-midAngle * RAD);
                const y = cy + r * Math.sin(-midAngle * RAD);
                return (
                  <text
                    x={x}
                    y={y}
                    textAnchor={x > cx ? "start" : "end"}
                    dominantBaseline="central"
                    fontSize={13}
                    fontWeight={700}
                    fill="var(--ink)"
                  >
                    {name}: %{value}
                  </text>
                );
              }}
            >
              {data.map((d, i) => (
                <Cell key={i} fill={d.fill} />
              ))}
            </Pie>
          </PieChart>
        );
      }}
    </GrafikKapsayici>
  );
}
