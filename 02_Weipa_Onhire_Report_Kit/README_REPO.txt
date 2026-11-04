Weipa (Rio Tinto) on-hire report kit - the code, as it ships.

This folder is the standalone kit Andrew runs for the Rio Tinto Weipa
May26 Shutdown, as described in 0_START_HERE.txt. Only the CODE and the
docs live in git. Two things are deliberately not here:

  _lib\          the vendored Excel library (openpyxl 3.1.5 + et_xmlfile),
                 unmodified upstream, carried in the delivery zip so the
                 kit runs with nothing installed
  site data      Data_SiteIQ exports, the LATEST workbook, the .xlsm,
                 Reports\, LAPTOP_CHECK.txt, LAST_RUN_LOG.txt

The delivery zip (Onhire_Report_Kit_MAKEOVER.zip) is this folder plus
_lib. Extract it over the top of the live kit folder.
