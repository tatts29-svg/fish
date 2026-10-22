"""Author: Andrew Fisher. 22 Oct 2026 - Baseplan SuperCars (6, with the delivery dockets) and Schedule 13 against the
live record (10499). Read-only. Writes GC500_Baseplan_vs_Record_22Oct2026.xlsx beside this script and evidence/counts.json.

    python3 -I build_review.py <private dir>      with bp6.json (the export as JSON), schedule13.json, state_now.json,
                                                  diff_5_to_7.json, diff_6_to_7.json in it, and the page build beside.

The private workbooks and the record snapshot never leave the private dir (AGENTS.md: Baseplan files are not committed).
"""
import json, re, sys, collections, datetime
from pathlib import Path
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment

PRIV = Path(sys.argv[1]); HERE = Path(__file__).resolve().parent
PAGE = Path(sys.argv[2]) if len(sys.argv) > 2 else HERE.parent / 'build' / 'GC500_v11.16' / 'GC500_Delivery_Control_hosted.html'
bp = json.load(open(PRIV / 'bp6.json')); sched = json.load(open(PRIV / 'schedule13.json'))
st = json.load(open(PRIV / 'state_now.json')); REC_VERSION = st.get('version'); st = st['docs']
d57 = json.load(open(PRIV / 'diff_5_to_7.json'))
page = open(PAGE, encoding='utf-8').read()
i = page.find('const DATA = '); j = page.find('\n', i); DATA = json.loads(page[i + len('const DATA = '):j].rstrip(';'))
i = page.find('var SVC1067_CARD='); j = page.find('\n', i); SVC = json.loads(page[i + len('var SVC1067_CARD='):j].rstrip(';'))['data']
i = page.find('window.VMS1024_DATA = '); j = page.find('\n', i); VMSD = json.loads(page[i + len('window.VMS1024_DATA = '):j].rstrip(';'))

RATES = {'install': 145.74, 'steps': 156.15, 'levelling': 52.05, 'cleaning': 104.10, 'fire_ext': 52.05, 'demob': 145.74}   # card, labour per building
PKG = round(sum(RATES.values()), 2)                                                                                           # 655.83, Baseplan's package
BIG = re.compile(r'12m|9\.6m|12\.0M|9\.6M')

# ------------------------------------------------------------------------------------------------- the record, read once
lab = st['labour']; dl = st['delivery']; units = st['units']
def ticks(ref):
    out = collections.defaultdict(dict)
    for v in lab.values():
        k = v.get('_k', ''); p = k.split('|')
        if len(p) < 4: continue
        r = p[0]; unit = None
        if '/' in r: r, unit = r.split('/', 1)
        if r != ref: continue
        out[(p[2], unit)][p[3]] = bool(v.get('v'))
    return out
a2r = collections.defaultdict(set)   # asset number -> references, from every place the record keeps one
for ref, v in units.items():
    for u in v.get('units', []):
        if u.get('asset_no'): a2r[str(u['asset_no']).strip()].add(ref)
for ref, v in st.get('assetNumbers', {}).items():
    vals = v.get('v') if isinstance(v, dict) else v
    for x in (vals if isinstance(vals, list) else [vals]):
        if x: a2r[str(x).strip()].add(ref)
for k, v in st.get('loads', {}).items():
    if isinstance(v, dict) and v.get('kind') == 'unit925-record' and v.get('active') is not False and not v.get('removedBy') and v.get('assetNo'): a2r[str(v['assetNo']).strip()].add(v.get('ref'))
for v in lab.values():
    m = re.match(r'^([A-Z]+\d*)/u(\d{5,8})\|', v.get('_k', ''))
    if m: a2r[m.group(2)].add(m.group(1))
for k, v in st.get('vmsboard', {}).items():
    if v.get('fleet'): a2r[str(v['fleet'])].add(k)
def refs_of(asset): return sorted(a2r.get(str(asset).strip(), []))
# the page's own unit model (financeScopes1013 on the live page, read-only): every reference's units with owner, item and
# number, the site number standing where Andrew set one. This is where "our asset number" comes from.
SCOPES = json.load(open(PRIV / 'scopes.json'))['scopes']
UNITS_OF = collections.defaultdict(list)
for sc in SCOPES:
    for u in sc.get('units', []):
        UNITS_OF[sc['ref']].append(u)
        if u.get('assetNo'): a2r[str(u['assetNo']).strip()].add(sc['ref'])
def building_numbers(ref):
    return sorted({str(u['assetNo']) for u in UNITS_OF.get(ref, []) if u.get('assetNo') and re.search(r'Building|Ticket|Booth', str(u.get('item', '')))})
ACC_LABEL = re.compile(r'fridge|aircon|refriger|air con', re.I)

# --------------------------------------------------------------------------------------------------------- workbook
wb = Workbook(); H = Font(bold=True); FILL = PatternFill('solid', fgColor='FFF2CC'); RED = PatternFill('solid', fgColor='F8CBAD'); GRN = PatternFill('solid', fgColor='E2EFDA')
def sheet(name, head, rows, widths=None, flag_col=None):
    s = wb.create_sheet(name); s.append(head)
    for c in s[1]: c.font = H
    for r in rows:
        s.append(list(r))
    if widths:
        for n, w in enumerate(widths): s.column_dimensions[chr(65 + n) if n < 26 else 'A' + chr(65 + n - 26)].width = w
    s.freeze_panes = 'A2'
    for row in s.iter_rows(min_row=2):
        for c in row: c.alignment = Alignment(wrap_text=True, vertical='top')
        if flag_col is not None and row[flag_col].value:
            f = RED if str(row[flag_col].value).lower().startswith(('fix', 'baseplan')) else FILL if str(row[flag_col].value).lower().startswith(('ask', 'check', 'our')) else GRN
            for c in row: c.fill = f
    return s
wb.remove(wb.active)
fixes = []   # (contract, line, what Baseplan says, what the record says, action, who)
def fix(contract, line, bp_says, rec_says, action, who): fixes.append((contract, line, bp_says, rec_says, action, who))

# ====================================================================================================== 9968862 buildings
rows = []; bp_bld = {}
for d in bp['9968862']:
    desc = str(d.get('Description', '')); m = re.match(r'^(\w+)\s+(.*)', desc); head = m.group(1) if m else ''
    if str(d.get('Item Type')) == '1' and re.search(r'Building Shell|Ticket Office|Commentary Booth', desc):
        bp_bld.setdefault(head, []).append(d)
bld_refs = sorted({r for r in dl if (re.match(r'^P\d+$', r) or r in ('AA', 'CP1', 'HRP')) and any(k[0] and v.get('install') for k, v in ticks(r).items())}, key=lambda x: (x[0], int(re.sub(r'\D', '', x) or 0)))
bp_by_asset = {str(d.get('Item')): (head, d) for head, L in bp_bld.items() for d in L}
tot = collections.Counter(); our_labour = 0.0; legs_big = legs_small = 0
for ref in bld_refs:
    T = ticks(ref); v = dl.get(ref, {})
    nums = building_numbers(ref)
    bl = [bp_by_asset[n] for n in nums if n in bp_by_asset]
    bp_head = ', '.join(sorted({h for h, _ in bl})) or ('-' if ref not in bp_bld else 'line under this label, other number')
    bp_line = ', '.join(str(d.get('Line')) for _, d in bl) or ', '.join(str(d.get('Line')) for d in bp_bld.get(ref, [])) or '-'
    bp_asset = ', '.join(str(d.get('Item')) for _, d in bl) or ', '.join(str(d.get('Item')) for d in bp_bld.get(ref, [])) or '-'
    rate = ', '.join(str(d.get('Rate 1')) for _, d in bl) or ', '.join(str(d.get('Rate 1')) for d in bp_bld.get(ref, [])) or '-'
    for (item, unit), t in T.items():
        if not item or not t.get('install'): continue
        big = bool(BIG.search(item)); legs = (2 if t.get('delivery') and t.get('pickup') else 1 if t.get('delivery') or t.get('pickup') else 0)
        if big: legs_big += legs
        else: legs_small += legs
        money = sum(RATES[k] for k in RATES if t.get(k)); our_labour += money
        for k in RATES: tot[k] += bool(t.get(k))
        tot['buildings'] += 1
        note = []
        if not bl and ref not in bp_bld: note.append('no 9968862 hire line for this building')
        if bl and any(h != ref for h, _ in bl): note.append('Baseplan labels it ' + ', '.join(h for h, _ in bl))
        if ref in bp_bld and not bl and nums: note.append('Baseplan line carries a different number (' + bp_asset + ')')
        if not nums: note.append('no asset number on our record')
        if v.get('steps') is False and t.get('steps'): note.append('steps unticked on the drawer; the labour steps tick still on (to turn off)')
        rows.append((ref, item + (' · ' + unit if unit else ''), ', '.join(nums) or '-', bp_head, bp_line, bp_asset, rate, v.get('state'), 'yes' if v.get('done') else '', 'yes' if v.get('levelled') else '', 'yes' if v.get('steps') else 'no',
                     *('yes' if t.get(k) else '' for k in ('install', 'steps', 'levelling', 'cleaning', 'fire_ext', 'demob')), round(money, 2), legs, '; '.join(note)))
on_bp_only = [h for h in bp_bld if h not in bld_refs and not any(h in refs_of(d.get('Item')) or refs_of(d.get('Item')) for d in bp_bld[h])]
sheet('9968862 buildings', ['Ref', 'Building (record)', 'Our asset no(s)', 'Baseplan label', 'Baseplan line', 'Baseplan asset', 'Baseplan hire rate', 'Light', 'Complete', 'Levelled (drawer)', 'Steps (drawer)', 'Install tick', 'Steps tick', 'Levelling tick', 'Cleaning tick', 'Fire ext tick', 'Demob tick', 'Our labour at card', 'Transport legs ticked', 'Note'],
      rows, [7, 18, 16, 12, 9, 12, 10, 9, 8, 8, 8, 7, 7, 7, 7, 7, 7, 11, 9, 60], 19)
bp133 = next(d for d in bp['9968862'] if str(d.get('Line')) == '133'); bp134 = next(d for d in bp['9968862'] if str(d.get('Line')) == '134'); bp135 = next(d for d in bp['9968862'] if str(d.get('Line')) == '135')
fix('9968862', '133', f"Install & Demob {bp133['Quantity']} x ${PKG} = ${bp133['Prebill Amount']:,} (the whole labour package on every building: install, steps, levelling, cleaning, fire extinguisher, demob)",
    f"{tot['buildings']} buildings ticked on the record: install {tot['install']}, levelling {tot['levelling']}, cleaning {tot['cleaning']}, demob {tot['demob']}, steps {tot['steps']} (none on P06, P38, P39, P42, P60, P62, P63), fire extinguisher {tot['fire_ext']}. At the card that is ${our_labour:,.2f}",
    f"Charge each line by the building, not a flat package: steps only where fitted, fire extinguisher only where supplied. Difference ${bp133['Prebill Amount'] - our_labour:,.2f} over on Baseplan as it stands (and it is on {bp133['Quantity']} buildings where the record has {tot['buildings']})", 'Baseplan (branch)')
fix('9968862', '134-135', f"Transport {bp134['Quantity']} x $500 (up to 6 m) + {bp135['Quantity']} x $800 (9.6/12 m) = ${bp134['Prebill Amount'] + bp135['Prebill Amount']:,}",
    f"Delivery and pickup ticked on the record: {legs_small} legs small buildings, {legs_big} legs large", f"Small-building legs: Baseplan {bp134['Quantity']}, record {legs_small}; large: Baseplan {bp135['Quantity']}, record {legs_big}. Align the count to the buildings table", 'Baseplan (branch)')
for ref in bld_refs:
    nums = building_numbers(ref)
    bl = [bp_by_asset[n] for n in nums if n in bp_by_asset]
    if bl and any(h != ref for h, _ in bl): fix('9968862', ', '.join(str(d.get('Line')) for _, d in bl), f"labelled {', '.join(h for h, _ in bl)} ({', '.join(str(d.get('Item')) for _, d in bl)})", f"that building is {ref} on site", f"Relabel the line {ref}", 'Baseplan (branch)')
    elif ref in bp_bld and not bl and nums: fix('9968862', ', '.join(str(d.get('Line')) for d in bp_bld[ref]), f"{ref} asset {', '.join(str(d.get('Item')) for d in bp_bld[ref])}", f"{ref} is {', '.join(nums)} on site", 'Correct the asset number on the line (the site number stands)', 'Baseplan (branch)')
    elif not bl and ref not in bp_bld: fix('9968862', '-', f"no hire line for {ref}", f"{ref} on site with install ticked" + ('' if nums else ' (no asset number recorded on our side either)'), 'Add the hire line (and give us the asset number if we lack it)', 'Baseplan (branch)' if nums else 'Both')
ours_by_num = {n: r for r in bld_refs for n in building_numbers(r)}
for h in bp_bld:
    if h not in bld_refs and all(str(d.get('Item')) not in ours_by_num for d in bp_bld[h]): fix('9968862', ', '.join(str(d.get('Line')) for d in bp_bld[h]), f"{h} {', '.join(str(d.get('Item')) for d in bp_bld[h])} delivered", 'no such building ticked on the record', 'Check whether this is a building on site under another reference, or a line to close', 'Ask Andrew')
AHEAD_MARK = True
ahead = []
def ahead_row(contract, line, what, charged, done_part, not_done_part, basis): ahead.append((contract, line, what, charged, round(done_part, 2), round(not_done_part, 2), basis))

# ======================================================================================================== 9968955 toilets
trk = {}
for a in SVC['areas']:
    for r in a['refs']:
        d = trk.setdefault(r['ref'], collections.Counter()); d['area'] = a['n']
        for l in r['lines']:
            d[l['kind']] += l['qty']; d['nos_coates'] += sum(1 for n in (l.get('nos') or []) if re.match(r'^\d{6,7}$', str(n))); d['nos_ep'] += sum(1 for n in (l.get('nos') or []) if re.match(r'^\d{4}$', str(n)))
bq = collections.defaultdict(lambda: collections.Counter()); bq_lines = collections.defaultdict(list); unmatched_assets = []
for d in bp['9968955']:
    if str(d.get('Item Type')) != '1': continue
    desc = str(d.get('Description', '')); m = re.match(r'^(WC\d+\w*|PG\d+|P\d+|T\d+|Wc\d+)\s+(.*)', desc); head = (m.group(1) if m else '?').upper(); kind = (m.group(2) if m else desc)
    q = d.get('Quantity'); q = q if isinstance(q, (int, float)) else 1
    k = 'fwf' if 'Fresh Water' in kind or kind.startswith('FWF Toilet') else 'trailer' if 'Trailer' in kind else 'access' if 'Accessible' in kind or 'Disabled' in kind else 'pan16' if '16 Pan' in kind else 'tank' if 'Holding Tank' in kind else 'block' if 'Block' in kind else 'other'
    bq[head][k] += q; bq_lines[head].append(str(d.get('Line')))
    it = str(d.get('Item', ''))
    if re.match(r'^\d{6,7}$', it) and not refs_of(it): unmatched_assets.append((d.get('Line'), it, desc[:60], d.get('Status')))
heads = sorted(set(bq) | {k for k in trk if k.startswith(('WC', 'PG'))}, key=lambda x: (x[:2], int(re.sub(r'\D', '', x) or 0)))
rows = []; T = collections.Counter()
for h in heads:
    b = bq.get(h, {}); t = trk.get(h, {})
    bfwf = b.get('fwf', 0) + b.get('trailer', 0); tfwf = t.get('fwf', 0)
    bblk = b.get('block', 0); tblk = t.get('sewer', 0) + t.get('block', 0)
    flags = []
    if bfwf != tfwf: flags.append(f"FWF: Baseplan {bfwf}, record {tfwf}")
    if b.get('access', 0) != t.get('access', 0): flags.append(f"accessible: Baseplan {b.get('access', 0)}, record {t.get('access', 0)}")
    if bblk != tblk: flags.append(f"blocks: Baseplan {bblk}, record {tblk}")
    if b.get('tank', 0) != t.get('tank', 0): flags.append(f"tanks: Baseplan {b.get('tank', 0)}, record {t.get('tank', 0)}")
    if b.get('pan16', 0) != t.get('pan16', 0): flags.append(f"16-pan: Baseplan {b.get('pan16', 0)}, record {t.get('pan16', 0)}")
    rows.append((h, t.get('area', ''), ', '.join(bq_lines.get(h, [])), bfwf, tfwf, b.get('access', 0), t.get('access', 0), bblk, tblk, b.get('tank', 0), t.get('tank', 0), b.get('pan16', 0), t.get('pan16', 0), t.get('nos_coates', 0), t.get('nos_ep', 0), ('fix: ' if flags else '') + '; '.join(flags)))
    for k, v in (('bp_fwf', bfwf), ('trk_fwf', tfwf), ('bp_access', b.get('access', 0)), ('trk_access', t.get('access', 0)), ('bp_block', bblk), ('trk_block', tblk), ('bp_tank', b.get('tank', 0)), ('trk_tank', t.get('tank', 0)), ('bp_pan16', b.get('pan16', 0)), ('trk_pan16', t.get('pan16', 0))): T[k] += v
sheet('9968955 toilets by ref', ['Ref', 'Servicing area', 'Baseplan lines', 'FWF Baseplan', 'FWF record', 'Accessible Baseplan', 'Accessible record', 'Blocks Baseplan', 'Blocks record (sewer + tank-mounted)', 'Tanks Baseplan', 'Tanks record', '16-pan Baseplan', '16-pan record', 'Coates numbers on record', 'Event Portables numbers on record', 'Difference'],
      rows, [7, 8, 22, 8, 8, 9, 9, 9, 12, 8, 8, 8, 8, 10, 10, 50], 15)
svc = {str(d.get('Line')): d for d in bp['9968955'] if str(d.get('Item Type')) == '2'}
nights = 3
rows = [
 ('141', svc['141']['Description'], svc['141']['Quantity'], svc['141']['Price'], svc['141']['Prebill Amount'], f"{T['trk_fwf']} FWF + {T['trk_access']} accessible on the tracker = {T['trk_fwf'] + T['trk_access']} units x {nights} race nights = {(T['trk_fwf'] + T['trk_access']) * nights}", (T['trk_fwf'] + T['trk_access']) * nights, round((T['trk_fwf'] + T['trk_access']) * nights * svc['141']['Price'], 2), f"Baseplan's {svc['141']['Quantity']} is {svc['141']['Quantity'] // nights} units x {nights}; its hire list is short the units flagged on the by-ref sheet. Count follows the units on site."),
 ('142', svc['142']['Description'], svc['142']['Quantity'], svc['142']['Price'], svc['142']['Prebill Amount'], f"{T['trk_tank']} tanks + {T['trk_pan16']} 16-pan blocks = {T['trk_tank'] + T['trk_pan16']} x {nights} = {(T['trk_tank'] + T['trk_pan16']) * nights}", (T['trk_tank'] + T['trk_pan16']) * nights, round((T['trk_tank'] + T['trk_pan16']) * nights * svc['142']['Price'], 2), 'agrees' if (T['trk_tank'] + T['trk_pan16']) * nights == svc['142']['Quantity'] else 'differs'),
 ('143', svc['143']['Description'], svc['143']['Quantity'], svc['143']['Price'], svc['143']['Prebill Amount'], f"{T['trk_block'] - 6} sewer-connected blocks x {nights} = {(T['trk_block'] - 6) * nights} (the 6 tank-mounted blocks are cleaned under line 142)", (T['trk_block'] - 6) * nights, round((T['trk_block'] - 6) * nights * svc['143']['Price'], 2), 'agrees' if (T['trk_block'] - 6) * nights == svc['143']['Quantity'] else 'differs'),
 ('144', svc['144']['Description'], svc['144']['Quantity'], svc['144']['Price'], svc['144']['Prebill Amount'], f"{T['trk_block']} blocks + {T['trk_pan16']} 16-pan = {T['trk_block'] + T['trk_pan16']}", T['trk_block'] + T['trk_pan16'], round((T['trk_block'] + T['trk_pan16']) * svc['144']['Price'], 2), 'agrees' if T['trk_block'] + T['trk_pan16'] == svc['144']['Quantity'] else 'differs'),
 ('145', svc['145']['Description'], svc['145']['Quantity'], svc['145']['Price'], svc['145']['Prebill Amount'], f"{T['trk_access']} accessible x 2 (install + demob)", T['trk_access'] * 2, round(T['trk_access'] * 2 * svc['145']['Price'], 2), 'agrees' if T['trk_access'] * 2 == svc['145']['Quantity'] else 'differs'),
 ('146', svc['146']['Description'], svc['146']['Quantity'], svc['146']['Price'], svc['146']['Prebill Amount'], f"{T['trk_fwf']} FWF x 2 (install + demob)", T['trk_fwf'] * 2, round(T['trk_fwf'] * 2 * svc['146']['Price'], 2), f"Baseplan on {svc['146']['Quantity'] // 2} FWF; the tracker has {T['trk_fwf']}"),
 ('147', svc['147']['Description'], svc['147']['Quantity'], svc['147']['Price'], svc['147']['Prebill Amount'], f"{T['trk_block'] + T['trk_pan16']} blocks x 2 legs", (T['trk_block'] + T['trk_pan16']) * 2, round((T['trk_block'] + T['trk_pan16']) * 2 * svc['147']['Price'], 2), 'agrees' if (T['trk_block'] + T['trk_pan16']) * 2 == svc['147']['Quantity'] else 'differs'),
 ('148', svc['148']['Description'], svc['148']['Quantity'], svc['148']['Price'], svc['148']['Prebill Amount'], f"{T['trk_access']} accessible x 2 legs", T['trk_access'] * 2, round(T['trk_access'] * 2 * svc['148']['Price'], 2), 'agrees' if T['trk_access'] * 2 == svc['148']['Quantity'] else 'differs'),
 ('149', svc['149']['Description'], svc['149']['Quantity'], svc['149']['Price'], svc['149']['Prebill Amount'], f"{T['trk_fwf']} FWF x 2 legs if every FWF is charged transport (Event Portables units included)", T['trk_fwf'] * 2, round(T['trk_fwf'] * 2 * svc['149']['Price'], 2), 'Ask: is transport charged on the Event Portables units at the Coates rate?'),
]
sheet('9968955 service lines', ['Line', 'Baseplan line', 'Baseplan qty', 'Rate', 'Baseplan $', 'Our basis (record)', 'Our qty', 'Our $ at the same rate', 'Verdict'], rows, [6, 40, 10, 8, 12, 60, 8, 14, 60])
fix('9968955', '141', f"Pumpout FWF & accessible {svc['141']['Quantity']} x ${svc['141']['Price']} = ${svc['141']['Prebill Amount']:,}", f"{T['trk_fwf']} FWF + {T['trk_access']} accessible on the servicing tracker; x {nights} race nights = {(T['trk_fwf'] + T['trk_access']) * nights}", f"Quantity to {(T['trk_fwf'] + T['trk_access']) * nights} (${(T['trk_fwf'] + T['trk_access']) * nights * svc['141']['Price']:,.2f}); the FWF hire list first (by-ref sheet)", 'Baseplan (branch)')
fix('9968955', '146, 149', f"FWF install/demob {svc['146']['Quantity']} x ${svc['146']['Price']}; FWF transport {svc['149']['Quantity']} x ${svc['149']['Price']} (both on {svc['146']['Quantity'] // 2} FWF)", f"{T['trk_fwf']} FWF on the tracker", f"Quantities to {T['trk_fwf'] * 2} once the FWF list is right; confirm whether Event Portables units carry Coates transport", 'Baseplan (branch) + Ask Andrew')
for h in heads:
    b = bq.get(h, {}); t = trk.get(h, {}); bfwf = b.get('fwf', 0) + b.get('trailer', 0)
    if bfwf != t.get('fwf', 0): fix('9968955', ', '.join(bq_lines.get(h, [])) or '-', f"{h}: {bfwf} FWF", f"{h}: {t.get('fwf', 0)} FWF on the tracker ({t.get('nos_coates', 0)} Coates, {t.get('nos_ep', 0)} Event Portables numbers)", 'Match the FWF hire lines to the units on site', 'Baseplan (branch)')
for ln, it, desc, stt in unmatched_assets: fix('9968955', str(ln), f"{desc} asset {it} {stt}", 'this asset number is not on our record', 'Check which unit on site this is; give us the number or close the line', 'Both')

# ============================================================================================================ 9961265 VMS
vb = st['vmsboard']; pos2board = {b['pos']: (b.get('board') or b.get('default_board')) for b in VMSD['boards']}
arr = {}
for k, v in st['loads'].items():
    if isinstance(v, dict) and v.get('kind') == 'vms1024':
        ev = [e for e in (v.get('events1098') or []) if e.get('state') == 'on site']
        if ev: arr[pos2board.get(v['pos'])] = ev[-1].get('effective_date')
dd = collections.defaultdict(list)
for r in bp['Delivery Dockets']:
    if str(r.get('Hire Agreement')) == '9961265': dd[str(r.get('Fleet item')).upper() + '|' + re.sub(r'\s.*', '', str(r.get('Description')))].append((str(r.get('Date Delivery'))[:10], r.get('Direction'), r.get('Delivery Docket')))
rows = []
for d in bp['9961265']:
    if str(d.get('Item Type')) != '1': continue
    desc = str(d.get('Description', '')); m = re.match(r'^(VMS\d+\w*)\s+(\d+T)?', desc); board = m.group(1) if m else ''; bpfleet = m.group(2) if m else ''
    it = str(d.get('Item', '')).upper(); key = board[:5] if board else it
    ours = vb.get(key) or (vb.get(it) if it in vb else {}) or {}
    docks = dd.get(it + '|' + board, []) or dd.get(it + '|' + re.sub(r'\s.*', '', desc), [])
    arrived = arr.get(key) or ('2026-09-07' if it in ('1211404', '1211370', '1211354', '1182999', '1191877', '1211359', '1211383', '1271129') and str(d.get('Line')) != '12' else '')
    note = []
    if bpfleet and ours.get('fleet') and bpfleet != ours.get('fleet'): note.append(f"fleet: Baseplan {bpfleet}, record {ours.get('fleet')}")
    if not bpfleet and ours.get('fleet') and 'Premiair' in desc: note.append(f"fix: add fleet {ours.get('fleet')} (rego {ours.get('rego')}) to the line")
    if bpfleet and not ours.get('fleet') and board: note.append(f"our record lacks the fleet number {bpfleet}")
    outd = [x[0] for x in docks if x[1] == 'Out']
    if outd and str(d.get('Start Date'))[:10] != outd[0]: note.append(f"start {str(d.get('Start Date'))[:10]} but docket out {outd[0]}")
    rows.append((d.get('Line'), board or desc[:30], it, bpfleet, ours.get('fleet') or '', ours.get('rego') or '', d.get('Status'), str(d.get('Start Date'))[:10], str(d.get('Expected Term Date'))[:10], str(d.get('Term Date'))[:10] if d.get('Term Date') else '', '; '.join(f"{x[2]} {x[1]} {x[0]}" for x in docks), arrived, d.get('Rate 1'), d.get('Prebill Amount'), '; '.join(note)))
sheet('9961265 VMS boards', ['Line', 'Board', 'Baseplan item', 'Baseplan fleet', 'Our fleet', 'Our rego', 'Status', 'Start', 'Expected term', 'Term', 'Dockets', 'On site (record)', 'Rate/day', 'Prebill', 'Note'], rows, [6, 10, 11, 9, 9, 9, 9, 11, 11, 11, 30, 12, 8, 9, 55], 14)
for d in bp['9961265']:
    desc = str(d.get('Description', '')); m = re.match(r'^(VMS\d+\w*)\s+(\d+T)?', desc)
    if m and not m.group(2) and 'Premiair' in desc and vb.get(m.group(1)[:5], {}).get('fleet'): fix('9961265', str(d.get('Line')), f"{m.group(1)} Premiair, no fleet number", f"fleet {vb[m.group(1)[:5]]['fleet']}, rego {vb[m.group(1)[:5]]['rego']}", 'Put the fleet number on the line', 'Baseplan (branch)')
fix('9961265', '32-39', 'VMS13-17 start 19 Oct; dockets 26134263 (13/14/15) out 16 Oct and 26134314 (16/17) out 19 Oct', 'all five came 16 Oct on the record (T0158)', 'Start VMS13, 14, 15 on 16 Oct (3 days x $53.61 each); confirm 16/17 against the 16 Oct delivery', 'Baseplan (branch) + Ask Andrew')
fix('9961265', '31', 'VMS24 start 19 Oct; docket 26143911 out 22 Oct', 'VMS24 on site 21 Oct on the record (via Codex); Andrew 22 Oct: today\'s deliveries were the VMS boards and barriers', 'Start VMS24 on the delivery day; we correct our record to 22 Oct on Andrew\'s word', 'Both')
fix('9961265', '43-44', 'VMS05a 1211356, 20-21 Oct, $107.22 + delivery $289.52 (docket 26141143)', '1211356 is not on our record; VMS05 is one of the 7 Sep boards', 'Say what 1211356 is: a second board at 05a for a day, or a wrong entry', 'Ask Andrew')
fix('9961265', '40-42', 'Labour 24 x $176.97; transport 48 x $150; site shifts 8 x $150', 'card: VMS labour 2024 $176.97 a board; VMS transport "POA" on the card; 24 boards; our labour ticks 12 of 24', 'Labour count agrees with 24 boards. $150 a leg is Baseplan\'s figure, not on the card: confirm the transport rate and the 8 site shifts', 'Ask Andrew')
fix('9961265', '13', 'VMS10 120T', 'our register has no fleet or rego for VMS10', 'Fill our register: fleet 120T (rego when read)', 'Our record')

# ========================================================================================= charged before the work is done
# Andrew, 22 Oct 2026: "we charge for the works we do, we can't charge for things that have not been done"
ahead_row('9968862', '133', 'Install & Demob package', bp133['Prebill Amount'], bp133['Quantity'] * (PKG - RATES['demob']), bp133['Quantity'] * RATES['demob'], 'demob $145.74 a building is in the package; no building is demobbed yet')
ahead_row('9968862', '134-135', 'Building transport, both legs', bp134['Prebill Amount'] + bp135['Prebill Amount'], (bp134['Prebill Amount'] + bp135['Prebill Amount']) / 2, (bp134['Prebill Amount'] + bp135['Prebill Amount']) / 2, 'half is the return leg; nothing has gone back yet')
for ln in ('141', '142', '143'): ahead_row('9968955', ln, svc[ln]['Description'], svc[ln]['Prebill Amount'], 0, svc[ln]['Prebill Amount'], 'services over the three race nights; none done at 22 Oct - the count is the tracker ticks after each night')
for ln in ('144', '145', '146'): ahead_row('9968955', ln, svc[ln]['Description'], svc[ln]['Prebill Amount'], svc[ln]['Prebill Amount'] / 2, svc[ln]['Prebill Amount'] / 2, 'install done, demob not')
for ln in ('147', '148', '149'): ahead_row('9968955', ln, svc[ln]['Description'], svc[ln]['Prebill Amount'], svc[ln]['Prebill Amount'] / 2, svc[ln]['Prebill Amount'] / 2, 'delivery leg done, return leg not')
v40 = {str(d.get('Line')): d for d in bp['9961265']}
ahead_row('9961265', '41', v40['41']['Description'], v40['41']['Prebill Amount'], v40['41']['Prebill Amount'] / 2, v40['41']['Prebill Amount'] / 2, 'delivery legs done, return legs not')
for c in ('9994996', '9994954'):
    for d in bp[c]:
        if str(d.get('Item Type')) == '2' and d.get('Status') == 'Pending': ahead_row(c, str(d.get('Line')), str(d.get('Description')), d.get('Prebill Amount'), 0, d.get('Prebill Amount'), f"pending from {str(d.get('Start Date'))[:10]}; the work is from 23 Oct")
sheet('Charged before done', ['Contract', 'Line', 'What', 'Baseplan $ (prebill)', 'Done now $', 'Not done yet $', 'Basis'], ahead, [10, 8, 40, 14, 12, 14, 70])
fix('all', 'see sheet', f"${sum(a[3] for a in ahead):,.2f} on pending charge lines dated 16-23 Oct", f"${sum(a[4] for a in ahead):,.2f} of it is work done at 22 Oct; ${sum(a[5] for a in ahead):,.2f} is demob, return transport and race-night servicing still to come", 'Invoice the done part now; the rest when done (servicing from the tracker ticks each night)', 'Baseplan (branch)')

# ============================================================================================================ access & plant
rows = []
for sname, srows in sched.items():
    if sname in ('BOQ', 'Labour'): continue
    for r in srows[1:]:
        cells = [str(c) for c in r if c not in (None, '')]
        if not cells: continue
        if re.search(r'access', str(r[1] or ''), re.I) or re.search(r'forklift|telehandler|scissor|boom|laserplane', ' '.join(cells[:4]), re.I):
            rows.append(('Schedule 13 · ' + sname, str(r[0])[:10], ' | '.join(cells[1:])))
for c in ('9987005', '9992300', '9961976'):
    for d in bp[c]:
        desc = str(d.get('Description', ''))
        if re.search(r'forklift|telehandler|scissor|boom|tyne|extension|laserplane|transport', desc, re.I) and (c != '9961976' or re.search(r'forklift|tyne', desc, re.I)):
            rows.append((f'Baseplan {c} line {d.get("Line")}', str(d.get('Start Date'))[:10], f"{d.get('Status')} | {d.get('Item')} | {desc} | qty {d.get('Quantity')} | rate {d.get('Rate 1') or d.get('Price')} | to {str(d.get('Expected Term Date'))[:10]} | prebill {d.get('Prebill Amount')} | refs on record {refs_of(d.get('Item'))}"))
for r in bp['Delivery Dockets']:
    if re.search(r'forklift|telehandler|scissor|boom|tyne|extension|laserplane', str(r.get('Description')), re.I): rows.append((f"Docket {r.get('Delivery Docket')} ({r.get('Hire Agreement')})", str(r.get('Date Delivery'))[:10], f"{r.get('Direction')} | {r.get('Fleet item')} | {r.get('Description')} | charged {r.get('Charged')}"))
for l in DATA['plant_lines']['lines']:
    if l.get('discipline') == 'Access & plant': rows.append((f"Record plant line {l['key']}", l.get('first_date'), f"{l.get('name')} | assets {l.get('asset_numbers')} | events {[(e.get('date'), e.get('movement'), e.get('quantity_raw'), e.get('location')) for e in l.get('events', [])]} | rental {[(x.get('rental_contract'), x.get('line'), x.get('asset_no'), x.get('match_state')) for x in l.get('rental', [])]}"))
for a in DATA['assets']:
    if str(a.get('key', '')).startswith(('EQ', 'FL')): rows.append((f"Record reference {a['key']}", a.get('first_date'), f"{a.get('product')} {a.get('name')} | assets {a.get('asset_numbers')} | {a.get('first_date')} to {a.get('last_date')}"))
rows.sort(key=lambda x: (str(x[1]), x[0]))
sheet('Access & plant', ['Source', 'Date', 'What it says'], rows, [30, 11, 150])

# ============================================================================================================ new since (5)
rows = [(r['contract'], r['line'], r.get('Status'), r.get('Item'), r.get('Description'), r.get('Quantity'), r.get('Price'), r.get('Rate 1'), r.get('Prebill Amount'), str(r.get('Start Date'))[:10], str(r.get('Expected Term Date'))[:10]) for r in d57['added']]
sheet('New lines since 16 Oct', ['Contract', 'Line', 'Status', 'Item', 'Description', 'Qty', 'Price', 'Rate 1', 'Prebill', 'Start', 'Expected term'], rows, [10, 6, 10, 14, 50, 6, 9, 9, 10, 11, 11])
rows = [(r['contract'], r['line'], r.get('desc'), '; '.join(f"{k}: {v[0]} -> {v[1]}" for k, v in r['diff'].items() if k not in ('Prebill Amount', 'Number of Days', 'Split Revenue %'))) for r in d57['changed'] if any(k not in ('Prebill Amount', 'Number of Days', 'Split Revenue %') for k in r['diff'])]
rows += [(r['contract'], r['line'], r.get('Description'), 'LINE REMOVED') for r in d57['gone']]
sheet('Changed lines since 16 Oct', ['Contract', 'Line', 'Description', 'What changed'], rows, [10, 6, 50, 120])
rows = [(r.get('Hire Agreement'), r.get('Delivery Docket'), str(r.get('Date Delivery'))[:10], r.get('Direction'), r.get('Fleet item'), r.get('Description'), r.get('Charged'), r.get('Suburb')) for r in d57['dd_added']]
sheet('Dockets since 16 Oct', ['Contract', 'Docket', 'Date', 'Direction', 'Fleet item', 'Description', 'Charged', 'Suburb'], rows, [10, 10, 11, 8, 14, 50, 8, 14])

# ============================================================================================================ summary first
s = wb.create_sheet('Fix list', 0); s.append(['Contract', 'Line(s)', 'Baseplan says', 'Our record says (truth)', 'What to do', 'Who'])
for c in s[1]: c.font = H
for f in fixes: s.append(list(f))
for n, w in enumerate([10, 10, 60, 60, 60, 20]): s.column_dimensions[chr(65 + n)].width = w
for row in s.iter_rows(min_row=2):
    for c in row: c.alignment = Alignment(wrap_text=True, vertical='top')
    who = str(row[5].value); f = RED if who.startswith('Baseplan') else FILL if who.startswith('Ask') or who == 'Both' else GRN
    for c in row: c.fill = f
s.freeze_panes = 'A2'
out = HERE / 'GC500_Baseplan_vs_Record_22Oct2026.xlsx'; wb.save(out)
(HERE / 'evidence').mkdir(exist_ok=True)
json.dump({'author': 'Andrew Fisher', 'record_version': REC_VERSION, 'buildings': dict(tot), 'our_building_labour_at_card': round(our_labour, 2), 'baseplan_133': bp133['Prebill Amount'], 'transport_legs': {'small': legs_small, 'big': legs_big, 'baseplan_small': bp134['Quantity'], 'baseplan_big': bp135['Quantity']},
           'toilets': dict(T), 'toilet_service_lines': {k: {'qty': v['Quantity'], 'price': v['Price'], 'prebill': v['Prebill Amount']} for k, v in svc.items()}, 'unmatched_toilet_assets': unmatched_assets, 'fixes': len(fixes),
           'diff_5_to_7': {k: len(v) for k, v in d57.items()}}, open(HERE / 'evidence' / 'counts.json', 'w'), indent=1)
print('written', out.name, 'fixes', len(fixes), 'buildings', dict(tot), 'labour', round(our_labour, 2), 'legs', legs_small, legs_big, 'toilets', dict(T))
