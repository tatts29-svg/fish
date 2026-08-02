@echo off
title COATES ^| WHO'S GOT WHAT - a supervisor's crew
cd /d "%~dp0"
python build_crew_onhire.py
echo.
echo   Builds Gear_Lookup\crew.html - hand a supervisor the store Wi-Fi
echo   and this page. He types his company name, first word is enough,
echo   hits enter, and gets his blokes in alphabetical order with a
echo   count against each one.
echo.
echo   He can leave it on Everyone or pick one bloke, and Print gives
echo   him whichever he is looking at - one worker per block so it
echo   tears up cleanly.
echo.
echo   NO money on it. NO photos. NOT their profile - gear only.
echo.
echo   IT IS NOT GATED. Anyone on the store Wi-Fi who opens it can type
echo   any company name. If you want it behind the stores code, say so
echo   and it moves.
echo.
pause
