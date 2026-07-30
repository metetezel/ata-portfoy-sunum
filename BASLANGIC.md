# Sunum — Pazartesi Sabahı Hızlı Başlangıç

Bu dosya sadece "ne çalıştırmam lazım" sorusuna cevap veriyor. Bir şeyin
NEDEN öyle çalıştığını, hangi kaynaktan geldiğini merak ediyorsanız
`Pazartesi_Rutini.md`'ye bakın — bu dosya onun yerine geçmiyor, sadece
önüne kısa bir özet koyuyor.

## Çift tıkla, hazır (önerilen — terminale gerek yok)

Proje klasöründe **`Haftalik Rutin`** adlı bir alt klasör var
(`Z:\Mete Tezel\Sunum [Cursor & Claude]\Haftalik Rutin`), içinde 3 tane
`.bat` dosyası — Dosya Gezgini'nden sırayla çift tıklaman yeterli (her
dosyanın ne yaptığı klasördeki `0 - Nasil Kullanilir.txt`'de de yazıyor):

1. **`1 - Veriyi Guncelle.bat`** — veriyi günceller (~5-8 dakika, ilk
   çalıştırmada ~15 dakika olabilir — TEFAS önbelleği ilk kez doluyor).
   Açılan siyah pencere işlem bitince "Devam etmek için bir tuşa basın..."
   yazar, o zaman kapatabilirsin.
2. **`2 - Web Sunucusunu Baslat.bat`** — web sunucusunu başlatır. **Bu
   pencereyi açık bırak**, kapatma. Hazır olunca tarayıcıda
   `http://localhost:3000/sunum` adresini aç, 32 sayfayı gözden geçir.
3. **`3 - PDF ve PowerPoint Uret.bat`** — PDF + PowerPoint üretir (2 numaralı
   pencere hâlâ açıkken çalıştır). Çıktılar `Sunum Dosyaları\PDF\2026\` ve
   `\PowerPoint\2026\` altına kaydedilir.

Bir sorun çıkarsa (siyah pencere hata verip kapanırsa/donarsa) aşağıdaki
terminal yöntemine bakabilir ya da hata mesajının ekran görüntüsünü
paylaşabilirsin.

**Bu üç adımın KAPSAMADIĞI, hâlâ elle bakmanız gereken yerler:**
- **Sayfa 3** — AUM ve fon sayıları (Farshad'ın günlük raporu, Outlook) → `Veri_Kaynagi.xlsx` → `Kapak_Ozet`
- **Sayfa 7** — Kötümser/Baz/İyimser senaryo sütunları (analist görüşü) → `Piyasa_Senaryolari`
- **Sayfa 8** — Makro Tahminler'in "2026T" sütunu (analist/Ata Yatırım tahmini) → `Makro_Gostergeler`
- **Sayfa 24** — Peer F/K grafiğinin "Türkiye" satırı (ayrı, Bloomberg/Ata Yatırım kaynaklı — 9 emsal ülke otomatik ama bu satır değil) → `Peer_PE_Karsilastirma`
- **Fon sayfaları** — temettü verimi tabloları (sadece çeyreklik dağıtım sonrası değişir) → `Fon_Temettu_Verimi`
- Yukarıdakilerin hepsi zaten haftada bir bile değişmeyebilir — "her hafta mutlaka" değil, sadece "otomatik değil".

## Alternatif: terminal ile (aynı işlemler, elle)

**1. Veriyi güncelleyin** — proje klasöründe bir terminal açıp:

```
python haftalik_calistir.py
```

Gereken **21 güncelleme adımını** (fon performansı, F/K'lar, endeksler, 13
fonun fiyat grafiği...) doğru sırayla tek tek çalıştırır. Bir adım başarısız
olursa (ör. o an bir kaynak sitesi erişilemezse) diğer adımlar yine de
çalışmaya devam eder — sonunda listelenen başarısız adımı tek başına tekrar
çalıştırmanız yeterli (ör. `python guncelle_degerleme_fk.py`).

**2. Web uygulamasını kontrol edin** — `ata-portfoy-web` klasöründe (zaten
çalışmıyorsa):

```
npm run dev
```

Tarayıcıda `http://localhost:3000/sunum` açıp 32 sayfayı gözden geçirin.

**3. PDF + PPTX üretin** — aynı klasörde, dev server hâlâ çalışırken:

```
npm run export
```

Her ikisi de otomatik oluşur: `Sunum Dosyaları\PDF\2026\` ve
`Sunum Dosyaları\PowerPoint\2026\` altına, legacy adlandırmayla
(`Ata Portföy Sunum - {gün} {ay} {yıl}`).

## Bir şey bozulursa

`Pazartesi_Rutini.md` her script'in ne yaptığını, hangi kaynaktan
okuduğunu ve bilinen sınırlamalarını tek tek anlatıyor — madde numaraları
`haftalik_calistir.py`'deki adım sırasıyla eşleşiyor. Orada da yoksa,
ilgili script'in kendi başındaki yorum satırlarına bakın — her biri
bulunma sürecini ve kararları belgeliyor.
