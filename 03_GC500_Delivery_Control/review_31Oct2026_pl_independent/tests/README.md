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

The facade currently exposes `PL1267.model()` and `PL1267.ledger()`. Capture supports `PL_AUDIT_FACE_API` if that facade is renamed, retaining stable output keys. Presentation selectors and expected headings currently target the established P&L face. Review an intentional API/DOM change and adapt the selectors explicitly; do not accept a skipped or unexercised check as a pass.

## Presentation and actual printing

`verify_presentation.cjs` checks desktop/phone overflow, financial headings and qualifications, cents in supporting notes, explicit branch bases and a visible allocation bridge. It clicks the real `#printCosts` button with the original `window.print`. For headless PDF saving it restores only the classes and page style captured during that native `beforeprint` event, because `afterprint` may already have cleaned them up. It does not add a missing permission class or bypass a business control.

`inspect_pdf.py` reads the resulting PDF text and checks report headings, exact current headline amounts, date/tax basis, and absence of warning-only output. Inspect the resulting actual screenshots and PDF pages visually as well: text presence alone does not establish readable pagination or a polished layout.

The bridge assertion expects a coherent, visible explanation containing the affected branches and exact revenue movements. If a candidate uses a different accessible bridge structure, inspect it and adapt the selector without weakening the requirement. Numerical revenue and cost movements are independently recomputed by the Decimal verifier.

## Audited baseline

On the pinned v12.69 page (`038bd277625bf5e3be5a47edaf7c2deb2eab34ffdec098bf4b2270870d6cbabb`), the expanded arithmetic verifier passes **245 checks**. Each desktop/phone presentation run passes **17 of 24 checks** and deliberately exposes the seven assertions covering the three known defects: rounded supporting amounts, undisclosed management allocation/bridge, and warning-only printing. These are baseline failures requiring correction, not a passing release gate.

The same-snapshot preservation comparison passes all **13 additional checks** (258 total). Private mutation checks also demonstrate rejection of a one-cent cost change, an unexplained branch shift preserving the whole-job total, and a mismatched snapshot. Added explanatory fields remain accepted. Captures make no document changes or operational write attempts.

For a candidate handover record the exact source commit, page hash, frozen-state identity in private evidence, check counts and unresolved findings. This baseline result makes no v12.71 readiness or live claim.
