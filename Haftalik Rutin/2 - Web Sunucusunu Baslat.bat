@echo off
cd /d "C:\Users\metete\ata-portfoy-web"
echo Web sunucusu baslatiliyor...
echo Hazir olunca tarayicida su adresi acin: http://localhost:3000/sunum
echo.
echo ONEMLI: Bu pencereyi KAPATMAYIN - sunucu bu pencere acikken calisir.
echo PDF/PowerPoint uretmek icin (3 numarali dosya) bu pencere acik kalmali.
echo.
npm run dev
pause
