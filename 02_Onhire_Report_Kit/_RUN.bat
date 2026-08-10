@echo off
rem =====================================================================
rem  COATES | _RUN.bat - THE SHARED LAUNCHER
rem  Author: Andrew Fisher | POWERED BY SITEIQ
rem
rem  Every button calls me instead of guessing at Python. On my own I do
rem  nothing - press 1_CHECK_THIS_LAPTOP.bat or 2_MAKE_THE_REPORT.bat.
rem
rem  WHY THE KIT NOW RUNS ON A LAPTOP IT HAS NEVER BEEN ON BEFORE:
rem
rem    * I DO NOT INSTALL ANYTHING. The old version ran
rem      "pip install openpyxl" the first time, which needs the internet
rem      and a company proxy that allows it. On a locked-down laptop, or
rem      out on site with no signal, that fails - and because every byte
rem      of pip's output was thrown away it looked like the button simply
rem      hung and then died. The Excel library now travels inside the
rem      kit, in _lib. There is nothing to install, ever.
rem    * I check the kit is WHOLE before running. Double-clicking a
rem      button while it is still inside the zip window unpacks that ONE
rem      file into a temporary folder and nothing else - the single most
rem      common reason somebody is told "it doesn't work".
rem    * I check the folder isn't on a network path, which cmd cannot use
rem      as a working directory.
rem    * I find Python by EXIT CODE, never by reading its output - see
rem      the long note above :find_python. That is what stops a Microsoft
rem      Store stub, a corporate cmd banner or an accented username from
rem      being mistaken for an answer.
rem    * I say when the Python I found is too OLD, instead of claiming
rem      there isn't one.
rem    * I look for a private copy of Python inside the kit first
rem      (_python), which is what 3_GET_PYTHON_NO_ADMIN.bat puts there
rem      when the laptop hasn't got one and you can't install software.
rem
rem  Still true from before: the script runs ONCE and I hand back its
rem  exit code - never twice, which is how you double up on anything that
rem  submits.
rem
rem  Note for whoever edits me next: KIT is set once, up top, and used
rem  everywhere after. Don't go back to %~dp0 further down - "shift"
rem  moves %0 as well as the rest, so %~dp0 stops meaning this folder the
rem  moment the arguments are collected. That was a real bug.
rem
rem  Usage from a button:   call "%~dp0_RUN.bat" SCRIPT.py %*
rem =====================================================================
setlocal EnableExtensions
set "KIT=%~dp0"
cd /d "%KIT%" 2>nul

if "%~1"=="" (
    echo.
    echo ==================================================================
    echo  THIS ISN'T THE BUTTON
    echo ==================================================================
    echo.
    echo  _RUN.bat is the engine. It sorts to the top of the folder and the
    echo  name reads like "run me", so it gets double-clicked - but on its
    echo  own it does nothing at all.
    echo.
    echo  WHAT YOU ACTUALLY WANT:
    echo.
    echo     1_CHECK_THIS_LAPTOP.bat    first time on this laptop
    echo     2_MAKE_THE_REPORT.bat      every day after that
    echo.
    pause
    exit /b 2
)
set "SCRIPT=%~1"

rem ---------------------------------------------------------------------
rem  Is this folder the real thing, or one file Windows unpacked out of a
rem  zip into a temporary folder? Check that before anything else,
rem  because everything downstream fails confusingly if it isn't.
rem ---------------------------------------------------------------------
echo "%KIT%" | find /i "\Temp\" >nul
if not errorlevel 1 goto :from_inside_zip
echo "%KIT%" | find /i "\Temporary Internet Files\" >nul
if not errorlevel 1 goto :from_inside_zip
if "%KIT:~0,2%"=="\\" goto :network_path
if not exist "%KIT%_lib\openpyxl\__init__.py" goto :half_unpacked
if not exist "%KIT%%SCRIPT%" goto :half_unpacked

rem  A script in a sub-kit runs from its own folder.
for %%F in ("%KIT%%SCRIPT%") do (
    set "SCRIPTDIR=%%~dpF"
    set "SCRIPTNAME=%%~nxF"
)

rem  Keep every argument after the script name. Collected one at a time,
rem  which survives spaces, brackets and ampersands - the old substring
rem  trick did not. /1 leaves %0 alone.
set "ARGS="
shift /1
:collect
if "%~1"=="" goto :collected
set "ARGS=%ARGS% "%~1""
shift /1
goto :collect
:collected

call :find_python
if not defined PYCMD if defined ANYPY goto :python_too_old
if not defined PYCMD goto :no_python

rem  The Excel library lives in the kit. Putting it on PYTHONPATH means
rem  it is found no matter which Python we ended up with. The report
rem  script also adds it to its own path on the way in, so an
rem  "embeddable" Python - which ignores PYTHONPATH by design - works too.
set "PYTHONPATH=%KIT%_lib;%PYTHONPATH%"

cd /d "%SCRIPTDIR%"
%PYCMD% "%SCRIPTNAME%"%ARGS%
exit /b %errorlevel%


rem ---------------------------------------------------------------------
rem  FINDING PYTHON - and why this looks paranoid
rem
rem  The old version asked each candidate to PRINT its own path, and kept
rem  whatever came back. Three separate things on a corporate laptop can
rem  put text on that pipe that is not an answer:
rem
rem    * Windows ships "app execution alias" stubs for python.exe and
rem      py.exe that print "Python was not found; run without arguments
rem      to install from the Microsoft Store..." - and they print it to
rem      stdout. The old check kept that sentence as if it were a path.
rem    * A managed fleet can set a Command Processor AutoRun command, so
rem      EVERY new cmd prints a banner first. Same problem: the banner
rem      lands where Python's answer was supposed to be.
rem    * If the path itself contains a character the console code page
rem      cannot draw - an accented username, common on a non-English
rem      Windows image - the print fails and a perfectly good Python
rem      reads as absent.
rem
rem  So nothing is read off stdout now. Each candidate is asked to RUN,
rem  and judged only on its exit code. Exit codes have no code page and
rem  no banner. ANYPY remembers whether we found a working Python that
rem  was merely too old, so we can say THAT instead of "no Python".
rem ---------------------------------------------------------------------
:find_python
set "PYCMD="
set "ANYPY="

rem  0. the kit's own private copy, if 3_GET_PYTHON_NO_ADMIN.bat put one
rem     here. Nothing installed, nothing on PATH, no admin rights - it
rem     just sits in the folder and works.
if exist "%KIT%_python\python.exe" call :try_cmd "%KIT%_python\python.exe"
if defined PYCMD goto :eof

rem  1. the py launcher, used AS "py -3" rather than resolved to a path.
rem     Installed by every python.org install and works whether or not
rem     the "Add to PATH" box was ticked.
call :try_cmd py -3
if defined PYCMD goto :eof

rem  2. whatever is on PATH.
call :try_cmd python
if defined PYCMD goto :eof
call :try_cmd python3
if defined PYCMD goto :eof

rem  3. not on PATH at all - look where the installers actually put it.
call :scan_folder "%LOCALAPPDATA%\Programs\Python"
if defined PYCMD goto :found_off_path
call :scan_folder "%ProgramFiles%\Python"
if defined PYCMD goto :found_off_path
call :scan_folder "%ProgramFiles(x86)%\Python"
if defined PYCMD goto :found_off_path
call :scan_folder "C:\Python"
if defined PYCMD goto :found_off_path
goto :eof

:found_off_path
echo   Note: Python is installed but not on this computer's PATH.
echo   Using "%PYCMD%"
echo   (Everything works. To tidy it up one day, re-run the Python
echo    installer, choose Modify, and tick "Add python.exe to PATH".)
goto :eof

rem  Try one candidate. Two questions, both answered by an exit code:
rem  does it run at all, and is it new enough?
:try_cmd
%* -c "pass" >nul 2>nul
if errorlevel 1 goto :eof
if not defined ANYPY set "ANYPY=%*"
%* -c "import sys;sys.exit(0 if sys.version_info>=(3,8) else 1)" >nul 2>nul
if errorlevel 1 goto :eof
set "PYCMD=%*"
goto :eof

rem  A folder full of Python3x installs. /o-n walks them newest-named
rem  first, so Python313 is tried before Python310 - the old version took
rem  whatever came first alphabetically, which meant the OLDEST.
:scan_folder
if not exist "%~1" goto :eof
for /f "delims=" %%P in ('dir /b /s /o-n "%~1\python.exe" 2^>nul') do if not defined PYCMD call :try_cmd "%%P"
goto :eof


rem =====================================================================
rem  THE WAYS THIS GOES WRONG ON SOMEBODY ELSE'S LAPTOP
rem  Each one names the actual fix, rather than an error code.
rem =====================================================================
:from_inside_zip
echo.
echo ==================================================================
echo  YOU ARE RUNNING THIS FROM INSIDE THE ZIP
echo ==================================================================
echo.
echo  Windows let you double-click the button while it was still in the
echo  zip. It quietly unpacked that ONE file into a temporary folder, so
echo  everything else the report needs isn't there.
echo.
echo  This is the most common reason somebody is told "it doesn't work",
echo  and it is nothing to do with your laptop.
echo.
echo  FIX - takes ten seconds:
echo.
echo    1. Close this window.
echo    2. Find the zip file. It will be in Downloads.
echo    3. RIGHT-CLICK it and choose "Extract All..."
echo    4. Pick Desktop, press Extract.
echo    5. Open the FOLDER that appears and press the button in there.
echo.
echo  Running from: "%KIT%"
echo.
pause
exit /b 2

:network_path
echo.
echo ==================================================================
echo  THIS FOLDER IS ON A NETWORK DRIVE
echo ==================================================================
echo.
echo  "%KIT%"
echo.
echo  Windows will not let a button use a network path as its working
echo  folder, so nothing in here can find anything else in here.
echo.
echo  FIX: copy the whole folder onto this computer first - the Desktop
echo  is fine, C:\Coates is tidier - and run it from there.
echo.
pause
exit /b 2

:half_unpacked
echo.
echo ==================================================================
echo  SOME OF THE KIT IS MISSING FROM THIS FOLDER
echo ==================================================================
echo.
echo  This folder:
echo    "%KIT%"
echo.
if not exist "%KIT%%SCRIPT%" echo  Missing: %SCRIPT%
if not exist "%KIT%_lib\openpyxl\__init__.py" echo  Missing: the _lib folder - that is the Excel library
echo.
echo  The kit is one folder and all of it has to travel together.
echo.
echo  FIX: right-click the zip, "Extract All...", and work in the folder
echo  that comes out. Don't drag single files out of the zip window.
echo.
pause
exit /b 2

:python_too_old
echo.
echo ==================================================================
echo  THE PYTHON ON THIS COMPUTER IS TOO OLD
echo ==================================================================
echo.
echo  Found: "%ANYPY%"
for /f "usebackq delims=" %%V in (`%ANYPY% -c "import sys;print(sys.version.split()[0])" 2^>nul`) do echo  Version: %%V
echo.
echo  The kit needs Python 3.8 or newer - anything from 2019 on.
echo.
echo  FIX: double-click  3_GET_PYTHON_NO_ADMIN.bat
echo  It puts a fresh, private copy inside this folder. It does not touch
echo  the old one and it does not need admin rights.
echo.
pause
exit /b 2

:no_python
echo.
echo ==================================================================
echo  PYTHON IS NOT ON THIS COMPUTER
echo ==================================================================
echo.
echo  Python is the free engine the report is built with. It is the ONLY
echo  thing this kit needs that Windows hasn't already got, and you only
echo  ever do it once on a laptop.
echo.
echo  EASIEST WAY - no admin rights, no IT ticket:
echo.
echo      Double-click   3_GET_PYTHON_NO_ADMIN.bat
echo.
echo  That puts a private copy inside this folder and nothing else on the
echo  computer changes. Then press this button again.
echo.
echo  If that is blocked too, ask IT for "Python 3 from python.org" and
echo  tick "Add python.exe to PATH" during the install.
echo.
echo  And remember: nobody needs Python just to READ or SEND the report.
echo  Andrew can run it on his laptop and email you the finished draft.
echo.
pause
exit /b 2
