# Servicing to-do scope

Author: Andrew Fisher

READY TO UPLOAD. Andrew directly confirmed removal of the matching entry from Servicing to-do in the private chat on 24 October 2026. The implementation filters active servicing views through one shared scope helper. Original reference data, tracker configuration, completion history, quantities, service plans and printed codes remain intact. Existing saved completions are labelled as history outside active servicing totals in the page, crew audit, PDF and CSV. An old completion QR explains the removal and offers no new job taps.

Base: live v11.69, SHA-256 `1a0c2dc11be081cae5a792662a4fcdd3854212e0fb6bc9174cef7143dc2948a7`. Main-page publication and a guarded native update of the existing crew-card HTML are both required. No operational record deletion or completion tick is part of this change.

Checks passed: 41 focused servicing/report rules; 13 synthetic crew scenarios; 23 native report checks each on desktop and phone; both full sweeps (27 tabs, 19 shown, 7 deep links and Back, zero errors/writes); native tracker update capture (51 guards, zero live writes). Phone screens and PDF inspected. Shared toolchain files match the current source. Exact candidate: `adb39788bd3e20ac67cab53d5895e4e428eabbd4186ea6c6c92160d15eeb33e5`, 21,727,625 bytes. Implementation and checks source: `c1eac404dc41c70cfcf7d27766343bfa13e89ed0`. Raw snapshots, report exports, contacts and tracker signatures remain in private storage outside Git.

The next release is queued separately and must rebuild on the verified result of this one. No second-agent review is claimed.
