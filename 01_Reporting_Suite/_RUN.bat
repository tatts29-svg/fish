@echo off
rem =====================================================================
rem  COATES | _RUN.bat - THE SHARED LAUNCHER
rem  Author: Andrew Fisher | POWERED BY SITEIQ
rem
rem  Every numbered button calls me instead of guessing at Python.
rem
rem  Why I exist: the buttons used to launch Python five different ways
rem  and three of them broke on a fresh computer.
rem    * "python" is not on PATH unless the installer's "Add to PATH"
rem      box was ticked - it is unticked by default.
rem    * Windows ships a fake python.exe that just opens the Microsoft
rem      Store. "where python" finds it, so the old check passed and the
rem      button then did nothing at all.
rem    * "where py && (py X) || (python X)" runs the script a SECOND
rem      time whenever the first run stops with an error - which is how
rem      you double-charge on 38_SUBMIT_CHARGES.
rem
rem  I find a Python 3 that genuinely runs, make sure the Excel library
rem  is there, run the script ONCE, and hand back its exit code.
rem
rem  Usage from a button:   call "%~dp0_RUN.bat" SCRIPT.py %*
rem =====================================================================
setlocal EnableExtensions
cd /d "%~dp0"

if "%~1"=="" (
    echo.
    echo _RUN.bat was called without a script name. That is a fault in
    echo the button you pressed, not in your computer.
    echo.
    exit /b 2
)
set "SCRIPT=%~1"

if not exist "%~dp0%SCRIPT%" (
    echo.
    echo PROBLEM: %SCRIPT% is not in this folder:
    echo    %~dp0
    echo.
    echo Fix: extract the kit zip FULLY first - don't run files from
    echo inside the zip preview window. Everything has to land in the
    echo same folder.
    echo.
    exit /b 2
)

rem  A script in a sub-kit (the Charge Reporter) runs from its own
rem  folder, same as it did when it had its own launcher.
for %%F in ("%~dp0%SCRIPT%") do (
    set "SCRIPTDIR=%%~dpF"
    set "SCRIPTNAME=%%~nxF"
)

rem  Keep every argument after the script name, exactly as typed.
set "ARGS=%*"
call set "ARGS=%%ARGS:*%1=%%"

call :find_python
if not defined PYEXE (
    echo.
    echo ==================================================================
    echo  PYTHON 3 IS NOT ON THIS COMPUTER
    echo ==================================================================
    echo.
    echo  Nothing in the suite can run without it. It is free and takes
    echo  about two minutes:
    echo.
    echo    1. Go to  https://www.python.org/downloads/
    echo    2. Press the big yellow "Download Python" button
    echo    3. Run the installer and TICK "Add python.exe to PATH"
    echo       (bottom of the first screen - it is easy to miss)
    echo    4. Press Install Now, wait, then Close
    echo    5. Press this button again
    echo.
    echo  If you think Python IS installed, it was probably installed
    echo  without that PATH box ticked. Re-run the installer, choose
    echo  Modify, and tick it.
    echo.
    exit /b 2
)

call :check_openpyxl
if errorlevel 1 exit /b 2

cd /d "%SCRIPTDIR%"
"%PYEXE%" "%SCRIPTNAME%" %ARGS%
exit /b %errorlevel%

rem ---------------------------------------------------------------------
rem  Find a Python that actually runs. Every candidate has to prove it
rem  by printing its own path - the Store stub prints nothing, so it
rem  fails the test instead of silently swallowing the button.
rem ---------------------------------------------------------------------
:find_python
set "PYEXE="

rem  1. the py launcher. Installed by every python.org install, works
rem     whether or not PATH was ticked, and -3 pins it to Python 3.
for /f "usebackq delims=" %%P in (`py -3 -c "import sys;print(sys.executable)" 2^>nul`) do set "PYEXE=%%P"
if defined PYEXE goto :eof

rem  2. python on PATH - only counts if it prints a real path AND is
rem     version 3. The Store stub prints nothing and drops out here.
for /f "usebackq delims=" %%P in (`python -c "import sys;print(sys.executable if sys.version_info[0]==3 else '')" 2^>nul`) do set "PYEXE=%%P"
if defined PYEXE goto :eof

for /f "usebackq delims=" %%P in (`python3 -c "import sys;print(sys.executable)" 2^>nul`) do set "PYEXE=%%P"
if defined PYEXE goto :eof

rem  3. not on PATH at all - look where the installers actually put it.
call :try_folder "%LOCALAPPDATA%\Programs\Python"
if defined PYEXE goto :found_off_path
call :try_folder "%ProgramFiles%\Python"
if defined PYEXE goto :found_off_path
call :try_folder "%ProgramFiles(x86)%\Python"
if defined PYEXE goto :found_off_path
call :try_folder "C:\Python"
if defined PYEXE goto :found_off_path
goto :eof

:found_off_path
echo   Note: Python is installed but not on this computer's PATH.
echo   Using %PYEXE%
echo   (Everything works. To tidy it up one day, re-run the Python
echo    installer, choose Modify, and tick "Add python.exe to PATH".)
goto :eof

rem  A folder full of Python3x installs - take the first one that runs.
:try_folder
if not exist "%~1" goto :eof
set "CAND="
for /f "delims=" %%P in ('dir /b /s "%~1\python.exe" 2^>nul') do if not defined CAND set "CAND=%%~dpP"
if not defined CAND goto :eof
rem  Prove it runs. Stepping into its own folder first means a path with
rem  spaces in it can't break the quoting.
pushd "%CAND%"
for /f "usebackq delims=" %%Q in (`python.exe -c "import sys;print(sys.executable)" 2^>nul`) do set "PYEXE=%%Q"
popd
goto :eof

rem ---------------------------------------------------------------------
rem  The Excel library reads and writes every workbook in the suite.
rem  Without it nothing works, so put it on rather than failing with a
rem  traceback nobody can read.
rem ---------------------------------------------------------------------
:check_openpyxl
"%PYEXE%" -c "import openpyxl" >nul 2>nul
if not errorlevel 1 exit /b 0
echo   First run on this computer - installing openpyxl (needs internet,
echo   about 20 seconds). You only see this once.
"%PYEXE%" -m pip install --quiet --disable-pip-version-check openpyxl >nul 2>nul
"%PYEXE%" -c "import openpyxl" >nul 2>nul
if not errorlevel 1 (
    echo   Done - openpyxl installed.
    exit /b 0
)
echo.
echo ==================================================================
echo  THE EXCEL LIBRARY IS MISSING AND I COULD NOT INSTALL IT
echo ==================================================================
echo.
echo  Nothing can read a workbook without it. Two likely reasons:
echo.
echo    * No internet on this machine right now. Get on the site
echo      Wi-Fi or hotspot and press the button again.
echo    * The company proxy blocked it. Open Command Prompt and run:
echo         "%PYEXE%" -m pip install openpyxl
echo      and read what it says.
echo.
exit /b 1
