"""Author: Andrew Fisher. Milestone banner, v10.26: the v10.25 celebration played over the area card on the Work
progress board, a screen or more below the top of the Today tab, then marked itself seen - so nobody saw it. Now a
banner at the top of the Today tab lists every area at 100% every time (Show me, Summary, Print), and the first-time
burst fills the whole screen, only while the Today tab is showing. Nothing is written to the record; no position,
quantity, rate or charge changes.

    python3 patch_v1026.py path/to/page.html

Guards: refuses a repeat (ms1026-script already in the page) and a wrong base (the v10.25 line's ms1025-script and
the ' · v10.25' footer must be present).
"""
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent / 'toolchain'))
from rep import rep

SCRIPT = HERE / 'ms1026.js'
CSS = HERE / 'ms1026.css'

REPLACEMENTS = [
    ('v10.25 burst handed to the banner', "fire.forEach(({card, f}, i) => { markSeen(f.id, f.reachedAt || 'reached'); setTimeout(() => celebrate(card), 250 + i * 400); });",
     "if (typeof W.ms1026After === 'function') W.ms1026After({fire, all, board, asOf}); /* v10.26 */\n else fire.forEach(({card, f}, i) => { markSeen(f.id, f.reachedAt || 'reached'); setTimeout(() => celebrate(card), 250 + i * 400); });"),
    ('Names as people, not systems', "const bump = (m, k) => m.set(k, (m.get(k) || 0) + 1);",
     "const bump = (m, k) => m.set(k, (m.get(k) || 0) + 1);\n const personName = s => { s = String(s || '').replace(/\\s+via\\s+.*$/i, '').trim(); return s ? s.replace(/(^|\\s)([a-z])/g, (m, a, b) => a + b.toUpperCase()) : '(no name)'; }; /* v10.26 */"),
    ('Counts of what is missing', "const types = new Map(); let levelled = 0, steps = 0, numbered = 0, numbersTotal = 0, withAcc = 0, doneNow = 0, onNow = 0;",
     "const types = new Map(); let levelled = 0, steps = 0, numbered = 0, numbersTotal = 0, withAcc = 0, doneNow = 0, onNow = 0; const notLevelled = [], noSteps = [], noAcc = []; /* v10.26 */"),
    ('Which are not levelled, which have no steps', "if (d.levelled) levelled++; if (d.steps) steps++;",
     "if (d.levelled) levelled++; else notLevelled.push(a.key); if (d.steps) steps++; else noSteps.push(a.key); /* v10.26 */"),
    ('Numbers count the unit records too', "const nums = a.asset_numbers || []; if (nums.length) { numbered++; numbersTotal += nums.length; } else noNumber.push(a.key);",
     "const nums = (a.asset_numbers || []).slice(); if (typeof gcModel925 === 'function') { try { ((gcModel925(a, {loading: false}) || {}).rows || []).forEach(u => { const n = u && (u.assetNo || u.asset_no); if (n && u.active !== false && !u.removedBy && !nums.includes(String(n))) nums.push(String(n)); }); } catch (e) {} } if (nums.length) { numbered++; numbersTotal += nums.length; } else noNumber.push(a.key); /* v10.26 */"),
    ('Which carry no accessories', "if ((a.accessories || []).length) withAcc++;",
     "if ((a.accessories || []).length) withAcc++; else noAcc.push(a.key); /* v10.26 */"),
    ('Who set on site, as a person', "bump(onsiteBy, String(first.by || '(no name)'));", "bump(onsiteBy, personName(first.by));"),
    ('Who ticked complete, as a person (history)', "dayRow(dayOf(last.at)).complete++; bump(tickedBy, String(last.by || '(no name)'));", "dayRow(dayOf(last.at)).complete++; bump(tickedBy, personName(last.by));"),
    ('Who ticked complete, as a person (stamp)', "dayRow(dayOf(r.done_at)).complete++; bump(tickedBy, String(r.done_by || '(no name)'));", "dayRow(dayOf(r.done_at)).complete++; bump(tickedBy, personName(r.done_by));"),
    ('Missing lists returned', "firstOn, firstDone, last, days, byDay: sortedDays, levelled, steps, numbered, numbersTotal, noNumber, withAcc,",
     "firstOn, firstDone, last, days, byDay: sortedDays, levelled, steps, numbered, numbersTotal, noNumber, withAcc, notLevelled, noSteps, noAcc, /* v10.26 */"),
    ('Event line names a person', "const ev = e => e ? `${esc(e.key)} · ${esc(dmyhm(e.at))}${e.by ? ' · ' + esc(e.by) : ''}` : '—';",
     "const ev = e => e ? `${esc(e.key)} · ${esc(dmyhm(e.at))}${e.by ? ' · ' + esc(String(e.by).replace(/\\s+via\\s+.*$/i, '').replace(/(^|\\s)([a-z])/g, (m, a, b) => a + b.toUpperCase())) : ''}` : '—';"),
    ('Levelled and steps name the ones missing', "['Levelled / steps', `${f.levelled} of ${f.total} levelled · ${f.steps} of ${f.total} steps`],",
     "['Levelled', `${f.levelled} of ${f.total}${(f.notLevelled || []).length ? ' · not levelled: ' + f.notLevelled.map(esc).join(', ') : ' · all levelled'}`],\n  ['Steps', `${f.steps} of ${f.total}${(f.noSteps || []).length ? ' · no steps recorded: ' + f.noSteps.map(esc).join(', ') : ' · all with steps'}`],"),
    ('Accessories name the ones without', "['Accessories', `${f.withAcc} of ${f.total} carry accessories`],",
     "['Accessories', `${f.withAcc} of ${f.total} carry accessories${(f.noAcc || []).length ? ' · none on ' + f.noAcc.map(esc).join(', ') : ''}`],"),
    ('Ticked by, plain', "['Ticked complete by (as recorded)', who(f.tickedBy)],", "['Ticked complete by', who(f.tickedBy)],"),
    ('Set on site by, plain', "['Set on site by (as recorded)', who(f.onsiteBy)],", "['Set on site by', who(f.onsiteBy)],"),
    ('Banner script', '</script>\n</body>', '</script>\n<style id="ms1026-style">\n%CSS%\n</style>\n<script id="ms1026-script">\n%SCRIPT%\n</script>\n</body>'),
    ('Release footer', "+ ' · v10.25'", "+ ' · v10.26'"),
]


def main():
    a = sys.argv[1:]
    if not a: sys.exit(__doc__)
    page = Path(a[0]); html = page.read_text(encoding='utf-8')
    if 'ms1026-script' in html: sys.exit('patch_v1026 refuses a repeat: ms1026-script is already in the page')
    if 'ms1025-script' not in html or "+ ' · v10.25'" not in html: sys.exit('patch_v1026: not the v10.25 line - wrong base')
    script = SCRIPT.read_text(encoding='utf-8').rstrip('\n'); css = CSS.read_text(encoding='utf-8').rstrip('\n')
    assert script.startswith('/* Author: Andrew Fisher.'), 'the script must open with its author line'
    assert '</script' not in script and '</style' not in css
    for what, old, new in REPLACEMENTS:
        html = rep(html, old, new.replace('%SCRIPT%', script).replace('%CSS%', css), what, page)
    page.write_text(html, encoding='utf-8')
    print('patch_v1026 applied: milestone banner at the top of Today, screen burst only while Today shows, footer v10.25 -> v10.26')


if __name__ == '__main__':
    main()
