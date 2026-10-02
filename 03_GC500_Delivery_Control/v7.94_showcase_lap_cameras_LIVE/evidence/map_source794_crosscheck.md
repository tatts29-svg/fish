# Map Explorer original-source cross-check — v7.94

Author: Andrew Fisher · 2 Oct 2026

The original **D001-26003-03-MASTER.pdf** was read visually, including the full sheet, pit complex, beachfront chicane, all three labelled pedestrian crossings, five over-track sign locations and the legend. Its SHA-256 `37792f0a9d32e829f34d28ab41197fd2cf689fb62cd60a755aa89106cb5a0a2f` matches Map Explorer's registration source exactly. Private PDF pixels and rendered clips remain outside the repository.

This is a different drawing from the **K220-K231-26003-02 COMBINED WFB.pdf** keyplan that supplies the Showcase ring (`fbfc4ff9eb41132f794681fc8c2e2440d022d6a38ee258906dbe454368b62fe7`). This audit read the K220 embedded metadata, not its original PDF. A newer D001 revision was not established here; the release owner is following up with the coordinating agent.

## What the source establishes

- The racing circuit closes on the main plan. The lower-right inset continues surrounding streets and support areas; it is not a missing section of the racing lap.
- D001 separates **PB1–PB3 pedestrian bridges**, **OT1–OT5 over-track signage**, and the **existing river pedestrian bridge**. The current Showcase instead has one rule-selected longest-straight bridge and a nominal start gantry.
- PB1 is on Main Beach Parade, sheet-right/geographic south of the T6–T10 chicane; PB2 is at Breaker/Pacific; PB3 crosses the highway after T15 before pit entry. OT1 is beyond pit exit before T1; OT2 approaches T5; OT3 follows T3; OT4 is on Hill Parade before T14; OT5 is at the upstream pit-entry split.
- The pit S01/S02 row, podium and separate pit entry/exit are confirmed. The drawing does not establish structural heights or exact facade construction. Photograph-informed detail inside unchanged nominal envelopes remains an accurate description.
- The legend specifies concrete barriers with **1.5 m debris fence**, with separate late-install barriers, spectator fence, security fence and water-filled barriers. These should not be treated as one interchangeable fence type.
- D001 provides stand locations that the current programme-derived, rule-spaced scene does not use. S12/S25 appear on D001 while the current stand-name list includes S22B; these identities need a crosswalk before changing decorative siting. This is not authority to alter the operational record.

## Limits that remain

Map Explorer's main registration has 20 independent checks, 0.670 m RMS and 1.611 m worst error; the inset uses a separate transform, with 0.922 m RMS. Both remain `unreviewed` image registration and unsuitable for set-out. Printed labels are not construction anchors. D001 points cannot be used directly as the K220 schematic scene coordinates. North points left on the printed sheet.

The retained Showcase width profile measures the **whole road from the 2022 aerial**, not the event race surface. D001 visibly separates race barriers, pit lane and other carriageway. v7.94's coherent corridor can correct internal rendering scale while remaining an illustrative corridor; this audit does not turn it into a D001 barrier extraction.

## Most useful bounded next additions

1. Transfer one verified PB/OT crossing into the retained scene through a tested D001-to-scene transform, then extend the crosswalk to the other structures. PB2 at Breaker/Pacific is an unambiguous first geometry candidate. Use actual crossing/support geometry, preserve centreline/physics, check cameras and clearances, and explicitly suppress any replaced nominal object.
2. Reconcile stand identities and place decorative stands in the verified precincts without touching operational references.
3. Add the river footbridge as its own verified landmark, separately from race-track crossings, once endpoints and visual proportions are checked.

No production code, source dataset, operational placement or live record was changed by this audit. Full machine-readable findings and label-coordinate cautions: `map_source794_crosscheck.json`.
