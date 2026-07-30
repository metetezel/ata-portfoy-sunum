# Shared parsing helpers for reading the live COPY Fon Broşür.xlsx fund
# engine — used by both guncelle_fon_getirileri.py (per-fund detail pages)
# and guncelle_fon_performans_ozet.py ("Ata Fonları: Güçlü Performans" page).
# Kept in one place because this file's layout is fiddly (see comments below)
# and every quirk here was found by testing against the real live data, not
# guessed — fixing a parsing bug in only one of the two callers would be an
# easy way to reintroduce it in the other.
import datetime
import re

# 0-based column index into a row tuple (values_only=True) -> Pencere name.
# Verified precisely against the live sheet — don't re-derive by eyeballing
# a text dump, it's easy to be off by one column.
PENCERE_KOLONU = {
    "Aylik": 8,               # I: "Aylık"
    "3 Aylik": 9,             # J: "3 Aylık"
    "6 Aylik": 10,            # K: "6 Aylık"
    "Yillik": 11,             # L: "12 Aylık"
    "Yilbasindan Beri": 12,   # M: "Yılbaşından Beri"
}

TURKCE_AYLAR = {
    "Ocak": 1, "Şubat": 2, "Mart": 3, "Nisan": 4, "Mayıs": 5, "Haziran": 6,
    "Temmuz": 7, "Ağustos": 8, "Eylül": 9, "Ekim": 10, "Kasım": 11, "Aralık": 12,
}


def hata_hucresi_mi(v):
    return isinstance(v, str) and v.startswith("#")


def yuzdeye_cevir(v):
    # None handles genuinely-empty cells; the isinstance check catches both
    # real errors (#REF!, #DIV/0!) and the literal "-" placeholder Rasyonet
    # uses for "fund too new, no history for this window yet" (e.g. PKP,
    # launched Jan 2026) — both mean "no data", not "zero".
    if v is None or hata_hucresi_mi(v) or not isinstance(v, (int, float)):
        return None
    return round(v * 100, 1)


def rapor_tarihini_oku(ws):
    # Row 3 carries a title like "Salı 28 Temmuz 2026" — trust the source's
    # own stated date rather than recomputing today/T-1/T-3 ourselves.
    for row in ws.iter_rows(min_row=1, max_row=6, values_only=True):
        for v in row:
            if isinstance(v, str):
                m = re.search(r"(\d{1,2})\s+(\w+)\s+(\d{4})", v)
                if m and m.group(2) in TURKCE_AYLAR:
                    gun, ay_adi, yil = m.groups()
                    return datetime.date(int(yil), TURKCE_AYLAR[ay_adi], int(gun))
    return None


def kisa_sayfasini_ayristir(ws, kodlar):
    """Returns {fon_kodu: {pencere: (fon_yuzde, benchmark_yuzde)}} for every
    code in `kodlar` found in the sheet. `kodlar` lets each caller ask for a
    different set (Fon_Katalog's 14 vs. the broader Güçlü Performans list —
    e.g. UANZ isn't in Fon_Katalog but is needed there)."""
    sonuc = {}
    rows = list(ws.iter_rows(min_row=10, max_row=ws.max_row, values_only=True))
    for i, row in enumerate(rows):
        kod = row[2]
        if not isinstance(kod, str):
            continue
        # Usually a bare code ("AAL"); the Eurobond funds instead read
        # "Eurobond - ANZ" / "Eurobond - UANZ" — take the last whitespace
        # token so both forms match.
        aday = kod.strip().split()[-1] if kod.strip() else ""
        if aday not in kodlar:
            continue
        fon_kodu = aday
        # The benchmark row is usually right below the fund row, but not
        # always — AYA has an extra in-between row ("Temettüler Dahil") first
        # — scan a couple of rows ahead, stop early if we hit another fund's
        # block so we never borrow a neighboring fund's benchmark.
        bench_row = None
        for j in range(i + 1, min(i + 3, len(rows))):
            sonraki = rows[j]
            sonraki_kod = sonraki[2]
            if isinstance(sonraki_kod, str) and sonraki_kod.strip().split()[-1] in kodlar:
                break
            sonraki_etiket = sonraki[1]
            if isinstance(sonraki_etiket, str) and sonraki_etiket.startswith("Benchmark"):
                bench_row = sonraki
                break
        pencereler = {}
        for pencere, col in PENCERE_KOLONU.items():
            fon_v = yuzdeye_cevir(row[col])
            bench_v = yuzdeye_cevir(bench_row[col]) if bench_row else None
            pencereler[pencere] = (fon_v, bench_v)
        sonuc[fon_kodu] = pencereler
    return sonuc


def temettu_dahil_yillik_oku(ws, fon_kodu):
    """Some funds (currently just AYA) carry an extra dividend-inclusive
    return row directly under their own fund row, labeled "Temettüler
    Dahil" — returns its Yillik (12 Aylık) value, or None if that fund has
    no such row."""
    rows = list(ws.iter_rows(min_row=10, max_row=ws.max_row, values_only=True))
    for i, row in enumerate(rows):
        kod = row[2]
        if isinstance(kod, str) and kod.strip().split()[-1] == fon_kodu:
            if i + 1 < len(rows):
                sonraki_etiket = rows[i + 1][1]
                if isinstance(sonraki_etiket, str) and "Temettü" in sonraki_etiket:
                    return yuzdeye_cevir(rows[i + 1][PENCERE_KOLONU["Yillik"]])
    return None


def formul_katilim100_getirisi_oku(formul_ws):
    """TLZ's real benchmark (Fon_Katalog: "BIST Katılım 100 Getiri (XK100)")
    has the exact same mislabeling bug as AYA's did — ATA FON PERFORMANS
    (Kısa)'s adjacent "Benchmark" row for TLZ is actually BIST100's figures,
    and unlike AYA's case, the real Katılım 100 return isn't in that sheet's
    standalone "Piyasa Benchmarkları" table at all (checked — not present).
    It lives instead in the separate 'Formül' sheet (found via a whole-sheet
    text search for "Katılım"/"XK100"): row 62 of column 46 ("AT") is
    labeled 'BIST Katılım 100 Getiri', with rows 63-69 in the SAME column
    holding Günlük/Haftalık/Aylık/3 aylık/6 aylık/Yıllık/YTD values and their
    Turkish window labels one column over (47/"AU"). Verified against the
    legacy deck's real TLZ page figures — all 5 windows within ~1-3 points,
    consistent with ordinary as-of-date drift, not a wrong series.
    Returns {pencere: yuzde} using this project's Pencere naming."""
    DEGER_KOLON = 45  # 0-indexed tuple position = Excel column 46 ("AT")
    ETIKET_KOLON = 46  # Excel column 47 ("AU")
    ETIKET_PENCERE = {
        "Aylık": "Aylik",
        "3 aylık": "3 Aylik",
        "6 aylık": "6 Aylik",
        "Yıllık": "Yillik",
        "YTD": "Yilbasindan Beri",
    }
    sonuc = {}
    for row in formul_ws.iter_rows(min_row=63, max_row=70, values_only=True):
        etiket = row[ETIKET_KOLON] if ETIKET_KOLON < len(row) else None
        deger = row[DEGER_KOLON] if DEGER_KOLON < len(row) else None
        if etiket in ETIKET_PENCERE and isinstance(deger, (int, float)):
            sonuc[ETIKET_PENCERE[etiket]] = round(deger * 100, 1)
    return sonuc


def _tokenize(ad):
    return {t.strip("*").strip() for t in re.split(r"\s+", ad.strip()) if t.strip("*").strip()}


# The sheet's own "Piyasa Benchmarkları" standalone index/macro table doesn't
# use fund codes at all, just free-text names — some inconsistently phrased
# vs. what we display (e.g. actual row name is "BIST 25 Temettü Getiri
# Endeksi", not "BIST Temettü 25..."). Matched by required-token-subset
# (order-independent) rather than exact string, except the two unambiguous
# single-token names (exact match is simpler and safer than tokenizing "/").
STANDALONE_HEDEFLER = {
    "BIST 100 Getiri Endeksi": {"tokens": {"BIST", "100", "Getiri", "Endeksi"}},
    "BIST Temettü 25 Getiri Endeksi": {"tokens": {"BIST", "25", "Temettü", "Getiri", "Endeksi"}},
    # Requires "TL" specifically so this doesn't also match "KYD USD Mevduat".
    "KYD Mevduat Endeksi": {"tokens": {"KYD", "TL", "Mevduat"}},
    # ANZ's own adjacent "Benchmark***" row in kisa_sayfasini_ayristir isn't
    # wrong exactly, but it's a DIFFERENT real benchmark than what
    # Fon_Katalog states and the legacy deck displays — footnoted there as
    # "ANZ Benchmark: KYD 1 Aylık USD Mevduat (TL)" (TL-denominated, so it
    # includes USD/TL currency appreciation on top of the deposit rate,
    # hence a much bigger number) — not this plain USD-denominated
    # "KYD USD Mevduat" row. Override with this one for ANZ specifically.
    "KYD USD Mevduat": {"tokens": {"KYD", "USD", "Mevduat"}},
    "USD/TL": {"exact": "USD/TL"},
    "TÜFE": {"exact": "TÜFE"},
    # YLC's two composite-benchmark ingredients (needed as Fon_Performans_Ek_
    # Kriter columns "NQXAUAGR"/"XGIDA", 2026-07-29) — the sheet's own row
    # names don't match the ticker-style short names used in the legacy
    # table headers, so these are matched by name here and displayed under
    # their short ticker name by the caller.
    "Nasdaq Agriculture Ex Australia": {"tokens": {"Nasdaq", "Agriculture", "Australia"}},
    "BIST Tarım Gıda Endeksi": {"tokens": {"BIST", "Tarım", "Gıda"}},
    # RTG's two composite-benchmark ingredients ("NQROBO"/"XBLSM").
    "Nasdaq CTA Artificial Intelligence & Robotics": {"tokens": {"Nasdaq", "CTA", "Artificial", "Intelligence", "Robotics"}},
    "BIST Bilişim Getiri": {"tokens": {"BIST", "Bilişim", "Getiri"}},
}


def piyasa_benchmarklarini_tum_pencereler_oku(ws):
    """Same 'Piyasa Benchmarkları' parse as piyasa_benchmarklarini_oku, but
    returns every window at once: {hedef_ad: {pencere: yuzde}}. Added so a
    caller can pull a single standalone benchmark's full row of windows (see
    guncelle_fon_getirileri.py's AYA fix) without re-parsing the sheet once
    per window."""
    rows = list(ws.iter_rows(min_row=1, max_row=ws.max_row, values_only=True))
    baslangic = None
    for i, row in enumerate(rows):
        if isinstance(row[1], str) and "Piyasa Benchmarkları" in row[1]:
            baslangic = i + 1
            break
    if baslangic is None:
        return {}
    sonuc = {}
    for row in rows[baslangic:baslangic + 40]:
        ad = row[1]
        if not isinstance(ad, str) or not ad.strip():
            continue
        ad_tokens = _tokenize(ad)
        for hedef_ad, kural in STANDALONE_HEDEFLER.items():
            if hedef_ad in sonuc:
                continue
            eslesti = (ad.strip() == kural["exact"]) if "exact" in kural else kural["tokens"] <= ad_tokens
            if eslesti:
                sonuc[hedef_ad] = {p: yuzdeye_cevir(row[c]) for p, c in PENCERE_KOLONU.items()}
    return sonuc


def kurulustan_beri_hesapla(ws, deger_pos, baslangic_tarihi=None, yil_sayisi=None, tarih_pos=1):
    """Computes a single cumulative % change to the raw series' "son gerçek
    tarih", from one of three possible starting points (checked in this
    order): `yil_sayisi` years before "son" (for rolling "3 Yıl"/"5 Yıl"
    windows — first used for AAV, 2026-07-29), else `baslangic_tarihi` (for
    a fund/benchmark's real inception date — "Kuruluştan Beri", first used
    for AYA), else the series' own earliest date. Computed live from the raw
    daily Price/Bench series instead of a one-off manual entry that
    guncelle_fon_getirileri.py had been preserving unchanged on every run.
    Validated for AYA's Kuruluştan Beri: reproduces the existing manually-
    computed figures (fund +4554.8%, benchmark +4994.2%) exactly. NOTE: for
    AAV's 3 Yıl/5 Yıl specifically, this does NOT closely match the current
    manual figures (off by 5-17%, much more than the <1% drift seen
    everywhere else) — automated anyway per Mete's explicit call
    (2026-07-29) after the gap was flagged, not because it validated."""
    seri = {}
    bugun = datetime.date.today()
    for row in ws.iter_rows(values_only=True):
        t = row[tarih_pos]
        v = row[deger_pos] if deger_pos < len(row) else None
        if isinstance(t, datetime.datetime) and isinstance(v, (int, float)):
            if t.date() <= bugun:
                seri[t.date()] = float(v)
    if not seri:
        return None
    tarihler = sorted(seri)
    son = tarihler[-1]
    for i in range(len(tarihler) - 1, 0, -1):
        if seri[tarihler[i]] != seri[tarihler[i - 1]]:
            son = tarihler[i]
            break
    if yil_sayisi is not None:
        hedef = son - datetime.timedelta(days=365 * yil_sayisi)
        adaylar = [d for d in tarihler if d <= hedef]
        baz_tarihi = adaylar[-1] if adaylar else tarihler[0]
    elif baslangic_tarihi is not None:
        adaylar = [d for d in tarihler if d <= baslangic_tarihi]
        baz_tarihi = adaylar[-1] if adaylar else tarihler[0]
    else:
        baz_tarihi = tarihler[0]
    return round((seri[son] / seri[baz_tarihi] - 1) * 100, 1)


def piyasa_benchmarklarini_oku(ws, pencere="Yillik"):
    """Parses the 'Piyasa Benchmarkları' section (a flat name->value table,
    no fund codes) and returns {hedef_ad: yuzde} (for the given `pencere` —
    "Yillik" or "Yilbasindan Beri") for whichever of STANDALONE_HEDEFLER it
    finds. Row-number-independent by design — the equivalent lookup in the
    legacy Sunum.xlsx hardcodes an absolute row number for this table and
    it's already been caught drifting (BIST 100 Getiri Endeksi pointed at
    plain "BIST 100" one row up) after the source sheet gained a row at some
    point; matching by name instead avoids that whole class of bug."""
    tum = piyasa_benchmarklarini_tum_pencereler_oku(ws)
    return {hedef_ad: pencereler.get(pencere) for hedef_ad, pencereler in tum.items()}


def gunluk_seriden_pencereler_hesapla(ws, deger_pos, tarih_pos=1):
    """Computes the standard 5-window trailing % returns (Aylik/3 Aylik/
    6 Aylik/Yillik/Yilbasindan Beri) directly from a raw daily {date: value}
    column — for a comparison series that only exists as a raw daily feed
    in e.g. the Bench sheet's unlabeled columns, not precomputed in the
    'Piyasa Benchmarkları' standalone table the way BIST 100/USD-TL/etc.
    are (found needed for DGH's "KYD ÖST Değişken" column, 2026-07-29).
    Uses calendar-day lookback windows (30/91/182/365 days, YTD from Jan 1)
    rather than the exact trading-day convention the standalone table uses
    internally — validated against known-good figures to within ~1pp, close
    enough for a supplementary comparison column (the fund's own return and
    its PRIMARY benchmark always come from the precise precomputed sheet
    figures, never this approximation)."""
    seri = {}
    bugun = datetime.date.today()
    for row in ws.iter_rows(values_only=True):
        t = row[tarih_pos]
        v = row[deger_pos] if deger_pos < len(row) else None
        if isinstance(t, datetime.datetime) and isinstance(v, (int, float)):
            if t.date() <= bugun:
                seri[t.date()] = float(v)
    if not seri:
        return {}
    tarihler = sorted(seri)
    son = tarihler[-1]
    for i in range(len(tarihler) - 1, 0, -1):
        if seri[tarihler[i]] != seri[tarihler[i - 1]]:
            son = tarihler[i]
            break

    def degisim(gun_sayisi=None, yilbasindan=False):
        hedef = datetime.date(son.year, 1, 1) if yilbasindan else son - datetime.timedelta(days=gun_sayisi)
        adaylar = [d for d in tarihler if d <= hedef]
        if not adaylar:
            return None
        return round((seri[son] / seri[adaylar[-1]] - 1) * 100, 2)

    return {
        "Aylik": degisim(30),
        "3 Aylik": degisim(91),
        "6 Aylik": degisim(182),
        "Yillik": degisim(365),
        "Yilbasindan Beri": degisim(yilbasindan=True),
    }
