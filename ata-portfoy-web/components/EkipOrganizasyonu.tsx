import type { EkipOrganizasyonSatiri } from "@/lib/veriKaynagi";

// One "Fon Yönetimi" / "Fon Operasyon" org card — a row with no Bolum is
// card-top leadership (bold name + title, no department label); everything
// else groups under its department, in the sheet's own row order.
export function EkipKarti({
  baslik,
  satirlar,
}: {
  baslik: string;
  satirlar: EkipOrganizasyonSatiri[];
}) {
  const liderlik = satirlar.filter((s) => !s.Bolum);

  const bolumler: { ad: string; kisiler: string[] }[] = [];
  for (const s of satirlar) {
    if (!s.Bolum) continue;
    let b = bolumler.find((x) => x.ad === s.Bolum);
    if (!b) {
      b = { ad: s.Bolum, kisiler: [] };
      bolumler.push(b);
    }
    b.kisiler.push(s.Ad_Soyad);
  }

  return (
    <div className="flex h-full flex-1 flex-col overflow-hidden rounded-[3px] border border-line-strong">
      <div className="bg-accent px-4 py-2 text-center font-display text-sm font-bold uppercase tracking-[0.05em] text-white">
        {baslik}
      </div>
      <div className="flex flex-1 flex-col gap-3 bg-bg-sunken px-4 py-4">
        {liderlik.map((kisi) => (
          <div key={kisi.Ad_Soyad} className="text-center">
            <div className="font-body text-[11px] font-bold text-ink">{kisi.Ad_Soyad}</div>
            <div className="font-body text-[9px] text-ink-soft">{kisi.Unvan}</div>
          </div>
        ))}
        {liderlik.length > 0 && <div className="h-px bg-line-strong" />}
        {bolumler.map((b) => (
          <div key={b.ad} className="text-center">
            <div className="mb-1 font-body text-[9px] font-bold uppercase tracking-[0.06em] text-accent-warm">
              {b.ad}
            </div>
            {b.kisiler.map((k) => (
              <div key={k} className="font-body text-[10px] font-semibold text-ink">
                {k}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
