# Bounded financial calculation scopes

Author: Andrew Fisher

State: DRAFT. Exact live base v10.10 `6bc40d8d46b1ca5f936731f17c9d75738c0436c9d1a928e37c94c391a08d0258`.

A standalone financial call during the authorised roster update repeatedly rebuilt the reference and ownership indexes outside the existing render hold. The native operation was stopped before any write and its full record readback remains unchanged. Add synchronous calculation scopes at shared model entry points, preserve all amounts and reset between calls so edits remain live. No persistent stale cache, rate changes or data changes. Root coordinates final parity, performance, phone/desktop checks and publication; the Eric addition follows verified publication.
