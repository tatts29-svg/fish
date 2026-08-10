@echo off
rem =====================================================================
rem  COATES | REFRESH_THE_REPORT.bat - THE OLD NAME, STILL WORKS
rem  Author: Andrew Fisher | POWERED BY SITEIQ
rem
rem  The button is now called 2_MAKE_THE_REPORT.bat, so the folder reads
rem  in the order you press it: 1 check, 2 make, 3 only if 1 tells you.
rem
rem  This file stays behind so an existing desktop shortcut, or anybody
rem  who already knows the old name, still lands in the right place.
rem  Nothing is duplicated - it just calls the real button.
rem =====================================================================
cd /d "%~dp0"
if not exist "%~dp0_RUN.bat" (
    echo.
    echo ==================================================================
    echo  SOME OF THE KIT IS MISSING
    echo ==================================================================
    echo.
    echo  _RUN.bat isn't in this folder, and nothing can start without it.
    echo.
    echo  This nearly always means the button was pressed while it was
    echo  still inside the zip. Windows unpacks one file at a time when
    echo  you do that, so everything else was left behind.
    echo.
    echo  FIX: right-click the zip, choose "Extract All...", put it on the
    echo  Desktop, and press the button in the folder that comes out.
    echo.
    pause
    exit /b 2
)
call "%~dp0_RUN.bat" build_onhire_workbook.py %*
set "RC=%errorlevel%"
echo.
if not "%RC%"=="0" (
    echo ------------------------------------------------------------------
    echo  IT DID NOT FINISH. Read the message above - it says what to fix.
    echo  Still stuck? Press 1_CHECK_THIS_LAPTOP.bat and send Andrew the
    echo  LAPTOP_CHECK.txt file it makes.
    echo ------------------------------------------------------------------
    echo.
)
pause
exit /b %RC%
