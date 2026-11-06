Author: Andrew Fisher

Read-only whole-register quantity reconciliation, 14 October 2026.

`capture.cjs` reads the actual public page and current shared record. It captures every reference/item projection, primary quantities, current stock, typed identities, location contents, map quantities, Today completion, supplier receipts and all programme days. `capture_sources.cjs` captures the corresponding private source, native record, contract rows and Demob model. Both use the strict GET-only harness and close their browser; private results must remain outside this repository.

`analyse.py PRIVATE_OUTPUT_DIRECTORY` produces a private reference/item CSV and reconciliation JSON. Separate requested, received, installed and current-stock quantities throughout. Canonical source aliases and relocation history are not additional physical equipment. A numbered accessory repeated in its own location's typed contents is one identity; different confirmed suppliers may use the same fleet number.

Confirmed projection findings are coordinated under v10.17: duplicate Demob pickup scopes, moved-VMS collection quantity, and Inventory outstanding-delivery calculation. Two supplier requests have valid known quantities but no native reference; they remain read-only source requests. Supplementary contents and source-only commercial equipment are separate coverage findings, not authority to invent arrivals, locations or charges. Updated external schedules do not override confirmed onsite quantities.

No live operational records or source documents were edited by this audit. Root owns release integration and any separately authorised native update.
