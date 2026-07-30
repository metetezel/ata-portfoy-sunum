@echo off
echo Z: suucusundeki guncel dosyalar C:'deki git deposuna kopyalaniyor...
robocopy "Z:\Mete Tezel\Sunum [Cursor & Claude]" "C:\Users\metete\sunum-repo" /E /XD "Sunum*" ".claude" "__pycache__" node_modules ".next" /XF "*.log" /R:2 /W:2 /NFL /NDL /NP
echo.
cd /d "C:\Users\metete\sunum-repo"
echo GitHub'a yukleniyor...
git add -A
git commit -m "Haftalik guncelleme"
git push
echo.
echo ============================================
echo Bitti. Kontrol icin: https://github.com/metetezel/ata-portfoy-sunum
echo ============================================
pause
