import { ataGrubuSektorleri } from "@/lib/ataGrubuSirketleri";

// Ata Holding masthead + a sector-by-sector logo directory — replaces the
// earlier single cramped raster (one flattened image of ~30 logos). Real
// vector logo files now render individually so each stays crisp at any size,
// and sectors get real breathing room instead of packed pill+row bars.
// eslint-disable-next-line @next/next/no-img-element -- plain <img>: each
// logo has its own native aspect ratio, so "fixed height, auto width" (which
// next/image's required width/height props don't support) is what's needed.
export function SirketlerSemasi() {
  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-col items-center">
        <img src="/sirketler/ata-holding.png" alt="Ata Holding" className="h-[13mm] w-auto" />
      </div>
      <div className="my-3 h-px bg-line-strong" />
      <div className="flex flex-1 flex-col justify-between">
        {ataGrubuSektorleri.map((sektor) => (
          <div
            key={sektor.ad}
            className="flex items-center gap-4 border-b border-line py-1 last:border-b-0"
          >
            <div className="w-[34mm] shrink-0 font-body text-[9px] font-semibold uppercase tracking-[0.1em] text-accent">
              {sektor.ad}
            </div>
            <div className="flex flex-1 flex-wrap items-center justify-center gap-x-4 gap-y-1.5">
              {sektor.logolar.map((dosya) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={dosya}
                  src={`/sirketler/${dosya}`}
                  alt=""
                  className="h-[6mm] w-auto object-contain"
                />
              ))}
              {sektor.metinler?.map((metin) => (
                <span key={metin} className="font-body text-[7px] font-semibold text-ink-soft">
                  {metin}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
