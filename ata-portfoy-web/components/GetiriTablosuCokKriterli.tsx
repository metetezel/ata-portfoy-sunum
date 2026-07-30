import type { FonPerformansSatiri, FonPerformansEkKriterSatiri } from "@/lib/veriKaynagi";
import { PENCERE_ETIKET, fmtYuzde } from "./GetiriTablosu";

// Variant of GetiriTablosu for the rare fund compared against more than one
// benchmark at once (currently AED: BIST-100 Getiri / USD / TL Mevduat, and
// YLC/RTG: Benchmark + its own 2 weighted ingredients). Most funds using
// this show no "Fark" column at all (there's no single benchmark to net
// against) — DGH is the exception, its legacy table adds one more column
// after the extras, computed as Fon minus its PRIMARY benchmark
// specifically (not against any of the ek-kriter columns). Extra columns
// come from Fon_Performans_Ek_Kriter rather than the normal
// Benchmark_Getiri_Yuzde column, which only has room for one comparison.
export function GetiriTablosuCokKriterli({
  satirlar,
  ekKriterler,
  benchmarkAdi,
  farkGoster,
}: {
  satirlar: FonPerformansSatiri[];
  ekKriterler: FonPerformansEkKriterSatiri[];
  benchmarkAdi: string;
  farkGoster?: boolean;
}) {
  const ekAdlar: string[] = [];
  for (const r of ekKriterler) {
    if (!ekAdlar.includes(r.Kriter_Adi)) ekAdlar.push(r.Kriter_Adi);
  }
  const ekDegerBul = (pencere: string, kriterAdi: string) =>
    ekKriterler.find((r) => r.Pencere === pencere && r.Kriter_Adi === kriterAdi)?.Getiri_Yuzde;

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
            <th className="px-4 py-1 font-body text-xs uppercase tracking-wide text-ink-faint font-semibold text-right">
              {benchmarkAdi}
            </th>
            {ekAdlar.map((ad) => (
              <th key={ad} className="px-4 py-1 font-body text-xs uppercase tracking-wide text-ink-faint font-semibold text-right">
                {ad}
              </th>
            ))}
            {farkGoster && (
              <th className="px-4 py-1 font-body text-xs uppercase tracking-wide text-ink-faint font-semibold text-right">
                Fark
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {satirlar.map((s) => {
            const fark = farkGoster && s.Benchmark_Getiri_Yuzde != null
              ? s.Fon_Getiri_Yuzde - s.Benchmark_Getiri_Yuzde
              : null;
            return (
              <tr key={s.Pencere} className="border-b border-line last:border-0 hover:bg-bg-sunken">
                <td className="px-4 py-1 text-ink">{PENCERE_ETIKET[s.Pencere] ?? s.Pencere}</td>
                <td className="px-4 py-1 text-right font-data text-ink">{fmtYuzde(s.Fon_Getiri_Yuzde)}</td>
                <td className="px-4 py-1 text-right font-data text-ink-soft">
                  {s.Benchmark_Getiri_Yuzde != null ? fmtYuzde(s.Benchmark_Getiri_Yuzde) : "-"}
                </td>
                {ekAdlar.map((ad) => {
                  const v = ekDegerBul(s.Pencere, ad);
                  return (
                    <td key={ad} className="px-4 py-1 text-right font-data text-ink-soft">
                      {v != null ? fmtYuzde(v) : "-"}
                    </td>
                  );
                })}
                {farkGoster && (
                  <td
                    className="px-4 py-1 text-right font-data font-semibold"
                    style={fark != null ? { color: fark >= 0 ? "var(--good)" : "var(--critical)" } : undefined}
                  >
                    {fark != null ? fmtYuzde(fark) : "-"}
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
