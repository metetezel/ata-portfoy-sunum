import "server-only";
import { promises as fs } from "fs";
import os from "os";
import path from "path";

// Python tarafındaki lisans_kontrol.py'nin karşılığı — aynı adres, aynı
// önbellek dosyası, aynı kurallar; biri değişirse diğeri de değişmeli.
//   {"aktif": true}            -> sunum açılır
//   {"aktif": false} / 404     -> sunum kilitlenir (repo private/silinmiş dahil)
//   GitHub'a ulaşılamıyor      -> son başarılı kontrol 7 günden yeniyse açılır
const DURUM_ADRESI =
  "https://raw.githubusercontent.com/metetezel/ata-portfoy-lisans/main/durum.json";
const TOLERANS_MS = 7 * 24 * 3600 * 1000;
const TAZE_MS = 10 * 60 * 1000;

const KLASOR = path.join(process.env.LOCALAPPDATA || os.homedir(), "AtaPortfoySunum");
const ONBELLEK = path.join(KLASOR, "lisans_onbellek.json");

export type LisansSonucu = { izinli: true; uyari?: string } | { izinli: false; sebep: string };

async function sonBasarili(): Promise<number> {
  try {
    const v = JSON.parse(await fs.readFile(ONBELLEK, "utf-8"));
    return Number(v.son_basarili) * 1000 || 0; // Python saniye yazıyor
  } catch {
    return 0;
  }
}

async function onbellekYaz(ms: number) {
  try {
    await fs.mkdir(KLASOR, { recursive: true });
    await fs.writeFile(ONBELLEK, JSON.stringify({ son_basarili: ms / 1000 }), "utf-8");
  } catch {
    // önbellek yazılamazsa sadece tolerans kaybolur, kontrol yine çalışır
  }
}

export async function lisansKontrol(): Promise<LisansSonucu> {
  const simdi = Date.now();
  const son = await sonBasarili();
  if (simdi - son >= 0 && simdi - son < TAZE_MS) return { izinli: true };

  let veri: { aktif?: unknown } | null = null;
  try {
    const yanit = await fetch(`${DURUM_ADRESI}?t=${simdi}`, {
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    });
    if (yanit.status === 404) {
      await onbellekYaz(0);
      return { izinli: false, sebep: "Lisans dosyasına erişilemiyor (kaldırılmış ya da private yapılmış)." };
    }
    if (yanit.ok) veri = await yanit.json();
  } catch {
    veri = null; // ağ yok / zaman aşımı — tolerans uygula
  }

  if (veri !== null) {
    if (veri.aktif === true) {
      await onbellekYaz(simdi);
      return { izinli: true };
    }
    await onbellekYaz(0);
    return { izinli: false, sebep: "Lisans kapatılmış." };
  }

  const gecen = simdi - son;
  if (son > 0 && gecen >= 0 && gecen < TOLERANS_MS) {
    const kalanGun = ((TOLERANS_MS - gecen) / 86400000).toFixed(1);
    return { izinli: true, uyari: `GitHub lisans kontrolüne ulaşılamadı — ${kalanGun} gün daha çevrimdışı çalışılabilir.` };
  }
  return { izinli: false, sebep: "GitHub lisans kontrolüne ulaşılamadı ve son 7 günde başarılı kontrol yok." };
}
