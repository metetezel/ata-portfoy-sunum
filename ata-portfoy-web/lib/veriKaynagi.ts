import "server-only";
import path from "node:path";
import fs from "node:fs";
import * as XLSX from "xlsx";

// Data lives in Mete's working project folder (where he drops source files
// each week), not next to the app code — the app code moved to local disk
// for fast Next.js dev/build, but the data stays where he already works.
// UNC path, not a "Z:\" drive-letter mapping — drive letters are assigned
// per-machine (home PC vs. office PC can map Z: to different things, or not
// map it at all), while the UNC path to the file server is stable everywhere
// on the corporate network. The automation scripts (guncelle_*.py) already
// use the UNC form for this same reason.
const KAYNAK_KLASORU =
  process.env.SUNUM_KAYNAK_KLASORU ??
  "\\\\atafiles\\Ata.Portföy\\Mete Tezel\\Sunum [Cursor & Claude]";
const VERI_KAYNAGI_PATH = path.join(KAYNAK_KLASORU, "Veri_Kaynagi.xlsx");

export type FonKatalog = {
  Fon_Kodu: string;
  Fon_Adi: string;
  Kisa_Ad: string;
  Fon_Turu: string;
  Risk_Degeri_1_7: number;
  Yonetim_Ucreti: string;
  Stopaj: string;
  Benchmark_Aciklama: string;
  Benchmark_Kisa_Ad: string;
  // Chart-legend name for a SECOND comparison line (currently just AED) —
  // separate from Fon_Performans_Ek_Kriter's own Kriter_Adi since the
  // legacy deck uses a different short name in the table ("TL Mevduat")
  // vs. the chart legend ("KYD Mevduat Endeksi") for the same series.
  Benchmark2_Kisa_Ad: string;
  Not: string;
};

export type FonPerformansSatiri = {
  Tarih: string;
  Fon_Kodu: string;
  Pencere: string;
  Fon_Getiri_Yuzde: number;
  // null for funds with no benchmark at all (e.g. PKP, a money-market fund
  // the legacy deck shows with only a "Fon" column, no comparison index).
  Benchmark_Getiri_Yuzde: number | null;
};

// For funds compared against MORE than one benchmark at once (currently
// just AED: BIST-100 Getiri / USD / TL Mevduat) — the single
// Benchmark_Getiri_Yuzde column above only has room for one, so extra
// comparison columns live here instead, one row per (Pencere, Kriter_Adi).
export type FonPerformansEkKriterSatiri = {
  Tarih: string;
  Fon_Kodu: string;
  Pencere: string;
  Kriter_Adi: string;
  Getiri_Yuzde: number;
};

export type FonDagilimSatiri = {
  Tarih: string;
  Fon_Kodu: string;
  Varlik_Sinifi: string;
  Yuzde: number;
};

export type FonMetni = {
  Fon_Kodu: string;
  Aciklama_Metni: string;
};

export type FonGetiriAnaliziSatiri = {
  Fon_Kodu: string;
  Tip: "Net" | "Brut";
  Taraf: "Fon" | "Benchmark" | "Nispi";
  Yillik: number;
  "3Yil_Kumulatif": number;
  "5Yil_Kumulatif": number;
  BaslangictanBeri_Kumulatif: number;
  "3Yil_Yillik": number;
  "5Yil_Yillik": number;
  BaslangictanBeri_Yillik: number;
  Kurulus_Tarihi: string;
};

export type FonYillikKarsilastirmaSatiri = {
  Fon_Kodu: string;
  Donem: string;
  Para_Birimi: "TL" | "USD";
  Fon_Getiri_Yillik: number;
  Benchmark_Getiri_Yillik: number;
};

// Every getXxx() below used to call fs.readFileSync + XLSX.read on its own —
// harmless when there were a handful of sheets, but a single /sunum render
// now fans out into 100+ of these calls (13 funds × several sheet reads
// each, plus every page-level getX above) once the deck grew this large.
// Each one re-reads and re-parses the WHOLE multi-MB workbook over the slow
// \\atafiles UNC share, which compounded into 60-75s page loads and at
// least one outright corrupted read ("Bad compressed size") under the load
// — found by watching the dev server's own request log while adding Sayfa
// 27, not a hypothetical concern. Cached here, keyed by the file's mtime,
// so repeat calls reuse the already-parsed workbook and only pay for a
// disk read again once the file has genuinely changed (e.g. after a
// guncelle_*.py run) — a cheap stat() every call, not a free-standing timer,
// so editing the file mid-session still picks up fresh data immediately.
let onbellek: { mtimeMs: number; wb: XLSX.WorkBook } | null = null;

function calismaKitabiniAl(): XLSX.WorkBook {
  const bilgi = fs.statSync(VERI_KAYNAGI_PATH);
  if (!onbellek || onbellek.mtimeMs !== bilgi.mtimeMs) {
    const buf = fs.readFileSync(VERI_KAYNAGI_PATH);
    onbellek = { mtimeMs: bilgi.mtimeMs, wb: XLSX.read(buf, { type: "buffer", cellDates: false }) };
  }
  return onbellek.wb;
}

function readSheet<T>(sheetName: string): T[] {
  const wb = calismaKitabiniAl();
  const sheet = wb.Sheets[sheetName];
  if (!sheet) return [];
  const rows = XLSX.utils.sheet_to_json<T>(sheet, { defval: null });
  // sheet_to_json rows aren't guaranteed plain objects (React's server->client
  // prop serialization rejects anything else) — force a clean plain copy.
  return JSON.parse(JSON.stringify(rows));
}

export function getFonKatalog(fonKodu?: string): FonKatalog[] {
  const rows = readSheet<FonKatalog>("Fon_Katalog");
  return fonKodu ? rows.filter((r) => r.Fon_Kodu === fonKodu) : rows;
}

export function getFonMetni(fonKodu: string): string {
  const rows = readSheet<FonMetni>("Fon_Metinleri");
  return rows.find((r) => r.Fon_Kodu === fonKodu)?.Aciklama_Metni ?? "";
}

export function getFonPerformans(fonKodu: string): FonPerformansSatiri[] {
  const rows = readSheet<FonPerformansSatiri>("Fon_Performans");
  return rows.filter((r) => r.Fon_Kodu === fonKodu);
}

export function getFonPerformansEkKriter(fonKodu: string): FonPerformansEkKriterSatiri[] {
  const rows = readSheet<FonPerformansEkKriterSatiri>("Fon_Performans_Ek_Kriter");
  return rows.filter((r) => r.Fon_Kodu === fonKodu);
}

export function getFonPortfoyDagilimi(fonKodu: string): FonDagilimSatiri[] {
  const rows = readSheet<FonDagilimSatiri>("Fon_Portfoy_Dagilimi");
  return rows.filter((r) => r.Fon_Kodu === fonKodu);
}

// Only some funds (e.g. AAV) have this extended breakdown — callers should
// treat an empty array as "this fund doesn't get the extra section", not an error.
export function getFonGetiriAnalizi(fonKodu: string): FonGetiriAnaliziSatiri[] {
  const rows = readSheet<FonGetiriAnaliziSatiri>("Fon_Getiri_Analizi_Detay");
  return rows.filter((r) => r.Fon_Kodu === fonKodu);
}

export function getFonYillikKarsilastirma(fonKodu: string): FonYillikKarsilastirmaSatiri[] {
  const rows = readSheet<FonYillikKarsilastirmaSatiri>("Fon_Yillik_Getiri_Karsilastirma");
  return rows.filter((r) => r.Fon_Kodu === fonKodu);
}

export type FonTemettuVerimiSatiri = {
  Fon_Kodu: string;
  Sira: number;
  Donem_Etiket: string;
  Temettu_Verimi_Yuzde: number;
};

// Only dividend-paying funds (e.g. AYA) have rows here — empty for everyone else.
export function getFonTemettuVerimi(fonKodu: string): FonTemettuVerimiSatiri[] {
  return readSheet<FonTemettuVerimiSatiri>("Fon_Temettu_Verimi")
    .filter((r) => r.Fon_Kodu === fonKodu)
    .sort((a, b) => a.Sira - b.Sira);
}

// Single source for "as of" date across the whole deck — update Kapak_Ozet's
// Tarih once a week and every rolling-window caption (3yr/5yr charts etc.)
// recomputes itself instead of needing hand-typed date ranges everywhere.
export function getRaporTarihi(): Date {
  const rows = readSheet<{ Tarih: string }>("Kapak_Ozet");
  const tarih = rows[0]?.Tarih;
  return tarih ? new Date(tarih) : new Date();
}

export type KapakOzet = {
  Tarih: string;
  AUM_Milyar_TL: number;
  Yatirim_Fon_Sayisi: number;
  Serbest_Fon_Sayisi: number;
};

export function getKapakOzet(): KapakOzet | undefined {
  return readSheet<KapakOzet>("Kapak_Ozet")[0];
}

export type EkipSatiri = {
  Ad_Soyad: string;
  Unvan: string;
  Telefon: string;
  Eposta: string;
};

// Contact-page cards (Sayfa 31) — distinct from getEkipOrganizasyon()'s
// larger internal org chart (Sayfa 2), see that function's own note.
export function getEkip(): EkipSatiri[] {
  return readSheet<EkipSatiri>("Ekip");
}

export type EkipOrganizasyonSatiri = {
  Kart: string;
  Bolum: string;
  Ad_Soyad: string;
  Unvan: string;
};

export function getEkipOrganizasyon(): EkipOrganizasyonSatiri[] {
  return readSheet<EkipOrganizasyonSatiri>("Ekip_Organizasyon");
}

export type FonPerformansOzetSatiri = {
  Grup: number;
  Ad: string;
  Getiri_Yuzde: number;
  Tip: "Fon" | "Benchmark";
};

export function getFonlarPerformansOzet(): FonPerformansOzetSatiri[] {
  return readSheet<FonPerformansOzetSatiri>("Ata_Fonlari_Performans_Ozet");
}

// The legacy deck's second "Güçlü Performans" page (Yılbaşından Beri window)
// — a genuinely different fund/benchmark selection and grouping from the
// trailing-12-month one above, not just the same rows re-sorted.
export function getFonlarPerformansOzetYBB(): FonPerformansOzetSatiri[] {
  return readSheet<FonPerformansOzetSatiri>("Ata_Fonlari_Performans_Ozet_YBB");
}

export type Yatirim100TLDagilimSatiri = {
  Varlik_Sinifi: string;
  Yuzde: number;
};

export function getYatirim100TLDagilim(): Yatirim100TLDagilimSatiri[] {
  return readSheet<Yatirim100TLDagilimSatiri>("Yatirim_100TL_Dagilim");
}

export type Yatirim100TLMaddeSatiri = {
  Sira: number;
  Aciklama: string;
  Tutar_TL: number;
};

export function getYatirim100TLMaddeler(): Yatirim100TLMaddeSatiri[] {
  return readSheet<Yatirim100TLMaddeSatiri>("Yatirim_100TL_Maddeler").sort((a, b) => a.Sira - b.Sira);
}

export type PiyasaSenaryoSatiri = {
  Tarih: string;
  Enstruman: string;
  Mevcut_Durum: number;
  Kotumser: number;
  Baz: number;
  Iyimser: number;
};

export function getPiyasaSenaryolari(): PiyasaSenaryoSatiri[] {
  return readSheet<PiyasaSenaryoSatiri>("Piyasa_Senaryolari");
}

export type MakroGostergeSatiri = {
  Yil: number;
  Gosterge: string;
  Deger: number;
};

export function getMakroGostergeler(): MakroGostergeSatiri[] {
  return readSheet<MakroGostergeSatiri>("Makro_Gostergeler");
}

export type DegerlemeMetrikSatiri = {
  Tarih: string;
  Metrik: string;
  Deger: number;
};

export function getDegerlemeMetrikleri(): DegerlemeMetrikSatiri[] {
  return readSheet<DegerlemeMetrikSatiri>("Degerleme_CDS_MSCI");
}

export type PeerPeSatiri = {
  // Sadece ilk satırda dolu (sheet'te tek seferlik yazılıyor) — diğer
  // satırlarda undefined.
  Tarih?: string;
  Ulke_Endeks: string;
  FK_Orani_12Ay_Ileri: number;
};

// This sheet's headers sit at row 7 (not row 1, like every other sheet) —
// there's a title + source-note block above the table — so it needs its own
// reader with an explicit `range` offset instead of the generic readSheet().
export function getPeerPeKarsilastirma(): PeerPeSatiri[] {
  const wb = calismaKitabiniAl();
  const sheet = wb.Sheets["Peer_PE_Karsilastirma"];
  if (!sheet) return [];
  const rows = XLSX.utils.sheet_to_json<PeerPeSatiri>(sheet, { defval: null, range: 6 });
  // Defensive type-check, same lesson as Makro_Gostergeler's stray-row bug:
  // the sheet's own "↑ her hafta..." reminder note lands in the same column
  // as Ulke_Endeks on its own row, with no numeric FK value next to it.
  const gercek = rows.filter(
    (r) => typeof r.FK_Orani_12Ay_Ileri === "number" && typeof r.Ulke_Endeks === "string" && r.Ulke_Endeks.length > 0
  );
  return JSON.parse(JSON.stringify(gercek));
}

export type BistYillikGetiriSatiri = {
  Yil: number;
  Getiri_Yuzde: number;
};

export function getBistYillikGetiriler(): BistYillikGetiriSatiri[] {
  return readSheet<BistYillikGetiriSatiri>("Bist_Yillik_Getiriler").sort((a, b) => a.Yil - b.Yil);
}

export type FonAvantajMaddesi = {
  Bolum: "Genel" | "Musteriye_Ozel";
  Sira: number;
  Metin: string;
};

export function getFonAvantajlariMaddeler(bolum: FonAvantajMaddesi["Bolum"]): FonAvantajMaddesi[] {
  return readSheet<FonAvantajMaddesi>("Fon_Avantajlari_Maddeler")
    .filter((r) => r.Bolum === bolum)
    .sort((a, b) => a.Sira - b.Sira);
}

export type VergiBireyselFonSatiri = {
  Sira: number;
  Aciklama: string;
};

export function getVergiBireyselFonListesi(): VergiBireyselFonSatiri[] {
  return readSheet<VergiBireyselFonSatiri>("Vergi_Bireysel_Fon_Listesi").sort((a, b) => a.Sira - b.Sira);
}

export type VergiAnzTabloSatiri = {
  Grup: string;
  Satir: string;
  Doviz_Mevduatinda: string;
  Eurobond_Alim_Satim: string;
  Eurobond_Fonu_Alirsa: string;
};

export function getVergiAnzTablosu(): VergiAnzTabloSatiri[] {
  return readSheet<VergiAnzTabloSatiri>("Vergi_ANZ_Tablosu");
}

export function getSabitMetin(anahtar: string): string {
  const rows = readSheet<{ Anahtar: string; Metin: string }>("Sabit_Metinler");
  return rows.find((r) => r.Anahtar === anahtar)?.Metin ?? "";
}

const PENCERE_SIRASI = [
  "Aylik",
  "3 Aylik",
  "6 Aylik",
  "Yillik",
  "Yilbasindan Beri",
  "3 Yil",
  "5 Yil",
  "Kurulustan Beri",
];

export function siraliPencereler(satirlar: FonPerformansSatiri[]) {
  return [...satirlar].sort(
    (a, b) => PENCERE_SIRASI.indexOf(a.Pencere) - PENCERE_SIRASI.indexOf(b.Pencere)
  );
}
