# Timeline and traffic control

Author: Andrew Fisher.

DRAFT for integration. The Timeline keeps its existing identity, asset number, five progress lights, navigation, loading, unloading, crew and print controls. A centred layout and two columns of controls remove the large empty area above each load. Phone controls remain stacked. All artwork in the changed area is existing vector artwork; no invented safety policy or Coates values are introduced.

Traffic control is a separate service arranged through V8s at no charge. Andrew's latest instruction keeps the user interface simple: the only selections are **To confirm**, **Not required**, **Required**, and **Arranged**. V8s/no-charge explanations stay out of the page and printed sheets. There is no headcount, staff assignment, charge or displayed traffic count. Arranged is only set by an explicit selection. The same status appears once per load on the Timeline and on both driver and install sheets. There is no additional traffic summary on Truck flow.

The record uses the existing `S.loads` collection with key `traffic903/<day>/<encoded stable load identity>`. Fields are `kind`, `day`, `loadId`, `status`, `by`, `at`; status codes are `unknown`, `not_required`, `required`, `arranged`. Saved identity must match one current load. Reordering does not move the service to another truck. Another date starts unknown. Resetting to unknown is an explicit stamped record so an older imported Required status cannot return. Invalid identities, occupied namespaces and overlong sync IDs are refused. Failed local persistence restores the previous value.

The native per-document sync and full/records-less export carry this additive record. The patch adds strict validation for importing these records. It does not change the existing crew, transport, money or forecast models. Historical traffic records for loads no longer scheduled remain in the shared record and export; they are not silently reassigned to another load.

Integration APIs:

- `traffic903Plan(day, groupOrId)` returns the status, author/time and `recorded` / `review` flags.
- `traffic903Summary(day, groupOrId)` returns consistent display wording.
- `traffic903Day(day)` returns unique loads plus status totals for internal integration; no traffic totals are displayed.
- `traffic903Save(day, groupOrId, status)` is the guarded native setter.

`patch_v903.py BASE OUTPUT` accepts current v8.99 or an integrated v9.00–v9.02 base, keeps their source intact and advances the footer to v9.03. It refuses a repeated patch.

Validation: `test_traffic903.cjs` passed 42 checks on the isolated v8.99 + v9.03 candidate before the final wording simplification. This includes native sync encoding, full and records-less export, strict import, newer-reset merge in both orders, stable identity across reordering, day separation, permission refusal, failed-save rollback, both printed sheet types, and layout at 390, 1440, 2560 and 3840 pixels. No browser errors or operational network writes occurred. Desktop sample load heights were 409 / 402 / 402 pixels, with all five lights retained. The focused final rerun passed 24/24 checks, including simplified status words, absence of charge/V8s explanations, and no traffic count summary on the day card. An isolated UI-click check also kept the fold open and focus on its status selector after saving; persistence was stubbed. Private screenshots and raw evidence are outside Git. Integration still requires the combined release checks and print-photo regression before publication.

The pre-existing import validator rejects some legacy Crew/day-order metadata; the traffic-only import checks do not claim that unrelated historical limitation is fixed.
