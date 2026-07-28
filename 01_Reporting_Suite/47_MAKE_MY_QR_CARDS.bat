@echo off
rem ==========================================================
rem  COATES | MAKE MY QR CARDS - a sticker for every hire card
rem  Cement Australia K2 Shutdown 2026 - Gladstone
rem  Author: Andrew Fisher | POWERED BY SITEIQ
rem
rem  Prints a personal QR sticker for everyone with a My Gear
rem  card - scan it with the phone's normal camera app on the
rem  store Wi-Fi and YOUR gear opens. No typing, no camera
rem  permission, no security warnings.
rem
rem  21 stickers per A4 page, Avery L7160 label size, grouped
rem  by company. Sheets land in QR_Cards\ - print, peel, stick
rem  on the back of each card at prestart.
rem
rem  Run 04_RUN_MY_GEAR.bat first if the roster changed. Run me
rem  again any time the store address changes.
rem ==========================================================
cd /d "%~dp0"
where py >nul 2>nul && (py MAKE_MY_QR_CARDS.py %*) || (python MAKE_MY_QR_CARDS.py %*)
echo.
pause
