# v8.73 — current asset identifiers and optional door side

Author: Andrew Fisher.

VERIFIED LIVE — 7 Oct 2026 12:45 AEST. Codex implementation and publication owner. Base live v8.72 SHA-256 `45aa441459fbbf1bef1d7fc9a42117365fff160e5f248483ab70f89839731887`.

Explicit current item/reference allocations take priority over original booking numbers in Timeline cards, expanded identifiers, driver tables and drop sheets. Multi-item records retain item identity. Split bookings keep only a verified matching allocation; an ambiguous replacement is not assigned to every truck. Original booking evidence is retained. No saved record is rewritten by this projection.

Loading offers mutually exclusive driver side, passenger side and Not applicable choices. A cleared/missing instruction remains distinct from Not applicable. All three choices use the existing per-asset shared record, timestamp merge, checklist and native printed sheets. Existing saved choices remain intact. Print-to-transit rules are preserved.

Tests run with live writes blocked; edit checks use isolated memory. Final candidate: asset/loading40/40 desktop and phone, Finance24/24 both, both21-route/seven-link/Back sweeps with no errors, and financial/record preservation1366/390 pass. Phone inspected. Candidate SHA-256 `7921eeb4e061198d0919f44ea5cec9e24a2d35c61b7a4f157f6b441ca2762fa7`, 11,102,652 bytes. Exact public bytes verified by guarded uploader; actual-public asset/loading40/40 desktop and phone pass, no errors or attempted writes. Source/READY `52af4b9f`. Claude independent v8.73 readback pending. Detailed operational evidence stays private.
