@echo off
rem ==========================================================
rem  COATES | ALIGN EXCEL - VISIBLE MODE (new computer / stuck)
rem
rem  Same align as button 13, but Excel runs ON SCREEN so you can
rem  SEE and CLICK any first-run dialog (licence, sign-in,
rem  Protected View, Power Query credentials). Use this ONCE on a
rem  new machine - after that, button 13 works silently as normal.
rem
rem  Don't touch Excel while it works - just answer any dialog.
rem ==========================================================
cd /d "%~dp0"
set COATES_EXCEL_VISIBLE=1
echo.
echo  Excel will open ON SCREEN. Answer any prompts it shows,
echo  then leave it alone until you see "Done." below.
echo.
where py >nul 2>nul && (py _align_prep.py) || (python _align_prep.py)
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0ALIGN_EXCEL_DATA.ps1"
where py >nul 2>nul && (py verify_excel_alignment.py) || (python verify_excel_alignment.py)
set COATES_EXCEL_VISIBLE=
pause
