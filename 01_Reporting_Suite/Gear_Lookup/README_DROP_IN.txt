============================================================
 MY GEAR - SCORECARD + DUAL ROUTER KIT  |  23 Jul 2026
 Author: Andrew Fisher | POWERED BY SITEIQ
============================================================

WHAT GOES WHERE
---------------
1. BUILD_MY_GEAR.py + RUN_MY_GEAR.bat + MY_GEAR_PEOPLE.csv
     -> into 01_Reporting_Suite (next to the exports)
     THE BUILDER. Feeds on all FOUR SiteIQ pulls in that folder:
       ON_HIRE*        - current truth: who holds what + their ID
       TRANSACTIONS*   - history: returns, same-day, radios,
                         consumables, damages (runs a day behind -
                         each card says how far its history runs)
       RENTAL_STOCK*   - authoritative asset numbers + current
                         descriptions (your description changes and
                         replacement-cost joins flow from here)
       SALES_STOCK*    - authoritative consumable names
     Short kit names (ON_HIRE.xlsx) and raw SiteIQ names
     (ON_HIRE_23_07_2026 08_50 AM 1.xlsx) both work - newest wins.

     MY_GEAR_PEOPLE.csv is the ROSTER MEMORY: everyone ever seen in
     an ON_HIRE pull keeps their card even after returning everything
     (returning it all is the gold standard - it shows the green
     "Cleared" card, not a vanished one). Keep it next to the
     builder; it grows by itself. Delete it only to start fresh.

2. index.html -> replace Gear_Lookup\index.html
     Today's build (23 Jul 08:50 pulls, 27 people) so you're live
     without running anything.

3. START_GEAR_LOOKUP.ps1 -> replace next to START_GEAR_LOOKUP.bat
     Dual-router edition - serves only on YOUR router's network.

4. MyGear_Dual_Router_Setup_Guide.html -> print for the store.

EVERY MORNING
-------------
  drop the fresh SiteIQ pulls in -> RUN_MY_GEAR.bat -> START_GEAR_LOOKUP.bat

SCORE MODEL (documented, no black box)
--------------------------------------
  Returns Score = 100 x (0.75 x same-day rate + 0.25 x returned rate)
  No returns yet -> no score, friendly starter line. Badges: Big Kit
  8+ out, All-Rounder 4+ categories, Store Regular 8+ transactions,
  Rigger/Powerhouse by kit, legends need a real same-day return.
  Gas monitor and damage sections light up only when those rows
  exist in the exports - nothing is ever invented.
============================================================
