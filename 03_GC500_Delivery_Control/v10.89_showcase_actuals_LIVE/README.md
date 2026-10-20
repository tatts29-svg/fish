# Showcase actual work · v10.89

Author: Andrew Fisher.

Refresh the six quantity/progress scenes in the existing ten-scene Showcase from the current native work board, dated fencing summary and validated component records. The countdown and three team scenes delegate to their existing renderer. Scene order, layout classes, controls, audio and backdrop remain unchanged. On phones, only the six refreshed scenes receive a 12 px minimum for progress rows and notes. The existing fitter still sizes titles and counts; each count label wraps as its own block. The main equipment count and at least two completion rows are visible together, with the existing vertical scrolling available for longer content. The 3D backdrop attribution has a separate space below the scrolling text, so the complete explanatory note stays readable.

The equipment scene separates toilets recorded on site from completed units. Completion follows the board's unit counts, including individual VMS boards. Levelled and steps are labelled as reference checks. Fencing shows clean-work kilometres separately from bracing and existing-fence scrim; there is no combined fence completion or claim of unique standing length. Activity comparisons retain their units and CCB uncertainty. Components show panels, feet/blocks, clamps, braces/stays, wheels and barriers separately; incomplete component coverage is visible. The closer celebrates completed equipment categories while retaining remaining unit counts.

The directly requested About contact cleanup excludes exactly four retired contacts from the current contact projection, removes resulting empty section headings, preserves the explicitly retained installer and adds three current installation name credits. These additions contain names and the Installer role only, with no phone numbers, email addresses or contact links. The original team source, historical labour/cost records and Showcase roster scenes are unchanged.

No native data or commercial calculations are changed. Source contains no hardcoded project quantities, new installer identities or private attachment contents. The three new name credits are supplied from a private, exact-hash input at build time. All figures are read again for the selected day whenever a scene renders. Loading, stale and unconfirmed source states remain visible. This does not add an automatic congratulations claim or physical attendance inference.

## Build boundary

The final release is pinned by `base.json` to verified live **v10.88**, SHA-256 `690d5995b0c76e56127242487c0d55b877548eb3bc10dae1855320247323d2b0`, after its fencing update. Set `GC500_ABOUT_CONTACTS_INPUT` to the approved private JSON file outside the source checkout. `private_input_lock.json` records its SHA-256 and source identity; the loader verifies these and rejects phone, email and other additional fields. The original supplied contact details remain private and are not built into the page.

```sh
export GC500_ABOUT_CONTACTS_INPUT=PRIVATE_APPROVED_JSON
python patch_v1089.py INPUT_HTML OUTPUT_HTML
node test_showcase1089.js
node test_about_contacts1089.js
python ../toolchain/check_page.py OUTPUT_HTML
PAGE=OUTPUT_HTML EVIDENCE=PRIVATE_EVIDENCE node test_browser1089.js
MOB=1 PAGE=OUTPUT_HTML EVIDENCE=PRIVATE_EVIDENCE node test_browser1089.js
```

Use `flock /tmp/gc500-browser.lock` for browser tests and the configured `CHROMIUM_PATH` where required. Run the standard desktop and phone sweeps and the guarded release process on the exact candidate. No publishing is performed by these scripts. The output path is optional: `python patch_v1089.py INPUT_HTML` updates that file in place, as required by the shared `toolchain/build.sh`; export the same private input variable before invoking the official build.

For the identical checks against the actual public page after upload, unset `PAGE` and set `PUBLIC_LIVE=1`; the private input and evidence directory remain mandatory. This uses the same harness and blocked-write guard, with no local HTML override.

`--development` is explicitly limited to exact v10.86 SHA `d18ac8bff7966fd10a4c1ba954a8856b676bd747dfcbd716a5e3354d130f7f76`. It exists solely for parallel development before v10.88 publication; that candidate is not the release candidate.

## Validation

Synthetic model tests cover partial unit completion despite a complete reference, separate arrival/completion, unticked checks, distinct fence activities, CCB uncertainty, incomplete components, loading/stale states, pending evidence and HTML escaping. The GET-only browser test waits for the complete native collection and document catalogue load, exercises all ten scenes, compares category values with the native work board, captures six changed scenes, verifies Escape close and proves record, team, audio and order are unchanged. A temporary in-memory supplier-line override must leave physical fencing quantities and components unchanged; it is restored immediately and never saved. The same browser test verifies the exact About contact projection, the explicitly retained installer, the three private name credits without contact links, no empty headings and unchanged native/team history on desktop and phone. Screenshots and live model snapshots stay in private evidence, outside Git.

Status: VERIFIED LIVE at 20 Oct 2026 20:23 AEST. Source `bec47c7043750947a16ece2f1cd58bf9c1bd8a45`. Guarded upload and exact public-byte read-back passed. The actual public phone check passed all ten scenes, current contact projection, privacy, native-record preservation and data parity, with zero attempted native writes or page errors. Final candidate SHA-256 `2254fce73cefb76fdecb371509d7d37e1873d394d77193975842288f14ed3eae`, 18,546,467 bytes. The official build and 146-inline-script check pass. Both pure suites and focused desktop/phone checks pass; all ten scenes retain model parity, historical records, audio and scene order. Both standard sweeps pass 25 routes, seven links and Back, with zero page/console errors or attempted native writes. Phone screenshots were inspected, including the explanatory notes at the bottom of the scrolling area; a separate attribution strip keeps those notes readable. Independent source/privacy review confirms the existing servicing, Finance, TEAM and DATA content is unchanged. New installer contact details are absent from source and output. Guarded uploader dry run confirms edit access and unchanged live base.

For future read-back, run the same focused test with `PUBLIC_LIVE=1`, `PAGE` unset and private evidence/input paths, to check the actual public page. A successful upload alone is not the final UI verification. The existing broadcast has not been re-recorded.
