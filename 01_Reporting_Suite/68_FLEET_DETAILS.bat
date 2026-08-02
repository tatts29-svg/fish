@echo off
title COATES ^| FLEET DETAILS - WHICH ONE GOES OUT NEXT
cd /d "%~dp0"
python build_fleet_detail.py
echo.
echo   TWO COPIES, ON PURPOSE.
echo     Gear_Lookup\fleet.html    the counter. NO MONEY on it, and the
echo                               build checks that before it writes.
echo     Reports\...\Pages\        yours. Revenue on.
echo.
echo   Open the counter copy on a phone from the store Wi-Fi. Search a
echo   product, and it ranks every asset in that fleet least-used first
echo   so the one that has been sitting there goes out next.
echo.
echo   Gear that cannot be issued is SHOWN, labelled, and left out of
echo   the percentage - never hidden inside it.
echo.
echo   RACKS.txt is yours. SiteIQ has no shelf location, so nothing
echo   shows a rack until you put lines in that file.
echo.
pause
