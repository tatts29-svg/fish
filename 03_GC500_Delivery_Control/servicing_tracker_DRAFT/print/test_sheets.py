#!/usr/bin/env python3
"""Author: Andrew Fisher. Checks for the servicing sheets (make_sheets.py). Local only: nothing is sent anywhere.

    python3 -I test_sheets.py                 # builds into a temporary folder, reads the PDFs back
    ZXING=/path/to/site-packages python3 -I test_sheets.py   # where the zxing-cpp package is, to decode every QR code

What it checks
  - the draft builds from urls.json: page count, every page carries the track-only line, the twin-steer short form and
    the DRAFT ribbon; every reference, its 'how many' lines, its asset numbers and the tracker's job words are printed;
    every page with a map carries the drawing credit
  - every QR code decodes (pdftoppm at 300 dpi, zxing-cpp): each reference's completion QR is exactly its link and
    sits on its own block; each pinned reference's location QR is exactly the Google Maps pin; no unpinned reference
    has one; no QR is an /e/ or /v/ link
  - a live-format run (a made-up 32-character token and 16-character codes, made the way the server makes them, in a
    temporary folder) prints no DRAFT and its denser QR codes decode
  - refusals: an /e/ link, a missing reference, a link naming another reference, two tokens, a live run writing
    inside the repository
"""
import base64, hashlib, hmac, json, os, re, secrets, shutil, subprocess, sys, tempfile
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.dont_write_bytecode = True   # no __pycache__ left in the folder
sys.path.insert(0, str(HERE))
import make_sheets as M  # noqa: E402

OK = FAIL = 0
def check(name, ok, detail=''):
    global OK, FAIL
    if ok: OK += 1; print('PASS', name)
    else: FAIL += 1; print('FAIL', name, '::', str(detail)[:600])

def run(args, **kw):
    return subprocess.run([sys.executable, '-I', str(HERE / 'make_sheets.py')] + args, capture_output=True, text=True, **kw)

def pdftext(pdf):
    out = subprocess.run(['pdftotext', '-layout', str(pdf), '-'], capture_output=True, text=True, check=True).stdout
    return out.split('\f')[:-1] if out.endswith('\f') else out.split('\f')

def decode_pages(pdf, tmp, dpi=300):
    zx = os.environ.get('ZXING')
    if zx: sys.path.insert(0, zx)
    try:
        import zxingcpp
        from PIL import Image
    except Exception as e:
        return None, f'zxing-cpp not importable ({e}); set ZXING to its folder'
    d = Path(tmp) / ('png_' + Path(pdf).stem); d.mkdir()
    subprocess.run(['pdftoppm', '-r', str(dpi), '-png', str(pdf), str(d / 'p')], check=True)
    pages = {}
    for f in sorted(d.glob('p-*.png')):
        n = int(re.search(r'-(\d+)\.png$', f.name).group(1)); im = Image.open(f)
        res = zxingcpp.read_barcodes(im, formats=zxingcpp.BarcodeFormat.QRCode)
        pages[n] = [(r.text, (r.position.top_left.x + r.position.bottom_right.x) / 2, (r.position.top_left.y + r.position.bottom_right.y) / 2, im.size) for r in res]
    return pages, ''

def main():
    data = M.Data(HERE.parent / 'tracker_data.json')
    refs = [r['ref'] for r in data.refs]
    n_amaps = len([a for a in data.areas if a['n']])   # each of the 13 areas has its own master map after its cover
    expect_pages = 1 + len(data.areas) + n_amaps + sum((len(a['refs']) + 1) // 2 for a in data.areas)
    tmp = tempfile.mkdtemp(prefix='gc500sheets_', dir=os.environ.get('TMPDIR'))
    try:
        # ---------------------------------------------------------------- the draft
        draft = Path(tmp) / 'draft.pdf'
        r = run(['--out', str(draft)])
        check('draft builds', r.returncode == 0 and draft.exists(), r.stderr + r.stdout)
        warn = [l for l in r.stderr.splitlines() if 'warning' in l]
        check('no reference block runs past its half page', not warn, warn)
        urls = json.loads((HERE / 'urls.json').read_text())
        check('urls.json is the placeholder set, one per reference', all(urls.get(k) == f'{M.BASE}/d/{M.TEST_TOKEN}#r={k}.0000' for k in refs) and len([k for k in urls if not k.startswith('_')]) == len(refs))
        info = subprocess.run(['pdfinfo', str(draft)], capture_output=True, text=True).stdout
        n_pages = int(re.search(r'Pages:\s+(\d+)', info).group(1))
        check(f'page count is 1 master + {len(data.areas)} covers + {n_amaps} area master maps + reference pages = {expect_pages}', n_pages == expect_pages, n_pages)
        sizes = subprocess.run(['pdfinfo', '-f', '1', '-l', str(n_pages), str(draft)], capture_output=True, text=True).stdout
        ps = re.findall(r'Page\s+(\d+) size:\s+([\d.]+) x ([\d.]+)', sizes)
        kinds = ['master'] + [k for a in data.areas for k in ['cover'] + (['amaster'] if a['n'] else []) + ['refs'] * ((len(a['refs']) + 1) // 2)]
        land = {i for i, k in enumerate(kinds, 1) if k in ('master', 'amaster')}
        check('page sizes: master maps landscape, the rest portrait', ps and all((abs(float(w) - 841.89) < 1 and abs(float(h) - 595.28) < 1) if int(n) in land else (abs(float(w) - 595.28) < 1 and abs(float(h) - 841.89) < 1) for n, w, h in ps), ps[:3])
        T = pdftext(draft)
        check('text extracted for every page', len(T) == n_pages, len(T))
        norm = [re.sub(r'\s+', ' ', t) for t in T]
        check('every page: the track-only line', all(M.TRACK_ONLY in t for t in norm), [i + 1 for i, t in enumerate(norm) if M.TRACK_ONLY not in t])
        ts = re.sub(r'\s+', ' ', M.TWIN_STEER)
        check('every page: the NO TWIN-STEER TRUCKS short form, word for word', all(ts in t for t in norm), [i + 1 for i, t in enumerate(norm) if ts not in t][:5])
        check('every page: DRAFT ribbon', all('DRAFT - TEST QR CODES' in t for t in norm))
        check('every page: contact fallback does not refer to absent paperwork', all('Servicing contact not confirmed' in t for t in norm) and not any('whose name is on your paperwork' in t for t in norm))
        check('every page: Author: Andrew Fisher', all('Author: Andrew Fisher' in t for t in norm))
        credit = 'Drawing © iEDM · D001'
        check('master map carries the drawing credit', credit in norm[0])
        # which pages carry a map
        page_of = {}; plan = []
        for a in data.areas:
            plan.append(('cover', a, None))
            if a['n']: plan.append(('amaster', a, None))
            for i in range(0, len(a['refs']), 2): plan.append(('refs', a, a['refs'][i:i + 2]))
        maps = json.loads((HERE / 'maps' / 'maps.json').read_text())
        missing_credit = []
        for i, (kind, a, rs) in enumerate(plan, 2):
            has_map = kind == 'amaster' or (kind == 'cover' and maps['areas'][str(a['n'])]['main']) or (kind == 'refs' and any(maps['positions'][x['ref']] for x in rs))
            if has_map and credit not in norm[i - 1]: missing_credit.append(i)
            if kind == 'refs':
                for x in rs: page_of[x['ref']] = i
        check('every page with a map carries "Drawing © iEDM · D001"', not missing_credit, missing_credit)
        # the master map legend: every area, its counts
        M.setup_fonts(); cw = (841.89 - 18 * M.mm) / 7 - 8.5 * M.mm
        bad = [a['name'] for a in data.areas if not all(line in norm[0] for line in M.wrap(a['name'], 'narrowb', 7.6, cw))]
        check('master map legend names every area (as the legend wraps it)', not bad, bad)
        bad = [a['n'] for a in data.areas if f"{len(a['refs'])} location" not in norm[0] or f"{data.units(a['refs'])} unit" not in norm[0]]
        check('master map legend: locations and units for every area', not bad, bad)
        check('master map: the totals', f'{len(refs)} locations' in norm[0] and f'{data.units(data.refs)} units' in norm[0])
        # each area's own master map, straight after its cover (Andrew, 19 Oct 2026: "Each 13 sheets should have a master map")
        bad = []
        for i, (kind, a, rs) in enumerate(plan, 2):
            if kind != 'amaster': continue
            t = norm[i - 1]
            if plan[i - 3][0] != 'cover' or plan[i - 3][1] is not a: bad.append((a['n'], 'not straight after its cover'))
            if f"AREA {a['n']} " not in t or 'WHERE IT IS ON THE SITE' not in t or f"Area {a['n']}: {len(a['refs'])} location" not in t: bad.append((a['n'], 'title/counts'))
            if any(f"{len(b['refs'])} location" not in t for b in data.areas): bad.append((a['n'], 'legend'))
            if not maps['areas'][str(a['n'])]['main'] and 'is not on the master plan - ask on site' not in t: bad.append((a['n'], 'not-on-plan warning'))
        check(f'every one of the {n_amaps} areas has its own master map after its cover: its name, counts, the full legend', not bad and sum(k == 'amaster' for k, *_ in plan) == n_amaps, bad)
        # covers
        for i, (kind, a, rs) in enumerate(plan, 2):
            if kind != 'cover': continue
            t = norm[i - 1]
            ok = a['name'] in t and f"{len(a['refs'])} location" in t and all(x['ref'] in t for x in a['refs'])
            jobs_ok = all(str(data.jobs(a['refs'], p)) in t for p in data.plan_days())
            if not (ok and jobs_ok): check(f'cover {a["n"]}: name, counts, jobs, every reference', False, t[:300]); break
        else: check('every area cover: name, locations, units, jobs a night, every reference listed', True)
        short = [a['n'] for i, (kind, a, rs) in enumerate(plan, 2) if kind == 'cover' and 'HOW TO USE' in norm[i - 1] and 'A service day runs 08:00 to 08:00' not in norm[i - 1]]
        check('every How to use box has all five steps (none dropped for space)', not short, short)
        # reference blocks
        probs = []
        for x in data.refs:
            t = norm[page_of[x['ref']] - 1]
            if x['ref'] not in t: probs.append((x['ref'], 'ref'))
            for l in x['lines']:
                if l['label'] not in t: probs.append((x['ref'], l['label']))
                for no in l['nos']:
                    if no not in t: probs.append((x['ref'], no))
            for l in x['lines']:
                for day in data.days:
                    for task in data.plans[l['kind']][day['plan']]:
                        if data.tasks[task] not in t: probs.append((x['ref'], data.tasks[task]))
            if 'Scan when done - tick your jobs' not in t: probs.append((x['ref'], 'completion label'))
            if x['pin'] and 'Scan for directions' not in t: probs.append((x['ref'], 'location label'))
            if not x['pin'] and 'No pin on the record - ask on site' not in t: probs.append((x['ref'], 'no pin label'))
        check('every reference: big REF, how many per line, every asset number, its job words, both QR labels', not probs, probs[:10])
        fwf_sun = [x['ref'] for x in data.refs if any(l['kind'] == 'fwf' for l in x['lines']) and 'Sun 25 night: extra: Locked & confirmed empty · no water.' not in norm[page_of[x['ref']] - 1]]
        check('FWF blocks say Sunday night: extra lock, no water', not fwf_sun, fwf_sun[:5])
        tank_only = [x['ref'] for x in data.refs if all(l['kind'] == 'tank' for l in x['lines'])]
        check('(no reference is a waste tank alone, so tank-only wording is shown inside its block)', True, tank_only)
        # QR codes
        pages, why = decode_pages(draft, tmp)
        if pages is None:
            check('QR codes decode (SKIPPED: ' + why + ')', False, why)
        else:
            want_comp = {urls[k]: k for k in refs}
            seen = {}
            bad_links = [q for qs in pages.values() for q, *_ in qs if '/e/' in q or '/v/' in q]
            check('no QR is an edit (/e/) or view (/v/) link', not bad_links, bad_links)
            for n, qs in pages.items():
                for q, x, y, size in qs: seen.setdefault(q, []).append((n, y / size[1]))
            missing = [k for k in refs if urls[k] not in seen]
            check(f'every completion QR decodes at 300 dpi ({len(refs)})', not missing, missing)
            wrong_page = [k for k in refs if urls[k] in seen and any(n != page_of[k] for n, _ in seen[urls[k]])]
            check('each completion QR is on its own reference\'s page and nowhere else', not wrong_page, wrong_page)
            # top block or bottom block
            half = []
            for a in data.areas:
                for i in range(0, len(a['refs']), 2):
                    for j, x in enumerate(a['refs'][i:i + 2]):
                        for n, fy in seen.get(urls[x['ref']], []):
                            if (fy < 0.5) != (j == 0): half.append(x['ref'])
            check('each completion QR sits in its own half of the page', not half, half)
            pinned = [x for x in data.refs if x['pin']]
            loc_bad = [x['ref'] for x in pinned if M.maps_url(x['pin']) not in seen or any(n != page_of[x['ref']] for n, _ in seen[M.maps_url(x['pin'])])]
            check(f'every pinned reference\'s location QR decodes to its Google Maps pin ({len(pinned)})', not loc_bad, loc_bad)
            maps_qr = [q for q in seen if q.startswith('https://www.google.com/maps/')]
            check('no other location QR (unpinned references have none)', len(maps_qr) == len({M.maps_url(x['pin']) for x in pinned}), len(maps_qr))
            stray = [q for q in seen if q not in want_comp and not q.startswith('https://www.google.com/maps/search/?api=1&query=')]
            check('no stray QR codes', not stray, stray)
            check('nothing but completion and location QR codes on the covers and master map', all(not pages.get(i) for i, (k, *_ ) in enumerate([('master',)] + plan, 1) if k in ('master', 'amaster', 'cover')))

        # ---------------------------------------------------------------- live format (made-up token, never the real one)
        secret = secrets.token_bytes(32); token = base64.urlsafe_b64encode(secrets.token_bytes(24)).decode().rstrip('=')
        sig = lambda ref: base64.urlsafe_b64encode(hmac.new(secret, (token + ':' + ref).encode(), hashlib.sha256).digest()).decode().rstrip('=')[:16]
        links = Path(tmp) / 'links.json'; links.write_text(json.dumps({'token': token, 'links': {k: sig(k) for k in refs}}))
        live = Path(tmp) / 'live.pdf'
        r = run(['--links', str(links), '--out', str(live)])
        check('live-format run builds outside the repository', r.returncode == 0 and live.exists(), r.stderr + r.stdout)
        if live.exists():
            Tl = [re.sub(r'\s+', ' ', t) for t in pdftext(live)]
            check('signed links default to TEST, not a crew-ready pack', all('TEST TRACKER - PRACTICE ONLY' in t for t in Tl) and not any('opens nothing' in t for t in Tl))
            check('contact fallback on every TEST page is honest', all('Servicing contact not confirmed' in t for t in Tl))
            check('live-format run: the token is never printed as text', not any(token in t for t in Tl))
            pl, why = decode_pages(live, tmp)
            if pl is not None:
                got = {q for qs in pl.values() for q, *_ in qs}
                exp = {f'{M.BASE}/d/{token}#r={k}.{sig(k)}' for k in refs}
                check(f'live-format completion QR codes ({len(refs)}, ~{len(next(iter(exp)))} characters) all decode at 300 dpi', exp <= got, len(exp - got))
        r = run(['--links', str(links), '--out', str(HERE / 'should_not_exist.pdf')])
        check('live run refuses to write inside the repository', r.returncode != 0 and 'refused' in (r.stderr + r.stdout) and not (HERE / 'should_not_exist.pdf').exists(), r.stderr)

        # Explicit real mode requires the confirmed contact and independent readiness evidence.
        r = run(['--links', str(links), '--mode', 'real', '--out', str(Path(tmp) / 'unguarded.pdf')])
        check('real pack refuses without a confirmed contact', r.returncode != 0 and 'contact' in r.stderr)
        r = run(['--links', str(links), '--mode', 'real', '--contact-name', 'Fixture supervisor', '--contact-phone', '0400 000 000', '--out', str(Path(tmp) / 'unguarded.pdf')])
        check('real pack refuses without a readiness receipt', r.returncode != 0 and 'readiness receipt' in r.stderr)

        # ---------------------------------------------------------------- refusals
        def bad_urls(mut, name):
            u = {k: v for k, v in urls.items() if not k.startswith('_')}; mut(u)
            fn = re.sub(r'[^A-Za-z0-9]+', '_', name)
            p = Path(tmp) / (fn + '.json'); p.write_text(json.dumps(u))
            r = run(['--urls', str(p), '--out', str(Path(tmp) / (fn + '.pdf'))])
            check('refuses ' + name, r.returncode != 0 and not (Path(tmp) / (fn + '.pdf')).exists(), r.stdout + r.stderr)
        bad_urls(lambda u: u.__setitem__(refs[0], u[refs[0]].replace('/d/', '/e/')), 'an edit (/e/) link')
        bad_urls(lambda u: u.__setitem__(refs[0], 'https://gc500-production.up.railway.app/v/Coates-GC500-2026'), 'a view (/v/) link')
        bad_urls(lambda u: u.pop(refs[1]), 'a missing reference')
        bad_urls(lambda u: u.__setitem__(refs[2], u[refs[3]]), 'a link naming another reference')
        bad_urls(lambda u: u.__setitem__(refs[4], u[refs[4]].replace(M.TEST_TOKEN, 'ANOTHER-TOKEN-1234567')), 'two different tokens')
        bad_urls(lambda u: u.__setitem__('ZZ99', u[refs[0]].replace('#r=' + refs[0], '#r=ZZ99')), 'a reference the tracker does not have')
    finally:
        if os.environ.get('KEEP'): print('kept', tmp)
        else: shutil.rmtree(tmp, ignore_errors=True)
    print(f'\n{OK} passed, {FAIL} failed')
    sys.exit(1 if FAIL else 0)

if __name__ == '__main__':
    main()
