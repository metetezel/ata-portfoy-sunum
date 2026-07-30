@echo off
cd /d "C:\Users\metete\ata-portfoy-web"
echo Web sunucusu ayri bir pencerede baslatiliyor...
start "SUNUM SUNUCUSU - BU PENCEREYI KAPATMAYIN" cmd /k "npm.cmd run dev"
echo Sunucunun hazir olmasi bekleniyor...
timeout /t 6 /nobreak >nul
start "" "http://localhost:3000/sunum"
echo.
echo Tarayicida tum sunum (32 sayfa) acildi: http://localhost:3000/sunum
echo Sunucu "SUNUM SUNUCUSU - BU PENCEREYI KAPATMAYIN" basligindaki ayri
echo pencerede calisiyor - PDF/PowerPoint uretene kadar o pencereyi kapatma.
echo Bu pencereyi (bunu) simdi kapatabilirsin.
pause
