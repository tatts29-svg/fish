@echo off
rem =====================================================================
rem  COATES | MAKE THE ON-HIRE REPORT
rem  Author: Andrew Fisher | POWERED BY SITEIQ
rem
rem  1. Put today's SiteIQ exports in the Data_SiteIQ folder, straight
rem     over the top of yesterday's: RENTAL_STOCK, SALES_STOCK,
rem     TRANSACTIONS. STOCKTAKE too if you have it.
rem  2. Double-click me.
rem  3. Open the two things that appear - the workbook and the email.
rem
rem  Nothing sends by itself. The email opens as a DRAFT and waits.
rem
rem  Full instructions: 0_START_HERE.txt or HOW_IT_WORKS.html
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
    echo.
    echo  Still stuck? Press 1_CHECK_THIS_LAPTOP.bat, then send Andrew the
    echo  LAPTOP_CHECK.txt file it makes. That tells him everything he
    echo  needs to know without a single question back.
    echo ------------------------------------------------------------------
    echo.
)
pause
exit /b %RC%
