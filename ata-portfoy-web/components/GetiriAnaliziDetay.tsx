import type { FonGetiriAnaliziSatiri } from "@/lib/veriKaynagi";

const TARAF_ETIKET: Record<string, string> = {
  Fon: "Fon",
  Benchmark: "Benchmark",
  Nispi: "Nispi Getiri",
};

function fmt(v: number) {
  const sign = v > 0 ? "+" : "";
  return `${sign}${v.toLocaleString("tr-TR", { maximumFractionDigits: 1 })}%`;
}

function AltTablo({ baslik, satirlar }: { baslik: string; satirlar: FonGetiriAnaliziSatiri[] }) {
  if (satirlar.length === 0) return null;
  const fon = satirlar.find((s) => s.Taraf === "Fon");
  const benchmark = satirlar.find((s) => s.Taraf === "Benchmark");
  const carpan =
    fon && benchmark
      ? (fon.BaslangictanBeri_Kumulatif / benchmark.BaslangictanBeri_Kumulatif).toLocaleString("tr-TR", {
          minimumFractionDigits: 1,
          maximumFractionDigits: 1,
        })
      : null;
  return (
    <div>
      <div className="mb-2 flex items-center gap-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-ink-faint">{baslik}</span>
        {carpan && (
          <span
            className="rounded-full px-2 py-0.5 font-data text-xs font-bold"
            style={{ background: "var(--accent-soft)", color: "var(--accent-warm)" }}
          >
            Endeksin {carpan}x katı (Başlangıçtan Beri)
          </span>
        )}
      </div>
      <div className="overflow-x-auto rounded-lg border border-line">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line-strong text-left">
              <th className="px-3 py-2 font-body text-xs text-ink-faint font-semibold"></th>
              <th className="px-3 py-2 font-body text-xs text-ink-faint font-semibold text-right" colSpan={4}>
                Kümülatif
              </th>
              <th className="px-3 py-2 font-body text-xs text-ink-faint font-semibold text-right border-l border-line" colSpan={3}>
                Yıllıklandırılmış
              </th>
            </tr>
            <tr className="border-b border-line-strong text-left">
              <th className="px-3 py-2 font-body text-xs text-ink-faint font-semibold">Taraf</th>
              <th className="px-3 py-2 font-body text-xs text-ink-faint font-semibold text-right">Yıllık</th>
              <th className="px-3 py-2 font-body text-xs text-ink-faint font-semibold text-right">3 Yıl</th>
              <th className="px-3 py-2 font-body text-xs text-ink-faint font-semibold text-right">5 Yıl</th>
              <th className="px-3 py-2 font-body text-xs text-ink-faint font-semibold text-right">Kuruluştan</th>
              <th className="px-3 py-2 font-body text-xs text-ink-faint font-semibold text-right border-l border-line">3 Yıl</th>
              <th className="px-3 py-2 font-body text-xs text-ink-faint font-semibold text-right">5 Yıl</th>
              <th className="px-3 py-2 font-body text-xs text-ink-faint font-semibold text-right">Kuruluştan</th>
            </tr>
          </thead>
          <tbody>
            {satirlar.map((s) => (
              <tr key={s.Taraf} className="border-b border-line last:border-0 hover:bg-bg-sunken">
                <td className="px-3 py-2 text-ink font-medium">{TARAF_ETIKET[s.Taraf]}</td>
                <td className="px-3 py-2 text-right font-data text-ink">{fmt(s.Yillik)}</td>
                <td className="px-3 py-2 text-right font-data text-ink">{fmt(s["3Yil_Kumulatif"])}</td>
                <td className="px-3 py-2 text-right font-data text-ink">{fmt(s["5Yil_Kumulatif"])}</td>
                <td className="px-3 py-2 text-right font-data text-ink">{fmt(s.BaslangictanBeri_Kumulatif)}</td>
                <td className="px-3 py-2 text-right font-data text-ink-soft border-l border-line">{fmt(s["3Yil_Yillik"])}</td>
                <td className="px-3 py-2 text-right font-data text-ink-soft">{fmt(s["5Yil_Yillik"])}</td>
                <td className="px-3 py-2 text-right font-data text-ink-soft">{fmt(s.BaslangictanBeri_Yillik)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function OneCikanlar({
  satirlar,
  kisaAd,
  benchmarkAdi,
}: {
  satirlar: FonGetiriAnaliziSatiri[];
  kisaAd: string;
  benchmarkAdi: string;
}) {
  const netFon = satirlar.find((s) => s.Tip === "Net" && s.Taraf === "Fon");
  const netBenchmark = satirlar.find((s) => s.Tip === "Net" && s.Taraf === "Benchmark");
  const brutFon = satirlar.find((s) => s.Tip === "Brut" && s.Taraf === "Fon");
  const brutNispi = satirlar.find((s) => s.Tip === "Brut" && s.Taraf === "Nispi");
  const kurulus = satirlar[0]?.Kurulus_Tarihi ? new Date(satirlar[0].Kurulus_Tarihi) : null;

  if (!netFon || !netBenchmark || !brutFon || !brutNispi || !kurulus) return null;

  // Both sentences are entirely derived from the table above — nothing here
  // is hand-typed, so it stays correct as the underlying numbers change weekly.
  const carpan = (netFon.BaslangictanBeri_Kumulatif / netBenchmark.BaslangictanBeri_Kumulatif).toLocaleString(
    "tr-TR",
    { minimumFractionDigits: 1, maximumFractionDigits: 1 }
  );
  const netYillik = netFon.BaslangictanBeri_Yillik.toLocaleString("tr-TR", { maximumFractionDigits: 1 });
  const kurulusYili = kurulus.getFullYear();
  const kurulusUzun = kurulus.toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" });
  const brutKumulatif = Math.round(brutFon.BaslangictanBeri_Kumulatif).toLocaleString("tr-TR");
  const alfaKumulatif = Math.round(brutNispi.BaslangictanBeri_Kumulatif).toLocaleString("tr-TR");

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-line bg-accent-soft px-4 py-3">
      <p className="text-sm leading-normal text-ink">
        Endeksin <b>{carpan}</b> katı getiri sağlayan <b>{kisaAd}&apos;umuz</b>, {kurulusYili}&apos;den beri,
        bireysel yatırımcılara yılda <b>%{netYillik}</b> net getiri sağlayarak değer katmıştır.
      </p>
      <p className="text-sm leading-normal text-ink">
        Fon&apos;umuz, <b>{kurulusUzun}</b>&apos;den bu yana <b>%{brutKumulatif}</b> brüt getiri ile{" "}
        {benchmarkAdi} Endeksi&apos;nin (temettüler dahil) <b>%{alfaKumulatif}</b> üzerinde getiri (alfa) sağladı.
      </p>
    </div>
  );
}

export function GetiriAnaliziDetay({
  satirlar,
  kisaAd,
  benchmarkAdi,
}: {
  satirlar: FonGetiriAnaliziSatiri[];
  kisaAd: string;
  benchmarkAdi: string;
}) {
  const net = satirlar.filter((s) => s.Tip === "Net");
  const brut = satirlar.filter((s) => s.Tip === "Brut");
  const kurulus = satirlar[0]?.Kurulus_Tarihi;

  return (
    <div className="flex flex-col gap-4">
      <AltTablo baslik="Net Getiri Analizi" satirlar={net} />
      <AltTablo baslik="Brüt Getiri Analizi" satirlar={brut} />
      {kurulus && (
        <p className="font-data text-xs text-ink-faint">
          * Kuruluş tarihi: {new Date(kurulus).toLocaleDateString("tr-TR")}
        </p>
      )}
      <OneCikanlar satirlar={satirlar} kisaAd={kisaAd} benchmarkAdi={benchmarkAdi} />
    </div>
  );
}
