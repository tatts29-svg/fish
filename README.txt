COATES | K2 REPORTING SUITE - FIX THIS MACHINE
Author: Andrew Fisher | POWERED BY SITEIQ


WHAT WENT WRONG
---------------
The align run printed this, eleven times over:

    ! connection refused a direct refresh: Query - K2_CompanySpend
    ! connection refused a direct refresh: Query - RENTAL_STOCK
    ...
    Refresh : 4 connection(s) also refreshed one-by-one (11 refused)

And just above it:

    Source  : SOURCE_PATH -> C:\01_Reporting_Suite\

That is the whole problem. The workbook's Power Query connections are
still looking for the suite where it sat on the old laptop:

    C:\01_Reporting_Suite\

On this laptop it actually lives in the Coates OneDrive:

    C:\Users\andrew.fisher\OneDrive - Coates Hire Operations Pty Limited\
        Desktop\Cement\01_Reporting_Suite

The old folder does not exist here, so every query that reaches for it
fails. The four that refreshed are the ones that do not touch the disk.
Nothing is corrupt and no data is lost - the workbook is just looking in
the wrong place.


HOW TO FIX IT
-------------
1. Put both files - FIX_THIS_MACHINE.bat and FIX_THIS_MACHINE.py - into
   your 01_Reporting_Suite folder.

2. If Windows put a block on them after the download: right-click each
   file, Properties, tick "Unblock" at the bottom, OK. Files off the
   internet get flagged on the Coates build and the .bat will not run
   until you clear it.

3. Double-click FIX_THIS_MACHINE.bat.

4. Read what it prints, then open the workbook and run the align again.

To see what it would do without changing anything, open a Command Prompt
in that folder and run:

    FIX_THIS_MACHINE.bat --check


WHAT IT DOES
------------
1. FIND THE SUITE
   Works out where the suite really is, starting from where the script
   is sitting and checking the usual OneDrive locations.

2. MAKE THE MISSING FOLDERS
   MACHINE.txt flagged Reports and K2 DAILY REPORTING as "[not there
   yet]". It creates those, plus Updates\report_archives.

3. BRIDGE THE OLD C:\ PATH
   The important one. It creates a directory junction so that

       C:\01_Reporting_Suite

   leads straight to the real folder in OneDrive. Every query that asks
   for the old path now gets the right files, and the workbook is not
   touched at all.

   A junction was chosen over editing the .xlsm on purpose. Cutting the
   connection strings out of a macro workbook risks the file; this does
   not, and it undoes with one command:

       rmdir "C:\01_Reporting_Suite"

4. REPOINT ANY HARDCODED PATHS
   Scans the suite's own .bat and .py files for the old C:\ path and
   points them at the real folder, so the suite is honest about where it
   lives rather than leaning on the junction forever. Every file it
   edits is copied first to:

       Updates\machine_fix_backups\<date_time>\

5. CHECK ONEDRIVE HAS THE FILES ON DISK
   OneDrive can leave a file as a placeholder that has not actually
   downloaded. Power Query cannot refresh from one of those. It finds
   any cloud-only workbooks or exports and pins them local.

6. VERIFY
   Confirms the workbook is there, the old path now resolves, and
   Data_SiteIQ has exports in it.

7. WRITE MACHINE.TXT
   Rewrites MACHINE.txt with this machine's details so you have a fresh
   one to send up.


IF IT CANNOT MAKE THE JUNCTION
------------------------------
Some Coates builds lock the root of C:\. If step 3 fails, the script
says so and tells you. Two ways forward:

  - Right-click FIX_THIS_MACHINE.bat, "Run as administrator", once.
  - Or leave it. Step 4 will have repointed the suite's own scripts,
    so the .bat-driven parts work. Only the queries inside the workbook
    that hardcode C:\01_Reporting_Suite will still fail, and those need
    the junction or a manual edit in Power Query.


IT IS SAFE TO RUN TWICE
-----------------------
Nothing is deleted. If the junction already exists and points to the
right place, it says so and moves on. Anything it edits is backed up
first.


IF IT STILL REFUSES AFTER THIS
------------------------------
Send up the new MACHINE.txt from the suite folder and a screenshot of
the align output. If the queries still refuse with the old path now
resolving, the next thing to check is the Power Query credentials -
a new laptop means the data source permissions were never granted, and
that produces a refusal that looks identical from the outside.

In Excel: Data > Get Data > Data Source Settings > Clear Permissions,
then refresh once and let it prompt.
