# v9.53 — Complete supported transport forecasts

Author: Andrew Fisher

State: implementation and focused checks complete; handed to the release owner for independent review, standard build/sweeps and publication. Not uploaded by this component's implementer. No operational records changed.

The carrier forecast now includes explicitly scoped, numeric card allowances for 24 planned demob movements and eight planned deliveries. They remain in the planned-movement table and CSV section, clearly described as unbooked allowances. They do not become booked loads, invoices or operational completions. Existing average demob allowances, actual costs and customer Revenue are preserved.

Exact Event Portables allocations suppress four duplicate card allowances and one duplicate average. Supplier quote pickup remains part of approved Rehire costs, with no extra carrier allowance. T0176 retains its existing average because the schedule and supplier source dates disagree; WC81 also retains its existing allowance pending quote-coverage review. WC31's second 16-pan block remains an explicit unquoted cost gap. The six supplier contract lines without a cost source remain unknown. Supplier missing-cost counts distinguish recorded costs from missing forecasts, and Q6846 shows its source hire dates.

Every allowance uses the native item/quantity cost match and whole positive physical quantity. Reference/task/movement identities distinguish shared tasks allocated across two references from duplicate stand-in rows. Conflicting scope, cancelled or removed tasks, POA, unknown quantities, relocations and partial supplier quote coverage produce no invented allowance. All forecasts feed the existing Transport, Costs to job end, Forecast P&L and Finance models once.

Sources reviewed: original 2026 rate card (Transport sheet, cost column, each way ex GST); approved Event Portables quotes and supplied 3 October v10 allocation plan; current native record 5104. Private originals, snapshots, detailed financial proof and phone captures remain outside Git in `/workspace/private-transport953/` and the existing private source folders. The public tests use generic fixtures only.

Checks completed:

- 25 focused generic checks passed, including duplicate/shared task identities, supplier scope, quantity guards, rounding and preservation.
- GET-only frozen-record native comparison: all 17 reconciliation ties pass; all actual money, customer Revenue, other supplier forecasts, actual schedule/typed costs and six existing average demob allowances unchanged.
- Forecast rows, branch weights and the Finance demob component reconcile; 32 new planned allowances and five exact overlapping estimates identified.
- Phone detail layout inspected at 390 px with no horizontal overflow.
- Exact-once patch guards reject reapplication and a non-v9.52 base. DATA is unchanged.

Run focused checks:

```sh
node test_transport953.cjs
CHROMIUM_PATH=/usr/bin/chromium BASE=/path/to/v9.52.html PAGE=/path/to/candidate.html OUT=/private/proof node browser.cjs
```

Hold the shared `/tmp/gc500-browser.lock` while running browser checks. The browser test rejects all non-GET requests and stores its financial evidence only at the explicit private OUT path.

Base SHA256: `8b703bb4135ae7d280c27c6f017f2fa3bd64cfa55ee4d1cb078875b1e29f2788`.

Reviewed source SHA256: `2d995f232f9cc4d33f2d0946fe268457d68b255ac1d5a73fefcfb4bc4d4a636f`.

Reviewed patch SHA256: `1aff3a3103011e4fa6eb6d428972171eac9794a7deffececbbf97f91725e95ad`.

Private composed candidate SHA256: `b4c2ec652c603c07b09afbca9ec2317816b96b4174e673339b77fb15314bfe8a`.

Root release checks: standard build reproduces the frozen candidate exactly; independent source review and phone inspection passed. Final desktop and phone sweeps each pass 22 routes, seven deep links and Back, zero errors or writes. Dry run confirms edit access and unchanged live base. READY TO UPLOAD; not yet live.
