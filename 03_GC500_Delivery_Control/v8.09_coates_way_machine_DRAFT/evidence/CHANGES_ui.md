# v8.09 The Coates Way machine — the info cards and the on-screen interface

Author: Andrew Fisher · DRAFT, not uploaded · 2 Oct 2026

Andrew (2 Oct 2026, about the Coates Way machine): "You need to get rid of the info boxes they pop up every where. And dont
close. I need you to upgrade this area. Push your limits further. ... Make this all 4k crystal clear. Improve every thing on
here. 10/10".

This note covers the interface only (files: `work/car-app.js`, `work/car.css`, `work/index.html`, `work/style.css`; `mechanism.html`, `app.js` and `content.js` unchanged). The
car, the driver, the garage and the mechanics are other people's files in the same release and are not touched here.

## What was wrong (seen on a phone, 390 × 844, on the live copy in `../base/`)

- Every tap in the garage opened an "IN THE GARAGE" card on top of the car. Its Close button was at the bottom of the card,
  inside the card's own scroll, so on a phone it ended up off the bottom or behind the control dock.
- A press anywhere — including a finger on the card to scroll it — shut the card, and every card also shut itself on a
  timer (4 to 14 s), so the teaching text vanished while being read, then a new one popped up on the next touch.
- The drag-to-orbit test was only "the finger ended within 6 px of where it started", so a drag that came back, a pinch that
  lifted one finger, or a long press still opened cards.
- Read more, Controls ? and Original cog opened a separate full-screen modal on top of everything, the tour had its own box
  in another place, and nothing stopped two of them being up at once.
- The toast on a phone was stretched from 120 px down to 204 px above the bottom of the scene (both its top and bottom were
  set), and on a laptop it could sit on top of the card.
- "Ready to run" sat on the scene for good. The part callout could land on the dock. The register's × was 24 px high.
- On a real phone (browser bars showing) the dock started below the fold: the scene was 86 % of the screen tall plus a
  137 px masthead.
- On a 4K screen at 100 % the whole interface was laid out at laptop size in a corner: 10–14 px words on a 3,840 px picture.

## What changed, and why

**One card, always closable** (`car-app.js` openCard / closeCard / placeCards; `index.html`; `car.css` `.card`).
- All the teaching text — garage exhibits, sections of the cog, Read more, Controls ?, Original cog — now opens in one card.
  Opening another replaces what it says, so there is never more than one. The wording is unchanged, word for word.
- The card has a header (kicker, title and a 44 × 44 px ✕) that never scrolls; only the body scrolls under it.
- It closes on: the ✕; Escape; a deliberate tap on the scene that opens nothing else (a part, the floor, a wall); changing
  view with the tabs; starting the tour; Find a part; Reset. It no longer closes by itself, and pressing on the card (to
  scroll it) no longer closes it.
- The tour's card shares the same place and the same header with its own ✕ (= End tour). A card opened during the tour
  stands in for the tour card and the tour card comes back when it is closed. A tab pressed by hand ends the tour.
- Where it sits is measured from the page each time (placeCards, re-run on resize, scroll and when the dock changes size):
  - phone (800 px and under): a bottom sheet just above the dock, as tall as its words need, at most 56 % of the scene, never
    above the tabs or off the screen;
  - wider: a column on the left of the scene under the Cutaway / Slow motion / Power path buttons, down to the dock at most —
    clear of the car's centre (the test checks this).
  - Any scene button the card would cover (the zoom stack, the readouts) is put away until the card closes, so nothing is
    half-covered. The part callout moves beside the card (or above the sheet) instead of sliding under it.
- A card opened from below the scene on a phone (Read more, Controls ?) brings the scene back into view at once.

**Only a deliberate tap picks** (`car-app.js` input). One finger or the main mouse button, up within 0.65 s, never more
than 9 px (finger) or 5 px (mouse) from where it went down at any moment. A drag that comes back, a pinch, a long press or
a right-button pan opens nothing and closes nothing. One `pickAt()` now does the picking for the tap and for the tests.

**Toast** (`placeToast`): placed under the view buttons, between the left edge (or the open card) and the zoom buttons; if a
phone sheet leaves no room it goes to the top of the scene. It never sits on the dock, the tabs or the card. It stays 3.5 s,
up to 7 s for a long message.

**Status pill**: a new state is said in words for 6 s; a steady "Ready to run" then folds to its green dot (the words stay on
its tooltip and for screen readers). Warnings, "V8 running" and the tour keep their words.

**Phone layout**: the scene is the screen less the masthead (measured), so the car and the whole dock are on the first screen.
Footer buttons are 40 px high. The register's ✕ is 44 px.

**4K** (`car.css` `--ui`): on a screen 2,200 px wide and up at 100 %, the interface is scaled with the screen (×1.33, ×1.6,
×2 at 3,840 × 2,160) with CSS zoom on the interface pieces only. The 3D view is not scaled, so the car is still drawn on every
screen pixel (the renderer already draws at the screen's own pixel ratio, up to 3, when still). Callouts are sized to match.

**Mechanism page** (`style.css`): its two × buttons are 44 px.

Test hooks added (read only): `window.__cw.pickAt(x, y)` (what a tap there would meet) and `window.__cw.card` (which card is up).

## Test results

Run with `evidence/ui_tests.js` (instructions at the top of the file) on 2 Oct 2026, through the read-only rig, on the
`work/` folder with all the edits below in place. Final runs used `TUNE=dpr:0.5` (a smaller 3D drawing buffer; the interface
is laid out at full size) because the shared machine was drawing one software frame every 25–30 s. That was as slow on the
live copy (`base/`) as on `work/`, so the slowness is the machine, not this change.

| device | result |
|---|---|
| phone 390 × 844 @2, touch | **124 / 124 pass** (cards + toast + every control) |
| laptop 1440 × 900 | **133 / 133 pass** (cards + toast + every control) |
| tablet 768 × 1024 @2, touch | **88 / 88 pass** (cards, toast, layout) |
| 4K 3840 × 2160 @1 | **96 / 96 pass** (cards, toast, layout; ✕ 88 px, dock words 28 px) |
| live copy, phone (comparison) | 23 / 30: Close button 63 × 39 px and **covered** at its centre; register × 32 × 30 px; Controls ?, Original cog and Read more open a full-page modal, not the card |
| live copy, laptop (comparison) | 19 / 24: same register and modal findings (the fixed tap grid did not land on an exhibit there) |

What the card tests prove, on each device:
- six taps on the scene (exhibits and parts found by the page's own picking): never more than one card or dialog open;
- after every open: the ✕ is at least 44 px (88 px at 4K), inside the screen, and `elementFromPoint` at its centre is the ✕;
  the card is clear of the dock and the tabs and inside the screen; on laptop and 4K it is off the centre of the scene;
- the card closes with the ✕, Escape, a tap on empty scene, a view change; starting the tour swaps it for the tour card
  (which passes the same checks), and Escape ends the tour;
- a drag that starts on an exhibit, a drag that comes back to where it started, and a 0.9 s long press all open nothing;
  a quick tap on the same exhibit does open it;
- pressing and scrolling a card keeps it open; it is still open 16 s later (no timer);
- Controls ? scrolls inside itself with its ✕ fixed in the header; Original cog replaces it (still one card); Read more
  opens in the card; Find a part opens only the register, whose ✕ is 44 px;
- a toast covers no control, and with a card open covers neither the card nor the dock;
- no page errors or console errors.

Controls checked (phone and laptop): the three tabs, Guided tour (start, Next, End), Sound, Full screen, Find a part (search
and pick), the part list, Start V8 / Stop V8, throttle, brake, steer, gears up and down, Explode powertrain (the driver gets
out first), Service (first step), Reset, cutaway, slow motion, power path, zoom in / out / fit, Quality (all three steps),
4K capture (the PNG downloads), Original cog, Controls.

Pictures looked at (kept in the scratchpad, not the repo): phone at rest, garage card, tour card, Controls ? with a toast,
on phone, tablet, laptop and 4K. On a phone the sheet covers the lower half of the scene while it is open; that is the
trade for full-size teaching text with its ✕ in reach, and the ✕ puts the car back.

**Also run:** `people_tests.js work desk` after the people agent's edits: the race driver now gets out beside his open door
and walks to the safe spot (state "out" at -4.4, -3.75). **1 FAIL remains, in crew behaviour, not in car-app.js:**
"mechanic: into safety in 2 of 1565 samples" during the far wheel service (mechanic at -3.30, -2.67 brushing the safety
officer at -3.66, -2.68). Left with the people agent (crew.js).

## Changes needed in files I do not own

**None needed from me for this scope.** Three things for the others:

1. **For whoever adds on-screen text later (any file):** please put teaching text through `openCard(kind, {kicker, title,
   body})` and messages through `toast()` in `car-app.js`, not new floating boxes, so the one-card rule and the placement
   keep holding. Tests can read `window.__cw.card` and `window.__cw.pickAt(x, y)`.
2. **people agent (crew.js):** the remaining people_tests FAIL above (mechanic into the safety officer, 2 of 1,565 samples).
3. **Performance (whoever owns it):** under software rendering on this shared machine a laptop frame took 25–30 s, as on the
   live copy. Not an interface issue, but worth a frame-time check on a real GPU before release.

## Edits folded in for other agents (in files I own)

- **mech agent, `car-app.js`:** in `updateTransforms()`, after `engine.setStarter(...)`:
  `if(engine.setBrake)engine.setBrake(effBrake());` so the pedal or the handbrake clamps the new brake pads (mech-brakes.js);
  a no-op without it.
- **mech agent, `index.html` + `car-app.js`:** the footer's starting text says "V8 · 326 PARTS" (was 310), and car-app.js
  writes the register's own count there at load (`specs.length`) until the frame counter takes over.
- **people agent, `car-app.js`:** the eight replacements from `CHANGES_people.md`, applied exactly (all search strings
  matched): new `DX_SILL` (.70, -1.50) and `DX_SAFE` (-4.4, -3.75); `crewState().apart`; `crew.addPerson(man)`; the driver
  appears crouched outside the open door instead of crawling through the car, shuts the door before walking off, the door
  opens when he arrives back, no crawl back in; both walks back to the door use `crew.plan(...).slice(1)`.

## Review fixes (independent review, 2 Oct 2026)

- **A card is said when it opens** (`car-app.js` openCard / closeCard / endTour, `index.html`).
  - The card was a dialog named by its title, but focus never went into it, so a screen reader said nothing.
  - Opening a card now moves focus to its title. The title is a heading kept out of the tab order (`tabindex="-1"`), so the reader says
    the card's name. The Guided tour does the same when it starts.
  - When the card closes, focus goes back to whatever opened it: the scene, Controls ?, Original cog or Guided tour. It does not do this
    if the person has already moved focus to something else, such as a view tab. A card replaced from another button returns focus to
    that button.
  - A keyboard user sees an orange outline on the focused title. A mouse or finger sees none.
- **"Ready to run" is still read out when it folds to its dot** (`car.css`). It was hidden with `display:none`, which hides it from screen
  readers too. It is now hidden to the eye only (a 1 px clipped box).
- **The quality setting on a phone** (shared with the fx part). On a phone or touch tablet, Quality steps Laptop ⇄ Balanced only. car-app.js
  now uses one phone test, `fx-quality.js` `MOBILE` (an iPad that reports itself as a Mac counts too), for choosing the starting rung and
  for the exhaust lights.
- `ui_tests.js` new checks:
  - focus goes to the card's title, in a dialog named by it;
  - focus returns to the opener when the card closes;
  - focus goes to the tour's title when it starts, and back to Guided tour when it ends;
  - a quiet "Ready to run" is still in the page for a screen reader;
  - on a phone, Quality never offers High or Ultra.

| run (`TUNE=dpr:0.5`) | result |
|---|---|
| phone 390 × 844 | **123/123**. A first run had 122/123: "camera: zoom-out" missed its 0.18 s glide between two 0.3 s polls on the software renderer. The re-run passed, and no code was changed between the two runs. |
| desktop 1440 × 900 | **138/138** |

### Follow-up (camera at the driver's door, print budgets)
- The camera now comes round to the driver's door while he gets out and back in. Details are in CHANGES_people.md. A drag, pinch, scroll,
  zoom or view button leaves the camera with the person at once.
- `ui_tests.js`: the first tap on a garage exhibit now looks again if the exhibit has moved, as the third tap already did. Logged in the
  page: the overhead crane was under the tap point just before the tap and gone from it just after. The crane travels, and it moved in
  the 0.4 s between the survey and the tap. A card must still open from a real tap on an exhibit.

| run (`TUNE=dpr:0.5`), final | result |
|---|---|
| phone | **129/129** |
| desktop | **138/138** |
- Two more checks in `ui_tests.js` hardened against timing on the software renderer, still testing the same thing:
  - The "quick tap after all that" looks again once if the travelling crane has moved off the spot.
  - The zoom check also accepts the camera's distance having changed. The 0.18 s glide can be over between two 0.3 s polls.

### Codex review fixes (f45961b)
An independent review (branch `codex/gc500-v794-lap-cameras`, commit f45961b, `review_v809_extra_agents/`) found two phone faults. Both
were checked against our code and fixed with their patch.
- **Two fingers on the steering wheel.** A second finger landing while one held the wheel threw away the hold. Once both fingers were
  lifted, the wheel stayed held and the view could not be turned. Now the hold is kept until its own finger lifts or is cancelled.
- **Find a part during the guided tour.** The tour card stayed open under the register, and came back when the register closed. Opening
  Find a part now ends the tour first, so only one thing is open.
- **Button names.** Guided tour has `aria-label="Guided tour"` (its words are hidden on narrower screens). The part-details toggle (− / +)
  is named "Toggle selected part details" and points at what it opens.
- **Not taken:** their optional change moving focus to the tour heading on every Next. A keyboard user would have to tab back to Next at
  each step. Focus still goes to the heading when the tour starts.
- New in `ui_tests.js`: Find a part during the tour; the two button names; and two fingers on the wheel on the phone, lifted in either
  order or cancelled. These are real touches in the driver's seat, the only place a phone can reach the wheel. With the V8 running, the
  check reads the steering rack: a held wheel holds still, and once both fingers are up it must sway with the rumble again. Desktop has no
  second finger, so this runs on the phone only.

### Final runs (3 Oct 2026): one test measurement corrected, no page change
On the 4K screen, the check that a quiet "Ready to run" is still read by a screen reader failed: the text measured 2 × 2 px against a
limit of 1 px. The page is right. The text is hidden the standard way (1 CSS px, `overflow:hidden`, `clip`, `clip-path:inset(50%)`).
On a 4K screen the interface is drawn at `zoom: var(--ui)` = 2, so 1 CSS px measures 2 screen px. The test now reads the size in CSS
px, dividing by the zoom as the dock-words check already does. It also requires the clip that makes the text invisible, so the check
is stricter than before. A `display:none` still fails it.
