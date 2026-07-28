@echo off
rem ==========================================================
rem  COATES | MOVE TO LOCAL (C:\K2)
rem  OneDrive\Desktop fights Excel automation - permission
rem  errors, cloud-only files, folder protection. This copies
rem  the whole kit to C:\K2 and proves it opens there.
rem  Nothing is deleted - the old folder stays as your backup.
rem ==========================================================
cd /d "%~dp0"
where py >nul 2>nul && (py MOVE_TO_LOCAL.py) || (python MOVE_TO_LOCAL.py)
pause
