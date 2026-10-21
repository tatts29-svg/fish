# Equipment lists and completion consistency

Author: Andrew Fisher

IN PROGRESS / NOT READY TO UPLOAD. Owner and source branch are recorded on STATUS.md.

Equipment showed supplied-description coverage as its percentage. Individually recorded board arrivals changed headline totals but could be absent from delivery-reference lists, Today breakdowns and the pending inventory PDF. Saved board positions could also retain superseded planned-location captions.

This change reads completion from the same qualified scope as Today. Physical boards appear once across Equipment, Inventory and Today, including boards without a delivery association. Search, status filters, detail actions and pending PDF rows use those same identities. Original delivery references remain the source for financial calculations. Recorded accessories outside requested equipment lines appear in a separate list without inventing arrival or completion evidence.

Explicit forklift and access-machine descriptions also appear in their shared Equipment group when their stored classification is generic. Boom lifts remain machines; fork extensions and rotators remain attachments. This presentation grouping preserves the original business classification and rate keys. Equipment, Today and the filtered inventory PDF use the same physical references, with aliases counted once.

Current pins and navigation remain authoritative; superseded plan crops are identified as original planned positions. Milestone summaries and A4 sheets use qualified percentages: unknown remains unknown, and an incomplete figure cannot round up to 100%. Planned scope, extra recorded stock, selected dates and servicing nights retain their distinct meanings.

Automatic current-day views also refresh when the date changes or the browser wakes on a later day. The existing clock triggers one shared redraw; explicit historical dates, closed views and servicing-night selection are preserved.

The patch starts from exact verified v11.02 SHA-256 `4b1ee468727cb98b3c52f751c77ce6d4b0258b7dca32c14b40c1ae41a95bcfd5`. No operational record, financial source, shared servicing arithmetic, permanent code, tracker configuration or map geometry change is included. Private originals and native evidence remain outside this repository. The separate paused geometry draft remains with its owner.

```sh
bash toolchain/build.sh v11.03 v11.03_equipment_consistency_DRAFT/patch_v1103.py
python3 v11.03_equipment_consistency_DRAFT/test_patch_v1103.py build/GC500_v11.03/base_live.html
node v11.03_equipment_consistency_DRAFT/test_equipmentProgress1103.cjs
node v11.03_equipment_consistency_DRAFT/test_vmsEquipment1103.cjs
node v11.03_equipment_consistency_DRAFT/test_additionalEquipment1103.cjs
node v11.03_equipment_consistency_DRAFT/test_milestoneProgress1103.cjs
node v11.03_equipment_consistency_DRAFT/test_vmsLocationWords1103.cjs
node v11.03_equipment_consistency_DRAFT/test_dayRefresh1103.cjs
node v11.03_equipment_consistency_DRAFT/test_equipmentGroups1103.cjs
node v11.03_equipment_consistency_DRAFT/test_equipment_refresh1103.cjs
```

Candidate SHA-256 `24de664c6064ea3066b51b97bed74f8b854ec71bec8c1f54717338a52d2dacd9` (20,993,137 bytes). Build validation passes all 150 inline scripts. Focused checks pass: 13 patch/protected-source, 105 equipment progress, 78 physical-board projection, 49 additional equipment, 70 milestone, 14 location-caption, 49 date-refresh, 56 presentation-grouping and 15 late-refresh summary checks.

Final native candidate checks, desktop/phone sweeps, source and screenshot review, guarded publication and exact native read-back are required before a LIVE claim. The other external assistant has not reviewed or acknowledged this change.

Current final checks confirm the compact phone percentage is visible and the expanded meter retains the full quantities. Exact physical identities resolve legacy plan keys without ordinal matching; authored current pins take precedence over inherited legacy associations, conflicting identities are rejected, and historical links say “Plan position”. Navigation re-resolves the current card and respects later user intent. A remaining legacy detail-screen/action binding is under review before READY; the candidate remains a draft. No native record correction has been applied.
