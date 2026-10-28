# v12.47 Build map-strip preview

Author: Andrew Fisher

**PREVIEW ONLY. Not ready for publication.** Andrew reviewed the actual card and chose: “Keep the dark card; add the map strip.” That is the final visual scope. All original card styling, spacing, typography, information, native DOM arrangement and controls stay unchanged. No further style choice is needed.

This local preview adds only a compact charcoal location strip to an existing Build delivery reference with a recorded coordinate. It uses the existing Find1176 location and picture functions. The reference, destination, equipment, qualified measurements, progress lights, delivery window, warnings, Navigate action, Details action and expanded native workspace remain in their original order. The approved date/weather cards and all other tabs are unchanged. It adds no operational stage and changes no record, rate, quantity, role, save handler or completion state.

The strip opens the existing full map at the exact coordinate returned by Find1176. Unknown coordinates do not get a fabricated preview. External satellite imagery is not fetched automatically. A missing image becomes an explicit map action rather than a blank image.

## Performance gate still open

Embedded pictures are queued near the viewport, one draw at a time, with a 16-item compressed-image cache. **Fast-scroll and memory gates are pending:** a queued card is not currently rechecked for intersection, and already visited DOM images are not evicted when the cache drops an item. The cache cap therefore does not cap decoded-image memory. Before production, add continuous visibility checks, queue pruning, decoded-image eviction and reentry tests, reusing the guarded 43.1 approach where suitable. This visual preview makes no production speed or memory claim.

## Exact base and boundary

- Preview inspection base: verified v12.43 HTML SHA-256 `7efda7e067d34b1455d8da9e3de29c695d4d216afc072e49e27754295a09976f`.
- `build_preview.py` rejects any other source and adds one style block scoped only to the new strip/preview label and one script block. It proves every original stylesheet block remains exact and removing these additions returns the exact original bytes.
- Original cards receive no new class, style, wrapper or control-order change. The browser check mounts/removes only `.b1247-location` within one render and compares complete native card DOM, closed and expanded. A separate untouched-base comparison checks native text, controls, labels and identifiers; decorative SVG gradient counters vary across page reloads.
- Before any possible release, rebase on the tested successor of 43.1/45/44/46, reread current ownership and instructions, close the performance gates and rerun relevant checks. This draft has no publish script or release-ready claim.
- Actual-data screenshots, page HTML, record snapshot and browser report stay outside Git in private working output. No private record fixture is included here.

## Validation status — draft only

- **PASS:** all 149 original stylesheet blocks remain exact; removing the two preview additions recovers the exact base bytes.
- **PASS:** strict source guard rejects an unknown source without writing output; JavaScript and preview-test syntax checks pass.
- **CAPTURED:** actual dark-card phone and desktop previews, with the full original action row visible, using the read-only frozen-record harness. Andrew has seen these and the selected visual scope is settled.
- **NOT YET RERUN:** the revised same-render closed/expanded DOM-identity test and final untouched-base preservation assertions. Its source is ready; browser execution is deferred behind critical release gates. Do not report these revised assertions as passed.
- **OPEN BEFORE PUBLICATION:** rebase onto the approved predecessor and close visibility, queue-pruning, decoded-image eviction/reentry and relevant release/read-back gates. No READY or live claim.

## Local preview and checks

```sh
python build_preview.py /private/path/live43-readback.html /private/path/preview47.html
node --check build_cards1247.js
```

`tests/preview_browser.cjs` uses the shared read-only candidate harness. Set private `PAGE`, `BASE`, `STATE`, `OUT`, plus `INITIAL_HASH=#timeline`; use the browser lease lock. It captures the same actual card before/after at desktop and phone widths, proves exact native DOM identity when mounting/removing only the new strip in the same render, compares native text/controls against the untouched base, checks date-card order/selection and exact map-action coordinates, and verifies the frozen record remains unchanged with no HTTP writes.

The selected design is not live. Publication remains separate from the visual preview and requires the source rebase and outstanding release checks.
