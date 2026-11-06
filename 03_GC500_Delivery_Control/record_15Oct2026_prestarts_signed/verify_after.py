#!/usr/bin/env python3
"""Read-only check of the shared record after the pre-starts and the purchase-order ticks have been applied.
Author: Andrew Fisher.

    python3 verify_after.py

Reads GET /api/files and GET /api/state with the public view token. Prints every pre-start file by crew and day
(id, title, by), flagging any still titled "unsigned" or whose "by" carries a "via" suffix; then every purchase
order's amount and its checked {by, at}. Exit 0 when nothing is flagged and every P/O is checked, 1 otherwise.
Nothing is written. Standard library plus curl only.
"""
import json, re, subprocess, sys

BASE = 'https://gc500-production.up.railway.app'
VIEW_TOKEN = 'Coates-GC500-2026'
CREW_OF = [('GC500_Prestart_Coates_', 'Coates Installs'), ('GC500_Prestart_ATF_', 'Advanced Temporary Fencing')]
DAY = re.compile(r'(\d{4}-\d{2}-\d{2})')


def get_json(path):
    cmd = ['curl', '-sS', '--max-time', '120', '-H', '@-', '-o', '-', '-w', '\n%{http_code}', BASE + path]
    r = subprocess.run(cmd, input=('x-gc500-token: ' + VIEW_TOKEN + '\n').encode(), capture_output=True)
    body, _, code = r.stdout.decode('utf-8', 'replace').rpartition('\n')
    if code.strip() != '200':
        sys.exit(f'STOP: GET {path} answered {code.strip()} {r.stderr.decode("utf-8", "replace")[:200]}')
    return json.loads(body)


def main():
    files = get_json('/api/files').get('files') or []
    state = get_json('/api/state')
    flags = []

    print('PRE-START FILES ON THE SERVICE')
    pre = [f for f in files if re.search(r'pre.?start', (f.get('title') or '') + ' ' + (f.get('id') or ''), re.I)]
    groups = {}
    for f in pre:
        fid = f.get('id') or ''
        crew = next((c for p, c in CREW_OF if fid.startswith(p)), 'other')
        m = DAY.search(fid) or DAY.search(f.get('title') or '')
        groups.setdefault(crew, {}).setdefault(m.group(1) if m else '(no day)', []).append(f)
    for crew in sorted(groups, key=lambda c: (c == 'other', c)):
        print(f'\n  {crew}')
        for day in sorted(groups[crew]):
            for f in groups[crew][day]:
                marks = []
                if 'unsigned' in str(f.get('title') or '').lower() or 'unsigned' in str(f.get('id') or '').lower():
                    marks.append('STILL UNSIGNED')
                if ' via ' in ' ' + str(f.get('by') or '').lower() + ' ' or '(via' in str(f.get('by') or '').lower():
                    marks.append('BY HAS A VIA SUFFIX')
                flag = ('   <-- ' + ', '.join(marks)) if marks else ''
                if marks:
                    flags.append(f'{f.get("id")}: {", ".join(marks)}')
                print(f'    {day}  {f.get("id")}\n           title: {f.get("title")!r}  by: {f.get("by")!r}  kind: {f.get("kind")}{flag}')
            if len(groups[crew][day]) > 1:
                print(f'           note: {len(groups[crew][day])} files for {day}')

    print('\nPURCHASE ORDERS (docs.purchaseOrders)')
    docs = state.get('docs') or {}
    pos = docs.get('purchaseOrders') or {}
    stamps, by = docs.get('stamps') or {}, docs.get('by') or {}
    unchecked = []
    for no in sorted(pos):
        d = pos[no] or {}
        chk = d.get('checked')
        amount = d.get('amount')
        amt = f'${amount:,.2f}' if isinstance(amount, (int, float)) else '(no value)'
        if isinstance(chk, dict) and chk.get('by') and chk.get('at'):
            words = f'checked by {chk["by"]} at {chk["at"]}'
        else:
            words = 'NOT CHECKED'; unchecked.append(no)
        audit = f'stamp {((stamps.get("po~2f~" + no) or {}).get("v"))}  by-doc {((by.get("po~2f~" + no) or {}).get("v"))!r}'
        print(f'  {no}  {amt:>14}  {d.get("period") or ""}  updated_by {d.get("updated_by")!r}  {words}\n           {audit}')

    print(f'\nrecord version {state.get("version")} updated {state.get("updated")}; {len(pre)} pre-start files; {len(pos)} purchase orders')
    if flags:
        print(f'FLAGGED FILES ({len(flags)}):')
        for x in flags:
            print('  - ' + x)
    if unchecked:
        print(f'PURCHASE ORDERS WITHOUT A CHECK ({len(unchecked)}): ' + ', '.join(unchecked))
    if not flags and not unchecked:
        print('ALL CLEAR: no unsigned pre-starts, no agent suffix in by, every purchase order checked')
    sys.exit(1 if (flags or unchecked) else 0)


if __name__ == '__main__':
    main()
