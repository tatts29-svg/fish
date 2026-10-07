# v8.86 (draft) — new master map D001-26003-03, issued 2 Oct

Author: Andrew Fisher. Claude analysis, 8 Oct 2026 00:06 AEST. Andrew, 7 Oct: "the attached is the latest map document this is to over write the current master so we need to remove the current and use this one instead and update all records."

DRAFT: analysis only. No page, media or record changes yet.

## Source

- **New sheet:** `D001-26003-03-MASTER.pdf`, sha256 `8753d875…`, issued 2 Oct. One A1 page, 841 × 594 mm. It is held encrypted in `../inputs_07Oct2026/`.
- **Live master picture:** media `d0df399e…` (webp, 2600 × 1837 px). It is a full-page render of the 17 Sep issue and is what the Fencing sheet and the shared plan frame use today.
- **Same render size:** the new sheet renders at exactly 2600 × 1837 px at the same scale.

## Lining the new sheet up with the old

On the 2 Oct paper the whole drawing sits 9 mm further left. That is 28 px at this scale. Phase correlation gives the same shift (28, 0) for:
- the whole sheet;
- the drawing area;
- the left half;
- the centre.

Rendering the new sheet and shifting it 28 px right puts it exactly over the old picture. So:
- every existing marker keeps its position;
- the shared plan frame used by Plan on satellite stays valid.

The leftmost 28 px of the new picture will be blank, and 28 px of right-hand margin is trimmed.

## Markers on D001 (62: track sectors, gates, entry points)

- **Gates:** after the shift, the gate labels sit where they did. G4, G5A, G5B and G6 have the largest local differences and were checked by eye. The differences are nearby content, not the gates.
- **Nearby content:** the E.P box beside G4 sits slightly lower, and an extra road is drawn at G5A.
- **Still to do:** each E.P marker needs checking against the new drawing before release.

## Register items the new issue touches (needs Andrew)

| Ref | On the 2 Oct master | Register / record now | Question |
|---|---|---|---|
| WC32 (FWF) | Removed | Listed; on the toilet plan D023; no delivery record | Cancelled, or still going somewhere? |
| WC40a | Removed | Not in the register | None; nothing to change |
| WC10 (FWF) | Newly drawn | Listed; not on site; no map pin | Add its map pin from the master? |
| P45 (Building 6m) | Moved about 43 mm on paper | Listed; not on site; no sheet pin | Use the new spot? |
| WC69 | One label (was two) | Listed; in transit | Single pin |
| WC38, WC39 | Nudged | In transit, due Fri 9 Oct | Small pin moves |

The inset items P60, P62, P63, P68, WC48, WC49, WC51 and WC81 did not move with the main drawing. Their pins need checking separately after the 28 px shift.

## Publishing

The picture is not part of the page. Swapping it takes three steps, and every step needs the edit key, which this session does not have:
1. Upload the new picture to the service: `PUT /api/admin/media/<file>`.
2. Register it in the media list: `POST /api/admin/media/manifest`.
3. Publish the page with the new media reference.

The rendered picture comes from an input, so it is not committed here. Inputs stay encrypted in this repo.
