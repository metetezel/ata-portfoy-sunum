@echo off
cd /d "C:\Users\metete\ata-portfoy-web"
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
