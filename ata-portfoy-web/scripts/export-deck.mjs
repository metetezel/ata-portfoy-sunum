// Weekly deliverable export: renders /sunum (a running dev or prod server,
// not started by this script) via the same emulateMedia("print") + page.pdf()
// path proven all session, and writes both the PDF and a PPTX (one full-bleed
// image per page, built from print-scale element screenshots — not a second,
// possibly-diverging render pass, and no native PDF-rasterization dependency).
//
// Usage (from ata-portfoy-web, with `npm run dev` already running):
//   npm run export            → both PDF and PPTX
//   npm run export:pdf        → PDF only
//   npm run export:pptx       → PPTX only
//
// Env overrides:
//   SUNUM_EXPORT_URL       default http://localhost:3000
//   SUNUM_KAYNAK_KLASORU   default \\atafiles\Ata.Portföy\Mete Tezel\Sunum [Cursor & Claude]
//   SUNUM_CIKTI_KLASORU    default same as SUNUM_KAYNAK_KLASORU
//
// Output layout (2026-07-30 on): {ÇIKTI_KLASÖRÜ}\Sunum Dosyaları\PDF\{yıl}\...
// and \PowerPoint\{yıl}\... — a flat pile of 50+ weekly files a year in the
// project root wasn't going to stay usable; PDF/PPTX split first (they're
// used differently — PDF for review/print, PPTX when someone needs to edit
// a slide), then by the report's OWN year (from Kapak_Ozet!Tarih, not
// today's system date) so it never needs touching as years roll over.

import { chromium } from "playwright";
import * as XLSX from "xlsx";
import PptxGenJS from "pptxgenjs";
import path from "node:path";
import fs from "node:fs";
import os from "node:os";

const KAYNAK_KLASORU =
  process.env.SUNUM_KAYNAK_KLASORU ?? "\\\\atafiles\\Ata.Portföy\\Mete Tezel\\Sunum [Cursor & Claude]";
const CIKTI_KLASORU = process.env.SUNUM_CIKTI_KLASORU ?? KAYNAK_KLASORU;
const BASE_URL = process.env.SUNUM_EXPORT_URL ?? "http://localhost:3000";

const argv = process.argv.slice(2);
const SADECE_PDF = argv.includes("--pdf-only");
const SADECE_PPTX = argv.includes("--pptx-only");

const MM_TO_IN = 1 / 25.4;
const SAYFA_GENISLIK_MM = 297;
const SAYFA_YUKSEKLIK_MM = 210;

// Filename must match the legacy convention exactly ("Ata Portföy Sunum - 1
// Haziran 2026.pdf") so a new export lands as a recognizable sibling of the
// weekly archive already sitting in this folder — derived from the deck's
// OWN cover date (Kapak_Ozet!Tarih), not today's system date, so a re-run
// later in the week still names the file after the week it represents. Same
// date also drives the output year-subfolder (see module docstring above).
function raporTarihi() {
  const dosya = path.join(KAYNAK_KLASORU, "Veri_Kaynagi.xlsx");
  const kitap = XLSX.read(fs.readFileSync(dosya));
  const satirlar = XLSX.utils.sheet_to_json(kitap.Sheets["Kapak_Ozet"]);
  const tarihStr = satirlar[0]?.Tarih;
  const tarih = tarihStr ? new Date(tarihStr) : new Date();
  return {
    tarih,
    uzun: tarih.toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" }),
  };
}

async function sunucuHazirMi() {
  try {
    const yanit = await fetch(`${BASE_URL}/sunum`);
    return yanit.ok;
  } catch {
    return false;
  }
}

async function main() {
  if (!(await sunucuHazirMi())) {
    console.error(
      `Sunucuya ulaşılamadı: ${BASE_URL}/sunum\n` +
        `Önce "npm run dev" (ya da "npm run build && npm run start") çalıştırın, sonra bu script'i tekrar deneyin.`
    );
    process.exit(1);
  }

  const { tarih, uzun: uzunTarih } = raporTarihi();
  const temelAd = `Ata Portföy Sunum - ${uzunTarih}`;
  const yil = String(tarih.getFullYear());
  const pdfKlasoru = path.join(CIKTI_KLASORU, "Sunum Dosyaları", "PDF", yil);
  const pptxKlasoru = path.join(CIKTI_KLASORU, "Sunum Dosyaları", "PowerPoint", yil);
  fs.mkdirSync(pdfKlasoru, { recursive: true });
  fs.mkdirSync(pptxKlasoru, { recursive: true });
  console.log(`Hafta: ${uzunTarih}`);

  const browser = await chromium.launch();
  // 2x device scale so PPTX slide images stay crisp at real A4 print size,
  // not just readable on a laptop screen.
  const context = await browser.newContext({ deviceScaleFactor: 2 });
  const page = await context.newPage();

  const konsolHatalari = [];
  page.on("console", (msg) => msg.type() === "error" && konsolHatalari.push(msg.text()));
  page.on("pageerror", (err) => konsolHatalari.push(String(err)));

  await page.goto(`${BASE_URL}/sunum`, { waitUntil: "networkidle" });
  // Same print-scale rendering used for every verification screenshot this
  // project has taken (.sayfa's on-screen zoom:0.62 only lifts to the real
  // zoom:1 under @media print) — page.pdf() forces this anyway, but the PPTX
  // path below screenshots individual elements, which needs it set explicitly.
  await page.emulateMedia({ media: "print" });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(400);

  const sayfalar = await page.locator(".sayfa").all();
  console.log(`${sayfalar.length} sayfa render edildi.`);
  if (konsolHatalari.length) {
    console.warn(`${konsolHatalari.length} konsol hatası bulundu:`);
    for (const hata of konsolHatalari) console.warn("  " + hata);
  }

  if (!SADECE_PPTX) {
    const pdfYolu = path.join(pdfKlasoru, `${temelAd}.pdf`);
    await page.pdf({ path: pdfYolu, printBackground: true, preferCSSPageSize: true });
    console.log(`PDF yazıldı: ${pdfYolu} (${(fs.statSync(pdfYolu).size / 1024 / 1024).toFixed(1)} MB)`);
  }

  if (!SADECE_PDF) {
    const geciciKlasor = fs.mkdtempSync(path.join(os.tmpdir(), "sunum-export-"));
    const gorseller = [];
    for (let i = 0; i < sayfalar.length; i++) {
      const dosyaYolu = path.join(geciciKlasor, `sayfa-${String(i + 1).padStart(2, "0")}.png`);
      await sayfalar[i].screenshot({ path: dosyaYolu });
      gorseller.push(dosyaYolu);
    }

    const pptx = new PptxGenJS();
    pptx.defineLayout({ name: "A4_YATAY", width: SAYFA_GENISLIK_MM * MM_TO_IN, height: SAYFA_YUKSEKLIK_MM * MM_TO_IN });
    pptx.layout = "A4_YATAY";
    for (const gorsel of gorseller) {
      pptx.addSlide().addImage({
        path: gorsel,
        x: 0,
        y: 0,
        w: SAYFA_GENISLIK_MM * MM_TO_IN,
        h: SAYFA_YUKSEKLIK_MM * MM_TO_IN,
      });
    }
    const pptxYolu = path.join(pptxKlasoru, `${temelAd}.pptx`);
    await pptx.writeFile({ fileName: pptxYolu });
    console.log(`PPTX yazıldı: ${pptxYolu}`);

    fs.rmSync(geciciKlasor, { recursive: true, force: true });
  }

  await browser.close();
  console.log(konsolHatalari.length ? "Tamamlandı — ama konsol hataları var, yukarıya bakın." : "Tamamlandı, 0 konsol hatası.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
