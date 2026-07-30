@echo off
setlocal
set "KAYNAK=%~dp0..\ata-portfoy-web"
set "YEREL=%USERPROFILE%\ata-portfoy-web"

echo Guncel kod ve veri Z:'den yerel diske kopyalaniyor...
robocopy "%KAYNAK%" "%YEREL%" /MIR /XD node_modules .next .git /XF *.log /R:2 /W:2 /NFL /NDL /NP >nul

cd /d "%YEREL%"
echo Bagimliliklar kuruluyor (npm install, ~20-30 saniye surer)...
call npm install

echo.
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
