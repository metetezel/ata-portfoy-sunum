import type { FonTemettuVerimiSatiri } from "@/lib/veriKaynagi";

function fmtYuzde(v: number) {
  return `${v.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`;
}

// Two side-by-side columns instead of one long list — halves the vertical
// footprint so the page still has room for the price chart below it.
function YariTablo({ satirlar }: { satirlar: FonTemettuVerimiSatiri[] }) {
  return (
    <table className="w-1/2 text-[10px] leading-tight">
      <tbody>
        {satirlar.map((s, i) => (
          <tr key={s.Sira} className={`border-b border-line last:border-0 ${i % 2 === 1 ? "bg-bg-sunken" : ""}`}>
            <td className="px-2 py-0 font-body font-semibold text-ink">{s.Donem_Etiket}</td>
            <td className="px-2 py-0 text-right font-data text-ink">{fmtYuzde(s.Temettu_Verimi_Yuzde)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function TemettuVerimiTablosu({
  satirlar,
  baslik,
}: {
  satirlar: FonTemettuVerimiSatiri[];
  baslik: string;
}) {
  if (satirlar.length === 0) return null;
  const yarisi = Math.ceil(satirlar.length / 2);
  const sol = satirlar.slice(0, yarisi);
  const sag = satirlar.slice(yarisi);

  return (
    <div className="overflow-hidden rounded-lg border border-line">
      <div className="bg-accent-warm px-3 py-0.5 font-body text-[11px] font-semibold uppercase tracking-wide text-white">
        {baslik}
      </div>
      <div className="flex">
        <YariTablo satirlar={sol} />
        <div className="w-px shrink-0 bg-line" />
        <YariTablo satirlar={sag} />
      </div>
    </div>
  );
}
