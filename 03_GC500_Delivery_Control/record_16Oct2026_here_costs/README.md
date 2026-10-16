# Everything on site gets its costs — PREPARED, dry run passed, NOT applied (the session's gate refused)

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
