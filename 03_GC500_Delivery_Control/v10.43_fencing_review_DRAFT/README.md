# Unfinished fencing review handover

Author: Andrew Fisher

**NOT READY TO UPLOAD.** Handed to Claude under PR #1 comments 6208172592 and 6208179127. Codex has stopped implementation and publication; this folder preserves the unfinished generic patch only.

The patch reads a private reviewed input bundle via `GC500_FENCING_REVIEW`. Private source documents, operational records and reviewed values are deliberately excluded. The receiving owner must review the authorised originals and current records, and supply the matching input bundle. This draft is not a self-contained release.

The draft updates reviewed fencing evidence catalogues and selected person-name display calls. Record corrections were dry-run only; no corrections or candidate were published. Do not apply the candidate before reconciling its evidence snapshots with the corresponding current records.

A build from live v10.42 passed the shared static checks (129 scripts). Base SHA-256: `f7c29263e6425145e0c0a29fd273531fcdde0ce445f501ec2064717d452acc4b`. Browser sweeps, focused regressions, financial reconciliation and final visual review remain outstanding. Recheck the live base and source evidence before continuing; neither is assumed unchanged.

Companion compass work is separately preserved at commit `d59d0d707fd86cc4670dfb6f32cb70c7762a1d36` on `codex/gc500-compass-16oct`. PR #1 records its completed checks and un-published status.
