import {
  getSabitMetin,
  getRaporTarihi,
  getKapakOzet,
  getEkipOrganizasyon,
  getFonlarPerformansOzet,
  getFonlarPerformansOzetYBB,
  getYatirim100TLDagilim,
  getYatirim100TLMaddeler,
  getPiyasaSenaryolari,
  getMakroGostergeler,
  getDegerlemeMetrikleri,
  getPeerPeKarsilastirma,
  getBistYillikGetiriler,
  getFonAvantajlariMaddeler,
  getVergiBireyselFonListesi,
  getVergiAnzTablosu,
  getEkip,
  getFonKatalog,
} from "@/lib/veriKaynagi";
import { getEndeksSerisi } from "@/lib/endeksSerisi";
import { getMxwoMxefSerisi } from "@/lib/fiyatSerisi";
import { FonFiyatGrafigi } from "@/components/FonFiyatGrafigi";
import { ddmmyyyy, donemAraligi, yilbasindanBeriAraligi } from "@/lib/tarih";
import { Sayfa } from "@/components/Sayfa";
import { SirketlerSemasi } from "@/components/SirketlerSemasi";
import { EkipKarti } from "@/components/EkipOrganizasyonu";
import { FonlarPerformansBarGrafik } from "@/components/FonlarPerformansBarGrafik";
import { Yatirim100TLPastasi } from "@/components/Yatirim100TLPastasi";
import { PiyasaSenaryolariTablosu } from "@/components/PiyasaSenaryolariTablosu";
import { MakroGostergelerTablosu } from "@/components/MakroGostergelerTablosu";
import { BasitBarGrafik } from "@/components/BasitBarGrafik";
import { EndeksBantGrafigi } from "@/components/EndeksBantGrafigi";
import { FonSayfalari } from "@/components/FonSayfalari";

// The full weekly deck, page by page — starting with the cover. Every other
// section (company info, fund summary, macro, each fund's pages, appendix,
// contact) gets added here in the same running sequence as they're built.
// The legacy deck's cover carries no page number and no other content —
// just the slogan and date — so this page stays deliberately spare; the AUM
// / fund-count summary belongs to the separate "Fon Özeti" page (next).
export default async function SunumSayfasi() {
  const slogan = getSabitMetin("Kapak_Slogan");
  const tarih = getRaporTarihi();

  // Two-tone title echoing the logo's own split coloring (teal word(s), then
  // orange) — break on the last space so the final word carries the orange.
  const sonBosluk = slogan.lastIndexOf(" ");
  const sloganIlk = sonBosluk === -1 ? slogan : slogan.slice(0, sonBosluk);
  const sloganSon = sonBosluk === -1 ? "" : slogan.slice(sonBosluk + 1);

  const ataGrubuMetni = getSabitMetin("Ata_Grubu_Tanitim").split("\n\n");

  const kapakOzet = getKapakOzet();
  const toplamFonSayisi = (kapakOzet?.Yatirim_Fon_Sayisi ?? 0) + (kapakOzet?.Serbest_Fon_Sayisi ?? 0);
  const ekip = getEkipOrganizasyon();
  const fonYonetimi = ekip.filter((s) => s.Kart === "Fon Yönetimi");
  const fonOperasyon = ekip.filter((s) => s.Kart === "Fon Operasyon");
  const fonlarPerformans = getFonlarPerformansOzet();
  const fonlarPerformansYBB = getFonlarPerformansOzetYBB();
  const yatirim100TLDagilim = getYatirim100TLDagilim();
  const yatirim100TLMaddeler = getYatirim100TLMaddeler();
  const yatirim100TLGiris = getSabitMetin("Yatirim_100TL_Strateji_Giris");
  const yatirim100TLBaslik = getSabitMetin("Yatirim_100TL_Strateji_Baslik");
  const yatirim100TLAltbaslik = getSabitMetin("Yatirim_100TL_Strateji_Altbaslik");
  const piyasaSenaryolari = getPiyasaSenaryolari();
  const makroGostergeler = getMakroGostergeler();
  const degerlemeMetrikleri = getDegerlemeMetrikleri();
  const metrikDegeri = (ad: string) => degerlemeMetrikleri.find((m) => m.Metrik === ad)?.Deger ?? 0;
  const turkiyeFK = metrikDegeri("Turkiye F/K");
  const gopFK = metrikDegeri("GOP F/K");
  const dunyaFK = metrikDegeri("Dunya F/K");
  const iskontoDunya = Math.round((1 - turkiyeFK / dunyaFK) * 100);
  const iskontoGOP = Math.round((1 - turkiyeFK / gopFK) * 100);
  const uzunTarih = (t: string | undefined) =>
    t ? new Date(t).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" }) : "";
  // Üçü de otomatik (guncelle_degerleme_fk.py). Türkiye F/K DEĞİŞTİ
  // (2026-08-17, Mete'nin kararı — bkz. Pazartesi_Rutini.md madde 20):
  // eskiden CEIC'in "BIST-100 F/K"sıydı, artık MSCI'nin kendi Türkiye
  // ülke endeksi — GOP/Dünya F/K'nın geldiği AYNI World factsheet
  // metodolojisi, elma-elma kıyas (eskiden iki farklı sağlayıcı arasındaki
  // ~%7-8'lik bilinen sapma, %2 gibi küçük bir iskonto farkını anlamsız
  // kılıyordu). Bunun bedeli: artık BIST-100'ün 100 hissesi değil, MSCI'nin
  // daha dar ~11 büyük şirketlik Türkiye sepeti gösteriliyor — bu yüzden
  // grafikteki etiket de "BIST -100" değil "Türkiye". İki ayrı PDF/tarih
  // olabileceği için kaynak notu ayrı tutuluyor (şu an ikisi de aynı gün).
  const turkiyeTarihUzun = uzunTarih(degerlemeMetrikleri.find((m) => m.Metrik === "Turkiye F/K")?.Tarih);
  const msciTarihUzun = uzunTarih(degerlemeMetrikleri.find((m) => m.Metrik === "Dunya F/K")?.Tarih);
  const peerFK = getPeerPeKarsilastirma();
  const peerTarihUzun = uzunTarih(peerFK.find((p) => p.Tarih)?.Tarih);
  const bist100UsdEndeksi = getEndeksSerisi("bist100_usd_endeksi");
  const bistGsyihOrani = getEndeksSerisi("bist_gsyih_orani");
  const bistYillikGetiriler = getBistYillikGetiriler();
  const mxwoMxef = getMxwoMxefSerisi();
  const fonAvantajGenel = getFonAvantajlariMaddeler("Genel");
  const fonAvantajMusteri = getFonAvantajlariMaddeler("Musteriye_Ozel");
  const vergiBireyselListe = getVergiBireyselFonListesi();
  const vergiAnzTablosu = getVergiAnzTablosu();
  const fonKatalogTumu = getFonKatalog();
  const iletisimEkip = getEkip();

  return (
    <div className="sayfa-tuvali">
      <Sayfa arkaPlanGorseli="/kapak-gorseli.jpg">
        <div className="flex h-full flex-col justify-center">
          <p className="mb-4 font-data text-sm uppercase tracking-[0.15em] text-ink-faint">
            {ddmmyyyy(tarih)}
          </p>
          <h1 className="max-w-[115mm] font-display text-6xl font-bold leading-[1.08] text-wrap-balance">
            <span className="text-accent">{sloganIlk}</span>{sloganSon && " "}
            <span className="text-accent-warm">{sloganSon}</span>
          </h1>
        </div>
      </Sayfa>

      <Sayfa numara={1}>
        <div className="grid h-full grid-cols-[80mm_1fr] gap-8">
          <div className="flex flex-col justify-center">
            <h1 className="mb-6 font-display text-3xl font-bold text-ink text-wrap-balance">
              Ata Grubu ve Şirketleri
            </h1>
            {ataGrubuMetni.map((paragraf, i) => (
              <p key={i} className="mb-4 text-sm leading-relaxed text-ink-soft">
                {paragraf}
              </p>
            ))}
          </div>
          <SirketlerSemasi />
        </div>
      </Sayfa>

      <Sayfa numara={2}>
        <div className="flex h-full flex-col justify-center">
          <h1 className="mb-8 font-display text-2xl font-bold leading-snug text-ink">
            Ata Portföy Yönetimi <span className="text-accent">{kapakOzet?.AUM_Milyar_TL}</span> milyar TL büyüklüğünde,{" "}
            {kapakOzet?.Yatirim_Fon_Sayisi} yatırım fonu ve {kapakOzet?.Serbest_Fon_Sayisi} serbest fon olmak
            üzere toplam <span className="text-accent-warm">{toplamFonSayisi}</span> adet fon yönetmektedir.
          </h1>
          <div className="flex items-stretch justify-center gap-10">
            <div className="flex w-[95mm]">
              <EkipKarti baslik="Fon Yönetimi" satirlar={fonYonetimi} />
            </div>
            <div className="flex w-[95mm]">
              <EkipKarti baslik="Fon Operasyon" satirlar={fonOperasyon} />
            </div>
          </div>
        </div>
      </Sayfa>

      <Sayfa numara={3}>
        <div className="flex h-full flex-col">
          <h1 className="font-display text-2xl font-bold text-ink">Ata Fonları: Güçlü Performans</h1>
          <p className="mb-4 font-data text-sm font-semibold text-ink-faint">
            ( {donemAraligi(tarih, 1)} )
          </p>
          <div className="flex-1 min-h-0">
            <FonlarPerformansBarGrafik satirlar={fonlarPerformans} />
          </div>
        </div>
      </Sayfa>

      <Sayfa numara={4}>
        <div className="flex h-full flex-col">
          <h1 className="font-display text-2xl font-bold text-ink">Ata Fonları: Güçlü Performans</h1>
          <p className="mb-4 font-data text-sm font-semibold text-ink-faint">
            ( {yilbasindanBeriAraligi(tarih)} )
          </p>
          <div className="flex-1 min-h-0">
            <FonlarPerformansBarGrafik satirlar={fonlarPerformansYBB} />
          </div>
        </div>
      </Sayfa>

      <Sayfa numara={5}>
        <div className="flex h-full flex-col">
          <h1 className="font-display text-3xl font-bold text-ink text-wrap-balance">{yatirim100TLBaslik}</h1>
          <p className="mb-2 text-base font-semibold text-accent">{yatirim100TLAltbaslik}</p>
          <div className="flex flex-1 flex-col items-center justify-center gap-6 pb-[12mm]">
            <div className="w-[210mm]">
              <Yatirim100TLPastasi veri={yatirim100TLDagilim} yukseklik={400} />
            </div>
            <div className="flex max-w-[230mm] flex-col gap-3">
              <div className="flex items-start gap-3">
                <span className="mt-0.5 text-lg font-bold text-accent-warm">✓</span>
                <p className="text-base text-ink">{yatirim100TLGiris}</p>
              </div>
              {yatirim100TLMaddeler.map((m, i) => (
                <div key={m.Sira} className="ml-6 flex items-start gap-3">
                  <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-accent-warm" />
                  <p className="text-base text-ink-soft">
                    {m.Aciklama} <span className="font-bold text-accent-warm">{m.Tutar_TL} TL</span>
                    {i < yatirim100TLMaddeler.length - 1 ? "," : "."}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Sayfa>

      <Sayfa numara={6}>
        <div className="flex h-full flex-col justify-center">
          <h1 className="mb-2 font-display text-3xl font-bold text-ink">2026 Piyasa Tahminleri ve Beklentileri</h1>
          <p className="mb-8 font-body text-sm font-semibold text-accent">2026 Senaryoları</p>
          <PiyasaSenaryolariTablosu satirlar={piyasaSenaryolari} tarih={ddmmyyyy(tarih)} />
        </div>
      </Sayfa>

      <Sayfa numara={7}>
        <div className="flex h-full flex-col justify-center">
          <h1 className="mb-4 font-display text-2xl font-bold text-ink">2026 Piyasa ve Makro Tahminleri</h1>
          <MakroGostergelerTablosu satirlar={makroGostergeler} />
        </div>
      </Sayfa>

      <FonSayfalari fonKodu="AYA" sayfaNoBaslangic={8} />
      <FonSayfalari fonKodu="AAV" sayfaNoBaslangic={9} />
      <FonSayfalari fonKodu="TLZ" sayfaNoBaslangic={12} />
      <FonSayfalari fonKodu="ANZ" sayfaNoBaslangic={13} />
      <FonSayfalari fonKodu="PKP" sayfaNoBaslangic={14} />
      <FonSayfalari fonKodu="AED" sayfaNoBaslangic={15} />
      <FonSayfalari fonKodu="AAS" sayfaNoBaslangic={16} />
      <FonSayfalari fonKodu="YLC" sayfaNoBaslangic={17} />
      <FonSayfalari fonKodu="RTG" sayfaNoBaslangic={18} />
      <FonSayfalari fonKodu="JET" sayfaNoBaslangic={19} />
      <FonSayfalari fonKodu="URA" sayfaNoBaslangic={20} />
      <FonSayfalari fonKodu="DGH" sayfaNoBaslangic={21} />
      <FonSayfalari fonKodu="PKF" sayfaNoBaslangic={22} />

      <Sayfa numara={23}>
        <div className="flex h-full flex-col justify-center">
          <div className="mb-16 flex items-center justify-center gap-5">
            <EklerSuslemesi />
            <h1 className="font-display text-5xl font-bold tracking-wide text-accent underline decoration-4 underline-offset-[10px]">
              EKLER
            </h1>
            <EklerSuslemesi ayna />
          </div>
          <div className="mx-auto grid grid-flow-col grid-rows-3 gap-x-20 gap-y-12">
            {EKLER_LISTESI.map((oge) => (
              <div key={oge.sayfa} className="w-[80mm]">
                <p className="mb-1 font-data text-sm font-semibold text-accent-warm underline underline-offset-4">
                  Sayfa {oge.sayfa}
                </p>
                <p className="text-xl font-bold leading-snug text-ink text-wrap-balance">{oge.baslik}</p>
              </div>
            ))}
          </div>
        </div>
      </Sayfa>

      <Sayfa numara={24}>
        <div className="flex h-full flex-col">
          <h1 className="mb-4 font-display text-2xl font-bold text-ink">Borsa İstanbul Değerleme</h1>
          <div className="grid flex-1 min-h-0 grid-cols-2 gap-10">
            <div className="flex flex-col">
              <h2 className="mb-2 text-center text-sm font-bold leading-snug text-ink">
                Fiyat/Kazanç Oranlarına göre Türkiye, GOP ve Dünya Karşılaştırması
              </h2>
              <div className="min-h-0 flex-1">
                <BasitBarGrafik
                  veri={[
                    { kategori: "Türkiye", deger: turkiyeFK, renk: "var(--accent-warm)" },
                    { kategori: "GOP", deger: gopFK },
                    { kategori: "Dünya", deger: dunyaFK },
                  ]}
                />
              </div>
              <p className="mt-1 text-[10px] italic text-ink-faint">*GOP: Gelişmekte Olan Piyasalar</p>
              <p className="text-[10px] italic text-ink-faint">
                Kaynak: MSCI — Türkiye {turkiyeTarihUzun} itibariyle · GOP/Dünya {msciTarihUzun} itibariyle
              </p>
            </div>
            <div className="flex flex-col">
              <h2 className="mb-2 text-center text-sm font-bold leading-snug text-ink">
                12 Aylık Tahmini Fiyat/Kazanç Oranları
              </h2>
              <div className="min-h-0 flex-1">
                <BasitBarGrafik
                  veri={peerFK.map((p) => ({
                    kategori: p.Ulke_Endeks,
                    deger: p.FK_Orani_12Ay_Ileri,
                    renk: p.Ulke_Endeks === "Türkiye" ? "var(--accent-warm)" : undefined,
                  }))}
                  renk="var(--accent)"
                  etiketAcisi={35}
                />
              </div>
              <p className="mt-1 text-[10px] italic text-ink-faint">Kaynak: MSCI {peerTarihUzun} itibariyle</p>
            </div>
          </div>
          <div className="mt-6 flex flex-col gap-3">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 text-lg font-bold text-accent-warm">✓</span>
              <p className="text-sm font-semibold text-ink">
                Türk hisse senetleri, Dünya ortalamalarına göre %{iskontoDunya}; benzer Gelişmekte Olan Piyasalara göre %{iskontoGOP} iskontoludur.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <span className="mt-0.5 text-lg font-bold text-accent-warm">✓</span>
              <p className="text-sm font-semibold text-ink">{getSabitMetin("Deger_FK_Yorum_2")}</p>
            </div>
          </div>
        </div>
      </Sayfa>

      <Sayfa numara={25}>
        <div className="flex h-full flex-col">
          <h1 className="mb-4 font-display text-2xl font-bold text-ink">Borsa İstanbul Değerleme</h1>
          <div className="grid flex-1 min-h-0 grid-cols-2 gap-10">
            <div className="flex flex-col">
              <h2 className="mb-2 text-sm font-bold text-accent-warm">USD Bazında BIST-100 Endeksi (2007-2026)</h2>
              <div className="min-h-0 flex-1">
                <EndeksBantGrafigi
                  veri={bist100UsdEndeksi.seri}
                  cizgiRenk="var(--accent)"
                  bantlar={
                    bist100UsdEndeksi.istatistik
                      ? [
                          { etiket: "Medyan", deger: bist100UsdEndeksi.istatistik.Medyan, renk: "var(--accent-warm)", kesikli: true },
                          { etiket: "+ stdev", deger: bist100UsdEndeksi.istatistik.ustSapma, renk: "var(--ink-faint)" },
                          { etiket: "- stdev", deger: bist100UsdEndeksi.istatistik.altSapma, renk: "var(--ink-faint)" },
                        ]
                      : []
                  }
                />
              </div>
            </div>
            <div className="flex flex-col">
              <h2 className="mb-2 text-sm font-bold text-accent-warm">BIST100 Piyasa Değeri/GSYİH (ABD$)</h2>
              <div className="min-h-0 flex-1">
                <EndeksBantGrafigi
                  veri={bistGsyihOrani.seri}
                  cizgiRenk="var(--accent)"
                  ondalik={2}
                  bantlar={
                    bistGsyihOrani.istatistik
                      ? [
                          { etiket: "Ortalama", deger: bistGsyihOrani.istatistik.ortalama, renk: "var(--accent-alt)" },
                          { etiket: "+1 std sapma", deger: bistGsyihOrani.istatistik.ustSapma, renk: "var(--critical)" },
                          { etiket: "-1 std sapma", deger: bistGsyihOrani.istatistik.altSapma, renk: "var(--critical)" },
                          { etiket: "Max", deger: bistGsyihOrani.istatistik.maksimum, renk: "var(--ink-faint)" },
                          { etiket: "Min", deger: bistGsyihOrani.istatistik.minimum, renk: "var(--ink-faint)" },
                        ]
                      : []
                  }
                />
              </div>
            </div>
          </div>
          <div className="mt-6 flex flex-col gap-3">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 text-lg font-bold text-accent-warm">✓</span>
              <p className="text-sm font-semibold text-ink">{getSabitMetin("Deger_USD_BIST_Yorum_1")}</p>
            </div>
            <div className="flex items-start gap-3">
              <span className="mt-0.5 text-lg font-bold text-accent-warm">✓</span>
              <p className="text-sm font-semibold text-ink">{getSabitMetin("Deger_USD_BIST_Yorum_2")}</p>
            </div>
          </div>
        </div>
      </Sayfa>

      <Sayfa numara={26}>
        <div className="flex h-full flex-col">
          <h1 className="mb-4 font-display text-2xl font-bold text-ink">Uzun Vadede Borsa İstanbul</h1>
          <div className="mb-4 flex flex-col gap-1.5">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 text-base font-bold text-accent-warm">✓</span>
              <p className="text-sm font-semibold text-ink">{getSabitMetin("Bist_Yillik_Yorum_1")}</p>
            </div>
            <div className="flex items-start gap-3">
              <span className="mt-0.5 text-base font-bold text-accent-warm">✓</span>
              <p className="text-sm font-semibold text-ink">{getSabitMetin("Bist_Yillik_Yorum_2")}</p>
            </div>
          </div>
          <div className="min-h-0 flex-1">
            <BasitBarGrafik
              veri={bistYillikGetiriler.map((r) => ({ kategori: String(r.Yil), deger: r.Getiri_Yuzde }))}
              ondalik={0}
              renk="var(--accent)"
              negatifRenk="var(--critical)"
              etiketAcisi={90}
            />
          </div>
        </div>
      </Sayfa>

      <Sayfa numara={27}>
        <div className="flex h-full flex-col">
          <h1 className="mb-4 font-display text-2xl font-bold text-ink">
            MSCI Gelişmiş ve Gelişmekte Olan Piyasalar Endeksleri
          </h1>
          <div className="mb-4 flex items-start gap-3">
            <span className="mt-0.5 text-base font-bold text-accent-warm">✓</span>
            <p className="text-sm font-semibold text-ink">{getSabitMetin("Msci_Yorum_1")}</p>
          </div>
          <div className="min-h-0 flex-1">
            <FonFiyatGrafigi
              veri={mxwoMxef}
              fonAdi="MSCI Gelişmiş Piyasalar (MXWO)"
              benchmarkAdi="MSCI Gelişmekte Olan Piyasalar (MXEF)"
              endekslenmis={false}
              sonDegerEtiketleriGoster
              sonDegerOndalik={2}
            />
          </div>
          <p className="mt-1 text-[10px] italic text-ink-faint">Kaynak: Bloomberg</p>
        </div>
      </Sayfa>

      <Sayfa numara={28}>
        <div className="flex h-full flex-col">
          <h1 className="mb-8 font-display text-3xl font-bold text-ink text-wrap-balance">
            Yatırım Fonları ile Portföy Yönetiminin Avantajları
          </h1>
          <div className="flex flex-1 flex-col justify-center gap-10">
            <div>
              <p className="mb-4 text-lg font-semibold text-accent-warm">{getSabitMetin("Fon_Yonetimi_Avantajlari_Giris")}</p>
              <ul className="flex flex-col gap-4">
                {fonAvantajGenel.map((m) => (
                  <li key={m.Sira} className="flex items-start gap-3 text-base font-semibold text-ink">
                    <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-accent-warm" />
                    <span>{m.Metin}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="mb-4 text-lg font-semibold text-accent-warm">{getSabitMetin("Fon_Yonetimi_Avantajlari_Baslik2")}</p>
              <ul className="flex flex-col gap-4">
                {fonAvantajMusteri.map((m) => (
                  <li key={m.Sira} className="flex items-start gap-3 text-base font-semibold text-ink">
                    <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-accent-warm" />
                    <span>{m.Metin}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </Sayfa>

      <Sayfa numara={29}>
        <div className="flex h-full flex-col">
          <h1 className="mb-8 font-display text-3xl font-bold text-ink">Yatırım Fonlarının Vergisel Avantajları</h1>
          <div className="grid flex-1 min-h-0 grid-cols-2 gap-14 text-base">
            <div className="flex flex-col gap-4">
              <p className="text-lg font-semibold text-accent-warm">Bireysel Yatırımcılar İçin Avantajlar;</p>
              <p className="font-semibold text-ink">{getSabitMetin("Vergi_Bireysel_Giris_1")}</p>
              <p className="font-semibold text-ink">{getSabitMetin("Vergi_Bireysel_Giris_2")}</p>
              <ol className="flex flex-col gap-3">
                {vergiBireyselListe.map((s) => (
                  <li key={s.Sira} className="flex items-start gap-2 font-semibold text-ink">
                    <span>{s.Sira}.</span>
                    <span>{s.Aciklama}</span>
                  </li>
                ))}
              </ol>
              <p className="mt-3 font-semibold text-ink">Eurobond fonlarında;</p>
              <p className="font-semibold text-accent">• {getSabitMetin("Vergi_Eurobond_Not")}</p>
              <p className="font-semibold text-ink">{getSabitMetin("Vergi_Doviz_Not")}</p>
            </div>
            <div className="flex flex-col gap-3">
              <p className="text-lg font-semibold text-accent-warm">Kurumlar İçin Avantajlar;</p>
              <p className="font-semibold text-ink">• {getSabitMetin("Vergi_Kurumlar_Not")}</p>
              <p className="mt-2 text-lg font-semibold text-accent-warm">
                ANZ Ata Portföy Dördüncü Serbest (Döviz) Fonunun Vergisel Avantajları;
              </p>
              <table className="w-full table-fixed border-collapse text-sm">
                <colgroup>
                  <col className="w-[5%]" />
                  <col className="w-[16%]" />
                  <col className="w-[20%]" />
                  <col className="w-[34%]" />
                  <col className="w-[25%]" />
                </colgroup>
                <thead>
                  <tr>
                    <th colSpan={2} className="border border-line-strong bg-accent-warm px-2 py-1 text-left font-bold text-white break-words">
                      Yatırımcı:
                    </th>
                    <th className="border border-line-strong bg-accent-warm px-2 py-1 font-bold text-white break-words">Döviz Mevduatında</th>
                    <th className="border border-line-strong bg-accent-warm px-2 py-1 font-bold text-white break-words">
                      Eurobond Alım/Satımında ve Faiz(Kupon)/İtfa Gelirinde
                    </th>
                    <th className="border border-line-strong bg-accent-warm px-2 py-1 font-bold text-white break-words">Eurobond Fonu Alırsa</th>
                  </tr>
                </thead>
                <tbody>
                  {vergiAnzTablosu.map((satir, i) => (
                    <tr key={satir.Satir}>
                      {satir.Grup && i === 1 && (
                        <td rowSpan={2} className="border border-line-strong bg-accent px-2 py-1 text-center font-bold text-white [writing-mode:vertical-rl]">
                          {satir.Grup}
                        </td>
                      )}
                      {!satir.Grup && (
                        <td colSpan={2} className="border border-line-strong bg-accent px-2 py-1 text-center text-xs font-bold whitespace-nowrap text-white">
                          {satir.Satir}
                        </td>
                      )}
                      {satir.Grup && <td className="border border-line-strong px-2 py-1 text-center font-semibold text-ink break-words">{satir.Satir}</td>}
                      <td className="border border-line-strong px-2 py-1 text-center text-ink break-words">{satir.Doviz_Mevduatinda}</td>
                      <td className="border border-line-strong px-2 py-1 text-center text-ink break-words">{satir.Eurobond_Alim_Satim}</td>
                      <td className="border border-line-strong px-2 py-1 text-center text-ink break-words">{satir.Eurobond_Fonu_Alirsa}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="text-xs italic leading-snug text-accent">{getSabitMetin("Vergi_ANZ_Tablo_Footnote")}</p>
            </div>
          </div>
        </div>
      </Sayfa>

      <Sayfa numara={30}>
        <div className="flex h-full flex-col">
          <h1 className="mb-6 font-display text-3xl font-bold text-ink">Ata Fonları</h1>
          <table className="w-full border-collapse text-sm table-fixed">
            <colgroup>
              <col className="w-[9%]" />
              <col className="w-[34%]" />
              <col className="w-[16%]" />
              <col className="w-[16%]" />
              <col className="w-[13%]" />
              <col className="w-[12%]" />
            </colgroup>
            <thead>
              <tr>
                <th className="border border-line-strong bg-accent-warm px-3 py-1 text-left font-bold text-white">Fon Kodu</th>
                <th className="border border-line-strong bg-accent-warm px-3 py-1 text-left font-bold text-white">Fon İsmi</th>
                <th className="border border-line-strong bg-accent-warm px-3 py-1 text-left font-bold text-white">Fon Türü</th>
                <th className="border border-line-strong bg-accent-warm px-3 py-1 font-bold text-white">Risk Değeri (7 üzerinden)</th>
                <th className="border border-line-strong bg-accent-warm px-3 py-1 font-bold text-white">Yönetim Ücreti</th>
                <th className="border border-line-strong bg-accent-warm px-3 py-1 font-bold text-white">Vergi</th>
              </tr>
            </thead>
            <tbody>
              {fonKatalogTumu.map((f, i) => (
                <tr key={f.Fon_Kodu} className={i % 2 === 1 ? "bg-accent-soft" : undefined}>
                  <td className="border border-line-strong px-3 py-1 font-bold text-accent">{f.Fon_Kodu}</td>
                  <td className="border border-line-strong px-3 py-1 font-semibold text-ink">{f.Fon_Adi}</td>
                  <td className="border border-line-strong px-3 py-1 font-semibold text-ink">{f.Fon_Turu}</td>
                  <td className="border border-line-strong px-3 py-1 text-center font-semibold text-ink">{f.Risk_Degeri_1_7}</td>
                  <td className="border border-line-strong px-3 py-1 text-center font-semibold text-ink">{f.Yonetim_Ucreti}</td>
                  <td className="border border-line-strong px-3 py-1 text-center font-semibold text-ink">{f.Stopaj}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-4 text-xs italic text-ink-faint">{getSabitMetin("Ata_Fonlari_Tablo_Footnote")}</p>
        </div>
      </Sayfa>

      <Sayfa>
        <div className="flex h-full flex-col">
          <h1 className="mb-10 font-display text-3xl font-bold text-ink text-wrap-balance">{getSabitMetin("Iletisim_Baslik")}</h1>
          <div className="flex flex-1 flex-col justify-center gap-16">
            <div className="grid grid-cols-3 gap-x-14 gap-y-12">
              {iletisimEkip.map((k) => (
                <div key={k.Ad_Soyad}>
                  <p className="font-display text-2xl font-bold text-accent">{k.Ad_Soyad}</p>
                  <p className="mt-1 text-base font-semibold text-ink-soft">{k.Unvan}</p>
                  <p className="mt-2 font-data text-base text-ink-soft">{k.Telefon}</p>
                  <p className="font-data text-base text-ink-soft">{k.Eposta}</p>
                </div>
              ))}
            </div>
            <div>
              <p className="text-base font-semibold text-accent-warm">{getSabitMetin("Iletisim_Adres")}</p>
              <p className="mt-2 text-base font-semibold text-accent-warm">Tel: {getSabitMetin("Iletisim_Telefon")}</p>
              <p className="text-base font-semibold text-accent-warm">{getSabitMetin("Iletisim_Website")}</p>
            </div>
          </div>
          <p className="border-t border-line pt-4 text-[10px] leading-snug text-ink-faint">{getSabitMetin("Yasal_Uyari")}</p>
        </div>
      </Sayfa>
    </div>
  );
}

// EKLER divider's page index — mirrors the legacy deck's own appendix list.
// Hardcoded here deliberately, same as every other page's `sayfaNoBaslangic`
// prop above: these numbers only change if pages get added/removed/reordered,
// which already requires touching this file regardless.
const EKLER_LISTESI = [
  { sayfa: "24-25", baslik: "Borsa İstanbul Değerleme" },
  { sayfa: "26", baslik: "Uzun Vadede Borsa İstanbul" },
  { sayfa: "27", baslik: "MSCI Gelişmiş ve Gelişmekte Olan Piyasalar Endeksleri" },
  { sayfa: "28", baslik: "Yatırım Fonları ile Portföy Yönetiminin Avantajları" },
  { sayfa: "29", baslik: "Yatırım Fonlarının Vergisel Avantajları" },
  { sayfa: "30", baslik: "Ata Fonları" },
];

// Small circle-plus-taper flourish flanking the "EKLER" title, echoing the
// legacy deck's own two orange accent marks — geometric, not a raster asset,
// same reasoning as the mountain-peak ribbon in Sayfa.tsx.
function EklerSuslemesi({ ayna }: { ayna?: boolean }) {
  return (
    <svg
      width="72"
      height="36"
      viewBox="0 0 80 40"
      aria-hidden="true"
      style={ayna ? { transform: "scaleX(-1)" } : undefined}
    >
      <path d="M30 13 Q58 13 79 19 L79 21 Q58 27 30 27 Z" fill="var(--accent-warm)" />
      <circle cx="17" cy="20" r="15" fill="var(--accent-warm)" />
    </svg>
  );
}
