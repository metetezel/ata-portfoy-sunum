# Degerleme_CDS_MSCI sekmesindeki "BIST-100 F/K", "GOP F/K" ve "Dunya F/K"
# satırlarını otomatik günceller. "Turkiye CDS" satırına BURADA DOKUNULMUYOR —
# o hâlâ manuel/Bloomberg kaynaklı (bkz. Pazartesi_Rutini.md madde 10, CDS için
# BBG_Weekly.xlsx'in Mete tarafından yenilenmesi bekleniyor).
#
# BIST-100 F/K kaynağı (eklendi 2026-07-30, Mete'nin "onu da bulalım" isteğiyle):
# CEIC Data'nın "Turkey PE Ratio: Borsa Istanbul" gösterge sayfası
# (ceicdata.com — ücretsiz, kayıt gerekmiyor, ama gerçek bir API değil, bir
# pazarlama/SEO "teaser" sayfasının açıklama cümlesinden regex ile okunuyor —
# bu yüzden diğer kaynaklardan biraz daha kırılgan, sayfa şablonu değişirse
# bozulabilir). CEIC'in kendi açıklamasına göre veri doğrudan Borsa
# İstanbul'dan geliyor ("data remains active status in CEIC and is reported
# by Borsa Istanbul") — denenen tüm kaynaklar arasında Bloomberg'in rakamına
# EN YAKIN çıkan buydu (18,3 vs Bloomberg'in 17,0'ı — bir önceki ay 17,32,
# neredeyse birebir). Reddedilen alternatifler (worldperatio.com'un TUR ETF
# proxy'si, MSCI'nin kendi Turkey endeksi — sadece 11 şirket kapsıyor, F/K
# ~11 ile çok uzak) hâlâ `Pazartesi_Rutini.md`'de belgeli, tekrar denenmesin.
# ⚠️ Bu seri de tam olarak "XU100/BIST-100" mü yoksa daha geniş bir "Borsa
# İstanbul" piyasa ortalaması mı ölçüyor, CEIC'in sayfa metninden %100 net
# değil — ama rakamın Bloomberg'in BIST-100 F/K'sına bu kadar yakın çıkması
# güçlü bir işaret, ve bu iki şey pratikte zaten birbirine çok yakın hareket
# eder (BIST-100 toplam piyasa değerinin büyük kısmını oluşturuyor).
# ⚠️ CEIC de aylık güncelleniyor — MSCI kaynaklı GOP/Dünya F/K ile aynı
# "haftalık deck'te bazı haftalar değişmeyebilir" kabulü geçerli.
#
# GOP F/K ve Dünya F/K kaynağı:
# https://www.msci.com/documents/10199/255599/msci-world-index.pdf —
# sabit/canlı bir URL, MSCI bu dosyayı her ay sonunda yerinde güncelliyor
# (indirilen PDF'in kendi "generated" tarihi ayın başına denk gelir, içindeki
# veri bir önceki ay sonuna ait — ör. Temmuz başında indirilen dosya "JUN 30"
# verisini taşır). Bu PDF'in "FUNDAMENTALS" tablosu MSCI World'ün YANI SIRA
# karşılaştırma sütunu olarak MSCI Emerging Markets'ı da içeriyor — tek
# indirmeyle her iki rakam da geliyor, ayrı bir EM factsheet'i gerekmiyor.
#
# ⚠️ Bilinen sınırlama (Mete'ye bildirildi, 2026-07-30'da kabul edildi):
#   - MSCI bu factsheet'i sadece AYDA BİR günceller — haftalık deck'te bazı
#     haftalar rakam hiç değişmeyecek, bu normal/beklenen, hata değil.
#   - Rakamlar Bloomberg'in kendi F/K hesaplamasıyla birebir eşleşmeyebilir
#     (farklı endeks kapsamı/metodoloji) — ~%7-8 civarı sapma gözlemlendi,
#     TCMB/Yahoo Finance otomasyonundaki "ondalık bazda birebir değil" kabulüyle
#     aynı kategoride bir tradeoff.
#
# PDF çıkarım tekniği notu: bu PDF'te tablo çizgisi yok (find_tables() 0 tablo
# buluyor), sadece serbest-konumlu metin var. Üstelik "INDEX PERFORMANCE" ve
# "FUNDAMENTALS" tabloları YAN YANA aynı satırları paylaşıyor (ör. "MSCI World"
# etiketi tek başına hem performans hem F/K sütunlarına hizalı) — bu yüzden
# "satırdaki N'inci sayı" gibi düz bir sıralamaya güvenmek yanlış sayıyı
# yakalar (performans tablosunun 8 sayısı önce geliyor). Bunun yerine "P/E"
# sütun başlığının GERÇEK x-koordinatına en yakın sayısal değeri buluyoruz.
import datetime
import os
import re

import fitz
import openpyxl
import requests

VERI_KAYNAGI_YOLU = os.path.join(os.path.dirname(__file__), "Veri_Kaynagi.xlsx")
MSCI_WORLD_PDF_URL = "https://www.msci.com/documents/10199/255599/msci-world-index.pdf"
CEIC_BIST_PE_URL = "https://www.ceicdata.com/en/turkey/borsa-istanbul-price-earning-ratio/pe-ratio-borsa-istanbul"
TARAYICI_UA = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/124.0 Safari/537.36"
)

AY_ADLARI_KISA = {
    "JAN": 1, "FEB": 2, "MAR": 3, "APR": 4, "MAY": 5, "JUN": 6,
    "JUL": 7, "AUG": 8, "SEP": 9, "OCT": 10, "NOV": 11, "DEC": 12,
}


def bist_ceic_fk_oku():
    # Bare/default User-Agent gets a 403 from this site (aynı sınıf koruma
    # Yahoo Finance'te de görülmüştü) — gerçek tarayıcı UA'sı ile çalışıyor.
    html = requests.get(CEIC_BIST_PE_URL, headers={"User-Agent": TARAYICI_UA}, timeout=20).text
    # Sayfanın meta description'ı: "Turkey PE Ratio: Borsa Istanbul data was
    # reported at 18.300 NA in Jun 2026. ..." — bu cümle CEIC'in tüm
    # göstergelerinde aynı şablonla üretiliyor, tarih/değer için en güvenilir
    # kısım bu (sayfanın başka yerlerindeki pazarlama metni tutarsız tarih
    # etiketleri kullanabiliyor, bu cümle her indikatörde standart).
    eslesme = re.search(
        r"reported at\s+([\d.]+)\s+\w*\s*in\s+(\w{3})\s+(\d{4})", html
    )
    if not eslesme:
        raise RuntimeError("CEIC sayfasından BIST F/K okunamadı — sayfa şablonu değişmiş olabilir.")
    deger = float(eslesme.group(1))
    ay = AY_ADLARI_KISA[eslesme.group(2).upper()]
    yil = int(eslesme.group(3))
    # CEIC ay-sonu verisi veriyor, ayın son gününü tarih olarak kullan.
    sonraki_ay = datetime.date(yil + (ay == 12), (ay % 12) + 1, 1)
    veri_tarihi = sonraki_ay - datetime.timedelta(days=1)
    return veri_tarihi, deger


def msci_world_em_fk_oku():
    pdf_bytes = requests.get(MSCI_WORLD_PDF_URL, headers={"User-Agent": "Mozilla/5.0"}, timeout=20).content
    doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    page = doc[0]
    kelimeler = page.get_text("words")  # (x0,y0,x1,y1,word,block,line,word_no)

    fundamentals_y = next(w[1] for w in kelimeler if w[4] == "FUNDAMENTALS")

    # "FUNDAMENTALS (JUN 30, 2026)" — aynı satırda, sağ tarafta.
    tarih_kelimeleri = [w[4] for w in kelimeler if abs(w[1] - fundamentals_y) <= 1.5 and w[0] > 400]
    ay_kisa = next(t.strip("(") for t in tarih_kelimeleri if t.strip("(").upper() in AY_ADLARI_KISA)
    gun = int(next(t.strip(",") for t in tarih_kelimeleri if t.rstrip(",").isdigit()))
    yil = int(next(t.strip(")") for t in tarih_kelimeleri if t.strip(")").isdigit() and len(t.strip(")")) == 4))
    veri_tarihi = datetime.date(yil, AY_ADLARI_KISA[ay_kisa.upper()], gun)

    # "P/E" sütun başlığının x-konumu — başlık satırında "P/E" kelimesi İKİ
    # kez geçiyor ("P/E" sütununun kendisi ve "P/E Fwd"nin ilk kelimesi olarak)
    # — soldaki (küçük x) gerçek "P/E" sütunudur.
    pe_header_y = min(w[1] for w in kelimeler if w[4] == "P/E" and w[1] > fundamentals_y)
    pe_x = min(w[0] for w in kelimeler if w[4] == "P/E" and abs(w[1] - pe_header_y) <= 1.5)

    def fk_bul(etiket_parcalari):
        ilk = etiket_parcalari[0]
        for aday in (w for w in kelimeler if w[4] == ilk and w[1] > fundamentals_y):
            y = aday[1]
            satir = sorted((w for w in kelimeler if abs(w[1] - y) <= 1.5), key=lambda w: w[0])
            etiket_metni = [w[4] for w in satir if w[0] < 400]
            if etiket_metni[: len(etiket_parcalari)] != etiket_parcalari:
                continue
            sayisal = [w for w in satir if re.match(r"^-?\d+\.\d+$", w[4])]
            if not sayisal:
                continue
            en_yakin = min(sayisal, key=lambda w: abs(w[0] - pe_x))
            return float(en_yakin[4])
        return None

    dunya_fk = fk_bul(["MSCI", "World"])
    gop_fk = fk_bul(["MSCI", "Emerging", "Markets"])

    if dunya_fk is None or gop_fk is None:
        raise RuntimeError(f"FUNDAMENTALS tablosundan P/E okunamadı (Dünya={dunya_fk}, GOP={gop_fk}) — PDF formatı değişmiş olabilir.")

    return veri_tarihi, dunya_fk, gop_fk


def main():
    hedefler = {}  # metrik -> (tarih_str, deger)
    hatalar = []

    try:
        veri_tarihi, dunya_fk, gop_fk = msci_world_em_fk_oku()
        hedefler["Dunya F/K"] = (veri_tarihi.isoformat(), dunya_fk)
        hedefler["GOP F/K"] = (veri_tarihi.isoformat(), gop_fk)
    except Exception as e:
        hatalar.append(f"MSCI World factsheet okuma hatası (GOP/Dünya F/K güncellenmedi): {e}")

    try:
        veri_tarihi, bist_fk = bist_ceic_fk_oku()
        hedefler["BIST-100 F/K"] = (veri_tarihi.isoformat(), bist_fk)
    except Exception as e:
        hatalar.append(f"CEIC okuma hatası (BIST-100 F/K güncellenmedi): {e}")

    wb = openpyxl.load_workbook(VERI_KAYNAGI_YOLU)
    ws = wb["Degerleme_CDS_MSCI"]

    bulunanlar = set()
    for row in ws.iter_rows(min_row=2):
        metrik = row[1].value
        if metrik in hedefler:
            tarih_str, deger = hedefler[metrik]
            eski = row[2].value
            row[0].value = tarih_str
            row[2].value = round(deger, 2)
            bulunanlar.add(metrik)
            print(f"  {metrik}: {eski} -> {row[2].value} ({tarih_str})")

    # Sekmede satır hiç yoksa (ör. ilk çalıştırma) ekle.
    son_dolu_satir = ws.max_row
    for metrik, (tarih_str, deger) in hedefler.items():
        if metrik in bulunanlar:
            continue
        son_dolu_satir += 1
        ws.cell(row=son_dolu_satir, column=1, value=tarih_str)
        ws.cell(row=son_dolu_satir, column=2, value=metrik)
        ws.cell(row=son_dolu_satir, column=3, value=round(deger, 2))
        print(f"  {metrik}: (yeni satır) -> {round(deger, 2)} ({tarih_str})")

    wb.save(VERI_KAYNAGI_YOLU)
    print("OK — Degerleme_CDS_MSCI güncellendi.")
    print("NOT: Turkiye CDS bu script tarafından değiştirilmedi, hâlâ manuel.")
    if hatalar:
        print("UYARI — bazı kaynaklar okunamadı:")
        for h in hatalar:
            print(f"  {h}")


if __name__ == "__main__":
    main()
