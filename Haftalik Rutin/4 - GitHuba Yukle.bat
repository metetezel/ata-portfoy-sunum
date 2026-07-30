@echo off
cd /d "%~dp0.."
echo GitHub'a yukleniyor...
git add -A
git commit -m "Haftalik guncelleme"
git push
echo.
echo ============================================
echo Bitti. Kontrol icin: https://github.com/metetezel/ata-portfoy-sunum
echo ============================================
pause
