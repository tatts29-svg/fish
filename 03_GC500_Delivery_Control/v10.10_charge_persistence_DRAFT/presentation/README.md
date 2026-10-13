# Presentation help disclosures

Author: Andrew Fisher

Six exact source changes preserve the existing race presentation and every source-bound figure/action:

1. Today: search and link-format help under More info.
2. Sub-hired: company ownership/branch explanation under More info; company buttons stay visible.
3. Build Truck flow: reorder instructions under More info; load order stays visible.
4. Build Truck flow: window-source explanation under More info; the live missing-window count stays visible.
5. Coates Way: page introduction and machine explanation together in one More info; film, open button and status stay visible.
6. Equipment: quantity-click hint stays visible; inventory calculation explanation under More info. Inventory warnings and totals are untouched.

The patch uses the existing `moreInfo()` component with six stable keys. It refuses repeated or ambiguous application. There are no broad CSS selectors, model changes, native writes or extra observers.

Static review also checked Demob, Costs/P&L and staff: existing disclosures already compact those sections. Build/Demob already hide repeated staff names beneath their weather cards while retaining the availability editor and save feedback; Today keeps its own staff panel.

Run `node check_presentation1010.cjs CANDIDATE.html BASE.html`. It parses all inline scripts, compares untouched model/critical action sections, and checks changing unknown-window counts, stale-warning removal and disclosure-state retention using isolated render fixtures. Root owns the final browser/navigation check.

Browser acceptance: each of the six help blocks opens by keyboard/tap, contains its retained text once and remains open after redraw. Confirm live quantity/curfew/pricing notices remain visible and staff is shown only once per Build/Demob day. No native writes are needed.
