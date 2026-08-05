@echo off
rem =====================================================================
rem  COATES K2 - RUN THIS UPDATE (06 Aug 2026 - the picture catalogue)
rem  Cement Australia K2 Shutdown 2026 - Gladstone
rem  Author: Andrew Fisher | POWERED BY SITEIQ
rem
rem  BEFORE double-clicking this:
rem    1. Copy every file from the update zip into 01_Reporting_Suite\
rem       over the top (you have already done that if you can see me).
rem    2. Put the three thumbnail delivery zips
rem       (Coates_K2_Road2_Retraction_Resolved_649_Thumbnails_001-003)
rem       into Data_Thumbnail_Drops\  (created on first run below).
rem
rem  Then double-click me. In order, out loud, stopping at nothing:
rem    1. Quarantine the known cartoon placeholder if this machine has
rem       it (by exact hash - real photos are never touched)
rem    2. Install the thumbnail drop through the guarded installer
rem    3. Verify the finished folder against the release's own manifest
rem    4. Rebuild My Gear so every page learns its pictures
rem    5. Run CHECK_REPORTS so nothing goes out unproven
rem =====================================================================
cd /d "%~dp0"
set PYCMD=py
where py >nul 2>nul || set PYCMD=python

echo ===============================================================
echo  COATES K2 - RUN THIS UPDATE - %date% %time%
echo ===============================================================
echo.
echo [1/5] QUARANTINE KNOWN PLACEHOLDERS (by hash - photos untouched)
%PYCMD% QUARANTINE_KNOWN_PLACEHOLDERS.py
echo.
echo [2/5] INSTALL THE THUMBNAIL DROP (guarded - real photos protected)
%PYCMD% INSTALL_THUMBNAIL_DROP.py
echo.
echo [3/5] VERIFY THE RELEASE against its own manifest
%PYCMD% VERIFY_THUMBNAIL_RELEASE.py --thumbs-dir Gear_Lookup\thumbs --release-manifest Coates_K2_Road2_649_Release_Manifest.csv
echo.
echo [4/5] REBUILD MY GEAR - the pages learn the new pictures
%PYCMD% BUILD_MY_GEAR.py
echo.
echo [5/5] CHECK REPORTS - nothing goes out unproven
%PYCMD% CHECK_REPORTS.py
echo.
echo ===============================================================
echo  DONE. If step 3 said PASS and step 5 said PASS, the store is
echo  carrying the new catalogue: expect "649 of 1,171 variants have
echo  a photo" from step 4 (plus any real photos this machine holds).
echo  Spot-check a few families against the shelf - the release's own
echo  condition. The remaining 522 are with the render house under
echo  the RENDER_FROM_DESCRIPTION_GO_522 direction.
echo ===============================================================
pause
