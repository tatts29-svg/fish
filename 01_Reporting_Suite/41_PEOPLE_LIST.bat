@echo off
rem ==========================================================
rem  COATES | PEOPLE LIST - everyone, and who has no card
rem
rem  A My Gear card is built from the ON_HIRE export, keyed on
rem  EXTERNAL_ID. Anyone who has never held gear under their
rem  own ID has no ID for us to use - so they get no card.
rem
rem  This lists EVERY person from every export, marks who has
rem  a card and who doesn't, and writes the gap out ready to
rem  paste into the ID Cards sheet.
rem
rem  Files land in Gear_Lookup\ :
rem     People_List.csv    the lot
rem     Needs_An_ID.csv    just the gap - paste into ID Cards
rem     People_List.html   the printable version
rem ==========================================================
cd /d "%~dp0"
where py >nul 2>nul && (py PEOPLE_LIST.py) || (python PEOPLE_LIST.py)
pause
