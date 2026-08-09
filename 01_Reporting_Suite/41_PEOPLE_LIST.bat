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
rem  Files land in People_List\  (office only - deliberately NOT
rem  in Gear_Lookup\, because that folder is served to every
rem  phone on the store Wi-Fi and this is the whole site's
rem  names and IDs in one file):
rem     People_List.csv    the lot
rem     Needs_An_ID.csv    just the gap - paste into ID Cards
rem     People_List.html   the printable version
rem ==========================================================
cd /d "%~dp0"
call "%~dp0_RUN.bat" PEOPLE_LIST.py
pause
