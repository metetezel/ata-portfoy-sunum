# Pazartesi sabahı TEK komutla tüm haftalık veri güncellemesini doğru
# sırayla çalıştırır. Mete'nin "hangi script'i önce çalıştırmam gerekiyor
# bilmiyorum" sorusuna cevap: artık tek bilmeniz gereken komut bu.
#
# Çalıştırma:
#   python haftalik_calistir.py
#
# Tüm adımlar bittiğinde (~15-20 dakika, çoğu ANZ'nin TEFAS'tan tam geçmiş
# çekmesinden — bu normal, TEFAS'ın kendi hız sınırı yüzünden), web
# uygulamasını (npm run dev) başlatıp /sunum'u gözden geçirin, sonra
# `npm run export` ile PDF/PPTX üretin. Detay için BASLANGIC.md'ye bakın.
#
# Her adım kendi try/except'inde — biri başarısız olursa (ör. bir kaynak
# sitesi o an erişilemezse) diğer adımlar yine de çalışır, sonda hangi
# adımların başarısız olduğu özetlenir.
import os
import subprocess
import sys
import time

PROJE_KOK = os.path.dirname(os.path.abspath(__file__))

# build_fiyat_serisi.py'nin FON_KAYNAK sözlüğündeki 13 fon (AAL hariç — o
# fonun kendi deck sayfası/fiyat grafiği yok, sadece Sayfa 30'un katalog
# tablosunda listeleniyor, bu script'in kapsamı dışında).
FON_KODLARI = ["AYA", "AAV", "TLZ", "ANZ", "PKP", "AED", "AAS", "YLC", "RTG", "JET", "URA", "DGH", "PKF"]

ADIMLAR = [
    ("Fon performans verileri (Aylık/3A/6A/Yıllık/YBB)", ["guncelle_fon_getirileri.py"]),
    ("Ata Fonları: Güçlü Performans grafikleri (Sayfa 4-5)", ["guncelle_fon_performans_ozet.py"]),
    ("Fon portföy dağılımları, TEFAS", ["guncelle_fon_portfoy_dagilimi.py"]),
    ("Piyasa Tahminleri: Mevcut Durum (Sayfa 7)", ["guncelle_piyasa_verileri.py"]),
    ("F/K üçlüsü (Türkiye/GOP/Dünya) + Türkiye CDS (Sayfa 24, Degerleme_CDS_MSCI)", ["guncelle_degerleme_fk.py"]),
    ("Peer F/K: 10 ülke, Türkiye dahil (Sayfa 24)", ["guncelle_peer_fk_msci.py"]),
    ("Uzun Vadede BIST yıllık getiriler (Sayfa 26)", ["guncelle_bist_yillik_getiriler.py"]),
    ("Endeks serileri: USD BIST-100, MCAP/GDP, MXWO/MXEF, Türkiye CDS (Sayfa 25-27, ANZ)", ["build_endeks_serisi.py"]),
]
for kod in FON_KODLARI:
    yavas_not = "  (~11 dk sürer, TEFAS hız sınırı)" if kod == "ANZ" else ""
    ADIMLAR.append((f"{kod} fiyat grafiği{yavas_not}", ["build_fiyat_serisi.py", kod]))


def calistir():
    basarisiz = []
    baslangic = time.time()
    for i, (aciklama, komut_parcalari) in enumerate(ADIMLAR, 1):
        script_yolu = os.path.join(PROJE_KOK, komut_parcalari[0])
        komut = [sys.executable, script_yolu, *komut_parcalari[1:]]
        print(f"\n[{i}/{len(ADIMLAR)}] {aciklama}...")
        sonuc = subprocess.run(komut, cwd=PROJE_KOK)
        if sonuc.returncode != 0:
            basarisiz.append(aciklama)
            print(f"  ⚠ BAŞARISIZ (çıkış kodu {sonuc.returncode}) — devam ediliyor.")

    sure_dk = (time.time() - baslangic) / 60
    print(f"\n{'=' * 60}")
    print(f"Tamamlandı ({sure_dk:.1f} dakika).")
    if basarisiz:
        print(f"⚠ {len(basarisiz)} adım başarısız oldu — yukarı bakıp tek tek elle tekrar deneyin:")
        for a in basarisiz:
            print(f"  - {a}")
        return 1
    print("Tüm adımlar başarılı.")
    print("Sıradaki: ata-portfoy-web klasöründe `npm run dev` (zaten çalışmıyorsa),")
    print("http://localhost:3000/sunum'u gözden geçirin, sonra `npm run export`.")
    return 0


if __name__ == "__main__":
    sys.exit(calistir())
