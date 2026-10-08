# v8.98 — native fencing paper capture

Author: Andrew Fisher. **DRAFT; not live.** Codex-owned follow-on to the selected v8.97 page. This folder contains generic application support and synthetic tests only. No supplier papers or operational records are embedded.

The page can save collection forms as their own `fenceCollections` list and save a hire agreement containing only component counts without inventing charge quantities. Collections and components never infer metres, revenue, credits or hire adjustments. Existing quantified hires retain their native pricing path.

An explicitly reviewed service-scrim entry can link one active service note to one existing clean-fence hire. It requires exact reviewed source snapshots, matching metres and an unused source-operation identity; it refuses existing scrim work in the same area. It adds only the scrim quantity through existing rate rules. It does not create another numbered paper or infer billable service movements. Changed, removed or conflicted sources quarantine the derived charge as **Source review required**, with null financial totals rather than a zero-cost claim.

## Build

```sh
python3 v8.98_fencing_paper_capture_DRAFT/patch_v898.py <v897-page> [output-page]
```

With one argument, the patch updates the toolchain's build copy in place. It requires the v8.97 map marker and exactly one v8.97 footer, refuses reapplication, uses shared `toolchain/rep.py`, and advances the footer to v8.98. Embedded DATA is unchanged.

## Native APIs

- `recordCollection({collection_no,date,location,collected,issued,hire_agreements_written,signed_by,note,order_no,removal_time})`. Counts use the existing `COLLECT_WORDS` keys. `issued` and the written hire number are optional; no automatic matching or pricing. IDs are generated as `FC-<operator>-<sequence>`.
- `recordHireAgreement({...existingFields,components_only:true,quantities:{},components:{...}})`. At least one positive whole component count is required. Empty quantities remain empty.
- `recordServiceScrim898({service_id,related_hire_id,metres,expected_service,expected_hire,note})`. Obtain the exact expected objects with `serviceScrimSource898(note,'service')` and `serviceScrimSource898(hire,'hire')` during the separately authorised fresh-record review. The helper validates the current sources again.
- Existing `docketPaperAdd(recordId,file)` attaches originals. For service-work entries it delegates to the actual service note; explicit pointers and filename evidence read through that source rather than creating another paper.

All records use native author/stamp, sync, export/import, merge and set-aside/restore paths. Reordered JSON keys do not create duplicate collection variants; conflicting contents or distinct IDs for one collection number remain visible but unusable. Tombstones apply to base IDs and imported variants.

## Validation

`node v8.98_fencing_paper_capture_DRAFT/test_capture898.cjs <candidate-page>`: **30/30 pass**, including native sync/merge/restore, full and envelope-only export, the actual hosted Export button's payload, duplicate conflicts, component-only accounting boundaries and broken service-source quarantine. All page scripts compile. Embedded DATA equality is separately checked.

`PAGE=<candidate> [MOB=1] EVIDENCE_DIR=<private-output-directory> node v8.98_fencing_paper_capture_DRAFT/test_capture898_browser.cjs`: **15/15 laptop and 15/15 phone pass** on the combined candidate SHA-256 `09bf240301316f4a619d6ed6d60a8f29d8d914a081a553b9fc5794a1ae4e45d2`. It uses the shared read-only harness, exercises the visible native collection form's save button and actual Export handler with synchronous temporary fixtures, then restores the record. It also opens the paper fold and Collection form through their real controls and verifies the form stays visible after native redraw. Both screenshots were inspected; no browser errors or attempted remote writes. Detailed evidence and screenshots remain private.

The browser checks prove UI and export behaviour; the native tests cover sync serialization, merge and restoration. No test creates a live collection or makes a server-persistence claim. Publication and live readback remain separate.

## Export boundary

The page's actual Export button calls `exportRecord()` and downloads that client payload; it does not call `/api/export`. Both `records.fenceCollections` and `fence_collections` are included. Hosted export waits for its first collection snapshot.

The separately hosted server's raw `/api/export` has an explicit older fold. The reviewed local v5.88 source omits `serviceNotes` and the new `fenceCollections`; that endpoint is not established as lossless for these books. Its deployed source must be verified before any separate server change. Downstream `ops_layer.py` rebuild ingestion is also unverified because that source is unavailable in this worktree. Use the page's native export or full `/api/state` backup for this release; do not claim the server export or offline rebuilding is upgraded.

Publication and operational intake remain separate guarded actions owned by root. No upload, live record write or server deployment is performed by this patch or its tests.
