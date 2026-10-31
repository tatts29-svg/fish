# Fire extinguisher on every building — 20 Oct 2026 (record 10144 → 10185)

Andrew: "can we also add a fire extenguisher to every building and tick as completer. all of these must have 1 attached
Building 6m, Building 4.8m, Building 12m, Building 9.6m, Building 3.6m, Ticket Box 4.8m, Ticket Box 6m before you do
this give me a sheet of what didnt have one attached. approved to do and go live with all updates".

- Sheet sent first: `GC500_buildings_without_fire_extinguisher_20Oct2026.xlsx`. 49 references of those types, all one
  building each; 39 had none, 10 already had one (P08, P25, P45, P46, P51, P52, P54, P57, P66, P69).
- In-memory first: +$2,029.95 charged (39 × $52.05 card), costs unchanged.
- `../record_18Oct2026_vms_regos/fire_wc31_spec.json`: 39 × `fire_ext` (new runner step, the page's `fire914Save(ref,1)`),
  41 documents, VERIFIED. Read back: 49 of 49 have one.
- Same run: WC31's Accessible Toilet install re-dated after today's receipt (step 1 `wc31_access_install_off_spec.json`,
  10141 → 10144; step 2 in this run). WC31 now reads Recorded installed for both items (Andrew: "fix wc31 still showing
  as not complete").
