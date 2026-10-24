Author: Andrew Fisher

Demob weather/day-card reuse proposal. No application changes made by this note.

Reuse the approved Build card width, shape, typography, full-card weather artwork, glow, Life Saving Rule outline icons and reduced-motion behaviour. Apply the existing Demob warm accent. Share the existing card CSS selectors instead of duplicating the embedded completion-stamp artwork. The Build renderer's historical percentage and automatic past-day stamp are Build-specific and must not be applied to Demob.

Native inputs and ownership:

- `demob816().days`, `DM816.sel` and `week816(date)` remain the date programme and selection authority. The current programme is 15 working days, 26 October–13 November 2026. Preserve out-of-window references.
- `demob816().day[date]` and `trucks816(date, 'all')` provide the current global pickup references and complete physical loads. Supplier996's new Event Portables model stays a separate adapter until its contract is agreed. Do not independently repack or mix supplier/Coates loads.
- Use the existing `BuildCards984.weather(date)` reading and `WX818` artwork. Past dates require verified observations; a past forecast is not an observation. Future dates outside provider coverage remain unavailable. The current `BuildHistory984` archive is static.
- `DailyStaff988.day(date)` remains the single daily availability authority. Show names and known/unnamed counts on the card once. Retain the existing native editor and its draft, hiding only the duplicate standalone staff summary.
- Reuse the native daily rule selection and `RuleIcons989`; a calendar reminder does not establish that a briefing occurred.

Progress proposal requiring agreement with the integrated pickup model:

- Whole-job percentage is reference-based, separate from daily loads. Proposed denominator: unique active native Demob references, excluding explicit quantity-zero references but retaining unknown quantities and references scheduled outside the main window. The UI must name this basis; it is not a percentage of physical items or elapsed days.
- Count only dated outgoing collection evidence after an arrival. Initial red, incoming amber, installation ticks, pump-out ticks and dates passing do not establish collection. `collect816()` currently uses `setLight('in transit')`; this does not persist a distinct collection event. Preserve the pump-out gate and do not invent a second record.
- Historical readings use the Brisbane day-close cutoff and the current programme scope, identified in More info. Do not claim an immutable historical denominator unless a scope snapshot exists. Future cards show planned scope; today's card has no historical percentage.
- A past date is an archived day. Apply the completion stamp only when all known required pickups for that day have collection evidence. Incomplete or uncertain past days retain their actual reading and do not become complete merely because the date passed.
- Physical-load completion requires every member/portion to be evidenced. Reference-wide collection cannot be used to invent independently recorded completion for split portions on different dates.

Implementation boundary: new files under `demob-weather/`. Expose small existing visual/rule helpers to a Demob adapter; preserve Build's default renderer and every native Demob action. Replace only the native day-strip presentation and reuse its actual date selection handlers. Motion runs only for visible cards in the active Demob tab and stops for hidden pages, printing and reduced motion. Keep supporting source detail under More info.

Focused verification: Build/Demob selection isolation, dates/week labels, all-branch scope, incoming versus outgoing history, re-arrival, partial/split loads, cancellations and quantity zero, day-close boundaries, missing weather, no forecast-as-history, staff editor/draft preservation, visible-only animation, reduced motion, keyboard and phone layout. Prove no operational or financial records change from rendering/navigation.
