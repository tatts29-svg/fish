@echo off
setlocal enabledelayedexpansion
title COATES K2 - Fix This Machine

REM ---------------------------------------------------------------
REM  COATES ^| K2 REPORTING SUITE - FIX THIS MACHINE
REM  Author: Andrew Fisher ^| POWERED BY SITEIQ
REM
REM  Double-click this. It finds Python, runs the fix, and stays open
REM  so you can read what it said.
REM
REM  To look without changing anything:
REM     FIX_THIS_MACHINE.bat --check
REM ---------------------------------------------------------------

cd /d "%~dp0"

set "PY="

REM 1. The Python launcher - present on most standard installs.
where py >nul 2>&1
if not errorlevel 1 (
    py -3 -c "import sys" >nul 2>&1
    if not errorlevel 1 set "PY=py -3"
)

REM 2. Plain python on the PATH.
if not defined PY (
    where python >nul 2>&1
    if not errorlevel 1 (
        python -c "import sys" >nul 2>&1
        if not errorlevel 1 set "PY=python"
    )
)

REM 3. The store-style install this laptop actually uses -
REM    %LOCALAPPDATA%\Python\pythoncore-3.14-64\python.exe
if not defined PY (
    for /f "delims=" %%P in ('dir /b /o-n "%LOCALAPPDATA%\Python\pythoncore-*-64" 2^>nul') do (
        if not defined PY (
            if exist "%LOCALAPPDATA%\Python\%%P\python.exe" set "PY="%LOCALAPPDATA%\Python\%%P\python.exe""
        )
    )
)

if not defined PY (
    echo.
    echo   Could not find Python on this machine.
    echo.
    echo   Looked for: the py launcher, python on the PATH, and
    echo   %LOCALAPPDATA%\Python\pythoncore-*-64\python.exe
    echo.
    echo   Install Python from the Company Portal, tick "Add to PATH",
    echo   then run this again.
    echo.
    pause
    exit /b 1
)

%PY% "%~dp0FIX_THIS_MACHINE.py" %*
set "RC=%ERRORLEVEL%"

echo.
if "%RC%"=="0" (
    echo   Done. You can close this window.
) else (
    echo   Finished with something to look at - read the messages above.
)
echo.
pause
exit /b %RC%
