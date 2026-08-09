@echo off
rem ==========================================================
rem  COATES | INVOICE BREAKDOWN - what the SiteIQ invoice is made of
rem  Cement Australia K2 Shutdown 2026 - Gladstone
rem  Author: Andrew Fisher | POWERED BY SITEIQ
rem
rem  SiteIQ renders the month's invoice as one line. This builds
rem  the professional companion page: the invoice broken into its
rem  streams, the hire split Plant / Tooling / Gear, and each laid
rem  out by SiteIQ's own product groups. Attach the PDF alongside
rem  the invoice.
rem
rem  Best run AFTER the morning SiteIQ downloads (post 09:30) so
rem  the last day's charge lines are in. Builds the latest billing
rem  month by default; for a specific month:
rem      54_RUN_INVOICE_BREAKDOWN.bat 2026-07
rem ==========================================================
cd /d "%~dp0"

call "%~dp0_RUN.bat" build_invoice_breakdown.py %*

echo.
pause
