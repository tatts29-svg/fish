@echo off
title COATES ^| SHIFT AND COUNTER INTEL - day v night
cd /d "%~dp0"
python build_shift_intel.py
echo.
echo   Full transparency on the counter and the shifts.
echo.
echo   COUNTER SEARCH  every issue and return with its clock, 500 each
echo                   way. Type a rough time like 10:3, or a name, a
echo                   company, an item number or a word off the gear.
echo   WHEN IT IS BUSY every movement by hour - the peaks are the
echo                   handovers, the flat hours are where a job can go.
echo   DAY V NIGHT     what each shift issued, returned and counted,
echo                   with the aisles they actually walked.
echo   SCAN PACE       your five-second rule, measured only on real
echo                   stocktake rows and only on DIFFERENT items - a
echo                   stack of 70 identical chutes is one look.
echo.
echo   COATES INTERNAL. It names individuals and their pace, so it
echo   lives in Reports\ and never goes on the store Wi-Fi.
echo.
pause
