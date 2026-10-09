@echo off
title Coates Ampol - 14 Archive Old Workbooks
rem ============================================================
rem  COATES - AMPOL TOOL STORE (Lytton Refinery)
rem  14 - ARCHIVE OLD WORKBOOKS (parks the three .xlsm workbooks that
rem       no report reads any more in Data\_Archive_workbooks\ -
rem       nothing deleted, nothing overwritten, safe to run twice)
rem  Author: Andrew Fisher - POWERED BY SITEIQ
rem
rem  Every report reads its Excels from Data\  - one area, always.
rem  Output lands in Reports\(today's date) - dated, never overwritten.
rem  Emails only ever land as Outlook DRAFTS - nothing sends itself.
rem ============================================================
cd /d "%~dp0"
set "PYCMD=python"
where py >nul 2>nul && set "PYCMD=py -3"

%PYCMD% archive_old_workbooks.py
echo.
echo.
pause
