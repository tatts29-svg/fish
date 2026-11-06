@echo off
title Coates Ampol - 15 Daily Position
rem ============================================================
rem  COATES - AMPOL TOOL STORE (Lytton Refinery)
rem  15 - DAILY POSITION (the six families on one A4 page - each
rem       report's own RAG status, number and next action, read back
rem       from what it recorded this morning; run after the six)
rem  Author: Andrew Fisher - POWERED BY SITEIQ
rem
rem  Every report reads its Excels from Data\  - one area, always.
rem  Output lands in Reports\(today's date) - dated, never overwritten.
rem  Emails only ever land as Outlook DRAFTS - nothing sends itself.
rem ============================================================
cd /d "%~dp0"
set "PYCMD=python"
where py >nul 2>nul && set "PYCMD=py -3"

%PYCMD% build_daily_position.py
echo.
echo.
pause
