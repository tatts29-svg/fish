# Independent P&L verification pack

Author: Andrew Fisher

Claude owns the v12.71 corrections; Codex owns these read-only checks. The pack verifies recorded-input arithmetic and presentation. It does not certify original invoices, rate cards, unpriced costs or business exceptions, and it does not change records or publish a release.

## Inputs and privacy

Use the exact candidate HTML and a frozen service-state JSON containing `version` and `docs`. Use the same snapshot and as-at date for baseline and candidate. Keep both inputs and every output outside Git worktrees. Outputs include private financial models, source-row details, screenshots and PDF text; do not commit or paste them into PR #1.

Requirements: Node with Playwright, Chromium, Python 3 and `pdftotext` (Poppler). The shared native harness is imported from `v12.43.1_offsite_pictures_LIVE/tests/native_harness.cjs`. Set `NODE_PATH` and `CHROMIUM_PATH` for the local environment if needed. Run browsers under `/tmp/gc500-browser.lock` when sharing this workspace.

From this directory, substituting real private paths:

```bash
export PAGE=/private/candidate.html
export STATE=/private/frozen-state.json
export OUT=/private/pl-candidate-check

flock -x /tmp/gc500-browser.lock node capture_models.cjs
python3 verify_cents.py
flock -x /tmp/gc500-browser.lock node verify_presentation.cjs
MOB=1 flock -x /tmp/gc500-browser.lock node verify_presentation.cjs
```

The browser checks block operational writes, confirm the pinned documents remain unchanged and report runtime errors. Console output contains check names and counts; detailed evidence is written to `OUT`.

## Arithmetic and branch reconciliation

`capture_models.cjs` reads native models and the paid-hour/rate inputs without editing them. `verify_cents.py` independently recomputes priced labour rows with Decimal arithmetic and per-row cent rounding, totals the cost/revenue streams, checks subtraction and supplier splits, and derives the management/invoicing branch bridge from recorded allocation inputs. Legitimate differences between the two branch bases remain explicit.

Capture the audited baseline into a separate private output directory. Then protect its existing financial projections and source routing with:

```bash
OUT=/private/pl-candidate-check python3 verify_cents.py \
  --baseline /private/pl-baseline-check/models.json
```

The comparison refuses mismatched STATE hashes, record revisions or as-at bases. Recapture both pages on one frozen snapshot if any differs. Added explanatory fields are allowed; changed existing numerical projections and source classifications are flagged. A real numerical correction requires separately documented evidence and review of that expected difference, rather than suppressing it.

### Explicit revenue basis for the third v12.71 draft

Source `994a50ca5c7c53ccd7ac54e44754a6adbb45566e`, handed over in PR #1 comment 6538198864, keeps revenue on the invoicing branch. Select that expectation explicitly; the verifier never infers the intended rule from the candidate's values:

```bash
OUT=/private/pl-third-candidate-check python3 verify_cents.py \
  --revenue-basis invoice-branch \
  --baseline /private/pl-baseline-check/models.json \
  --baseline-revenue-transition legacy-to-invoice-branch
```

The last option is only for comparing the legacy staffing-to-KINP allocation with this documented revenue transition. It first proves the old fields against the baseline's own Finance invoice rows and staffing-source inputs. It then derives replacement branch revenue, branch contribution and revenue-movement fields on a copy of that baseline. Candidate values never supply the expected result. Costs, source classifications, monetary line items, whole-job totals and every unrelated projection remain subject to the normal strict comparison. The original evidence file is never overwritten.

`--revenue-basis` defaults to `legacy-staffing-to-kinp` for earlier releases; that default correctly rejects the third draft. Selecting the new basis without explicitly allowing the baseline transition still flags the intended branch changes. Comparing two already-invoice-basis captures requires `--revenue-basis invoice-branch` but no transition option.

On the exact third candidate `b019bb96464fdea89f4d4a47824849e561a7ec54f5ea9027e72a243d15c84b9c`, the explicit basis/transition run passes **308/308** checks. The updated legacy default passes **264/264** on the legacy snapshot. Private negative checks reject a one-cent error, a same-total cost shift, an unexplained partial revenue transfer, a different snapshot and a baseline inconsistent with the claimed old rule. These counts include additional rule checks introduced with this option; earlier counts below document the earlier pack.

This scoped draft check does not verify subsequent invoice, fencing, purchase-order or month-end report changes. Those require their own exact inputs, source and stated business basis; this option is not a general baseline reset.

The facade currently exposes `PL1267.model()` and `PL1267.ledger()`. Capture supports `PL_AUDIT_FACE_API` if that facade is renamed, retaining stable output keys. Presentation selectors and expected headings currently target the established P&L face. Review an intentional API/DOM change and adapt the selectors explicitly; do not accept a skipped or unexercised check as a pass.

## Presentation and actual printing

`verify_presentation.cjs` checks desktop/phone overflow, financial headings and qualifications, cents in supporting notes, explicit branch bases and a visible allocation bridge. It clicks the real `#printCosts` button with the original `window.print`. For headless PDF saving it restores only the classes and page style captured during that native `beforeprint` event, because `afterprint` may already have cleaned them up. It does not add a missing permission class or bypass a business control.

`inspect_pdf.py` reads the resulting PDF text and checks report headings, exact current headline amounts, date/tax basis, and absence of warning-only output. Inspect the resulting actual screenshots and PDF pages visually as well: text presence alone does not establish readable pagination or a polished layout.

The bridge assertion expects a coherent, visible explanation containing the affected branches and exact revenue movements. If a candidate uses a different accessible bridge structure, inspect it and adapt the selector without weakening the requirement. Numerical revenue and cost movements are independently recomputed by the Decimal verifier.

## Audited baseline

On the pinned v12.69 page (`038bd277625bf5e3be5a47edaf7c2deb2eab34ffdec098bf4b2270870d6cbabb`), the expanded arithmetic verifier passes **245 checks**. Each desktop/phone presentation run passes **17 of 24 checks** and deliberately exposes the seven assertions covering the three known defects: rounded supporting amounts, undisclosed management allocation/bridge, and warning-only printing. These are baseline failures requiring correction, not a passing release gate.

The same-snapshot preservation comparison passes all **13 additional checks** (258 total). Private mutation checks also demonstrate rejection of a one-cent cost change, an unexplained branch shift preserving the whole-job total, and a mismatched snapshot. Added explanatory fields remain accepted. Captures make no document changes or operational write attempts.

For a candidate handover record the exact source commit, page hash, frozen-state identity in private evidence, check counts and unresolved findings. This baseline result makes no v12.71 readiness or live claim.
