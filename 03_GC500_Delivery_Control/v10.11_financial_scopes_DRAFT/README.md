# Bounded financial calculation scopes

Author: Andrew Fisher

State: IMPLEMENTED — final candidate checks passed, publication pending.

Exact live base v10.10: `6bc40d8d46b1ca5f936731f17c9d75738c0436c9d1a928e37c94c391a08d0258`.
Candidate: `a37381b49fec5317fb9b354b7eee2e314f3c6e15215449314e9f1a14c9303557`, 15,125,421 bytes, 103 inline scripts.

A standalone financial call during the authorised roster update repeatedly rebuilt reference and ownership indexes outside the existing render hold. The native operation stopped before any write; fresh native record 5806 exactly matched its backup. Fifteen financial entry points now use the existing synchronous calculation hold. They reuse indexes only inside the calculation, then clear them so later edits see current information. No rates, formulae, source data, shared documents, branches or map assets changed.

Validation: 36 pure checks, 9 independent real-cache checks, 106 browser parity/performance/freshness checks, 17 final financial controls, exact model equality against the published v10.10 snapshot, and both phone/desktop 22-route/seven-link/Back sweeps passed. Every tested standalone call finished under 1.75 seconds; the slow call previously exceeded three minutes. Rate, quantity, branch, nested-save and exception invalidation checked. Exact-source/repeat/wrong-base guards and upload dry run passed. Zero test writes or browser errors. The change is nonvisual; approved v10.10 phone visuals remain unchanged.

Root owns integration and guarded publication with scoped implementation and independent cache/source review. Eric's authorised 14 October roster addition follows actual-public verification through the native backed-up runner. Unknown hours remain blank; financial completeness limitations from the v10.10 audit remain explicit.
