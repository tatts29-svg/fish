@echo off
title Coates Ampol - 04 Tooling Reports
rem ============================================================
rem  COATES - AMPOL TOOL STORE (Lytton Refinery)
rem  04 - TOOL STORE REPORTS (exec, ONE on-hire register A-Z, quarterly
rem       charges, utilisation, compliance). Per-company reports are off by
rem       default (02 Sep 2026) - one-off: build_ampol_tooling_report.py --company NAME
rem  Counts from Data\RENTAL_STOCK, TRANSACTIONS and STOCKTAKE (SiteIQ pulls).
rem  The tooling workbook is NOT read - nothing to refresh (02 Sep 2026).
rem  Author: Andrew Fisher - POWERED BY SITEIQ
rem
rem  Every report reads its Excels from Data\  - one area, always.
rem  Output lands in Reports\(today's date) - dated, never overwritten.
rem  Emails only ever land as Outlook DRAFTS - nothing sends itself.
rem ============================================================
cd /d "%~dp0"
set "PYCMD=python"
where py >nul 2>nul && set "PYCMD=py -3"

%PYCMD% build_ampol_tooling_report.py --everything
echo.
echo  Done. Today's output: Reports\(today's date)\Tooling
echo.
pause
