"""v12.42.8 - the Baseplan (8) entries the site record contradicts, corrected on the page (Andrew, 28 Oct 2026: "Fix this").
Author: Andrew Fisher.

- 9972648/3 WB02 (34 barriers): term 25 Sep 2026 keyed for 25 Oct 2026; on site from 21 Sep, booked off 25 Oct. Term set to 25 Oct.
- 9997711/1-3 FR01/FR02 fridges and their transport: start 20 Oct keyed; on site 17 Oct on our record. Start set to 17 Oct.
- 10000484/1-3 and 10000475/1 scrim rolls and transport: keyed STPS-CON / STPS-FRI on KINP sheets; fencing is STPS. Branch set to STPS.
- WB03 (starts 18 Sep) and WB07 (no line in (8)) are already right on the page.
Each changed line keeps what Baseplan wrote under baseplan_as_written12428. The footer reads v12.42.8.
"""
import json, sys
from pathlib import Path

WHY = 'Andrew, 28 Oct 2026: "Fix this" (Baseplan (8) entry against the site record)'
FIX = {('9972648', 3): {'expected_term_date': '2026-10-25', 'term_date': '2026-10-25', 'demob_date': '2026-10-25'},
       ('9997711', 1): {'contract_start': '2026-10-17', 'booked_delivery_date': '2026-10-17', 'start_date': '2026-10-17'},
       ('9997711', 2): {'contract_start': '2026-10-17', 'booked_delivery_date': '2026-10-17'},
       ('9997711', 3): {'contract_start': '2026-10-17', 'booked_delivery_date': '2026-10-17', 'start_date': '2026-10-17'},
       ('10000484', 1): {'branch_code': 'STPS'}, ('10000484', 2): {'branch_code': 'STPS'},
       ('10000484', 3): {'branch_code': 'STPS'}, ('10000475', 1): {'branch_code': 'STPS'}}


def main():
    page = Path(sys.argv[1]); html = page.read_text(encoding='utf-8')
    if 'baseplan_as_written12428' in html: sys.exit('refuses a repeat')
    at = html.index('const DATA = ') + len('const DATA = ')
    D, n = json.JSONDecoder().raw_decode(html[at:])
    assert json.dumps(D, ensure_ascii=False, separators=(',', ':')) == html[at:at + n]
    rows = {(str(r['rental_contract']), int(r['line'])): r for r in D['rental_on_hire']['rows']}
    done = []
    for k, ch in FIX.items():
        r = rows[k]
        r['baseplan_as_written12428'] = {f: r.get(f) for f in ch}; r['fixed12428'] = WHY
        r.update(ch); done.append(f'{k[0]}/{k[1]}')
    for c in D['rental_on_hire']['contracts']:
        if str(c['rental_contract']) in ('10000484', '10000475'): c['branch_code'] = 'STPS'
    D['rental_on_hire']['fixes12428'] = {'lines': done, 'why': WHY}
    html = html[:at] + json.dumps(D, ensure_ascii=False, separators=(',', ':')) + html[at + n:]
    FOOT = ("+' · v12.42.7'; /* v8.19 release922", "+' · v12.42.8'; /* v8.19 release922")
    assert html.count(FOOT[0]) == 1; page.write_text(html.replace(*FOOT), encoding='utf-8')
    print('patch_v12428_data applied:', done)


if __name__ == '__main__':
    main()
