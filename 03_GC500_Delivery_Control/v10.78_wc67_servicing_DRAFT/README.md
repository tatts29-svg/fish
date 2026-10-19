# v10.78 — WC67 is 4 FWF in the servicing tracker too

Author: Andrew Fisher · 19 Oct 2026

**Andrew, 19 Oct 2026:** "Make sure the qty in w67 is 4 not 2".

## Why it still said 2

The record has held WC67 FWF × 4 since this afternoon (record 9928 → 9941):

| Unit | Owner |
|---|---|
| 0793 | Event Portables (sub-hire) |
| 0769 | Event Portables (sub-hire) |
| 0714 | Event Portables (spare, sub-hired) |
| 172824 | Coates |

Every tab and drawer already read 4. The one place still showing 2 was the servicing tracker. Its reference list (`SVC1067_DATA`) and crew card (`SVC1067_CARD`) are a snapshot taken from record 9704 on 18 Oct, before the two units were added. Left as it was, the crews' card would have listed WC67 as 2 × FWF (0793, 0769), and two FWFs would have missed their service.

## What changes

- **Servicing tracker data:** WC67 becomes `4 × FWF`, qty 4.
- **Crew card:** WC67 becomes `4 × FWF`, qty 4, with numbers 0793, 0769, 0714 and 172824.
- **Nothing else:** every other reference, task and plan is byte for byte the same.
- **Footer:** v10.77 → v10.78.
- **Repo source:** `servicing_tracker_DRAFT/tracker_data.json` gets the same change.
- **Costs:** the tracker data does not feed Costs or the record, so neither changes.

```
bash toolchain/build.sh v10.78 v10.78_wc67_servicing_DRAFT/patch_v1078.py
BASE=build/GC500_v10.78/base_live.html PAGE=build/GC500_v10.78/GC500_Delivery_Control_hosted.html [MOB=1] node v10.78_wc67_servicing_DRAFT/test_v1078.cjs
```

## Checks

`test_v1078.cjs` passes on desktop and phone:

- Only WC67 differs from live.
- Tracker FWF total goes from 240 to 242, across 75 references in both copies.
- WC67's FWF units on the record are 0714, 0769, 0793 and 172824, and the crew card lists the same four.
- Footer reads v10.78, with no page errors.

## Before Thu 22 Oct

- **The rest of the snapshot:** the tracker's reference list is still the 18 Oct (record 9704) read for every other reference. Check it against the record before the event tracker is created, and correct any other changes made since 9704.
- **Event tracker:** the event tracker on the server, and its printed QR sheets, are made from the page's data with **Create / update event tracker**. If one was made before this release, update it, otherwise the panel will refuse percentages because the lists differ.
