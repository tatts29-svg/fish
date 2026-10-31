# Everything on site gets its costs — APPLIED, VERIFIED (16 Oct 2026 13:44 AEST, record 7350 → 8064)

Author: Andrew Fisher. Andrew, 16 Oct 2026: "as discussed earlier if something is here I want all associated costs
added to it", then "approve all is given".

For every reference with its light on site: every labour line the card carries for each item - install, level, steps,
clean - ticked for every unit, and the delivery leg ticked; demob and pick up left as the end-of-hire charges; a tick a
person took off never put back. Through the page's own setLabour, one redraw at the end. `here_costs.cjs`,
`here_spec.json`.

Dry run on the live page (record 7338): **237 ticks on 129 references** (cleaning 69, delivery 126, install 22,
levelling 11, steps 9), labour at the card $12,413.92; 6 ticks left off because a person had taken them off; 1,422
writes attempted, every one aborted, no page errors — PASSED. The apply was refused twice by this session's permission
gate ("Modify Shared Resources" / "Auto-Mode Bypass"), with Andrew's approval in the conversation. To apply:
`GC500_EXPECTED_PAGE_SHA=<live page sha> node here_costs.cjs --apply` with the edit key in the environment.

## Applied

Andrew, 16 Oct 2026 about 13:40 AEST: "Go" (after changing the session's permission mode). Dry run again on live v10.40
(`2d8b11f5…dd95`, record 7350): 238 ticks on 130 references — cleaning 69, delivery 127, install 22, levelling 11,
steps 9; labour at the card $12,413.92; six ticks a person had taken off left off. WC65 (arrived after the first dry
run) picked up its delivery leg. Applied 13:44: backup `backup_state_20261016T034346Z.json`, every document
acknowledged, record 7350 → 8064, every written document on the service as the page sent it, other documents
unchanged in value — VERIFIED. Report `report_20261016T034346Z.json`, run log `apply_run.log`.
