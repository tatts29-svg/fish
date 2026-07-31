# ==========================================================================
#  COATES | BUILD MY GEAR - "My Shutdown Story" scorecard builder
#  Cement Australia K2 Shutdown 2026 - Gladstone
#
#  Builds Gear_Lookup\index.html - the QR-at-the-window page where crew
#  enter their ID and see their complete shutdown scorecard:
#    - gear on hire now (with age + category colours)
#    - Returns Score (driven by ACTUAL same-day returns, transactions truth)
#    - store scorecard: visits, transactions, consumables, radios,
#      gas monitors, client gear, damage charges
#  Every number comes from the SiteIQ exports sitting next to this script:
#    ON_HIRE*.xlsx       (current on-hire; carries EXTERNAL_ID = card ID)
#    TRANSACTIONS*.xlsx  (transaction history; returns, damages, radios)
#  Nothing is invented: if an export has no damage rows, cards say so.
#
#  Run: 04_RUN_MY_GEAR.bat  (or: python BUILD_MY_GEAR.py)
#  Then serve with 05_START_GEAR_LOOKUP.bat as usual.
#
#  25 Jul 2026 - COMPLIANCE BADGES ON EVERY LINE (A. Fisher)
#  Each gear line now carries its own compliance requirement under the
#  description - tag colour, pre-start and logbook, back-daily - straight
#  off K2_MASTER_EQUIPMENT_PRICING.xlsx via equipment_compliance.py. The
#  reason is simple: the bloke reading his card at the window should not
#  have to guess whether the thing in his hand needs a current tag or a
#  logbook entry. It kills the "nobody told me" excuse and it lets the
#  Coates team check gear over before it goes back out. Nothing is
#  guessed here - no flag in the master means nothing shows on the card.
#  A short summary line sits under the person's gear list as well, so the
#  obligation reads as one job, not a scatter of little chips.
#
#  Author: Andrew Fisher | POWERED BY SITEIQ
# ==========================================================================
import base64, glob, html, io, json, os, re, sys
import datetime as dt
import master_equipment
# The site guides (contact board, radio, gas monitor) and the
# phone-first bits: save-to-phone, scan-your-card, ?id= links.
import mygear_guides
import mygear_ui
import equipment_compliance as EC
# K2_MASTER_EQUIPMENT_PRICING.xlsx - item-number-keyed display names
# (renames) applied wherever gear is shown; empty-safe without the file.
#  Replacement costs on the printed A4 (Andrew, 26 Jul 2026: the elite
#  per-person document carries every bit of information we have) - same
#  matching engine as every company report, so the numbers can never
#  disagree between a person's page and their company's pack.
import build_company_onhire_report as _BC
MASTER = master_equipment.load(os.path.dirname(os.path.abspath(__file__)),
                               quiet=True)
# Point the compliance engine at the same master - one file drives the
# names, the costs and the compliance flags, so a fix in the spreadsheet
# fixes every report on the next run. Safe with no master: no badges.
EC.bind(MASTER)
try:
    _REPL, _repl_path = _BC.load_replacement()
except Exception:
    _REPL = {}


def _repl_cost(asset, desc):
    c = MASTER.price(asset)
    if c is None and _REPL:
        c = _REPL.get(str(desc or "").upper())
    return c

BASE = os.path.dirname(os.path.abspath(__file__))

# --------------------------- crypto (matches the page JS exactly) ---------
M32 = 0xFFFFFFFF
def _imul(a, b): return (a * b) & M32
def _xmur3(s):
    h = (1779033703 ^ len(s)) & M32
    for ch in s:
        h = _imul(h ^ ord(ch), 3432918353)
        h = ((h << 13) | (h >> 19)) & M32
    def call():
        nonlocal h
        h = _imul(h ^ (h >> 16), 2246822507)
        h = _imul(h ^ (h >> 13), 3266489909)
        h ^= h >> 16
        return h & M32
    return call
def _mulberry32(a):
    a &= M32
    def call():
        nonlocal a
        a = (a + 0x6D2B79F5) & M32
        t = _imul(a ^ (a >> 15), (a | 1) & M32)
        t = ((t + _imul(t ^ (t >> 7), (t | 61) & M32)) & M32) ^ t
        t &= M32
        return (t ^ (t >> 14)) & M32
    return call
def lk_tag(idno): return format(_xmur3(idno + '|CoatesK2tag2026')(), 'x')
def lk_enc(idno, s):
    r = _mulberry32(_xmur3(idno + '|CoatesK2gear2026')())
    return base64.b64encode(bytes((ord(c) ^ (r() >> 24)) & 0xFF for c in s)).decode()

# --------------------------- helpers --------------------------------------
def die(msg):
    print('PROBLEM: ' + msg)
    sys.exit(1)

def find_export(pattern, what, required=True):
    """Newest match wins - handles both the short kit names (ON_HIRE.xlsx)
    and the raw SiteIQ names (ON_HIRE_23_07_2026 08_50 AM 1.xlsx)."""
    _cand = (glob.glob(os.path.join(BASE, 'Data_SiteIQ', pattern))
             + glob.glob(os.path.join(BASE, pattern)))
    hits = sorted(_cand,
                  key=os.path.getmtime, reverse=True)
    if not hits:
        if required:
            die('No ' + what + ' export found. Pull it from SiteIQ, drop it in '
                'this folder (' + pattern + ') and run again.')
        print('  NOTE: no ' + what + ' export found (' + pattern + ') - '
              'building without it; descriptions fall back to ON_HIRE\'s.')
        return None
    return hits[0]

def parse_date(v):
    """Australian DD/MM/YYYY only - US parsing makes plausible wrong reports."""
    if v in (None, ''): return None
    if isinstance(v, dt.datetime): return v.date()
    if isinstance(v, dt.date): return v
    s = str(v).strip().split(' ')[0]
    m = re.match(r'^(\d{1,2})/(\d{1,2})/(\d{4})$', s)
    if m: return dt.date(int(m.group(3)), int(m.group(2)), int(m.group(1)))
    return None


def _newest_file(pattern):
    """Newest match, Data_SiteIQ first then the suite folder."""
    import glob
    hits = [q for q in glob.glob(os.path.join(BASE, 'Data_SiteIQ', pattern))
            if not os.path.basename(q).startswith('~')]
    hits += [q for q in glob.glob(os.path.join(BASE, pattern))
             if not os.path.basename(q).startswith('~')]
    return max(hits, key=os.path.getmtime) if hits else None

def norm_name(s):
    # ON_HIRE uses "First - Last", transactions use "First Last"
    return re.sub(r'\s*-\s*', ' ', str(s or '').strip())

def fmt_d(d): return d.strftime('%d %b %Y').lstrip('0') if d else '-'

# --------------------------- categories & colours -------------------------
CAT_COLOURS = {'Electrical': '#FFA24D', 'Rigging': '#F26222',
               'Plant': '#C44C28', 'Tooling': '#8A97A8', 'Radios': '#FFD27A'}
def category(desc):
    d = str(desc or '').lower()
    if re.search(r'radio|battery|batte|antenna', d): return 'Radios'
    if re.search(r'extension lead|distribution board|lighting tower|generator'
                 r'|240v|415v|power lead|rcd|transformer', d): return 'Electrical'
    if re.search(r'chain block|shackle|sling|lever hoist|hoist|rigging', d): return 'Rigging'
    if re.search(r'forklift|skid steer|loader|welder|welding|excavat|telehandler'
                 r'|compressor|boom|scissor|dozer|roller|dumper', d): return 'Plant'
    return 'Tooling'
GAS_RE = re.compile(r'gas monitor|gas detector|gasalert|microclip|altair'
                    r'|quattro|ventis|draeger|drager|x-am|odalog', re.I)
RADIO_RE = re.compile(r'radio|battery|batte|antenna', re.I)

# --------------------------- read ON_HIRE ---------------------------------
def read_onhire(path):
    import openpyxl
    wb = openpyxl.load_workbook(path, read_only=True, data_only=True)
    asof = ''
    if 'REFERENCE_INFO' in wb.sheetnames:
        rows = list(wb['REFERENCE_INFO'].iter_rows(values_only=True))
        if len(rows) > 1:
            hdr = [str(c) for c in rows[0]]
            for k, v in zip(hdr, rows[1]):
                if 'REQUESTED_DATE' in k and v:
                    d = parse_date(v)
                    tm = re.search(r'(\d{1,2}:\d{2})\s*([AP]M)?', str(v))
                    asof = (fmt_d(d) + (' ' + tm.group(0) if tm else '')) if d else str(v)
    ws = wb['ON_HIRE'] if 'ON_HIRE' in wb.sheetnames else wb.active
    rows = list(ws.iter_rows(values_only=True))
    hdr = [str(c) for c in rows[0]]
    ix = {h: i for i, h in enumerate(hdr)}
    #  HIRER_ID rides along so the card can show BOTH scannable numbers -
    #  the card number the crews quote, and SiteIQ's own hirer ID the
    #  store counter uses. (Andrew, 27 Jul 2026.)
    for need in ('EXTERNAL_ID', 'HIRER_NAME', 'COMPANY', 'ITEM_NUMBER',
                 'ITEM_DESCRIPTION', 'START_DATE'):
        if need not in ix:
            die('ON_HIRE export is missing the ' + need + ' column - the page '
                'cannot be built from it. Re-pull the standard ON_HIRE report.')
    people = {}
    for r in rows[1:]:
        if not r or r[ix['EXTERNAL_ID']] in (None, ''): continue
        # the site idle pool ("Site Plant Equipment") is not a person -
        # its barriers/chutes would otherwise become a 300-item "card"
        if norm_name(r[ix['HIRER_NAME']]).lower().startswith('site plant equipment'):
            continue
        idno = str(r[ix['EXTERNAL_ID']]).strip()
        p = people.setdefault(idno, {
            'name': norm_name(r[ix['HIRER_NAME']]),
            'company': str(r[ix['COMPANY']] or '').strip(),
            'hid': (str(r[ix['HIRER_ID']]).strip()
                    if 'HIRER_ID' in ix and r[ix['HIRER_ID']] not in (None, '')
                    else ''),
            'items': []})
        _itm = str(r[ix['ITEM_NUMBER']] or '').strip()
        p['items'].append({
            'item': _itm,
            'barcode': str(r[ix['ITEM_BARCODE']] or '').strip().upper()
                       if 'ITEM_BARCODE' in ix else '',
            'desc': MASTER.disp(_itm, str(r[ix['ITEM_DESCRIPTION']] or '').strip()),
            'start': parse_date(r[ix['START_DATE']])})
    return people, asof

# ------------------- read RENTAL_STOCK / SALES_STOCK ----------------------
# RENTAL_STOCK is the fleet register - the authoritative asset number and
# CURRENT description for every barcode (descriptions get corrected there,
# and everything joins on to replacement costs the same way).
#  item number -> PRODUCT_VARIANT code: the photo key, so a worker's own
#  gear list can show what each item LOOKS like (Andrew, 31 Jul 2026:
#  "next level for people ... to see what it looks like what they have
#  in their name"). Filled by read_rental as it walks the register.
VAR_OF_ITEM = {}


def read_rental(path):
    import openpyxl
    by_bc = {}
    if not path: return by_bc
    wb = openpyxl.load_workbook(path, read_only=True, data_only=True)
    ws = wb['RENTAL_STOCK'] if 'RENTAL_STOCK' in wb.sheetnames else wb.active
    rows = ws.iter_rows(values_only=True)
    hdr = [str(c) for c in next(rows)]
    ix = {h.strip(): i for i, h in enumerate(hdr)}
    if not {'ITEM_BARCODE', 'ITEM_NUMBER', 'ITEM_DESCRIPTION'} <= set(ix):
        print('  NOTE: RENTAL_STOCK export missing expected columns - '
              'descriptions fall back to ON_HIRE\'s.')
        return by_bc
    for r in rows:
        if not r: continue
        bc = str(r[ix['ITEM_BARCODE']] or '').strip().upper()
        _itm2 = str(r[ix['ITEM_NUMBER']] or '').strip()
        if _itm2 and 'PRODUCT_VARIANT' in ix and _itm2 not in VAR_OF_ITEM:
            _v = str(r[ix['PRODUCT_VARIANT']] or '').strip().upper()
            if _v:
                VAR_OF_ITEM[_itm2] = _v
        if bc and bc not in by_bc:
            _itm = str(r[ix['ITEM_NUMBER']] or '').strip()
            by_bc[bc] = (_itm,
                         MASTER.disp(_itm, str(r[ix['ITEM_DESCRIPTION']] or '').strip()))
    return by_bc

# SALES_STOCK is the consumables catalogue - authoritative names for the
# consumable SKUs that flow through the transaction sheets.
def read_sales(path):
    import openpyxl
    names = {}
    if not path: return names
    wb = openpyxl.load_workbook(path, read_only=True, data_only=True)
    ws = wb['SALES_STOCK'] if 'SALES_STOCK' in wb.sheetnames else wb.active
    rows = ws.iter_rows(values_only=True)
    hdr = [str(c) for c in next(rows)]
    ix = {h.strip(): i for i, h in enumerate(hdr)}
    if not {'SKU_DESCRIPTION'} <= set(ix): return names
    for r in rows:
        if not r: continue
        desc = str(r[ix['SKU_DESCRIPTION']] or '').strip()
        if not desc: continue
        for col in ('SKU_BARCODE', 'SKU_NUMBER'):
            if col in ix and r[ix[col]] not in (None, ''):
                names[str(r[ix[col]]).strip().upper()] = desc
    return names

# --------------------------- read TRANSACTIONS ----------------------------
def read_transactions(path):
    import openpyxl
    wb = openpyxl.load_workbook(path, read_only=True, data_only=True)
    def sheet_rows(name):
        if name not in wb.sheetnames: return []
        rows = list(wb[name].iter_rows(values_only=True))
        if not rows: return []
        hdr = [str(c) for c in rows[0]]
        return [dict(zip(hdr, r)) for r in rows[1:]
                if r and any(c not in (None, '') for c in r)]
    return sheet_rows('TRANSACTION_CHARGES'), sheet_rows('CUSTOMER_CONTRACTOR_EQUIP')

# --------------------------- build ----------------------------------------
def build():
    onhire_path = find_export('ON_HIRE*.xlsx', 'ON_HIRE')
    txn_path = find_export('TRANSACTIONS*.xlsx', 'TRANSACTIONS')
    rental_path = find_export('RENTAL_STOCK*.xlsx', 'RENTAL_STOCK', required=False)
    sales_path = find_export('SALES_STOCK*.xlsx', 'SALES_STOCK', required=False)
    for pth in (onhire_path, txn_path, rental_path, sales_path):
        if pth: print('Reading  ' + os.path.basename(pth))
    people, asof = read_onhire(onhire_path)
    tc, eq = read_transactions(txn_path)
    rental_bc = read_rental(rental_path)    # barcode -> (asset no, current desc)
    sales_names = read_sales(sales_path)    # sku/barcode -> consumable name
    #  What is actually ON THE SHELF this morning - the store catalogue
    #  (Andrew, 29 Jul 2026: "saves them waiting and then being told no")
    try:
        import mygear_store
        STOCK = mygear_store.read_availability(rental_path, sales_path, MASTER)
    except Exception as _e:
        print('  NOTE: store catalogue not built ({}) - the rest of the '
              'page is unaffected.'.format(_e))
        STOCK = {'hire': [], 'cons': [], 'stats': {}}
    # transactions run a day behind billing - the true coverage boundary is
    # the latest date actually present in the file; the card says so.
    txn_dates = [parse_date(r.get(k)) for r in tc + eq
                 for k in ('TRAN_START_DATE', 'TRAN_END_DATE')]
    txn_dates = [d for d in txn_dates if d]
    txn_to = fmt_d(max(txn_dates)) if txn_dates else ''
    if not people:
        die('ON_HIRE export has no rows with an EXTERNAL_ID - nothing to build.')
    # ---- roster memory: people who returned EVERYTHING drop off ON_HIRE,
    # but returning it all is the gold standard - they keep their card.
    # MY_GEAR_PEOPLE.csv remembers every id/name/company ever seen in an
    # ON_HIRE pull (ids still only ever come from the on-hire report).
    import csv
    cache_path = os.path.join(BASE, 'MY_GEAR_PEOPLE.csv')
    if os.path.exists(cache_path):
        with io.open(cache_path, encoding='utf-8', newline='') as f:
            for row in csv.reader(f):
                if len(row) >= 3 and row[0] and row[0] not in people:
                    people[row[0]] = {'name': row[1], 'company': row[2],
                                      'hid': '', 'items': []}
    # ---- the site roster: EVERYONE, with their hire ID ---------------
    #  (Andrew, 28 Jul 2026: "see this - we will need this on both
    #  computers, this is everyone.")
    #  ON_HIRE only ever lists people currently holding gear, so a bloke
    #  who has handed everything back - or never taken anything - had no
    #  card and no way to get one. HIRERS_ID.xlsx is the site's own list
    #  of every hirer and their External ID, so now everybody has a page,
    #  even if that page says "nothing in your name".
    try:
        import openpyxl as _rx
        _rp = _newest_file('HIRERS_ID*.xlsx')
        if _rp:
            _rw = _rx.load_workbook(_rp, read_only=True, data_only=True)
            _rr = list(_rw[_rw.sheetnames[0]].iter_rows(values_only=True))
            _rh = {}
            for _row in _rr[:5]:
                _c = [str(v).strip().lower() if v is not None else ''
                      for v in _row]
                if 'name' in _c and 'external id' in _c:
                    _rh = {v: i for i, v in enumerate(_c) if v}
                    break
            _new = 0
            if _rh:
                _ni, _ei = _rh['name'], _rh['external id']
                _ci = _rh.get('employer')
                for _row in _rr:
                    _id = (str(_row[_ei] or '').strip()
                           if _ei < len(_row) else '')
                    _nm = (str(_row[_ni] or '').strip()
                           if _ni < len(_row) else '')
                    if not _id or not _nm or _nm.lower() == 'name':
                        continue
                    if _id in people:
                        continue
                    people[_id] = {
                        'name': norm_name(_nm), 'hid': '', 'items': [],
                        'company': (str(_row[_ci] or '').strip()
                                    if _ci is not None and _ci < len(_row)
                                    else '')}
                    _new += 1
            print('  Site roster: {} more people given a card from {} '
                  '(everyone on site, not just those holding gear).'
                  .format(_new, os.path.basename(_rp)))
            _rw.close()
    except Exception as _e:
        print('  (site roster not read: {})'.format(_e))

    # ---- IDs typed in by hand (Andrew, 28 Jul 2026: "how about i get a
    # full full list, as this won't work doing it this way").
    # ON_HIRE is the ONLY export carrying an EXTERNAL_ID, so anyone who
    # has never held gear under their own ID could never get a card - not
    # even to be told they are holding nothing. The 'ID Cards' sheet of
    # Coates_Report_Recipients.xlsx existed for this and was never read.
    # It is now: put a number against a name there and they get a card.
    try:
        import openpyxl as _ox
        _book = os.path.join(BASE, 'Coates_Report_Recipients.xlsx')
        if os.path.exists(_book):
            _wb = _ox.load_workbook(_book, read_only=True, data_only=True)
            if 'ID Cards' in _wb.sheetnames:
                _rows = list(_wb['ID Cards'].iter_rows(values_only=True))
                _h = {}
                for _r in _rows[:8]:
                    _c = [str(v).strip() if v is not None else '' for v in _r]
                    if 'ID No' in _c and 'Hirer Name' in _c:
                        _h = {v: i for i, v in enumerate(_c) if v}
                        break
                _added = 0
                if _h:
                    for _r in _rows:
                        _id = str(_r[_h['ID No']] or '').strip() \
                            if _h['ID No'] < len(_r) else ''
                        _nm = str(_r[_h['Hirer Name']] or '').strip() \
                            if _h['Hirer Name'] < len(_r) else ''
                        if not _id or not _nm or _id == 'ID No':
                            continue
                        if 'DEMO' in ' '.join(str(v) for v in _r).upper():
                            continue
                        if _id not in people:
                            people[_id] = {'name': norm_name(_nm),
                                           'company': '', 'hid': '',
                                           'items': []}
                            _added += 1
                if _added:
                    print('  {} card(s) added from the ID Cards sheet - people '
                          'with no gear on hire still get a page.'.format(_added))
            _wb.close()
    except Exception as _e:
        print('  (ID Cards sheet not read: {})'.format(_e))

    with io.open(cache_path, 'w', encoding='utf-8', newline='') as f:
        w = csv.writer(f)
        for idno, p in people.items():
            w.writerow([idno, p['name'], p['company']])
    today = dt.date.today()
    by_name = {p['name']: idno for idno, p in people.items()}

    # per-person transaction truth (Coates rental = TRANSACTION_CHARGES)
    stats = {n: {'ret': 0, 'same': 0, 'dmg': [], 'txn_keys': set(),
                 'dates': set(), 'radio': [0, 0], 'gas': [0, 0],
                 'oth': [0, 0], 'cons': {}} for n in by_name}
    def key_of(row):
        item = str(row.get('SKU/ITEM_NUMBER') or row.get('ITEM_NUMBER') or '').strip()
        d = parse_date(row.get('TRAN_START_DATE'))
        return (item.upper(), d.isoformat() if d else '')
    skip_pool = lambda n: n.lower().startswith('site plant equipment')

    for row in tc:
        n = norm_name(row.get('HIRER_NAME'))
        if n not in stats or skip_pool(n): continue
        s = stats[n]
        s['txn_keys'].add(key_of(row))
        for k in ('TRAN_START_DATE', 'TRAN_END_DATE'):
            d = parse_date(row.get(k))
            if d: s['dates'].add(d)
        sd, ed = parse_date(row.get('TRAN_START_DATE')), parse_date(row.get('TRAN_END_DATE'))
        if ed:
            s['ret'] += 1
            if sd == ed: s['same'] += 1
        try: dmg = float(row.get('DAMAGE ($)') or 0)
        except (TypeError, ValueError): dmg = 0
        if dmg > 0:
            s['dmg'].append(str(row.get('SKU/ITEM DESCRIPTION') or 'item')[:40])
        desc = str(row.get('SKU/ITEM DESCRIPTION') or '')
        if GAS_RE.search(desc):
            s['gas'][0] += 1
            if ed: s['gas'][1] += 1

    for row in eq:
        n = norm_name(row.get('HIRER_NAME'))
        if n not in stats or skip_pool(n): continue
        s = stats[n]
        s['txn_keys'].add(key_of(row))
        for k in ('TRAN_START_DATE', 'TRAN_END_DATE'):
            d = parse_date(row.get(k))
            if d: s['dates'].add(d)
        ed = parse_date(row.get('TRAN_END_DATE'))
        desc = str(row.get('PRODUCT_VARIANT') or row.get('SKU/ITEM DESCRIPTION') or '')
        cat = str(row.get('PRODUCT_CATEGORY') or '')
        try: qty = int(float(row.get('QUANTITY') or 1))
        except (TypeError, ValueError): qty = 1
        if cat == 'Consumable':
            # SALES_STOCK carries the authoritative consumable names
            bc = str(row.get('LATEST_BARCODE') or '').strip().upper()
            sku = str(row.get('SKU/ITEM_NUMBER') or '').strip().upper()
            best = sales_names.get(bc) or sales_names.get(sku) or desc
            k = re.sub(r'\s*-\s*K2/?\d*$', '', best.strip()[:40]).strip(' -')
            s['cons'][k] = s['cons'].get(k, 0) + max(1, qty)
        elif GAS_RE.search(desc):
            s['gas'][0] += 1
            if ed: s['gas'][1] += 1
        elif RADIO_RE.search(desc):
            s['radio'][0] += 1
            if ed: s['radio'][1] += 1
        else:
            s['oth'][0] += 1
            if ed: s['oth'][1] += 1

    # on-hire items also count as store activity (and catch unbilled days)
    for idno, p in people.items():
        s = stats[p['name']]
        for it in p['items']:
            s['txn_keys'].add((it['item'].upper(), it['start'].isoformat() if it['start'] else ''))
            if it['start']: s['dates'].add(it['start'])
            if GAS_RE.search(it['desc']) and not parse_date(None):
                pass  # gas items currently out are counted via txn sheets when billed

    # ---- Charge Reporter damage register: damage recorded against a person
    # also shows on their card (e.g. gear billed outside SiteIQ's charge
    # lines). Same alert as SiteIQ damage charges; de-duplicated by item
    # description so a charge that later reaches SiteIQ never doubles up.
    # (A. Fisher, 24 Jul 2026)
    reg_path = os.path.join(BASE, 'Coates_K2_Charge_Reporter', 'CHARGE_REGISTER.xlsx')
    dmg_unattached = []   # (person, item) with no card in today's ON_HIRE
    if os.path.isfile(reg_path):
        try:
            import openpyxl
            rwb = openpyxl.load_workbook(reg_path, read_only=True, data_only=True)
            if 'Damage - Breakdown' in rwb.sheetnames:
                rrows = list(rwb['Damage - Breakdown'].iter_rows(values_only=True))
                rhdr = {str(v).strip(): i for i, v in enumerate(rrows[0]) if v}
                for rr in rrows[1:]:
                    def rg(col):
                        i = rhdr.get(col)
                        return rr[i] if i is not None and i < len(rr) else None
                    if not rg('Charge ID'):
                        continue
                    who = norm_name(re.sub(r'\s*\(.*?\)\s*', ' ', str(rg('Person using / returning item') or '')))
                    who = re.sub(r'\s+', ' ', who).strip()
                    d = str(rg('Item description') or 'item')[:40]
                    if who in stats:
                        if d not in stats[who]['dmg']:
                            stats[who]['dmg'].append(d)
                    else:
                        #  Damage against someone with no card today used
                        #  to vanish without a word - the register said
                        #  $600, the page said 0, and nobody knew why.
                        #  It still can't sit on a card that doesn't
                        #  exist, but now it is SAID, and counted in the
                        #  site-wide damage figure. (Found 26 Jul 2026 -
                        #  Mason Thomas's radio.)
                        dmg_unattached.append((who or 'unnamed', d))
            rwb.close()
        except Exception:
            pass    # unreadable register never breaks the gear page
    if dmg_unattached:
        print('  NOTE: {} damage charge(s) in the register belong to people '
              'with no card in today\'s ON_HIRE export: {}. They are counted '
              'in the site-wide damage figure and will attach the moment the '
              'person appears in an ON_HIRE pull.'.format(
                  len(dmg_unattached),
                  '; '.join('{} ({})'.format(w, d) for w, d in dmg_unattached)))

    # ---------------- score model (documented, transparent) ---------------
    # Returns Score = 100 x (0.75 x same-day rate + 0.25 x returned rate)
    #   same-day rate = same-day returns / returns
    #   returned rate = returns / total items had (had = out now + returned)
    # Reproduces the approved anchors: 1-of-1 same-day + 1 still out -> 88;
    # 1 return (not same-day) of 12 -> 2. No returns yet -> no score shown.
    order = list(people.keys())  # ON_HIRE first-appearance order (stable ties)
    computed = {}
    for idno in order:
        p = people[idno]; s = stats[p['name']]
        out_now = len(p['items']); had = out_now + s['ret']
        if s['ret'] > 0:
            sd_rate = s['same'] / s['ret']
            rt_rate = s['ret'] / had if had else 0
            score = int(100 * (0.75 * sd_rate + 0.25 * rt_rate) + 0.5)
        else:
            score = 0
        computed[idno] = {'out': out_now, 'had': had, 'ret': s['ret'],
                          'same': s['same'], 'score': score}
    total = len(order)
    site_sorted = sorted(order, key=lambda i: (-computed[i]['score'], order.index(i)))
    site_rank = {i: n + 1 for n, i in enumerate(site_sorted)}
    site_avg = int(sum(c['score'] for c in computed.values()) / total + 0.5)

    #  MOVEMENT - how each person is tracking against the last build.
    #  Yesterday's board is read BEFORE today's is written, or everyone
    #  would be compared against themselves and hold their spot forever.
    _MOVE = {}
    try:
        import mygear_movement as _mv
        _today_key = _mv.today_key()
        _prev_day, _prev = _mv.previous_day(BASE, _today_key)
        for _i in computed:
            m = _mv.movement(_prev, _i, computed[_i]['score'], site_rank[_i])
            if m:
                _MOVE[_i] = m
        _days = _mv.save(BASE, _today_key,
                         {_i: {'score': computed[_i]['score'],
                               'rank': site_rank[_i]} for _i in computed})
        if _prev_day:
            _up = sum(1 for m in _MOVE.values() if m['places'] > 0)
            print('  Movement: compared against {} - {} people moved up, '
                  '{} day(s) of history kept.'.format(_prev_day, _up, _days))
        else:
            print('  Movement: first scoreboard saved - arrows start '
                  'appearing on tomorrow\'s build.')
    except Exception as _e:
        print('  NOTE: movement not available ({}) - scores still build.'
              .format(_e))
    comp_of = {i: people[i]['company'].strip().upper() for i in order}
    crew_avg, crew_rank, crew_total = {}, {}, {}
    for co in set(comp_of.values()):
        members = [i for i in order if comp_of[i] == co]
        avg = int(sum(computed[i]['score'] for i in members) / len(members) + 0.5)
        ms = sorted(members, key=lambda i: (-computed[i]['score'], order.index(i)))
        for n, i in enumerate(ms):
            crew_avg[i], crew_rank[i], crew_total[i] = avg, n + 1, len(members)

    #  Crew standings (Andrew, 28 Jul 2026: "how they score against
    #  other - their company or even onsite"). Every crew ranked by its
    #  average score so a card can say "your crew sits #2 of 12 on
    #  site". A crew of one still ranks - the wording stays kind.
    _co_avg = {}
    for co in set(comp_of.values()):
        members = [i for i in order if comp_of[i] == co]
        _co_avg[co] = int(sum(computed[i]['score'] for i in members) /
                          len(members) + 0.5)
    _co_rank = {co: n + 1 for n, (co, _a) in enumerate(
        sorted(_co_avg.items(), key=lambda kv: (-kv[1], kv[0])))}
    #  Top crew for the landing pulse: judged only among crews of 3+ so
    #  one bloke with one perfect return doesn't outrank a whole squad.
    _big = [co for co in _co_avg
            if sum(1 for i in order if comp_of[i] == co) >= 3]
    top_crew = (max(_big, key=lambda co: _co_avg[co]) if _big
                else (max(_co_avg, key=_co_avg.get) if _co_avg else ''))

    # ---------------- payloads --------------------------------------------
    DATA, warn_dupes = {}, {}
    tot_items = rad_out_tot = gas_out_tot = dmg_tot = 0
    for idno in order:
        p = people[idno]; s = stats[p['name']]; c = computed[idno]
        norm = re.sub(r'\s+', '', idno)
        if norm in warn_dupes:
            print('  WARNING: IDs {} and {} normalise the same - only the first '
                  'is served.'.format(warn_dupes[norm], idno)); continue
        warn_dupes[norm] = idno
        # first goes straight into the story card via innerHTML, so it is
        # HTML-escaped here - a name with a stray < or & can never break or
        # inject into the page. The story's own <b> tags are added below,
        # around this already-safe value.
        name = p['name']; first = html.escape(name.split(' ')[0] or name, quote=False)
        initials = ''.join(w[0] for w in name.split()[:2]).upper() or 'K2'
        company = re.sub(r'\s+', ' ', p['company']).title()
        items, mixc, aging = [], {}, {'g': 0, 'a': 0, 'r': 0}
        #  Longest-held first, then A-Z within the same day count, so two
        #  items out the same three days always sit in the same order.
        #  (Andrew, 29 Jul 2026: "starting longest days a-z")
        for it in sorted(p['items'],
                         key=lambda x: (-((today - x['start']).days
                                          if x['start'] else -1),
                                        (x['desc'] or '').upper())):
            days = max(0, (today - it['start']).days) if it['start'] else '-'
            # RENTAL_STOCK wins on asset number + current description
            asset, desc = it['item'], it['desc']
            if it.get('barcode') and it['barcode'] in rental_bc:
                a2, d2 = rental_bc[it['barcode']]
                asset, desc = (a2 or asset), (d2 or desc)
            cat = category(desc)
            mixc[cat] = mixc.get(cat, 0) + 1
            if isinstance(days, int):
                aging['g' if days <= 2 else ('a' if days <= 4 else 'r')] += 1
            # 'b' = the compliance chips for this line (already-escaped HTML
            # from equipment_compliance). Empty string when the master says
            # this item has nothing to declare - so the card stays clean.
            items.append({'d': desc, 'n': asset, 'days': days,
                          'c': CAT_COLOURS[cat],
                          'b': EC.badges_html(asset, desc, wrap=False),
                          # the orange Plant ID pill - the number the crews
                          # actually say out loud (A. Fisher, 25 Jul 2026)
                          'pid': EC.plant_id(asset),
                          # the photo key - shows WHAT the item looks like
                          # on the card once its variant photo is collected
                          'v': VAR_OF_ITEM.get(asset, ''),
                          # replacement cost, printed on the A4 in the
                          # highlighter - null shows TBC, never $0
                          'r': _repl_cost(asset, desc)})
        tot_items += len(items)
        # tie-break matches the established cards: count desc, then name Z->A
        mix = [[k, v, CAT_COLOURS[k]] for k, v in
               sorted(sorted(mixc.items(), key=lambda kv: kv[0], reverse=True),
                      key=lambda kv: -kv[1])]
        sd, ret, had, out_now, score = c['same'], c['ret'], c['had'], c['out'], c['score']
        if sd > 0: rating = {'stars': 5, 'label': 'Same-day returner'}
        elif ret > 0: rating = {'stars': 2, 'label': 'Returns, but not same-day'}
        else: rating = {'stars': 0, 'label': 'No returns logged yet'}
        # badges - thresholds documented here, all data-driven
        badges = []
        if out_now >= 8: badges.append(['▣', 'Big Kit'])
        if len(mixc) >= 4: badges.append(['✦', 'All-Rounder'])
        if len(s['txn_keys']) >= 8: badges.append(['⚡', 'Store Regular'])
        if mixc.get('Rigging'): badges.append(['⛓', 'Rigger'])
        if mixc.get('Electrical'): badges.append(['⭐', 'Powerhouse'])
        if sd >= 1: badges.append(['↺', 'Same-Day Legend'])
        if crew_rank[idno] == 1 and sd >= 1: badges.append(['\U0001f3c6', 'Top of the Store'])
        if site_rank[idno] == 1 and sd >= 1: badges.append(['\U0001f525', 'Site Legend'])
        # approved wording (22 Jul 2026) - do not reintroduce "Good on ya"
        if sd > 0:
            story = ("Nice work, " + first + " — you've brought back <b>" +
                     str(ret) + " of " + str(had) + "</b> you've had, <b>" + str(sd) +
                     " same-day</b>. Ripper — that's what keeps the yard humming "
                     "and the next crew equipped. Thanks for doing your bit.")
        elif ret > 0:
            story = (first + ", you've brought back <b>" + str(ret) + " of " +
                     str(had) + "</b> so far. Sending gear back the same day "
                     "you're finished keeps your record clean and the gear moving "
                     "— an easy one when you're passing the store.")
        else:
            story = (first + ", you've had " + str(out_now) +
                     (" item" if out_now == 1 else " items") + " out and none are "
                     "back yet — send one in and get your first same-day "
                     "return on the board. Thanks for doing your bit.")
        visits, txns = len(s['dates']), len(s['txn_keys'])
        if txns > 0:
            story += (" You've used the store " +
                      ("once" if visits == 1 else str(visits) + " times") +
                      " this shut — " + str(txns) +
                      (" transaction" if txns == 1 else " transactions") + " all up.")
        cons_n = sum(s['cons'].values())
        rad_t, rad_b = s['radio']; gas_t, gas_b = s['gas']; oth_t, oth_b = s['oth']
        rad_out_tot += rad_t - rad_b; gas_out_tot += gas_t - gas_b
        dmg_tot += len(s['dmg'])
        # What this person is carrying, counted up. The per-line chips tell
        # you what each item needs; this tells them the size of the job in
        # one sentence, so a bloke with six tagged leads reads it once
        # instead of six times.
        _cn = EC.summarise(
            [{'asset': i['n'], 'description': i['d']} for i in items])
        payload = {
            'name': name, 'company': company, 'id': idno, 'initials': initials,
            #  both scannable numbers: the card ID and SiteIQ's hirer ID
            'hid': p.get('hid', ''),
            'stats': {'items': out_now, 'types': len({i['d'] for i in items}),
                      'returned': ret, 'sameday': sd,
                      'rex': sum(i['r'] for i in items if i.get('r')),
                      'rex_tbc': sum(1 for i in items if not i.get('r'))},
            'rating': rating, 'score': score, 'hasReturns': ret > 0,
            'rank': {'comp': crew_rank[idno], 'compTotal': crew_total[idno],
                     'site': site_rank[idno], 'siteTotal': total,
                     'pct': int(site_rank[idno] / total * 100 + 0.5),
                     #  the whole crew's standing on site, for the
                     #  "your crew sits #N of M" line on the card
                     'crewPos': _co_rank.get(comp_of[idno], 0),
                     'crewOf': len(_co_rank)},
            'cmp': {'you': score, 'crew': crew_avg[idno], 'site': site_avg},
            #  how they are tracking against yesterday - None on the very
            #  first day, so the card says nothing rather than guessing
            'move': _MOVE.get(idno),
            'mix': mix, 'story': story, 'items': items, 'aging': aging,
            'badges': badges, 'comp': _cn,
            'act': {'visits': visits, 'txns': txns, 'to': txn_to},
            'cons': {'n': cons_n,
                     'list': [{'d': k, 'q': v} for k, v in sorted(s['cons'].items())]},
            'radios': {'taken': rad_t, 'back': rad_b, 'out': rad_t - rad_b},
            'gas': {'taken': gas_t, 'back': gas_b, 'out': gas_t - gas_b},
            'oth': {'taken': oth_t, 'back': oth_b, 'out': oth_t - oth_b},
            'dmg': {'n': len(s['dmg']), 'list': s['dmg']},
        }
        DATA[lk_tag(norm)] = lk_enc(norm, json.dumps(payload, ensure_ascii=True,
                                                     separators=(',', ':')))
    DATA[lk_tag('SELFTEST')] = lk_enc('SELFTEST', '{"name":"SELFTEST"}')

    # store-only people we cannot serve (no EXTERNAL_ID in today's ON_HIRE)
    known = set(by_name)
    seen = {norm_name(r.get('HIRER_NAME')) for r in tc + eq} - {''}
    missing = sorted(n for n in seen if n not in known and not skip_pool(n))
    if missing:
        print('  NOTE: store activity but no card (no ID in today\'s ON_HIRE '
              'export): ' + ', '.join(missing))
        print('        They get a card as soon as they appear in an ON_HIRE '
              'pull with their EXTERNAL_ID.')

    #  The phone-first layer: the site guides, the save-to-phone button,
    #  the card scanner. jsQR rides along so the scanner works on an
    #  iPhone, where the browser has no barcode reader of its own - the
    #  page still opens with no signal once it's on the handset.
    _jsqr = ''
    _qp = os.path.join(os.path.dirname(os.path.abspath(__file__)),
                       'jsQR.min.js')
    if os.path.exists(_qp):
        with open(_qp, 'r', encoding='utf-8') as _fh:
            _jsqr = _fh.read()
    else:
        print('  NOTE: jsQR.min.js is missing, so the Scan button will only '
              'work on phones with a built-in reader. Typing the ID still '
              'works everywhere.')
    #  the store catalogue rides in as one more guide screen - same
    #  shelf button, same full-screen sheet, nothing new to learn
    _store_btn, _store_pane = '', ''
    if STOCK.get('hire') or STOCK.get('cons'):
        _sst = STOCK['stats']
        _store_btn = (
            "<button class='gbtn' onclick=\"openGuide('store')\">"
            "<svg viewBox='0 0 24 24' fill='none' stroke='currentColor' "
            "stroke-width='1.7' stroke-linecap='round' stroke-linejoin='round'>"
            "<path d='M4 8h16v11a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1zM4 8l2-4h12l2 4"
            "M9 12h6'/></svg>"
            "<div><b>What's in the store</b><span>{h} ready to hire &middot; "
            "{c} consumable lines &mdash; search it</span></div>"
            "<em>&rsaquo;</em></button>").format(
                h=_sst.get('hireItems', 0), c=_sst.get('consLines', 0))
        _store_pane = ("<div id='g-store' class='gpane'>"
                       + mygear_store.pane(STOCK, asof) + "</div>")
    _shelf = mygear_ui.shelf_html(mygear_guides.guide_buttons() + _store_btn)
    #  The site pulse - live numbers on the front door (Andrew, 28 Jul
    #  2026: "utilising all reports to provide as much data as we can").
    #  Every figure is computed above from today's exports; the counters
    #  animate up on load, neon so they read from a metre away.
    _sd_site = sum(c['same'] for c in computed.values())
    _esc_py = lambda s: (str(s).replace('&', '&amp;').replace('<', '&lt;')
                         .replace('>', '&gt;'))
    #  ACTIVE people, not carded people (Andrew, 29 Jul 2026: "total
    #  active people using the store, not total of people added into the
    #  database"). A card in the drawer is not a user - a transaction is.
    #  The site plant pool is a location, not a person, and is excluded
    #  or it would sit top of every board with hundreds of movements.
    _active = {norm_name(r.get('HIRER_NAME')) for r in tc + eq}
    _active = {n for n in _active if n and not skip_pool(n)}
    _firms = {str(r.get('EMPLOYER_NAME') or '').strip() for r in tc + eq}
    _firms |= {str(p.get('comp') or '').strip() for p in people.values()}
    _firms = {f for f in _firms if f and f.lower() not in ('', 'none')}
    _st = STOCK.get('stats', {})
    def _pu(v, label, sub=''):
        return ('<span class="pu"><b class="pv" data-to="{v}">0</b>{l}'
                '{s}</span>').format(v=v, l=label,
                                     s=('<i>' + sub + '</i>') if sub else '')
    pulse = ('<div class="pulse">'
             + _pu(len(_active), 'USING THE STORE',
                   '{} carded'.format(total))
             + _pu(len(_firms), 'COMPANIES')
             + _pu(tot_items, 'ITEMS OUT NOW')
             + (_pu(_st.get('hireItems', 0), 'READY TO HIRE',
                    '{} different things'.format(_st.get('hireLines', 0)))
                if _st.get('hireItems') else '')
             + _pu(_sd_site, 'SAME-DAY RETURNS')
             + ('<span class="pu"><b class="pvt">{t}</b>TOP CREW</span>'
                if top_crew else '')
             + '</div>').format(t=_esc_py(top_crew.title()) if top_crew else '')
    _gl_dir = os.path.join(BASE, 'Gear_Lookup')
    os.makedirs(_gl_dir, exist_ok=True)
    _stores_tag = ''
    #  THE STORES TEAM PAGE - the counter's own view, behind a code.
    #  A separate file on purpose: the crew page stays light, and the
    #  staff view can carry who-has-what without putting it in front of
    #  900 people. The code lives in stores_code.txt (protected from
    #  updates); change the file, re-run 04, done.
    try:
        import mygear_stores
        _code_p = os.path.join(BASE, 'stores_code.txt')
        _code = '2026'
        if os.path.isfile(_code_p):
            with io.open(_code_p, encoding='utf-8') as _fh:
                _code = (_fh.read().strip() or _code)
        else:
            with io.open(_code_p, 'w', encoding='utf-8') as _fh:
                _fh.write('2026\n')
            print('  Stores code file created: stores_code.txt (code 2026 - '
                  'change it and re-run).')
        _sk = find_export('STOCKTAKE*.xlsx', 'STOCKTAKE', required=False)
        #  SALES_STOCK feeds the consumables pane. Optional on purpose -
        #  a store with no consumables still gets a board.
        _sales = find_export('SALES_STOCK*.xlsx', 'SALES_STOCK',
                             required=False)
        _sd = mygear_stores.read(rental_path, _sk, MASTER,
                                 txn_path=txn_path,
                                 sales_path=_sales, base=BASE)
        #  the manager layer - money, under its own code
        _mgr_p = os.path.join(BASE, 'manager_code.txt')
        _mgr = 'army8686ARRA'
        if os.path.isfile(_mgr_p):
            with io.open(_mgr_p, encoding='utf-8') as _fh:
                _mgr = (_fh.read().strip() or _mgr)
        else:
            with io.open(_mgr_p, 'w', encoding='utf-8') as _fh:
                _fh.write('army8686ARRA\n')
        _pr = mygear_stores._pricing(onhire_path, MASTER)
        with io.open(os.path.join(_gl_dir, 'stores.html'), 'w',
                     encoding='utf-8') as _fh:
            _fh.write(mygear_stores.build(_sd, _code, asof,
                                          pricing=_pr, mgr_code=_mgr))
        #  the front-door override answers to the code AND its numeric
        #  phone-keypad twin - the crew ID box only offers a number
        #  keypad on phones, so a letters-only code could never be
        #  typed there (caught 29 Jul 2026: "no option to enter
        #  letters"). NOIS answers to 6647.
        _stores_tag = mygear_stores.tag(_code.upper())
        _alias = mygear_stores.keypad_alias(_code)
        if _alias:
            _stores_tag += ',' + mygear_stores.tag(_alias)
        #  Say which code this build actually answers to - masked, but
        #  enough to see AT A GLANCE that the laptop is running "2***"
        #  when everyone has been told the code starts with N. A whole
        #  evening was lost to exactly that on 29 Jul 2026: the
        #  protected stores_code.txt had been created with the default
        #  on one machine while the code everyone knew lived on
        #  another. The file wins, so the build must show the file.
        print('  Stores door: code {}{} ({} chars, from stores_code.txt)'
              '{}'.format(_code[0], '*' * (len(_code) - 1), len(_code),
                          ' | phone keypad twin {}{} works too'.format(
                              _alias[0], '*' * (len(_alias) - 1))
                          if _alias else ''))
        _t = _sd['tiles']
        print('  Stores team page: {} on the shelf | {} out | {} to chase '
              '| stocktake {}% | {} not counted | {} arriving'.format(
                  _t['avail'], _t['onhire'], _t['chase'], _t['stockPct'],
                  _t['stale'], _t['arrivals']))
        if _pr:
            print('  Manager layer: ${:,.2f}/day on hire, {} zero-rate '
                  'line(s) flagged.'.format(_pr['perDay'], _pr['zeroN']))
    except Exception as _e:
        #  This is not a side dish failing - if this block dies, the
        #  stores DOOR dies with it: no code of any kind will open the
        #  board, and the front page just says "no gear found". Shout.
        print('  ' + '!' * 62)
        print('  WARNING: the stores page FAILED to build ({}).'.format(_e))
        print('  The stores door is DEAD this build - NO code will open')
        print('  the board until this is fixed and 04 is run again.')
        print('  The crew page itself is unaffected.')
        print('  ' + '!' * 62)

    page = (TEMPLATE
            .replace('__DATA__', json.dumps(DATA))
            .replace('__PULSE__', pulse)
            .replace('__STORESTAG__', _stores_tag)
            .replace('__ASOF__', asof or 'last refresh')
            .replace('__UICSS__', mygear_ui.CSS)
            .replace('__IDROW__', mygear_ui.ID_ROW)
            .replace('__SHELF__', _shelf)
            .replace('__SHEET__', mygear_ui.sheet_html(
                mygear_guides.guides_html() + _store_pane))
            .replace('__STORECSS__', mygear_store.CSS if _store_pane else '')
            .replace('__STOREJS__',
                     ('var STORE=' + json.dumps(
                         STOCK['hire'] + STOCK['cons'],
                         separators=(',', ':')) + ';\n'
                      #  the CURRENT tag colour word, stamped from the
                      #  compliance master (Jul-Aug = BLUE) so a new
                      #  quarter needs a rebuild, never a code change
                      + mygear_store.JS
                          .replace('__TAGC__', (EC.tag_colour()[0] or ''))
                          .replace('__TAGX__', EC.tag_hex() or '#8A97A8'))
                     if _store_pane else 'var STORE=[];')
            .replace('__UIJS__', (_jsqr + '\n' if _jsqr else '')
                     + mygear_ui.JS))
    out_dir = os.path.join(BASE, 'Gear_Lookup')
    os.makedirs(out_dir, exist_ok=True)
    #  Gear_Lookup is SERVED to every phone on the store Wi-Fi, so the
    #  office People List (the whole site's names and hire IDs in one
    #  file) must never sit in it. It now builds into People_List\, and
    #  this sweep - run every morning with the page - removes any copy an
    #  older build left behind. (Security, 28 Jul 2026.)
    for _office in ('People_List.csv', 'People_List.html', 'Needs_An_ID.csv'):
        _p = os.path.join(out_dir, _office)
        if os.path.isfile(_p):
            try:
                os.remove(_p)
                print('  cleaned out of the served folder: ' + _office)
            except OSError:
                pass
    out = os.path.join(out_dir, 'index.html')
    with io.open(out, 'w', encoding='utf-8') as f:
        f.write(page)
    print('My Gear scorecard page built: {} people, {} items on hire.'.format(
        len(warn_dupes), tot_items))
    print('  Radios still out across site: {} | Gas monitors out: {} | '
          'Damage charges: {}{}'.format(
              rad_out_tot, gas_out_tot, dmg_tot + len(dmg_unattached),
              ' ({} awaiting a card)'.format(len(dmg_unattached))
              if dmg_unattached else ''))
    print('  Data as at: ' + (asof or 'unknown') + ' | Output: ' + out)
    #  gear pictures: shrink anything new in Photos\ into the served
    #  thumbs folder, and say where the hunt stands (30 Jul 2026)
    try:
        import mygear_thumbs
        _n, _made, _ready = mygear_thumbs.refresh(BASE)
        _reg = len(mygear_thumbs.variant_register(BASE))
        print('  Gear pictures: {} of {} variants show a picture{} - run '
              '56_PHOTO_HUNT for the wanted list.'.format(
                  _ready, _reg,
                  ' ({} shrunk this build)'.format(_made) if _made else ''))
    except Exception as _e:
        print('  Gear pictures: skipped this build ({})'.format(_e))

TEMPLATE = r'''<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 16 16%22%3E%3Ccircle cx=%228%22 cy=%228%22 r=%227%22 fill=%22%23F36F21%22/%3E%3C/svg%3E"><title>My Gear · Coates K2</title><style>
:root{--org:#F26222;--org2:#C44C28;--bright:#FFA24D;--ink:#0A0E14;--panel:#151C27;--panel2:#1B2330;--line:#28323F;--tx:#EAF0F7;--mut:#8A97A8;--soft:#C3CDDA;--grn:#35D68A;--amb:#F0B429;--red:#FF5A4D;--glow:rgba(242,98,34,.5)}
*{box-sizing:border-box;margin:0;padding:0;-webkit-print-color-adjust:exact;print-color-adjust:exact}
body{background:radial-gradient(900px 500px at 80% -10%,rgba(242,98,34,.16),transparent 60%),linear-gradient(180deg,#0B1017,#0A0E14);color:var(--tx);font-family:"Segoe UI",Arial,sans-serif;min-height:100vh}
.wrap{max-width:560px;margin:0 auto;padding:20px 16px 60px}
.brand{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px}
.brand .logo{font-size:30px;font-weight:900;color:var(--org);letter-spacing:.5px;line-height:1}.brand .logo b{display:block;color:#c9cfd8;font-size:11px;font-weight:600;letter-spacing:.6px;margin-top:3px}
.brand .siteiq{text-align:right;color:var(--org);font-weight:800;font-size:11px;letter-spacing:1px;margin-top:6px}
.hero{background:linear-gradient(160deg,#18202C,#0E141D);border:1px solid var(--line);border-top:5px solid var(--org);border-radius:16px;padding:22px;text-align:center;margin-bottom:16px}
.hero h1{font-size:23px;color:#fff;margin-bottom:4px}
.hero p{color:var(--soft);font-size:13.5px;line-height:1.5}
.idbox{margin-top:16px}
input{font-size:24px;padding:14px;width:100%;text-align:center;background:var(--panel);border:2px solid var(--line);border-radius:12px;color:#fff;font-family:inherit;letter-spacing:2px}
input:focus{outline:none;border-color:var(--org);box-shadow:0 0 0 4px rgba(242,98,34,.16)}
.btn{margin-top:12px;width:100%;background:linear-gradient(135deg,var(--org),var(--org2));color:#fff;border:none;border-radius:12px;padding:15px;font-size:16px;font-weight:800;cursor:pointer;font-family:inherit}
.btn:active{transform:translateY(1px)}
.err{color:var(--amb);font-size:13px;margin-top:10px;min-height:18px}
.card{display:none}
.pcard{background:linear-gradient(160deg,#18202C,#0E141D);border:1px solid var(--line);border-top:5px solid var(--org);border-radius:16px;padding:20px;margin-bottom:14px}
.ph{display:flex;justify-content:space-between;align-items:flex-start;gap:12px}
.ph .nm{font-size:22px;font-weight:900;color:#fff}
.ph .co{color:var(--mut);font-size:12.5px;margin-top:2px;text-transform:uppercase;letter-spacing:.5px}
.ph .idb{background:var(--panel2);border:1px solid var(--line);border-radius:9px;padding:6px 11px;font-weight:800;color:var(--bright);font-size:13px;white-space:nowrap}
.rate{display:flex;align-items:center;gap:12px;background:rgba(242,98,34,.09);border:1px solid rgba(242,98,34,.4);border-radius:12px;padding:12px 15px;margin:15px 0}
.rate .stars{font-size:26px;letter-spacing:3px;color:var(--org);line-height:1}
.rate .rl b{color:#fff;font-size:15px}.rate .rl div{color:var(--soft);font-size:11.5px;margin-top:2px}
.stats{display:grid;grid-template-columns:repeat(4,1fr);gap:9px;margin-bottom:6px}
.st{background:var(--panel);border:1px solid var(--line);border-radius:12px;padding:12px 6px;text-align:center;border-top:3px solid var(--org)}
.st .v{font-size:26px;font-weight:900;color:#fff;line-height:1}
.st .l{font-size:9px;color:var(--mut);text-transform:uppercase;letter-spacing:.4px;margin-top:5px;font-weight:700}
.story{background:var(--panel);border-left:4px solid var(--org);border-radius:0 10px 10px 0;padding:13px 15px;margin:14px 0;font-size:13.5px;line-height:1.6;color:#eef2f8}
.story b{color:var(--bright)}
h3.sec{font-size:12px;color:var(--mut);text-transform:uppercase;letter-spacing:1px;margin:16px 0 8px}
.item{display:flex;justify-content:space-between;align-items:center;gap:10px;background:var(--panel);border:1px solid var(--line);border-radius:10px;padding:10px 13px;margin-bottom:7px}
.item .d{font-size:13px;color:#eef2f8;font-weight:600}.item .n{font-size:11px;color:var(--mut);margin-top:1px}
/* the item's own picture - what the thing in your name LOOKS like.
   Photo when its variant shot is collected, two-letter tile until. */
.item .ith{flex:none;width:72px;height:72px;border-radius:12px;overflow:hidden;background:#1B2330;display:flex;align-items:center;justify-content:center}
.item .ith img{width:100%;height:100%;object-fit:cover;display:block}
.item .ith.mono{color:#8A97A8;font-weight:900;font-size:17px;letter-spacing:.5px}
.item .itxt{flex:1;min-width:0}
/* .cb = compliance chips under an item. Deliberately NOT .badge/.badges -
   those are the achievement pills above and must not change. The chips
   themselves are inline-styled so they survive print and email. */
.item .cb{margin-top:3px;line-height:1.6}
/* the orange Plant ID - the number the crews say out loud */
.item .n .pid{display:inline-block;background:#F26222;color:#fff;border-radius:9px;
  padding:1px 8px;margin-left:6px;font-weight:800;font-size:11px;letter-spacing:.3px}
.age{flex:none;min-width:52px;text-align:center;border-radius:8px;padding:5px 9px;font-weight:800;font-size:12px}
.age.g{background:rgba(53,214,138,.14);color:#8fe9b8}.age.a{background:rgba(240,180,41,.14);color:#f3d98c}.age.r{background:rgba(255,90,77,.14);color:#f6b3ab}
.clr{display:flex;align-items:center;gap:14px;border-radius:13px;padding:14px 16px;margin-top:8px}
.clr.open{background:rgba(242,98,34,.10);border:1px solid rgba(242,98,34,.45)}
.clr.done{background:rgba(53,214,138,.12);border:1px solid rgba(53,214,138,.5)}
.clr .ci{flex:none;width:46px;height:46px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:22px;font-weight:900}
.clr.open .ci{background:var(--org);color:#fff}.clr.done .ci{background:var(--grn);color:#04120a}
.clr .ct b{color:#fff;font-size:15px;display:block}.clr .ct span{color:var(--soft);font-size:12px}
.help{background:rgba(242,98,34,.08);border:1px solid rgba(242,98,34,.35);border-radius:11px;padding:12px 15px;margin-top:12px;font-size:12.8px;line-height:1.55;color:var(--soft)}
.help b{color:var(--bright)}
.ph{align-items:center}
.pavatar{flex:none;width:52px;height:52px;border-radius:14px;background:linear-gradient(135deg,var(--org),var(--org2));color:#fff;font-weight:900;font-size:20px;display:flex;align-items:center;justify-content:center;letter-spacing:1px}
.pmeta{flex:1}
.scorewrap{display:flex;align-items:center;gap:16px;background:linear-gradient(135deg,rgba(242,98,34,.15),rgba(242,98,34,.03));border:1px solid rgba(242,98,34,.4);border-radius:16px;padding:14px 16px;margin:15px 0}
.ring{width:98px;height:98px;flex:none}
.ringtxt{fill:#fff;font-size:30px;font-weight:900;font-family:"Segoe UI",Arial,sans-serif}
.scoremeta{flex:1}
.scorelab{font-weight:800;color:#fff;font-size:16px}
.rankline{color:var(--soft);font-size:12px;margin-top:3px}
.rate2{margin-top:9px;font-size:13px;color:#fff}.rate2 .stars{color:var(--org);letter-spacing:2px}.rate2 b{color:var(--bright)}
.badges{display:flex;flex-wrap:wrap;gap:7px;margin-bottom:14px}
.badge{display:inline-flex;align-items:center;gap:6px;background:var(--panel2);border:1px solid var(--line);border-left:3px solid var(--org);border-radius:20px;padding:6px 12px;font-size:12px;font-weight:700;color:#eef2f8}
.badge .bi{font-size:14px}
.mix{display:flex;height:18px;border-radius:9px;overflow:hidden;background:var(--panel);border:1px solid var(--line)}
.mix .seg{height:100%}
.legend{display:flex;flex-wrap:wrap;gap:12px;margin-top:9px}
.legend .lg{font-size:11.5px;color:var(--soft)}
.legend .dot{display:inline-block;width:9px;height:9px;border-radius:50%;margin-right:5px;vertical-align:middle}
.confp{position:fixed;top:-14px;width:9px;height:15px;border-radius:2px;opacity:.95;z-index:99;pointer-events:none;animation:fall 2.3s linear forwards}
@keyframes fall{to{transform:translateY(110vh) rotate(540deg);opacity:0}}
.pcard,.story{animation:fup .45s ease both}
.scorewrap{animation:fup .5s ease both}
.badge{animation:bpop .45s ease both}
@keyframes bpop{0%{opacity:0;transform:scale(.55)}70%{transform:scale(1.08)}100%{opacity:1;transform:scale(1)}}
.cbar i,.mix .seg,.agingbar .ab{transform-origin:left;animation:growx .9s ease-out both}
@keyframes growx{from{transform:scaleX(0)}to{transform:scaleX(1)}}
.item{animation:fup .4s ease both}
@keyframes fup{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
.clr .ci{animation:bpop .55s ease both}
.ringp{transition:stroke-dashoffset 1.1s cubic-bezier(.22,.75,.3,1)}
.st.good{border-top-color:var(--grn)}
.cmp{display:flex;flex-direction:column;gap:9px;margin-bottom:4px}
.cmpr{display:flex;align-items:center;gap:10px}
.cl{width:80px;font-size:12px;color:var(--soft)}
.cbar{flex:1;height:13px;background:var(--panel);border:1px solid var(--line);border-radius:7px;overflow:hidden}
.cbar i{display:block;height:100%;background:linear-gradient(90deg,var(--org2),var(--bright));border-radius:7px}
.cbar i.me{background:linear-gradient(90deg,var(--org),var(--bright))}
.cvv{width:30px;text-align:right;font-weight:800;color:#fff;font-size:13px}
.agingbar{display:flex;height:14px;border-radius:8px;overflow:hidden;background:var(--panel);border:1px solid var(--line);margin-bottom:8px}
.agingbar .ab{height:100%}
.idot{flex:none;width:10px;height:10px;border-radius:50%}
.itxt{flex:1}
.actions{display:flex;gap:10px;margin-top:16px}
.actions button{flex:1;background:var(--panel2);border:1px solid var(--line);color:var(--tx);border-radius:11px;padding:13px;font-weight:700;font-size:14px;cursor:pointer;font-family:inherit}
.actions button.primary{background:linear-gradient(135deg,var(--org),var(--org2));color:#fff;border:none}
.ft{color:var(--mut);font-size:10.5px;text-align:center;margin-top:18px;line-height:1.7}
.ft .val{color:var(--org);font-weight:700}
.alert{border-radius:11px;padding:11px 14px;margin-top:9px;font-size:12.8px;line-height:1.5}
.alert.amb{background:rgba(240,180,41,.10);border:1px solid rgba(240,180,41,.45);color:#f3d98c}
.alert.red{background:rgba(255,90,77,.10);border:1px solid rgba(255,90,77,.5);color:#f6b3ab}
.alert b{color:#fff}
.okline{color:#8fe9b8;font-size:12px;margin-top:9px}
.subline{color:var(--mut);font-size:11.5px;margin-top:7px}
/* ---- ELITE PASS 2 (Andrew, 28 Jul 2026): neon numbers, the site
   pulse on the front door, shimmer on the title, and a contacts
   button that is never more than one thumb away. ---- */
.pulse{display:flex;flex-wrap:wrap;justify-content:center;gap:10px 18px;margin:12px 0 2px;animation:fup .6s .15s ease both}
.pulse .pu{display:flex;flex-direction:column;align-items:center;font-size:8.5px;letter-spacing:1.6px;color:var(--mut);font-weight:700;text-align:center}
.pulse .pu i{display:block;font-style:normal;font-size:8px;letter-spacing:.7px;color:#6E7A8A;margin-top:2px;text-transform:none}
.pulse .pv{font-size:22px;letter-spacing:0;color:#EFFF3D;font-weight:850;text-shadow:0 0 14px rgba(239,255,61,.4);line-height:1.15;font-variant-numeric:tabular-nums}
.pulse .pvt{font-size:13px;letter-spacing:.4px;color:#EFFF3D;font-weight:850;text-shadow:0 0 12px rgba(239,255,61,.35);line-height:1.65;max-width:170px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.mg b{background:linear-gradient(100deg,#F26222 25%,#FFB347 42%,#EFFF3D 50%,#FFB347 58%,#F26222 75%);background-size:240% 100%;-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;animation:mgshine 6s ease-in-out infinite}
@keyframes mgshine{0%,100%{background-position:90% 0}45%,55%{background-position:10% 0}}
/* The floating pill STACK (Andrew, 29 Jul 2026: "did you not add the
   floating pills for gas monitors and radios"). Contacts keeps the
   colour and the ring - it is the one that means "call us". Radio and
   gas sit above it as quiet dark pills: always in reach, never
   competing with the call button for attention. */
.qstack{position:fixed;right:14px;bottom:calc(14px + env(safe-area-inset-bottom,0px));z-index:60;display:flex;flex-direction:column;gap:9px;align-items:flex-end}
.qcall{display:flex;align-items:center;gap:7px;background:linear-gradient(135deg,var(--org),#D24E12);color:#fff;font-weight:800;font-size:12px;letter-spacing:1.4px;padding:11px 16px;border-radius:999px;box-shadow:0 6px 20px rgba(0,0,0,.45);cursor:pointer;animation:qring 3.2s ease-out infinite}
.qcall svg{width:15px;height:15px}
.qmini{display:flex;align-items:center;gap:6px;background:#151A22;border:1.5px solid var(--org);color:#FFB38A;font-weight:800;font-size:10.5px;letter-spacing:1.2px;padding:8px 13px;border-radius:999px;box-shadow:0 4px 14px rgba(0,0,0,.4);cursor:pointer}
.qmini svg{width:13px;height:13px}
@keyframes qring{0%{box-shadow:0 6px 20px rgba(0,0,0,.45),0 0 0 0 rgba(242,98,34,.5)}70%{box-shadow:0 6px 20px rgba(0,0,0,.45),0 0 0 12px rgba(242,98,34,0)}100%{box-shadow:0 6px 20px rgba(0,0,0,.45),0 0 0 0 rgba(242,98,34,0)}}
.neon{color:#EFFF3D !important;text-shadow:0 0 12px rgba(239,255,61,.45)}
.crewline{margin-top:9px;font-size:12.5px;color:var(--mut)}
.crewline b{color:#EFFF3D;text-shadow:0 0 10px rgba(239,255,61,.4)}
.lgheld{margin-top:10px;font-size:12.5px;color:var(--mut);background:var(--panel);border:1px solid var(--line);border-left:3px solid #EFFF3D;border-radius:0 9px 9px 0;padding:9px 12px;line-height:1.5}
.lgheld b{color:var(--tx)}
@media (prefers-reduced-motion: reduce){.pulse,.mg b,.qcall{animation:none}}
__UICSS__
__STORECSS__
</style></head><body><div class="wrap">
<div class="brand"><div class="logo">coates<b>Equipped for anything</b></div><div class="siteiq">POWERED BY SITEIQ<br><span style="color:#8B9099;font-weight:600;letter-spacing:0">Cement Australia K2 &middot; Gladstone</span></div></div>
<div id="landing"><div class="hero">
<h1 class="mg">MY <b>GEAR</b></h1>
<div class="mgkick">K2 Digital Tool Store</div>
<div class="mgsub">Your gear. Your responsibility. One scan.</div>
__PULSE__
<div class="cabs">
<div class="cab"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.6 2.6-2.4-2.4 2.6-2.6z"/></svg><b>Tooling</b></div>
<div class="cab"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="4" width="12" height="17" rx="2"/><path d="M10 2h4M13 9l-3 4h4l-3 4"/></svg><b>Battery gear</b></div>
<div class="cab"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M9 3v5M15 3v5M7 8h10v3a5 5 0 0 1-5 5 5 5 0 0 1-5-5V8zM12 16v5"/></svg><b>Electrical</b></div>
<div class="cab"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M3 19h13M5 19v-4h7l2-5h3l2 4v5M14 10 11 5H8"/><circle cx="7" cy="19" r="1.6"/><circle cx="14" cy="19" r="1.6"/></svg><b>Plant</b></div>
<div class="cab"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="8" y="7" width="8" height="14" rx="2"/><path d="M12 7V2M12 2l3 2M10.5 11h3M10.5 14h3"/></svg><b>Radios</b></div>
<div class="cab"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="7" y="5" width="10" height="16" rx="2.5"/><circle cx="12" cy="12" r="2.6"/><path d="M9.5 2.5h5"/></svg><b>Gas monitors</b></div>
</div>
<div class="scanpanel" id="scanpanel" role="button" tabindex="0">
<span class="crn c1"></span><span class="crn c2"></span><span class="crn c3"></span><span class="crn c4"></span>
<div class="sptitle">Scan your ID barcode</div>
<div class="spsub" id="scancap">Hold your card up to the camera</div>
<div class="bcode"><i class="bline"></i></div>
</div>
<div class="idbox">__IDROW__
<button class="btn" onclick="go()">OPEN MY GEAR</button>
<div class="err" id="err"></div><div class="subline" id="scanhelp"></div></div></div>
<div class="ft"><b style="color:#F26222">Updated once a day, about 7:00 AM.</b> Anything taken or handed back since then shows on tomorrow's refresh.<br>Read-only SiteIQ snapshot as at __ASOF__ &middot; locked to your own ID — a wrong number shows nothing.<br><span class="val">POWERED BY SITEIQ</span> · Built by Andrew Fisher</div>
__SHELF__
</div>
<div id="result" class="card"></div>
</div>
<div class="qstack">
<div class="qmini" onclick="openGuide('radio')" role="button" tabindex="0" title="Two-way radio guide"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="7" y="2" width="10" height="20" rx="2"/><path d="M11 6h2M10 18h4"/></svg>RADIO</div>
<div class="qmini" onclick="openGuide('gas')" role="button" tabindex="0" title="Gas monitor guide"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/></svg>GAS</div>
<div class="qcall" onclick="openGuide('contacts')" role="button" tabindex="0" title="Site contacts - tap to call"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 2 .7 2.9a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.2-1.2a2 2 0 0 1 2.1-.5c.9.3 1.9.6 2.9.7a2 2 0 0 1 1.7 2z"/></svg>CONTACTS</div>
</div>
__SHEET__
<script>var DATA=__DATA__;

function esc(s){return String(s==null?'':s).replace(/[&<>]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;'}[c]})}
function ageCls(d){d=parseInt(d);if(isNaN(d))return'a';return d<=2?'g':(d<=4?'a':'r')}
/* the item's picture tile: its variant photo out of thumbs/, or a clean
   two-letter tile until the photo hunt collects it (31 Jul 2026) */
function thMono(n){
 var w=String(n||'').split(/[^A-Za-z0-9]+/).filter(function(x){return x});
 return ((w[0]||'?').charAt(0)+(w[1]||w[0]||'').charAt(0)).toUpperCase();
}
/* Windows can't save a file named SOCKET1/2DR11MM.jpg - photos for
   codes carrying \ / : * ? " < > | land with those swapped to _ ,
   so the lookup swaps the same way (matches safe_name in Python) */
function tsafe(v){return String(v).replace(/[/:*?"<>|]/g,'_')}
function wthumb(it){
 if(!it.v) return '<span class="ith mono">'+thMono(it.d)+'</span>';
 return '<span class="ith"><img src="thumbs/'+encodeURIComponent(tsafe(it.v))
  +'.jpg" loading="lazy" alt="" data-m="'+thMono(it.d)+'" onerror="thx(this)"></span>';
}
function thx(img){
 var s=img.parentNode;
 s.className='ith mono';
 s.textContent=img.getAttribute('data-m')||'?';
}
function xmur3(str){for(var i=0,h=1779033703^str.length;i<str.length;i++){h=Math.imul(h^str.charCodeAt(i),3432918353);h=h<<13|h>>>19}return function(){h=Math.imul(h^h>>>16,2246822507);h=Math.imul(h^h>>>13,3266489909);h^=h>>>16;return h>>>0}}
function mulberry32(a){return function(){a|=0;a=a+0x6D2B79F5|0;var t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
function tag(id){return(xmur3(id+'|CoatesK2tag2026')()>>>0).toString(16)}
function dec(id,b64){var rnd=mulberry32(xmur3(id+'|CoatesK2gear2026')());var raw=atob(b64),o='';for(var i=0;i<raw.length;i++){o+=String.fromCharCode(raw.charCodeAt(i)^Math.floor(rnd()*256))}return o}
function stars(n){var s='';for(var i=0;i<5;i++)s+=(i<n?'★':'☆');return s}
function countUp(el,to,ms){var t0=null;function s(ts){if(!t0)t0=ts;var k=Math.min(1,(ts-t0)/ms);el.textContent=Math.round(k*to);if(k<1)requestAnimationFrame(s)}requestAnimationFrame(s)}
function animate(){var els=document.querySelectorAll('[data-to]');for(var i=0;i<els.length;i++)countUp(els[i],parseInt(els[i].getAttribute('data-to'))||0,900)}
function confetti(){var cs=['#F26222','#FFA24D','#FFD27A','#ffffff'];for(var i=0;i<70;i++){var d=document.createElement('div');d.className='confp';d.style.left=(Math.random()*100)+'vw';d.style.background=cs[i%4];d.style.animationDelay=(Math.random()*0.35)+'s';document.body.appendChild(d);(function(x){setTimeout(function(){x.remove()},2700)})(d)}}
function cmpbar(l,v,me){v=Math.round(v||0);return '<div class="cmpr"><span class="cl">'+l+'</span><span class="cbar"><i style="width:'+v+'%" '+(me?'class="me"':'')+'></i></span><span class="cvv">'+v+'</span></div>'}
function go(){
 var id=(document.getElementById('idno').value||'').replace(/\s+/g,'');
 var err=document.getElementById('err');
 if(!id){err.textContent='Type the ID number off your card.';return}
 /* STORES OVERRIDE - the counter types its own code into the same box
    and lands on the stores board. One door for everybody: a crew member
    types his hire ID, the stores team types theirs. The code is checked
    by hash, never stored in this page, and it is handed to the stores
    page through sessionStorage rather than the address bar - a code in
    a URL ends up in history and over someone's shoulder.
    (Andrew, 29 Jul 2026: "a stores override to get into the raw") */
 if(typeof STORES_TAG==='string' && STORES_TAG &&
    STORES_TAG.split(',').indexOf(
      (xmur3(id.toUpperCase()+'|CoatesK2storestag2026')()>>>0).toString(16))>=0){
   try{ sessionStorage.setItem('k2stores', id.toUpperCase()); }catch(e){}
   window.location.href='stores.html';
   return;
 }
 /* IDs with letters exist (18479CEM) and SiteIQ stores them upper-case.
    Try the ID exactly as typed, then upper-cased, so a bloke typing
    his card in lower case still lands on his own record. */
 var blob=null, cand=[id, id.toUpperCase()];
 for(var ci=0;ci<cand.length;ci++){
   if(DATA[tag(cand[ci])]){ id=cand[ci]; blob=DATA[tag(id)]; break; }
 }
 if(!blob){err.textContent='No gear found for that ID. Check the number on your card.';return}
 var p;try{p=JSON.parse(dec(id,blob))}catch(e){err.textContent='Could not read that record.';return}
 err.textContent='';
 window.LASTP=p;   // the print sheet builds from the same decoded payload
 var st=p.stats,r=p.rating,rk=p.rank||{comp:1,compTotal:1,pct:100};
 var C=326.7, off=p.hasReturns?(C-C*Math.min(100,p.score||0)/100):C;
 var ringtx=p.hasReturns?'<text x="60" y="70" text-anchor="middle" class="ringtxt" data-to="'+(p.score||0)+'">0</text>':'<text x="60" y="68" text-anchor="middle" class="ringtxt" style="font-size:26px">—</text>';
 var ring='<svg class="ring" viewBox="0 0 120 120"><circle cx="60" cy="60" r="52" fill="none" stroke="#28323F" stroke-width="12"/><circle class="ringp" cx="60" cy="60" r="52" fill="none" stroke="url(#rg)" stroke-width="12" stroke-linecap="round" stroke-dasharray="'+C+'" stroke-dashoffset="'+C+'" data-off="'+off+'" transform="rotate(-90 60 60)"/><defs><linearGradient id="rg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFA24D"/><stop offset="1" stop-color="#F26222"/></linearGradient></defs>'+ringtx+'</svg>';
 var badges=(p.badges||[]).map(function(b,bi){return '<span class="badge" style="animation-delay:'+(0.25+bi*0.13).toFixed(2)+'s"><span class="bi">'+b[0]+'</span>'+esc(b[1])+'</span>'}).join('');
 var tot=(p.mix||[]).reduce(function(a,m){return a+m[1]},0)||1;
 var segs=(p.mix||[]).map(function(m){return '<div class="seg" style="width:'+(100*m[1]/tot)+'%;background:'+m[2]+'"></div>'}).join('');
 var legend=(p.mix||[]).map(function(m){return '<span class="lg"><span class="dot" style="background:'+m[2]+'"></span>'+esc(m[0])+' '+m[1]+'</span>'}).join('');
 var rankline;
 if(!p.hasReturns){rankline='Your score starts with your first return &mdash; easy points from your next drop-off'}
 else if(!(st.sameday>0)){rankline=st.returned+' returned so far &mdash; same-day returns are what lift your score'}
 else{rankline='<b class="neon">#'+rk.comp+'</b> of '+rk.compTotal+' in your crew &middot; top '+rk.pct+'% on site'}
 var html='<div class="pcard"><div class="ph"><div class="pavatar">'+esc(p.initials||'K2')+'</div><div class="pmeta"><div class="nm">'+esc(p.name)+'</div><div class="co">'+esc(p.company)+'</div></div><div class="idb">ID '+esc(p.id)+'</div></div>'
 +'<div class="scorewrap">'+ring+'<div class="scoremeta"><div class="scorelab">Returns Score</div><div class="rankline">'+rankline+'</div><div class="rate2"><span class="stars">'+stars(r.stars)+'</span> <b>'+esc(r.label)+'</b></div></div></div>'
 +(badges?'<div class="badges">'+badges+'</div>':'')
 +'<div class="stats">'
 +'<div class="st"><div class="v'+(st.items>0?' neon':'')+'" data-to="'+st.items+'">0</div><div class="l">Items out</div></div>'
 +'<div class="st"><div class="v" data-to="'+st.types+'">0</div><div class="l">Item types</div></div>'
 +'<div class="st good"><div class="v" data-to="'+st.returned+'">0</div><div class="l">Returned</div></div>'
 +'<div class="st good"><div class="v'+(st.sameday>0?' neon':'')+'" data-to="'+st.sameday+'">0</div><div class="l">Same-day</div></div></div>'
 +(p.cmp?'<h3 class="sec">How you compare</h3><div class="cmp">'+cmpbar('You',p.cmp.you,1)+cmpbar('Your crew',p.cmp.crew,0)+cmpbar('Site avg',p.cmp.site,0)+(rk.crewPos?'<div class="crewline">'+esc(p.company)+' sits <b>#'+rk.crewPos+'</b> of '+rk.crewOf+' crews on site</div>':'')+'</div>':'')
 +(segs?'<h3 class="sec">Your kit mix</h3><div class="mix">'+segs+'</div><div class="legend">'+legend+'</div>':'')
 +'<div class="story">'+p.story+'</div>'
 +'<h3 class="sec">Your gear on hire now</h3>';
 var ag=p.aging||{g:0,a:0,r:0},att=(ag.g+ag.a+ag.r)||1;
 html+='<div class="agingbar"><div class="ab" style="width:'+(100*ag.g/att)+'%;background:#35D68A"></div><div class="ab" style="width:'+(100*ag.a/att)+'%;background:#F0B429"></div><div class="ab" style="width:'+(100*ag.r/att)+'%;background:#FF5A4D"></div></div><div class="legend"><span class="lg"><span class="dot" style="background:#35D68A"></span>0–2d '+ag.g+'</span><span class="lg"><span class="dot" style="background:#F0B429"></span>3–4d '+ag.a+'</span><span class="lg"><span class="dot" style="background:#FF5A4D"></span>5+d '+ag.r+'</span></div>';
 // it.b is the compliance chips, built and escaped in Python before it was
 // encrypted into the payload. It goes in as HTML on purpose - do NOT wrap
 // it in esc() or the crew see markup instead of the tag colour. Every
 // other field still goes through esc().
 p.items.forEach(function(it,ii){html+='<div class="item" style="animation-delay:'+Math.min(ii*0.05,0.65).toFixed(2)+'s">'+wthumb(it)+'<div class="itxt"><div class="d">'+esc(it.d)+'</div><div class="n"><span class="idot" style="background:'+(it.c||"#8A97A8")+';width:8px;height:8px;display:inline-block;border-radius:50%;margin-right:5px;vertical-align:0"></span>Item '+esc(it.n)+(it.pid?'<span class="pid">ID '+esc(it.pid)+'</span>':'')+'</div>'+(it.b?'<div class="cb">'+it.b+'</div>':'')+'</div><div class="age '+ageCls(it.days)+'">'+(it.days==='-'?'—':it.days+'d')+'</div></div>'});
 // The one item that's been out longest gets its own line - a story,
 // not a nag. Only shows from 3 days out, so a fresh kit stays clean.
 var lgh=null;p.items.forEach(function(it){var d=parseInt(it.days);if(!isNaN(d)&&(!lgh||d>lgh.d))lgh={d:d,nm:it.d}});
 if(lgh&&lgh.d>=3){html+='<div class="lgheld">Longest out: <b>'+esc(lgh.nm)+'</b> &mdash; <span class="neon" style="font-weight:800">'+lgh.d+' days</span>. Finished with it? Straight to the counter and it\'s off your list.</div>'}
 // One plain-English summary of what the whole list obliges them to do -
 // the chips say it per item, this says it once so nothing gets skimmed.
 if(p.comp&&p.comp.any){var cbits=[];
  if(p.comp.electrical)cbits.push(p.comp.electrical+' electrical');
  if(p.comp.rigging)cbits.push(p.comp.rigging+' rigging');
  if(p.comp.logbook)cbits.push(p.comp.logbook+' needing a daily pre-start and logbook entry');
  if(p.comp.ret)cbits.push(p.comp.ret+' due back today');
  html+='<div class="alert amb"><b>Check before you use it.</b> Of the gear in your name: '+cbits.join(', ')+'. Anything showing a tag colour needs a current tag with a readable date &mdash; if it hasn\'t got one, don\'t use it, bring it to the store and we\'ll sort it.</div>'}
 var cleared=st.items===0;
 html+='<h3 class="sec">Return clearance</h3><div class="clr '+(cleared?'done':'open')+'"><div class="ci">'+(cleared?'&#10003;':st.items)+'</div><div class="ct">'+(cleared?'<b>Cleared — all gear returned</b><span>Nothing on hire in your name. Legend — thanks for bringing it all back.</span>':'<b>'+st.items+' still to clear</b><span>Bring these back to the tool store and you\'re fully cleared of tools on hire.</span>')+'</div></div>';
 if(p.act){
 html+='<h3 class="sec">Your store scorecard</h3><div class="stats">'
 +'<div class="st"><div class="v" data-to="'+p.act.visits+'">0</div><div class="l">Store visits</div></div>'
 +'<div class="st"><div class="v" data-to="'+p.act.txns+'">0</div><div class="l">Transactions</div></div>'
 +'<div class="st"><div class="v" data-to="'+((p.cons&&p.cons.n)||0)+'">0</div><div class="l">Consumables</div></div>'
 +'<div class="st"><div class="v" data-to="'+((p.radios&&p.radios.taken)||0)+'">0</div><div class="l">Radio gear</div></div></div>';
 var xl=[];
 if(p.radios&&p.radios.taken){xl.push('Radio gear: '+p.radios.back+' of '+p.radios.taken+' back')}
 if(p.gas&&p.gas.taken){xl.push('Gas monitors: '+p.gas.back+' of '+p.gas.taken+' back')}
 if(p.oth&&p.oth.taken){xl.push('Client gear through you: '+p.oth.back+' of '+p.oth.taken+' back')}
 if(p.cons&&p.cons.n&&p.cons.list&&p.cons.list.length){xl.push(p.cons.list.map(function(c){return esc(c.d)+(c.q>1?' x'+c.q:'')}).join(', '))}
 if(p.act.to){xl.push('Store history from SiteIQ transactions to '+esc(p.act.to))}
 if(xl.length){html+='<div class="subline">'+xl.join(' &middot; ')+'</div>'}
 if(p.radios&&p.radios.out>0){html+='<div class="alert amb"><b>&#128251; '+p.radios.out+' piece'+(p.radios.out===1?'':'s')+' of radio kit still in your name.</b> Radios and batteries are gold and the next crew needs them charged &mdash; over the counter and they&rsquo;re off your list in seconds.</div>'}
 if(p.gas&&p.gas.out>0){html+='<div class="alert red"><b>&#9888;&#65039; '+p.gas.out+' gas monitor'+(p.gas.out===1?'':'s')+' not back.</b> Monitors keep you alive and need charge and calibration between shifts &mdash; that&rsquo;s Life Saving Rule 5 territory. Counter today, please.</div>'}
 if(p.dmg&&p.dmg.n>0){html+='<div class="alert amb"><b>'+p.dmg.n+' damage charge'+(p.dmg.n===1?'':'s')+' recorded in your name'+(p.dmg.list&&p.dmg.list.length?' ('+esc(p.dmg.list.join(', '))+')':'')+'.</b> Doesn&rsquo;t look right? See us at the counter &mdash; easy fixed.</div>'}
 else{html+='<div class="okline">&#10003; No damage recorded in your name this shutdown &mdash; gear looked after.</div>'}
 }
 html+='<div class="help"><b>We\'re here to help.</b> Finished with something? Bring it back and we\'ll clean it and get it ready for the next crew. Need gear, or something\'s not right? Tell the tool store team, day or night — we\'ll sort it, no fuss.</div>';
  html+='<div class="guidelink" onclick="openGuide(\'contacts\')"><b>Site guides</b><span>Contact board &middot; radio &middot; gas monitor</span><em>&rsaquo;</em></div>';
 // BOTH barcodes - the card number and SiteIQ's hirer ID, drawn
 // properly so a counter scanner reads them straight off the phone.
 html+=barcodePair(p.id,p.hid)
 // A Scan button HERE too (Andrew, 27 Jul 2026): once you are in, the
 // only way to look up another card was Done then re-type. At a busy
 // counter that is the wrong answer - scan the next bloke's card from
 // right here. Hidden unless the browser will actually allow a camera,
 // same rule as the landing page.
 html+='<div class="actions"><button class="primary" onclick="saveCard()">&#128241; Save picture</button><button onclick="printCard()">&#128424;&#65039; Print A4</button><button id="cardscan" onclick="startScan()" hidden>&#9635; Scan another</button><button onclick="reset()">Done</button></div>'
 +'<div class="subline" style="text-align:center">Save puts your report on your phone as a picture — no signal needed. Print gives you one clean A4 page; pick the store Wi-Fi printer in the print menu.</div>'
 +'<div class="ft">Coates · K2 Shutdown 2026 · Gladstone &middot; a keepsake of your shutdown<div class="val">Care Deeply · Customer Focused · Be Our Best · One Team · Competitive Spirit</div>POWERED BY SITEIQ · Author: Andrew Fisher</div></div>';
 document.getElementById('result').innerHTML=html;
 // the card's own Scan button lives inside that HTML, so reveal it now
 try{ revealScanControls(); }catch(e){}
 document.getElementById('landing').style.display='none';
 document.getElementById('result').style.display='block';
 window.scrollTo(0,0);
 var rp=document.querySelector('.ringp');
 if(rp){requestAnimationFrame(function(){requestAnimationFrame(function(){rp.style.strokeDashoffset=rp.getAttribute('data-off')})})}
 animate(); if((p.score||0)>=85||st.items===0||st.sameday>0) confetti();
}
function reset(){document.getElementById('result').style.display='none';document.getElementById('result').innerHTML='';document.getElementById('landing').style.display='block';document.getElementById('idno').value='';document.getElementById('idno').focus()}
document.getElementById('idno').addEventListener('keydown',function(e){if(e.key==='Enter')go()});
var STORES_TAG='__STORESTAG__';
__STOREJS__
__UIJS__
// self-test
try{var ok=JSON.parse(dec('SELFTEST',DATA[tag('SELFTEST')])).name==='SELFTEST';if(!ok)console.warn('selftest fail')}catch(e){console.warn('selftest err',e)}
</script></body></html>'''

if __name__ == '__main__':
    try:
        build()
    except SystemExit:
        raise
    except Exception as e:
        print('PROBLEM: the build fell over - ' + str(e))
        print('Nothing was overwritten. Check the exports are the standard '
              'SiteIQ pulls and run again.')
        sys.exit(1)
