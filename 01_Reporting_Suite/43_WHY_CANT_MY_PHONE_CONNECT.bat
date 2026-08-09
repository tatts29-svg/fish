@echo off
rem ==========================================================
rem  COATES | WHY CAN'T MY PHONE CONNECT
rem
rem  "Can't reach this site" means four different things and
rem  they all look identical on a phone. This walks the chain
rem  from this laptop and stops at the first real problem:
rem
rem    1  is the server running
rem    2  is it listening on the network
rem    3  is the firewall letting it through
rem    4  is the ethernet network Private, not Public
rem    5  what address the phone should be using
rem
rem  Run 31_START_GEAR_LOOKUP_HTTPS.bat FIRST and leave it
rem  open, then run me in a second window.
rem ==========================================================
cd /d "%~dp0"
call "%~dp0_RUN.bat" WHY_NO_CONNECT.py
pause
