@echo off
rem ==========================================================
rem  COATES | SUBMIT CHARGES - the 28 Jul 2026 batch
rem
rem  Puts these four charges on the register:
rem     Conveyor transport, Brisbane to Gladstone   $1,134.00
rem     Paramount Safety Bollard Stem   24 x $21.30   $511.20
rem     Paramount Bollard Bases 6KG     24 x $16.24   $389.76
rem     Squids 3155 Tool Lanyard        20 x $15.30   $306.00
rem                                        TOTAL    $2,340.96
rem
rem  It asks you to type YES before it does anything.
rem
rem  Safe to run twice - it will skip anything already on the
rem  register rather than charge it again.
rem
rem  Nothing is emailed. Each charge leaves an Outlook draft
rem  for you to read and send yourself.
rem ==========================================================
cd /d "%~dp0"
call "%~dp0_RUN.bat" SUBMIT_CHARGES.py
pause
