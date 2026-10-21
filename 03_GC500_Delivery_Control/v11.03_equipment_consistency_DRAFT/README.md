# Equipment lists and completion consistency

Author: Andrew Fisher

IN PROGRESS / NOT READY TO UPLOAD. Owner and source branch are recorded on STATUS.md.

Equipment showed supplied-description coverage as its percentage. Individually recorded board arrivals changed headline totals but could be absent from delivery-reference lists, Today breakdowns and the pending inventory PDF. Saved board positions could also retain superseded planned-location captions.

This change reads completion from the same qualified scope as Today. Physical boards appear once across Equipment, Inventory and Today, including boards without a delivery association. Search, status filters, detail actions and pending PDF rows use those same identities. Original delivery references remain the source for financial calculations. Recorded accessories outside requested equipment lines appear in a separate list without inventing arrival or completion evidence.

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
```

Candidate SHA-256 `5aefcff6579add71ce7029dcbdddbca19f6ad02c5b7929eb8ba2e3c95d814350` (20,983,497 bytes). Build validation passes all 150 inline scripts. Focused checks pass: 13 patch/protected-source, 93 equipment progress, 61 physical-board projection, 49 additional equipment, 70 milestone, 14 location-caption and 49 date-refresh checks.

Final native candidate checks, desktop/phone sweeps, source and screenshot review, guarded publication and exact native read-back are required before a LIVE claim. The other external assistant has not reviewed or acknowledged this change.
