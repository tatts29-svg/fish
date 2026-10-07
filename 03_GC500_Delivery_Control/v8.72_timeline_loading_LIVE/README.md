# v8.72 — Timeline asset numbers and permanent door-side loading instructions

Author: Andrew Fisher · 7 Oct 2026

Base: verified live v8.71 `218cdafb9b24ff63981252833ba09a2e6367a174a51788f201abe4a5817e390c`. Codex owns implementation, checks and publication.

Known asset numbers appear above the Timeline lights. A folded loading control records either Door to driver side or Door to passenger side for each building or toilet. Unknown directions stay unset. The same saved instruction appears in the asset drawer, native driver/install sheets, individual drop sheets, supplier driver sheets and demob sheets. Driver and demob pre-dispatch checks include the loading instruction; changing it invalidates an older checked snapshot. Clear is an explicit saved event. Instructions merge independently by asset and timestamp and survive shared-record import/export.

Explicit recorded item assignments take precedence over note-derived tank numbers when counting completed tank work. This preserves item quantities and existing priced work; it records no completion by itself.

Printing an inbound driver run sheet retains the existing guarded print-to-transit behavior: a single load changes only that load, a day print changes only its selected inbound off-site loads, and on-site/finished, removal, preview, stale and read-only records stay unchanged. PDF preparation alone is not departure confirmation; a browser's later print cancellation is not observable.

Private operational inputs and record audits are kept outside Git. No financial rates, prices or forecast assumptions are changed by this release.

Build: `bash toolchain/build.sh v8.72 v8.72_timeline_loading_LIVE/patch_v872.py`.

Validation: isolated loading/print tests on desktop and phone; Finance 24/24 both widths; 21-route/seven-link/Back sweeps both widths; financial and record preservation at 1366/390. Final candidate and actual-public results are recorded below when complete.

Final READY candidate: `45aa441459fbbf1bef1d7fc9a42117365fff160e5f248483ab70f89839731887`, 11,100,193 bytes. Final loading/print checks 26/26 desktop and 26/26 phone; zero runtime errors or attempted writes. Phone layout inspected. Finance/navigation/preservation pass. The final printed wording is additionally checked on supplier and individual drop sheets.

Verified LIVE: 7 Oct 2026. Guarded uploader and separate public GET verify the final hash byte for byte. Actual-public loading/print26/26 desktop and phone; zero local HTML substitutions, runtime errors or attempted writes. Health OK serverv5.87. Codex publication complete; Claude independent readback pending.
