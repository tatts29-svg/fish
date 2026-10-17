@echo off
title Coates Ampol - 12 Pull SiteIQ Exports
rem ============================================================
rem  COATES - AMPOL TOOL STORE (Lytton Refinery)
rem  12 - PULL SITEIQ EXPORTS (files fresh Downloads exports into Data)
rem  Author: Andrew Fisher - POWERED BY SITEIQ
rem
rem  Every report reads its Excels from Data\  - one area, always.
rem  Output lands in Reports\(today's date) - dated, never overwritten.
rem  Emails only ever land as Outlook DRAFTS - nothing sends itself.
rem ============================================================
cd /d "%~dp0"
set "PYCMD=python"
where py >nul 2>nul && set "PYCMD=py -3"

%PYCMD% PULL_SITEIQ_EXPORTS.py %*
echo.
echo  Done.
echo.
pause
