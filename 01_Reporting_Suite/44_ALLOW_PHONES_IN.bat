@echo off
rem ==========================================================
rem  COATES | ALLOW PHONES IN - the firewall hole, one click
rem  Cement Australia K2 Shutdown 2026 - Gladstone
rem  Author: Andrew Fisher | POWERED BY SITEIQ
rem
rem  WHY (Andrew, 28 Jul 2026): "I got a touch can't get option
rem  to push run as administration."
rem
rem  Fair enough - hunting for "Run as administrator" in a
rem  menu is not a job. Just double-click me. I ask Windows
rem  for permission myself; say YES to the blue box and the
rem  rule goes in.
rem
rem  What it does: lets phones on the store router reach My
rem  Gear on ports 8443 and 8123. Nothing else. It does not open the
rem  machine to the internet - the rule is for the local
rem  network only, and only for that one port.
rem ==========================================================
setlocal
set PORTS=8443 8123
set RULE=Coates My Gear

rem ---- are we already running as administrator? -------------
net session >nul 2>&1
if %errorlevel% equ 0 goto :doit

rem ---- no: ask Windows to restart me with permission --------
echo.
echo  Asking Windows for permission...
echo  A blue box will appear - click YES.
echo.
powershell -NoProfile -Command "Start-Process -FilePath '%~f0' -Verb RunAs" >nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo  Windows would not let me ask for permission.
    echo.
    echo  Do it by hand instead:
    echo    1. Press the Windows key
    echo    2. Type:  cmd
    echo    3. Press CTRL + SHIFT + ENTER   ^(not just Enter^)
    echo    4. Click YES
    echo    5. Paste this line and press Enter:
    echo.
    echo       netsh advfirewall firewall add rule name="%RULE%" dir=in action=allow protocol=TCP localport=8443,8123 profile=private remoteip=localsubnet
    echo.
    pause
)
exit /b

:doit
echo ==========================================================
echo  COATES ^| ALLOW PHONES IN
echo ==========================================================
echo.

rem  Remove any older copy first so running this twice can never
rem  leave two rules doing the same job.
netsh advfirewall firewall delete rule name="%RULE%" >nul 2>&1

rem  BOTH doors: 8443 is the secure server (31_), 8123 the plain one
rem  (05_). Opening only one meant switching servers silently shut the
rem  phones out again. (Andrew, 28 Jul 2026.)
rem
rem  PRIVATE profile and the LOCAL subnet only (tightened 28 Jul 2026):
rem  the store router is a Private network, so that is all the phones
rem  ever need. Domain (the Coates corporate network) and anything
rem  routed in from another network stay shut - My Gear is for the
rem  store Wi-Fi, nowhere else.
netsh advfirewall firewall add rule name="%RULE%" dir=in action=allow protocol=TCP localport=8443,8123 profile=private remoteip=localsubnet
if %errorlevel% equ 0 (
    echo  DONE - phones on the store network can now reach BOTH
    echo  port 8443 ^(secure^) and port 8123 ^(plain^).
    echo.
    echo  Note: allowed on Private networks and the store's own
    echo  subnet only. On the work network, or a public one - a
    echo  cafe, an airport - this stays shut.
) else (
    echo  That did not work. Send Claude this screen.
)
echo.
echo  Now check it:
echo    1. 31_START_GEAR_LOOKUP_HTTPS.bat   ^(leave it open^)
echo    2. 43_WHY_CANT_MY_PHONE_CONNECT.bat
echo.
pause
