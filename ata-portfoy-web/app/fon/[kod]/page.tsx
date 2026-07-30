import { notFound } from "next/navigation";
import { getFonKatalog } from "@/lib/veriKaynagi";
import { FonSayfalari } from "@/components/FonSayfalari";

export default async function FonSayfasi({
  params,
}: {
  params: Promise<{ kod: string }>;
}) {
  const { kod } = await params;
  const fonKodu = kod.toUpperCase();

  const [katalog] = getFonKatalog(fonKodu);
  if (!katalog) notFound();

  return (
    <div className="sayfa-tuvali">
      <FonSayfalari fonKodu={fonKodu} />
    </div>
  );
}
