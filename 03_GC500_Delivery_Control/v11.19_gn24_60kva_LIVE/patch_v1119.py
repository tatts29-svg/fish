"""Author: Andrew Fisher. v11.19 - GN24 is the 60 kVA trailer set 1277089 (contract 9961976 line 49); the 80 kVA on line 17
(1276412) never came.

Andrew, 22 Oct 2026: "so the gn24 we charge as a 60KVA asset no 1277089". The page carried two contract lines naming
GN24 - line 17 (1276412, the 80 kVA asked for, Pending) and line 49 (1277089, a 60 kVA trailer, Del Req) - against a
register quantity of one, so the Generators costing left GN24 "Contract quantity needs allocation" and priced nothing,
although the record has had the set on site since 19 Oct and its item as 60 kVA. Baseplan (6) itself no longer has line
17. Data only, on the live v11.18 page:

- line 17 leaves the on-hire rows for the source history, marked never delivered on Andrew's word (the v11.18 pattern);
  the on-hire summary and the 9961976 contract entry are recounted from what is left; GN24 keeps line 49 alone, so the
  costing prices one 60 kVA set from its on-site day;
- footer v11.18 -> v11.19 (v11.17, the map coordinates, stays built and not uploaded; it rebases when it goes).

The asset number itself (1277089 on GN24) is a record change through the page's own control, run separately:
../record_22Oct2026_gn24_number/.

    python3 patch_v1119.py page.html      (in place, on the live v11.18 page)
"""
import hashlib, json, sys
from pathlib import Path
HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent / 'toolchain'))
from rep import rep
BASE_SHA256 = '619716842cd86081bd68ce6d5c8d60e4cb7425cacf81e4ee212c52f1925a4aa5'
CONTRACT, LINE, ASSET, KEEP, REF = '9961976', 17, '1276412', '1277089', 'GN24'
WHY = {'removed_1119': 'never came to site', 'by': 'Andrew Fisher', 'on': '2026-10-22',
       'words': 'Andrew Fisher, 22 Oct 2026: "so the gn24 we charge as a 60KVA asset no 1277089". The 80 kVA 1276412 on line 17 was not delivered; GN24 is the 60 kVA trailer set 1277089 on line 49, on site 19 Oct.'}


def patch(text):
    if hashlib.sha256(text.encode('utf-8')).hexdigest() != BASE_SHA256: raise ValueError('v11.19 requires the live v11.18 page ' + BASE_SHA256)
    i = text.find('const DATA = '); j = text.find('\n', i); line = text[i:j]
    obj = json.loads(line[len('const DATA = '):-1])
    if json.dumps(obj, ensure_ascii=False, separators=(',', ':')) != line[len('const DATA = '):-1]: raise ValueError('DATA does not round-trip')
    R = obj['rental_on_hire']; rows = R['rows']
    gone = [r for r in rows if r['rental_contract'] == CONTRACT and r['line'] == LINE]
    if len(gone) != 1 or str(gone[0].get('asset_no')) != ASSET or gone[0].get('delivered') is not False: raise ValueError('line 17 of 9961976 with 1276412, not delivered, is not on the page as expected')
    kept = [r for r in rows if r['rental_contract'] == CONTRACT and str(r.get('asset_no')) == KEEP]
    if len(kept) != 1 or kept[0]['line'] != 49 or not str(kept[0].get('description', '')).startswith('GN24'): raise ValueError('line 49 of 9961976 with 1277089 for GN24 is not on the page as expected')
    row = gone[0]; rows.remove(row)
    row = dict(row); row.update(WHY); row['status_as_written'] = 'Never came to site'; row['delivered'] = False; row['start_date'] = None
    row['match'] = {'state': 'never delivered', 'to': None, 'key': None, 'task_id': None, 'via': None, 'basis': WHY['words']}
    R['source_history949']['rows'].append(row)
    R['source_history949']['never_came_1119'] = [CONTRACT + '/' + str(LINE)]
    S = R['summary']
    S['lines'] = len(rows); S['delivered_lines'] = sum(1 for r in rows if r.get('delivered') is True)
    for k in ('same asset number', 'same delivery docket', 'same day and kind', 'candidate', 'ambiguous', 'unmatched'):
        S[k.replace(' ', '_')] = sum(1 for r in rows if (r.get('match') or {}).get('state') == k)
    S['plant_numbers'] = len({str(r['asset_no']) for r in rows if r.get('asset_no_is_plant_number') is True})
    S['never_came_1119'] = {'lines': [CONTRACT + '/' + str(LINE)], 'by': 'Andrew Fisher', 'on': '2026-10-22'}
    C = next(c for c in R['contracts'] if c['rental_contract'] == CONTRACT)
    C['lines'] = sum(1 for r in rows if r['rental_contract'] == CONTRACT)
    C['plant_numbers'] = [n for n in C['plant_numbers'] if n != ASSET]
    a = next(x for x in obj['assets'] if x['key'] == REF)
    if a.get('asset_numbers') != []: raise ValueError('GN24 carries a number in the register already')
    a['never_came_1119'] = WHY
    # the rate-hold note that left GN24 open: settled now, in the same place
    H = obj['rate_hold1029']['spares_unjoined']
    if ASSET not in str(H.get('left_as_is')): raise ValueError('the rate-hold note on GN24 is not where expected')
    H['left_as_is_until_1119'] = H['left_as_is']
    H['left_as_is'] = 'GN24: settled 22 Oct 2026 on Andrew Fisher\'s word - the set at GN24 is the 60 kVA trailer 1277089 on line 49; the 80 kVA on line 17 never came and is in the source history.'
    new = 'const DATA = ' + json.dumps(obj, ensure_ascii=False, separators=(',', ':')) + ';'
    # 1276412 may remain only in the source history, the kept rate-hold note and GN24's own why
    def walk(o, path, out):
        if isinstance(o, dict):
            for k, v in o.items(): walk(v, path + '/' + str(k), out)
        elif isinstance(o, list):
            for n, v in enumerate(o): walk(v, path + '[' + str(n) + ']', out)
        elif ASSET in str(o): out.append(path)
    where = []; walk(obj, '', where)
    bad = [w for w in where if not (w.startswith('/rental_on_hire/source_history949/') or w == '/rate_hold1029/spares_unjoined/left_as_is_until_1119' or ('/never_came_1119/' in w and w.startswith('/assets[')))]
    if bad: raise ValueError('1276412 still somewhere unexpected: ' + ', '.join(bad))
    text = text[:i] + new + text[j:]
    text = rep(text, "+' · v11.18'; /* v8.19 release922", "+' · v11.19'; /* v8.19 release922", 'release footer', 'page')
    return text


if __name__ == '__main__':
    p = Path(sys.argv[1]); t = p.read_text(encoding='utf-8')
    if 'never_came_1119' in t: sys.exit('patch_v1119 refuses a repeat')
    p.write_text(patch(t), encoding='utf-8')
    print('patch_v1119 applied: 9961976 line 17 (1276412) to the source history as never delivered; GN24 keeps line 49 (1277089); footer v11.18 -> v11.19')
