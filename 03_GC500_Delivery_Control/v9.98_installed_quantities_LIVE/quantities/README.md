# Item description quantities

Author: Andrew Fisher

The shared reference drawer shows each known planned quantity beside its description. Each identified physical asset card shows one unit; quantity-only cards place their existing count beside the description. Unknown counts remain blank. Supplier ownership, names, photos, form values and native records are unchanged. The old separate planned count and quantity-only count are removed to avoid repeating them.

Integration: call `patch_quantities998.patch(html)` from the release patch. Source anchors are the shared `panel925`, `rowHtml925` and `ItemPhotos965.card` renderers. This applies wherever a reference is opened, including Today, Build, Equipment, Sub-hired, Demob and maps.

Source-only verification: `PAGE=/path/to/patched.html node quantities/tests/descriptions998.cjs`. Render tests cover mixed descriptions, zero/unknown quantities, quantity-only equipment, each supplier, native value preservation, escaping and a count changed on redraw. No browser or operational writes.

Release browser checks: open WC69 and verify `12 × FWF` is planned scope while six installed and six remaining remain distinct; switch WC09 between `4 × FWF` and `6 × Pee Panel`, confirm descriptions retain their exact option values, per-unit photos still target the selected item, and the quantity-only count is shown once in its card. Open one Coates building and a PremAir item through their existing routes; confirm native close/back controls and phone wrapping remain intact.

Browser runner (not run by this implementation task): under the shared browser lock, use `PAGE=/path/to/candidate.html MOB=1 EXPECT_CORRECTED=1 MIN_VERSION=<corrected-version> OUTDIR=/private/evidence node quantities/tests/browser998.cjs`. Repeat without `MOB=1` for desktop. It uses the actual Event Portables inventory button plus native reference entrypoints from Today, Build, Equipment, Demob and Map; discovers current Coates/PremAir units; waits for settled hydrated state; checks selector identity, counts, read-only records, Back/Close and width; writes two viewport screenshots and JSON evidence. Set `PUBLIC=1` without `PAGE` for actual-public checks, optionally with `EXPECTED_SHA`. Google map sessions/tiles use explicit local fixtures; no remote writes or map-image quality claim.
