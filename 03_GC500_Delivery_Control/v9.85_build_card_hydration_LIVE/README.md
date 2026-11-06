# Build card loading correction

Author: Andrew Fisher

VERIFIED LIVE — uploaded 10 Oct 2026 14:43 AEST; actual-public verification completed 10 Oct 2026 14:45 AEST. Source ecde29c3; READY record 2db77512.

Actual-public verification of v9.84 exposed a loading race: an empty shared collection can finish loading without changing S. The card cache used S alone, so it could retain an unavailable historical percentage after native progress became ready.

v9.85 includes native progress health in cache invalidation, only retains ready progress calculations, and refreshes Build from the existing sync footer heartbeat when health changes. No new timer, schema, operational write or financial-model change. The approved v9.84 presentation and data rules remain unchanged.

Exact live base: 5f5ac67334f382985d57e136277a6321bf47565ac1033e35cf203c631ae1e45c. Codex implements and independently tests this follow-up; no Claude review claimed.

Final candidate: f36c42ebb6f85a49f62663b5c5454510308dee7ea0087e2bed01a860b5a2c3c8, 14,592,170 bytes, 69 scripts. Deterministic regression reproduces the v9.84 failure and passes 13 checks on v9.85. Full desktop60 / phone59 card checks pass; both22routes/sevenlinks/Back pass. Native5201, all15 financial models and12 operational projections exactly preserved against v9.84. Desktop/phone screenshots inspected. No page errors or operational writes. Guarded upload passed exact-base protection and byte-for-byte public readback. Actual-public desktop62 / phone61 card checks and15 hydration checks pass, with no HTML substitution, page errors or operational writes. Genuine public desktop/phone screenshots were captured before isolated weather fixtures and inspected. The loading race is corrected on the actual served source.
