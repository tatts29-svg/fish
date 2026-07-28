@echo off
rem ==========================================================
rem  COATES | MAKE OUTLOOK DRAFTS
rem  Saves today's report emails as NATIVE Outlook drafts -
rem  full To address search works because they are real
rem  Outlook messages, not .eml files.
rem  Author: Andrew Fisher | POWERED BY SITEIQ
rem ==========================================================
cd /d "%~dp0"
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0MAKE_OUTLOOK_DRAFTS.ps1" -Force %*
echo.
pause
