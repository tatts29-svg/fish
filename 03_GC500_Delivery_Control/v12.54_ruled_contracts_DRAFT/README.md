# Ruled-contract calculation reconciliation — v12.54

Author: Andrew Fisher

Status: claimed, source review and implementation in progress; not READY or live.

Scope follows PR1 handover6481063732 on the exact live50.1 predecessor `69bf04e72a45e084f0ba5227b4a26cf95ffe4078429044946af473120d4e7bb2`. Recognise approved Price-only contract charges and reconcile existing per-piece and aggregate coverage before applying ledger/branch differences. Preserve every unruled contract, all operational records, current styling and unrelated calculations.

The private Baseplan9 original remains a source dependency. Existing source and routing checks can proceed; no full import or exact net movement is established yet. Original sources and detailed findings stay private.

Codex implements, tests and independently verifies. Claude publishes only a READY candidate through the guarded release process.
