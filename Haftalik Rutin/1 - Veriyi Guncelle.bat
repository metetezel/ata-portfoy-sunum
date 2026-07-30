@echo off
cd /d "%~dp0.."
echo Veri guncelleme basliyor - 21 adim, yaklasik 5-8 dakika surer.
echo (Ilk calistirmada ANZ adimi ~11 dakika surebilir - TEFAS onbellegi ilk kez
echo  dolduruluyor. Sonraki haftalardan itibaren ayni adim sadece ~40 saniye surer.)
echo.
python haftalik_calistir.py
echo.
echo ============================================
echo Islem tamamlandi. Yukaridaki ozeti kontrol edin.
echo ============================================
pause
