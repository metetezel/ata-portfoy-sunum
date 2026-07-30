import { Fragment } from "react";
import type { FonPerformansSatiri } from "@/lib/veriKaynagi";

// Shared with GetiriTablosuCokKriterli — one canonical Pencere label set and
// percent formatter for every return-table variant in the deck.
export const PENCERE_ETIKET: Record<string, string> = {
  Aylik: "Aylık",
  "3 Aylik": "3 Aylık",
  "6 Aylik": "6 Aylık",
  Yillik: "Yıllık",
  "Yilbasindan Beri": "Yılbaşından Beri",
  "3 Yil": "3 Yıl",
  "5 Yil": "5 Yıl",
  "Kurulustan Beri": "Kuruluştan Beri",
};

export function fmtYuzde(v: number) {
  const sign = v > 0 ? "+" : "";
  return `${sign}${v.toLocaleString("tr-TR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`;
}

export function GetiriTablosu({
  satirlar,
  benchmarkAdi,
  kurulusYillikOrtalama,
}: {
  satirlar: FonPerformansSatiri[];
  // Absent for funds with no benchmark at all (e.g. PKP, a money-market
  // fund the legacy deck shows with only a "Fon" column) — the table then
  // renders as a single Dönem/Fon pair, no Benchmark/Fark columns.
  benchmarkAdi?: string;
  // Only funds with a Fon_Getiri_Analizi_Detay breakdown (currently just AAV)
  // have this — the legacy deck shows it as a second "Yıllık Ortalama" line
  // directly under "Kuruluştan Beri", inconsistently (only on some funds'
  // pages), so it's opt-in here rather than assumed for every fund.
  kurulusYillikOrtalama?: { fon: number; benchmark: number };
}) {
  const benchmarkVar = !!benchmarkAdi && satirlar.some((s) => s.Benchmark_Getiri_Yuzde != null);

  return (
    <div className="flex-1 overflow-x-auto rounded-lg border border-line">
      <table className="h-full w-full text-sm">
        <thead>
          <tr className="border-b border-line-strong text-left">
            <th className="px-4 py-1 font-body text-xs uppercase tracking-wide text-ink-faint font-semibold">
              Dönem
            </th>
            <th className="px-4 py-1 font-body text-xs uppercase tracking-wide text-ink-faint font-semibold text-right">
              Fon
            </th>
            {benchmarkVar && (
              <>
                <th className="px-4 py-1 font-body text-xs uppercase tracking-wide text-ink-faint font-semibold text-right">
                  {benchmarkAdi}
                </th>
                <th className="px-4 py-1 font-body text-xs uppercase tracking-wide text-ink-faint font-semibold text-right">
                  Fark
                </th>
              </>
            )}
          </tr>
        </thead>
        <tbody>
          {satirlar.map((s) => {
            const fark = benchmarkVar ? s.Fon_Getiri_Yuzde - s.Benchmark_Getiri_Yuzde! : 0;
            const ortalama =
              benchmarkVar && s.Pencere === "Kurulustan Beri" ? kurulusYillikOrtalama : undefined;
            return (
              <Fragment key={s.Pencere}>
                <tr className={`border-b border-line hover:bg-bg-sunken ${ortalama ? "" : "last:border-0"}`}>
                  <td className="px-4 py-1 text-ink">{PENCERE_ETIKET[s.Pencere] ?? s.Pencere}</td>
                  <td className="px-4 py-1 text-right font-data text-ink">
                    {fmtYuzde(s.Fon_Getiri_Yuzde)}
                  </td>
                  {benchmarkVar && (
                    <>
                      <td className="px-4 py-1 text-right font-data text-ink-soft">
                        {fmtYuzde(s.Benchmark_Getiri_Yuzde!)}
                      </td>
                      <td
                        className="px-4 py-1 text-right font-data font-semibold"
                        style={{ color: fark >= 0 ? "var(--good)" : "var(--critical)" }}
                      >
                        {fmtYuzde(fark)}
                      </td>
                    </>
                  )}
                </tr>
                {ortalama && (
                  <tr className="border-b border-line last:border-0 hover:bg-bg-sunken">
                    <td className="px-4 py-1 pl-8 text-xs italic text-ink-faint">Yıllık Ortalama</td>
                    <td className="px-4 py-1 text-right font-data text-xs italic text-ink-faint">
                      {fmtYuzde(ortalama.fon)}
                    </td>
                    <td className="px-4 py-1 text-right font-data text-xs italic text-ink-faint">
                      {fmtYuzde(ortalama.benchmark)}
                    </td>
                    <td
                      className="px-4 py-1 text-right font-data text-xs font-semibold italic"
                      style={{ color: ortalama.fon - ortalama.benchmark >= 0 ? "var(--good)" : "var(--critical)" }}
                    >
                      {fmtYuzde(ortalama.fon - ortalama.benchmark)}
                    </td>
                  </tr>
                )}
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
