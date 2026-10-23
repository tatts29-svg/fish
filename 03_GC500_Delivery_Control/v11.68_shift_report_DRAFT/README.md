# Servicing shift report — draft

Author: Andrew Fisher

Andrew requested a report of completed and unfinished servicing after the crew left and confirmed “Yes—report and button”. The Shift report button in main Servicing prepares the selected night's complete record, a follow-up list, area totals and recorded completion times. Print / save PDF, Download CSV and Copy summary are available. Counts come from the existing shared servicing rules; pending local completions do not count as saved. Missing ticks say “not recorded complete”, because an absent tick is not proof the work was missed.

DRAFT, not ready or live. Source base is shared commit `5736b536f0224f5d0c0f49a26bc24bd120ec8db7`; page base is v11.67 `2a8671b792492953eb560a4123b2234dc036c144970e778276f40b3b5dc27683`. Toolchain files match that source exactly. The patch is isolated and pins the live hash. No record writes, crew-card/QR changes or broadcast changes. The existing map and sharing controls remain in use.

Build with `bash toolchain/build.sh v11.68 v11.68_shift_report_DRAFT/patch_v1168.py`. Tests, both full sweeps, phone inspection and exact live read-back are required before LIVE. Operational report rows, PDF/CSV files and screenshots remain in private storage; only non-sensitive validation metadata belongs in this folder.
