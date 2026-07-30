# Web app kodunu (C:\Users\metete\ata-portfoy-web) Z: ag paylasimina yedekler.
# Neden: uygulama kodu sadece bu PC'nin C: suruculugunde duruyor, baska hicbir
# yerde kopyasi yok. Bu PC kapaliyken (ornegin ofisten calisirken) kod
# tamamen erisilemez olur.
#
# Bu script Windows Task Scheduler uzerinden "SunumWebAppYedekle" adiyla her
# birkac dakikada bir OTOMATIK calisacak sekilde kaydedildi (2026-07-29) -
# elle tekrar calistirmaya gerek yok, Cuma'ya kadar yapilacak butun sayfa
# guncellemeleri kendiliginden Z:'ye yansir. Gorevi kontrol/kaldirmak icin:
#   Get-ScheduledTask -TaskName SunumWebAppYedekle
#   Unregister-ScheduledTask -TaskName SunumWebAppYedekle -Confirm:$false
#
# node_modules ve .next kasitli olarak HARIC tutuluyor - buyuk, tekrar
# uretilebilir (npm install / npm run build) klasorler, Z: gibi yavas bir ag
# paylasimina kopyalanmalari hem gereksiz hem de yavas olur. Ofis PC'sinde bu
# yedekten calismaya baslarken once yerel bir C: klasorune kopyalayip orada
# "npm install" calistirin - dogrudan Z: uzerinde "npm run dev" calistirmayin
# (daha once olculdu: Z: uzerinde npm install 1 saatten uzun surdu, yerelde 27sn).

$kaynak = "C:\Users\metete\ata-portfoy-web"
$hedef = "Z:\Mete Tezel\Sunum [Cursor & Claude]\ata-portfoy-web"
$log = "Z:\Mete Tezel\Sunum [Cursor & Claude]\yedekle_web_app.log"

# /R:2 /W:2 -> bir dosya o an kilitliyse (ornegin dev server yaziyorsa) uzun
# sure beklemeden gecsin; her birkac dakikada bir zaten tekrar calisacak.
robocopy $kaynak $hedef /MIR /XD node_modules .next /XF *.log /R:2 /W:2 /NFL /NDL /NP /LOG+:$log

"[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] Senkron tamamlandi" | Out-File -FilePath $log -Append -Encoding utf8
