export function ddmmyyyy(d: Date): string {
  return d.toLocaleDateString("tr-TR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

// Rolling window caption, e.g. "27.07.2021 - 27.07.2026" — always relative to
// the report's own "as of" date so it updates itself every week.
export function donemAraligi(raporTarihi: Date, yil: number): string {
  const baslangic = new Date(raporTarihi);
  baslangic.setFullYear(baslangic.getFullYear() - yil);
  return `${ddmmyyyy(baslangic)} - ${ddmmyyyy(raporTarihi)}`;
}

// Yılbaşından-beri caption, e.g. "31.12.2025 - 27.07.2026" — anchored to the
// previous year-end (the legacy deck's own YTD baseline), not Jan 1st.
export function yilbasindanBeriAraligi(raporTarihi: Date): string {
  const baslangic = new Date(raporTarihi.getFullYear() - 1, 11, 31);
  return `${ddmmyyyy(baslangic)} - ${ddmmyyyy(raporTarihi)}`;
}
