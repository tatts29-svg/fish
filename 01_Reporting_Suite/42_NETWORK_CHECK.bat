@echo off
rem ==========================================================
rem  COATES | NETWORK CHECK - which address do the phones use
rem
rem  Your laptop is on the building Wi-Fi AND the store router
rem  at the same time, so it has TWO addresses. Only the
rem  router one is any use to a phone.
rem
rem  This lists them and says which to put on the poster.
rem  Also opens the firewall hole if you run it as admin.
rem ==========================================================
cd /d "%~dp0"
where py >nul 2>nul && (py net_pick.py) || (python net_pick.py)
echo.
echo  ----------------------------------------------------------
echo   If phones still cannot open the page, Windows Firewall is
echo   blocking it. Run this ONCE, right-click - Run as
echo   administrator:
echo.
echo     netsh advfirewall firewall add rule name="Coates My Gear"
echo       dir=in action=allow protocol=TCP localport=8443
echo.
echo   And make sure the ETHERNET network is set to Private:
echo     Settings - Network ^& internet - Ethernet - Private
echo  ----------------------------------------------------------
pause
