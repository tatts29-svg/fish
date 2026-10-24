# Unit slots: survey (read only, 8 Oct 2026)

Author: Andrew Fisher

SURVEY: labour sets per unit, run on live v9.11 in view mode against record 4581

**Bottom line:** today the page loses no labour money outright. Every bulk labour line charges the full order quantity from a single tick. But 424 labour line-units, worth 27.08% of forecast labour revenue, can only be ticked as one block. A half-done location ends up either unticked, so revenue comes in late or not at all, or ticked too early, so we charge before every unit is done.

The run read only. The page made no writes (counts.blocked 0) and threw no errors, and the record GET returned version 4581.

**Where the gap comes from:** the page only gives each unit its own Install, Demob, etc. ticks when a location has two or more asset numbers. Of the 36 items with a gap, 34 have no number at all. Event Portables units never get a Coates number, so under today's rule they can never be ticked one unit at a time. The "WC50 1|5" slot idea fixes exactly this.

| Ref | Item | Qty | Numbers | Ticks offered | Can tick one unit | Units with no own ticks | Labour lines | Line-units in block | % of labour forecast | Ticks recorded | Event Portables |
|---|---|---|---|---|---|---|---|---|---|---|---|
| T0025 | Trakmat | 20 | 0 | 1 | 0 | 20 | install, demob | 40 | 4.50 | 0 | |
| WC33 | FWF | 17 | 0 | 1 | 0 | 17 | install, demob | 34 | 1.57 | 0 | marked EP |
| WC56 | FWF | 12 | 0 | 1 | 0 | 12 | install, demob | 24 | 1.11 | install | marked EP |
| WC69 | FWF | 12 | 0 | 1 | 0 | 12 | install, demob | 24 | 1.11 | 0 | |
| WC41 / WC43 | FWF | 10 each | 0 | 1 | 0 | 10 each | install, demob | 20 each | 0.93 each | install | marked EP |
| T0158 | VMS | 9 | 0 | 1 | 0 | 9 | install, demob | 18 | 2.02 | 0 | |
| WC30 / WC45 / WC71 | FWF | 8 each | 0 | 1 | 0 | 8 each | install, demob | 16 each | 0.74 each | WC71 install | WC71 marked EP |
| WC61 | FWF | 8 | 0 | 1 | 0 | 8 | install, demob | 16 | 0.74 | 0 | EP load |
| WC29 / WC59 | FWF | 7 each | 0 | 1 | 0 | 7 each | install, demob | 14 each | 0.65 each | WC59 install | WC59 marked EP |
| WC51 / WC54 | FWF | 6 each | 0 | 1 | 0 | 6 each | install, demob | 12 each | 0.56 each | 0 | |
| WC23 / WC40 | FWF | 5 each | 0 | 1 | 0 | 5 each | install, demob | 10 each | 0.46 each | 0 | WC40 EP load |
| T0159 | VMS | 5 | 0 | 1 | 0 | 5 | install, demob | 10 | 0.56 | 0 | |
| WC09 / WC48 | FWF | 4 each | 0 | 1 | 0 | 4 each | install, demob | 8 each | 0.37 each | 0 | WC09 EP load |
| WC10 / WC49 / WC53 | FWF | 3 each | 0 | 1 | 0 | 3 each | install, demob | 6 each | 0.28 each | 0 | |
| **WC09** | Toilet Block 6m | 2 | 0 (both numbers given to Pee Panel) | 1 | 0 | 2 | install, steps, levelling, cleaning, demob | 10 | 1.80 | 0 | |
| **WC31** | 16Pan Block | 2 (1 counted on site) | 0 | 1 | 0 | 2 | install, steps, levelling, cleaning, demob | 10 | 1.80 | 0 | |
| WC13, WC39, WC44, WC57, WC62, WC67, WC73, T0176 | FWF | 2 each | 0 | 1 | 0 | 2 each | install, demob | 4 each | 0.19 each | WC44, WC67 install | WC39, WC57 EP load; WC44, WC67 marked EP |
| T0103 / T0128 / T0169 | VMS | 2 each | 0 | 1 | 0 | 2 each | install, demob | 4 each | 0.45 each | 0 | |

**Totals**

| Measure | Count |
|---|---|
| References surveyed | 182 (176 active; 6 cancelled are left out) |
| Active references with priced labour | 146 |
| Units that should each have their own ticks | 372 |
| Sets of ticks offered today | 202 |
| Units that can be ticked one at a time today | 166 |
| Line-units: should / offered / tickable one unit at a time | 1002 / 656 / 578 |
| Gap | 36 items on 35 references; 206 units; 424 line-units |

- **Gap by line type:** install 206, demob 206, steps 4, levelling 4, cleaning 4.
- **Gap by kind:**
  - FWF singles: 28 items, 162 units, 15.05% of labour forecast.
  - Trakmat: 1 item, 20 units, 4.50%.
  - VMS: 5 items, 20 units, 3.93%.
  - Toilet blocks: 2 items, 4 units, 3.60%.
- **Money direction:** 0 line-units cannot be charged, because every forecast line has a rate. The 424 bulk line-units (27.08% of forecast labour revenue) are at risk of being charged late or missed while a location is part done. They are also at risk of being charged early where ticked before every unit is done. 2.35% is already ticked as whole blocks: install on 7 Event Portables-marked FWF references (WC41, WC43, WC44, WC56, WC59, WC67, WC71).
- **WC31:** one tick charges 2 blocks, but only 1 was counted on site. That is an over-charge risk.
- **WC09:** both asset numbers are counted as Pee Panel on the live page, so the two toilet blocks share one set of ticks. The v9.09 part E draft fixes this.
- **WC50:** 1 FWF with asset number 1211974, install ticked. It is not a gap today; it is just the example for the naming idea.

**Event Portables / sub-hire (27 lines on 26 references)**
- 10 references are marked Event Portables sub-hire: WC33, WC41, WC42, WC43, WC44, WC56, WC59, WC67, WC71, WC81. 9 of them have an install tick; WC33 has none.
- 15 more references have every schedule row on an Event Portables load: PG01, PG03, PG05, PG29, WC34, WC38, WC39, WC40, WC46, WC55, WC57, WC61, WC68, WC72, WC85.
- WC09 has both its FWF ×4 and Pee Panel ×6 on an Event Portables load.
- The page offers Coates Install and Demob on every Event Portables FWF. Pee Panel gets no labour, because the card has no line for it.
- Neither the card nor the page tells Event Portables units apart. **Open question for the project manager:** does Coates labour apply to Event Portables units?

**Outside the slot idea:** these items have no labour priced and slots would not change that.
- TL2 water barriers: 375 pieces on 15 WB references, no card line.
- WC100 FWF Trailer ×2, some containers and the Pee Panels: no card line.
- Forklifts and fridges: the card has a line but no labour figure on it.

Files are in /tmp/claude-0/-home-user-fish/710a1764-23a1-5338-9fe8-299f94961e8a/scratchpad/slots/survey/:
- survey.json
- raw.json
- run_survey.cjs
- analyse.py