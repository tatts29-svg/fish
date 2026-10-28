# v12.47 Build map-strip preview

Author: Andrew Fisher

**PREVIEW ONLY. Not ready for publication.** Andrew reviewed the actual card and chose: “Keep the dark card; add the map strip.” That is the final visual scope. All original card styling, spacing, typography, information, native DOM arrangement and controls stay unchanged. No further style choice is needed.

This local preview adds only a compact charcoal location strip to an existing Build delivery reference with a recorded coordinate. It uses the existing Find1176 location and picture functions. The reference, destination, equipment, qualified measurements, progress lights, delivery window, warnings, Navigate action, Details action and expanded native workspace remain in their original order. The approved date/weather cards and all other tabs are unchanged. It adds no operational stage and changes no record, rate, quantity, role, save handler or completion state.

The strip opens the existing full map at the exact coordinate returned by Find1176. Unknown coordinates do not get a fabricated preview. External satellite imagery is not fetched automatically. A missing image becomes an explicit map action rather than a blank image.

## Bounded lifecycle tested on the local preview

The observer stays attached for entry and exit. Queue admission and dequeue recheck the current scroll viewport; leaving the viewport prunes queued work and removes attached image sources. Both the compressed cache and attached thumbnail count are capped at 16. Reentry restores a retained thumbnail or requests one new draw. Picture generation, decoding and compaction share one draw slot.

Changed coordinates, removed/replaced cards and hidden panes reject stale results. The adapter checks again before creating a decoder and before canvas work. Hiding the document releases displayed images synchronously because animation frames may be suspended. Temporary decoder handlers/sources and canvas storage are cleared on success, failure or stale completion. Native location pictures and sharing APIs are unchanged.

**Offline evidence:** 129 lifecycle checks across 10 synthetic scenarios and 28 DOM/observer/decoder adapter checks across 4 synthetic scenarios pass. They use fabricated targets, no operational records, network or browser.

**Native preview evidence:** the exact candidate below passed desktop and phone scroll-out/source-removal, cache reentry, Build/Today tab round-trip eviction/reentry, single-draw and bounded-image assertions in the read-only harness. Closed and expanded card DOM identity, original text/controls, source/styles, date-card order and map-coordinate dispatch pass. Candidate documents are compared to the frozen snapshot before baseline reload, then checked again after baseline verification. No record changes, queued/inflight writes, blocked HTTP writes or runtime page errors were observed. These checks establish the local preview behaviour; they do not measure production heap usage or imply a live performance result.

## Exact base and boundary

- Tested local lifecycle candidate SHA-256: `a54f693a14d7899843f016ab867ca000e2522a56d7edc393c5b0257d2e7f573e` (16,047,281 bytes). Native read-only preview gate passed; this candidate has not been published.
- Preview inspection base: verified v12.43 HTML SHA-256 `7efda7e067d34b1455d8da9e3de29c695d4d216afc072e49e27754295a09976f`.
- `build_preview.py` rejects any other source and adds one style block scoped only to the new strip/preview label and one script block. It proves every original stylesheet block remains exact and removing these additions returns the exact original bytes. A separate hash guard preserves the exact dark-strip styling Andrew selected.
- Original cards receive no new class, style, wrapper or control-order change. The browser check mounts/removes only `.b1247-location` within one render and compares complete native card DOM, closed and expanded. A separate untouched-base comparison checks native text, controls, labels and identifiers; decorative SVG gradient counters vary across page reloads.
- Before any possible release, rebase on the tested successor of 43.1/45/44/46, reread current ownership and instructions, complete the native performance gates and rerun relevant checks. This draft has no publish script or release-ready claim.
- Actual-data screenshots, page HTML, record snapshot and browser report stay outside Git in private working output. No private record fixture is included here.

## Validation status — draft only

- **PASS:** all 149 original stylesheet blocks remain exact; removing the two preview additions recovers the exact base bytes.
- **PASS:** strict source and selected-CSS guards reject unexpected inputs without writing output; selected dark-strip CSS matches commit `6f138f4` exactly; all 215 inline scripts parse and the page check finds no new credentials.
- **PASS:** 157 offline lifecycle/adapter checks cover visibility, queue pruning, bounded attached images, cache eviction/reentry, observer replacement, single draw, hidden-document cleanup and stale-coordinate/removed-card/decode races.
- **CAPTURED AND INSPECTED:** current-candidate dark-card phone and desktop previews show the complete original information and action row with only the compact map strip added. Matching untouched-base captures are retained privately. The selected visual scope is unchanged.
- **PASS:** revised same-render closed/expanded DOM identity; exact native text/controls against the untouched base; original source/styles; date-card order/selection; exact map dispatch; desktop/phone native scroll and tab eviction/reentry; candidate and baseline record integrity. The exact candidate SHA and expected pinned record version were asserted before browser execution.
- **OPEN BEFORE PUBLICATION:** rebase onto the approved predecessor, rerun the relevant successor/regression checks and follow the guarded release/read-back process. The successful local preview gate is not a READY or live claim.

## Local preview and checks

```sh
python build_preview.py /private/path/live43-readback.html /private/path/preview47.html
node tests/lifecycle.cjs
node tests/adapter.cjs
node --check build_cards1247.js
```

`tests/preview_browser.cjs` uses the shared read-only candidate harness. Set private `PAGE`, `BASE`, `STATE`, `OUT`, plus `EXPECTED_PAGE_SHA`, `EXPECTED_STATE_VERSION` and `INITIAL_HASH=#timeline`; use the browser lease lock. It captures the same actual card before/after at desktop and phone widths, proves exact native DOM identity when mounting/removing only the new strip in the same render, compares native text/controls against the untouched base, checks date-card order/selection and exact map-action coordinates, checks real scroll/tab eviction and reentry, and verifies the frozen record remains unchanged before baseline reload and after the baseline run, with no HTTP writes.

The selected design is not live. Publication remains separate from the visual preview and requires the source rebase and outstanding release checks.
