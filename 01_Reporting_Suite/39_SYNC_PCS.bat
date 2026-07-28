@echo off
rem ==========================================================
rem  COATES | SYNC PCS - keep both machines level
rem
rem  Run it on the machine that is UP TO DATE and choose 1
rem  (SEND). Then run it on the other machine and choose 2
rem  (RECEIVE).
rem
rem  Scripts: newest wins, replaced files are backed up, and
rem  it compile-checks everything before it calls it done.
rem
rem  Your registers and the address book are NEVER overwritten.
rem  It tells you how they differ and lets you decide.
rem
rem  First run asks for a folder both machines can see - a USB
rem  stick or a personal OneDrive folder. It remembers it.
rem ==========================================================
cd /d "%~dp0"
where py >nul 2>nul && (py SYNC_PCS.py %*) || (python SYNC_PCS.py %*)
pause
