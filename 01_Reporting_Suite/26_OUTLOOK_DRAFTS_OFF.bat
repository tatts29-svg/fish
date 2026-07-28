@echo off
rem ==========================================================
rem  COATES | OUTLOOK DRAFTS - OFF
rem  Use on a machine where Outlook is not set up, or is
rem  locked to a work account. Reports and emails still build
rem  exactly as normal - the .eml files land in
rem  Reports\(today)\Emails\ ready to open and send.
rem  Run 27_OUTLOOK_DRAFTS_ON.bat to turn it back on.
rem ==========================================================
cd /d "%~dp0"
echo Outlook drafts are switched OFF on this machine.> NO_OUTLOOK.txt
echo Delete this file, or run 27_OUTLOOK_DRAFTS_ON.bat, to turn them back on.>> NO_OUTLOOK.txt
echo.
echo  Outlook drafts: OFF
echo.
echo  Everything still builds. Your emails are the .eml files in
echo  Reports\(today's date)\Emails\ - double-click one to open it,
echo  check it, press Send.
echo.
pause
