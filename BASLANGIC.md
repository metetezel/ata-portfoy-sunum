# Sunum — Pazartesi Sabahı Hızlı Başlangıç

Bu dosya sadece "ne çalıştırmam lazım" sorusuna cevap veriyor. Bir şeyin
NEDEN öyle çalıştığını, hangi kaynaktan geldiğini merak ediyorsanız
`Pazartesi_Rutini.md`'ye bakın — bu dosya onun yerine geçmiyor, sadece
önüne kısa bir özet koyuyor.

## 1. Veriyi güncelleyin (tek komut)

Proje klasöründe (`Z:\Mete Tezel\Sunum [Cursor & Claude]`) bir terminal açıp:

```
python haftalik_calistir.py
```

Bu, gereken **21 güncelleme adımını** (fon performansı, F/K'lar, endeksler,
14 fonun fiyat grafiği...) doğru sırayla tek tek çalıştırır. **~15-20 dakika
sürer** — çoğu ANZ'nin TEFAS'tan tam geçmiş çekmesinden (tek fon, ~11 dakika,
TEFAS'ın kendi hız sınırı yüzünden — normal, bir şey bozuk değil). Başlatıp
başka bir işe geçebilirsiniz, sonunda hangi adımların başarılı/başarısız
olduğunu özetler.

Bir adım başarısız olursa (ör. o an bir kaynak sitesi erişilemezse) diğer
adımlar yine de çalışmaya devam eder — sonunda listelenen başarısız adımı
tek başına tekrar çalıştırmanız yeterli (ör. `python guncelle_degerleme_fk.py`).

**Bu komutun KAPSAMADIĞI, hâlâ elle bakmanız gereken yerler:**
- **Sayfa 3** — AUM ve fon sayıları (Farshad'ın günlük raporu, Outlook) → `Veri_Kaynagi.xlsx` → `Kapak_Ozet`
- **Sayfa 7** — Kötümser/Baz/İyimser senaryo sütunları (analist görüşü) → `Piyasa_Senaryolari`
- **Sayfa 8** — Makro Tahminler'in "2026T" sütunu (analist/Ata Yatırım tahmini) → `Makro_Gostergeler`
- **Sayfa 24** — Peer F/K grafiğinin "Türkiye" satırı (ayrı, Bloomberg/Ata Yatırım kaynaklı — 9 emsal ülke otomatik ama bu satır değil) → `Peer_PE_Karsilastirma`
- **Fon sayfaları** — temettü verimi tabloları (sadece çeyreklik dağıtım sonrası değişir) → `Fon_Temettu_Verimi`
- Yukarıdakilerin hepsi zaten haftada bir bile değişmeyebilir — "her hafta mutlaka" değil, sadece "otomatik değil".

## 2. Web uygulamasını kontrol edin

`C:\Users\metete\ata-portfoy-web` klasöründe (zaten çalışmıyorsa):

```
npm run dev
```

Tarayıcıda `http://localhost:3000/sunum` açıp 32 sayfayı gözden geçirin.

## 3. PDF + PPTX üretin

Aynı klasörde (`ata-portfoy-web`, dev server hâlâ çalışırken):

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
