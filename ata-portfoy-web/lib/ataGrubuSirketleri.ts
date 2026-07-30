// Ata Holding's sector/subsidiary structure — static reference data, doesn't
// change on any weekly cadence. Logo files sourced directly from Mete
// (downloaded from ataholding.com.tr/sektorler) and copied to
// public/sirketler/; the Ata Holding masthead itself was cropped from the
// legacy deck's PDF since it isn't one of the "sektörler" page's own assets.
export type SirketSektoru = {
  ad: string;
  logolar: string[];
  // Companies with no logo asset (rendered as styled text instead) — e.g.
  // İzmir Enternasyonel Otelcilik only ever appeared as plain text, even in
  // the legacy deck.
  metinler?: string[];
};

export const ataGrubuSektorleri: SirketSektoru[] = [
  { ad: "Dış Ticaret", logolar: ["ata-bridge.svg"] },
  { ad: "Enerji", logolar: ["atp-greenx.svg"] },
  {
    ad: "Gıda",
    logolar: [
      "tfi.svg", "tab.svg", "mes.svg", "atasancak.svg", "ekmek.svg",
      "milgo.svg", "fasdat-gida.svg", "ekur-gida.svg", "atakey.svg", "reklam-ussu.svg",
    ],
  },
  { ad: "Finans", logolar: ["ata-yatirim.svg", "ata-portfoy.svg", "ata-gyo.svg"] },
  { ad: "Teslimat & E-Ticaret", logolar: ["fiyuu-tikla-gelsin.svg"] },
  { ad: "Moda", logolar: ["donna.svg"] },
  {
    ad: "Teknoloji",
    logolar: ["atp.svg", "atp-tradesoft.svg", "atp-zenia.svg", "atp-digital.svg", "atp-china.svg", "ka.svg"],
  },
  { ad: "Lojistik", logolar: ["fasdat-lojistik.svg"] },
  { ad: "Turizm", logolar: ["arbeta.svg"], metinler: ["İzmir Enternasyonel Otelcilik A.Ş."] },
  { ad: "İnşaat", logolar: ["ata-gayrimenkul.svg", "ekur-insaat.svg", "entegre.svg"] },
  { ad: "Hizmet", logolar: ["seras.svg"] },
  { ad: "Yatırım", logolar: ["atp-capital.svg"] },
];
