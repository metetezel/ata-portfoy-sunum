import type { MakroGostergeSatiri } from "@/lib/veriKaynagi";

// Fixed display order + per-indicator metadata — kept independent of sheet
// row order, same pattern as PiyasaSenaryolariTablosu's ENSTRUMAN_BILGI.
// `grupBaslangici` draws a divider rule above that row (mirrors the legacy
// page's 4 visual blocks: büyüme, kur, enflasyon, dış ticaret/diğer).
// `vurgu` tints the row — the legacy page highlights USD/TL (yıl sonu) and
// TÜFE (yıl sonu) as the two headline figures.
const GOSTERGE_SIRA = [
  "GSYH (milyar TL)",
  "GSYH (milyar $)",
  "GSYH Buyumesi",
  "Euro/ABD $ (yil sonu)",
  "Euro/ABD $ (ortalama)",
  "ABD $/TL (yil sonu)",
  "ABD $/TL (ortalama)",
  "Euro/TL (yil sonu)",
  "Euro/TL (ortalama)",
  "UFE (yil sonu) (%)",
  "TUFE (yil sonu) (%)",
  "Cari Islemler Dengesi (milyar ABD $)",
  "Cari Islemler Dengesi / GSYH (%)",
  "Ihracat (fob, milyar ABD $)",
  "Ithalat (cif, milyar ABD $)",
  "Dis Ticaret Dengesi (milyar ABD $)",
  "Brent Petrol (ABD$/varil)",
];

const GOSTERGE_BILGI: Record<
  string,
  { etiket: string; ondalik: number; grupBaslangici?: boolean; vurgu?: boolean }
> = {
  "GSYH (milyar TL)": { etiket: "GSYH (milyar TL)", ondalik: 0 },
  "GSYH (milyar $)": { etiket: "GSYH (milyar $)", ondalik: 0 },
  "GSYH Buyumesi": { etiket: "GSYH Büyümesi (%)", ondalik: 1 },
  "Euro/ABD $ (yil sonu)": { etiket: "Euro/ABD $ (yıl sonu)", ondalik: 2, grupBaslangici: true },
  "Euro/ABD $ (ortalama)": { etiket: "Euro/ABD $ (ortalama)", ondalik: 2 },
  "ABD $/TL (yil sonu)": { etiket: "ABD $/TL (yıl sonu)", ondalik: 2, vurgu: true },
  "ABD $/TL (ortalama)": { etiket: "ABD $/TL (ortalama)", ondalik: 2 },
  "Euro/TL (yil sonu)": { etiket: "Euro/TL (yıl sonu)", ondalik: 2 },
  "Euro/TL (ortalama)": { etiket: "Euro/TL (ortalama)", ondalik: 2 },
  "UFE (yil sonu) (%)": { etiket: "ÜFE (yıl sonu) (%)", ondalik: 2, grupBaslangici: true },
  "TUFE (yil sonu) (%)": { etiket: "TÜFE (yıl sonu) (%)", ondalik: 2, vurgu: true },
  "Cari Islemler Dengesi (milyar ABD $)": {
    etiket: "Cari İşlemler Dengesi (milyar ABD $)",
    ondalik: 0,
    grupBaslangici: true,
  },
  "Cari Islemler Dengesi / GSYH (%)": { etiket: "Cari İşlemler Dengesi / GSYH (%)", ondalik: 1 },
  "Ihracat (fob, milyar ABD $)": { etiket: "İhracat (fob, milyar ABD $)", ondalik: 0 },
  "Ithalat (cif, milyar ABD $)": { etiket: "İthalat (cif, milyar ABD $)", ondalik: 0 },
  "Dis Ticaret Dengesi (milyar ABD $)": { etiket: "Dış Ticaret Dengesi (milyar ABD $)", ondalik: 0 },
  "Brent Petrol (ABD$/varil)": { etiket: "Brent Petrol (ABD$/varil)", ondalik: 0 },
};

function fmtDeger(v: number, ondalik: number) {
  return v.toLocaleString("tr-TR", { minimumFractionDigits: ondalik, maximumFractionDigits: ondalik });
}

export function MakroGostergelerTablosu({ satirlar }: { satirlar: MakroGostergeSatiri[] }) {
  // Defensive: the source sheet can carry a stray non-data note row (Excel
  // helper convention) — never let a non-numeric Yil leak into the column set.
  const gecerliSatirlar = satirlar.filter((s) => typeof s.Yil === "number" && !Number.isNaN(s.Yil));
  const yillar = [...new Set(gecerliSatirlar.map((s) => s.Yil))].sort((a, b) => a - b);
  const sonYil = yillar[yillar.length - 1];

  return (
    <div className="flex flex-col gap-2">
      <div className="overflow-hidden rounded-lg border border-line">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-line-strong bg-accent text-white">
              <th className="whitespace-nowrap px-3 py-1.5 text-left font-body text-xs font-semibold uppercase tracking-wide">
                &nbsp;
              </th>
              {yillar.map((yil) => (
                <th key={yil} className="px-3 py-1.5 text-right font-data text-xs font-semibold">
                  {yil === sonYil ? `${yil}T` : yil}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {GOSTERGE_SIRA.map((gosterge) => {
              const bilgi = GOSTERGE_BILGI[gosterge];
              const satir = gecerliSatirlar.filter((s) => s.Gosterge === gosterge);
              if (satir.length === 0) return null;
              return (
                <tr
                  key={gosterge}
                  className={`border-b border-line last:border-0 ${bilgi.grupBaslangici ? "border-t-2 border-t-line-strong" : ""}`}
                  style={
                    bilgi.vurgu ? { background: "color-mix(in srgb, var(--accent-warm) 10%, transparent)" } : undefined
                  }
                >
                  <td className="whitespace-nowrap px-3 py-1 font-body font-semibold text-ink">{bilgi.etiket}</td>
                  {yillar.map((yil) => {
                    const deger = satir.find((s) => s.Yil === yil)?.Deger;
                    return (
                      <td key={yil} className="px-3 py-1 text-right font-data text-ink">
                        {deger !== undefined ? fmtDeger(deger, bilgi.ondalik) : "-"}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="font-data text-xs text-ink-faint">Kaynak: TÜİK, Ata Portföy Yönetimi, Ata Yatırım</p>
    </div>
  );
}
