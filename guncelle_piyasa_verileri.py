# Refreshes Piyasa_Senaryolari's "Mevcut_Durum" column (önceki kapanış
# seviyeleri) doğrudan genel/resmi veri kaynaklarından — Mete'nin bunları
# haftalık olarak uzak Bloomberg terminalinden elle not etmesi yerine.
#
# Kötümser/Baz/İyimser senaryo sütunları BURADA GÜNCELLENMEZ — onlar analist
# görüşü/tahmini, canlı veri değil, ve otomasyon kapsamında hiç değildi.
#
# Kaynaklar:
#   - USD/TL, EURO/TL: TCMB'nin herkese açık günlük kur XML'i (API anahtarı/
#     kayıt gerekmiyor) — https://www.tcmb.gov.tr/kurlar/today.xml. Döviz
#     Alış/Satış ortalaması "kur" olarak kullanılıyor.
#   - BIST100 Endeksi, S&P 500 Endeksi, Euro Stoxx 50 Endeksi: Yahoo Finance
#     chart endpoint'i, her enstrümanın kendi `chartPreviousClose` alanı
#     (bir önceki tamamlanmış seansın kapanışı) — Bloomberg terminaline
#     ihtiyaç duymadan "önceki kapanış" için en yakın karşılık.
#
# Bilinen sınırlama (Mete'ye bildirildi, 2026-07-29'da kabul edildi): bu
# rakamlar Bloomberg'in kendi kapanış rakamıyla ondalık bazda birebir
# eşleşmeyebilir — farklı veri sağlayıcılarının kapanış/seans kuralları
# küçük farklar yaratabilir. Müşteri sunumu için yeterli hassasiyette, ama
# Bloomberg ile birebir eşleşme garantisi vermiyor.
import datetime
import os
import xml.etree.ElementTree as ET

import openpyxl
import requests

VERI_KAYNAGI_YOLU = os.path.join(os.path.dirname(__file__), "Veri_Kaynagi.xlsx")

TARAYICI_UA = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/124.0 Safari/537.36"
)

YAHOO_SEMBOL = {
    "BIST100 Endeksi": "XU100.IS",
    "S&P 500 Endeksi": "^GSPC",
    "Euro Stoxx 50 Endeksi": "^STOXX50E",
}

# Fiyat seviyesi endeksler tam sayı (13.944 gibi), kur çiftleri 2 ondalık
# (47,16 gibi) gösteriliyor — web tarafındaki PiyasaSenaryolariTablosu'nun
# ENSTRUMAN_BILGI tablosuyla aynı kural.
ONDALIK = {
    "BIST100 Endeksi": 0,
    "USD/TL": 2,
    "EURO/TL": 2,
    "S&P 500 Endeksi": 0,
    "Euro Stoxx 50 Endeksi": 0,
}


def tcmb_kurlarini_oku():
    xml = requests.get("https://www.tcmb.gov.tr/kurlar/today.xml", timeout=10).text
    kok = ET.fromstring(xml)
    kurlar = {}
    for currency in kok.findall("Currency"):
        kod = currency.get("Kod")
        if kod not in ("USD", "EUR"):
            continue
        alis = float(currency.find("ForexBuying").text)
        satis = float(currency.find("ForexSelling").text)
        kurlar[kod] = (alis + satis) / 2
    return kurlar


def yahoo_onceki_kapanisi_oku(sembol):
    url = f"https://query1.finance.yahoo.com/v8/finance/chart/{sembol}"
    r = requests.get(url, params={"range": "5d", "interval": "1d"}, headers={"User-Agent": TARAYICI_UA}, timeout=10)
    r.raise_for_status()
    return r.json()["chart"]["result"][0]["meta"]["chartPreviousClose"]


def main():
    yeni_degerler = {}
    hatalar = []

    try:
        kurlar = tcmb_kurlarini_oku()
        yeni_degerler["USD/TL"] = kurlar["USD"]
        yeni_degerler["EURO/TL"] = kurlar["EUR"]
    except Exception as e:
        hatalar.append(f"TCMB kur okuma hatası: {e}")

    for ad, sembol in YAHOO_SEMBOL.items():
        try:
            yeni_degerler[ad] = yahoo_onceki_kapanisi_oku(sembol)
        except Exception as e:
            hatalar.append(f"{ad} ({sembol}) okuma hatası: {e}")

    bugun = datetime.date.today().isoformat()

    wb = openpyxl.load_workbook(VERI_KAYNAGI_YOLU)
    ws = wb["Piyasa_Senaryolari"]

    guncellenen = []
    for row in ws.iter_rows(min_row=2):
        enstruman = row[1].value
        if enstruman not in yeni_degerler:
            continue
        eski = row[2].value
        yeni = round(yeni_degerler[enstruman], ONDALIK.get(enstruman, 2))
        row[0].value = bugun
        row[2].value = yeni
        guncellenen.append((enstruman, eski, yeni))

    wb.save(VERI_KAYNAGI_YOLU)

    print(f"OK — Piyasa_Senaryolari Mevcut Durum güncellendi ({bugun}):")
    for ad, eski, yeni in guncellenen:
        print(f"  {ad}: {eski} -> {yeni}")
    if hatalar:
        print("UYARI — bazı kaynaklar okunamadı, ilgili satırlar güncellenmedi:")
        for h in hatalar:
            print(f"  {h}")


if __name__ == "__main__":
    main()
