"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import type { FiyatNoktasi } from "@/lib/fiyatSerisi";
import { GrafikKapsayici } from "./GrafikKapsayici";

function fmtTarih(t: string) {
  const [y, m] = t.split("-");
  return `${m}/${y.slice(2)}`;
}

const AY_ADLARI = [
  "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
  "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık",
];

function ayYiliEtiketi(t: string) {
  const [y, m] = t.split("-").map(Number);
  return `${AY_ADLARI[m - 1]} ${y}`;
}

// Recharts' real `label` render-prop types x/y as `number | string` and
// value as a broad `RenderableText` union (can include `null`) — narrowing
// straight to `number` type-checks fine under `next dev` but fails the
// stricter `next build` check, since the callback must accept everything the
// real prop type can pass. Coerce below instead of narrowing the param type.
type EtiketProps = { x?: number | string; y?: number | string; value?: unknown; index?: number };

// Legacy PDF/Excel'deki gibi, çizginin son noktasına büyük renkli rakam
// etiketi — sadece SON noktada render edilir (Recharts'ın `label` prop'u
// varsayılan olarak HER noktaya bir etiket koyar, bu yüzden `index` ile
// filtreliyoruz). Sayfa 27 (MSCI MXWO vs MXEF) için eklendi, opsiyonel
// prop'un arkasında — mevcut 13 fon sayfasının görünümünü değiştirmiyor.
function sonNoktaEtiketi(renk: string, sonIndex: number, ondalik: number) {
  return ({ x, y, value, index }: EtiketProps) => {
    const valueN = typeof value === "number" ? value : typeof value === "string" ? Number(value) : NaN;
    if (index !== sonIndex || Number.isNaN(valueN) || x == null || y == null) return null;
    const xN = Number(x);
    const yN = Number(y);
    return (
      <text x={xN + 8} y={yN} dy={5} fill={renk} fontSize={15} fontWeight={700} textAnchor="start">
        {valueN.toLocaleString("tr-TR", { minimumFractionDigits: ondalik, maximumFractionDigits: ondalik })}
      </text>
    );
  };
}

function CustomTooltip({
  active,
  payload,
  label,
  fonAdi,
  benchmarkAdi,
  benchmark2Adi,
}: {
  active?: boolean;
  payload?: { value: number | null; dataKey: string }[];
  label?: string;
  fonAdi: string;
  benchmarkAdi?: string;
  benchmark2Adi?: string;
}) {
  if (!active || !payload?.length) return null;
  const fon = payload.find((p) => p.dataKey === "fon")?.value;
  const bist = payload.find((p) => p.dataKey === "benchmark")?.value;
  const bist2 = payload.find((p) => p.dataKey === "benchmark2")?.value;
  return (
    <div className="rounded-md border border-line-strong bg-bg-raised px-3 py-2 text-xs shadow-lg">
      <div className="mb-1 font-data text-ink-faint">{label}</div>
      {fon != null && (
        <div className="flex items-center gap-1.5">
          <span className="inline-block h-2 w-2 rounded-full" style={{ background: "var(--accent)" }} />
          <span className="text-ink-soft">{fonAdi}</span>
          <span className="ml-auto font-data font-semibold text-ink">{fon.toFixed(0)}</span>
        </div>
      )}
      {bist != null && (
        <div className="flex items-center gap-1.5">
          <span className="inline-block h-2 w-2 rounded-full" style={{ background: "var(--accent-warm)" }} />
          <span className="text-ink-soft">{benchmarkAdi}</span>
          <span className="ml-auto font-data font-semibold text-ink">{bist.toFixed(0)}</span>
        </div>
      )}
      {bist2 != null && (
        <div className="flex items-center gap-1.5">
          <span className="inline-block h-2 w-2 rounded-full" style={{ background: "var(--accent-alt)" }} />
          <span className="text-ink-soft">{benchmark2Adi}</span>
          <span className="ml-auto font-data font-semibold text-ink">{bist2.toFixed(0)}</span>
        </div>
      )}
    </div>
  );
}

export function FonFiyatGrafigi({
  veri,
  fonAdi,
  benchmarkAdi,
  benchmark2Adi,
  yukseklik,
  endekslenmis = true,
  sonDegerEtiketleriGoster = false,
  sonDegerOndalik = 1,
  benchmarkIkinciEksen = false,
}: {
  veri: FiyatNoktasi[];
  fonAdi: string;
  // Absent for funds with no benchmark at all (e.g. PKP) — chart then
  // renders as a single line, no second Line/legend entry.
  benchmarkAdi?: string;
  // Only set for a fund compared against TWO benchmarks at once (currently
  // just AED) — adds a third line/legend/tooltip entry.
  benchmark2Adi?: string;
  yukseklik?: number;
  // False for a plain two-index comparison (e.g. Sayfa 27's MSCI MXWO vs
  // MXEF) whose values are real index levels, not rebased to 100 from the
  // fund's own start — suppresses the "=100 endekslenmiş fiyattır" footnote,
  // which would otherwise misdescribe the data.
  endekslenmis?: boolean;
  // Legacy PDF/Excel'deki gibi son değerleri çizginin ucunda büyük, marka
  // renkli rakamlarla göster (Sayfa 27 için) — varsayılan kapalı, fon
  // sayfalarının görünümü değişmesin diye.
  sonDegerEtiketleriGoster?: boolean;
  sonDegerOndalik?: number;
  // ANZ'ye özel (2026-08-31, Mete'nin "grafik çok saçma görünüyor" tespiti
  // üzerine): fon 10 yılda 100'den 772'ye çıkarken benchmark'ı (KYD USD
  // Mevduat, düz bir USD mevduat faizi) sadece 100'den 121'e çıkıyor — tek
  // eksen paylaşıldığında benchmark çizgisi grafiğin sadece ~%2,5'ini
  // kaplayıp dibe yapışık düz bir çizgi gibi görünüyordu, karşılaştırma
  // anlamsızlaşıyordu. Benchmark'a kendi sağ eksenini vermek, iki serinin
  // KENDİ ölçeğinde gerçek hareketini görünür kılıyor. Varsayılan kapalı —
  // diğer 12 fon sayfasının zaten onaylanmış görünümünü değiştirmesin diye.
  benchmarkIkinciEksen?: boolean;
}) {
  const gosterilecek = veri.map((v) => ({ ...v, tarihEtiket: fmtTarih(v.tarih) }));
  const sonIndex = gosterilecek.length - 1;
  const benchmarkVar = !!benchmarkAdi && veri.some((v) => v.benchmark != null);
  const benchmark2Var = !!benchmark2Adi && veri.some((v) => v.benchmark2 != null);
  const ikinciEksenAktif = benchmarkIkinciEksen && benchmarkVar;

  // Recharts' own auto-domain tends to anchor the axis at a round number
  // near 0, which flattens a fund's real swings compared to the legacy
  // deck's tightly-cropped axis (e.g. ANZ's legacy chart uses 55-215, not
  // 0-220) — computing an explicit padded domain from the actual data
  // keeps the visual drama the legacy charts have instead of an
  // auto-picked "nice" range that wastes most of the chart on empty space.
  //
  // When benchmarkIkinciEksen is on, the benchmark gets its OWN domain off
  // its own min/max instead of being folded into the fund's — that's the
  // whole point of the second axis (see prop comment above).
  const solDegerler = gosterilecek
    .flatMap((v) => [v.fon, ikinciEksenAktif ? null : v.benchmark, v.benchmark2])
    .filter((d): d is number => d != null);
  const solMin = Math.min(...solDegerler);
  const solMax = Math.max(...solDegerler);
  const solPay = (solMax - solMin) * 0.1;
  const yEkseniAraligi: [number, number] = [Math.max(0, Math.floor(solMin - solPay)), Math.ceil(solMax + solPay)];

  const benchmarkDegerler = gosterilecek.map((v) => v.benchmark).filter((d): d is number => d != null);
  const benchmarkMin = benchmarkDegerler.length ? Math.min(...benchmarkDegerler) : 0;
  const benchmarkMax = benchmarkDegerler.length ? Math.max(...benchmarkDegerler) : 0;
  const benchmarkPay = (benchmarkMax - benchmarkMin) * 0.1;
  const sagEksenAraligi: [number, number] = [
    Math.max(0, Math.floor(benchmarkMin - benchmarkPay)),
    Math.ceil(benchmarkMax + benchmarkPay),
  ];

  // Each line is indexed to 100 from its own start (not a shared date) — the
  // fund's own history commonly runs years ahead of its benchmark's, since
  // benchmark indices aren't always calculated as far back. Derive both
  // start dates from the data itself rather than hardcoding per-fund dates.
  const fonBaslangic = veri[0]?.tarih;
  const benchmarkBaslangic = veri.find((v) => v.benchmark !== null)?.tarih;
  const benchmarkGecikmeli = !!(fonBaslangic && benchmarkBaslangic && benchmarkBaslangic > fonBaslangic);
  const benchmark2Baslangic = veri.find((v) => v.benchmark2 != null)?.tarih;
  const benchmark2Gecikmeli = !!(fonBaslangic && benchmark2Baslangic && benchmark2Baslangic > fonBaslangic);

  return (
    <div className="flex h-full flex-col">
      <div className="min-h-0 flex-1">
        <GrafikKapsayici height={yukseklik}>
          {({ width, height }) => (
          <LineChart width={width} height={height} data={gosterilecek} margin={{ top: 8, right: sonDegerEtiketleriGoster ? 84 : 12, left: 0, bottom: 0 }}>
            <CartesianGrid stroke="var(--line)" strokeDasharray="0" vertical={false} />
            <XAxis
              dataKey="tarihEtiket"
              tick={{ fill: "var(--ink-faint)", fontSize: 11 }}
              axisLine={{ stroke: "var(--line-strong)" }}
              tickLine={false}
              minTickGap={40}
            />
            <YAxis
              yAxisId="sol"
              tick={{ fill: "var(--ink-faint)", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              width={44}
              domain={yEkseniAraligi}
            />
            {ikinciEksenAktif && (
              <YAxis
                yAxisId="sag"
                orientation="right"
                tick={{ fill: "var(--accent-warm)", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                width={44}
                domain={sagEksenAraligi}
              />
            )}
            <Tooltip content={<CustomTooltip fonAdi={fonAdi} benchmarkAdi={benchmarkAdi} benchmark2Adi={benchmark2Adi} />} />
            {(benchmarkVar || benchmark2Var) && (
              <Legend
                verticalAlign="top"
                height={28}
                formatter={(value) => (
                  <span className="text-xs text-ink-soft">
                    {value === "fon" ? fonAdi : value === "benchmark" ? benchmarkAdi : benchmark2Adi}
                  </span>
                )}
              />
            )}
            <Line
              yAxisId="sol"
              type="monotone"
              dataKey="fon"
              name="fon"
              stroke="var(--accent)"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
              isAnimationActive={false}
              label={sonDegerEtiketleriGoster ? sonNoktaEtiketi("var(--accent)", sonIndex, sonDegerOndalik) : undefined}
            />
            {benchmarkVar && (
              <Line
                yAxisId={ikinciEksenAktif ? "sag" : "sol"}
                type="monotone"
                dataKey="benchmark"
                name="benchmark"
                stroke="var(--accent-warm)"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
                isAnimationActive={false}
                label={sonDegerEtiketleriGoster ? sonNoktaEtiketi("var(--accent-warm)", sonIndex, sonDegerOndalik) : undefined}
              />
            )}
            {benchmark2Var && (
              <Line
                yAxisId="sol"
                type="monotone"
                dataKey="benchmark2"
                name="benchmark2"
                stroke="var(--accent-alt)"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
                isAnimationActive={false}
                label={sonDegerEtiketleriGoster ? sonNoktaEtiketi("var(--accent-alt)", sonIndex, sonDegerOndalik) : undefined}
              />
            )}
          </LineChart>
          )}
        </GrafikKapsayici>
      </div>
      {endekslenmis && fonBaslangic && (
        <p className="mt-1 font-data text-[10px] leading-snug text-ink-faint">
          {ayYiliEtiketi(fonBaslangic)}=100 endekslenmiş fiyattır.
          {benchmarkGecikmeli && benchmarkBaslangic && (
            <> {benchmarkAdi} {ayYiliEtiketi(benchmarkBaslangic)}&apos;dan itibaren hesaplanmaktadır.</>
          )}
          {benchmark2Gecikmeli && benchmark2Baslangic && (
            <> {benchmark2Adi} {ayYiliEtiketi(benchmark2Baslangic)}&apos;dan itibaren hesaplanmaktadır.</>
          )}
        </p>
      )}
    </div>
  );
}
