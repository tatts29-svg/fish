"""Author: Andrew Fisher. v11.62 - the scrim metres Advanced's week 4 and 5 sheets bill, on the thirteen dockets built into the page.

Andrew, 23 Oct 2026: "Please make sure we price correctly. Numbers match up." Advanced's five Commercial Approval sheets
(on the record line by line) bill braced-for-scrim metres on thirty-three hire agreements that our record does not match.
Twenty of them are on the record and were corrected through the page's own docket correction the same evening
(record_23Oct2026_event_week_matching/). The thirteen of construction weeks 4 and 5 (36506, 36513, 36514, 36518, 36519,
36520, 36523, 36529, 36531, 36532, 36539, 36544, 36547) are committed fencing data in the page (DATA.ops.fencing.dockets)
and change only by a build: this patch sets their quantities to the sheet's scrim metres (the clean line keeps the paper's
metres, gates inside the card's metre), writes the correction into each note, rebuilds the docket's own priced lines at the
card so the build figure beside the live figure agrees, and moves the footer v11.60 -> v11.62. Data only; no logic changes.

    python3 patch_v1162.py page.html      (in place, on the live v11.60 page)
"""
import hashlib, json, sys
from pathlib import Path
HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent / 'toolchain'))
from rep import rep
BASE_SHA256 = (HERE / 'BASE_SHA256').read_text().strip()
FIXES = json.loads((HERE / 'committed_fixes.json').read_text(encoding='utf-8'))['ops']
EXPECT_IDS = {'36518': 'F018', '36513': 'F013', '36506': 'F006', '36514': 'F014', '36519': 'F019', '36520': 'F020', '36523': 'F023',
              '36529': 'F028', '36531': 'F030', '36532': 'F031', '36539': 'F038', '36544': 'F043', '36547': 'F046'}


def obj_end(t, i):
    """index just past the JSON object that starts at t[i] == '{' (strings respected)"""
    depth = 0; ins = False; esc = False
    for k in range(i, len(t)):
        c = t[k]
        if ins:
            if esc: esc = False
            elif c == '\\': esc = True
            elif c == '"': ins = False
            continue
        if c == '"': ins = True
        elif c == '{': depth += 1
        elif c == '}':
            depth -= 1
            if depth == 0: return k + 1
    raise ValueError('unbalanced object at ' + str(i))


def array_end(t, i):
    depth = 0; ins = False; esc = False
    for k in range(i, len(t)):
        c = t[k]
        if ins:
            if esc: esc = False
            elif c == '\\': esc = True
            elif c == '"': ins = False
            continue
        if c == '"': ins = True
        elif c == '[': depth += 1
        elif c == ']':
            depth -= 1
            if depth == 0: return k + 1
    raise ValueError('unbalanced array at ' + str(i))


def dumps(o):
    return json.dumps(o, ensure_ascii=False, separators=(',', ':'))


def columns(text):
    """the committed fencing columns (name, programme type, unit, card rate) as the page carries them"""
    i = text.find('"columns":[{"key":"clean"')
    if i < 0: raise ValueError('fencing columns not found')
    j = text.find('[', i); cols = json.loads(text[j:array_end(text, j)])
    return {c['key']: c for c in cols}


def patch(text):
    if hashlib.sha256(text.encode('utf-8')).hexdigest() != BASE_SHA256: raise ValueError('v11.62 requires the live v11.60 page ' + BASE_SHA256)
    cols = columns(text)
    for fix in FIXES:
        no = fix['docket_no']
        i = text.find('"docket_no":"%s"' % no)
        if i < 0: raise ValueError('docket ' + no + ' not in the committed data')
        st = text.rfind('{"id":"', 0, i); en = obj_end(text, st); old = text[st:en]
        d = json.loads(old)
        if dumps(d) != old: raise ValueError('docket ' + no + ' does not round-trip byte for byte; stop')
        if d.get('origin') != 'captured' or d.get('docket_no') != no or d.get('id') != EXPECT_IDS[no]: raise ValueError('docket ' + no + ' is not the committed entry expected: ' + str(d.get('id')))
        q = {k: float(v) for k, v in fix['quantities'].items()}
        lines = []
        for k, v in q.items():
            c = cols[k]
            if c.get('rate') is None: raise ValueError('no card rate for ' + k)
            lines.append({'column': k, 'name': c['name_as_written'], 'programme_type': c.get('programme_type'), 'unit': c['unit'], 'qty': v, 'rate': c['rate'], 'cost': round(v * c['rate'], 2)})
        d['quantities'] = q; d['lines'] = lines; d['cost_total'] = round(sum(l['cost'] for l in lines), 2)
        d['unpriced'] = []; d['cost_state'] = 'priced' if lines else 'nothing to price'
        d['note'] = fix['note']
        new = dumps(d)
        text = rep(text, old, new, 'committed docket ' + no, 'page')
        if text.count(new) != 1 or text.count(old) != 0: raise ValueError('docket ' + no + ' did not land once')
    text = rep(text, "+' · v11.60'; /* v8.19 release922", "+' · v11.62'; /* v8.19 release922", 'release footer', 'page')
    for needle, n in [("+' · v11.62'; /* v8.19 release922", 1), ('"docket_no":"36532","crew":"Advanced Temporary Fencing","map_ref":null,"location":"S10 compound","note":"Written on the docket:', 1), ('CORRECTED 23 Oct 2026 (Andrew: \\"Please make sure we price correctly. Numbers match up\\")', 13)]:
        if text.count(needle) != n: raise ValueError('v11.62 did not land cleanly: ' + needle[:60] + ' x' + str(text.count(needle)))
    return text


if __name__ == '__main__':
    p = Path(sys.argv[1]); t = p.read_text(encoding='utf-8')
    p.write_text(patch(t), encoding='utf-8')
    print('patch_v1162 applied: thirteen committed dockets of weeks 4-5 at the sheets\' scrim metres; footer v11.60 -> v11.62')
