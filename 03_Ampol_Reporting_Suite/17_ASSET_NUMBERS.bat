@echo off
title Coates Ampol - 17 Asset numbers
rem ============================================================
rem  COATES - AMPOL TOOL STORE (Lytton Refinery)
rem  17 - ASSET NUMBERS (which number to give new gear)
rem       One row per main number: description as SiteIQ writes it,
rem       highest /NNN used, the next number and the next ten, the
rem       unused numbers below it, and the next new main number per
rem       family (AMP, WG, CTX ...). Generated from RENTAL_STOCK and
rem       the transaction log - never typed in, never edit the file.
rem  Author: Andrew Fisher - POWERED BY SITEIQ
rem
rem  Output lands in Reports\(today's date)\Asset_Numbers - dated, never overwritten.
rem ============================================================
cd /d "%~dp0"
set "PYCMD=python"
where py >nul 2>nul && set "PYCMD=py -3"

%PYCMD% build_asset_numbers.py
echo.
echo.
pause
