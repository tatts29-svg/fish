#!/usr/bin/env python3
"""Put the issued VMS plan pack on the shared record (v10.24). A copy of upload_prestarts.py with the crew "vms"
(VMS plan) and no removals; otherwise the same checks, backups and hard stops. Original docstring follows.

Put the signed-off pre-start PDFs on the shared record and take down the "Retrospective prefill — unsigned"
copies they replace. Author: Andrew Fisher.

    python3 upload_prestarts.py                      # DRY RUN (default): reads the service, checks everything, writes nothing
    python3 upload_prestarts.py --apply              # does it - needs GC500_EDIT_TOKEN in the environment
    python3 upload_prestarts.py --only 2026-10-06    # one day only
    python3 upload_prestarts.py --crew fencing       # one crew only (coates | fencing)
    python3 upload_prestarts.py --no-remove          # upload the signed copies, leave the unsigned ones in place
    python3 upload_prestarts.py --manifest manifest.example.json --pdf-dir /somewhere   # dry-run against the example

Input: manifest.json beside this script (produced separately), a list of entries:
    {"file": "pdfs/GC500_Prestart_Coates_2026-10-06_Signed.pdf",
     "title": "Pre-start · Coates Installs · 2026-10-06 · Signed off",
     "note": "Signed off by Andrew Fisher, 15 Oct 2026", "kind": "pack", "day": "2026-10-06", "crew": "coates",
     "replaces": ["GC500_Prestart_Coates_2026-10-06_Retrospective_Unsigned.pdf"]}

The edit key is read from GC500_EDIT_TOKEN only. It goes to curl on its standard input as a header file, so it is
never in a process list, never printed, never written to a file; it is redacted from anything the service sends
back. Without --apply nothing is written. With --apply the order is: dry-run checks must pass -> the key must be
the edit key -> every file to be removed is downloaded into backup_<UTC>/ (git-ignored) and its sha256 checked ->
uploads, stopping on the first failure -> removals only after every upload succeeded -> a fresh read of the file
list proves each new title is there by Andrew Fisher, kind pack, and the replaced ids are gone -> report_<UTC>.json.
Standard library plus curl only.
"""
import argparse, hashlib, json, os, re, subprocess, sys, time
from pathlib import Path
from urllib.parse import quote

BASE = 'https://gc500-production.up.railway.app'
VIEW_TOKEN = 'Coates-GC500-2026'          # the public view link - read only
WHO = 'Andrew Fisher'                     # the "by" the page shows; never an agent name
HERE = Path(__file__).resolve().parent
DAY = re.compile(r'^\d{4}-\d{2}-\d{2}$')
SAFE_NAME = re.compile(r'^[A-Za-z0-9._-]+$')   # a name the service keeps as the id, character for character
CREWS = {'vms': 'VMS plan'}
REDACT = []                               # secrets to strip from anything printed or written


def redact(s):
    s = str(s)
    for t in REDACT:
        if t:
            s = s.replace(t, '[key]')
    return s


def enc(s):
    """encodeURIComponent, the way the page itself encodes the file headers"""
    return quote(str(s), safe="-_.!~*'()")


def utc_stamp():
    return time.strftime('%Y%m%dT%H%M%SZ', time.gmtime())


def sha256_of(path):
    h = hashlib.sha256()
    with open(path, 'rb') as f:
        for chunk in iter(lambda: f.read(1 << 20), b''):
            h.update(chunk)
    return h.hexdigest()


def curl(method, path, token, headers=None, data=None, out=None, max_time=300):
    """Run curl against the service. EVERY header, the token included, goes in on stdin as a header file (-H @-),
    so nothing secret is ever an argument. Returns (http_code, body_text_or_'' , error_text)."""
    cmd = ['curl', '-sS', '--max-time', str(max_time), '-X', method, '-H', '@-', '-w', '\n%{http_code}', BASE + path]
    cmd += ['-o', str(out)] if out else ['-o', '-']
    if data is not None:
        cmd += ['--data-binary', '@' + str(data)]
    lines = ['x-gc500-token: ' + token] + [f'{k}: {v}' for k, v in (headers or {}).items()]
    r = subprocess.run(cmd, input=('\n'.join(lines) + '\n').encode('utf-8'), capture_output=True)
    text = r.stdout.decode('utf-8', 'replace')
    body, _, code = text.rpartition('\n')
    err = redact(r.stderr.decode('utf-8', 'replace').strip())
    try:
        code = int(code.strip() or 0)
    except ValueError:
        code = 0
    return code, redact(body), err


def get_json(path, token=VIEW_TOKEN, what='the service'):
    code, body, err = curl('GET', path, token, max_time=120)
    if code != 200:
        sys.exit(f'STOP: GET {path} from {what} answered {code} {err or body[:200]}')
    try:
        return json.loads(body)
    except json.JSONDecodeError:
        sys.exit(f'STOP: GET {path} did not return JSON: {body[:200]}')


def load_manifest(path):
    try:
        entries = json.loads(Path(path).read_text('utf-8'))
    except FileNotFoundError:
        sys.exit(f'STOP: no manifest at {path}. Produce manifest.json beside this script, or dry-run the example with\n'
                 f'      --manifest manifest.example.json --pdf-dir <folder holding the pdfs>')
    except json.JSONDecodeError as e:
        sys.exit(f'STOP: {path} is not valid JSON: {e}')
    if not isinstance(entries, list) or not entries:
        sys.exit('STOP: the manifest must be a non-empty JSON list')
    return entries


# ----------------------------------------------------------------------------------------------- the dry-run checks
def check(entries, listing, pdf_dir, args):
    """Everything --apply relies on, with nothing written. Returns (plan, problems)."""
    files = listing.get('files') or []
    by_id = {f.get('id'): f for f in files}
    by_name = {f.get('name'): f for f in files}
    problems, plan = [], {'uploads': [], 'removals': []}
    seen_names, seen_titles, seen_replaced = set(), set(), set()

    for i, e in enumerate(entries):
        tag = f'entry {i + 1}'
        if not isinstance(e, dict):
            problems.append(f'{tag}: not an object'); continue
        for k in ('file', 'title', 'note', 'kind', 'day', 'crew'):
            if not isinstance(e.get(k), str) or not e.get(k).strip():
                problems.append(f'{tag}: "{k}" missing or empty')
        replaces = e.get('replaces', [])
        if not isinstance(replaces, list) or not all(isinstance(x, str) and x for x in replaces):
            problems.append(f'{tag}: "replaces" must be a list of file ids (may be empty)'); replaces = []
        if any(p.startswith(tag + ':') for p in problems):
            continue
        day, crew, title, kind = e['day'], e['crew'].lower(), e['title'], e['kind']
        if args.only and day != args.only:
            continue
        if args.crew and crew != args.crew:
            continue
        rel = e['file']
        local = Path(rel) if os.path.isabs(rel) else (pdf_dir / rel)
        name = local.name
        row = {'entry': i + 1, 'file': str(local), 'name': name, 'title': title, 'note': e['note'], 'kind': kind,
               'day': day, 'crew': crew, 'replaces': replaces, 'bytes': None, 'sha256': None, 'ok': True}
        tag = f'{tag} ({name})'

        # the manifest row itself
        if not DAY.match(day):
            problems.append(f'{tag}: day "{day}" is not YYYY-MM-DD'); row['ok'] = False
        if crew not in CREWS:
            problems.append(f'{tag}: crew "{crew}" is not vms'); row['ok'] = False
        if kind != 'pack':
            problems.append(f'{tag}: kind is "{kind}", the pre-start packs are kind "pack"'); row['ok'] = False
        if not name.lower().endswith('.pdf'):
            problems.append(f'{tag}: file name does not end in .pdf'); row['ok'] = False
        if not SAFE_NAME.match(name):
            problems.append(f'{tag}: file name has characters the service rewrites in the id - use letters, digits, . _ - only'); row['ok'] = False
        if day not in name or day not in title:
            problems.append(f'{tag}: the day {day} must appear in both the file name and the title'); row['ok'] = False
        if 'unsigned' in title.lower() or 'unsigned' in name.lower():
            problems.append(f'{tag}: a signed-off pre-start must not be titled or named "unsigned"'); row['ok'] = False
        if crew in CREWS and CREWS[crew] not in title:
            problems.append(f'{tag}: title does not name the crew "{CREWS[crew]}"'); row['ok'] = False
        if name in seen_names:
            problems.append(f'{tag}: file name appears twice in the manifest'); row['ok'] = False
        if title in seen_titles:
            problems.append(f'{tag}: title appears twice in the manifest'); row['ok'] = False
        seen_names.add(name); seen_titles.add(title)

        # the PDF on disk
        if not local.is_file():
            problems.append(f'{tag}: PDF not found at {local}'); row['ok'] = False
        else:
            with open(local, 'rb') as f:
                head = f.read(5)
            if head != b'%PDF-':
                problems.append(f'{tag}: {local} does not start with %PDF-'); row['ok'] = False
            row['bytes'] = local.stat().st_size
            row['sha256'] = sha256_of(local)
            if row['bytes'] == 0:
                problems.append(f'{tag}: PDF is empty'); row['ok'] = False

        # the service: the new name must be new, the replaced ids must be there and be the unsigned copies
        clash = by_id.get(name) or by_name.get(name)
        if clash:
            problems.append(f'{tag}: a file with this name is already on the service (id {clash.get("id")}, title {clash.get("title")!r}, by {clash.get("by")!r}) - the service makes the id from the name, so pick a new name'); row['ok'] = False
        same_title = [f for f in files if f.get('title') == title]
        if same_title:
            problems.append(f'{tag}: this exact title is already on the service as {same_title[0].get("id")}'); row['ok'] = False
        row['replaces_detail'] = []
        for rid in replaces:
            if rid in seen_replaced:
                problems.append(f'{tag}: {rid} is listed under "replaces" twice'); row['ok'] = False
            seen_replaced.add(rid)
            f = by_id.get(rid)
            if not f:
                problems.append(f'{tag}: replaces {rid}, which is not on the service'); row['ok'] = False; continue
            d = {'id': rid, 'title': f.get('title'), 'by': f.get('by'), 'kind': f.get('kind'), 'bytes': f.get('bytes'), 'sha256': f.get('sha256'), 'uploaded': f.get('uploaded')}
            row['replaces_detail'].append(d)
            if 'unsigned' not in str(f.get('title') or '').lower():
                problems.append(f'{tag}: replaces {rid}, but its title is {f.get("title")!r} - only "unsigned" copies are removed by this script'); row['ok'] = False
            if day not in rid:
                problems.append(f'{tag}: replaces {rid}, which is not the {day} file'); row['ok'] = False
            if not re.fullmatch(r'[0-9a-f]{64}', str(f.get('sha256') or '')):
                problems.append(f'{tag}: the service lists no sha256 for {rid}, so its backup could not be verified'); row['ok'] = False
        plan['uploads'].append(row)
        if not args.no_remove:
            for d in row['replaces_detail']:
                plan['removals'].append(d)

    if not plan['uploads']:
        problems.append('nothing selected from the manifest (check --only / --crew)')
    return plan, problems


def print_plan(plan, problems, listing_count):
    print(f'service file list read: {listing_count} files')
    for u in plan['uploads']:
        print(f'\n[{u["entry"]}] {u["name"]}')
        print(f'    title : {u["title"]}')
        print(f'    note  : {u["note"]}   kind: {u["kind"]}   day: {u["day"]}   crew: {u["crew"]}')
        print(f'    local : {u["file"]}')
        print(f'    bytes : {u["bytes"]}   sha256: {u["sha256"]}')
        print(f'    new on service: {"yes" if u["ok"] else "SEE PROBLEMS"}')
        for d in u.get('replaces_detail', []):
            print(f'    removes: {d["id"]}  ({d["title"]!r}, by {d["by"]!r}, {d["bytes"]} bytes)')
        for rid in u['replaces']:
            if rid not in [d['id'] for d in u.get('replaces_detail', [])]:
                print(f'    removes: {rid}  NOT ON THE SERVICE')
    print(f'\nPLAN: {len(plan["uploads"])} uploads, {len(plan["removals"])} removals')
    if problems:
        print(f'\nPROBLEMS ({len(problems)}) - nothing will be applied until these are fixed:')
        for p in problems:
            print('  - ' + p)


# ----------------------------------------------------------------------------------------------- --apply
def apply(plan, listing, args, report):
    tok = os.environ.get('GC500_EDIT_TOKEN', '')
    if not tok:
        sys.exit('STOP: GC500_EDIT_TOKEN is not set in the environment - nothing applied')
    REDACT.append(tok)

    # the key must be the edit key before anything is sent
    code, body, err = curl('GET', '/api/version', tok, max_time=60)
    try:
        level = json.loads(body).get('level')
    except Exception:
        level = None
    report['key_check'] = {'http': code, 'level': level}
    if code != 200 or level != 'edit':
        sys.exit(f'STOP: that key is not the edit key (service said {code} {level}) - nothing applied')
    print('key check: the service confirms edit access')
    report['attempted'] = True

    # back up every file that is about to be removed, and prove the copy is the one listed
    if plan['removals']:
        bdir = HERE / f'backup_{report["utc"]}'
        bdir.mkdir(mode=0o700, exist_ok=False)
        index = []
        for d in plan['removals']:
            dest = bdir / d['id']
            code, _, err = curl('GET', f'/f/{enc(VIEW_TOKEN)}/{enc(d["id"])}', VIEW_TOKEN, out=dest, max_time=120)
            if code != 200 or not dest.is_file():
                sys.exit(f'STOP: could not download {d["id"]} for the backup ({code} {err}) - nothing uploaded or removed')
            got = sha256_of(dest)
            if d.get('sha256') and got != d['sha256']:
                sys.exit(f'STOP: backup of {d["id"]} has sha256 {got}, the service lists {d["sha256"]} - nothing uploaded or removed')
            index.append({**d, 'backup': str(dest), 'backup_sha256': got, 'backup_bytes': dest.stat().st_size})
            print(f'backed up {d["id"]} ({dest.stat().st_size} bytes, sha256 {got[:16]}...)')
        (bdir / 'index.json').write_text(json.dumps({'author': WHO, 'taken': report['utc'], 'files': index}, indent=1, ensure_ascii=False) + '\n', 'utf-8')
        report['backup'] = {'folder': str(bdir), 'files': index}

    # uploads - stop on the first failure, removals never start
    report['uploads'] = []
    for u in plan['uploads']:
        rec = {'name': u['name'], 'title': u['title'], 'sha256': u['sha256'], 'bytes': u['bytes'], 'http': None, 'id': None, 'answer': None}
        report['uploads'].append(rec)
        headers = {'Content-Type': 'application/pdf', 'x-file-name': enc(u['name']), 'x-file-kind': u['kind'],
                   'x-file-title': enc(u['title']), 'x-file-note': enc(u['note']), 'x-gc500-who': WHO}
        code, body, err = curl('POST', '/api/files', tok, headers=headers, data=u['file'], max_time=600)
        rec['http'] = code
        try:
            ans = json.loads(body)
        except Exception:
            ans = {'raw': body[:300], 'stderr': err}
        rec['answer'] = ans
        if 200 <= code < 300 and isinstance(ans, dict) and ans.get('id'):
            rec['id'] = ans['id']
            print(f'uploaded {u["name"]} -> id {ans["id"]} ({code})')
            if ans.get('sha256') and ans['sha256'] != u['sha256']:
                # a hard stop (15 Oct 2026): the bytes the service holds are not the bytes that were checked, so no
                # later upload is sent and nothing is removed; the unsigned copies stay until this is looked at
                rec['error'] = 'service sha256 differs from the local file'
                print(f'   STOP: service sha256 {ans["sha256"]} differs from local {u["sha256"]}')
                report['stopped'] = f'service sha256 for {u["name"]} differs from the local file - later uploads and all removals were not attempted'
                return False
        else:
            print(f'UPLOAD FAILED for {u["name"]}: {code} {redact(json.dumps(ans)[:300])}')
            report['stopped'] = f'upload of {u["name"]} failed - later uploads and all removals were not attempted'
            return False

    # removals - only now that every upload succeeded
    report['removals'] = []
    if args.no_remove:
        print('--no-remove: the unsigned copies are left in place')
    for d in plan['removals']:
        rec = {'id': d['id'], 'http': None, 'answer': None}
        report['removals'].append(rec)
        code, body, err = curl('DELETE', f'/api/files/{enc(d["id"])}', tok, max_time=120)
        rec['http'] = code
        rec['answer'] = body[:300] or err
        if 200 <= code < 300:
            print(f'removed {d["id"]} ({code})')
        else:
            print(f'REMOVE FAILED for {d["id"]}: {code} {rec["answer"]}')
            report['stopped'] = f'removal of {d["id"]} failed - later removals were not attempted'
            return False

    # fresh read: what is on the service now
    after = get_json('/api/files', what='the service (after)')
    files = after.get('files') or []
    by_id = {f.get('id'): f for f in files}
    by_title = {f.get('title'): f for f in files}
    ver = {'ok': True, 'problems': [], 'files': []}
    for u in plan['uploads']:
        f = by_title.get(u['title'])
        if not f:
            ver['problems'].append(f'title not on the service after upload: {u["title"]!r}'); continue
        row = {'id': f.get('id'), 'title': f.get('title'), 'by': f.get('by'), 'kind': f.get('kind'), 'bytes': f.get('bytes'), 'sha256': f.get('sha256'), 'uploaded': f.get('uploaded')}
        ver['files'].append(row)
        if f.get('by') != WHO:
            ver['problems'].append(f'{f.get("id")}: by is {f.get("by")!r}, expected {WHO!r}')
        if f.get('kind') != 'pack':
            ver['problems'].append(f'{f.get("id")}: kind is {f.get("kind")!r}, expected "pack"')
        if f.get('sha256') and f.get('sha256') != u['sha256']:
            ver['problems'].append(f'{f.get("id")}: sha256 on the service differs from the local PDF')
        if 'unsigned' in str(f.get('title') or '').lower():
            ver['problems'].append(f'{f.get("id")}: title still says unsigned')
    if not args.no_remove:
        for d in plan['removals']:
            if d['id'] in by_id:
                ver['problems'].append(f'{d["id"]} is still on the service after its removal')
    ver['ok'] = not ver['problems']
    report['verification'] = ver
    print('\nVERIFIED' if ver['ok'] else '\nVERIFICATION PROBLEMS:')
    for p in ver['problems']:
        print('  - ' + p)
    for row in ver['files']:
        print(f'  {row["id"]}  by {row["by"]!r}  kind {row["kind"]}  {row["bytes"]} bytes')
    return ver['ok']


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('--apply', action='store_true', help='actually upload and remove (needs GC500_EDIT_TOKEN)')
    ap.add_argument('--only', metavar='YYYY-MM-DD', help='one day only')
    ap.add_argument('--crew', choices=sorted(CREWS), help='one crew only')
    ap.add_argument('--no-remove', action='store_true', help='upload only; leave the unsigned copies in place')
    ap.add_argument('--manifest', default=str(HERE / 'manifest.json'), help='manifest to read (default manifest.json beside this script)')
    ap.add_argument('--pdf-dir', default=str(HERE), help='folder the manifest "file" paths are relative to (default: this folder)')
    args = ap.parse_args()
    if args.only and not DAY.match(args.only):
        sys.exit('STOP: --only wants YYYY-MM-DD')
    # the key is only ever read in --apply; a dry run never touches it, but it is still redacted from any output
    if os.environ.get('GC500_EDIT_TOKEN'):
        REDACT.append(os.environ['GC500_EDIT_TOKEN'])

    entries = load_manifest(args.manifest)
    listing = get_json('/api/files', what='the service (view token)')
    plan, problems = check(entries, listing, Path(args.pdf_dir).resolve(), args)
    print_plan(plan, problems, len(listing.get('files') or []))

    if not args.apply:
        print('\nDRY RUN - nothing was written. Add --apply (with GC500_EDIT_TOKEN set) to do it.')
        sys.exit(0 if not problems else 2)

    if problems:
        sys.exit(f'\nSTOP: {len(problems)} problem(s) above - nothing applied')
    if not os.environ.get('GC500_EDIT_TOKEN'):
        sys.exit('STOP: GC500_EDIT_TOKEN is not set in the environment - nothing applied')
    report = {'author': WHO, 'utc': utc_stamp(), 'mode': 'apply', 'manifest': args.manifest,
              'options': {'only': args.only, 'crew': args.crew, 'no_remove': args.no_remove},
              'plan': {'uploads': [{k: v for k, v in u.items() if k != 'replaces_detail'} for u in plan['uploads']], 'removals': plan['removals']}}
    ok = False
    try:
        ok = apply(plan, listing, args, report)
    finally:
        # a report is written only once the service confirmed the key and something was attempted
        if report.get('attempted'):
            report['result'] = 'VERIFIED' if ok else 'INCOMPLETE - read the report'
            out = HERE / f'report_{report["utc"]}.json'
            out.write_text(redact(json.dumps(report, indent=1, ensure_ascii=False)) + '\n', 'utf-8')
            print(f'\nreport: {out}')
    sys.exit(0 if ok else 1)


if __name__ == '__main__':
    main()
