# Kodun GitHub'daki açma/kapama dosyasına bağlı çalışmasını sağlar.
#
# Her script başlarken GitHub'daki ayrı, küçük bir public repodan
# (metetezel/ata-portfoy-lisans) durum.json dosyasını okur:
#   {"aktif": true}  -> çalışmaya devam eder
#   {"aktif": false} -> hemen durur
#   dosya/repo yok ya da repo private yapılmış (404) -> hemen durur
#
# GitHub'a hiç ulaşılamazsa (internet yok, şirket ağı engeli, kesinti) son
# başarılı kontrol 7 günden yeniyse uyarı verip devam eder, değilse durur —
# sunum günü bir ağ sorunu yüzünden işin kilitlenmemesi için.
#
# Web tarafındaki karşılığı: ata-portfoy-web/lib/lisansKontrol.ts — aynı
# adresi ve aynı önbellek dosyasını kullanır, ikisi birlikte değiştirilmeli.
import json
import os
import sys
import time
import urllib.error
import urllib.request

DURUM_ADRESI = "https://raw.githubusercontent.com/metetezel/ata-portfoy-lisans/main/durum.json"
TOLERANS_SN = 7 * 24 * 3600
# Haftalık rutin 21 script'i art arda çalıştırıyor — son 10 dk içinde
# başarılı kontrol varsa her biri için tekrar ağa çıkmaya gerek yok.
TAZE_SN = 10 * 60

_KLASOR = os.path.join(os.environ.get("LOCALAPPDATA") or os.path.expanduser("~"), "AtaPortfoySunum")
ONBELLEK = os.path.join(_KLASOR, "lisans_onbellek.json")


def _son_basarili():
    try:
        with open(ONBELLEK, encoding="utf-8") as f:
            return float(json.load(f)["son_basarili"])
    except Exception:
        return 0.0


def _onbellek_yaz(zaman):
    try:
        os.makedirs(_KLASOR, exist_ok=True)
        with open(ONBELLEK, "w", encoding="utf-8") as f:
            json.dump({"son_basarili": zaman}, f)
    except Exception:
        pass


def _dur(mesaj):
    print("\n" + "=" * 60)
    print("ÇALIŞMA DURDURULDU: " + mesaj)
    print("Bu kopyanın kullanımı kapatılmış olabilir. Mete Tezel ile iletişime geçin.")
    print("=" * 60)
    sys.exit(3)


def kontrol_et():
    simdi = time.time()
    son = _son_basarili()
    if 0 <= simdi - son < TAZE_SN:
        return

    try:
        istek = urllib.request.Request(
            DURUM_ADRESI + f"?t={int(simdi)}", headers={"Cache-Control": "no-cache"}
        )
        with urllib.request.urlopen(istek, timeout=8) as yanit:
            veri = json.loads(yanit.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        if e.code == 404:
            _onbellek_yaz(0)
            _dur("lisans dosyasına erişilemiyor (kaldırılmış ya da private yapılmış).")
        veri = None  # 5xx vb. — GitHub tarafı sorunu, tolerans uygula
    except Exception:
        veri = None  # ağ yok / zaman aşımı — tolerans uygula

    if veri is not None:
        if veri.get("aktif") is True:
            _onbellek_yaz(simdi)
            return
        _onbellek_yaz(0)
        _dur("lisans kapatılmış.")

    gecen = simdi - son
    if son > 0 and 0 <= gecen < TOLERANS_SN:
        kalan_gun = (TOLERANS_SN - gecen) / 86400
        print(f"⚠ GitHub lisans kontrolüne ulaşılamadı — son başarılı kontrole göre "
              f"{kalan_gun:.1f} gün daha çevrimdışı çalışılabilir.")
        return
    _dur("GitHub lisans kontrolüne ulaşılamadı ve son 7 günde başarılı kontrol yok.")


if __name__ == "__main__":
    kontrol_et()
    print("Lisans kontrolü başarılı.")
