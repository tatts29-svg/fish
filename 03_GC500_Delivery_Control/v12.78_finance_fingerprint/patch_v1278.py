"""Author: Andrew Fisher. v12.78 - the Finance handover's labour rows stay confirmed through a buildings lock (Andrew, 1 Nov 2026: "Fix this").

The Finance handover (fin745Rows) fingerprints each labour row with the pay rules, so a row confirmed by Finance shows "changed" if
anything that sets its pay changes afterwards. It took the whole S.runRules map, and the buildings lock (v10.49) keeps its state in
the same map (S.runRules.buildingsLock1049): every lock, unlock or open rewrote it and turned every confirmed row back to "changed",
and so did a rule that does not touch the row (labour hire's normal hours on a Coates wages row).

This release fingerprints only the rules used by that row's calculation branch, and only where they differ from the standard figure:
  Weekday Coates wages: cna_ord, ot_x15; weekday labour hire: lh_ord, ot_x15; Saturday wages/hire: sat_x15; Sunday: none.
  wd_break applies only to a valid timed weekday shift without an explicit break; salary uses no split rules. Quoted crew use none.
  This preserves standard-rule {} hashes and relevant non-default values. Legacy hashes with a nonempty irrelevant-rule map are
  not migrated: saved review events are never rewritten or accepted from a reduced snapshot alone.
With the standard rules this is {} - what the map held when the rows were confirmed - so a row whose shift and effective rules
are unchanged reads confirmed again, and a rule change that does change its pay (labour hire's normal hours, 7.5 to 7.6 on the
record) still reads "changed". The lock keeps its state where it is; nothing is moved, typed or written to the record.

Applied after patch_v1277.py (footer v12.77 -> v12.78):
    PLF_JSON=<pack dir>/GC500_PL_final.json toolchain/build.sh v12.78 v12.77_pl_tab_explorer/patch_v1277.py v12.78_finance_fingerprint/patch_v1278.py
"""
import re, sys
from pathlib import Path
FOOTER = re.compile(r"\+' · (v12\.\d+(?:\.\d+)?)'; /\* v8\.19 release922")
OLD = "payRules: S.runRules || {}};"
NEW = "payRules: fin745PayRules1278(type, c)};"
FN = """/* v12.78 - the pay rules in a Finance row's fingerprint: only those that set this row's pay, and only where they differ from the
   standard figure (Andrew, 1 Nov 2026: "Fix this"). The buildings lock keeps its state in the same map; it, and a rule that does not
   touch the row, no longer turn a confirmed row back to "changed". With the standard rules this is {}, as when the rows were confirmed. */
function fin745PayRules1278(type, row) {
 let keys = type === 'hire' ? ['lh_ord', 'ot_x15', 'sat_x15', 'wd_break'] : type === 'salary' ? ['wd_break'] : ['cna_ord', 'ot_x15', 'sat_x15', 'wd_break'];
 if (row) {
  /* Finance supplies the source row. Calls without it retain the conservative type-only diagnostic.
     Quoted event-crew shifts use supplierHours/split and do not read the employee rules. */
  const quoted = typeof Workforce1010 !== 'undefined' && Workforce1010.isShift(row);
  const day = new Date(String(row.date) + 'T00:00:00').getDay();
  const timed = !!(row.start && row.finish && shiftHours(row.start, row.finish, 0) != null);
  const explicitBreak = row.break_min != null && String(row.break_min).trim() !== '' && Number.isFinite(Number(row.break_min));
  keys = quoted ? [] : keys.filter(k => k === 'wd_break' ? timed && !explicitBreak && day !== 0 && day !== 6
   : k === 'sat_x15' ? day === 6 : day !== 0 && day !== 6);
 }
 const out = {}; keys.forEach(k => { const v = runRule(k); if (v !== RUN_DEF[k]) out[k] = v; }); return out;
}
function fin745Rows(asOf) {"""


def sub1(text, old, new, what):
    n = text.count(old)
    if n != 1: raise ValueError('%s: expected the anchor once, found %d' % (what, n))
    return text.replace(old, new)


def patch(text):
    found = FOOTER.findall(text)
    if found != ['v12.77']: raise ValueError('release footer: expected one v12.77 footer (apply after patch_v1277.py), found ' + repr(found))
    if 'fin745PayRules1278' in text: raise ValueError('already applied')
    text = sub1(text, OLD, NEW, 'the fingerprint source')
    text = sub1(text, "function fin745Rows(asOf) {", FN, 'fin745Rows')
    for need in ("const RUN_DEF = {cna_ord: 7.6, lh_ord: 7.5, ot_x15: 2, sat_x15: 2, wd_break: 30};", "function runRule(k){", "function runType(t){"):
        if text.count(need) != 1: raise ValueError('expected once: ' + need[:40])
    return FOOTER.sub(lambda m: m.group(0).replace(m.group(1), 'v12.78'), text, count=1)


if __name__ == '__main__':
    p = Path(sys.argv[1]); p.write_text(patch(p.read_text(encoding='utf-8')), encoding='utf-8')
    print('patch_v1278 applied: Finance rows fingerprint only the pay rules that set their pay; footer v12.77 -> v12.78')
