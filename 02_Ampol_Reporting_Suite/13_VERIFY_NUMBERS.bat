@echo off
title Coates Ampol - 13 Verify Numbers
rem ============================================================
rem  COATES - AMPOL TOOL STORE (Lytton Refinery)
rem  13 - VERIFY NUMBERS (the truth table - a second, independent
rem       count of today's key figures straight from the exports,
rem       checked against the pages built today)
rem  Author: Andrew Fisher - POWERED BY SITEIQ
rem
rem  Every report reads its Excels from Data\  - one area, always.
rem  Output lands in Reports\(today's date) - dated, never overwritten.
rem  Emails only ever land as Outlook DRAFTS - nothing sends itself.
rem ============================================================
cd /d "%~dp0"
set "PYCMD=python"
where py >nul 2>nul && set "PYCMD=py -3"

%PYCMD% VERIFY_NUMBERS.py %*
echo.
echo  The table is also saved as Reports\(today's date)\VERIFY_NUMBERS.txt
echo.
pause
