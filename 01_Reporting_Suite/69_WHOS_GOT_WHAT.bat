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
echo   MANAGER: the Costs box at the bottom takes YOUR manager code -
echo   the same one as the stores board - and puts a day rate on every
echo   line, a daily total on every bloke, and one on the company.
echo   Tap Lock to put it away before you hand the phone over.
echo.
echo   The rates are ENCRYPTED against your code, not just hidden. Get
echo   the code wrong and there is nothing in the file to read. Your
echo   code is not in the file either, only a hash of it.
echo.
echo   Tracked and client-owned gear carries no figure, same as
echo   everywhere else. A total says how many lines it left out rather
echo   than counting them as nothing.
echo.
echo   IT IS NOT GATED. Anyone on the store Wi-Fi who opens it can type
echo   any company name and see the gear - they just cannot see a
echo   figure. If you want the whole page behind the stores code, say
echo   so and it moves.
echo.
pause
