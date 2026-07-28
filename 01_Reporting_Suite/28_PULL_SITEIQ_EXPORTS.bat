@echo off
rem ==========================================================
rem  COATES | PULL SITEIQ EXPORTS
rem  Grabs today's SiteIQ downloads out of your Downloads
rem  folder and files them into Data_SiteIQ with the right
rem  names. It OPENS each one and checks it is this site's
rem  export first - another site's file is never brought in.
rem
rem  Different Downloads folder? Drag it onto this .bat.
rem ==========================================================
cd /d "%~dp0"
where py >nul 2>nul && (py PULL_SITEIQ_EXPORTS.py %1) || (python PULL_SITEIQ_EXPORTS.py %1)
pause
