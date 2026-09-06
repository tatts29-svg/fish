@echo off
title Coates Ampol - 18 Gas monitors on hire by company
rem ============================================================
rem  COATES - AMPOL TOOL STORE (Lytton Refinery)
rem  18 - GAS MONITORS ON HIRE BY COMPANY (the gas report's companion)
rem       Every company and person holding a fleet gas monitor, A to Z
rem       both ways, monitors out 2 days or more highlighted. Built by
rem       01 and 00 as well; this button rebuilds it on its own. Goes
rem       out as the second attachment on the gas monitor email.
rem  Author: Andrew Fisher - POWERED BY SITEIQ
rem
rem  Output lands in Reports\(today's date)\Gas_Monitors - dated, never overwritten.
rem ============================================================
cd /d "%~dp0"
set "PYCMD=python"
where py >nul 2>nul && set "PYCMD=py -3"

%PYCMD% build_gas_onhire_register.py
echo.
echo.
pause
