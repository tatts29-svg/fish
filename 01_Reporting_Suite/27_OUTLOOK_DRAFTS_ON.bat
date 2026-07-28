@echo off
rem ==========================================================
rem  COATES | OUTLOOK DRAFTS - ON  (the normal setting)
rem ==========================================================
cd /d "%~dp0"
if exist "%~dp0NO_OUTLOOK.txt" del "%~dp0NO_OUTLOOK.txt"
echo.
echo  Outlook drafts: ON - drafts will be built in Outlook again.
echo.
pause
