# v12.33 — Demob identifier labels

Author: Andrew Fisher.

**LIVE — 26 Oct 2026, 12:11:07 AEST.**

READY source: `2dd95862fc964f8ac94d00043d78adc4e6440ccc`. The guarded uploader verified the unchanged v12.32 base and served the exact candidate. Independent public GET at 12:11:55 AEST matched the complete file, the release footer and the changed identifier functions. Post-publication phone checks on those exact served bytes passed 812/812 with zero page errors, console errors or blocked writes; the phone display was inspected.

The Demob specification line in v12.32 labelled recorded bulk product codes as “Asset no.”. The existing unnumbered-item rule says that this equipment is counted by quantity. This presentation fix retains the recorded values under “Recorded code”. Unnumbered equipment with no recorded identifier says “Not numbered”, with the existing size warning when required.

Genuine equipment and supplier fleet numbers retain their original wording. Mixed references keep genuine asset numbers separate from bulk codes. The classifier uses the existing unnumbered equipment rules and typed products, not the shape of the identifier. If classification is unavailable, the provider's original identifiers and specifications remain visible.

Only `Ready1231`'s `specs` and `specHtml` functions and the release footer change. The original `nos` and `facts` results remain intact. All other page bytes are preserved: no record, quantities, charges, ownership, dimensions, pickup status, Emptied gate, tracker or report changes.

## Source and candidate

- Starting source: `39e82995086c085511760c2cbaed56df8eef37a4` on `ccr-061f77e8-ivjhrv`.
- Claim: `9fee41aedd652674e016529a9c314425286a6442`; PR #1 comment `6406185916`.
- Verified live base v12.32: `6987269676b8d9089742978032208ffc930ebc4165471d13296285f9c745cd6f`.
- Candidate v12.33: `c6b8141c32728a7f59914aa53c0032cb8770131e142407bc0d0e7f84a4a0cf45`, 15,514,494 bytes.
- Patch SHA-256: `f79e1b4a7d022ee612774c2ea18fe535bde88bf1050b5c8f18f085f420e2e70a`.

## Checks

- Shared page checker: 207 inline scripts, passed.
- Focused renderer tests: 23/23, covering bulk codes, genuine numeric and alphanumeric fleet identifiers, mixed references, fallbacks, escaping and unchanged specifications.
- Exact-source preservation and wrong-base/reapplication refusal: 6/6.
- Independent offline review: 15 renderer cases and 8 preservation/guard checks passed.
- Native desktop and phone: 812/812 each across all native Demob references. Ordinary specification rendering is unchanged, recorded identifiers and facts are preserved, and rendering does not change the record. Zero page errors, console errors or blocked writes.
- Desktop and phone screenshots inspected. Raw record-derived evidence and screenshots stay in private storage.
- Full desktop and phone navigation sweeps: 27 tabs, 19 visible panes, seven direct links and Back passed on each; zero page errors, console errors or blocked writes. The shared sweep had diagnostic progress logging only; an independent comparison verified that no test step changed or was skipped. Earlier bounded attempts did not complete and are not counted as passes.
- Upload dry run passed before publication. Guarded upload and independent public GET verified the exact live bytes. Post-publication phone checks: 812/812, zero errors or writes.

## Reproduce

Build with the shared `toolchain/build.sh v12.33 v12.33_demob_identifiers_LIVE/patch_v1233.py`.
Run the focused tests with `BASE` pointing to the verified v12.32 source and `PAGE` to the candidate. Native tests also need `OUT` outside the repository; set `MOB=1` for phone. Run all browser checks under the shared browser lock, then both `toolchain/harness/sweep.js` viewports. Use the guarded uploader only after the final candidate passes and READY is recorded.

The pending departure record operation remains separately owned. The servicing night report remains on hold. The separately claimed v12.34 Demob styling update must retain these identifier labels and rebuild from the latest live page.
