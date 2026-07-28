@echo off
rem ==========================================================
rem  COATES | TIDY THE FOLDER - readable again
rem  Cement Australia K2 Shutdown 2026 - Gladstone
rem  Author: Andrew Fisher | POWERED BY SITEIQ
rem
rem  Moves the read-once paperwork into Docs\ and the dated
rem  one-offs and applied update zips into _Archive\. Nothing
rem  is deleted, no code or register ever moves - the buttons
rem  and their engines stay together so everything keeps
rem  working. Safe to run any time, safe to run twice.
rem
rem  For the gigabytes in old report days: 45_ARCHIVE_OLD_
rem  REPORTS.bat is the one that zips and clears those.
rem ==========================================================
cd /d "%~dp0"
where py >nul 2>nul && (py TIDY_THE_FOLDER.py %*) || (python TIDY_THE_FOLDER.py %*)
echo.
pause
