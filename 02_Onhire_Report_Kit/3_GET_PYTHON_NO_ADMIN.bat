@echo off
rem =====================================================================
rem  COATES | GET PYTHON - NO ADMIN RIGHTS NEEDED
rem  Author: Andrew Fisher | POWERED BY SITEIQ
rem
rem  ONLY press me if 1_CHECK_THIS_LAPTOP.bat told you Python is missing
rem  or too old. If it didn't, you don't need me.
rem
rem  What I do: fetch Python's own "embeddable" package - a zip, not an
rem  installer - and unpack it into a folder called _python inside this
rem  kit. That means:
rem
rem    * NO admin rights and no IT ticket. Nothing is installed.
rem    * NOTHING on the computer changes. No PATH, no registry, no
rem      Program Files. If a laptop already has a Python that some other
rem      system depends on, I don't touch it.
rem    * To undo me completely, delete the _python folder.
rem
rem  I need the internet for about thirty seconds. If the company
rem  network blocks it, do this on the site Wi-Fi or a phone hotspot -
rem  or ask IT for "Python 3 from python.org" instead.
rem =====================================================================
setlocal EnableExtensions
set "KIT=%~dp0"
cd /d "%KIT%"

set "PYVER=3.12.7"
set "ARCH=amd64"
if /i "%PROCESSOR_ARCHITECTURE%"=="ARM64" set "ARCH=arm64"
set "URL=https://www.python.org/ftp/python/%PYVER%/python-%PYVER%-embed-%ARCH%.zip"
set "ZIP=%TEMP%\coates_python_%PYVER%_%ARCH%.zip"

echo ==================================================================
echo  COATES ^| GETTING PYTHON FOR THIS LAPTOP
echo ==================================================================
echo.

if exist "%KIT%_python\python.exe" (
    echo  There is already a private copy of Python in this kit:
    echo     %KIT%_python\python.exe
    echo.
    echo  Nothing to do. Press 2_MAKE_THE_REPORT.bat.
    echo.
    pause
    exit /b 0
)

echo  Getting Python %PYVER% ^(%ARCH%^) from python.org.
echo  About 11 MB. Nothing is installed - it unpacks into this folder.
echo.

powershell -NoProfile -ExecutionPolicy Bypass -Command ^
 "$ErrorActionPreference='Stop';" ^
 "try {" ^
 "  [Net.ServicePointManager]::SecurityProtocol=[Net.SecurityProtocolType]::Tls12;" ^
 "  Invoke-WebRequest -Uri '%URL%' -OutFile '%ZIP%' -UseBasicParsing;" ^
 "  Expand-Archive -LiteralPath '%ZIP%' -DestinationPath '%KIT%_python' -Force;" ^
 "  exit 0" ^
 "} catch { Write-Host $_.Exception.Message; exit 1 }"

if errorlevel 1 goto :failed
if not exist "%KIT%_python\python.exe" goto :failed

rem ---------------------------------------------------------------------
rem  The embeddable package deliberately runs "isolated": it ships a
rem  python3xx._pth file that pins the search path and makes it ignore
rem  PYTHONPATH. Left alone that is fine for us, because the report
rem  script adds the kit's _lib folder to its own path on the way in -
rem  but spelling it out here as well means anything else in the kit
rem  works too, and it is one less trap for the next person.
rem ---------------------------------------------------------------------
for %%F in ("%KIT%_python\python*._pth") do (
    findstr /c:"..\\_lib" "%%F" >nul 2>nul || (
        echo ..\_lib>>"%%F"
        echo import site>>"%%F"
    )
)

for /f "usebackq delims=" %%V in (`"%KIT%_python\python.exe" -c "import sys;print(sys.version.split()[0])" 2^>nul`) do set "GOT=%%V"
if not defined GOT goto :failed

"%KIT%_python\python.exe" -c "import sys;sys.path.insert(0,r'%KIT%_lib');import openpyxl" >nul 2>nul
if errorlevel 1 goto :lib_problem

del "%ZIP%" >nul 2>nul

echo.
echo ==================================================================
echo  DONE - Python %GOT% is now in this kit
echo ==================================================================
echo.
echo  It lives in:  %KIT%_python
echo  Nothing else on this computer was changed.
echo.
echo  NEXT: double-click  2_MAKE_THE_REPORT.bat
echo.
pause
exit /b 0

:lib_problem
echo.
echo  Python came down fine, but it can't see the kit's Excel library.
echo  Press 1_CHECK_THIS_LAPTOP.bat and send Andrew the LAPTOP_CHECK.txt
echo  it writes.
echo.
pause
exit /b 1

:failed
echo.
echo ==================================================================
echo  COULDN'T GET IT - and it will be one of these three
echo ==================================================================
echo.
echo  1. NO INTERNET on this laptop right now.
echo     Get on the site Wi-Fi or a phone hotspot and press me again.
echo.
echo  2. THE COMPANY NETWORK BLOCKED IT.
echo     Try a phone hotspot. If that works, it was the proxy.
echo.
echo  3. POWERSHELL IS LOCKED DOWN on this build of Windows.
echo     Nothing to be done from here. Ask IT for:
echo        "Python 3, from python.org, and tick Add python.exe to PATH"
echo     It is free, it is standard, and it needs no licence.
echo.
echo  Or the simplest fix of all: Andrew runs the report on his laptop
echo  and emails you the finished .eml and workbook. You don't need
echo  Python at all just to READ or SEND the report - only to build it.
echo.
pause
exit /b 1
