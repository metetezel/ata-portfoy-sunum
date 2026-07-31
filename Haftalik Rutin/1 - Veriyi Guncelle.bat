@echo off
setlocal
rem Yeni kurulan Python bazen ayni Windows oturumunda hemen PATH'e yansimaz
rem (oturum kapat/ac gerekebilir) - bilinen kurulum yerlerini burada da
rem PATH'e ekliyoruz ki bu beklemeye takilmadan calissin.
set "PATH=%LOCALAPPDATA%\Programs\Python\Python312;%LOCALAPPDATA%\Programs\Python\Python312\Scripts;%LOCALAPPDATA%\Programs\Python\Launcher;%PATH%"
rem cd /d bir ag paylasiminda (UNC yol, \\...) calismaz - "CMD does not
rem support UNC paths as current directory" diyip C:\Windows'a duser.
rem pushd bunun yerine UNC yola gecici bir surucu harfi atar, bu yuzden
rem bu betik Z: uzerinden cift tiklanarak da calisabiliyor.
pushd "%~dp0.."
echo Veri guncelleme basliyor - 21 adim, yaklasik 5-8 dakika surer.
echo (Ilk calistirmada ANZ adimi ~11 dakika surebilir - TEFAS onbellegi ilk kez
echo  dolduruluyor. Sonraki haftalardan itibaren ayni adim sadece ~40 saniye surer.)
echo.
where python >nul 2>nul
if %errorlevel%==0 (
    python haftalik_calistir.py
) else (
    py -3.12 haftalik_calistir.py
    if errorlevel 1 (
        echo.
        echo HATA: Python bulunamadi/calismadi. BASLANGIC.md'deki "Ilk kurulum"
        echo bolumunu kontrol edin, ya da bilgisayari bir kere yeniden baslatip
        echo tekrar deneyin - Windows'ta yeni kurulan programlar bazen boyle
        echo bir yeniden baslatmadan sonra duzgun calisir.
    )
)
echo.
echo ============================================
echo Islem tamamlandi. Yukaridaki ozeti kontrol edin.
echo ============================================
popd
pause
