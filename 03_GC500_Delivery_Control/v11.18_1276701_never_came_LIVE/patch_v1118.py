"""Author: Andrew Fisher. v11.18 - the 365 kVA set 1276701 (contract 9961976 line 6, "GN20-S01") never came to site.

Andrew, 22 Oct 2026: "never came to site 1276701"; "remove the 1276701 350A". GN20 was deleted as a reference on
20 Oct, but the page still priced the set, because the contract line stands as Delivered in the export the page carries
and the register still named 1276701 on GN20: the Generators costing read it as a confirmed arrival from 30 Sep
($6,840.83 to 25 Oct). Data only, on the live v11.16 page:

- the contract line leaves the page's on-hire rows for the source history, marked never delivered on Andrew's word
  (the pattern of v10.26: lines that leave are kept, not lost); the on-hire summary and the 9961976 contract entry
  are recounted from what is left;
- the register's GN20 entry carries no asset number and says why;
- footer v11.16 -> v11.18 (v11.17, the map coordinates, is built and not uploaded; it is rebased when it goes).

    python3 patch_v1118.py page.html      (in place, on the live v11.16 page)
"""
import hashlib, json, sys
from pathlib import Path
HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent / 'toolchain'))
from rep import rep
BASE_SHA256 = '8a19fcce4625eb204c2d5628bc5a885c2a4e799f11e8235ffa0b7c90cc1102ae'
CONTRACT, LINE, ASSET, REF = '9961976', 6, '1276701', 'GN20'
WHY = {'removed_1118': 'never came to site', 'by': 'Andrew Fisher', 'on': '2026-10-22',
       'words': 'Andrew Fisher, 22 Oct 2026: "never came to site 1276701"; "remove the 1276701 350A". The 365 kVA set on line 6 was not delivered; nothing is charged for it.'}


def patch(text):
    if hashlib.sha256(text.encode('utf-8')).hexdigest() != BASE_SHA256: raise ValueError('v11.18 requires the live v11.16 page ' + BASE_SHA256)
    i = text.find('const DATA = '); j = text.find('\n', i); line = text[i:j]
    obj = json.loads(line[len('const DATA = '):-1])
    if json.dumps(obj, ensure_ascii=False, separators=(',', ':')) != line[len('const DATA = '):-1]: raise ValueError('DATA does not round-trip')
    R = obj['rental_on_hire']; rows = R['rows']
    gone = [r for r in rows if r['rental_contract'] == CONTRACT and r['line'] == LINE]
    if len(gone) != 1 or str(gone[0].get('asset_no')) != ASSET: raise ValueError('line 6 of 9961976 with 1276701 is not on the page as expected')
    row = gone[0]; rows.remove(row)
    row = dict(row); row.update(WHY); row['status_as_written'] = 'Never came to site'; row['delivered'] = False; row['start_date'] = None
    row['match'] = {'state': 'never delivered', 'to': None, 'key': None, 'task_id': None, 'via': None, 'basis': WHY['words']}
    R['source_history949']['rows'].append(row)
    R['source_history949']['never_came_1118'] = [CONTRACT + '/' + str(LINE)]
    # recount what the summary says about the rows that are left
    S = R['summary']
    S['lines'] = len(rows); S['delivered_lines'] = sum(1 for r in rows if r.get('delivered') is True)
    for k in ('same asset number', 'same delivery docket', 'same day and kind', 'candidate', 'ambiguous', 'unmatched'):
        S[k.replace(' ', '_')] = sum(1 for r in rows if (r.get('match') or {}).get('state') == k)
    S['plant_numbers'] = len({str(r['asset_no']) for r in rows if r.get('asset_no_is_plant_number') is True})
    S['never_came_1118'] = {'lines': [CONTRACT + '/' + str(LINE)], 'by': 'Andrew Fisher', 'on': '2026-10-22'}
    C = next(c for c in R['contracts'] if c['rental_contract'] == CONTRACT)
    C['lines'] = sum(1 for r in rows if r['rental_contract'] == CONTRACT)
    C['plant_numbers'] = [n for n in C['plant_numbers'] if n != ASSET]
    C['locations'] = [l for l in C['locations'] if not l.startswith('GN20-S01')]
    if REF in (R.get('assignments') or {}): del R['assignments'][REF]
    a = next(x for x in obj['assets'] if x['key'] == REF)
    if a.get('asset_numbers') != [ASSET]: raise ValueError('GN20 does not carry 1276701 alone in the register')
    a['asset_numbers'] = []; a['asset_no_state'] = 'never came to site: the 365 kVA set 1276701 on contract 9961976 line 6 was not delivered (Andrew Fisher, 22 Oct 2026)'
    a['never_came_1118'] = WHY
    new = 'const DATA = ' + json.dumps(obj, ensure_ascii=False, separators=(',', ':')) + ';'
    if ASSET in new and ASSET not in json.dumps(R['source_history949'], ensure_ascii=False): raise ValueError('1276701 still somewhere unexpected')
    text = text[:i] + new + text[j:]
    text = rep(text, "+' · v11.16'; /* v8.19 release922", "+' · v11.18'; /* v8.19 release922", 'release footer', 'page')
    return text


if __name__ == '__main__':
    p = Path(sys.argv[1]); t = p.read_text(encoding='utf-8')
    if 'never_came_1118' in t: sys.exit('patch_v1118 refuses a repeat')
    p.write_text(patch(t), encoding='utf-8')
    print('patch_v1118 applied: 9961976 line 6 (1276701) to the source history as never delivered; GN20 carries no number; footer v11.16 -> v11.18')
