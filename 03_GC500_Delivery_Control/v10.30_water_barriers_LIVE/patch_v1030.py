"""Author: Andrew Fisher. Water barriers, v10.30 (Andrew, 15 Oct 2026: "Water barriers is missing its own section. What's
been completed and what has not has no set up like buildings and toilets. Only looking at the Coates.") and no agent
name anywhere on the page ("ensure we do not mention anywhere on any tab that entry is done by codex or claude").

1. The Today tab's Work progress board gets a **Water barriers** card after Toilets and Fencing, counted the board's own
   way from the schedule's WB quantities: Done is the barriers of every reference ticked complete, Left the rest. The
   milestone banner follows the board, so the card reaches 100% the same way Buildings did.
2. iEDM's water barrier programme TP02-26003-03 (`wfb_programme.json`, read by `read_wfb_programme.py`) goes on the page
   as `DATA.wfb_programme1030`: each WB row's zone, location, quantity, days, install date and time and who installs,
   the water truck fill time and who fills, the removal date and time, and the comments as written. The board's rows
   say the install, fill and removal; the drawer gets a "Water barrier programme" card. Downer's rows are kept, named
   in the card's notes and never counted.
3. The 17 lines of contract 9972648-STPS (the TL2 barriers) are joined to their WB references: the programme, the
   schedule and the contract line all name the reference and, line by line, the quantity and the install date agree
   or the difference is written in `DATA.wfb_review1030`. Assignments and the contract's matched count follow.
4. The page's one HTML escape, `esc()`, drops " via Codex" / " via Claude" from anything it prints, so a recorder's
   name reads as the person on every tab, drawer and print; the record itself is unchanged.
5. Footer v10.29 -> v10.30.

    python3 patch_v1030.py path/to/page.html   (after patch_v1029.py on the live v10.28, or on a live v10.29)
"""
import json
import re
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent / 'toolchain'))
from rep import rep

SCRIPT = HERE / 'wfb1030.js'
CSS = HERE / 'wfb1030.css'
PROG = HERE / 'wfb_programme.json'
CONTRACT = '9972648'

REPLACEMENTS = [
    ('Water barriers on the board', "accepts: /toilet|\\bfwf\\b|pan\\s*block|pee\\s*panel/i},",
     "accepts: /toilet|\\bfwf\\b|pan\\s*block|pee\\s*panel/i},\n     {id: 'barriers', name: 'Water barriers', group: 'Water-filled barriers', unit: 'barriers',\n       scope: 'Water-filled barriers · Coates installs (TL2)', accepts: /\\btl2\\b|barrier/i}, /* v10.30 */"),
    ('Equipment note no longer claims the barriers', "VMS has its own card; barriers, furniture and track mat remain in Equipment detail.",
     "VMS and water barriers have their own cards; furniture and track mat remain in Equipment detail."),
    ('The programme on the board rows', "d.levelled ? 'Positioned and levelled recorded.' : '', d.steps ? 'Steps installed recorded.' : ''].filter(Boolean).join(' ');",
     "d.levelled ? 'Positioned and levelled recorded.' : '', d.steps ? 'Steps installed recorded.' : '',\n         def.id === 'barriers' && typeof wfbWords1030 === 'function' ? wfbWords1030(a.key) : '' /* v10.30 */].filter(Boolean).join(' ');"),
    ('The card notes', "if (def.id === 'toilets') area.notes.push('Blocks and trailers count as units, not individual pans. Waste tanks and separate accessories are excluded.');",
     "if (def.id === 'toilets') area.notes.push('Blocks and trailers count as units, not individual pans. Waste tanks and separate accessories are excluded.');\n     if (def.id === 'barriers' && typeof wfbNotes1030 === 'function') wfbNotes1030().forEach(n => area.notes.push(n)); /* v10.30 */"),
    ('No agent name on anything the page prints', "const esc = s => String(s == null ? '' : s).replace(/[&<>\"']/g,",
     "function noAgent1030(s){ return s.indexOf(' via ') < 0 ? s : s.replace(/ via (?:Codex|Claude)(?: \\([^)]*\\))?/g, ''); } /* v10.30 - the person, never the assistant the entry was typed through */\nconst esc = s => noAgent1030(String(s == null ? '' : s)).replace(/[&<>\"']/g,"),
    ('Barrier icon', "lighting: 'M12 7V21M6 22L12 18L18 22M3 3H9V7H3ZM15 3H21V7H15ZM9 5H15M12 10L5 14M12 10L19 14',",
     "lighting: 'M12 7V21M6 22L12 18L18 22M3 3H9V7H3ZM15 3H21V7H15ZM9 5H15M12 10L5 14M12 10L19 14', barriers: 'M3 20H21M5 20V10H19V20M5 14H19M9 10V6H15V10M8 20V22M16 20V22',"),
    ('Script and style', '</script>\n</body>', '</script>\n<style id="wfb1030-style">\n%CSS%\n</style>\n<script id="wfb1030-script">\n%SCRIPT%\n</script>\n</body>'),
    ('Release footer', "+ ' · v10.29'", "+ ' · v10.30'"),
]


def data_edits(D):
    prog = json.loads(PROG.read_text(encoding='utf-8'))
    assets = {a['key']: a for a in D['assets']}
    R = D['rental_on_hire']
    joined = []; by_ref = {}
    for r in R['rows']:
        if str(r['rental_contract']) != CONTRACT or r.get('charge_line'): continue
        m = re.match(r'^(WB\d\d)\b', str(r.get('description') or ''))
        if not m or m.group(1) not in assets: continue
        ref = m.group(1); prow = next((p for p in prog['rows'] if p['ref'] == ref), None)
        was = r.get('match') or {}
        agree = []
        if prow and prow['quantity'] == r.get('quantity'): agree.append('quantity %s' % r['quantity'])
        if prow and prow['install']['date'] and r.get('start_date') == prow['install']['date']: agree.append('install date %s' % r['start_date'])
        r['match'] = {'state': 'settled by the programme', 'to': 'asset', 'key': ref, 'task_id': None, 'via': 'water barrier programme',
                      'basis': 'TP02-26003-03, the schedule and this line all name %s%s (joined 16 Oct 2026; the line\'s own heading alone is not evidence)' % (ref, ('; ' + ' and '.join(agree) + ' agree') if agree else '')}
        r['joined1030'] = {'was': was.get('state'), 'agree': agree}
        by_ref.setdefault(ref, []).append(r)
        joined.append({'line': f"{CONTRACT}/{r['line']}", 'ref': ref, 'quantity': r.get('quantity'), 'status': r.get('status_as_written'), 'start': r.get('start_date'), 'agree': agree})
    assert len(joined) == 17, len(joined)
    AS = R['assignments']
    for ref, lines in by_ref.items():
        first = lines[0]; dl = next((x for x in lines if x.get('delivered')), None)
        AS[ref] = {'branch_code': first['branch_code'], 'rental_contract': CONTRACT, 'via': 'water barrier programme', 'basis': first['match']['basis'],
                   'lines': [f"{CONTRACT}/{x['line']}" for x in lines], 'all_contracts': [CONTRACT], 'delivered': {'date': dl['start_date'], 'delivery_number': dl.get('delivery_number')} if dl else None}
    for c in R['contracts']:
        if str(c['rental_contract']) != CONTRACT: continue
        rs = [x for x in R['rows'] if str(x['rental_contract']) == CONTRACT]
        c['assets'] = sorted({x['match']['key'] for x in rs if x.get('match') and x['match'].get('to') == 'asset' and x['match'].get('key')})
        c['matched'] = sum(1 for x in rs if x.get('match') and x['match'].get('to'))
    # the review: what the three sources say where they differ
    sched_qty = lambda a: sum(l.get('quantity') or 0 for l in (a.get('charge_lines') or []) if l.get('item') == 'TL2')
    differs = []; no_ref = []
    for p in prog['rows']:
        if not p['coates']: continue
        a = assets.get(p['ref'])
        if not a: no_ref.append({'ref': p['ref'], 'quantity': p['quantity'], 'location': p['location'], 'install': p['install']['date'], 'note': p['install']['comment']}); continue
        s = sched_qty(a); c = sum(x.get('quantity') or 0 for x in by_ref.get(p['ref'], [])) if by_ref.get(p['ref']) else None
        if s != p['quantity'] or (c is not None and c != s): differs.append({'ref': p['ref'], 'schedule': s, 'programme': p['quantity'], 'contract': c, 'programme_note': p['install']['comment']})
    D['wfb_programme1030'] = prog
    D['wfb_review1030'] = {'rule': 'Coates installs only. The schedule\'s WB quantities are the count; the programme gives the dates and times; the contract lines are joined where all three name the reference. Where quantities differ all three are written and nothing is reconciled.',
                           'asked_by': 'Andrew Fisher', 'asked_on': '2026-10-15', 'joined': joined, 'no_reference': no_ref, 'quantity_differs': differs,
                           'downer': [{'ref': p['ref'], 'quantity': p['quantity'], 'location': p['location']} for p in prog['rows'] if not p['coates']]}
    return {'joined': joined, 'no_reference': no_ref, 'quantity_differs': differs, 'assignments': sorted(by_ref)}


def main():
    a = sys.argv[1:]
    if not a: sys.exit(__doc__)
    page = Path(a[0]); html = page.read_text(encoding='utf-8')
    if 'wfb1030-script' in html: sys.exit('patch_v1030 refuses a repeat: wfb1030-script is already in the page')
    if "+ ' · v10.29'" not in html: sys.exit('patch_v1030: not the v10.29 line - wrong base (apply patch_v1029.py first)')
    key = 'const DATA = '; i = html.index(key) + len(key)
    D, end = json.JSONDecoder().raw_decode(html, i)
    before = json.dumps(D, ensure_ascii=False, separators=(',', ':'))
    assert html[i:i + len(before)] == before, 'DATA does not round-trip byte for byte; stop'
    log = data_edits(D)
    after = json.dumps(D, ensure_ascii=False, separators=(',', ':'))
    html = html[:i] + after + html[end:]
    script = SCRIPT.read_text(encoding='utf-8').rstrip('\n'); css = CSS.read_text(encoding='utf-8').rstrip('\n')
    assert script.startswith('/* Author: Andrew Fisher.'), 'the script must open with its author line'
    for what, old, new in REPLACEMENTS:
        html = rep(html, old, new.replace('%SCRIPT%', script).replace('%CSS%', css), what, str(page), need=what != 'Barrier icon')
    page.write_text(html, encoding='utf-8')
    (HERE / 'data_log_1030.json').write_text(json.dumps(log, ensure_ascii=False, indent=1), encoding='utf-8')
    print('patch_v1030 applied: Water barriers card on the board, the programme on the page and in the drawer, 17 contract lines joined, no agent name in anything printed; footer v10.29 -> v10.30')


if __name__ == '__main__':
    main()
