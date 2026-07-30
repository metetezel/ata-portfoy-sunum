import "server-only";
import path from "node:path";
import fs from "node:fs";

export type FiyatNoktasi = {
  tarih: string;
  fon: number;
  // null before the benchmark index existed yet (e.g. BIST Temettü 25 Getiri
  // Endeksi wasn't calculated before 2011-07-01) — the fund's own line can
  // start earlier than its benchmark's. Also null for every point on a fund
  // with no benchmark at all (e.g. PKP).
  benchmark: number | null;
  // A SECOND comparison line, for the rare fund compared against more than
  // one benchmark at once (currently just AED: BIST-100 Getiri + KYD
  // Mevduat). Absent/null for every other fund's JSON.
  benchmark2?: number | null;
};

// Bulk time-series data (thousands of points) is generated from the source
// workbook, not hand-maintained in Veri_Kaynagi.xlsx — a human should never
// paste daily price rows into a spreadsheet by hand.
export function getFiyatSerisi(fonKodu: string): FiyatNoktasi[] {
  const dosya = path.join(process.cwd(), "data", `${fonKodu.toLowerCase()}_price_series.json`);
  if (!fs.existsSync(dosya)) return [];
  return JSON.parse(fs.readFileSync(dosya, "utf-8"));
}

// Sayfa 27's MSCI World vs MSCI EM chart — same FiyatNoktasi shape (fon =
// MXWO, benchmark = MXEF) but not a fund, so it doesn't fit the fonKodu
// naming convention above. Built by build_endeks_serisi.py, not
// build_fiyat_serisi.py, since it's a plain two-series comparison with no
// fund/benchmark rebasing involved (both lines are already real index
// levels, matching the legacy chart's own un-rebased axis).
export function getMxwoMxefSerisi(): FiyatNoktasi[] {
  const dosya = path.join(process.cwd(), "data", "mxwo_mxef_series.json");
  if (!fs.existsSync(dosya)) return [];
  return JSON.parse(fs.readFileSync(dosya, "utf-8"));
}
