<!-- Author: Andrew Fisher -->

Save coverage audit — exact current page `a373` (v10.11), 14 Oct 2026.

All native `onchange`, delegated `change`, `oninput` and delegated `input` registrations were reviewed. The shared adapter covers editable record fields that already save automatically. It preserves native validation/calculations and observes the document changes made by the existing setters. A scoped Save button confirms that field; it never submits another form or replays a mutating action button.

| Area / controls | Native setter or handler | Shared collections | Treatment |
|---|---|---|---|
| Workforce `[data-rsf]` | `runSetShift` | costs | Adjacent Save; exact acknowledgement |
| Workforce `[data-rsm]`, `[data-rsx]` | `runSetMoney`, `runSetMisc` | costs | Adjacent Save |
| Person `[data-rsrate]`, `[data-rstype]`, `[data-rsbranch]` | `setOurPerson` | costs | Adjacent Save |
| Accommodation rate / charged role `[data-prate]`, `[data-prole]` | `setOurPerson` | costs | Adjacent Save |
| Pay rules `[data-rsrule]` | `setRunRule` | runRules | Adjacent Save |
| Fencing `[data-fk]`, `[data-fck]` | existing separate Revenue / Direct-cost handlers | fenceRates, fenceCosts | Adjacent Save; Revenue and cost fields remain distinct |
| Rates `[data-rk]`, `[data-ak]`, `[data-lr748]` | native pricing handler | rates, accRates, lineRates | Adjacent Save; excludes the hidden pee-rate bridge |
| Hire minimum `[data-min]` | `setMinDays` | minDays | Adjacent Save |
| Event hours `[data-hrs]` | `setEventHours` | eventHours | Adjacent Save |
| Event staffing / time / customer rates `[data-scope]` | `setScope` | eventHours, rates | Adjacent Save |
| Question answer `[data-qa]` | `setQAnswer` | answers | Adjacent Save; native change/blur validation preserved |
| Delivery / pickup dates, ETA, notes `[data-date]`, `[data-outdate]`, `[data-eta]`, `[data-dnote]` | `setDate`, `setEta`, `setDeliveryNote` | delivery | Adjacent Save across Today, Build, Demob and drawers |
| Asset branch `[data-branch]` | `setBranch` | branch | Adjacent Save; bulk assignment remains its own explicit action |
| Rental selection `#rentalSel` | `setRental` | rental | Adjacent Save; Add new still opens its explicit contract form |
| Supplied item / quantity `[data-sup]`, `[data-supq]`, `[data-chgot]` | `setSupplied` | supplied | Adjacent Save; metadata's existing `#supSave` remains separate |
| Asset-number item allocation `[data-chnumit]` | `setNumberItem` | supplied | Adjacent Save; adding/removing a number remains an explicit action |
| Register editor `[data-ed]` | `setDesc`, `setQty`, `setItemType`, `setHireStart`, `setMapRef`, `setLocationText`, `setDate`, rate handler | descs, qtys, **items**, hireStart, mapRef, locations, delivery, rates | Adjacent Save |
| Map reference `#mapRefSel` | `setMapRef` | mapRef | Adjacent Save; map-view selector is unrelated |
| Change deliveries `[data-chdate]`, `[data-chtext]` | deferred `chSetDate`, `chSetText` | delivery, descs, locations | Matched deferred native-setter context; no broad delayed save attribution |
| Per-item charge selection `input[data-lab]` | `setLabour` | labour | Adjacent Save on editable fields; automatic arrived charges stay automatic |
| Manual stairs `[data-stairs975-qty]`, `[data-stairs1006-qty]`, `[data-stairs1006-select]` | `Stairs975.save`, `setLabour` | loads, labour | Adjacent Save; physical completion remains separate |
| Loading / lifting / unit door | loading872 / handling875 / Shapes926 | existing loads records | Separate v10.12 explicit Save editor; excluded from generic adapter |

Existing explicit submissions are retained, rather than adding a second button to the same form:

| Existing area | Submit control / form |
|---|---|
| Unit identity, owning company, asset number | `[data-unit925-form]` — Save number / Save changes |
| Item details / note | `form[data-item965-note]` — Save item note |
| Pee-panel negotiated rate | `[data-pee1010-editor]` — Save rate / Reload |
| Transport rates / POA | `[data-transport1006-form]` — Save transport rates |
| Daily staff | `[data-staff988-save]` — Save availability; exact shared confirmation already implemented |
| Crew planning legacy editor | `[data-crew883-day-save]`, `[data-crew883-save]` and `.crew883` guarded forms |
| Finance rate / review / journal | `[data-finfield]` draft capture, native Finance form submit |
| Costs: labour, meals, accommodation, consumables, other costs | Native own-cost form submit; adding is an explicit action |
| PO / receipt / branch handover | `[data-po-save]`, `[data-fh866-save]` |
| Fencing quote, dockets, green book, blue book | `#fqSave`, native paper/cost/docket forms and explicit submit actions |
| VMS identification | `[data-vms913-save]` |
| Fire-extinguisher quantity | `[data-fire914-save]` |
| Rental contract / breakdown / variance | `#cSave`, `#bSave`, `#vSave` |
| Location, hire start, notes, weeks | `#locSave`, `#hsSave`, `#noteSave`, native week submit |
| Traffic control / truck planning | `[data-traffic903-save]`, guarded truck-flow explicit actions |
| Reference / spare / asset number addition | Existing Add / Add person / Add number / Confirm / move actions; never replayed by generic Save |

Excluded selections do not silently become shared-record saves:

- Navigation, filters and searches: dates selecting which day to view; sheet, area, branch filters; search text; item/company filters; view/as-at controls. These select a view rather than changing an asset record.
- Local-only Demob planning: `[data-asm816]`, `[data-cap816]`, `[data-trv816]`, `[data-ov816]`, `#ovn816`. Existing text explicitly says device-only. No shared acknowledgement is attached.
- Operator name (`#who`, `#op`, `#chWho`), showcase engine/vehicle/backdrop/loop/quality, map rendering preferences and motion settings are browser/session preferences.
- File inputs, photographs, document uploads, printing, PDF download and share controls have their own asynchronous upload/download outcomes. A record Save cannot prove an upload succeeded.
- Complete, on-site, emptied, collected, remove, move and bulk-apply buttons are explicit native record actions. Their action is not invoked a second time by this adapter.
- All hidden input bridges and the specialist v10.12 loading editors are excluded. Disabled automatic charge selections remain disabled; read-only links receive no active Save controls.

Confirmation is scoped to exact changed native documents plus their audit stamps. A nonempty accepted document set, matching current record, exact acknowledged server values, fully loaded collections and no relevant queued/inflight write are all required. Deletion entries are checked by key presence even when their value is null. Invalid entries, failed local persistence, stale drafts and partial acknowledgements cannot display “Saved · shared record updated”.
