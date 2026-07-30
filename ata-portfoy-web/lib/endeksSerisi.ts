import "server-only";
import path from "node:path";
import fs from "node:fs";

export type EndeksNoktasi = { tarih: string; deger: number };

export type EndeksSerisi = {
  istatistik: Record<string, number> | null;
  seri: EndeksNoktasi[];
};

// Same reasoning as lib/fiyatSerisi.ts: bulk time-series data is generated
// once from the source workbooks by build_endeks_serisi.py, not hand-typed
// into Veri_Kaynagi.xlsx.
export function getEndeksSerisi(isim: string): EndeksSerisi {
  const dosya = path.join(process.cwd(), "data", `${isim}.json`);
  if (!fs.existsSync(dosya)) return { istatistik: null, seri: [] };
  return JSON.parse(fs.readFileSync(dosya, "utf-8"));
}
