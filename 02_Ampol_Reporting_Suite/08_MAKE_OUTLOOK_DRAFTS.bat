@echo off
title Coates Ampol - 08 Make Outlook Drafts
rem ============================================================
rem  COATES - AMPOL TOOL STORE (Lytton Refinery)
rem  08 - MAKE OUTLOOK DRAFTS (from today's built reports)
rem  Author: Andrew Fisher - POWERED BY SITEIQ
rem
rem  Every report reads its Excels from Data\  - one area, always.
rem  Output lands in Reports\(today's date) - dated, never overwritten.
rem  Emails only ever land as Outlook DRAFTS - nothing sends itself.
rem ============================================================
cd /d "%~dp0"
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0MAKE_OUTLOOK_DRAFTS.ps1" %*
echo.
echo  Every email is a DRAFT in Outlook. Nothing has been sent.
echo.
pause
