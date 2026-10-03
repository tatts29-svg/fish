# GC500 custom motion — practical placements

Author: Andrew Fisher

3 Oct 2026 · Preview guidance only. No page deployment or operational record changes.

Our own animations can help GC500 most at selection and confirmed actions. Keep the existing components, labels, photographs, counts and positions. Use one quiet cue in the component already responsible for the fact; do not add another dashboard, completion total or status card.

## Best placements

| Existing place | Proposed behaviour | Exact hook and guard |
| --- | --- | --- |
| Selected equipment on Map explorer | A recognisable equipment silhouette and **one** 500–700 ms orange selection pulse, then a still selection outline. Other markers stay still. | `selectCode()` → `startPulse()` / `placePulse()` in `v8.13_maps_satellite_LIVE/release/explorer/explorer.js`. Retain the selected reference label, `markAt()` hit area and master-plan anchor. `clearSelection813()` cancels it. The current pulse repeats for 20 seconds; the proposal replaces that behaviour rather than adding another pulse. |
| Current preview: delivery-confirmation demo | `equipment-complete` is labelled **“Simulated delivery confirmation”**, “Delivery confirmed” and “Delivery · installation stays separate”. The filename does not mean every installation check is finished. | This is an isolated visual simulation, with no live save hook. A later delivery-only integration must name and acknowledge the exact delivery event it represents. Neither an on-site light nor the label alone proves installation complete. |
| Future proposal: selected reference confirmed fully finished | One 400–600 ms check draw, then the existing static status presentation. This is separate from the current delivery-only demo. Do not replay on polling, reopening a drawer or map panning. | **Integration blocked until an authoritative required-stage and acknowledgement payload exists.** `gc500DoneKeys()` currently checks only `deliveryOf(key).done`. It is not evidence that all applicable checks are finished or that the latest local edit was acknowledged. A simulated preview must say it is simulated. |
| Photo successfully saved against a reference | One small camera-to-check confirmation beside the existing save result; leave the photo visible immediately. | In `photoSendUnlocked797()`, only after file upload, durable local link, `photoRecordAck797(ids)` and successful `photoOutboxDelete(e.id)`. Also require its existing `current && !current.removed && String(current.ref) === String(e.key)` success branch. The alternative “later change” branch must not claim that this photo is saved here. |
| Levelled / Steps controls | Keep `levelGlyph()` (spirit level) and `stepsGlyph()` (three treads). If useful after a confirmed action, centre the level bubble once or reveal the treads once within the same icon box. | Bind to the specific acknowledged `levelled` or `steps` change, not button press, drawer render or photograph. These controls have separate meanings; never replace both with a generic tick. This is a later drawer integration proposal. |
| Existing drawer disclosures | A 120–180 ms CSS opacity/short translation or chevron transition, leaving the current `details.dsect` control, focus and content in place. | `#drawer details.dsect`, `openAsset()` / `openAssetDraw()`. No Lottie player needed. Honour the drawer owner's agreed mock-up before integration. Opening and closing must remain immediate and keyboard accessible. |
| Showcase / race introduction | Optional short branded circuit trace or flag cue on deliberate play; defer until the current machine work is settled. | Reuse the current Showcase entry/play flow only. It must not hold up Today, Equipment or Map, replace the race cameras, or become a loading gate. |

For Today, Documents and Demob, hand these event rules to their current owners. No extra facts or animations are needed merely because a section exists. Document-save feedback should use that document flow's own confirmed save, not the photo acknowledgement function.

## Map icon family

The artwork describes **what the item is**. Position, traffic-light state, completion and ownership remain separate existing facts. Keep reference text readable and retain the existing trade colours. A green toilet trade colour does not mean a toilet is complete.

| Family | Still silhouette | Source classification / caution |
| --- | --- | --- |
| Building | Portable cabin, flat roof, door and window | `Portable buildings`; standalone Explorer `buildings` / `Portable Building`. |
| Toilet | Cubicle or amenities block with door | `Toilets & amenities`; standalone `toilets` / `Toilet`. Explicit tank identity takes precedence over this broader trade. |
| Generator | Enclosed genset with vent and skid | `Generators`; standalone `generators` / `Generator`. `gens` map layer includes other suppliers' equipment; keep “not ours” information intact. No spinning engine or lit power indicator without a recorded running state. |
| Light tower | Mast with lamp heads and trailer/base | `Lighting towers`; standalone `lights` / `Light Tower`. No flashing lamps to imply switched on. |
| VMS | Message board on a trailer | `Variable message signs` or map layer `vms`. Keep the reference label; no invented message or directional arrow. |
| Barrier | Low water-filled barrier profile | `Water-filled barriers`; standalone `barriers` / `WFB`, and layer `wb`. Explorer deliberately merges scheduled locations and drawn runs; do not split counts or turn every run into a new asset. |
| Fence / gate | Mesh panel with feet; gate variant with hinged opening | `gate` layer / standalone `gates` supports gate identity. Fence artwork needs a verified fencing item or run; there is no general fencing trade in Explorer's fallback `CATS`. A gate is not automatically open. |
| Tank | Low storage/sewage tank with capped fitting | Resolve from the reference's verified product/description; Explorer has no dedicated tank category. Do not use a fill gauge or imply tank contents/level. |

These are eight families with a fence/gate variant, not eight new filters. Unknown or ambiguous items keep their current labelled ring. Do not infer equipment identity solely from a code prefix when the host record is available. `gc500PlanItems()` supplies trade/name/position, but a reliable tank subtype and stable layer ID would need to be retained through `buildItems()`; current hosted category IDs are generated (`t…` / `l…`).

There is already an Equipment navigation glyph: `TAB_GLYPH.plant`, a two-shed yard mark rendered by `tabGlyph()` on the `#plant` route. Keep it. The current Explorer uses category rings and reference labels, not an equipment silhouette library. `WIP_ICO.fence` is an existing fence drawing elsewhere in the hosted page, useful as visual reference but too detailed to adopt unchanged at marker size.

## What to reuse and what to create

| Need | Appropriate asset |
| --- | --- |
| Selection pulse, drawer/chevron transition | Existing CSS, refined to one cycle. A Lottie player adds no necessary capability here. |
| Existing level and steps marks | Reuse the page's editable SVG paths and their distinct shapes; CSS/SVG is sufficient for the proposed short response. |
| Generic camera, check or optional flag treatment | A suitably licensed stock Lottie can be recoloured and timed in Creator, provided its editable shapes and exported result suit the current UI. No particular stock asset or licence is assumed verified by this note. |
| Consistent GC500 equipment family | Create editable vector artwork with shared stroke weight, proportions and bounds. Supply still SVGs and transparent Lottie JSON for deliberate selected/confirmed states. Creator can author or refine the artwork; its timeline cannot determine operational truth. |

The preview should expose idle, selected and simulated confirmed states separately. A Creator “saved” state means the animation design was saved, not that equipment or a photograph was recorded on GC500. The parallel Creator review reports an opaque exported Canvas background: remove/disable it and verify transparency before using an export over satellite imagery. Import/export compatibility and small-size readability need actual exported-file checks; this source review does not certify them.

## Status and lifecycle rules

- Read status from `deliveryOf()` / `ticksOf()`, preserving explicit unticks, cancellations and moves. `setDone()`, `setLevelled()` and `setSteps()` make local changes then call `bump()`; a returned `true` or existing flash is not by itself server acknowledgement.
- “Complete” is the existing `done` tick. Levelled and Steps are separate recorded checks; either can set Complete/on-site, but neither implies the other. `needsLevel()` identifies the broad buildings/amenities population. The source explicitly says some items take no steps, so requiring every such item to have `steps === true` would also be wrong. The new all-required-stages treatment needs the agreed per-reference applicability, acknowledgement and revision, without changing the present controls' definitions.
- A photograph proves only that its photo record was saved. Never set or infer delivered, installed, levelled, steps fitted, Complete or Demob from the photo's presence, filename, slot or successful upload.
- Observe both `prefers-reduced-motion: reduce` and the page's `motionOff()` / `html[data-motion="off"]`. Respond to `gc500motionchange` and OS changes while open. Use a static silhouette/outline/check immediately; never lose a status when motion is off. Propagate the preference to the Explorer iframe.
- Stop and release animation work when the marker is offscreen, the drawer closes, the view changes or `document.hidden` becomes true. Do not replay old confirmations when returning. Use one active selected-marker animation, not a player per marker; keep nonselected markers as still SVG/canvas artwork. Pause while panning/zooming and under the 3D view.
- Explorer's existing Done layer defaults off. Its `.d782 i` CSS currently loops a double beat every 3.2 seconds, despite “beats twice and rests” wording. A future integration must keep the opt-in layer and remove perpetual all-marker beats; do not add custom loops on top.
- Keep labels, accessible names, existing hit areas and status text. Decorative artwork is `aria-hidden`; the existing result message conveys success. Match the underlying state in print/export stills. No new totals, no camera shake/confetti, no artificial loading delay and no minimum spinner duration.

## Source anchors checked

Paths below are under `03_GC500_Delivery_Control/`. Read-only local source review; no browser or live record write. The inspected hosted build has SHA-256 `f07e92cc79ad416e75f0db2b6cfa1c302d1789cf7c93ff0da8142afc6dc8a7ec`, matching the v8.13 live release recorded on the shared board; this is not a fresh network readback.

- `v8.13_maps_satellite_LIVE/release/explorer/explorer.js`: `CATS`, `TRADE_C`, `LAYER_C`, `hostPlan()`, `buildItems()`, `selectCode()`, `startPulse()`, `done782Pull()`, `done782Draw()`, `drawMarks()` and `markAt()` (approximately lines 809–948).
- `v8.13_maps_satellite_LIVE/release/explorer/explorer-merge.js`: `card()`, selection wrapper and `gc500Explorer3DPick` (approximately lines 145–188). Selection opens the existing map card; `data-xopen` explicitly invokes the host's `gc500ExplorerPicked()`. Animation must preserve that distinction.
- `v8.13_maps_satellite_LIVE/release/explorer/index.html`: `.pulse` CSS (lines 69–80); `v8.13_maps_satellite_LIVE/ux813_src.js`: `clearSelection813()` and phone focus behaviour.
- `build/GC500_v8.13/GC500_Delivery_Control_hosted.html`: `deliveryOf()` / `ticksOf()` (8345 onward), specific setters and applicability (8500–8625), `levelGlyph()` / `stepsGlyph()` (8673/8695), `TAB_GLYPH` (9686), labelled map marker construction (13247 onward), drawer functions (22397 onward), `gc500DoneKeys()` / `gc500PlanItems()` (25052 onward), photo acknowledgements (27861 onward), `motionOff()` / `motionApply()` (35336 onward), `WIP_ICO` (38773).
- `v7.97_photo_outbox_durability_LIVE/photo797_src.js`: durable upload/reference acknowledgement implementation, retained in the v8.13 hosted build.

This is a design and integration note, not READY TO UPLOAD. Completion acknowledgement/applicability and icon classification are the concrete integration dependencies. No operational completion has been claimed by the preview.
