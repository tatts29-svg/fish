# Independent review of the v12.71 P&L candidate

Author: Andrew Fisher

31 Oct 2026. Claude's handover: PR #1 comment 6537353898. Codex independently rebuilt source `e3c16a702f507c1cf501a883bcf8e9346eaf3068` using the shared toolchain on live v12.69, SHA-256 `038bd277625bf5e3be5a47edaf7c2deb2eab34ffdec098bf4b2270870d6cbabb`.

The result exactly matches Claude's candidate: **`c6b6bb015bdb78738625aab55dcfdb4aa2c0775735bb7efde84e79f9f0d0177e`**, 16,551,091 bytes. This is a candidate review, not a live-release verification. Claude retains implementation and the preview/publication gate.

## Independent results

- Shared page checker: 222 scripts, PASS.
- Recorded-input arithmetic, allocation reconciliation and same-snapshot preservation: **258/258**. Existing financial projections and source routing are unchanged.
- New explanatory branch fields independently compared with the separately derived Finance/management bridge: **46/46** exact-cent checks.
- Desktop and phone presentation plus actual Workings Print-to-PDF: **24/24 each**. Native `window.print` was retained. The PDFs contain the P&L rather than the old refusal page.
- Actual desktop and phone PDF pages visually inspected: figures and headings are complete and legible. The four-page layout leaves the gaps section on its own final page; this is pagination polish, not missing content.
- No operational writes, record changes, runtime errors or console errors in these checks.

The source-row checks verify arithmetic on recorded inputs. They do not independently certify every original invoice, rate card, unpriced input or historical business exception. Private snapshots, amounts, screenshots, PDFs and detailed results remain outside the repository.

## Finance semantics

The labelled bridge resolves the main face's management-versus-invoicing ambiguity. It derives the displayed moves separately, reads Finance's own branch figures and retains original contract attribution. **Keep the Finance handover/CSV on its existing invoicing basis.** No reclassification or replacement of its amounts is needed to resolve the presentation finding. Any future change of invoicing semantics would be a separate business decision.

Remaining accuracy/precision corrections should precede the final preview:

1. **Describe the revenue move as the existing management allocation.** The new bridge's small print calls it the project manager's 29 October ruling. The board's 29 October 16:25 acceptance note explicitly distinguishes Andrew's workforce-cost ruling from the revenue follow-on inference. Unless later explicit evidence exists, use “existing management allocation” for the revenue move, retaining the established cost instruction and every amount. Apply the same distinction to explanatory source comments/documentation. This needs a wording correction, not a new allocation decision.
2. **Retain cents in the inherited Finance handover display too.** Its `fh866Html` formatter still routes monetary cost/invoice cells through `money0`/`Math.round`, without an approximation label. The CSV already exports the model values with their precision intact. Prefer two-decimal `money` for these monetary cells so the financial views consistently show their existing cents; preserve category labels, hours and raw branch attribution.
3. **Name the transport breakdown's period.** Claude identified in PR #1 comment 6537380904 that the branch split reconciles to job end, while the row also shows a so-far amount. His proposed “job end by branch” label resolves this ambiguity without changing the figures. The documentation-only follow-up `9456756b51f58f29972ccd80ed764b5977709fca` records that correction as open; the reviewed candidate bytes remain unchanged.

Also label the folded ledger's “By branch · job end” table as the management view. Its values are unchanged, but the label should distinguish it from Finance's invoicing view just as the main face now does.

## Optional presentation polish

- Reduce the mostly empty final PDF page if that can be done without crowding or shrinking the report.
- The inherited print note says “asset map printed” even for a P&L. A context-appropriate P&L label would be clearer.
- The new quote/estimate cue names a subset; it is not proof that every remaining cost has a final invoice. Keep the existing incomplete-cost qualification visible.

Corrections remain with Claude. Recheck the exact amended candidate and affected presentation/print paths before making a final readiness claim.
