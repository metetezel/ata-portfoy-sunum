# Ata Portföy — Sunum Otomasyonu

Ata Portföy'ün haftalık yatırımcı sunumunu (32 sayfa) elle Excel'de
güncellemek yerine otomatikleştiren proje: bir Next.js web uygulaması
(`ata-portfoy-web/`) `/sunum` route'unda deck'i render eder, bir grup
Python script'i (`guncelle_*.py` / `build_*.py`) haftalık verileri (fon
performansı, F/K oranları, endeksler, TEFAS/MSCI/EVDS gibi ücretsiz resmi
kaynaklardan) günceller, ve `npm run export` deck'i PDF + PPTX olarak üretir.

## Hızlı başlangıç

**Haftalık kullanım için → [`BASLANGIC.md`](BASLANGIC.md)** (tek komut, 2 dakikalık okuma).

**Her şeyin neden öyle olduğu, hangi kaynaktan geldiği, bilinen sınırlamalar → [`Pazartesi_Rutini.md`](Pazartesi_Rutini.md)** (kapsamlı referans).

## Yapı

- `ata-portfoy-web/` — Next.js uygulaması. `/sunum` gerçek deck, `/fon/[kod]` tek fon önizlemesi.
- `Veri_Kaynagi.xlsx` — tüm verinin tek kaynağı; script'ler bunu okur/yazar, web uygulaması bunu okur.
- `guncelle_*.py`, `build_*.py` — haftalık veri güncelleme script'leri (`haftalik_calistir.py` hepsini doğru sırayla çalıştırır).
- `sabit_kaynaklar/` — artık güncellenmeyen eski kaynak dosyalardan (Sunum.xlsx vb.) dondurulmuş tarihi veri anlık görüntüleri.
- `Sunum Dosyaları/` — haftalık PDF/PPTX çıktıları (git'e dahil değil, `.gitignore`'da).

## Kurulum (yeni bir makinede)

```
cd ata-portfoy-web
npm install
npm run dev
```

`Veri_Kaynagi.xlsx` varsayılan olarak `\\atafiles\Ata.Portföy\...` ağ paylaşımından okunur — farklı bir konumdan
okumak için `SUNUM_KAYNAK_KLASORU` ortam değişkenini bu repo'nun kök klasörüne ayarlayın.
