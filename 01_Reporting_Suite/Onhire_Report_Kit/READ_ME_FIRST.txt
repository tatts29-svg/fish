======================================================================
 COATES | ON-HIRE REPORT KIT
 Author: Andrew Fisher | POWERED BY SITEIQ
======================================================================

 WHAT THIS IS

   The shutdown on-hire report, in a folder you can put on any
   computer. Drop in the SiteIQ exports, press one button, open the
   workbook. That is the whole thing.

   Twelve tabs, all of them filled from the exports:

     Cover                    what this is, what fed it, the headlines
     Company Summary          per company: tooling, consumables, total
     Detailed Onhire          every item out right now, who has it
     Tooling Transactions     every tooling issue and return
     Tooling Utilisation      per item type: turns, rating, what to do
     Coates Tooling           the Coates-owned fleet on site
     Consumable Transactions  every consumable issued
     Consumables Available    what's left on the shelf
     Coates Stock             the fleet with its on-hire dates
     Consumable Utilisation   per line: usage, rating, what to do
     Coates Labour            the shift roster - YOUR TYPING
     Cost Breakdown           the day-by-day cost - YOUR TYPING


----------------------------------------------------------------------
 HOW TO USE IT - the whole job
----------------------------------------------------------------------

   1. Save today's SiteIQ exports into the Data_SiteIQ folder,
      straight over the top of the ones already there:

           RENTAL_STOCK        needed
           SALES_STOCK         needed
           TRANSACTIONS        needed
           STOCKTAKE           optional - adds one line to the Cover

      Long SiteIQ file names are fine
      (RENTAL_STOCK_10_08_2026 06_05 AM.xlsx). Newest wins.

   2. Double-click  REFRESH_THE_REPORT.bat

   3. Open the workbook that lands next to it:

           <Job>_Onhire_Workbook_LATEST.xlsx

      Same name every day, always the newest - so a desktop shortcut
      to it never goes stale. A dated copy is also filed under
      Reports\<today>\ so you keep every day.

   Done. There is no step 4.


----------------------------------------------------------------------
 FIRST TIME ON A NEW COMPUTER
----------------------------------------------------------------------

   Copy the whole folder across - all of it, not just the button.

   The computer needs Python 3. If it hasn't got it the button says
   so in plain words and tells you where to get it: python.org,
   the big yellow Download button, and TICK "Add python.exe to PATH"
   on the first screen. Two minutes.

   Everything else the kit sorts out itself the first time you press
   the button.

   It does NOT need Excel to build the workbook. You only need Excel
   to open it afterwards.


----------------------------------------------------------------------
 THE TWO TABS THAT ARE YOURS
----------------------------------------------------------------------

   Coates Labour and Cost Breakdown are typed by hand. The refresh
   NEVER touches them. It reads them out of the last workbook and
   writes them straight back, formulas and all.

   Where it reads them from: any .xlsm sitting in this folder. Keep
   your working .xlsm here and the roster and costs carry forward
   every refresh.

   If there is no .xlsm here, those two tabs come through empty with
   a note - ready for you to type into. Nothing breaks.

   Your original .xlsm is never written to. The kit builds a clean
   workbook alongside it and leaves yours alone.


----------------------------------------------------------------------
 USING IT ON A DIFFERENT JOB
----------------------------------------------------------------------

   Copy the folder, then:

     1. Delete the exports in Data_SiteIQ and put the new job's in.
     2. Open JOB.txt and either blank the lines or type the new
        job's names.
     3. Press the button.

   That's it. With JOB.txt blank the kit reads the job straight off
   the exports - every SiteIQ export carries the project it came
   from - so it names itself correctly with nothing set up at all.

   ONE JOB'S EXPORTS AT A TIME. If a Gladstone export ends up in a
   Weipa folder the kit stops and names the odd one out, rather than
   quietly building a report off a mix of two jobs.


----------------------------------------------------------------------
 THE RATINGS - so you can argue with them
----------------------------------------------------------------------

   Tooling is rated on TURNS - transactions divided by how many of
   that item are on site. One item that went out five times is
   working; five items that went out once each are sitting there.
   Current utilisation on its own can't tell those apart.

       no turns          No Use        Review / Reduce
       under 1 turn      Low Use       Keep Stock
       1 to 2 turns      Good Use      Keep Stock
                                       (Monitor / Increase if 80% or
                                        more are out right now)
       2 turns or more   High Demand   Increase Stock

   Consumables are rated on how much of the position has gone out -
   sales divided by sales plus what's left on the shelf.

       nothing sold      No Use        Review / Reduce
       under 40%         Low Use       Keep Stock
       40% to 80%        Good Use      Keep Stock
       over 80%          High Demand   Increase Stock

   Both rules are printed on the Cover tab of every workbook it
   builds, so whoever reads the report can see how the
   recommendation was reached.


----------------------------------------------------------------------
 WHAT'S IN THIS FOLDER
----------------------------------------------------------------------

   REFRESH_THE_REPORT.bat     the button. This is the only one.
   Data_SiteIQ\               where the exports go
   JOB.txt                    the job's names (optional)
   READ_ME_FIRST.txt          this
   build_onhire_workbook.py   the builder
   _RUN.bat                   finds Python. Never press it directly.
   Reports\                   a dated copy of every build

   Your .xlsm and the LATEST workbook sit here too.

======================================================================
