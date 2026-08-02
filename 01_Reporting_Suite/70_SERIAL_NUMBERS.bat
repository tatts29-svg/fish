@echo off
title COATES ^| SERIAL NUMBERS
cd /d "%~dp0"
python serial_report.py
echo.
echo   Fleet_No in the Baseplan export is the Item_Number, and
echo   Serial_No is that item's serial. This reads the file in
echo   Data_Serials\ and says what it is actually worth here.
echo.
echo   The serial then shows beside the plant number on Fleet
echo   Details (68) and on the supervisor screen (69) - our name
echo   for the machine and the manufacturer's, together.
echo.
echo   Tooling has no serial and never will - a length of ducting
echo   does not have one - so those lines stay blank rather than
echo   showing a made-up number.
echo.
echo   A serial that reads Coates1015032 or TBA is NOT counted as
echo   a serial. That is our own plant number handed back to us,
echo   and it proves nothing on a damage claim. Those go in
echo   SERIALS_TO_FIX.csv so they can be fixed in Baseplan.
echo.
echo   New export? Drop it in Data_Serials\ and run this again.
echo.
pause
