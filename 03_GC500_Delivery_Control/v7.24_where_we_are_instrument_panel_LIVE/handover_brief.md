# Coates Industrial Solutions | GC500 2026
# Where we are — instrument-panel handover for Claude

Prepared for Andrew Fisher, 28 September 2026, Brisbane time. Updated with his 05:00 AEST motion and 4K requirements and the final simplified layout.

## Objective and scope

Andrew’s direction: make the summary feel like part of a race-car dashboard, without going over the top. Replace the two overlapping summary sections with one premium, compact instrument panel. The final recommendation removes both the large Awaiting confirmation display and the separate whole-job display/bar. Keep the existing application and its shared data. This is a focused redesign of the “Where we are” summary, with the data-meaning corrections needed to make that summary trustworthy.

Live view: https://gc500-production.up.railway.app/v/Coates-GC500-2026#progress

Use `INSTRUMENT_PANEL_CONCEPT.png` for the visual direction. The existing screens are `BEFORE_DELIVERY_PANEL.jpg` and `BEFORE_SUMMARY_CARDS.jpg`. The concept is an illustration: its sample numbers, date, timestamp, icons and gauge geometry are not authoritative production data.

Andrew specifically wants the existing animation when entering “Where we are” and clicking the due-date/whole-job control to remain, with additional high-detail animation throughout the dashboard. Do not deliver a static imitation of the image. Give the functional instrument states coordinated motion, down to the fine details, while retaining the restrained visual style and responsive operation.

## What to build

One continuous matte-charcoal housing on the existing light page. A shallow shaped top edge, fine orange perimeter accent, restrained inset depth and clear white type should suggest a modern motorsport instrument cluster. Keep the interface readable at a glance.

The default desktop arrangement is:

| Position | Content | Purpose |
|---|---|---|
| Main left, about 60% | Delivery gauge with Due by selected day / Whole job toggle; percentage and matching numerator/denominator together; selected date; View delivery details action | Shows one clearly labelled delivery measure at a time |
| Right upper, about 40% column | Fencing records; measured figure; breakdown action | Connects to the fencing evidence |
| Right lower, same column | Calculated revenue; ex GST; material completeness note; charges action | Gives the commercial summary on its actual basis |
| Bottom edge | Shared-record state and last successful confirmation time | Shows freshness without claiming physical completion |

Use a subtle rule between the left instrument and right column, and between the two right modules. Avoid nesting several large floating cards inside the housing. Align related figures and captions consistently. Show each headline fact once; keep the working and detailed breakdowns expandable. There is no centre exception display, no second whole-job summary, and no separate whole-job progress bar.

## What to consolidate or remove

- Replace the current large delivery assembly and the four white headline cards with this single component.
- Remove the standalone white “On site” card. Its whole-job measure is available through the gauge's Whole job mode, and its source details through View delivery details.
- Remove the standalone “Plant on the job” card. The planned total appears as the gauge denominator in Whole job mode; trade count and source explanation belong in the breakdown.
- Move the white fencing and revenue cards into the two stacked right-hand modules. Preserve their useful detail actions.
- Remove decorative LED ladders and the separate whole-job progress line/bar: the gauge already visualises the selected measure.
- Remove the large “Awaiting confirmation” display. Put the 29-unit gap, its reason breakdown and the five additional recorded units only inside View delivery details; do not recreate them as headline badges or another summary strip.
- Remove the separate repeated 197 and 226 tiles: the gauge caption already says “197 of 226”.
- Keep the existing page hero/banner, view-date selector, programme dates, navigation, email/print actions and the detailed group/branch/finance sections. Preserve “Delivery signals” as an expandable operational breakdown or an accessible drill-through, rather than deleting its information.
- Preserve the existing animated Due-by-day / Whole-job gauge option as a compact, clearly labelled control. Both modes must update the label, numerator and denominator together; the default remains Due by selected day. A mode switch must never change the shared data. Preserve the animated entry from the “Where we are” navigation tab.

## Visual specification

Reuse existing Coates design tokens where available. Suggested starting values: light page `#F5F4F1`; housing `#151B1D`; inset displays `#1D2426`; primary text `#F5F7F8`; secondary text around `#BAC2C6`; orange `#FF7A1A`; amber `#FFBB55`; divider `rgba(255,255,255,.13)`.

Use the existing application font, with tabular numerals. Suggested desktop main numbers 48–72 px, gauge percentage 64–88 px, body 14–16 px and captions at least 12 px. Size responsively; the mockup’s scale need not be copied literally. Cap the content width to the current page container. Aim for a noticeably shorter summary than the existing two blocks, without shrinking text to achieve it.

Use one thin orange perimeter line, subtle inner highlight and modest shadow. Texture, if any, must be almost invisible. Avoid chrome, bolts, carbon-fibre wallpaper, red ambient glow, fake switches, rotating elements, a steering wheel, extra cars and audio. The motorsport character comes from the housing, gauge and precise typography.

Use a thin SVG needle and arc with a consistent 0–100 scale. Derive angle, arc and text from the same percentage. Match the orange arc to the actual proportion of the available sweep. The mockup is not an exact engineering drawing.

Use a temporary-mesh-fence outline icon for fencing and a simple receipt or dollar icon for revenue, matching the revised concept. These are small supporting cues, not illustrations competing with the figures.

## Suggested labels and screenshot examples

These values describe the supplied screenshots and are acceptance examples only. Read the latest records at implementation time.

| Display | Example | Meaning |
|---|---|---|
| Delivery against plan | 87.2% | 197 / 226 due units recorded |
| Due-date caption | Due by 28 Sep | The selected Brisbane date, not the device’s UTC date |
| Delivery gauge, Whole job mode | 25.6% · 202 / 790 | Replaces the due-mode percentage and fraction in the same gauge; no separate display/bar |
| View delivery details only: awaiting confirmation | 29 | Due quantity not yet recorded as delivered; inspect reason breakdown |
| View delivery details only: additional recorded | 5 | Recorded outside the matched due quantity; validate early, surplus and undated classification |
| Fencing records | 4,342.5 m · Recorded fence work | Current clean-plus-scrim component total; not verified unique fence length |
| Calculated revenue | $402,945 · EX GST | Calculated charges with incomplete rate coverage; not cash, profit or necessarily invoiced revenue |

The number relationships reconcile: 197 + 29 = 226; 197 + 5 additional recorded = 202; 197 / 226 = 87.2%; 202 / 790 = 25.6%; 226 / 790 = 28.6%. The old white card’s 26% was whole-percent rounding of 25.6%, not an additional metric. Use one decimal consistently for the primary percentages.

Use “View delivery details”, “View fencing breakdown” and “View charges” as real buttons/links to the relevant filtered evidence. Preserve the selected date and delivery mode on drill-through. Generic “More info” should become a clear action name where a specific destination exists. The delivery percentage and its matching numerator/denominator must stay together in the gauge in both modes.

## Calculation and wording safeguards

### Delivery shortfall and time

The 29 is a record-based gap, not proof of 29 late deliveries. Remove the blanket red “Behind by 29 units” headline and the proposed large Awaiting confirmation display. Show the gap only inside View delivery details, using neutral wording and amber where appropriate. This drill-through should distinguish records awaiting confirmation, confirmed not delivered, due today and genuinely late against a recorded deadline. If some items have a confirmed reason, show that reason rather than describing every item as unknown. Keep the gap accessible without turning it into another headline metric.

The current code includes the entire selected day’s plan. At 04:53 this does not prove work planned later that day is overdue. Keep “due by selected day” and “late against deadline” separate. Use the project’s Brisbane timezone and defined cutoffs.

### Early, surplus and unknown quantities

Current `onEarly = on - onDue` also catches excess supply on already-due rows and quantities with no delivery date. Do not automatically label the five additional recorded units “early”. Inspect those rows; genuine early delivery requires a planned delivery date after the selected date. Keep surplus and undated quantities distinct. Early deliveries must not cancel out other due units lacking delivery records.

The 790 is a quantity-weighted equipment delivery measure, including bulk items such as barriers. It is not overall project completion, labour progress, readiness or unique asset count. Validate units of measure and scope. Some unknown quantities currently default to one reference; expose their provisional basis instead of implying every quantity is measured. Do not invent a corrected total during this visual change.

Retain the existing cancellation and relocation guards: cancelled references are excluded from active delivery totals; relocations contribute zero additional equipment quantity. Preserve their movement and cancellation history.

Keep “delivered to date” distinct from “currently on site”. The current rental inference uses start dates and can retain returned equipment unless overridden. Actual departures should affect inventory; they should not erase a completed delivery from historical delivery progress. Apply the established source precedence and manual overrides rather than replacing them with blanket assumptions.

### Fencing

The current total is 4,127.5 m clean + 215 m scrim = 4,342.5 m. `fenceMetres()` adds treatment/component quantities without deduplicating physical segments. Some scrim upgrades can cover an existing clean fence. Therefore the visual concept labels this “Recorded fence work” and omits the old 38% headline until its measurement basis is established.

In the expanded detail, retain clean, scrim, relocation, removal, gates and CCB separately with their correct units. To show unique installed length, match segments/location and avoid adding a treatment to physical length a second time. To show recorded work against programme work, state that basis and use equivalent categories in numerator and denominator. Do not reprice or recategorise dockets as a side effect of restyling.

### Revenue

The current total combines contract charges, ticked per-piece labour, event staffing scope, fencing docket charges and other usable charge lines. It includes planned and recorded components and missing rates remain. Label it “Calculated revenue”, ex GST, with a concise completeness indicator and an expandable composition.

Do not label this figure profit, earned-to-date revenue, invoiced revenue or cash received. Do not copy the mockup’s rate-coverage warning permanently: derive the current warning and missing-line count from the actual data. Preserve explicit zero values separately from null/missing rates. Andrew’s supplied amounts are already ex GST; do not adjust them for GST.

## Implementation map

Names below were inspected in the delivered application source during the review; locate their latest equivalents before editing:

| Function / area | Relevance |
|---|---|
| `dsnScreen()`, `dsnHead()` | Where we are page composition |
| `completionBlock()`, `completionDial()` | Existing large instrument section |
| `completionAsOf()` | Due, recorded, whole-job quantities, percentages and gap wording |
| `dsnHeadline()` | Duplicate white headline cards |
| `dsnState()` / `dsnState_()` | Shared rows, quantities, status and source attribution |
| `assetStatusAsOf()`, `unitsAsked()`, `machinesOnHire()` | Due-date, scope, quantity and rental inference |
| `fenceMetres()`, `fenceTypes()` | Fencing component aggregation |
| `moneySummary()` | Revenue composition; verify current identifier/suffix |
| `GI_SEEN`, `giSweeps()` | Existing gauge animation state; reuse correct behaviour |

Use one derived view model for both gauge modes, the delivery-detail counts, fencing, revenue and print. Keep data selectors separate from presentation. Reuse existing source attribution and shared-state updates. The visual change should not create a second totals calculator or a second data store. The gauge is the only headline delivery display; its selected scope determines its percentage, numerator and denominator together.

Build with semantic HTML, CSS and inline SVG. Do not ship the concept PNG as a full-page interface or bake numbers into images. No additional API, framework, 3D engine, video or animation library is needed for this panel. Avoid adding large raster or font assets to the initial load.

## Required animation choreography

Implement these as connected states of one instrument panel. The timings below are starting targets to tune on Andrew’s actual devices, not permission to slow down the page. A reduced-motion alternative must remain available.

| Interaction | Animation and fine detail | Suggested timing |
|---|---|---|
| Enter Where we are | Housing fades in with a tiny 4–8 px rise; instrument zones reveal in a short left-to-right stagger; figures are correct from the first frame | 220–350 ms; 35–50 ms stagger |
| Main gauge arrival | Needle and the corresponding arc move together to the current value; pivot, tick marks and labels remain crisp and still | 600–850 ms, eased once |
| Due-by-day / Whole-job click | Selected-tab indicator slides; button gets a brief pressed state; scope label, percentage and numerator/denominator crossfade as one coherent group; needle and arc move from their current position to the new value | 160–240 ms control; 450–650 ms instrument |
| View-date change | Replace the view model atomically, then transition changed instruments and captions together; keep scope and date explicit | 300–600 ms |
| Genuine record update | Update the exact values immediately; briefly highlight only changed displays and transition the delivery needle/arc when its value changes | 180–300 ms highlight; up to 600 ms arc |
| Delivery details / fencing breakdown / charges | Button edge and arrow respond to hover/focus; 1 px press movement on activation; expanded drawer reveals smoothly | 120–180 ms feedback; 200–280 ms expansion |
| Secondary modules reveal | Fencing and Calculated revenue reveal in a short coordinated sequence within the entry; on narrow screens reveal once when first visible, without replay while scrolling | 180–260 ms |
| Successful shared-record refresh | One small status-light brightening tied to the confirmed refresh; show the actual timestamp | 250–400 ms, no perpetual pulse |

Keep motion intentional but detailed. Fine touches can include the orange arc’s restrained glow, a small moving highlight on the selected mode indicator, a clean needle-pivot highlight, coordinated divider/label reveal and a 2–3 px link-arrow response. Animate those existing surfaces rather than introducing extra decorative objects. Gauge numerals, data and tick geometry should stay optically stable and sharp.

Use one short entry sequence. Existing `GI_SEEN`/`giSweeps` behaviour should continue to prevent unnecessary replay on ordinary render or sync. Rapid mode clicks must cancel or retarget the current transition from its actual visual position; no queued sweeps, stale labels, flashing through zero or visual jump back to the previous mode. Keep keyboard focus visible throughout.

The displayed number is always the current exact value. Animate its container or a brief value-change highlight rather than temporarily inventing intermediate quantities. The inspected page briefly showed partial count-up values alongside final percentages; do not reproduce that mismatch. When a needle is travelling, the explicit numeric label remains authoritative.

Use compositor-friendly opacity and transform where suitable; animate SVG geometry carefully. Reuse the existing animation machinery where it meets this specification. Scope any `will-change` to the active transition and remove it afterward. Avoid unnecessary layout reads per frame, large animated blur filters, always-running timers and rebuilding the entire panel per frame. Pause decorative motion in background tabs or when offscreen. Aim for smooth display-refresh-rate motion on the available laptop and phone; measure performance and report any remaining stutter rather than promising untested zero lag.

## 4K clarity and micro-detail

Andrew’s quality target is “4K ultra crystal clear”. Treat this as a rendering and quality requirement for the live component, not a request to load a large picture of a dashboard.

- Construct the gauge, needle, ticks, status icons and small line illustrations as vector SVG. Render all labels and numbers as live text. Use a proper SVG `viewBox` and preserve aspect ratio so the same geometry remains sharp from phone to 3840×2160.
- Check the finished component at 3840×2160 and at representative device pixel ratios 1 and 2. Keep the page container and typography proportionate; a 4K screen does not require stretching a 1360 px composition to the full screen width.
- Inspect the smallest captions, needle tip, pivot, orange perimeter, bevel, separators, icon strokes, selected-tab highlight and gauge-arc ends. Align edges consistently and avoid accidental fractional scaling that softens text. Use appropriate optical stroke widths at each size.
- Keep the small surface details restrained but deliberate: fine inner lip, soft inset shading, a narrow edge highlight and precisely aligned baseline spacing. Shadows and highlights support depth; they must not lower the contrast of the data.
- Do not upscale the concept PNG and use it as the interface. If raster texture is used at all, it must be tiny, subtle and efficiently repeatable; it must not blur, obscure numbers or add a heavy image download. No texture is preferable to a poor one.
- Keep the same clarity during animation: animate parent transforms sparingly and avoid continuously resampling text layers at changing scales. Final-state screenshots and motion recordings should show crisp text and stable geometry.

## Responsiveness and access

- Implement the entry, mode-change and state-change animations above. Do not replay the complete sequence on ordinary sync or render.
- Buttons must retain their animated hover, focus and pressed states, with equivalent keyboard operation.
- Numbers: render the correct values immediately. No count-up from zero; the inspected page briefly showed partial counts alongside already-final percentages while its animations ran.
- Reduced motion: render the final state immediately. No perpetual pulsing or decorative animation loops.
- Desktop: left delivery gauge with two stacked secondary modules on the right, all in one housing. Tablet: retain that arrangement where readable, otherwise put the gauge above Fencing and Calculated revenue. Phone: gauge with its mode toggle and View delivery details action, then Fencing, then Calculated revenue. Do not add separate exception or whole-job summaries at any breakpoint.
- At 360–390 px widths, no horizontal scrolling, clipped numbers or tiny captions. Use semantic DOM order and keyboard-accessible buttons, visible focus and at least 44 px practical touch targets.
- Do not communicate status by colour alone. Gauge values and meanings must also be available as text. Use a subdued stale/offline state based on real sync status; do not permanently show the mockup’s green dot or timestamp.
- Print/email: preserve existing outputs. Provide a readable light print treatment with final values, selected date, essential qualification and no animated state or clipped housing.

## Focused acceptance checks

1. Only one headline instrument panel remains: left delivery gauge, right stacked Fencing and Calculated revenue. The standalone repeated white cards, large Awaiting confirmation display and separate whole-job display/bar are removed; all useful details remain reachable.
2. With the screenshot fixture, Due by selected day mode shows 87.2% together with 197/226. Whole job mode replaces these with 25.6% together with 202/790 in the same gauge. Gap 29 and five additional recorded appear only in View delivery details. The fixture is not production data.
3. Gauge arc, needle, text, drill-through, print and other views agree after date selection and record updates.
4. A due-today item at 04:53 is not automatically late. An unconfirmed item is not automatically confirmed absent. Explicit late/absent evidence remains visible.
5. Future-dated delivery, excess supply and undated supply are classified separately. Early supply never offsets a different due-item gap.
6. Cancellation, relocation, missing quantity, explicit zero, no scheduled units and no due units have intentional states; no NaN, misleading 100% or division by zero.
7. Actual return records change current inventory without undoing historical delivery achievement.
8. Scrim upgrades do not double unique physical fence length. Fencing and financial records retain their existing rates, categories and audit history.
9. Calculated revenue reconciles to the detailed components and shows its current completeness; it is never presented as profit or paid invoices.
10. Correct values appear immediately; page entry and explicit mode changes animate; ordinary refresh does not replay the entry. Test rapid repeated clicks and an update arriving mid-transition. Reduced-motion mode presents the final state immediately.
11. Check 3840×2160, representative desktop, tablet, 390 px and 360 px views, device pixel ratios 1 and 2, keyboard navigation, print and the view-only URL. Inspect tiny labels, needle, ticks, borders and icons at actual output resolution. Verify no new console errors or unnecessary network requests from the component.
12. Record a short demonstration of page entry, Due-by-day → Whole-job → Due-by-day, hover/focus/press, a genuine value update and opening the breakdown. Confirm smooth motion without layout jumps, blurry text, stale values or duplicate animation loops.

## Expected handback

Implement the component in the current project, provide a 4K screenshot plus desktop and mobile screenshots and a short interaction recording, list the removed duplication, document any measurement questions still requiring source reconciliation, and report the focused checks performed. Follow Andrew’s existing deployment instructions for this project. This handover itself has not changed or published the live dashboard.
