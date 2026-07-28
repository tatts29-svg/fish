@echo off
rem ==========================================================
rem  COATES | APPLY UPDATE - one click
rem  Save the little K2_UPDATE_*.zip from chat (here or in
rem  Downloads), then double-click me. It installs the update,
rem  backs up what it replaces, and self-checks.
rem ==========================================================
cd /d "%~dp0"
where py >nul 2>nul && (py apply_update.py) || (python apply_update.py)
pause
