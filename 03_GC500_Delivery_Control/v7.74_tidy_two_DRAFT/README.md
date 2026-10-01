# v7.74 — tidy, the second pass (DRAFT — built on v7.73, under test)

Author: Andrew Fisher · 1 Oct 2026, 18:10 AEST

The rest of the management read of 1 Oct (Andrew, 16:51: "no bugs, it's clean and tidy and easy to understand"). The
seven readers' 207 findings (`../v7.72_tidy_for_management_DRAFT/evidence/management_read_findings.md`) went to seven
verifiers, one per bundle of tabs, each told to refute the finding against the page text and the page source, and, if it
stood, to give the exact source string (occurring once in the build) and the replacement in the page's voice. v7.72
took the nine that mattered most for the night; this takes the rest that passed verification — wording and counts,
never a figure, a rule or the record.

## What is in it

`evidence/replacements.json`: 72 verified replacements (76 passed; four were left out because their replacement
reached for a field or a helper the verifier had not shown exists — the "rows still need a reference" list, the
Documents "checking file availability" state, the on-site time on the Due today card, the demob date on the Plant
rows). Each carries the tab, the quote as a manager read it, why it misleads, the exact source string and the
replacement. `patch_v774.py` applies each only where the string still occurs exactly once; one that does not is skipped
and printed, never guessed.

By tab:
- **Today** — "197 assets" → "197 references"; "a snapshot taken for this build" → "when this page was published";
  "this morning" → "today"; the roads note reads as a sentence; the fencing card's figure to the dollar; "of this
  week's plan still to do"; the costs card labels the revenue beside the direct cost; the search hint allows for a
  phone; the race-start marker shows on the phone's calendar strip; "0" under the deliveries gauge gets its label.
- **Progress (Where we are)** — the recorder's name without the suffix at the source; "They don't make up the gap"
  only when there is a gap; the whole-job split adds (the references added on the record named); "On site comes from"
  says matched to a reference; the servicing and water charged on named in the revenue table instead of "Not itemised
  here"; the fencing dockets' kind reads "Rehire", not "Subhire"; the fencing plate names the green book so its figure
  reconciles; plain words for the wages line; the doubled "Delivery Delivery" and ",*" gone; "coming in the next 7 days"
  counts only what is not already on site; the branch cards say "schedule references"; passed off-hire dates say so;
  "rehired" once, not "subhired" twice; the contractor's sheet names in order; "Programme day N of 68, counted from";
  "contract lines", "units", capitals and spaces where they were missing; the site name once; the detail link reads as
  a link; "summary cards" for "plates".
- **Documents** — the header count includes the fencing dockets so the parts add to the total; the doubled page count
  and the broken "rev iew" in two catalogue entries; "Made by this page" / "Uploaded to the service" for "Built by this
  page"; tidy titles for two fencing plans and the map atlas; the footer no longer says files are listed only when
  "the build" saw them.
- **Plant** — a row with no name no longer starts with a separator; "As at the last update of this page"; the "All"
  chip says what it counts; the contract table's location field says what it is; the editor button reads as English;
  the colour-code explanations show on the phone; dates in the page's own style; "schedule row, not on a drawing" for
  "PLANT LINE"; "Branches with assets".
- **Costs** — the internal labour line's hours add (rostered before the break; paid after it); "priced from the card"
  explains the forklift whose Rate 1 is the day rate × its days; "63 dockets, 59 of them carrying a card charge"; the
  missing rehire costs counted the same way on every card; the loads without a figure described as the model counts
  them; the By branch rehire-cost cell says gear and crew are together; "past hours, before breaks"; the undated
  delivery lines say the date in the name is not read as the delivery date; each sub-hired forklift line its own window;
  "references on the schedule" where lines were meant; the working table says it is before the labour ticked; the cover
  sentence names the two figures it adds; "each figure rounded to the dollar on its own" instead of "to the cent" where
  the dollars shown cannot add; the Finance tile names the WIP question.

## And the review's fixes on the P&L-in-the-lines card (v7.70)

The adversarial review of patch_v770 (three lenses, each finding verified against the code, then a critic; result at
18:08) found every figure right to the cent and five things to say or show better. All five are here, CSS and words
only, no figure changes:

1. **On a phone the cost and ratio tables opened on a blank first column with the figures off the screen.** The card's
   first column was set not to wrap, so the widest chip ("Temporary Staff · 3210 · 2143", 225 px of a 390 px screen) set
   the column for the whole table. On a phone the column now wraps, and the wages chip is the codes alone, "Temporary
   Staff" moved into the words beside it; the basis column gets a minimum width so a long basis no longer stacks into
   a 500 px-tall row. The table still scrolls sideways for its last two columns, as every wide table on the page does.
   Phone screenshot in `evidence/regress/`.
2. **The Direct costs tile hung the job-end split on the on-the-record figure** ("$235,372 … of which $420,740"). It now
   reads "$235,372 on the record today · to job end: $420,740 on the ledger's direct lines + $23,671 travel,
   accommodation, meals and printing — the Costs to job end card's figure".
3. **The 1010 line bridged to a figure the Rehire by branch card does not print** ($181,829). It now bridges to that
   card's own total ($302,742), less its fencing and the servicing.
4. **The fencing behind the programme** ($48,262 at the card, $41,111 at Advanced's rates — weeks that ended with
   metres still on the plan) is named inside the 1010 and 2126 to-job-end figures, as the Costs to job end and Rehire by
   branch cards already name it.
5. **The 31 toilet lines that carry a Coates plant number** are named on the 1010 line as counted in Event Portables
   rehire, as the Rehire by branch card counts them, and being checked.

Not taken (latent, no figure wrong today): the ratio rows do not yet blank themselves when the Event Portables quotes
fail to split or are unapproved — the 3325 and 2144 lines say so, the ratios would still divide. Noted for v7.75.

## Build

```
bash toolchain/build.sh v7.74 v7.70_pl_in_the_business_lines_DRAFT/patch_v770.py v7.72_tidy_for_management_DRAFT/patch_v772.py v7.73_crystal_DRAFT/patch_v773.py v7.74_tidy_two_DRAFT/patch_v774.py
python3 toolchain/upload_page.py build/GC500_v7.74/GC500_Delivery_Control_hosted.html
```

## Results

Filled in from `evidence/regress/` when the chain finishes: both sweeps (a replacement that reaches for something that
is not there would show as a page error on its tab), every tab's text dumped and searched for "undefined", "NaN",
"[object" and template leftovers, the v7.70 suite on the build, and a read of the changed lines.
