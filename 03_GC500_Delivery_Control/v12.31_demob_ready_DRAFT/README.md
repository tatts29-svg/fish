# v12.31: the Demob tab says ready for collection, the pick-up date and time, and picked up when

Author: Andrew Fisher · 26 Oct 2026

Andrew asked for this with trucks on site, 26 Oct 2026:
- "we have trucks in now so we need to know what is ready or not ready"
- "its important we have a pickup date and time. we can have a not ready for collection ready for collection and a picked up and time and date it was picked up"
- "lets utilise the current demob tab... as things are changed or leave this info can be added to the demob cards"
- "we need to have a Coates and a sub hired Section in the demob"
- "3 lights red not ready for collection another light for ready for collection and then another for Picked up", then "should green be last its complete"
- "remember we need asset no. description . sizes dimensions weights"
- "remember the day cards change as per what we have .. also have a picked up time and date"
- "need this to be tidy"

## What the Demob tab now shows

### The day's pick-up list

**Two sections.**
- *Coates:* our fleet.
- *Sub-hired:* grouped by supplier.

Each section has a banner showing how many are not ready, ready and picked up, with a progress bar. Who owns what is read from the reference's own units (`gcUnits925`). A reference holding both shows in both sections, with the same status. A reference with no unit recorded stays under its Coates branch, marked owner to confirm. Inside a section there is one table, with the areas as separator rows.

**The three lights, in traffic-light order.** One light is lit at a time:
- Red: not ready for collection.
- Amber: ready for collection.
- Green: picked up (complete).

On the edit link each light is its own button. On the view link the lights only show the status.

**The status line.** Next to the lights:
- who set it and when;
- the reason, for Not ready;
- for Picked up, the date and time it left, from the departure record.

**What it is.** Under the description, two plain lines:
- the unit asset numbers;
- the size, weight and rating the page itself holds (`Loading931`). Each figure says where it comes from:
  - actual;
  - contract footprint;
  - nominal from the description;
  - delivered rating;
  - the 2023 load restraint guide's listed model, a reference marked "guide".

Nothing is worked out here and no figure is made up.

**The pick-up.**
- The Demob plan's day for the reference, or each portion's day when it is split.
- The load's planned stop time from the trucks (`trucks816`).
- A supplier pick-up shows site hours, 07:00–17:00, with their own transport.
- A day with no load yet says the time is to be set.
- The day's chip says how firm it is: confirmed, plan, contract or proposed.

**The tally above the list.**
- To pick up, not ready, ready and picked up, with a filter for each.
- "Picked up this day": every reference that left that day, with its time.

### The day cards

As per what we have, each card's three work rows read:
- **Picked up:** what actually left that day by the departure record, whatever day it was planned for, with the last time. GN10 left 26 Oct 07:40 though planned for a later day, so 26 Oct reads "Picked up 1 · last 07:40".
- **Ready for collection:** the day's planned references still on site that are ready.
- **Not ready.**

## The rules

| Status | When it shows |
|---|---|
| Picked up | The departure record (`DemobCollection996` / `Departure1211`) has every unit gone. The date and time come from it. |
| Ready / Not ready | The newest Ready or Not ready tick for this use of the unit, on the shared delivery record beside Emptied (`ready1231`, `ready1231_by`, `ready1231_at`, `ready1231_why`, with its history). |
| Not ready for collection, not checked yet | Nothing recorded. |

**How the tick merges.** It merges on its own clock, the way Emptied does (`mergeRecords`):
- the later stamp wins;
- the same moment with two answers keeps Not ready on every copy;
- the history is the union.

A record holding only the tick is kept (`deliveryEmpty`). A tick from before the unit last arrived on site belongs to an earlier use and counts for nothing.

**Toilets and waste tanks.** One is Ready only once it is emptied. The Emptied (pumped out) rule and its gate are unchanged.
- The amber light records Emptied first, in the person's name, only when they confirm it was pumped out.
- The green light does the same before it opens the departure form.
- An emptied unit with no newer Not ready reads Ready.

**Picked up** is the page's own departure form, which asks for the date and time.

**Not changed:**
- the plan, the loads and the emptied gate;
- charges, QR codes and the servicing tracker;
- the record, which only changes when someone presses a light on the edit link.

## Files

| File | What it does |
|---|---|
| `ready1231_src.js` | The module and its styles. It goes in just before `</body>` and wraps `renderDemob816`, `listHtml816` and `notReady816` the way the page's other modules do. |
| `patch_v1231.py` | Seven exact-text edits on the verified v12.29 page (BASE a4d61111…), plus the module and the footer: the list header, the pick-up and status cells, the buttons slot, the merge of the tick and its history, `deliveryEmpty`, and the day cards' rows. |
| `tests/test_v1231.cjs` | 42 checks against the live record through the view link, with the rehearsals captured in the page (see below). |

**What the test reads (Part A, live record, view link):**
- every row's pick-up lines are the plan's own stops;
- the asset numbers and size/weight lines are `Loading931`'s own;
- every row is under its owner's section, and the banners count right;
- GN10 shows picked up at 07:40;
- the lights show, but are not buttons, on the view link;
- the tally, the filter and the day cards are right.

**What it rehearses (Part B, sync held in the page, nothing sent):**
- green and red on GN19 and GN04;
- amber on a toilet with no Emptied tick;
- a newer Not ready beating Emptied;
- the departure form, through the green light;
- today's card counting two;
- the merge rules, the empty-record rule, and an old tick that counts for nothing.

## Checks

- Desktop 42/42 and phone 42/42 on candidate `ab553fe3` (`evidence/test_v1231_desktop.txt`, `evidence/test_v1231_phone.txt`).
- Every test's rehearsals were captured in the page, and nothing reached the network.
- Both sweeps: 27 tabs, 19 panes shown, 7 deep links; 0 errors and 0 console messages (`evidence/sweeps.json`).
- Pictures are in `evidence/`.

## Data to confirm (on the record, shown as it stands)

- **WC30, WC45 and WC47:** their units are Event Portables' on the unit record, so they sit under Sub-hired, but the Demob plan has them on the Coates toilet run. Which truck takes them is for the site to confirm.
- **GN19:** described as 60 kVA, but its delivered rating on the contract line is 80 kVA.
