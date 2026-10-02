# v8.08 The Coates Way machine — the info cards and the on-screen interface

Author: Andrew Fisher · DRAFT, not uploaded · 2 Oct 2026

Andrew (2 Oct 2026, about the Coates Way machine): "You need to get rid of the info boxes they pop up every where. And dont
close. I need you to upgrade this area. Push your limits further. ... Make this all 4k crystal clear. Improve every thing on
here. 10/10".

This note covers the interface only (files: `work/car-app.js`, `work/car.css`, `work/index.html`, `work/style.css`). The
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

RESULTS_PLACEHOLDER

## Changes needed in files I do not own

NEEDS_PLACEHOLDER
