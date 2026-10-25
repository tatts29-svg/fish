"""Author: Andrew Fisher. v12.16 - the fence under the scrim charged once, and GN20 back on the P&L.

Andrew, 25 Oct 2026 (this chat): "we charge once" (the scrim fence, after the fencing breakdown showed the fence under the
scrim charged as clean and again inside the scrim rate); "we then to make sure we update all costs and P&L with our
data please"; and earlier "please add GN20 Back and all costs please add all this data back in" (GN20, the 350 kVA
1276701, was on site after all; it went back on the record as GN20-A this morning, record 10848 -> 10870).

- fence1216_src.js: each priced docket with scrim carries one more line, its scrim metres off the clean at the clean
  rate (the paid side too where the docket is at Advanced's rate sheet; their approved pricing already nets it). The
  area table keeps counting the papers' metres. Every total that reads a docket's charge follows: the Fencing tab, the
  Costs category, the P&L.
- DATA: contract 9961976 line 6 (1276701) leaves the source history for the on-hire rows again - Delivered from
  30 Sep, matched to GN20-A by its asset number - and the summary, the contract entry and the assignments are recounted;
  the register's GN20 entry says where the set went instead of "never came".
- footer v12.15 -> v12.16.

    python3 patch_v1216.py page.html      (in place, on the live v12.15 page)
"""
import hashlib, json, sys
from pathlib import Path
HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent / 'toolchain'))
from rep import rep
BASE = '786142f3208a03ac732286e5421e981f8c3b8b9dd77fbd8558f3ec88d760c427'
CONTRACT, LINE, ASSET, OLD, NEW = '9961976', 6, '1276701', 'GN20', 'GN20-A'
SAID = '"i made a error the gn20 is here sorry"; "please add GN20 Back and all costs please add all this data back in"'
BACK = {'by': 'Andrew Fisher', 'on': '2026-10-25', 'words': SAID}


def data(text):
    i = text.find('const DATA = '); j = text.find('\n', i); line = text[i:j]
    obj = json.loads(line[len('const DATA = '):-1])
    if json.dumps(obj, ensure_ascii=False, separators=(',', ':')) != line[len('const DATA = '):-1]: raise ValueError('DATA does not round-trip')
    R = obj['rental_on_hire']; H = R['source_history949']; rows = R['rows']
    back = [r for r in H['rows'] if r.get('rental_contract') == CONTRACT and r.get('line') == LINE and r.get('removed_1118')]
    if len(back) != 1 or str(back[0].get('asset_no')) != ASSET: raise ValueError('9961976 line 6 (1276701) is not in the source history as expected')
    if any(r['rental_contract'] == CONTRACT and r['line'] == LINE for r in rows): raise ValueError('9961976 line 6 is already on hire')
    H['rows'].remove(back[0])
    row = {k: v for k, v in back[0].items() if k not in ('removed_1118', 'by', 'on', 'words')}
    row.update({'status_as_written': 'Delivered', 'delivered': True, 'start_date': row.get('booked_delivery_date') or '2026-09-30',
                'match': {'state': 'same asset number', 'to': 'asset', 'key': NEW, 'task_id': None, 'via': 'asset number',
                          'basis': 'asset number ' + ASSET + ' is on ' + NEW + ' on the record (GN20, re-added on 25 Oct 2026) and on line 6 of contract ' + CONTRACT},
                'returned_1216': dict(BACK)})
    if row['start_date'] != '2026-09-30': raise ValueError('line 6 was booked for ' + str(row['start_date']))
    at = next(n for n, r in enumerate(rows) if r['rental_contract'] == CONTRACT and r['line'] > LINE)
    rows.insert(at, row)
    H.pop('never_came_1118', None); H['returned_1216'] = dict(BACK, lines=[CONTRACT + '/' + str(LINE)], to=NEW)
    # recount the summary the way v11.18 did when the line left
    S = R['summary']
    S['lines'] = len(rows); S['delivered_lines'] = sum(1 for r in rows if r.get('delivered') is True)
    for k in ('same asset number', 'same delivery docket', 'same day and kind', 'candidate', 'ambiguous', 'unmatched'):
        S[k.replace(' ', '_')] = sum(1 for r in rows if (r.get('match') or {}).get('state') == k)
    S['plant_numbers'] = len({str(r['asset_no']) for r in rows if r.get('asset_no_is_plant_number') is True})
    S.pop('never_came_1118', None); S['returned_1216'] = dict(BACK, lines=[CONTRACT + '/' + str(LINE)], to=NEW)
    C = next(c for c in R['contracts'] if c['rental_contract'] == CONTRACT)
    C['lines'] = sum(1 for r in rows if r['rental_contract'] == CONTRACT)
    C['plant_numbers'] = sorted(set(C['plant_numbers']) | {ASSET})
    C['locations'] = sorted(set(C['locations']) | {row['location']})
    A = R.setdefault('assignments', {})
    if NEW in A: raise ValueError(NEW + ' already has an assignment')
    A[NEW] = {'branch_code': row['branch_code'], 'rental_contract': CONTRACT, 'via': 'asset number', 'basis': row['match']['basis'],
              'lines': [CONTRACT + '/' + str(LINE)], 'all_contracts': [CONTRACT], 'delivered': None}
    a = next(x for x in obj['assets'] if x['key'] == OLD)
    if a.get('asset_numbers') or not a.get('never_came_1118'): raise ValueError('GN20 is not the never-came entry v11.18 left')
    a.pop('never_came_1118')
    a['asset_no_state'] = ('on site from 30 Sep 2026: deleted on 20 Oct in error and re-added as ' + NEW + ' on 25 Oct 2026, which carries the 365 kVA set '
                           + ASSET + ' (contract ' + CONTRACT + ' line 6)')
    a['back_1216'] = dict(BACK, to=NEW)
    new = 'const DATA = ' + json.dumps(obj, ensure_ascii=False, separators=(',', ':')) + ';'
    return text[:i] + new + text[j:]


def patch(text):
    if 'FenceOnce1216' in text: raise ValueError('v12.16 already applied')
    if hashlib.sha256(text.encode('utf-8')).hexdigest() != BASE: raise ValueError('Live base changed; rebuild and retest')
    text = data(text)
    js = (HERE / 'fence1216_src.js').read_text(encoding='utf-8').rstrip()
    text = rep(text, '})(window);\n\n</script>\n</body>\n</html>', '})(window);\n\n</script>\n' + js + '\n</body>\n</html>', 'fence once script', 'page')
    return rep(text, "+' · v12.15'; /* v8.19 release922", "+' · v12.16'; /* v8.19 release922", 'release footer', 'page')


if __name__ == '__main__':
    p = Path(sys.argv[1]); t = p.read_text(encoding='utf-8')
    p.write_text(patch(t), encoding='utf-8')
    print('patch_v1216 applied: the fence under the scrim charged once; 9961976 line 6 (1276701) back on hire on GN20-A; footer v12.15 -> v12.16')
