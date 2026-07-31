@echo off
setlocal enabledelayedexpansion
rem Yeni kurulan Node.js bazen ayni Windows oturumunda hemen PATH'e yansimaz
rem (oturum kapat/ac gerekebilir) - bilinen kurulum yerlerini burada da
rem PATH'e ekliyoruz ki bu beklemeye takilmadan calissin.
for /d %%D in ("%USERPROFILE%\devtools\node-v*-win-x64") do set "PATH=%%D;!PATH!"
cd /d "%USERPROFILE%\ata-portfoy-web"
echo PDF ve PowerPoint uretiliyor...
echo (2 numarali "Web Sunucusunu Baslat" penceresinin hala acik ve
echo  calisiyor olmasi gerekiyor - degilse once onu calistirin.)
echo.
npm run export
echo.
echo ============================================
echo Bitti. Sunum Dosyalari\PDF\2026 ve \PowerPoint\2026 klasorlerine bakin.
echo ============================================
pause
