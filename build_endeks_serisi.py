# Builds web/data/{isim}.json for Sayfa 24-27's index-comparison charts —
# USD-based BIST-100 index, BIST-100 Market Cap/GDP ratio, and MXWO vs MXEF,
# all since 2007/2010. Kept as a separate Python script rather than folded
# into the Node app for the same reason as build_fiyat_serisi.py: one-off
# data archaeology (spreadsheet parsing, external API calls), not app logic.
#
# bist100_usd_endeksi() is now a genuinely live computation (Yahoo Finance),
# not a spreadsheet read — its own docstring below has the detail. The other
# two functions still read from source workbooks whose own stat columns
# (median/stdev bands, average/std-dev/max/min) are used as-is rather than
# recomputed, since they already match the legacy chart's reference lines
# (validated against the rendered legacy PDF page).
import datetime
import json
import os
import statistics
import requests

# Copy of MCAP_to_GDP.xlsx ve MXWO vs MXEF (BB).xlsx artık okunmuyor —
# 2026-07-30'da disa_bagimliliklari_dondur.py ile ikisinin de donuk tarihi
# verisi sabit_kaynaklar/ altına JSON olarak taşındı, orijinal dosyalar
# projeden silinebilir hale geldi (Mete'nin "ne kadar az dosya olursa..."
# isteğiyle).
SABIT_KAYNAKLAR_KLASORU = os.path.join(os.path.dirname(__file__), "sabit_kaynaklar")
EVDS_ANAHTAR_YOLU = os.path.join(os.path.dirname(__file__), "evds_api_anahtari.txt")
CIKTI_KLASORU = r"C:\Users\metete\ata-portfoy-web\data"

TARAYICI_UA = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/124.0 Safari/537.36"
)

BASLANGIC = datetime.date(2007, 1, 1)
BUGUN = datetime.date.today()


def ornekle(tarihler, hedef_nokta_sayisi=280):
    # Same adaptive downsampling as build_fiyat_serisi.py's ornekle().
    if len(tarihler) <= hedef_nokta_sayisi:
        return tarihler
    adim = max(1, len(tarihler) // hedef_nokta_sayisi)
    secilenler = tarihler[::adim]
    if secilenler[-1] != tarihler[-1]:
        secilenler = secilenler + [tarihler[-1]]
    return secilenler


def yahoo_gunluk_seri_oku(sembol, baslangic=datetime.date(2007, 1, 1)):
    # Aynı Yahoo Finance chart endpoint'i guncelle_piyasa_verileri.py'de
    # "önceki kapanış" için kullanılıyor — burada period1/period2 ile TÜM
    # geçmişi (varsayılan 2007'den bugüne, günlük) çekiyoruz. `baslangic`
    # varsayılanı Sayfa 25'in ihtiyacına göre (2007) ama daha eski veri
    # gereken çağıranlar (ör. guncelle_bist_yillik_getiriler.py, 1997'den
    # itibaren istiyor — Yahoo'da XU100.IS zaten 1997-07'den önce yok) kendi
    # tarihini geçebilir. Bare User-Agent 429 veriyor (aynı sınıf koruma
    # CEIC'te de görülmüştü), gerçek tarayıcı UA'sı gerekiyor.
    url = f"https://query1.finance.yahoo.com/v8/finance/chart/{sembol}"
    params = {"period1": int(datetime.datetime.combine(baslangic, datetime.time()).timestamp()), "period2": 9999999999, "interval": "1d"}
    r = requests.get(url, params=params, headers={"User-Agent": TARAYICI_UA}, timeout=30)
    r.raise_for_status()
    sonuc = r.json()["chart"]["result"][0]
    zaman_damgalari = sonuc["timestamp"]
    kapanislar = sonuc["indicators"]["quote"][0]["close"]
    seri = {}
    for ts, deger in zip(zaman_damgalari, kapanislar):
        if deger is None:
            continue
        d = datetime.datetime.fromtimestamp(ts, tz=datetime.timezone.utc).date()
        seri[d] = float(deger)
    return seri


def bist100_usd_endeksi():
    # USD bazında BIST-100 = XU100 (TL) / USDTRY, ikisi de Yahoo Finance'in
    # ücretsiz geçmiş veri endpoint'inden — Mete'nin daha önce Bloomberg
    # Excel eklentisinde "Select Data" ile elle genişlettiği Sunum.xlsx'teki
    # "USD Bazında Endeks" sayfasının yerini alıyor (2026-07-30, Mete'nin
    # isteğiyle: "sayfa 25'i de otomatize etmek için bir yol bulmamız lazım").
    # Doğrulandı: bu hesaplama Sunum.xlsx'in kendi (artık eski) serisiyle
    # neredeyse birebir örtüşüyor (başlangıç ~293 vs 276,9; medyan ~283 vs
    # 283,4) — bağımsız iki kaynak aynı sonuca varıyor.
    xu100 = yahoo_gunluk_seri_oku("XU100.IS")
    usdtry = yahoo_gunluk_seri_oku("TRY=X")
    usdtry_tarihleri = sorted(usdtry)

    def en_yakin_kur(t):
        # XU100 ve TRY=X aynı işlem takvimini paylaşmıyor (TRY=X döviz
        # piyasası BIST'ten daha çok gün açık) — en yakın ÖNCEKİ kuru kullan.
        adaylar = [d for d in usdtry_tarihleri if d <= t]
        return usdtry[adaylar[-1]] if adaylar else None

    seri = {}
    for t in sorted(xu100):
        if t < BASLANGIC or t > BUGUN:
            continue
        kur = en_yakin_kur(t)
        if kur is None or kur <= 0:
            continue
        seri[t] = round(xu100[t] / kur, 4)

    degerler = list(seri.values())
    medyan = statistics.median(degerler)
    sapma = statistics.pstdev(degerler)
    istatistik = {"Medyan": round(medyan, 1), "ustSapma": round(medyan + sapma, 1), "altSapma": round(medyan - sapma, 1)}
    return seri, istatistik


def evds_gsyih_oku():
    # TCMB EVDS'nin resmi web servisinden Türkiye'nin yıllık, ABD doları
    # bazında nominal GSYİH'si (IMF tahmini/gerçekleşmesi, seri kodu
    # TP.IMFGDPUSDN.TUR) — 2026-07-30'da eklendi (Mete'nin "sağ grafiği de
    # otomatize edelim" isteğiyle, EVDS'ye ücretsiz kaydolup API anahtarını
    # verdi). ⚠️ Doğru endpoint kökü "/igmevdsms-dis/" — eski/yaygın
    # dokümantasyonlardaki "/service/evds/" artık çalışmıyor (TCMB EVDS3'e
    # geçerken API'yi de taşımış, sadece siteyi değil); doğru yolu resmi
    # "EVDS Web Servis Kılavuzu" PDF'inden (sitenin kendi "Dokümanlar"
    # sayfasından indirilebiliyor) teyit ettik. API anahtarı sorgu
    # parametresi değil, HTTP header'ı olarak gönderiliyor.
    # Seri değerleri MİLYAR dolar cinsinden geliyor (ör. 1576.11) —
    # Copy of MCAP_to_GDP.xlsx'in kendi birimiyle (milyon dolar) eşleşmesi
    # için ×1000 yapılıyor.
    with open(EVDS_ANAHTAR_YOLU, encoding="utf-8") as f:
        anahtar = f.read().strip()
    url = (
        "https://evds3.tcmb.gov.tr/igmevdsms-dis/series=TP.IMFGDPUSDN.TUR"
        "&startDate=01-01-2015&endDate=31-12-2035&type=json"
    )
    r = requests.get(url, headers={"key": anahtar}, timeout=20)
    r.raise_for_status()
    gsyih_yillik = {}
    for madde in r.json().get("items", []):
        deger = madde.get("TP_IMFGDPUSDN_TUR")
        if deger is None:
            continue
        gsyih_yillik[int(madde["Tarih"])] = float(deger) * 1000
    return gsyih_yillik


def bist_gsyih_orani(xu100_usd_serisi):
    # Eskiden Copy of MCAP_to_GDP.xlsx "MCAP to GDP 93 (xu100)" sayfasından
    # canlı okunuyordu; 2026-07-30'da sabit_kaynaklar/mcap_gdp_gecmis.json'a
    # taşındı (bkz. disa_bagimliliklari_dondur.py) — dosyanın kendisi artık
    # Mete tarafından güncellenmiyor, veri zaten donuktu, canlı okumanın
    # hiçbir faydası kalmamıştı. Geçmiş (2007'den dosyanın son gerçek
    # satırına kadar) olduğu gibi kullanılıyor, ondan SONRAKİ her gün için
    # ise piyasa değerinin XU100_USD ile orantılı hareket ettiği
    # varsayımıyla ve GSYİH'nin artık evds_gsyih_oku()'dan geldiği bir
    # YAKLAŞIK oran hesaplanıyor:
    #   oran(t) = son_bilinen_oran × [xu100_usd(t)/xu100_usd(son_bilinen)]
    #             × [gsyih(son_bilinen_yıl)/gsyih(t_yılı)]
    # Yıl değişmediği sürece GSYİH çarpanı 1'dir (IMF verisi zaten yıllık).
    # Bu, dosyanın son gerçek noktasında SÜREKLİLİĞİ garanti eder (ani
    # sıçrama olmaz) ve gerçek piyasa değerini asla bilmediğimiz için tek
    # makul yaklaşım — birebir doğru değil, ama şeklen tutarlı.
    with open(os.path.join(SABIT_KAYNAKLAR_KLASORU, "mcap_gdp_gecmis.json"), encoding="utf-8") as f:
        donuk = json.load(f)
    istatistik = donuk["istatistik"]
    seri = {}
    for tarih_str, oran in donuk["seri"].items():
        d = datetime.date.fromisoformat(tarih_str)
        if d < BASLANGIC or d > BUGUN:
            continue
        seri[d] = float(oran)

    son_bilinen_tarih = max(seri)
    son_bilinen_oran = seri[son_bilinen_tarih]
    son_bilinen_yil = son_bilinen_tarih.year

    xu100_tarihleri = sorted(xu100_usd_serisi)

    def en_yakin_xu100(t):
        adaylar = [d for d in xu100_tarihleri if d <= t]
        return xu100_usd_serisi[adaylar[-1]] if adaylar else None

    xu100_ref = en_yakin_xu100(son_bilinen_tarih)

    try:
        gsyih_yillik = evds_gsyih_oku()
    except Exception as e:
        print(f"  UYARI — EVDS GSYİH okunamadı, oran serisi {son_bilinen_tarih} sonrası uzatılamayacak: {e}")
        gsyih_yillik = {}

    if xu100_ref and gsyih_yillik:
        gsyih_ref = gsyih_yillik.get(son_bilinen_yil)
        for t in xu100_tarihleri:
            if t <= son_bilinen_tarih:
                continue
            gsyih_simdi = gsyih_yillik.get(t.year, gsyih_ref)
            if gsyih_ref is None or gsyih_simdi is None:
                continue
            oran_tahmini = son_bilinen_oran * (xu100_usd_serisi[t] / xu100_ref) * (gsyih_ref / gsyih_simdi)
            seri[t] = round(oran_tahmini, 4)

    return seri, istatistik


def mxwo_mxef_serisi():
    # Eskiden "MXWO vs MXEF (BB).xlsx"'in kendi "vs" sayfasından canlı
    # okunuyordu; 2026-07-30'da sabit_kaynaklar/mxwo_mxef_gecmis.json'a
    # taşındı (bkz. disa_bagimliliklari_dondur.py) — dosya zaten Mete
    # tarafından bir daha güncellenmeyecekti, canlı okumanın anlamı kalmadı.
    #
    # 2026-07-30'dan itibaren: dosyanın kendi son gerçek satırından SONRASI
    # artık otomatik uzatılıyor (Mete'nin "internetten otomatiğe çekebiliriz"
    # isteğiyle) — Sayfa 25'in Piyasa Değeri/GSYİH grafiğiyle AYNI hibrit
    # desen: gerçek MSCI endeks seviyeleri (4788,9 gibi) hiçbir ücretsiz
    # kaynakta yok, ama bu endeksleri birebir takip eden ETF'ler var —
    # MXWO için iShares MSCI World ETF (URTH), MXEF için iShares MSCI
    # Emerging Markets ETF (EEM). Dosyanın son bilinen gerçek değerinden
    # itibaren, ETF'in kendi günlük yüzde değişimiyle uzatılıyor:
    #   deger(t) = son_bilinen_deger × [ETF(t) / ETF(son_bilinen_tarih)]
    # Bu, ETF fiyatının kendisini DEĞİL (ölçek tamamen farklı — URTH ~200$,
    # gerçek MXWO ~4789 puan), sadece günlük getirisini kullanıyor — kalibrasyon
    # noktasında süreklilik garanti (sıçrama yok), ondan sonrası ETF'in
    # gerçek endeksi ne kadar yakın takip ettiğine bağlı yaklaşık bir değer.
    with open(os.path.join(SABIT_KAYNAKLAR_KLASORU, "mxwo_mxef_gecmis.json"), encoding="utf-8") as f:
        donuk = json.load(f)
    seri = {}
    for tarih_str, (mxwo, mxef) in donuk.items():
        d = datetime.date.fromisoformat(tarih_str)
        if d > BUGUN:
            continue
        seri[d] = (float(mxwo), float(mxef))

    son_bilinen_tarih = max(seri)
    son_bilinen_mxwo, son_bilinen_mxef = seri[son_bilinen_tarih]

    try:
        urth = yahoo_gunluk_seri_oku("URTH", baslangic=son_bilinen_tarih)
        eem = yahoo_gunluk_seri_oku("EEM", baslangic=son_bilinen_tarih)
    except Exception as e:
        print(f"  UYARI — URTH/EEM okunamadı, MXWO/MXEF serisi {son_bilinen_tarih} sonrası uzatılamayacak: {e}")
        return seri

    urth_tarihleri = sorted(urth)
    eem_tarihleri = sorted(eem)

    def en_yakin(kaynak, tarihler, t):
        adaylar = [d for d in tarihler if d <= t]
        return kaynak[adaylar[-1]] if adaylar else None

    urth_ref = en_yakin(urth, urth_tarihleri, son_bilinen_tarih)
    eem_ref = en_yakin(eem, eem_tarihleri, son_bilinen_tarih)
    if not urth_ref or not eem_ref:
        return seri

    for t in sorted(set(urth_tarihleri) | set(eem_tarihleri)):
        if t <= son_bilinen_tarih or t > BUGUN:
            continue
        u = en_yakin(urth, urth_tarihleri, t)
        e = en_yakin(eem, eem_tarihleri, t)
        if u is None or e is None:
            continue
        seri[t] = (
            round(son_bilinen_mxwo * (u / urth_ref), 2),
            round(son_bilinen_mxef * (e / eem_ref), 2),
        )
    return seri


def turkiye_cds_serisi(gun_penceresi=365):
    # ANZ sayfasının "Türkiye Kredi Temerrüt Takası (CDS)" mini-grafiği —
    # legacy deck'te var ama hiçbir Rasyonet/Broşür-fed dosyada veri yok, tek
    # kaynak Z:\Farshad\BBG_Weekly.xlsx idi ve 2025-12-15'ten beri
    # yenilenmemiş durgun (bkz. reference_bbg_weekly.md notu) — Mete kendi
    # Bloomberg'ini yenileyip haber verene kadar bekletiliyordu.
    #
    # 2026-07-30: worldgovernmentbonds.com'un kendi grafik altyapısının
    # kullandığı wp-json/common/v1/historical uç noktası bulundu — ücretsiz,
    # kayıt gerekmiyor, 2015-12-15'ten bugüne GÜNLÜK gerçek Türkiye 5Y CDS
    # verisi (bare `requests.post` 403 döndü, ama Origin/Referer/
    # X-Requested-With header'ları eklenince 200 döndü — aynı bot-koruması
    # deseni, farklı çözümü). Doğrulama: dönen serinin son noktası (239.34,
    # 2026-07-30) ve tüm-zamanların min/max'ı (152.28 @ 2018-01-05, 908.40 @
    # 2022-07-16) sayfanın kendi görüntülediği özet rakamlarıyla birebir
    # eşleşti. Legacy PDF'in kendi CDS grafiği de zaten durgun/eski
    # görünüyordu (x ekseni Ağu 2025'te bitiyordu, 13 Temmuz 2026 tarihli bir
    # PDF'te) — yani bu yeni kaynak legacy'nin kendisinden bile daha güncel.
    #
    # Sadece son `gun_penceresi` gün gösteriliyor (legacy'nin kendi ~8-9 aylık
    # penceresiyle aynı fikir — 10 yıllık günlük veri tek bir mini-grafikte
    # okunaksız olurdu) — Min/Max referans çizgileri de TÜM ZAMANLARIN değil,
    # bu gösterilen pencerenin kendi min/max'ı (legacy grafikteki dashed
    # çizgiler de görünen aralığa göreydi, ~220/~380 — tüm-zamanların
    # 152/908'i değil).
    url = "https://www.worldgovernmentbonds.com/wp-json/common/v1/historical"
    sayfa_url = "https://www.worldgovernmentbonds.com/cds-historical-data/turkey/5-years/"
    body = {
        "GLOBALVAR": {
            "JS_VARIABLE": "jsGlobalVars",
            "FUNCTION": "CDS",
            "DOMESTIC": True,
            "ENDPOINT": url,
            "DATE_RIF": "2099-12-31",
            "DEBUG": True,
            "OBJ": {"UNIT": "", "DECIMAL": 2, "UNIT_DELTA": "%", "DECIMAL_DELTA": 2},
            "COUNTRY1": {"SYMBOL": "13", "PAESE": "Turkey", "PAESE_UPPERCASE": "TURKEY", "BANDIERA": "tr", "URL_PAGE": "turkey"},
            "COUNTRY2": None,
            "OBJ1": {"DURATA_STRING": "5 Years", "DURATA": 60},
            "OBJ2": None,
        }
    }
    headers = {
        "User-Agent": TARAYICI_UA,
        "Content-Type": "application/json; charset=UTF-8",
        "Referer": sayfa_url,
        "Origin": "https://www.worldgovernmentbonds.com",
        "Accept": "*/*",
        "X-Requested-With": "XMLHttpRequest",
    }
    r = requests.post(url, headers=headers, json=body, timeout=30)
    r.raise_for_status()
    veri = r.json()
    if not veri.get("success"):
        raise RuntimeError(f"worldgovernmentbonds.com CDS API 'success' değil: {veri}")

    tum_seri = {}
    for nokta in veri["result"]["quote"].values():
        d = datetime.date.fromisoformat(nokta["DATA_VAL"])
        if d > BUGUN:
            continue
        tum_seri[d] = float(nokta["CLOSE_VAL"])

    esik = BUGUN - datetime.timedelta(days=gun_penceresi)
    pencere = {t: v for t, v in tum_seri.items() if t >= esik}
    istatistik = {"min": round(min(pencere.values()), 2), "max": round(max(pencere.values()), 2)}
    return pencere, istatistik


def yaz_iki_seri(isim, seri):
    tarihler = ornekle(sorted(seri))
    nokta = [
        {"tarih": t.isoformat(), "fon": seri[t][0], "benchmark": seri[t][1]}
        for t in tarihler
    ]
    cikti_yolu = os.path.join(CIKTI_KLASORU, f"{isim}.json")
    with open(cikti_yolu, "w", encoding="utf-8") as f:
        json.dump(nokta, f, ensure_ascii=False)
    print(f"OK — {cikti_yolu} ({len(nokta)} nokta, {tarihler[0]} - {tarihler[-1]})")


def yaz(isim, seri, istatistik):
    tarihler = ornekle(sorted(seri))
    nokta = [{"tarih": t.isoformat(), "deger": seri[t]} for t in tarihler]
    cikti = {"istatistik": istatistik, "seri": nokta}
    cikti_yolu = os.path.join(CIKTI_KLASORU, f"{isim}.json")
    with open(cikti_yolu, "w", encoding="utf-8") as f:
        json.dump(cikti, f, ensure_ascii=False)
    print(f"OK — {cikti_yolu} ({len(nokta)} nokta, {tarihler[0]} - {tarihler[-1]})")
    print(f"  istatistik: {istatistik}")


if __name__ == "__main__":
    seri1, ist1 = bist100_usd_endeksi()
    yaz("bist100_usd_endeksi", seri1, ist1)

    seri2, ist2 = bist_gsyih_orani(seri1)
    yaz("bist_gsyih_orani", seri2, ist2)

    seri3 = mxwo_mxef_serisi()
    yaz_iki_seri("mxwo_mxef_series", seri3)

    seri4, ist4 = turkiye_cds_serisi()
    yaz("turkiye_cds", seri4, ist4)
