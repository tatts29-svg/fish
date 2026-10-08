# Crew, race call, WC09 units and VMS plan notes

Author: Andrew Fisher

State: DRAFT; built, source checks passed, browser checks pending.

This integrates the remaining five parts of the handed-over v9.09 work on v9.22: the added fencing crew member, the approved replacement race-call take, split-delivery progress, WC09's separate Coates toilet blocks, and the VMS plan's document/cross-reference notes. It preserves the existing daily staff picker and Showcase stability code.

The private crew input and approved audio were received through the encrypted handover at `6bcbcc78`; the patches bind each input by checksum. Neither input is committed here. The broadcast changes one take and regenerates the media manifest from the current page, preserving the v9.21 pin pictures. Upload that take before the page.

WC09's two Coates numbers belong to the two six-metre blocks; each block receives its native individual labour/loading controls. Explicit recorded “counts as” choices still win. Split-delivery progress does not count the later supplier items complete from a tick made for the earlier Coates delivery.

The original 17-page VMS001 plan was read after the private handover. It supplies cross-reference words only; governing-drawing and relocation differences stay open. Two questions in the older draft are now answered by the approved VMS register, so R30 records those answers instead of asking them again. The board 21 Staghorn/Ocean Avenue and board 17* T10/T11 caption conflicts stay explicit; board 18* remains assigned to Roadtek in the plan. No new VMS position or board count is inferred from the plan.

Source parts are copied from frozen upstream `822b06a8`, with the narrow R30 reconciliation in `patch_v900_vms.py`. Browser and financial comparisons are still required before READY. No operational record has been changed.

The split, line and VMS tests compare against a page with just that part omitted, retaining the final footer and other parts. `tests/build_baselines.py <candidate>` regenerates those comparison pages with the same private inputs as the build. Broadcast testing follows the natural end of the new take and checks that the v9.18 reusable player advances to the next slot.
