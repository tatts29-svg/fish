@echo off
rem ==================================================================
rem  COATES ^| 6 - PULL TODAYS EXPORTS FROM DOWNLOADS, THEN MAKE THE REPORT
rem  Grabs the newest SiteIQ exports for THIS job out of your Downloads
rem  folder, files them into Data_SiteIQ with the right names (the old
rem  ones go to Data_SiteIQ\previous), then builds the report - the same
rem  as pressing 2_MAKE_THE_REPORT.bat. Nothing sends by itself.
rem
rem  Different Downloads folder? Drag it onto this .bat.
rem ==================================================================
cd /d "%~dp0" 2>nul
if not exist "%~dp0_RUN.bat" (
    echo  _RUN.bat is missing - extract the whole zip first, then press this.
    pause
    exit /b 2
)
call "%~dp0_RUN.bat" pull_siteiq_exports.py %*
set "RC=%errorlevel%"
if not "%RC%"=="0" (
    echo.
    echo  The exports were not all pulled, so the report was not built.
    echo  Read the message above, then press this button again.
    pause
    exit /b %RC%
)
echo.
call "%~dp0_RUN.bat" build_onhire_workbook.py
set "RC=%errorlevel%"
echo.
if not "%RC%"=="0" (
    echo ------------------------------------------------------------------
    echo  IT DID NOT FINISH. Read the message above - it says what to fix.
    echo ------------------------------------------------------------------
    echo.
)
pause
exit /b %RC%
