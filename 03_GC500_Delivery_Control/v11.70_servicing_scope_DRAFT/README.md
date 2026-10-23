# Servicing to-do scope

Author: Andrew Fisher

DRAFT. Andrew directly confirmed removal of the matching entry from Servicing to-do in the private chat on 24 October 2026. The implementation filters active servicing views through one shared scope helper. Original reference data, tracker configuration, completion history, quantities, service plans and printed codes remain intact. Existing saved completions are labelled as history outside active servicing totals in the page, crew audit, PDF and CSV. An old completion QR explains the removal and offers no new job taps.

Base: live v11.69, SHA-256 `1a0c2dc11be081cae5a792662a4fcdd3854212e0fb6bc9174cef7143dc2948a7`. Main-page publication and a guarded native update of the existing crew-card HTML are both required. No operational record deletion or completion tick is part of this change.

Checks in progress: focused servicing/report rules, native desktop and phone report checks, synthetic crew scenarios, full desktop/phone sweeps, and native tracker update capture. Raw snapshots, report exports, contacts and tracker signatures remain in private storage outside Git.

The next release is queued separately and must rebuild on the verified result of this one. No second-agent review is claimed.
