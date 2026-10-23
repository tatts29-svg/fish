# Servicing crew groups — draft

Author: Andrew Fisher · 24 Oct 2026

Andrew requested five crew groups, selected when completing work so each reference records the crew. This adds an explicit group selector to the reference's existing completion QR, stores attribution on each new completion and shows it in the crew status, main servicing table and Coates shift report/CSV. Cleaners and water remain separate even through the same Clean & restock QR. Existing task permissions, counts and exclusion/history rules stay intact. Earlier entries say “Group not recorded”. The selector clears on a new reference or reload, so a shared phone does not silently reuse another crew's identity.

Build from exact live v11.72 `84cb7d6c1eccf57ba1cca2802e149fd7ef28b4300c94ae2441f0164697af50ea`. Set `GC500_CREW_ROSTER` to the authorised private JSON roster (five objects, `id` and `label` only). IDs in order: `cleaners`, `pump1`, `pump2`, `pump3`, `water`. Do not commit that file or contact details. The build adds only these group labels to tracker display data; operational records are not rewritten.

Dependent server v5.92 must be deployed and verified first. Codex owns page/card implementation, checks and guarded publication; Claude owns the Railway switch. This folder is not READY TO UPLOAD while final browser checks and publication guards are pending. No live change has been made by this draft and no second-agent review is claimed.

Tests so far: 54 pure/report checks, 19 actual phone-to-local-server checks; 23 focused server and 205 legacy server checks in the dependent server folder. Native report and full desktop/phone sweeps are in progress. Test fixtures are synthetic or read-only snapshots; tests never write to live servicing.
