import {
  getFonKatalog,
  getFonMetni,
  getFonPerformans,
  getFonPerformansEkKriter,
  getFonPortfoyDagilimi,
  getFonGetiriAnalizi,
  getFonYillikKarsilastirma,
  getFonTemettuVerimi,
  getRaporTarihi,
  siraliPencereler,
} from "@/lib/veriKaynagi";
import { getFiyatSerisi } from "@/lib/fiyatSerisi";
import { getEndeksSerisi } from "@/lib/endeksSerisi";
import { donemAraligi as hesaplaDonemAraligi } from "@/lib/tarih";
import { Sayfa } from "@/components/Sayfa";
import { GetiriTablosu } from "@/components/GetiriTablosu";
import { GetiriTablosuCokKriterli } from "@/components/GetiriTablosuCokKriterli";
import { FonFiyatGrafigi } from "@/components/FonFiyatGrafigi";
import { PortfoyPastasi } from "@/components/PortfoyPastasi";
import { GetiriAnaliziDetay } from "@/components/GetiriAnaliziDetay";
import { YillikGetiriBarGrafik } from "@/components/YillikGetiriBarGrafik";
import { TemettuVerimiTablosu } from "@/components/TemettuVerimiTablosu";
import { EndeksBantGrafigi } from "@/components/EndeksBantGrafigi";

// Shared template for every per-fund set of deck pages — used both by the
// standalone /fon/[kod] preview route and inlined directly into the real
// /sunum deck sequence, so the ~14 funds' pages don't get duplicated JSX.
// Callers own the "fund code doesn't exist" decision (notFound() for the
// standalone route, silent skip mid-deck) — this component just renders
// nothing if the catalog lookup comes up empty.
export async function FonSayfalari({
  fonKodu,
  sayfaNoBaslangic = 1,
}: {
  fonKodu: string;
  sayfaNoBaslangic?: number;
}) {
  const kod = fonKodu.toUpperCase();
  const [katalog] = getFonKatalog(kod);
  if (!katalog) return null;

  const aciklama = getFonMetni(kod);
  const performans = siraliPencereler(getFonPerformans(kod));
  const ekKriterler = getFonPerformansEkKriter(kod);
  const dagilim = getFonPortfoyDagilimi(kod);
  const fiyatSerisi = getFiyatSerisi(kod);
  const getiriAnalizi = getFonGetiriAnalizi(kod);
  const yillikKarsilastirma = getFonYillikKarsilastirma(kod);
  const temettuVerimi = getFonTemettuVerimi(kod);
  const raporTarihi = getRaporTarihi();
  // Absent for funds with no benchmark at all (e.g. PKP, a money-market fund
  // the legacy deck shows with only a "Fon" column) — left undefined rather
  // than a placeholder string so downstream components can tell the two
  // cases apart and render single-column/single-line instead of a
  // "vs Benchmark" comparison that doesn't exist.
  const benchmarkKisaAd = katalog.Benchmark_Kisa_Ad || katalog.Benchmark_Aciklama || undefined;
  // Only set for a fund compared against a second benchmark at once
  // (currently just AED) — see GetiriTablosuCokKriterli/FonFiyatGrafigi.
  const benchmark2KisaAd = katalog.Benchmark2_Kisa_Ad || undefined;

  // Legacy deck shows a second "Yıllık Ortalama" line under "Kuruluştan Beri"
  // on some funds' main pages (currently just AAV) — same NET figures as the
  // detailed-analysis page's "Başlangıçtan" annualized column, surfaced here
  // too rather than making the reader flip to the next page for it.
  const netFonGA = getiriAnalizi.find((s) => s.Tip === "Net" && s.Taraf === "Fon");
  const netBenchmarkGA = getiriAnalizi.find((s) => s.Tip === "Net" && s.Taraf === "Benchmark");
  const kurulusYillikOrtalama =
    netFonGA && netBenchmarkGA
      ? { fon: netFonGA.BaslangictanBeri_Yillik, benchmark: netBenchmarkGA.BaslangictanBeri_Yillik }
      : undefined;

  // Legacy'nin ANZ (Eurobond fon) sayfasına özel "Türkiye Kredi Temerrüt
  // Takası (CDS)" mini-grafiği — Türkiye çapında bir gösterge, fon bazlı bir
  // veri değil, bu yüzden Fon_Katalog'da bir alan değil, doğrudan fon koduna
  // bakan bir özel durum (DGH'nin farkGoster'ı gibi, bu dosyada zaten
  // kurulmuş bir desen). 2026-07-30'a kadar hiçbir Rasyonet/Bloomberg
  // kaynağında güncel veri yoktu (bkz. build_endeks_serisi.py'deki
  // turkiye_cds_serisi() notu) — artık worldgovernmentbonds.com'dan ücretsiz
  // ve güncel geliyor.
  const cdsSerisi = kod === "ANZ" ? getEndeksSerisi("turkiye_cds") : null;

  let sayfaNo = sayfaNoBaslangic;

  return (
    <>
      <Sayfa numara={sayfaNo++}>
        <div className="flex h-full flex-col">
          <div className="mb-4 flex max-w-[205mm] flex-wrap items-baseline gap-3">
            <h1 className="font-display text-2xl font-semibold text-ink">{katalog.Fon_Adi}</h1>
            <span
              className="rounded-full px-2.5 py-0.5 font-data text-xs font-semibold"
              style={{ background: "var(--accent-soft)", color: "var(--accent)" }}
            >
              {katalog.Fon_Kodu}
            </span>
            <span className="font-body text-xs text-ink-soft">
              {katalog.Fon_Turu} · Risk {katalog.Risk_Degeri_1_7}/7 · Yönetim Ücreti {katalog.Yonetim_Ucreti} · Stopaj {katalog.Stopaj}
            </span>
          </div>

          <div className="grid grid-cols-[1fr_270px] gap-6">
            <div className="flex flex-col gap-2">
              {ekKriterler.length > 0 ? (
                <GetiriTablosuCokKriterli
                  satirlar={performans}
                  ekKriterler={ekKriterler}
                  benchmarkAdi={benchmarkKisaAd ?? "Benchmark"}
                  // DGH is the only multi-criteria fund whose legacy table
                  // adds a Fark column (Fon minus its primary benchmark,
                  // KYD Mevduat) alongside the extra comparison column —
                  // AED/YLC/RTG show none. A one-off fund-code check rather
                  // than a new Fon_Katalog field, since it's currently only
                  // ever true for this one fund.
                  farkGoster={kod === "DGH"}
                />
              ) : (
                <GetiriTablosu
                  satirlar={performans}
                  benchmarkAdi={benchmarkKisaAd}
                  kurulusYillikOrtalama={kurulusYillikOrtalama}
                />
              )}
              <TemettuVerimiTablosu
                satirlar={temettuVerimi}
                baslik={`${katalog.Kisa_Ad}'nın Dönemlere Göre Temettü Verimi`}
              />
            </div>

            <div className="flex flex-col gap-4 pb-3">
              {aciklama && (
                <div>
                  <div className="mb-1 text-sm font-semibold text-ink">Fon Hakkında</div>
                  {/* Real descriptions vary a lot in length (some funds' legacy
                      text is 2-3x others') — a long one at the normal text-xs
                      size grows the right column tall enough to squeeze the
                      chart section below near zero height (found on JET/URA,
                      2026-07-29, both with much longer descriptions than the
                      funds built earlier). Scale down past a length threshold
                      rather than fixing this per-fund. */}
                  <p className={`leading-snug text-ink-soft ${aciklama.length > 600 ? "text-[10px]" : "text-xs"}`}>
                    {aciklama}
                  </p>
                </div>
              )}
              {dagilim.length > 0 && (
                <div>
                  <div className="mb-1 text-sm font-semibold text-ink">Portföy Dağılımı</div>
                  <PortfoyPastasi veri={dagilim} yukseklik={115} tema="light" />
                </div>
              )}
            </div>
          </div>

          {fiyatSerisi.length > 0 && (
            <div className="mt-4 flex flex-1 min-h-0 gap-5">
              <div className="flex flex-1 min-h-0 flex-col">
                <div className="mb-1 text-sm font-semibold text-ink">
                  {benchmarkKisaAd && benchmark2KisaAd
                    ? `Fon vs ${benchmarkKisaAd} / ${benchmark2KisaAd}`
                    : benchmarkKisaAd
                      ? `Fon vs ${benchmarkKisaAd}`
                      : katalog.Fon_Adi}
                </div>
                <div className="flex-1 min-h-0">
                  <FonFiyatGrafigi
                    veri={fiyatSerisi}
                    fonAdi={katalog.Fon_Kodu}
                    benchmarkAdi={benchmarkKisaAd}
                    benchmark2Adi={benchmark2KisaAd}
                    benchmarkIkinciEksen={kod === "ANZ"}
                  />
                </div>
              </div>
              {cdsSerisi && cdsSerisi.seri.length > 0 && cdsSerisi.istatistik && (
                <div className="flex w-[220px] flex-none min-h-0 flex-col">
                  <div className="mb-1 text-sm font-semibold text-ink">Türkiye Kredi Temerrüt Takası (CDS)</div>
                  <div className="flex-1 min-h-0">
                    <EndeksBantGrafigi
                      veri={cdsSerisi.seri}
                      bantlar={[
                        { etiket: "Min", deger: cdsSerisi.istatistik.min, renk: "var(--good)", kesikli: true },
                        { etiket: "Max", deger: cdsSerisi.istatistik.max, renk: "var(--critical)", kesikli: true },
                      ]}
                      cizgiRenk="var(--accent)"
                      ondalik={0}
                      tikModu="aylik"
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </Sayfa>

      {getiriAnalizi.length > 0 && (
        <Sayfa numara={sayfaNo++}>
          <div className="flex h-full flex-col">
            <h1 className="mb-1 font-display text-xl font-semibold text-ink">{katalog.Fon_Adi} — Detaylı Getiri Analizi</h1>
            <p className="mb-6 text-xs text-ink-faint">{katalog.Fon_Kodu}</p>
            <div className="flex-1">
              <GetiriAnaliziDetay
                satirlar={getiriAnalizi}
                kisaAd={katalog.Kisa_Ad}
                // Benchmark_Kisa_Ad is optional in general (some funds have no
                // benchmark, e.g. PKP/AAS), but this detail page's own data
                // (Fon_Getiri_Analizi_Detay) is only ever populated for funds
                // that do have one — the "" fallback only exists to satisfy
                // the type, it's unreachable with current data.
                benchmarkAdi={benchmarkKisaAd ?? ""}
              />
            </div>
          </div>
        </Sayfa>
      )}

      {yillikKarsilastirma.length > 0 && (
        <Sayfa numara={sayfaNo++}>
          <div className="flex h-full flex-col">
            <h1 className="mb-1 font-display text-xl font-semibold text-ink">
              {katalog.Fon_Adi} — Yıllıklandırılmış Getiri (TL / USD)
            </h1>
            <p className="mb-6 text-xs text-ink-faint">{katalog.Fon_Kodu}</p>
            <div className="grid flex-1 grid-cols-2 gap-8 items-center">
              {[
                { donem: "Son 5 Yıl", yil: 5 },
                { donem: "Son 3 Yıl", yil: 3 },
              ].map(({ donem, yil }) => (
                <YillikGetiriBarGrafik
                  key={donem}
                  donem={donem}
                  satirlar={yillikKarsilastirma}
                  fonAdi={katalog.Fon_Kodu}
                  // Same unreachable-in-practice fallback as the detail page
                  // above — Fon_Yillik_Getiri_Karsilastirma is only ever
                  // populated for benchmarked funds.
                  benchmarkAdi={benchmarkKisaAd ?? ""}
                  yukseklik={250}
                  donemAraligi={hesaplaDonemAraligi(raporTarihi, yil)}
                />
              ))}
            </div>
          </div>
        </Sayfa>
      )}
    </>
  );
}
