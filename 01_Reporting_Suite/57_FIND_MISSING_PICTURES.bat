@echo off
rem ==========================================================
rem  COATES | FIND MISSING PICTURES - the photo gap Excel
rem  Cement Australia K2 Shutdown 2026 - Gladstone
rem  Author: Andrew Fisher | POWERED BY SITEIQ
rem
rem  Builds Missing_Pictures_<date>.xlsx - one row per picture
rem  the register still needs: what it is, which aisle, how
rem  many items ride behind the one photo, the EXACT filename
rem  to save it as, and a search link. A second sheet shows
rem  everything already covered and by which file.
rem
rem  Save pictures into the Photos folder under the SAVE AS
rem  names (phone photos of the shelf work great), run 04, and
rem  they appear in My Gear. Run me again to re-count.
rem ==========================================================
cd /d "%~dp0"

where python >nul 2>nul
if errorlevel 1 (
    echo.
    echo Python 3 was not found on this machine.
    echo Install Python 3 from python.org, tick "Add to PATH",
    echo then run this again.
    echo.
    pause
    exit /b 1
)

python MISSING_PICTURES.py %*
for /f "delims=" %%f in ('dir /b /o-d Missing_Pictures_*.xlsx 2^>nul') do (
    start "" "%%f"
    goto opened
)
:opened

echo.
pause
