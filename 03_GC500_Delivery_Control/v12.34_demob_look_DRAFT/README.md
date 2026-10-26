# v12.34: the Demob tab's look

Author: Andrew Fisher · 26 Oct 2026

Andrew, 26 Oct 2026, with the trucks on site: "We need this to look better come on mate."

On a phone, each line of the pick-up list was a tall white card, about 490 px high:
- every field under its own heading (STATUS, PICK-UP, BRANCH);
- a big empty More box at the bottom;
- "Not ready for collection" in red on every card.

About one line fitted on a screen.

## What it shows now

The pick-up list in the servicing tracker's dark style, the look Andrew liked.

**The Coates and Sub-hired sections are dark panels.** The section banner, its counts and progress bar are unchanged. The lines sit on the same dark ground.

**On a phone each line is one compact card, about 200 px high**, so two or more lines fit on a screen:
- **Top row:** the orange plate, what it is (asset numbers and the size the page holds), and its branch as a small tag.
- **Middle row:** the three lights (red, amber, green) as a slim signal with the status in words beside it: "Not ready for collection · not checked yet", "Ready for collection" with who and when, or the DEPARTED stamp in green ink.
- **Bottom row:** the pick-up day and time, the load, how firm the day is (plan, contract, proposed), and the More button.

**Each line wears its status as a coloured edge:** red not ready, amber ready, green picked up. A glance down the list shows what is ready.

**On a wider screen** the same table, dark, each line in its own band with the coloured edge.

**Not changed:**
- the cells, the words, the lights and the buttons (on the edit link the lights are still the buttons);
- the day cards, the tally and the filters;
- the record, the plan, every rule and count, charges, QR codes and the servicing tracker;
- printing, which keeps the page's own light table.

## Files

| File | What it does |
|---|---|
| `demob1234_src.js` | One stylesheet (`demob1234-style`), inserted before `</body>`, screen only. Every rule is scoped to the Demob tab's Coates and Sub-hired sections. |
| `patch_v1234.py` | Inserts the stylesheet on the verified live v12.33 page (BASE `c6b8141c…`) and moves the footer from v12.33 to v12.34. |
| `tests/test_v1234.cjs` | v12.32's 48 checks prove every word, light and button is still there; the new checks below cover the look. Three of the 48 now follow the record instead of fixed numbers, because Andrew's pick-ups kept arriving while this was built: today's card counts what the departure record says left today, and the rehearsal pick-up adds one. One follows v12.33's wording, where an unnumbered item says "Not numbered". |

**The new checks:**
- the sections are dark with light writing;
- on a phone every line is one grid card with no stacked labels, typically about 200 px and none over 360 px (the longest is a toilet line with eight unit numbers and a guide size);
- on a wider screen it is the same table, no line taller than 160 px;
- the red status edge shows while not ready;
- nothing runs off the side of the screen;
- printing keeps the light table.

## Built on v12.33

v12.33 (Demob identifier labels) went live at 12:11 AEST, while this release was being built. v12.34 was rebuilt on it, and keeps its wording: "Recorded code" for bulk product codes and "Not numbered" where nothing is numbered. v12.33 changed only the identifier wording (`specs` and `specHtml`); this release changes only styling, on the same classes.
