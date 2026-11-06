# Signed Advanced papers received 16 October 2026 (RECORD OPERATION APPLIED)

Author: Andrew Fisher. Andrew, 16 Oct 2026, with photographs: "See attached, signed by me" (seven Advanced Environmental
Services service notes 24475–24481) and "Here is next 4" (four Advanced Temporary Fencing collection forms 28557–28560).
Every paper is signed by Andrew on 16 Oct 2026; the work dates are 12–15 Oct 2026 and stay distinct from the sign-off.

## What was recorded, through the page's own forms

Eleven records were created through the page's own functions (`recordServiceNote`, the green book; `recordCollection`,
the blue book) by `service_notes_fill.cjs`, a runner cut from `record_15Oct2026_dockets_fill/dockets_fill.cjs`: dry run
on the live page first (every write aborted; 33 documents planned, none outside the plan), then `--apply` on the live
edit link with the page's sender held, a write gate that let exactly those 33 PUTs through once each, and a read-back
of the whole record afterwards. Record version **6582 → 6615**; 33 documents written (11 papers, their
11 stamps and 11 `by` documents); every other document unchanged in value. Report `report_20261015T212311Z.json`; the whole
record before is `backup_state_20261015T212311Z.json`. Recorded by "Andrew Fisher" (his word, no agent suffix).

| Paper | Book | Date | Where | What the paper says |
|---|---|---|---|---|
| 24475 | Service note | 2026-10-12 | Madison Point to Ferry Rd | 3 h (1/2 hr x 6 men) · 135 m · Had to walk panels in from Madison Point to Ferry Rd. Hire agreement invoice num 36596. No access for truck, concrete bollards already installed. Metres installed 135 metres. |
| 24476 | Service note | 2026-10-13 | Helen Park | 2 h (1/2 hr - 4 men) · 82.5 m · Scrim existing fence. 82.5 m. |
| 24477 | Service note | 2026-10-13 | S.0.2 - B.O.H. | 1.5 h (15 mins x 6 men) · 75 m · Scrim existing fence - 75 m. |
| 24478 | Service note | 2026-10-12 | Philip Park - Advanced Compound | 0.5 h (1 man x 0.5 hr) · XB60AQ - 13:45 - 14:15 |
| 24479 | Service note | 2026-10-13 | Philip Park - Advanced Compound | 0.5 h (1 man x 0.5 hrs) · XB38ZP 12:15 - 12:45 |
| 24480 | Service note | 2026-10-14 | Philip Park - Advanced Compound | 1.5 h (1 man x 1 hr + 2 men x 0.25 hr each) · XB77VR 9:45 - 10:15; 771CIK 10:15 - 10:45; 22CIRA 13:00 - 13:15 - 2 men x 0.25 hr each |
| 24481 | Service note | 2026-10-15 | S.0.8 B.O.H. | 4 h (1 hr x 4 men) · 185 m · Includes relocation of S.0.8 C.2 to S.0.8 B.O.H. 65 m. Also includes 120 m scrim. Hire agreement doct num 36614. |
| 28557 | Collection form | 2026-10-12 | Double stack - C.2 | 30 mesh panel, 28 base, 28 clamp, 2 wheels |
| 28558 | Collection form | 2026-10-15 | Pit Lane | 84 mesh panel, 86 base, 84 clamp, 2 wheels |
| 28559 | Collection form | 2026-10-15 | Porsche Lounge | 12 mesh panel, 10 base, 13 clamp |
| 28560 | Collection form | 2026-10-15 | S18 - Grandstand | 6 mesh panel, 6 base, 5 clamp |

Hours are the total person-hours as the note writes them (crew size is not multiplied again); the page prices them at
Advanced's labour rate, cost only, as it does every service note. 24475 names hire agreement invoice 36596 and 24481
hire agreement docket 36614 — neither is on the page yet; they stay named in the notes for the matching when the
agreements arrive. The three Philip Park compound notes (24478–24480) are labour against trucks by registration
(XB60AQ, XB38ZP, XB77VR, 771CIK, 22CIRA) with their times. Collection forms are counts collected only: no charge,
credit, metres or hire adjustment is inferred, as the page's own hint says.

## The photographs

The eleven originals went up unchanged as Documents, kind docket, named by their paper number (`24475.jpg` …
`28560.jpg`), with a 480 px WebP preview each, through `upload_originals.cjs` (POST `/api/files` as the page's own Add
does); each one's SHA-256 was read back from the service and matches the file in `originals/`. Files on the service
469 → 480. The Fencing tab links the collection forms' photographs by their number, as it does the 9 Oct
forms; service-note photographs sit in Documents under Fencing dockets, as 24473 and 24474 do.

```sh
node record_16Oct2026_service_notes_24475_24481/upload_originals.cjs            # dry run: what is already up, what would go
node record_16Oct2026_service_notes_24475_24481/service_notes_fill.cjs          # dry run on the live page, every write aborted
GC500_EXPECTED_PAGE_SHA=<public page sha256> node record_16Oct2026_service_notes_24475_24481/service_notes_fill.cjs --apply
```
