# Build card loading correction

Author: Andrew Fisher

DRAFT — final verification in progress.

Actual-public verification of v9.84 exposed a loading race: an empty shared collection can finish loading without changing S. The card cache used S alone, so it could retain an unavailable historical percentage after native progress became ready.

v9.85 includes native progress health in cache invalidation, only retains ready progress calculations, and refreshes Build from the existing sync footer heartbeat when health changes. No new timer, schema, operational write or financial-model change. The approved v9.84 presentation and data rules remain unchanged.

Exact live base: 5f5ac67334f382985d57e136277a6321bf47565ac1033e35cf203c631ae1e45c. Codex implements and independently tests this follow-up; no Claude review claimed.
