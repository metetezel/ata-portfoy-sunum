# Sunum — Pazartesi Sabahı Hızlı Başlangıç

Bu dosya sadece "ne çalıştırmam lazım" sorusuna cevap veriyor. Bir şeyin
NEDEN öyle çalıştığını, hangi kaynaktan geldiğini merak ediyorsanız
`Pazartesi_Rutini.md`'ye bakın — bu dosya onun yerine geçmiyor, sadece
önüne kısa bir özet koyuyor.

## İlk kurulum (yeni bir bilgisayarda, ör. ofis PC'si) — sadece BİR KERE

Proje dosyalarının (kod/veri/script) hepsi Z:'de zaten hazır — hiçbir şey
eksik olmayacak. Ama bu üçü **PC'nin kendisine** kurulu olmalı, Z:'den
gelmiyor, her yeni bilgisayarda bir kere yapılması gerekiyor:

1. **Node.js kur** — [nodejs.org](https://nodejs.org)'dan LTS sürümünü indir,
   normal kur.
2. **Python kur** — [python.org](https://python.org)'dan indir, kurulum
   ekranında **"Add python.exe to PATH"** kutusunu işaretlemeyi unutma.
3. Bir terminal (PowerShell/cmd) aç, şunu çalıştır:
   ```
   pip install openpyxl requests pymupdf
   ```
4. **`Haftalik Rutin/2 - Web Sunucusunu Baslat.bat`'ı bir kere çalıştır**
   (bu, Z:'deki kodu yerel diske kopyalayıp `npm install` yapar).
5. Açılan `%USERPROFILE%\ata-portfoy-web` klasöründe bir terminal açıp
   BİR KERE şunu çalıştır (PDF/PowerPoint üretimi için gereken tarayıcıyı
   indirir, ~700MB):
   ```
   npx playwright install chromium
   ```

Bundan sonra o bilgisayarda her zaman normal "Çift tıkla, hazır" akışı
(aşağıda) 1→2→3 sırasıyla çalışır — bu kurulum adımları tekrar gerekmez.

⚠️ **Eğer bilgisayarda yönetici (admin) hakkın yoksa:** normal Node.js/Python
kurulum dosyaları çoğu zaman "yönetici olarak çalıştırmak istiyor musun?"
diye bir onay (UAC) penceresi açar — bu onayı verebiliyorsan sorun yok,
kur ve devam et. Veremiyorsan (IT kısıtlaması vb.) ikisi de admin
GEREKTİRMEDEN kurulabilir, 2026-07-30'da ofis PC'sinde bu şekilde test
edildi:
- **Node.js:** MSI/normal kurulum yerine [nodejs.org/en/download](https://nodejs.org/en/download)'dan
  "Windows Binary (.zip)" indirilip herhangi bir klasöre (ör.
  `%USERPROFILE%\devtools\node-...`) çıkartılır, sonra o klasör
  Ayarlar → Ortam Değişkenleri → Kullanıcı PATH'ine eklenir — kurulum
  değil, sadece dosya kopyalama, admin istemiyor.
- **Python:** python.org'un normal `.exe` kurulum dosyası zaten varsayılan
  olarak admin istemiyor — kurulum ekranında **"Install for all users"
  kutusunu İŞARETLEME** (varsayılan zaten işaretsiz), "Install Now"
  yeterli, "Add python.exe to PATH" kutusu işaretli kalsın.

## Git bilmeyen bir ekip arkadaşı koda nasıl erişir?

Kod artık kalıcı olarak Z:'de değil, GitHub'da yaşıyor
(`github.com/metetezel/ata-portfoy-sunum`) — git kurmadan/öğrenmeden de
erişilebilir:

1. Tarayıcıda `https://github.com/metetezel/ata-portfoy-sunum` adresine git.
2. Yeşil **"Code"** butonuna tıkla → **"Download ZIP"**.
3. İnen ZIP'i istediğin bir klasöre çıkart.
4. Yukarıdaki "İlk kurulum" adımlarını (1-5) bu klasörde aynen uygula —
   ZIP'ten gelen kopya, Z:'deki gibi sıradan bir klasör, git'e ihtiyaç yok.

⚠️ **Bu bir anlık görüntü, otomatik güncellenmez.** Kod GitHub'da
değiştikçe bu ZIP kopyası eskir — güncel kalmak için aynı adımları
(2-3 arası) tekrar edip yeniden indirmek gerekir. Sık sık güncel kalmak
gereken biri varsa git öğrenmesi ya da **GitHub Desktop** (git bilmeden,
tek tıkla "güncelle" yapan bir program) kurması Mete'den istenebilir —
ama tek seferlik/nadiren bakılan erişim için ZIP indirme yeterli.

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
