@echo off
rem ==========================================================
rem  COATES | UPDATE POSTERS
rem  Keeps the poster artwork exactly as it is and refreshes
rem  only the QR codes - the Wi-Fi join code and the My Gear
rem  address - then reprints the PDFs ready for the wall.
rem  Run me whenever the store's address or port changes.
rem ==========================================================
cd /d "%~dp0"
call "%~dp0_RUN.bat" UPDATE_POSTERS.py
pause
