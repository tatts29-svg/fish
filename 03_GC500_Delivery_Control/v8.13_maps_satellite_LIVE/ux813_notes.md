# Explorer interactions — draft component

Author: Andrew Fisher

Search and a map pick select the reference on the map. Its existing **Open record** button opens the full dashboard record. A category keeps an included reference selected; switching to a category that excludes it, turning the category off, Fit, an area jump or a drawing-label jump clears the individual card and 3D ring together. Zoom retains the selected reference.

On a phone, Find stays open while choosing a category or inspecting an unplaced reference. Choosing a placed reference, area or actual drawing label closes Find and returns focus to the map. Sources has a top Close action and Escape works from focused inputs. The source text identifies the active imagery provider while retaining the capture-date, native-resolution and registration limits.

The source also corrects a mixed-search result case: clicking the first drawing-only label now goes to that label, even when reference results appear above it.

`patch_ux813.apply(text, path)` accepts `explorer.js` or `explorer-merge.js`. Apply after `patch_performance813`; the separate 3D component can follow. The entry component supplies the native Find disclosure and provider span. Authoritative item construction, georeference transforms, operational records and all map positions are retained.

Production function checks: 19/19 CPU cases and 7/7 source guards passed on the hashes in `evidence/ux813_cpu.json` and `evidence/ux813_guards.json`. Both output scripts parse. These checks use a small DOM fixture; actual phone/desktop visibility, focus and integrated 3D behaviour are separate browser evidence. This component is frozen provisionally for that review, not independently published.

Re-run:

```sh
python3 evidence/ux813_guards.py PERFORMANCE_EXPLORER ORIGINAL_MERGE REPORT_JSON
node evidence/ux813_cpu.cjs PERFORMANCE_EXPLORER PATCHED_EXPLORER PATCHED_MERGE REPORT_JSON
```
