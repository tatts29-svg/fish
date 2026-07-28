@echo off
rem ==========================================================
rem  COATES | SWITCH ON
rem  Decides who actually RECEIVES their company's report.
rem
rem  The contacts import always leaves new people switched off
rem  on purpose. This is where you turn them on.
rem
rem  Shows every company with how much gear they're holding
rem  and how many of their contacts are on. Type the number,
rem  they go on. Type "4 off" and they go off again.
rem
rem  Backs the book up before it writes anything.
rem ==========================================================
cd /d "%~dp0"
where py >nul 2>nul && (py SWITCH_ON.py %*) || (python SWITCH_ON.py %*)
pause
