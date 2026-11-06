# Author: Andrew Fisher. Inventory of every physical unit on the ground, matched to v9.15 shapes. Read only.
import json, re, collections, math
SC = '/tmp/claude-0/-home-user-fish/710a1764-23a1-5338-9fe8-299f94961e8a/scratchpad/shapes_all/'
D = json.load(open(SC + 'data_v918.json'))
REC = json.load(open('/dev/shm/state_brief.json'))
R = REC['docs']
SH = json.load(open('/home/user/fish/03_GC500_Delivery_Control/v9.15_master_shapes_DRAFT/shapes_v915.json'))['refs']
EP = json.load(open('/home/user/fish/03_GC500_Delivery_Control/meet_points_03Oct2026/event_portables_plan.json'))
RUNS = json.load(open(SC + 'wfb_runs.json'))
ML = json.load(open(SC + 'master_loc.json'))

SRC_PAGE = 'live page v9.18 DATA (sha c547a6de)'
SRC_REC = 'record v%s (read only)' % REC['version']
SRC_EP = 'Event Portables plan v10, 3 Oct (meet_points_03Oct2026/event_portables_plan.json)'
SRC_V915 = 'v9.15 shapes_v915.json'
SRC_MASTER = 'master D001-26003-03 (2 Oct, sha 8753d875)'

# ---------- reference state (cancelled / deleted) ----------
notes = {v['_k']: v['v'] for v in R['notes'].values()}
state = {}
for k, v in notes.items():
    m = re.match(r'(row|asset)/(.+)', k)
    if m and re.match(r'(Cancelled|Deleted|Taken off)', str(v)):
        state[m.group(2)] = str(v).split('\n')[0]

# ---------- type normalisation ----------
def norm(item):
    s = (item or '').strip()
    l = s.lower()
    m = re.match(r'(\d+)\s*kva', l)
    if m:
        return 'generator_%s' % m.group(1)
    if l.startswith('generator'):
        m = re.search(r'(\d+)\s*kva', l)
        return 'generator_%s' % m.group(1) if m else 'generator_unknown'
    if 'trailer' in l and 'kva' in l:
        return 'generator_%s' % re.search(r'(\d+)', l).group(1)
    table = {
        'building 6m': 'building_6', 'building 4.8m': 'building_4.8', 'building 12m': 'building_12',
        'building 9.6m': 'building_9.6', 'building 3.6m': 'building_3.6',
        'ticket box 6m': 'ticket_box', 'ticket box 4.8m': 'ticket_box',
        'toilet block 6m': 'toilet_block_6m', '16pan block': 'toilet_block_16pan',
        'accessible toilet': 'accessible_toilet', 'fwf': 'fwf', 'pee panel': 'pee_panel',
        'waste tank': 'waste_tank', 'fwf trailer': 'fwf_trailer', 'light tower': 'light_tower',
        'tl2': 'water_barrier_tl2', 'trakmat': 'trakmat', 'vms': 'vms_board',
        '3.0m cont': 'container_3m', '6.0m refrigerator cont': 'refrigerated_container',
        'event container': 'other', 'fridge lge': 'furniture', 'fridge': 'furniture', 'pad chair': 'furniture',
    }
    if l in table:
        return table[l]
    if 'forklift' in l:
        return 'forklift'
    return 'other'

COMP_KIND = {  # v9.15 component kind -> normalised types it can stand for
    'toilet': {'fwf'}, 'accessible_toilet': {'accessible_toilet'}, 'pee_panel': {'pee_panel'},
    'toilet_block': {'toilet_block_6m', 'toilet_block_16pan'},
    'generator': None,  # any generator_*
    'building': {'building_6', 'building_4.8', 'building_12', 'building_9.6', 'building_3.6', 'ticket_box'},
}
def comp_fits(kind, t):
    if kind == 'generator':
        return t.startswith('generator_')
    return t in COMP_KIND.get(kind, set())

# ---------- owners ----------
subhire = {v['_k']: v['co'] for v in R['subhire'].values()}
ep_refs = set()
for ld in EP['loads']:
    for st in ld['stops']:
        for dr in st['drops']:
            if dr.get('ref'):
                ep_refs.add(dr['ref'])
            if dr.get('task_ref'):
                ep_refs.add(dr['task_ref'])
ep_on_site = {x['ref']: x for x in EP['on_site']['event_portables_fwf'] if x.get('ref')}
coates_fwf = {x['ref']: x for x in EP['on_site']['coates_fwf'] if x.get('ref')}

# ---------- record numbers ----------
rec_nums = {v['_k']: v['v'] for v in R['assetNumbers'].values()}
rec_units = {v['_k']: v['units'] for v in R['units'].values()}
rec_supplied = {v['_k']: v for v in R['supplied'].values()}

rows, excluded, refs_seen = [], [], []

def peak_qty(events, item):
    """peak count on the ground for one item, from place/remove rows in date order"""
    ev = sorted([e for e in events if e.get('item') == item], key=lambda e: (e.get('date') or '', e.get('task_id')))
    cur = peak = 0
    blank = False
    rows_used = []
    for e in ev:
        q = e.get('quantity_raw')
        if q is None:
            q = 1; blank = True
        if e.get('movement') == 'remove':
            cur -= q
        else:
            cur += q; rows_used.append(e['task_id'])
        peak = max(peak, cur)
    return peak, blank, rows_used, [e['task_id'] for e in ev]

def add_units(ref, item, typ, qty, base):
    for i in range(1, qty + 1):
        r = dict(base); r.update(ref=ref, item_as_written=item, type=typ, unit_index=i, qty_for_item=qty)
        rows.append(r)

# ---------- 1. every DATA reference ----------
for a in D['assets']:
    ref = a['key']; refs_seen.append(ref)
    items = []
    for it in a['item_types']:
        q, blank, used, allrows = peak_qty(a['events'], it)
        if q == 0 and not a['events']:
            q = 1; blank = True  # LT01-04, LTC: no schedule row; one tower per drawing callout
        items.append((it, q, blank, allrows))
    for it, q, blank, allrows in items:
        typ = norm(it)
        base = dict(ref_kind='GC500 reference', ref_name=a.get('name'), ref_state=state.get(ref, 'active'),
                    schedule_rows=allrows,
                    qty_basis=('blank on the schedule; one unit per reference' if blank and a['events'] else
                               ('no schedule row; one unit per drawing callout (%s)' % (a.get('schedule_state') or '')[:90] if not a['events'] else
                                'peak on the ground from the schedule place/remove rows')),
                    sources=[SRC_PAGE])
        if typ == 'furniture':
            excluded.append(dict(ref=ref, item=it, qty=q, why='furniture delivered into a building (not placed outside); the building itself is the shaped item',
                                 sources=[SRC_PAGE]))
            continue
        if typ == 'water_barrier_tl2':
            r = dict(base); r.update(ref=ref, item_as_written=it, type=typ, unit_index=None, qty_for_item=q,
                                    pieces=q, unit_kind='run (one row per barrier reference; pieces counted)')
            rows.append(r); continue
        if typ == 'trakmat':
            r = dict(base); r.update(ref=ref, item_as_written=it, type=typ, unit_index=None, qty_for_item=q, pieces=q,
                                    unit_kind='pieces'); rows.append(r); continue
        add_units(ref, it, typ, q, base)

# record-supplied items not on the schedule lines (WC60 waste tanks)
for ref, s in rec_supplied.items():
    for it in s.get('items', []):
        if (it.get('supplied') or it.get('asked')) == 'Waste tank':
            have = sum(1 for r in rows if r['ref'] == ref and r['type'] == 'waste_tank')
            extra = (it.get('qty_supplied') or 0) - have
            if extra > 0:
                add_units(ref, 'Waste tank', 'waste_tank', extra, dict(ref_kind='GC500 reference', ref_state=state.get(ref, 'active'),
                          schedule_rows=[], qty_basis='record "supplied": %d waste tanks (not on the schedule lines)' % it['qty_supplied'],
                          sources=[SRC_REC + ' supplied/' + ref]))

# ---------- 2. added references on the record ----------
for k, a in R['added'].items():
    ref = a['key']; refs_seen.append(ref)
    it = a['item_types'][0]
    q = 5 if a['source_row'] == 'T0002' else 1
    add_units(ref, it, norm(it), q, dict(ref_kind='added on the record (from schedule row %s)' % a['source_row'],
              ref_state='active', schedule_rows=[a['source_row']], qty_basis='schedule row %s quantity' % a['source_row'],
              sources=[SRC_REC + ' added/' + ref, SRC_PAGE + ' unreferenced ' + a['source_row']],
              ref_name=', '.join(a.get('locations') or [])))

# ---------- 3. schedule rows with no GC500 reference ----------
covered = {'T0002', 'T0003', 'T0004'}  # are NVLT, FL01, FL02
skip_reason = {}
for o in D['unreferenced']:
    t = o['task_id']
    if t in covered:
        continue
    prod = (o.get('product') or '')
    item = o.get('item')
    if prod in ('Fencing', 'Passes') or item is None:
        skip_reason[t] = 'not a placed unit (%s)' % (prod or 'no item'); continue
    if o.get('phase') == 'Demob' and t in ('T0222', 'T0223', 'T0224', 'T0227', 'T0228', 'T0229'):
        skip_reason[t] = 'demob removal of a unit already listed (T0021/T0022/T0023/FL01/FL02/T0005)'; continue
    if t == 'T0159':
        skip_reason[t] = 'VMS "Relocate" row: moves boards already listed, adds none'; continue
    typ = norm(item)
    q = o.get('quantity_display'); q = int(q) if str(q).isdigit() else 1
    if t not in refs_seen:
        refs_seen.append(t)
    st = state.get(t, 'active')
    if t == 'T0019':
        st = notes.get('row/T0019', st).split('\n')[0]
    base = dict(ref_kind='schedule row (no GC500 reference)', ref_name=o.get('location'), ref_state=st,
                schedule_rows=[t], qty_basis='schedule row quantity', sources=[SRC_PAGE + ' unreferenced ' + t])
    if typ == 'furniture':
        excluded.append(dict(ref=t, item=item, qty=q, why='fridges ("OP42 Fridge"); where they stand (inside or outside) is not said - excluded, to confirm', sources=[SRC_PAGE]))
        continue
    if typ == 'trakmat':
        r = dict(base); r.update(ref=t, item_as_written=item, type=typ, unit_index=None, qty_for_item=q, pieces=q, unit_kind='pieces')
        sup = rec_supplied.get(t)
        if sup:
            r['qty_basis'] += '; record supplied %s' % sup['items'][0]['qty_supplied']
        rows.append(r); continue
    add_units(t, item, typ, q, base)

# ---------- record units that are physical items not on schedule lines ----------
for ref, us in rec_units.items():
    for u in us:
        if u['label'].lower().startswith('distribution board'):
            add_units(ref, u['label'], 'distribution_board', 1, dict(ref_kind='GC500 reference', ref_state=state.get(ref, 'active'),
                      schedule_rows=[], qty_basis='record units/%s' % ref, sources=[SRC_REC + ' units/' + ref]))
            rows[-1]['asset_or_supplier_no'] = u['asset_no']; rows[-1]['owner'] = 'Coates'; rows[-1]['owner_basis'] = 'Coates asset number on the record'

# ---------- owners and numbers ----------
def is_coates_no(n):
    return bool(re.fullmatch(r'\d{6,8}', str(n)))

for r in rows:
    ref = r['ref']; t = r['type']
    if r.get('owner'):
        continue
    nums_ref = list(dict.fromkeys((rec_nums.get(ref) or [])))
    r['ref_numbers'] = nums_ref
    if ref in subhire:
        r['owner'] = subhire[ref]; r['owner_basis'] = 'record sub-hire/' + ref
    elif ref in ep_refs and t in ('fwf', 'pee_panel'):
        r['owner'] = 'Event Portables'; r['owner_basis'] = SRC_EP + ' (load plan)'
    elif ref == 'WC31' and t == 'toilet_block_16pan':
        r['owner'] = 'Event Portables' if r['unit_index'] == 1 else 'unknown'
        r['owner_basis'] = ('record units/WC31 "Sub-hire: Event Portables" no. 12; EP quote lists one 16-pan block' if r['unit_index'] == 1
                            else 'the schedule asks for a second 16-pan block; the Event Portables quote lists one (EP plan v10 wc31_note)')
    elif ref in ('PG01', 'PG03', 'PG05', 'PG29', 'T0162', 'T0176', 'T0089', 'WC85'):
        r['owner'] = 'Event Portables'; r['owner_basis'] = SRC_EP
    elif t == 'vms_board':
        if ref == 'T0001':
            r['owner'] = 'Coates'; r['owner_basis'] = 'record units/T0001 (Coates asset numbers); 1211404 moved to T0103 as VMS09 (v9.13 README, the project manager 8 Oct)'
        elif ref == 'T0103':
            r['owner'] = 'Coates' if r['unit_index'] == 1 else 'PremAir Hire'
            r['owner_basis'] = 'v9.13 README: VMS09 = Coates 1211404, VMS10 = PremAir Hire 120T rego V14221 (the project manager, 8 Oct)'
        else:
            r['owner'] = 'unknown'; r['owner_basis'] = 'v9.13 register: contract 9961265 VMS lines name Coates, Premiair or RPM; boards not yet linked to this row'
    elif r['ref_state'] != 'active' and not nums_ref:
        r['owner'] = 'unknown'; r['owner_basis'] = 'cancelled/deleted; no unit numbers'
    elif any(is_coates_no(n) for n in nums_ref) or (ref in coates_fwf):
        r['owner'] = 'Coates'; r['owner_basis'] = 'Coates asset numbers on the record' + (' / EP plan coates_fwf' if ref in coates_fwf else '')
    else:
        r['owner'] = 'Coates'; r['owner_basis'] = 'Coates schedule line; no sub-hire on the record (asset number not given)'

# per-unit numbers where the source pairs them to the unit
def setno(ref, typ, idx, no, basis):
    for r in rows:
        if r['ref'] == ref and r['type'] == typ and r['unit_index'] == idx:
            r['asset_or_supplier_no'] = no; r['number_basis'] = basis

data_assets = {a['key']: a for a in D['assets']}
for r in rows:
    r.setdefault('asset_or_supplier_no', None); r.setdefault('number_basis', None)
for ref, us in rec_units.items():
    sub = [u for u in us if u['label'].startswith('Sub-hire')]
    for i, u in enumerate(sub, 1):
        t = 'toilet_block_16pan' if ref == 'WC31' else 'fwf'
        setno(ref, t, i, u['asset_no'], 'record units/%s, in recorded order (which drawn symbol carries it is not known)' % ref)
    if ref == 'T0001':
        for i, u in enumerate(us, 1):
            setno(ref, 'vms_board', i, u['asset_no'], 'record units/T0001 %s (D025 callout %s)' % (u['label'], u.get('callout')))
# T0001 has 8 on the record; 1211404 is VMS09 on T0103 per v9.13 (record not yet changed)
setno('T0103', 'vms_board', 1, '1211404 (VMS09)', 'v9.13 README: the project manager, 8 Oct; the record still lists it on T0001')
setno('T0103', 'vms_board', 2, '120T (VMS10, rego V14221)', 'v9.13 README: the project manager, 8 Oct')
setno('WC05', 'toilet_block_6m', 1, '1097377', 'record units/WC05')
setno('WC05', 'waste_tank', 1, '1328978', 'record units/WC05')
setno('WC20', 'toilet_block_6m', 1, '1311341', 'record units/WC20 "Set 1 (waste tank 1327228)"')
setno('WC20', 'toilet_block_6m', 2, '1327225', 'record units/WC20 "Set 2 (waste tank 1328982)"')
setno('WC20', 'waste_tank', 1, '1327228', 'record units/WC20 "Set 1 (toilet 1311341)"')
setno('WC20', 'waste_tank', 2, '1328982', 'record units/WC20 "Set 2 (toilet 1327225)"')
setno('WC60', 'toilet_block_6m', 1, '1119489', 'record supplied/WC60 nums (order as recorded)')
setno('WC60', 'toilet_block_6m', 2, '1087500', 'record supplied/WC60 nums (order as recorded)')
setno('WC60', 'waste_tank', 1, '1328980', 'record supplied/WC60 nums (order as recorded; tank-to-block pairing not recorded)')
setno('WC60', 'waste_tank', 2, '1328981', 'record supplied/WC60 nums (order as recorded; tank-to-block pairing not recorded)')
setno('WC27', 'toilet_block_6m', 1, '1119484', 'schedule asset number (DATA)')
setno('WC27', 'waste_tank', 1, '1328979', 'record assetNumbers/WC27; EP plan v10 lists 1328979 as WC27 waste tank')
setno('WC86', 'accessible_toilet', 1, '1296899', 'record assetNumbers/WC86')
setno('WC01', 'accessible_toilet', 1, '1317644', 'EP plan v10 non_fwf_toilet_items (from the record)')
setno('WC01', 'fwf', 1, '1211958', 'EP plan v10 coates_fwf'); setno('WC01', 'fwf', 2, '1211967', 'EP plan v10 coates_fwf')
setno('WC31', 'accessible_toilet', 1, '1317645', 'the project manager, 8 Oct (v9.13 README); not on the record')
setno('T0243', 'toilet_block_6m', 1, '1311144', 'schedule row / record dropPhotos unit 1311144')
setno('WC100', 'fwf_trailer', 1, '1288823 (at The Spit)', 'record locations/WC100'); setno('WC100', 'fwf_trailer', 2, '1248439 (at S18)', 'record locations/WC100')
setno('T0005', 'forklift', 1, '1247787', 'schedule row'); setno('T0005', 'forklift', 2, '1312577', 'schedule row')
setno('T0085', 'forklift', 1, '1272166', 'record assetNumbers/T0085 (page rows also show 1262224)')
setno('T0023', 'other', 1, '1257261', 'record assetNumbers/T0023')
setno('GN?', 'generator_200', 1, '1316182', 'schedule row T0260 (order as written)'); setno('GN?', 'generator_200', 2, '1316183', 'schedule row T0260 (order as written)')
for ref in ['WC07', 'WC11', 'WC12', 'WC21', 'WC02', 'WC04', 'WC06', 'WC50']:
    nums = (coates_fwf.get(ref) or {}).get('numbers') or rec_nums.get(ref) or []
    for i, n in enumerate(nums, 1):
        setno(ref, 'fwf', i, n, 'EP plan v10 coates_fwf / record assetNumbers (order as recorded; which drawn symbol is not known)')
nv = {'NVLT': ['1264929', '1314284', '1264899', '1188888', '1249499']}
for i, n in enumerate(nv['NVLT'], 1):
    setno('NVLT', 'light_tower', i, n, 'schedule row T0002 asset numbers (the record entry holds 1264929)')
for r in rows:
    if r['asset_or_supplier_no'] is None and r.get('unit_index') == 1 and r.get('qty_for_item') == 1:
        a = data_assets.get(r['ref'])
        if a and len(a.get('asset_numbers') or []) == 1 and r['type'] not in ('waste_tank',):
            r['asset_or_supplier_no'] = a['asset_numbers'][0]; r['number_basis'] = 'schedule asset number (DATA)'
        elif r['ref'] in rec_supplied and rec_supplied[r['ref']].get('asset_numbers'):
            r['asset_or_supplier_no'] = rec_supplied[r['ref']]['asset_numbers'][0]; r['number_basis'] = 'record supplied/' + r['ref']

# P21 / P19 type corrections from record and schedule notes
for r in rows:
    if r['ref'] == 'P21' and r['type'] == 'building_4.8':
        r['type'] = 'building_6'; r['type_basis'] = 'record supplied/P21: asked Building 4.8m, supplied Building 6m'
    if r['ref'] == 'P19' and r['type'] == 'building_4.8':
        r['type'] = 'building_6'; r['type_basis'] = 'schedule row T0030 note "now 6m building"'
    if r['ref'] == 'WC31' and r['type'] == 'toilet_block_16pan':
        r['record_note'] = 'record supplied/WC31: 16Pan Block qty_supplied 1, Accessible Toilet qty_supplied 0'
    if r['ref'] == 'WC31' and r['type'] == 'accessible_toilet':
        r['record_note'] = 'record supplied/WC31: Accessible Toilet qty_supplied 0 (the project manager gave asset 1317645 on 8 Oct)'

# T0001: 1211404 is VMS09 on T0103 (the project manager, 8 Oct, v9.13 README); keep it once
for r in list(rows):
    if r['ref'] == 'T0001' and r['type'] == 'vms_board' and str(r.get('asset_or_supplier_no')) == '1211404':
        rows.remove(r)
        excluded.append(dict(ref='T0001', item='VMS', qty=1, why='board 1211404 is VMS09 on T0103 by the project manager (8 Oct, v9.13 README); listed once there. The record still lists it on T0001 (vms5).', sources=[SRC_REC + ' units/T0001', 'v9.13 README']))
n = 0
for r in rows:
    if r['ref'] == 'T0001' and r['type'] == 'vms_board':
        n += 1; r['unit_index'] = n; r['qty_for_item'] = 7
        r['qty_basis'] = 'schedule row says 8; 7 Coates boards after 1211404 moved to T0103 (v9.13 README)'
for r in rows:
    if r['type'] == 'accessible_toilet' and r['ref'] in ('WC31', 'WC51'):
        r['owner'] = 'unknown'
        r['owner_basis'] = 'schedule line; the Event Portables quote has 4 accessible toilets with no WC allocation (EP plan v10) and no sub-hire is recorded for this unit'
    if r['ref'] == 'WC67' and r['type'] == 'fwf' and r['unit_index'] in (3, 4):
        r['note'] = 'second schedule row T0262 (Event Portables load plan); the master draws 2 at WC67 and 4 under a separate WC-BSF tag beside it - not proven to be these'
    if r['ref'] in ('LT01', 'LT02', 'LT03', 'LT04'):
        r['possible_duplicate_of'] = 'NVLT (schedule row T0002: 5 light towers delivered to Molendinar) - the same storage-yard towers may be counted twice; to confirm'
    if r['ref'] == 'NVLT':
        r['possible_duplicate_of'] = 'LT01-LT04 (D024 storage-yard key, Molendinar)'
    if r['ref'] == 'P53':
        r['note'] = 'cancelled on the record 29 Sep (customer cancelled) but the 2 Oct master still draws it'
    if r['ref'] == 'WC09' and r['type'] == 'fwf':
        r['note'] = 'schedule 4 FWF; Event Portables: 6 of 10 cancelled, 4 on Load 1 (EP plan v10)'
    if r['ref'] in ('GN20',):
        r['note'] = 'schedule note "SOON TO BE GN20 & GN22"; T0019 (200 kVA, was GN22) taken off its day 14 Sep - one 350 kVA set'

# ---------- match against v9.15 ----------
def comp_brief(ref, ci, c):
    return dict(ref=ref, index=ci, kind=c['kind'], label=c['label'], size_m=c['size_m'], angle_deg=c['angle_deg'],
                centroid=c['centroid'], door=bool(c.get('door')) , doors=len(c.get('doors') or []), inset=c.get('inset'))

by_ref = collections.defaultdict(list)
for r in rows:
    by_ref[r['ref']].append(r)
surplus = []
for ref, rs in by_ref.items():
    sh = (SH.get(ref) or {}).get('shape')
    comps = list(enumerate(sh['components'])) if sh else []
    shared_block = ref in ('P26', 'P27', 'P28', 'P29', 'P34')
    used = set()
    for r in sorted(rs, key=lambda r: (r['type'], r['unit_index'] or 0)):
        r['v915'] = None
        if r['type'] in ('water_barrier_tl2', 'trakmat', 'waste_tank'):
            continue
        for ci, c in comps:
            if ci in used:
                continue
            if comp_fits(c['kind'], r['type']):
                used.add(ci); r['v915'] = comp_brief(ref, ci, c)
                if shared_block:
                    r['v915']['note'] = 'one of the four 6 m buildings of the P34/24/26/27/28/29 block; which one is this reference is not said on the master'
                break
    for ci, c in comps:
        if ci not in used and not shared_block:
            surplus.append(dict(ref=ref, index=ci, kind=c['kind'], label=c['label'], centroid=c['centroid'],
                                why='v9.15 component with no scheduled unit of that kind at this reference'))

# ---------- status ----------
runs_by_ref = collections.defaultdict(list)
for ru in RUNS:
    if ru['candidate_ref']:
        runs_by_ref[ru['candidate_ref']].append(ru)

MBD = {  # drawn on the master but no v9.15 component (evidence gathered in this pass)
 ('GN13', 'generator_45'): dict(where_frame=[0.52527, 0.19253], where_pdf_pt=[1226.9, 324.2], pdf_drawing=162244,
     evidence='orange generator symbol on the 2 Oct master (drawing 162244); the pins release in flight moves GN13 here ("follow the master", the project manager)', confidence='high'),
 ('GN18', 'generator_50'): dict(where_frame=[0.21036, 0.68031], where_pdf_pt=[476.2, 1145.7], pdf_drawing=162600,
     evidence='orange generator symbol on the 2 Oct master (drawing 162600); the pins release in flight moves GN18 here', confidence='high'),
 ('T0266', 'refrigerated_container'): dict(where_pdf_pt=[110.6, 1191.5], where_frame=[round((110.6 + 25.5) / 2384, 5), round((1191.5 + 0.12) / 1684, 5)], pdf_drawing=162647,
     evidence='untagged 6.1 x 2.4 m container outline at Helen Park beside P55/P56 (the schedule row says Helen Park); not proven to be this unit', confidence='low'),
}
for r in rows:
    ref, t = r['ref'], r['type']
    r['where'] = None
    if r.get('v915'):
        r['status'] = 'TRACED'
    elif t == 'waste_tank':
        blocks = [x for x in by_ref[ref] if x['type'] in ('toilet_block_6m',)]
        pair = None
        if ref == 'WC20':
            pair = {1: 1, 2: 2}[r['unit_index']]
        elif len(blocks) == 1:
            pair = 1
        blk = next((b for b in blocks if b['unit_index'] == pair), None) if pair else None
        r['status'] = 'NOT_ON_MASTER'
        r['under_block'] = dict(block_unit_index=pair, block_asset=(blk or {}).get('asset_or_supplier_no'),
                                block_v915_component=(blk or {}).get('v915', {}) and (blk or {}).get('v915', {}).get('index'),
                                footprint='same as the block it serves: %s m (v9.15 traced block)' % ((blk or {}).get('v915') or {}).get('size_m') if blk and blk.get('v915') else 'same as its block (pairing to confirm)',
                                pairing_basis=('record units/WC20 set labels' if ref == 'WC20' else 'the only block at this reference' if pair == 1 and len(blocks) == 1 else 'tank-to-block pairing not recorded - to confirm'),
                                source='the project manager: same shape as the toilet block, under it (9 Oct ~00:15-00:20); the master does not draw tanks, as expected')
        if ref == 'WC20':
            r['under_block']['note'] = 'which of the two traced WC20 blocks (v9.15 component 0 "tag inside it", component 1 "3.0 x 6.0 m") is set 1 and which is set 2 is not recorded - to confirm'
    elif t == 'water_barrier_tl2':
        cand = runs_by_ref.get(ref)
        if cand and r['ref_state'] == 'active':
            r['status'] = 'MISSING_BUT_DRAWN'
            r['where'] = [dict(run=c['run'], confidence=c['confidence'], where=c['where'], pieces_drawn=c['pieces_drawn'], length_m=c['length_m'],
                               piece_len_m_drawn=c['piece_len_m_drawn'], centroid_frame=c['centroid_frame']) for c in cand]
            r['pieces_drawn_total'] = sum(c['pieces_drawn'] for c in cand)
        else:
            r['status'] = 'NOT_ON_MASTER'
    elif (ref, t) in MBD:
        r['status'] = 'MISSING_BUT_DRAWN'; r['where'] = MBD[(ref, t)]
    else:
        r['status'] = 'NOT_ON_MASTER'

# WC59 / WC57 tag-swap candidate
for r in rows:
    if r['ref'] == 'WC59' and r['type'] == 'fwf' and not r.get('v915'):
        r['status'] = 'MISSING_BUT_DRAWN'
        r['where'] = dict(evidence='the master draws 7 FWF under the WC57 tag (v9.15 gave all 7 to WC57) and 2 at WC59; the schedule and record give WC57 2 and WC59 7 (7 Event Portables numbers) - the tags or the schedule are swapped; to confirm',
                          v915_components_under_wc57_tag=[0, 1, 2, 3, 4, 5, 6], confidence='medium')

# reasons for the rest
WHY = {
 'light_tower': 'no light-tower symbol in the master legend; positions only on D024 (callout arrow tips) or the Molendinar storage yard',
 'vms_board': 'VMS boards are not drawn on the master (no legend entry); positions are on VMS001-26003-01 and D025',
 'forklift': 'mobile plant; not drawn on the master',
 'trakmat': 'trakmats are not drawn on the master (no legend entry)',
 'fwf_trailer': 'on no drawing (FWF trailers at The Spit and S18)',
 'distribution_board': 'not drawn on the master (no legend entry)',
}
for r in rows:
    if r['status'] == 'NOT_ON_MASTER' and not r.get('why_not'):
        t = r['type']
        if r['ref_state'] != 'active':
            r['why_not'] = 'cancelled/deleted: ' + r['ref_state']
        elif t in WHY:
            r['why_not'] = WHY[t]
        elif t == 'waste_tank':
            r['why_not'] = 'waste tanks sit under their toilet block; the master does not draw them (expected, not a gap)'
        elif t == 'water_barrier_tl2':
            r['why_not'] = 'no white-and-yellow barrier run drawn at this place on the 2 Oct master (or the run is outside the master''s dates)'
        else:
            sh = SH.get(r['ref'])
            r['why_not'] = (sh or {}).get('reason') or 'no symbol or tag for this unit on the master'
    # size source
    if r.get('v915'):
        r['size_source'] = '%s: master drawing, traced outline %s m' % (SRC_V915, r['v915']['size_m'])
    elif r['type'] == 'waste_tank':
        r['size_source'] = 'the project manager: same shape as the toilet block, under it'
    elif r['type'] == 'water_barrier_tl2' and r.get('where'):
        r['size_source'] = 'master drawing: white-and-yellow barrier pieces, %.2f m each as drawn (1:2000); TL2 piece length from a product source: size to confirm' % r['where'][0]['piece_len_m_drawn']
    elif r['status'] == 'MISSING_BUT_DRAWN' and isinstance(r.get('where'), dict) and r['where'].get('pdf_drawing'):
        r['size_source'] = 'master drawing %s (to be traced)' % r['where']['pdf_drawing']
    else:
        r['size_source'] = 'size to confirm'
    # MASTER_LOC pin for context
    if r['ref'] in ML and ML[r['ref']].get('pt'):
        r['master_loc_pt'] = ML[r['ref']]['pt']

# ---------- final caveats ----------
for r in rows:
    if r['type'] == 'waste_tank':
        ub = r['under_block']
        if not isinstance(ub.get('block_v915_component'), int):
            ub['block_v915_component'] = None
        if r['ref'] == 'WC60':
            bs = [b for b in rows if b['ref'] == 'WC60' and b['type'] == 'toilet_block_6m' and b.get('v915')]
            ub['footprint'] = 'same as the block it serves; both WC60 blocks trace %s m (v9.15 components %s), so the footprint is the same whichever block' % (' and '.join(str(b['v915']['size_m']) for b in bs), [b['v915']['index'] for b in bs])
            ub['block_v915_components_candidates'] = [b['v915']['index'] for b in bs]
        if r['ref'] == 'WC20':
            ub['block_v915_component'] = None
            ub['block_v915_components_candidates'] = [0, 1]
    if r.get('v915') and r.get('asset_or_supplier_no') and (r.get('qty_for_item') or 1) > 1:
        r['number_to_component'] = 'not known: numbers are listed in recorded order; which traced symbol carries which number is not on any source'
    if r['type'] == 'light_tower' and (r['ref'].startswith('LTC') or r['ref'] in ('LT01', 'LT02', 'LT03', 'LT04')):
        r['owner'] = 'unknown'; r['owner_basis'] = 'drawing callout only (D024); no schedule row and no asset number'
    if r['ref'] == 'T0158':
        r['note'] = 'page rows disagree: 8 boards (orphan_rows) vs 9 (unreferenced); 9 used'
    if r['ref'] == 'T0169':
        r['note'] = 'page rows disagree: 1 board (orphan_rows) vs 2 (unreferenced); 2 used'
    if r['ref'] == 'T0024':
        r['owner_basis'] = 'schedule note: Coates\' own compound toilet'

# extra GN symbols and untagged drawn units on the master (no scheduled unit)
drawn_unmatched = [
 dict(kind='generator symbol', pdf_drawings=[161944, 161947, 161952, 162084, 170370, 188571, 188675, 188693, 189694],
      note='orange generator-shaped symbols (5-stroke box + diagonal) on the 2 Oct master with no reference; candidates for GN? (Concert 200 kVA x2), GN25, the spare 100 kVA trailer (T0268) or another party - to confirm by the dark triangle mark and D024'),
 dict(kind='FWF symbols', where='WC-BSF tag (4) at pdf ~(131-136, 1134-1138), WC18 tag (1) at (195.5, 624.4), untagged pair at Helen Park (122, 1185), singles at (412, 824), (610.5, 927.3), (485.1, 943.7)',
      pdf_drawings=[119323, 122593, 122603, 122613, 121709, 119253, 120686, 118060, 119313, 141725],
      note='WC-BSF and WC18 are not references on the schedule; the others carry no tag'),
 dict(kind='water barrier runs', runs=[ru['run'] for ru in RUNS if not ru['candidate_ref']],
      note='white-and-yellow runs drawn on the master that no schedule WB reference was matched to (side-street closures on the GC Hwy, Helen Park/G1, T10 kerb, singles). DATA.barriers: iEDM table rows WB08-WB12 and "ADD TO FMS" (12 at Main Beach Light Rail bus stop) are on no Coates schedule row'),
]

out = dict(
    author='Andrew Fisher', built='9 Oct 2026', what='every physical unit on the ground at each reference, matched to v9.15 master shapes',
    sources=dict(page=SRC_PAGE, record=SRC_REC, v915=SRC_V915, master=SRC_MASTER, ep_plan=SRC_EP,
                 vms='v9.13_vms_rego_DRAFT/README.md (the project manager, 8 Oct)', barriers='DATA.barriers (K220-K231 zone reading, iEDM TP02 partial)'),
    rules=dict(statuses={'TRACED': 'a v9.15 component of the right kind is assigned to the unit (in component order)',
                         'MISSING_BUT_DRAWN': 'the 2 Oct master draws it but v9.15 has no component; where gives the drawn place',
                         'NOT_ON_MASTER': 'not drawn on the 2 Oct master (why_not)'},
               barriers='one row per barrier reference with pieces; the drawn runs are in wfb_runs.json',
               waste_tanks='status NOT_ON_MASTER by design; under_block gives the block it sits under and the footprint rule'),
    units=rows, wfb_runs=RUNS, v915_surplus_components=surplus, drawn_on_master_unmatched=drawn_unmatched,
    excluded=excluded, schedule_rows_skipped=skip_reason)
json.dump(out, open(SC + 'inventory.json', 'w'), indent=1, ensure_ascii=False)
print(len(rows), 'rows')
c = collections.Counter((r['type'], r['status']) for r in rows)
for k, v in sorted(c.items()): print(k, v)
print('surplus', [(s['ref'], s['kind']) for s in surplus])

# ---------- scrub people's names (author line kept) ----------
import re as _re
txt = json.dumps(out, indent=1, ensure_ascii=False)
txt = txt.replace('"author": "Andrew Fisher"', '"author": "@@AUTH@@"')
txt = _re.sub(r'Andrew Fisher(?: \(?via (?:Codex|Claude)\)?)?', 'the project manager', txt)
txt = _re.sub(r'andrew fisher', 'the project manager', txt, flags=_re.I)
txt = txt.replace('"@@AUTH@@"', '"Andrew Fisher"')
open(SC + 'inventory.json', 'w').write(txt)
