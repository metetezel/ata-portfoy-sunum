import { Fragment } from "react";
import type { PiyasaSenaryoSatiri } from "@/lib/veriKaynagi";

// Fixed display order + per-instrument metadata (legacy row title, decimal
// places, whether it's Bloomberg-consensus-sourced) — kept independent of
// whatever order the rows happen to sit in in the sheet.
const ENSTRUMAN_SIRA = ["BIST100 Endeksi", "USD/TL", "EURO/TL", "S&P 500 Endeksi", "Euro Stoxx 50 Endeksi"];

const ENSTRUMAN_BILGI: Record<string, { kategori: string; metin: string; ondalik: number; bloomberg?: boolean }> = {
  "BIST100 Endeksi": { kategori: "Borsa İstanbul", metin: "BIST100 Endeksi", ondalik: 0 },
  "USD/TL": { kategori: "Dolar Kuru", metin: "2026 Sene Sonu USD/TL Tahmini", ondalik: 2 },
  "EURO/TL": { kategori: "Euro Kuru", metin: "2026 Sene Sonu EURO/TL Tahmini", ondalik: 2 },
  "S&P 500 Endeksi": { kategori: "S&P 500", metin: "S&P 500 Endeksi Sene Sonu Tahmini", ondalik: 0, bloomberg: true },
  "Euro Stoxx 50 Endeksi": {
    kategori: "Euro Stoxx 50",
    metin: "Euro Stoxx 50 Endeksi Sene Sonu Tahmini",
    ondalik: 0,
    bloomberg: true,
  },
};

function fmtDeger(v: number, ondalik: number) {
  return v.toLocaleString("tr-TR", { minimumFractionDigits: ondalik, maximumFractionDigits: ondalik });
}

function fmtDegisim(mevcut: number, senaryo: number) {
  const yuzde = (senaryo / mevcut - 1) * 100;
  const isaret = yuzde < 0 ? "-" : "";
  const metin = `${isaret}%${Math.abs(yuzde).toLocaleString("tr-TR", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })}`;
  return { metin, pozitif: yuzde >= 0 };
}

export function PiyasaSenaryolariTablosu({
  satirlar,
  tarih,
}: {
  satirlar: PiyasaSenaryoSatiri[];
  tarih: string;
}) {
  const siraliSatirlar = ENSTRUMAN_SIRA.map((e) => satirlar.find((s) => s.Enstruman === e)).filter(
    (s): s is PiyasaSenaryoSatiri => Boolean(s)
  );

  return (
    <div className="flex flex-col gap-3">
      <div className="overflow-hidden rounded-lg border border-line">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line text-left">
              <th className="px-4 py-2" colSpan={2}></th>
              <th className="px-4 py-2 text-right font-body text-xs font-semibold text-ink-faint">{tarih}</th>
              <th
                className="border-l border-line px-4 py-2 text-center font-body text-xs font-semibold uppercase tracking-wide text-accent"
                colSpan={3}
              >
                2026 Senaryoları
              </th>
            </tr>
            <tr className="border-b border-line-strong text-left">
              <th className="px-4 py-2" colSpan={2}></th>
              <th className="px-4 py-2 text-right font-body text-xs font-semibold uppercase tracking-wide text-accent-warm">
                Mevcut Durum
              </th>
              <th className="border-l border-line px-4 py-2 text-right font-body text-xs font-semibold uppercase tracking-wide text-ink-faint">
                Kötümser
              </th>
              <th className="px-4 py-2 text-right font-body text-xs font-semibold uppercase tracking-wide text-ink-faint">
                Baz*
              </th>
              <th className="px-4 py-2 text-right font-body text-xs font-semibold uppercase tracking-wide text-ink-faint">
                İyimser
              </th>
            </tr>
          </thead>
          <tbody>
            {siraliSatirlar.map((s) => {
              const bilgi = ENSTRUMAN_BILGI[s.Enstruman];
              const kotumser = fmtDegisim(s.Mevcut_Durum, s.Kotumser);
              const baz = fmtDegisim(s.Mevcut_Durum, s.Baz);
              const iyimser = fmtDegisim(s.Mevcut_Durum, s.Iyimser);
              return (
                <Fragment key={s.Enstruman}>
                  <tr className="border-b border-line">
                    <td className="px-4 py-2 align-top font-display font-bold text-ink" rowSpan={2}>
                      {bilgi.kategori}
                      {bilgi.bloomberg && <sup className="ml-0.5 text-[9px] font-normal text-ink-faint">**</sup>}
                    </td>
                    <td className="px-4 py-2 font-body text-xs italic text-accent-warm">{bilgi.metin}</td>
                    <td className="px-4 py-2 text-right font-data font-bold text-ink">
                      {fmtDeger(s.Mevcut_Durum, bilgi.ondalik)}
                    </td>
                    <td className="border-l border-line px-4 py-2 text-right font-data font-bold text-ink">
                      {fmtDeger(s.Kotumser, bilgi.ondalik)}
                    </td>
                    <td className="px-4 py-2 text-right font-data font-bold text-ink">
                      {fmtDeger(s.Baz, bilgi.ondalik)}
                    </td>
                    <td className="px-4 py-2 text-right font-data font-bold text-ink">
                      {fmtDeger(s.Iyimser, bilgi.ondalik)}
                    </td>
                  </tr>
                  <tr className="border-b border-line bg-bg-sunken last:border-0">
                    <td className="px-4 py-1 font-body text-xs italic text-ink-faint">Değişim Potansiyeli</td>
                    <td className="px-4 py-1"></td>
                    <td
                      className="border-l border-line px-4 py-1 text-right font-data text-xs"
                      style={{ color: kotumser.pozitif ? "var(--good)" : "var(--critical)" }}
                    >
                      {kotumser.metin}
                    </td>
                    <td
                      className="px-4 py-1 text-right font-data text-xs"
                      style={{ color: baz.pozitif ? "var(--good)" : "var(--critical)" }}
                    >
                      {baz.metin}
                    </td>
                    <td
                      className="px-4 py-1 text-right font-data text-xs"
                      style={{ color: iyimser.pozitif ? "var(--good)" : "var(--critical)" }}
                    >
                      {iyimser.metin}
                    </td>
                  </tr>
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="font-data text-xs text-ink-faint">
        *Ata Portföy Yönetimi, Ata Yatırım &nbsp;·&nbsp; **Bloomberg 2026 Yıl Sonu Konsensus Tahminleri
      </p>
    </div>
  );
}
