@echo off
rem =====================================================================
rem  COATES | REFRESH THE ON-HIRE REPORT
rem  Author: Andrew Fisher | POWERED BY SITEIQ
rem
rem  1. Put today's SiteIQ exports in Data_SiteIQ (over the top of
rem     yesterday's): RENTAL_STOCK, SALES_STOCK, TRANSACTIONS.
rem     STOCKTAKE too if you have it.
rem  2. Double-click me.
rem  3. Open the workbook that appears. Start on the Cover tab.
rem
rem  Full instructions: START_HERE.txt or HOW_IT_WORKS.html
rem =====================================================================
cd /d "%~dp0"
call "%~dp0_RUN.bat" build_onhire_workbook.py %*
echo.
pause
