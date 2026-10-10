# Build layout, weather depth and named worker selection

Author: Andrew Fisher

Status: DRAFT — final combined checks running. Codex implements, tests and publishes independently; no Claude review claimed.

Andrew chose “Build” for the opposite of Demob and requested wider cards, improved motion and weather with an almost 3D effect. He also reiterates that worker names must already be available from the programmed day roster.

Build keeps the existing routes and records. Date cards are 292 CSS pixels on desktop and 304 CSS pixels on the tested phone viewport, with wrapping phase labels, clearer figures and wider work cards. Adjacent-day navigation preserves the strip position and gently reveals off-screen selections.

Native sourced forecast scenes receive layered cloud shadows, softened sunlight and subtle pointer-driven perspective/parallax. No new particle systems, canvases, timers or idle render loops. Touch uses static depth. Existing off-tab/visibility animation gates and reduced-motion settings remain honoured. Weather fixtures test eight classifications; they are browser-only and never published as forecast data.

Workers keeps the saved roster/default names and stable person-to-task mapping. The named selector now appears directly inside Workers, without another Task worker override fold; unassigned edit-mode tasks retain the selector. No worker is automatically claimed as assigned to an individual task. Day availability remains a deliberate override. Existing saves and stale-roster safeguards are unchanged.

Exact base: f27008ce5293921f69c5f0b812ff46f5dddb00453e7d3748d99909aa22561bd2.
Candidate: 19242957feb45f8abfe098ec096461f80d3ed7b57a887fb6086c666ca201c589; 12,960,333 bytes; 68 scripts.

No financial rates, physical progress or operational records are changed. This release does not certify every price or posted ledger cost, subjective visual perfection or physical-device frame rate.
