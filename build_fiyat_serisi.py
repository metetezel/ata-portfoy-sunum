# Builds web/data/{kod}_price_series.json — the historical fund-vs-benchmark
# price series that FonFiyatGrafigi.tsx renders. Deliberately a Python script
# (not part of the Node app) since it does one-off spreadsheet archaeology
# across two different legacy workbooks per fund; run it once per fund when
# building that fund's page, not on every deploy.
#
# Each fund's raw daily series lives in a different place depending on which
# legacy sheet happens to track it — there's no single consistent source.
# FON_KAYNAK below records exactly where each fund's own price and its
# benchmark's price were found, so re-deriving this isn't needed next time.
import datetime
import json
import os
import time

import openpyxl
import requests

FON_BROSUR_YOLU = os.environ.get(
    "FON_BROSUR_YOLU",
    r"\\atafiles\Ata.Portföy\Farshad\Fonlar\COPY Fon Broşür.xlsx",
)
# Sunum.xlsx artık okunmuyor — 2026-07-30'da disa_bagimliliklari_dondur.py ile
# ANZ'nin ihtiyaç duyduğu tek parça (Eurobond sayfasının 2021-08 öncesi kısmı,
# donuk tarihi veri) sabit_kaynaklar/anz_eurobond_gecmis.json'a taşındı —
# Sunum.xlsx artık projeden silinebilir.
SABIT_KAYNAKLAR_KLASORU = os.path.join(os.path.dirname(__file__), "sabit_kaynaklar")
# Z:'deki proje kopyasına göre göreli — sürücü harfi (Z: ev PC'de, farklı/hiç
# olmayabilir ofis PC'sinde) yerine \\atafiles UNC paylaşımına dayanan aynı
# mantık (bkz. ata-portfoy-web/lib/veriKaynagi.ts). Web app'in kendi çalışma
# kopyası artık her oturumda buradan yerel diske tazelendiği için çıktı
# doğrudan buraya, tek kaynağa yazılmalı.
CIKTI_KLASORU = os.path.join(os.path.dirname(__file__), "ata-portfoy-web", "data")

TEFAS_HEADERS = {
    "Content-Type": "application/json",
    "Accept": "*/*",
    "Origin": "https://www.tefas.gov.tr",
    "Referer": "https://www.tefas.gov.tr/tr/fon-verileri",
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
}


TEFAS_ONBELLEK_KLASORU = os.path.join(os.path.dirname(__file__), "tefas_onbellek")


def tefas_fiyat_serisi_oku(fon_kodu, baslangic):
    # TEFAS'ın (Türkiye'nin resmi fon alım-satım platformu) kendi
    # fonGnlBlgSiraliGetir uç noktası — fonun GERÇEK, resmi NAV/fiyat
    # serisini doğrudan TEFAS'tan çekiyor. dagilimSiraliGetirT'nin aksine
    # (bkz. guncelle_fon_portfoy_dagilimi.py) bu uç nokta GERÇEKTEN tarih
    # aralığı destekliyor — ama sunucu tarafında sert bir sınır var: "Tarih
    # aralığı 1 ayı aşamaz". Bu yüzden ay ay parçalı çekiliyor.
    #
    # ANZ için bulundu (2026-07-30, Mete'nin "daha iyi bir kaynak bulunursa
    # değiştir" notu üzerine): önceki en iyi kaynak (Sunum.xlsx!Eurobond)
    # doğru ölçekteydi ama kendi trailing-12-ay getirisi (+%5,2) doğrulanmış
    # +%23,6 Yıllık rakamıyla hiç uyuşmuyordu. Bu TEFAS serisi (fiyat alanı)
    # neredeyse birebir eşleşiyor (+%22,8 hesaplanan vs +%23,6 doğrulanmış —
    # normal canlı-veri toleransı) — ilk kez gerçekten doğru bir kaynak.
    # ANZ "Döviz" (USD) fonu olduğu için TEFAS'ın "fiyat" alanı zaten USD
    # bazında (TL'ye çevrilmiş değil) — 100→2145 gibi bir "hokey sopası"
    # yok, aksine legacy'nin beklediği ~100→135 ölçeğiyle uyumlu.
    #
    # 2026-07-30: önbellek eklendi (Mete'nin "ANZ için 11dk çok uzun" notu
    # üzerine). Eskiden her çalıştırmada baslangic'tan (2021-08-01) bugüne
    # TÜM aylar (~60 istek × 11sn ≈ 11dk) yeniden çekiliyordu — geçen
    # haftaki aylar hiç değişmemiş olsa bile. Şimdi önceki çalıştırmanın
    # sonucu tefas_onbellek/{kod}.json'a kaydediliyor; sonraki
    # çalıştırmalarda sadece önbellekteki son ayın BİR ÖNCESİNDEN bugüne
    # kadar yeniden çekiliyor (geç gelen/düzeltilen veriye karşı 1 aylık
    # güvenlik payıyla), geri kalanı diskten okunuyor. İlk çalıştırma
    # (önbellek boşken) hâlâ ~11dk sürer; sonraki her hafta sadece 1-2 ay
    # (~20-30sn) çekiyor.
    os.makedirs(TEFAS_ONBELLEK_KLASORU, exist_ok=True)
    onbellek_yolu = os.path.join(TEFAS_ONBELLEK_KLASORU, f"{fon_kodu.lower()}.json")
    onbellek = {}
    if os.path.exists(onbellek_yolu):
        with open(onbellek_yolu, encoding="utf-8") as f:
            onbellek = {datetime.date.fromisoformat(t): float(v) for t, v in json.load(f).items()}

    bugun = datetime.date.today()
    if onbellek:
        son_onbellek_ay_basi = max(onbellek).replace(day=1)
        bir_onceki_ay_basi = (son_onbellek_ay_basi - datetime.timedelta(days=1)).replace(day=1)
        ay_basi = max(bir_onceki_ay_basi, baslangic.replace(day=1))
        print(f"  TEFAS önbelleği bulundu ({len(onbellek)} gün, son ay {son_onbellek_ay_basi}) — {ay_basi} itibariyle yeniden çekiliyor.")
    else:
        ay_basi = baslangic.replace(day=1)

    seri = dict(onbellek)
    while ay_basi <= bugun:
        sonraki_ay = datetime.date(ay_basi.year + 1, 1, 1) if ay_basi.month == 12 else ay_basi.replace(month=ay_basi.month + 1)
        ay_sonu = min(sonraki_ay - datetime.timedelta(days=1), bugun)
        body = {
            "fonTipi": "YAT", "fonKodu": fon_kodu, "aramaMetni": None, "fonTurKod": None,
            "fonGrubu": None, "sfonTurKod": None, "fonTurAciklama": None, "kurucuKod": None,
            "basTarih": ay_basi.strftime("%Y%m%d"), "bitTarih": ay_sonu.strftime("%Y%m%d"),
            "basSira": 1, "bitSira": 100, "dil": "TR",
            "sFonTurKod": "", "fonKod": "", "fonGrup": "", "fonUnvanTip": "",
        }
        for deneme in range(4):
            r = requests.post("https://www.tefas.gov.tr/api/funds/fonGnlBlgSiraliGetir", headers=TEFAS_HEADERS, json=body, timeout=30)
            if r.status_code == 429:
                bekleme = 20 * (deneme + 1)
                print(f"  429 (rate limit) — {bekleme}sn bekleniyor, tekrar denenecek...")
                time.sleep(bekleme)
                continue
            r.raise_for_status()
            break
        else:
            raise RuntimeError(f"TEFAS API tekrarlanan 429 hatası ({ay_basi}-{ay_sonu}), pes edildi.")
        veri = r.json()
        if veri.get("errorMessage"):
            raise RuntimeError(f"TEFAS API hatası ({ay_basi}-{ay_sonu}): {veri['errorMessage']}")
        for row in veri.get("resultList") or []:
            fiyat = row.get("fiyat")
            if fiyat is None:
                continue
            seri[datetime.date.fromisoformat(row["tarih"])] = float(fiyat)
        ay_basi = sonraki_ay
        # TEFAS'ın belgelenmemiş bir hız sınırı var (~6 istek/dakika, canlı
        # test sırasında 429 ile bulundu) — dakikada 6'nın altında kalacak
        # şekilde 11sn bekleniyor.
        time.sleep(11)

    with open(onbellek_yolu, "w", encoding="utf-8") as f:
        json.dump({d.isoformat(): v for d, v in seri.items()}, f, ensure_ascii=False)
    return seri

# col indices are 0-based positions within an openpyxl values_only row tuple
# (position 0 = column A). Found by locating each fund's "FON KODU"/header
# label in the source sheet directly, not by eyeballing.
#
# AYA: fund side is COPY Fon Broşür.xlsx's "Price" sheet, column H (position
# 7) — found via the sheet's own "FON KODU" header row (AYA:TMF sits at that
# position). Benchmark side is the SAME workbook's "Bench" sheet, column 38 —
# that column has no header label in the sheet's labeled row (only ~11 of
# 112 Bench columns are labeled at all) but carries a stray text note
# ('BIST 25 TEMETTU') buried at row 3782, and its data starts exactly on
# 2011-07-01 at 630.1478 — identical to the value found independently in
# Sunum.xlsx's "1.Hisse" sheet's own (differently-derived) Temettü 25 column,
# cross-validating both. Final proof: the trailing-12-month change computed
# from this exact pair (fund +22.25%, benchmark +31.57%) closely matches the
# verified-correct Fon_Performans Yıllık figures (+21.5% / +32.8%) — the
# check that TWO earlier candidate sources (Sunum.xlsx "1.Hisse" second
# block, and an earlier off-by-one misread of that same sheet) both failed.
# Don't reuse either of those — this Price/Bench pairing is the one that
# actually passed verification.
# "kendi_baz_tarihi": the date each fund's OWN line should be rebased to 100
# from — matches the legacy deck's own convention of indexing the fund from
# its true start (e.g. "Haziran 2010=100") independently of when its
# benchmark index started being calculated. AYA's fund side has real Price
# data back to 2001, but multiple independent analysis sheets (Sunum.xlsx's
# "1.Hisse" and "AYA AAV Gross") agree 2010-06-17 is the meaningful
# comparison start (matches those sheets' own "Kuruluş"/"Başlangıç Tarihi").
FON_KAYNAK = {
    # AAV: found 2026-07-29 — this fund had been missing from FON_KAYNAK
    # entirely (its price_series.json was built by a one-off, now-lost
    # script in an earlier session, flagged as an open risk in the audit
    # artifact). Fund side: Price sheet column 14 (0-indexed, "AAV:TMF" FON
    # KODU header at row 11/12) — its data starts EXACTLY 2012-11-16 at
    # 1.0, matching Fon_Getiri_Analizi_Detay's own Kurulus_Tarihi for AAV
    # to the day, and rebasing to 100 reproduces the existing (previously
    # undocumented) JSON's second point (107.93 at 2012-12-06) exactly —
    # about as strong a confirmation as this project has found for any
    # fund. Benchmark: Bench column 24, the SAME "BIST100 Getiri" column
    # already validated for AED (AAV's own Benchmark_Kisa_Ad is "BIST 100",
    # the identical index). Cross-checked independently: this pairing's
    # trailing Aylık change (fon -2.2%, benchmark -4.1%) matches
    # Fon_Performans's live validated Aylık figures for AAV EXACTLY, and
    # Yıllık (fon +18.5%, benchmark +32.1%) is within ~0.6pp of the
    # validated +17.9%/+31.5% — normal live-data drift, same tolerance
    # already accepted for PKF/JET/URA's benchmark validations.
    "AAV": {
        "fon": {"kitap": "brosur", "sayfa": "Price", "tarih_pos": 1, "deger_pos": 14},
        "benchmark": {"kitap": "brosur", "sayfa": "Bench", "tarih_pos": 1, "deger_pos": 24},
        "kendi_baz_tarihi": "2012-11-16",
    },
    "AYA": {
        "fon": {"kitap": "brosur", "sayfa": "Price", "tarih_pos": 1, "deger_pos": 7},
        "benchmark": {"kitap": "brosur", "sayfa": "Bench", "tarih_pos": 1, "deger_pos": 38},
        "kendi_baz_tarihi": "2010-06-17",
    },
    # TLZ: fund side is Price column W (position 22, found via the "FON KODU"
    # header row, "TLZ:TMF"). Benchmark (BIST Katılım 100 / XK100) found via
    # a whole-Bench-sheet text search for "XK100"/"Katılım" — a stray label
    # 'Getiri_XK100:IS' turned up at row 3782 (the SAME row that held AYA's
    # 'BIST 25 TEMETTU' stray label — this sheet seems to keep a one-off
    # annotation row for otherwise-unlabeled columns around there), column 60.
    # TLZ's Price column has real data back to 2019, but the legacy deck's
    # own chart for this fund starts at Nisan 2025 and never shows a
    # "Kuruluştan Beri" figure at all (unlike AAV/AYA) — strong signs the
    # current Katılım-fund identity is newer and the pre-2025 history
    # belongs to a earlier, unrelated use of the same ticker slot. Matched
    # the legacy chart's own start rather than the fund's full raw history.
    "TLZ": {
        "fon": {"kitap": "brosur", "sayfa": "Price", "tarih_pos": 1, "deger_pos": 22},
        "benchmark": {"kitap": "brosur", "sayfa": "Bench", "tarih_pos": 1, "deger_pos": 60},
        "kendi_baz_tarihi": "2025-04-01",
    },
    # ANZ: Price column V (position 21, "ANZ:TMF") is TL-denominated — it
    # produces a 100→2145 "hockey stick" (TL depreciation, not fund
    # performance) that doesn't match the legacy chart's modest 100→~135
    # shape. ANZ quotes NAV in both TL and USD (per its own description), so
    # the legacy chart is the USD line. A "ANZ USD" column exists at Price
    # position 34 — RE-CHECKED 2026-07-29 (per Mete's ask to maximize
    # Broşür usage, this is no longer dead/all-zero like it was originally):
    # it's alive now (real values ~0.45, updating daily), but its trailing
    # return reproduces the SAME known mismatch as the Sunum.xlsx Eurobond
    # workaround below almost exactly (Yıllık +5.2% vs the verified +23.6%)
    # — i.e. this is not an independent, better source, it's evidence the
    # underlying NAV-ratio calculation itself runs on a different basis
    # than whatever Rasyonet's own Fon_Performans return figure uses (see
    # the caveat below), not a data-quality problem specific to Sunum.xlsx.
    # Don't re-try this column expecting a different result. "UANZ" only
    # appears as precomputed return percentages in ATA FON PERFORMANS
    # (Kısa), never as a raw series — still no usable, validating USD line
    # anywhere in COPY Fon Broşür.xlsx.
    # Found instead in Sunum.xlsx's "Eurobond" sheet, column H (position 7,
    # header 'Ata Eurobond Fonu', already indexed ≈100 at its own start) —
    # this is the legacy deck's own workbook, and the sheet's start date
    # (2016-05-13) matches the fund's real inception exactly. It's genuinely
    # live (272 distinct values across the last ~324 trading days, not
    # frozen) and lands at the right visual scale (133.6, matching the "~135"
    # expected from the legacy chart). CAVEAT (flagged to and accepted by
    # Mete 2026-07-29): this column's own trailing return doesn't match —
    # its implied trailing-12-month change is only +5.2% and calendar-2025
    # is +8.3%, versus the verified +23.6% Yıllık figure that already
    # matches the legacy PDF's return table. Possibly a different return
    # basis (e.g. accrual/coupon-only, excluding 2025's eurobond
    # price-appreciation gains) rather than wrong data outright. Used anyway
    # per Mete's explicit approval — no better live USD source found after
    # checking Price/Bench (COPY Fon Broşür.xlsx) and Eurobond/Formül
    # (Sunum.xlsx). The sheet's own paired "KYD USD Mevduat" benchmark
    # column (col8) is NOT used — it's been frozen at 107.7 since
    # 2019-07-31 — so the benchmark side still comes from the already-
    # validated live Bench-sheet column instead.
    # 2026-07-30: fon tarafı hibrit hale getirildi — Sunum.xlsx!Eurobond
    # (2016-05-13'ten TEFAS'ın sınırına kadar) + TEFAS'ın kendi resmi
    # fonGnlBlgSiraliGetir uç noktası (son 5 yıl, TEFAS'ın kendi sunucu
    # sınırı: "Başlangıç Tarihi 5 yıldan eski olamaz" — tam geçmişi TEFAS'tan
    # tek seferde çekmek mümkün değil). Bkz. tefas_fiyat_serisi_oku()
    # docstring'i — TEFAS tarafı eski kaynağın bilinen getiri-uyuşmazlığı
    # sorununu çözdü (+%22,8 hesaplanan vs +%23,6 doğrulanmış, eskiden +%5,2
    # idi). Kalibrasyon noktasında (TEFAS'ın ilk gerçek döndürdüğü tarih)
    # sıçrama olmaması için TEFAS serisi eski serinin o tarihteki değerine
    # ölçekleniyor (bu projede Sayfa 25/27'de zaten kullanılan aynı hibrit
    # kalibrasyon deseni).
    "ANZ": {
        "fon": {
            "kitap": "hibrit_tefas",
            # 2026-07-30: Sunum.xlsx!Eurobond'dan sabit_kaynaklar/anz_eurobond_gecmis.json'a
            # taşındı (bkz. disa_bagimliliklari_dondur.py) — Sunum.xlsx artık gerekmiyor.
            "eski": {"kitap": "sabit_json", "dosya": "anz_eurobond_gecmis.json"},
            "fon_kodu": "ANZ",
            "tefas_baslangic": "2021-08-01",
        },
        "benchmark": {"kitap": "brosur", "sayfa": "Bench", "tarih_pos": 1, "deger_pos": 25},
        "kendi_baz_tarihi": "2016-05-13",
    },
    # PKP: brand-new fund (launched 2026-01-14), has no benchmark at all —
    # the legacy deck's own chart for it is a single line, no comparison
    # index (matches Fon_Katalog's blank Benchmark_Aciklama/Kisa_Ad).
    # UPGRADED 2026-07-29 from Sunum.xlsx's static per-fund "PKP" sheet to
    # COPY Fon Broşür.xlsx's own live Price column 3 ("PKP:THF" FON KODU
    # header) — at the time PKP's page was first built, this fund was too
    # new (launched mid-Jan 2026) for Broşür's feed to have caught up, so
    # the one-off Sunum.xlsx sheet was the only option; six months later
    # Broşür now carries it too, matching Mete's ask (2026-07-29) to connect
    # every fund to the live Broşür feed wherever possible instead of a
    # static workbook. This column ticker slot has real data back to 1996 —
    # clearly an unrelated earlier fund reusing the same code (same pattern
    # as TLZ) — so it's rebased from PKP's own actual first live value,
    # 2026-01-15 (one day after the fund's inception, its first non-blank
    # row), not the ticker's full raw history. Validated: trailing Aylık/3
    # Aylık/6 Aylık (+3.35/+10.29/+20.91) match Fon_Performans's live
    # validated figures (+3.3/+10.5/+21.5) within normal drift tolerance.
    # No "benchmark" key at all — build() below skips the benchmark side
    # entirely and every point's "benchmark" comes out None.
    "PKP": {
        "fon": {"kitap": "brosur", "sayfa": "Price", "tarih_pos": 1, "deger_pos": 3},
        "kendi_baz_tarihi": "2026-01-15",
    },
    # AED: the first fund needing TWO comparison lines at once (matches its
    # legacy chart's own "ATA Birinci Değişken Fon / BIST-100 Getiri Endeksi
    # / KYD Mevduat Endeksi" 3-line legend, and its return table's 3-way
    # BIST-100 Getiri / USD / TL Mevduat comparison — the "USD" column comes
    # from the standalone USD/TL benchmark instead, no raw price series
    # needed for that one since it's just a currency pair, not a fund/index
    # with its own chart line).
    # Fund: Price column L (position 11, "AED:TMF" FON KODU header). Both
    # comparison series found via the same row-3782 stray-label search that
    # resolved AYA/TLZ/ANZ: "BIST100 Getiri" at Bench column 24, "KYD
    # Mevduat" at column 19 (this is the same series as the standalone
    # "KYD Mevduat Endeksi"/"KYD TL Mevduat" table already used for the
    # return table's "TL Mevduat" column — confirmed via 1-year trailing
    # change matching within ~1pp of the standalone table's own figure).
    # Sunum.xlsx has its own dedicated "AED" sheet with exactly these three
    # columns pre-indexed to 100, which would have been the ideal source —
    # but it died in 2024-11 (20 months stale), so this uses the live
    # Price/Bench pairing instead, same as every other fund built this way.
    "AED": {
        "fon": {"kitap": "brosur", "sayfa": "Price", "tarih_pos": 1, "deger_pos": 11},
        "benchmark": {"kitap": "brosur", "sayfa": "Bench", "tarih_pos": 1, "deger_pos": 24},
        "benchmark2": {"kitap": "brosur", "sayfa": "Bench", "tarih_pos": 1, "deger_pos": 19},
    },
    # AAS: benchmarkless (single "Fon" line, like PKP) — legacy table/chart
    # both show just AAS itself. Fund found via Price sheet's own "AAS:TMF"
    # FON KODU header, column M (position 12).
    "AAS": {
        "fon": {"kitap": "brosur", "sayfa": "Price", "tarih_pos": 1, "deger_pos": 12},
    },
    # YLC: legacy chart is Fon vs a single blended "Benchmark" line (65%
    # Nasdaq Agriculture Ex-Australia + 35% BIST Tarım Gıda) — unlike RTG/
    # JET/URA below, a precomputed blend column ALREADY exists in Bench
    # (col 37, "YLC BENCHMARK", found via the row-3782 stray-label search).
    # A second, shorter-history column at col 54 ("YCL BENCHMARK", note the
    # swapped letters) looked like a duplicate at first glance but its
    # trailing-return signature doesn't match at all (32.7% vs the correct
    # ~43% Yıllık) — don't use it, it's a different/stale thing despite the
    # near-identical name.
    "YLC": {
        "fon": {"kitap": "brosur", "sayfa": "Price", "tarih_pos": 1, "deger_pos": 24},
        "benchmark": {"kitap": "brosur", "sayfa": "Bench", "tarih_pos": 1, "deger_pos": 37},
    },
    # RTG: legacy chart is Fon vs a single blended "Benchmark" line (65%
    # Nasdaq CTA AI & Robotics + 35% BIST Bilişim Getiri) — UNLIKE YLC/PKF,
    # no precomputed composite column exists anywhere in Bench for RTG
    # specifically, so the blend is built here from its two raw ingredients
    # (NQROBO col45, GETIRI_XBLSM col46 — both individually validated via
    # trailing-return signature match against the standalone benchmarks
    # table's own figures for those two indices).
    "RTG": {
        "fon": {"kitap": "brosur", "sayfa": "Price", "tarih_pos": 1, "deger_pos": 26},
        "benchmark": {"blend": [
            {"agirlik": 0.65, "kitap": "brosur", "sayfa": "Bench", "tarih_pos": 1, "deger_pos": 45},
            {"agirlik": 0.35, "kitap": "brosur", "sayfa": "Bench", "tarih_pos": 1, "deger_pos": 46},
        ]},
    },
    # JET: precomputed "JET BENCHMARK" column exists (Bench col53) but its
    # trailing-return signature is way off (~69% Yıllık vs the verified
    # ~44% from the adjacent-row/legacy figures) — don't use it, built the
    # blend from its two raw ingredients instead: "Nasdaq US Benchmark
    # Aerospace and Defense" (col52, "NQUSB502010T:USN", validated directly
    # against the standalone table's own figure) and "BIST Teknoloji Ağırlık
    # Sınırlamalı Getiri Endeksi" (col51, "GETIRI_XTKJS:IS" — not in the
    # standalone table to check directly, but solving backwards from the
    # verified overall blend and the Aerospace component's own return
    # implies ~85.6%, matching this column's own ~84.8% almost exactly).
    "JET": {
        "fon": {"kitap": "brosur", "sayfa": "Price", "tarih_pos": 1, "deger_pos": 29},
        "benchmark": {"blend": [
            {"agirlik": 0.65, "kitap": "brosur", "sayfa": "Bench", "tarih_pos": 1, "deger_pos": 52},
            {"agirlik": 0.35, "kitap": "brosur", "sayfa": "Bench", "tarih_pos": 1, "deger_pos": 51},
        ]},
    },
    # URA: same situation as JET — precomputed "URA BENCHMARK" (Bench col58)
    # doesn't validate (~19.5% Yıllık vs the verified ~27-31%), built from
    # raw ingredients instead: "Solactive Global Uranium & Nuclear
    # Components" (col57, "SOLURANT Index", validated directly against the
    # standalone table) and "BIST Elektrik Getiri" (col56, "GETIRI_XELKT:IS",
    # also validated directly).
    "URA": {
        "fon": {"kitap": "brosur", "sayfa": "Price", "tarih_pos": 1, "deger_pos": 30},
        "benchmark": {"blend": [
            {"agirlik": 0.65, "kitap": "brosur", "sayfa": "Bench", "tarih_pos": 1, "deger_pos": 57},
            {"agirlik": 0.35, "kitap": "brosur", "sayfa": "Bench", "tarih_pos": 1, "deger_pos": 56},
        ]},
    },
    # DGH: chart is Fon vs "KYD Mevduat Endeksi" only (the return table's
    # third column, "KYD ÖST Değişken", doesn't appear in the legacy chart
    # at all — matches the return-table-only ek-kriter pattern, no
    # benchmark2 needed here). Fund at Price column T (position 19,
    # "DGH:TMF"), benchmark is the same Bench column 19 ("KYD Mevduat")
    # already used for the return table's primary benchmark.
    "DGH": {
        "fon": {"kitap": "brosur", "sayfa": "Price", "tarih_pos": 1, "deger_pos": 19},
        "benchmark": {"kitap": "brosur", "sayfa": "Bench", "tarih_pos": 1, "deger_pos": 19},
    },
    # PKF: precomputed "PKF BENCHMARK" (Bench col49) validates well against
    # the verified adjacent-row/legacy figures (~42% vs ~39-41% Yıllık,
    # normal live-data drift) — used directly, no manual blend needed.
    "PKF": {
        "fon": {"kitap": "brosur", "sayfa": "Price", "tarih_pos": 1, "deger_pos": 28},
        "benchmark": {"kitap": "brosur", "sayfa": "Bench", "tarih_pos": 1, "deger_pos": 49},
    },
}


def sabit_json_serisi_oku(dosya_adi):
    # disa_bagimliliklari_dondur.py'nin dondurduğu {"YYYY-MM-DD": deger}
    # anlık görüntülerini okur — artık silinmiş/silinecek büyük Excel
    # dosyalarının (Sunum.xlsx vb.) yerine geçen kalıcı, donuk tarihi veri.
    with open(os.path.join(SABIT_KAYNAKLAR_KLASORU, dosya_adi), encoding="utf-8") as f:
        ham = json.load(f)
    return {datetime.date.fromisoformat(t): float(v) for t, v in ham.items()}


def sayfa_serisini_oku(kitap_yolu, sayfa_adi, tarih_pos, deger_pos):
    wb = openpyxl.load_workbook(kitap_yolu, data_only=True, read_only=True)
    ws = wb[sayfa_adi]
    seri = {}
    bugun = datetime.date.today()
    for row in ws.iter_rows(values_only=True):
        tarih = row[tarih_pos]
        deger = row[deger_pos] if deger_pos < len(row) else None
        if not isinstance(tarih, datetime.datetime) or not isinstance(deger, (int, float)):
            continue
        if tarih.date() > bugun:
            continue  # pre-filled future placeholder rows, not real data yet
        seri[tarih.date()] = float(deger)
    wb.close()
    return seri


def son_gercek_tarihi_bul(seri):
    # Source sheets carry forward-filled/frozen values on trailing rows
    # (same value repeated day after day) once the live feed stops updating.
    # Finds the LAST date where the value actually changed from the
    # immediately-preceding date — NOT "the last date whose value differs
    # from the very last row's value" (an earlier version of this function
    # used that check and got it wrong: when the final real push is
    # immediately followed by frozen repeats of that SAME value, as happened
    # for AYA's benchmark column, the old check skipped past the real last
    # update and landed one point too early, silently dropping the most
    # recent real data point from the chart).
    tarihler = sorted(seri.keys())
    for i in range(len(tarihler) - 1, 0, -1):
        if seri[tarihler[i]] != seri[tarihler[i - 1]]:
            return tarihler[i]
    return tarihler[-1]


def ornekle(tarihler, hedef_nokta_sayisi=200):
    # Adaptive, not a fixed "always month-end" rule — a fund with a short
    # total history (e.g. TLZ, ~16 months) would otherwise only get ~16
    # points from month-end sampling, which looks like straight, widely-
    # spaced segments instead of a real daily-ish wiggle (found by Mete
    # comparing against the legacy chart's much busier line). For a long
    # history (AAV/AYA, 15+ years) this still lands close to month-end
    # sampling anyway, so it doesn't regress those.
    if len(tarihler) <= hedef_nokta_sayisi:
        return tarihler
    adim = max(1, len(tarihler) // hedef_nokta_sayisi)
    secilenler = tarihler[::adim]
    if secilenler[-1] != tarihler[-1]:
        secilenler = secilenler + [tarihler[-1]]
    return secilenler


def karsilastirma_hazirla(bench_serisi, fon_tarihleri):
    """Rebases a raw {date: value} comparison series to 100 for an
    apples-to-apples chart against the fund's own line, and returns a
    nearest-previous-value lookup function for it. Factored out of build()
    so a fund needing a SECOND comparison line (e.g. AED: BIST-100 Getiri
    AND KYD Mevduat) can reuse the exact same rebase rule for both instead
    of duplicating it.

    The rebase point is NOT always "the series' own earliest date" — that's
    only right when the series genuinely didn't exist yet before the fund
    started (e.g. AYA's BIST Temettü 25, a real market index with its own
    inception date after AYA's own start). Some comparison series (e.g.
    ANZ's "KYD USD Mevduat", a continuously-computed deposit-rate proxy)
    already have years of data before the fund even launches — rebasing
    from ITS OWN start makes the line open already far above 100 by the
    time the fund's window begins (found 2026-07-29 comparing ANZ's built
    chart against the legacy PDF: benchmark opened at 177 instead of 100).
    Correct convention, matching the legacy deck: if the series has data at
    or before the fund's own rebase date, index it from THAT same date
    instead; only fall back to the series' own earliest date when it truly
    has none yet.
    """
    son = son_gercek_tarihi_bul(bench_serisi)
    gunler_hepsi = sorted(bench_serisi)
    fon_rebase_tarihi = fon_tarihleri[0]
    oncesi_adaylar = [d for d in gunler_hepsi if d <= fon_rebase_tarihi]
    if oncesi_adaylar:
        baslangic = fon_rebase_tarihi
        baz = bench_serisi[oncesi_adaylar[-1]]
    else:
        baslangic = gunler_hepsi[0]
        baz = bench_serisi[baslangic]
    gunler_sirali = sorted(d for d in bench_serisi if baslangic <= d <= son)

    def deger_bul(t):
        # Nearest-previous-value lookup rather than an exact-date match —
        # Price/Bench are separately-fed sheets and don't share an identical
        # trading-day calendar, so an exact match would drop the occasional
        # (or, worse, the very last) sample point to null for no real reason.
        adaylar = [d for d in gunler_sirali if d <= t]
        if not adaylar:
            return None
        return round(bench_serisi[adaylar[-1]] / baz * 100, 4)

    return deger_bul, baslangic


def build(fon_kodu):
    kaynak = FON_KAYNAK[fon_kodu]
    kitaplar = {"brosur": FON_BROSUR_YOLU}

    if kaynak["fon"]["kitap"] == "tefas":
        baslangic = datetime.date.fromisoformat(kaynak["fon"]["tefas_baslangic"])
        fon_serisi = tefas_fiyat_serisi_oku(kaynak["fon"]["fon_kodu"], baslangic)
        print(f"TEFAS'tan {kaynak['fon']['fon_kodu']} için {len(fon_serisi)} gün çekildi.")
    elif kaynak["fon"]["kitap"] == "hibrit_tefas":
        eski = kaynak["fon"]["eski"]
        if eski["kitap"] == "sabit_json":
            eski_serisi = sabit_json_serisi_oku(eski["dosya"])
        else:
            eski_serisi = sayfa_serisini_oku(kitaplar[eski["kitap"]], eski["sayfa"], eski["tarih_pos"], eski["deger_pos"])
        tefas_baslangic = datetime.date.fromisoformat(kaynak["fon"]["tefas_baslangic"])
        tefas_serisi = tefas_fiyat_serisi_oku(kaynak["fon"]["fon_kodu"], tefas_baslangic)
        sinir = min(tefas_serisi)
        eski_gunler = sorted(d for d in eski_serisi if d <= sinir)
        if not eski_gunler:
            raise RuntimeError(f"Eski seri {sinir} sınır tarihinden önce veri içermiyor, kalibrasyon yapılamıyor.")
        kalibrasyon = eski_serisi[eski_gunler[-1]] / tefas_serisi[sinir]
        fon_serisi = {d: v for d, v in eski_serisi.items() if d < sinir}
        for d, v in tefas_serisi.items():
            if d >= sinir:
                fon_serisi[d] = round(v * kalibrasyon, 4)
        print(f"Hibrit ANZ: {sinir} öncesi Sunum.xlsx!Eurobond ({len(eski_gunler)} nokta), sonrası TEFAS ({len(tefas_serisi)} nokta, kalibrasyon çarpanı {kalibrasyon:.4f}).")
    else:
        fon_serisi = sayfa_serisini_oku(
            kitaplar[kaynak["fon"]["kitap"]], kaynak["fon"]["sayfa"],
            kaynak["fon"]["tarih_pos"], kaynak["fon"]["deger_pos"],
        )
    fon_son = son_gercek_tarihi_bul(fon_serisi)
    print(f"Fon serisi son gerçek tarih: {fon_son} ({len(fon_serisi)} gün)")

    # Each line is rebased to 100 independently, from its OWN start — the
    # fund's own line can (and for AYA does) start years before its
    # benchmark index existed, matching the legacy deck's convention of
    # indexing each line from its own true start rather than a shared date.
    fon_baz_tarihi = datetime.date.fromisoformat(kaynak["kendi_baz_tarihi"]) if "kendi_baz_tarihi" in kaynak else min(fon_serisi)
    fon_tarihleri = sorted(t for t in fon_serisi if t >= fon_baz_tarihi and t <= fon_son)
    fon_baz = fon_serisi[fon_tarihleri[0]]
    print(f"Fon rebase noktası: {fon_tarihleri[0]}")
    ornekleme_tarihleri = ornekle(fon_tarihleri)

    # Some funds have no benchmark at all (PKP), some have exactly one
    # (every other fund so far), and AED has two (BIST-100 Getiri Endeksi +
    # KYD Mevduat Endeksi, matching its legacy chart's own two comparison
    # lines) — both optional, both handled the same way via
    # karsilastirma_hazirla(). A few funds (RTG/JET/URA) show a single
    # WEIGHTED-BLEND benchmark line with no precomputed composite column in
    # the source workbook — for those, "benchmark" is a {"blend": [...]}
    # spec (each entry its own {kitap,sayfa,tarih_pos,deger_pos,agirlik})
    # instead of a single series reference; each component is independently
    # rebased to 100 the same way, then combined date-by-date by weight.
    def hazirla(anahtar):
        if anahtar not in kaynak:
            return lambda t: None
        k = kaynak[anahtar]
        if "blend" in k:
            bilesen_fonlar = []
            for bilesen in k["blend"]:
                serisi = sayfa_serisini_oku(kitaplar[bilesen["kitap"]], bilesen["sayfa"], bilesen["tarih_pos"], bilesen["deger_pos"])
                deger_bul, baslangic = karsilastirma_hazirla(serisi, fon_tarihleri)
                print(f"{anahtar} bileşen (ağırlık {bilesen['agirlik']}) rebase noktası: {baslangic}")
                bilesen_fonlar.append((bilesen["agirlik"], deger_bul))

            def karisim_deger_bul(t):
                toplam = 0.0
                for agirlik, fn in bilesen_fonlar:
                    v = fn(t)
                    if v is None:
                        return None
                    toplam += agirlik * v
                return round(toplam, 4)

            return karisim_deger_bul
        serisi = sayfa_serisini_oku(kitaplar[k["kitap"]], k["sayfa"], k["tarih_pos"], k["deger_pos"])
        deger_bul, baslangic = karsilastirma_hazirla(serisi, fon_tarihleri)
        print(f"{anahtar} rebase noktası: {baslangic}")
        return deger_bul

    bench_deger_bul = hazirla("benchmark")
    bench2_deger_bul = hazirla("benchmark2")

    seri = [
        {
            "tarih": t.isoformat(),
            "fon": round(fon_serisi[t] / fon_baz * 100, 4),
            "benchmark": bench_deger_bul(t),
            "benchmark2": bench2_deger_bul(t),
        }
        for t in ornekleme_tarihleri
    ]

    cikti_yolu = os.path.join(CIKTI_KLASORU, f"{fon_kodu.lower()}_price_series.json")
    with open(cikti_yolu, "w", encoding="utf-8") as f:
        json.dump(seri, f, ensure_ascii=False)
    print(f"OK — {cikti_yolu} ({len(seri)} nokta, {ornekleme_tarihleri[0]} - {ornekleme_tarihleri[-1]})")


if __name__ == "__main__":
    import sys
    kod = sys.argv[1].upper() if len(sys.argv) > 1 else "AYA"
    build(kod)
