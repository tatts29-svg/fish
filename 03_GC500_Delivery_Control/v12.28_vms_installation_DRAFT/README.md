# VMS installation coverage — v12.28 DRAFT

Author: Andrew Fisher

The operational VMS overlay can contain standalone boards that are absent from the grouped financial asset list. Their eligible installation work must reach the shared labour calculation once, using the existing rate and branch rules. Existing grouped entries, explicit exclusions and per-reference rounding remain authoritative. VMS has installation labour only; this change does not introduce demob labour or repeat hire or transport.

Claim: `65706139b067ba2318b9821f1b66b69067440189` on `ccr-061f77e8-ivjhrv`, starting from source `41c22b3c321383b0a8355ba601527587b3e0c107`.

Required base: verified v12.27, SHA-256 `2db3457f12692ccd660de48b6c134d964827e27c3a4be976b482f12edbccc9b2`, 15,450,051 bytes.

The adapter reads the canonical VMS equipment projection and excludes grouped, ambiguous, cancelled, moved and explicitly excluded scope. Supplier names and native owner codes share the existing normalisation. Received history survives a later departure; an unconfirmed receipt creates no charge. Explicit labour unticks remain off. The native charge engine supplies installation pricing and per-reference rounding, including zero and missing-rate handling.

One projection feeds labour slots, customer labour revenue, installation branch totals, received-work coverage and pricing-review issues. Hire and transport retain their existing paths. Existing proportional overhead allocation is unchanged as a formula and recalculates from the corrected installation weights; source branch assignments and total costs are preserved.

Candidate: `c8057284f1b0f42f7eef336a4def584574e7baea8146239c5273fbcee0c497d3`, 15,455,776 bytes. Completed checks: 204 inline scripts pass the shared checker; 36 native-engine synthetic checks; 29 independent lifecycle/adapter checks; 12 independent source-preservation/refusal checks. The latter reconstructs the complete original page after removing the one new script and reversing the six reviewed integration changes. The guarded uploader's read-only dry run passed.

```sh
toolchain/build.sh v12.28 v12.28_vms_installation_DRAFT/patch_v1228.py
PAGE=build/GC500_v12.28/GC500_Delivery_Control_hosted.html node v12.28_vms_installation_DRAFT/tests/test_vms_installation1228.cjs
PAGE=build/GC500_v12.28/GC500_Delivery_Control_hosted.html node v12.28_vms_installation_DRAFT/tests/test_vms_installation1228_lifecycle.cjs
BASE=build/GC500_v12.28/base_live.html PAGE=build/GC500_v12.28/GC500_Delivery_Control_hosted.html python3 v12.28_vms_installation_DRAFT/tests/test_preservation1228.py
```

Final native comparisons and full desktop/phone sweeps are in progress. Codex owns implementation, independent sub-agent reviews, testing and guarded publication; Claude has not reviewed this candidate. No operational record write is part of the patch or its tests. Private source records, attachment findings, screenshots and full financial snapshots remain outside this repository. This draft is not ready to publish.
