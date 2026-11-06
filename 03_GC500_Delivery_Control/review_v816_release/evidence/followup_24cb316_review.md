# Independent CPU follow-up: 24cb316

Author: Andrew Fisher

**70/70 scoped checks pass: 53 Demob and 17 Timeline/drawer.** The previous zero-quantity defect is fixed, and the agreed outgoing-only pump-out rule has explicit positive incoming-delivery coverage. Road-source verification remains incomplete; three new research-note/runtime mismatches are recorded separately. This is a moving-draft review, not READY or a publication decision.

Exact source: `24cb316b9a4440356cd438e0fb83738183d02569`. The source was archived privately and its patch applied to a private copy of the previously verified v8.13 baseline. Only synthetic fixtures ran; no browser, shared record writes, implementation edits or commits.

| Input | SHA-256 |
| --- | --- |
| Unpatched v8.13 baseline | `f07e92cc79ad416e75f0db2b6cfa1c302d1789cf7c93ff0da8142afc6dc8a7ec` |
| Private audit candidate | `55da76e756f8a7d861aed58977c9b40454d6db3889ef27f5fd16eff838e6948c` |
| Demob source | `201147305c2e760f7ccecd6f9c09a3c7b3651931f0c82a5a7dfbd5584249fcea` |
| Patch source | `9b17360533c8a346b54ed7364c729dc890b4948a7c29be334e50c9a7e2a1d411` |
| Drawer source | `6f87a42c4ac481bbbbceaab8c33e96adfd0f5b91fa7bc1780618a082d0882125` |

## Verified outcomes

- **25 → 24:** 24 units conserved; changed-quantity notice retained in row, loads, email and print. Confirmed record preserved during rendering/export.
- **25 → 0:** no phantom normal-truck unit, no truck and no pump task. Reference remains visible with “quantity 0 - nothing to collect”; email carries the same explanation. Confirmed record preserved.
- **25 → unknown:** existing portions remain represented as uncertain; no load claims full. Recorded portions preserved during rendering/export. Every revised case stays at or below 24 known units per load.
- **Incoming delivery:** for both toilet and tank, a supplied delivery date, no previous arrival/complete history and a date before the event/out/demob cutoff permit the ordinary incoming status change. Missing delivery date, completed arrival, event day and earlier out day deny that exception. Forced collection remains gated even when incoming. Current pump-out evidence with person/time allows outgoing movement. These assertions implement the agreed outgoing-only interpretation, not an additional mandatory purpose-field policy.
- **Prior corrections:** same-day 24+1 portions, two-day confirmation/reload/merge, 25 → 26 with explicitly unplanned extra unit, all 49-unit pump days, actor/time evidence, reuse revocation, stale evidence, false/conflict precedence and known/unknown toilet-before-tank ordering remain passing.
- **Timeline/drawer:** 17/17 positive checks. Typed missing-remove and same-day added-reference removals, cancelled date visibility, explicit plan precedence, override/clearing and proposed-date behaviour remain correct. Patch and drawer files are byte-identical to e540cbc. Timeline replacement remains `8e9e00f0bd00f01edae6ecef1ed4fa12059fa92e703bfd33f990d79657db7a26`, unchanged since 968aefb.

## Road-rule evidence still open

[Separate source review](followup_24cb316_roads.md) identifies three documentation/runtime mismatches: the note describes guide rules as applied; claims branch-confirmed oversize flags although code derives a planning category; and claims supplied council-boundary travel times although the scheduler uses editable existing defaults. Commit `762b99b` adds only the note, not runtime enforcement.

**Original guide not read.** The draft identifies Queensland Access Conditions Guide v6.0, December 2023, but supplies no accessible original file or direct URL. Local search found none; the official discovery GET returned 403. Numeric legal conditions, route applicability and currency are unverified, not established errors. The owner needs to supply the original accessible attachment/source before a guide-validation claim can be made.

## Portable reproduction

Keep the original files unchanged. From the repository root, extract source commit `24cb316b9a4440356cd438e0fb83738183d02569` to an empty temporary directory with these paths:

```sh
git archive 24cb316b9a4440356cd438e0fb83738183d02569 03_GC500_Delivery_Control/v8.16_reference_and_demob_DRAFT 03_GC500_Delivery_Control/toolchain/rep.py | tar -x -C /path/to/empty-audit-directory
```

Copy the baseline HTML whose SHA-256 is listed above to a separate candidate file. Apply the frozen `patch_v816.py` to that candidate. Then run these portable scripts from the evidence directory, using your own paths:

```sh
python3 /path/to/frozen/v8.16_reference_and_demob_DRAFT/patch_v816.py /path/to/candidate.html
node followup_24cb316_cpu.cjs /path/to/frozen/v8.16_reference_and_demob_DRAFT/demob816_src.js /path/to/candidate.html
node followup_24cb316_timeline.cjs /path/to/unpatched-v8.13.html /path/to/frozen/v8.16_reference_and_demob_DRAFT
```

[Demob fixture](followup_24cb316_cpu.cjs), [results](followup_24cb316_cpu.json); [Timeline fixture](followup_24cb316_timeline.cjs), [results](followup_24cb316_timeline.json). Both exit 0. Timeline verifies exact source and baseline hashes. Main fixture records actual source/candidate hashes and uses actual Demob, patched setters and merge logic in an isolated VM with synthetic records. Templates are evaluated as strings; DOM, layout, print pagination, device performance, live integration and full standing suites are outside this audit.
