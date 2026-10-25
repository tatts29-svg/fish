# Main servicing lock percentage — DRAFT, not live

Author: Andrew Fisher

The main servicing rings and area chips omitted `lockup` from their job list even though the task totals and lock icons already existed. Include it in that same list. The existing selected-night plans, unit weights, deduplicated job state, undo/void handling and rounded-down percentage stay unchanged. The display shows the physical-door label, percentage, done/total and remaining count. Nights or areas without lock jobs do not gain a misleading lock percentage.

This changes only the main servicing display and release footer. No crew-card, server, QR, declaration, operational-record or financial changes. Claude retains v12.22 Costs and publishes first; final v12.23 must build from its independently verified live bytes.

Development checks: synthetic model 24/24, exact preservation 12/12, native phone controller 10/10 (synthetic intercepted ticks, no writes). Final-base checks and both required full sweeps remain pending; this is not READY TO UPLOAD. Initial development base: verified v12.21 `f06ddbdfca7b13394e1477d32f54813f7866b5e371160dd876aa94639712bab7`.
