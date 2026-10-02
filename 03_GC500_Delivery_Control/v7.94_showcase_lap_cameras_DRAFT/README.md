# Showcase lap coverage and cameras — DRAFT

Author: Andrew Fisher · 2 Oct 2026

Andrew: “Feel like your missing hslf the track. . Cameras not as good. . I need this better”.

The old figure timer stopped the car after 90.1 seconds regardless of distance. With the actual route and original fixed-step frame function, an 8 Hz callback cadence reached only 52.9% of the lap; a half-speed selection also stopped early. The old default camera faced back towards the car and Auto never scheduled a complete-circuit view.

This release waits for both the figures and a complete lap, adds route-aware road cameras and a distance-led Circuit tour, and preserves the current position through appearance changes. A route map shows progress. Phone controls give more space to the circuit. Existing pit and stand anchors gain structural depth.

Original route, road widths, source positions, car, physics, business page and records are retained. Added structures are illustrative; the photographs do not establish survey coordinates for new signs or bridges.

Final verification underway; not yet live.

- Playback: 52 CPU checks, including slow cadence/pace, launch pause, replay, loop, commentary, reduced motion and non-3D completion.
- Cameras: 15 focused checks and 4,056 actual-route samples on each of desktop/phone, covering all 12 lap sections with no obstruction fallbacks.
- Scenery: 19 checks, including exact embedded-source identity, source envelopes, blocked stairs and geometry/resource budgets.
- Integrated build `8aa55ec6…`: 55 desktop/phone browser checks; 26 full-lap views plus selected camera views, six manual cameras while paused, Day/Night retention, actual WebGL loss/recovery, close/disposal and phone Options. Zero detected page/GL errors or record writes. The phone circuit occupies 590 px of an 844 px viewport.
- Both official navigation sweeps: 21 tab routes and seven deep links, zero page/console errors or blocked write attempts. Existing restricted-tab redirects retained.
- Exact rebuild and preservation of the entire earlier page outside the appended extension verified.

Visual review of that intermediate build found a phone Driver roof/body intrusion despite the structural checks passing. The camera eye was moved ahead of the roof and raised slightly. That correction and truthful non-3D completion wording are now in candidate `bb245eb1…`; a fresh full desktop/phone browser run and navigation sweeps are underway before publication. This headless browser uses software rendering; it does not establish a physical phone frame rate.
