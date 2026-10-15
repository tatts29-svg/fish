"""Author: Andrew Fisher. The card governs, v10.29: a data-only patch. The 15 Oct 2026 Baseplan export carried, for
the first time, the weekly rates NVAC keyed on its generator and lighting-tower lines (contract 9961976). The page's
charge rule prices a line by its own Rate 1 when one is written, so v10.28 priced those 24 lines at the branch's
figures and NVAC's priced total moved from $64,801.78 (card) to $113,560.44. Andrew, 15 Oct 2026: "We go by our rate
cards at the moment." This patch sets each of those keyed rates aside (kept on the line as `rate_1_keyed1029`, with
the reason) so Rate 1 is empty again and the card fills the line exactly as it did on the live v10.27: generators by
the card's daily and standdown rates over the event, towers at the card's day rate. Every other line, every join,
status, date and quantity is unchanged. The keyed rates and the card's figures are listed in `DATA.rate_hold1029`
for the conversation with the branch.

Second, the same export booked a SPARE 60 kVA against two references' register numbers: line 13 (1283681, the
number the register planned for GN06) and line 45 (1261271, the number the register planned for GN13). On site GN06
is 1320828 (line 48) and GN13 is 1276503 (line 44, delivered 12 Oct), both matched on site and on the record. The
v9.49 join rule put the spares on GN06 and GN13 by the register's numbers, so each reference held two lines for a
quantity of one and the page priced neither ("Contract quantity needs allocation"). The two spare lines are
unjoined here: they stay on the page as the branch's Pending lines with no reference, GN06 and GN13 price again from
their one line each. GN24 (lines 17, the 80 kVA asked for, and 49, a 60 kVA trailer, both booked 19 Oct) is left as
it is: which unit comes is the branch's to say. The footer goes v10.28 -> v10.29.

    python3 patch_v1029.py path/to/page.html

Guards: refuses a repeat (rate_hold1029 already in the page) and a wrong base (the ' · v10.28' footer and
DATA.baseplan_review1026 must both be present).
"""
import json
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent / 'toolchain'))
from rep import rep

WHY = 'The card governs (Andrew Fisher, 15 Oct 2026: "We go by our rate cards at the moment"). The weekly rate NVAC keyed on this line is kept here and not priced; the page fills the line from the card.'
KINDS = ('generator', 'lighting tower', 'lighting')
# where the description says a different size was delivered from the one asked for, the asked-for size prices (1 Oct rule)
ASKED = {'9961976/42': '200kva & cables', '9961976/43': '200kva & cables', '9961976/44': '45kva', '9961976/13': '50kva', '9961976/48': '50kva', '9961976/15': '45kva', '9961976/49': '80kva', '9961976/7': '60kva'}


def main():
    a = sys.argv[1:]
    if not a: sys.exit(__doc__)
    page = Path(a[0]); html = page.read_text(encoding='utf-8')
    if 'rate_hold1029' in html: sys.exit('patch_v1029 refuses a repeat: rate_hold1029 is already in the page')
    if "+ ' · v10.28'" not in html or '"baseplan_review1026"' not in html: sys.exit('patch_v1029: not the v10.28 line - wrong base')
    key = 'const DATA = '; i = html.index(key) + len(key)
    D, end = json.JSONDecoder().raw_decode(html, i)
    before = json.dumps(D, ensure_ascii=False, separators=(',', ':'))
    assert html[i:i + len(before)] == before, 'DATA does not round-trip byte for byte; stop'
    card = {it['item']: it for it in D['rate_match']['items'] if it.get('rate')}
    held = []
    for r in D['rental_on_hire']['rows']:
        if r.get('branch_code') != 'NVAC' or r.get('kind') not in KINDS or r.get('charge_line'): continue
        if not isinstance(r.get('rate_1'), (int, float)): continue
        it = card.get(r.get('register_type')) or {}
        daily = it.get('rate')
        # the size the customer asked for prices the line (the 1 Oct rule); the keyed figure reads as the card's day rate x days
        asked = ASKED.get(f"{r['rental_contract']}/{r['line']}")
        aday = (card.get(asked) or {}).get('rate') if asked else daily
        days = round(r['rate_1'] / aday, 2) if aday else None
        held.append({'line': f"{r['rental_contract']}/{r['line']}", 'description': r.get('description'), 'register_type': r.get('register_type'), 'kind': r['kind'],
                     'status': r.get('status_as_written'), 'rate_1_keyed': r['rate_1'], 'rate_type': r.get('rate_type'),
                     'card_line': it.get('rate_line'), 'card_daily': round(daily, 2) if daily else None, 'card_weekly': round(daily * 7, 2) if daily else None,
                     'difference_a_week': round(r['rate_1'] - daily * 7, 2) if daily else None,
                     'asked_for': asked or r.get('register_type'), 'card_daily_for_size_asked': round(aday, 2) if aday else None, 'keyed_equals_card_daily_x_days': days})
        r['rate_1_keyed1029'] = r['rate_1']; r['rate_1'] = None; r['rate_held1029'] = WHY
    assert len(held) == 24, f'expected the 24 NVAC generator and tower lines with a keyed rate, found {len(held)}'
    assert not [r for r in D['rental_on_hire']['rows'] if r.get('branch_code') == 'NVAC' and r.get('kind') in KINDS and isinstance(r.get('rate_1'), (int, float))]
    UNJOIN = {13: ('GN06', '1283681', '1320828', '9961976/48'), 45: ('GN13', '1261271', '1276503', '9961976/44')}
    R = D['rental_on_hire']; unjoined = []
    for r in R['rows']:
        if str(r['rental_contract']) != '9961976' or r['line'] not in UNJOIN: continue
        ref, planned, onsite, realline = UNJOIN[r['line']]
        assert (r.get('match') or {}).get('key') == ref and str(r.get('asset_no')) == planned and r['status_as_written'] == 'Pending', r
        was = r['match']
        r['match'] = {'state': 'unmatched', 'to': None, 'key': None, 'task_id': None, 'via': None,
                      'basis': f"spare: {planned} is the number the register planned for {ref}; on site {ref} is {onsite} (line {realline.split('/')[1]}), matched on site and on the record. A spare the branch books against the superseded number is not the reference's unit (set 15 Oct 2026)"}
        r['unjoined1029'] = {'from': ref, 'was': was}
        unjoined.append({'line': f"9961976/{r['line']}", 'description': r['description'], 'asset_no': planned, 'was_joined_to': ref, 'now': 'no reference (the branch\'s spare, Pending)', 'reference_unit_on_site': onsite, 'reference_line': realline})
    assert len(unjoined) == 2, unjoined
    AS = R['assignments']
    for ref, planned, onsite, realline in UNJOIN.values():
        lines = [r for r in R['rows'] if r.get('match') and r['match'].get('to') == 'asset' and r['match'].get('key') == ref]
        assert [f"{r['rental_contract']}/{r['line']}" for r in lines] == [realline], (ref, [r['line'] for r in lines])
        first = lines[0]; dl = next((r for r in lines if r.get('delivered')), None)
        AS[ref] = {'branch_code': first['branch_code'], 'rental_contract': str(first['rental_contract']), 'via': first['match']['via'], 'basis': first['match']['basis'],
                   'lines': [realline], 'all_contracts': [str(first['rental_contract'])], 'delivered': {'date': dl['start_date'], 'delivery_number': dl['delivery_number']} if dl else None}
    for c in R['contracts']:
        if str(c['rental_contract']) != '9961976': continue
        rs = [r for r in R['rows'] if str(r['rental_contract']) == '9961976']
        c['assets'] = sorted({r['match']['key'] for r in rs if r.get('match') and r['match'].get('to') == 'asset' and r['match'].get('key')})
        c['matched'] = sum(1 for r in rs if r.get('match') and r['match'].get('to'))
    D['rate_hold1029'] = {
        'rule': 'The card governs. A rate the branch keyed in Baseplan that is not the card is kept on the line as rate_1_keyed1029 and not priced; Rate 1 is left empty so the page fills the line from the card, as it did before the 15 Oct export.',
        'decided_by': 'Andrew Fisher', 'decided_on': '2026-10-15', 'words': 'We go by our rate cards at the moment.',
        'scope': 'Contract 9961976-NVAC: every generator and lighting-tower line that the 15 Oct 2026 export carries with a Rate 1 (24 lines). Lines whose Rate 1 happens to equal the card are held too, so the whole power scope goes by one rule. The cable set on line 46 ($115.14) stays: the card has no cable line.',
        'what_baseplan_will_invoice': 'The keyed rates, unless NVAC corrects them. Held here so the difference is visible line by line.',
        'reading': 'The keyed figures are not the card plus labour or installation: each is the card\'s daily rate for the unit multiplied by a count of days, keyed as a Weekly rate (towers x 10; GN23 x 9; GN01, GN03 and GN13 x 8; GN25 and GN27 x 7; the Del Req and Pending generators x 6.5, 5.5 or 4.5, the half days reading as standdown days at half rate). Six 60 kVA lines carry six different figures, several below the card, which no labour uplift gives. The risk is the rate type: a whole-hire lump keyed as W bills again every week the line stays open.',
        'held': held,
        'spares_unjoined': {'rule': 'A spare the branch books against the number the register planned for a reference is not that reference\'s unit once the unit on site is matched and recorded. The spare stays on the page as a Pending line with no reference; the reference prices from its one line.',
                            'lines': unjoined,
                            'left_as_is': 'GN24: line 17 (1276412, the 80 kVA asked for) and line 49 (1277089, a 60 kVA trailer), both booked 19 Oct 2026 and both naming GN24; the branch has not said which comes, so GN24 stays unpriced as a quantity to allocate.'}}
    after = json.dumps(D, ensure_ascii=False, separators=(',', ':'))
    html = html[:i] + after + html[end:]
    html = rep(html, "+ ' · v10.28'", "+ ' · v10.29'", 'release footer', str(page))
    page.write_text(html, encoding='utf-8')
    (HERE / 'data_log_1029.json').write_text(json.dumps(D['rate_hold1029'], ensure_ascii=False, indent=1), encoding='utf-8')
    print('patch_v1029 applied: 24 NVAC generator and tower rates set aside, the card fills them; spare lines 13 and 45 unjoined from GN06 and GN13; footer v10.28 -> v10.29')


if __name__ == '__main__':
    main()
