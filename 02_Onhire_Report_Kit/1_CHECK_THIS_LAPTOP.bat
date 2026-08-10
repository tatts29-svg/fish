@echo off
rem =====================================================================
rem  COATES | CHECK THIS LAPTOP
rem  Author: Andrew Fisher | POWERED BY SITEIQ
rem
rem  Press me FIRST on a laptop that has never run the kit, and press me
rem  any time somebody says "it doesn't work".
rem
rem  I don't build anything and I don't change anything. I look at this
rem  computer and this folder and tell you, in words, whether the report
rem  will run - and if it won't, exactly which one thing to fix.
rem
rem  I also write LAPTOP_CHECK.txt next to me. If you're still stuck,
rem  email Andrew that file and he'll know what's wrong without having
rem  to ask you a single question.
rem =====================================================================
cd /d "%~dp0"
if not exist "%~dp0_RUN.bat" (
    echo.
    echo ==================================================================
    echo  SOME OF THE KIT IS MISSING
    echo ==================================================================
    echo.
    echo  _RUN.bat isn't in this folder, and nothing can start without it.
    echo.
    echo  This nearly always means the button was pressed while it was
    echo  still inside the zip. Windows unpacks one file at a time when
    echo  you do that, so everything else was left behind.
    echo.
    echo  FIX: right-click the zip, choose "Extract All...", put it on the
    echo  Desktop, and press the button in the folder that comes out.
    echo.
    pause
    exit /b 2
)
call "%~dp0_RUN.bat" check_this_laptop.py %*
echo.
pause
