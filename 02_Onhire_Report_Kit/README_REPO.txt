Coates on-hire report kit - the code, as it ships, for every job.

One kit runs every tool store (Weipa for Rio Tinto, MMG at Dugald River,
the next one). The job is set in JOB.txt (names and settings) and, where
SiteIQ spells one outfit several ways, COMPANY_ALIASES.txt. The per-job
files Andrew uses are kept under jobs\<Job>\ for reference; the kit folder
itself carries the Weipa JOB.txt.

Only CODE and docs live in git. Deliberately not here:

  _fonts\        Inter (Regular, SemiBold, Bold, Italic; SIL OFL) - the pack's
                typeface, subset-embedded by coates_pdf.py; Helvetica without it,
  _lib\          the vendored Excel library (openpyxl 3.1.5 + et_xmlfile),
                 unmodified upstream, carried in the delivery zip so the
                 kit runs with nothing installed
  site data      Data_SiteIQ exports, the LATEST workbook, the .xlsm,
                 Reports\, LAPTOP_CHECK.txt, LAST_RUN_LOG.txt

Delivery zips add _lib and _fonts, with the job's JOB.txt and optional
COMPANY_ALIASES.txt at the root. Include the upstream library notices and
Inter's OFL notice. Use a job-specific READ_ME_FIRST.txt in each delivery;
this repository note describes the code checkout, not the delivered files.

Back up the live kit and extract updates into a new folder first. Carry
forward current JOB.txt, aliases, Data_SiteIQ, Reports history, source .xlsm
and *_Onhire_Workbook_LATEST.xlsx (the hand-typed labour and cost tabs).
Keep the new code, _lib and _fonts. Never replace newer site data or typed
workbooks with older copies from a delivery snapshot.
