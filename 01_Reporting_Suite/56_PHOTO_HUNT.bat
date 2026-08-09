@echo off
rem ==========================================================
rem  COATES | PHOTO HUNT - the wanted list for gear pictures
rem  Cement Australia K2 Shutdown 2026 - Gladstone
rem  Author: Andrew Fisher | POWERED BY SITEIQ
rem
rem  Builds Photo_Hunt.html - one row per product variant and
rem  consumable SKU: the exact filename a photo must be saved
rem  as, what the thing is, and search buttons that open the
rem  Coates site and Google Images in your browser.
rem
rem  Save pictures into the Photos folder under the shown
rem  names (phone photos of the shelf work great), run 04, and
rem  they appear as thumbnails in My Gear. Run me again any
rem  time to see the hunt tick itself off.
rem ==========================================================
cd /d "%~dp0"

call "%~dp0_RUN.bat" PHOTO_HUNT.py %*
if exist Photo_Hunt.html start "" Photo_Hunt.html

echo.
pause
