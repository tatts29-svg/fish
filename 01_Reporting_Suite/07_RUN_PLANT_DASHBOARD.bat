@echo off
rem ==========================================================
rem  COATES | K2 PLANT ON SITE DASHBOARD
rem  Cement Australia K2 Shutdown 2026 - Gladstone
rem  Author: Andrew Fisher | POWERED BY SITEIQ
rem  Double-click me. Builds the shareable Plant On Site
rem  dashboard from this folder's SiteIQ exports.
rem  Output lands in Reports\<today's date>\  - one folder per day
rem ==========================================================
cd /d "%~dp0"

call "%~dp0_RUN.bat" build_plant_dashboard.py %*

echo.
pause
