LIVE as part of combined v9.48 — 9 Oct 2026 08:48 AEST. Exact public page SHA256968cd3a850584736fcfa28b403e9b7fd2d280557e86984c8be87c2b5bf8c0ca1. Component notes below retain their implementation history.

# Movement-specific loading shapes — v9.42

Author: Andrew Fisher. Ready for integration; not live. Root owns publication and final combined sweeps.

Arrange loads now shows the selected movement's products and quantity. Previously the 9 Oct FWF/pee-panel delivery displayed the reference's unrelated toilet blocks, and a one-building movement showed both allocated buildings. Full, unambiguous physical allocations retain their native IDs and door-side controls. Partial or unknown allocations show a product reference diagram without choosing an asset number.

The native paired-set suffix is treated as metadata. A toilet block described with its paired waste tank now uses a toilet-block outline. A unique matching numbered native door row restores the recorded side when the booking's long item label omitted its loading-row ID. Ambiguous asset numbers or product mismatches cannot attach a door record. Native identity, ownership, photographs, guide dimensions, finances and stored records are unchanged. Map outlines remain the original destination context, not a drawing of the truck's cargo.

The patch replaces only the existing Shapes926 adapter and footer, accepting the focused v9.38 or combined v9.41 base. Original vector geometry, printing, Loading931 and all other page bytes are identical. The existing panel styles and read-only loading information remain.

Validation: 28 synthetic allocation/classification/save-guard checks; all 43 programme days, 172 delivery loads, 49 removal loads, 238 loading products, 134 placed markers and 182 references; zero audit issues. Desktop and 390px phone checks cover both corrected paths, a partial-building movement and the dense 19 Oct map. Phone screenshots were visually inspected. Native driver product scope and dimensions are preserved; no new printed-shape layout was introduced. Operational state, transport specs and all financial models remain unchanged. The strict test harness denied native writes before navigation; only the expected denied Google map-session POST occurred. Shared page validation passes all 43 inline scripts.

Private raw evidence and screenshots remain under `/workspace/private-shapes942/`; only sanitised totals and source hashes are committed. The source proof names the exact combined base and candidate. Root must rebuild this patch into the final combined release before publication.

Run synthetic checks with `node tests/model942.cjs`. For live read-only checks, set `PAGE` to the candidate, `OUT942` to a private output directory, the toolchain `NODE_PATH`, and `CHROMIUM_PATH`; run `tests/actual942.cjs` then `tests/visible942.cjs` under the shared `/tmp/gc500-browser.lock`. The second test replays the first test's authenticated snapshot for consistent comparison. Never use these tests to write live records.
