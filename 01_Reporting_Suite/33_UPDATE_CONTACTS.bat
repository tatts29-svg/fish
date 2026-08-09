@echo off
rem ==========================================================
rem  COATES | UPDATE CONTACTS
rem  Reads your Outlook contacts export (.csv) and folds it
rem  into Coates_Report_Recipients.xlsx - the book every
rem  report already uses to address its emails.
rem
rem  Export from Outlook:  People > Manage > Export contacts
rem  Save the CSV in this folder or in Downloads, then run me.
rem
rem  It backs the book up first, lines every company name up
rem  with what the reports actually call them, and leaves all
rem  new people switched OFF. You decide who goes live by
rem  putting Yes in the Include column.
rem ==========================================================
cd /d "%~dp0"
call "%~dp0_RUN.bat" UPDATE_CONTACTS.py %1
pause
