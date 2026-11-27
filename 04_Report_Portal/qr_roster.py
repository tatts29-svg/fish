"""Import private, project-scoped worker badge links from SiteIQ workbooks."""
import contextlib
import datetime as dt
import fcntl
import io
import json
import os
from pathlib import Path
import re
import tempfile
import zipfile
from collections import defaultdict

import openpyxl

from upload_policy import MMG_PROJECT, MMG_SCHEDULE, check_workbook

MAX_BYTES = 12 * 1024 * 1024
MAX_EXPANDED = 64 * 1024 * 1024
MAX_ROWS = 25000
FILE = 'qr-identities.json'


def _normal(value):
    return ' '.join(value.casefold().split())


def _field(cell):
    if cell is None or cell.value is None:
        return ''
    value = cell.value
    if cell.data_type in ('f', 'e', 'b') or isinstance(value, bool):
        return ''
    if isinstance(value, (int, float)):
        # Excel preserves at most fifteen decimal digits in a numeric cell.
        if not isinstance(value, int) and not value.is_integer():
            return ''
        value = int(value)
        if value < 0 or value >= 10**15:
            return ''
        fmt = cell.number_format or 'General'
        if fmt.casefold() == 'general':
            return str(value)
        if re.fullmatch(r'0{1,128}', fmt):
            return str(value).zfill(len(fmt))
        return ''
    if not isinstance(value, str):
        return ''
    value = value.strip()
    return value if len(value) <= 256 and value.isprintable() else ''


def _headers(cells):
    fields = [_normal(_field(c)).replace('_', ' ') for c in cells]
    if len(set(k for k in fields if k)) != sum(bool(k) for k in fields):
        raise ValueError('The roster has duplicate column headings.')
    return {k: i for i, k in enumerate(fields) if k}


def _open(body):
    if not isinstance(body, bytes) or not body or len(body) > MAX_BYTES:
        raise ValueError('Choose an Excel workbook of 12 MiB or less.')
    stream = io.BytesIO(body)
    with zipfile.ZipFile(stream) as archive:
        files = archive.infolist()
        if (len(files) > 400 or sum(f.file_size for f in files) > MAX_EXPANDED
                or any(f.flag_bits & 1 or f.filename.lower().endswith('vbaproject.bin') for f in files)):
            raise ValueError('Choose an unencrypted Excel workbook within the roster size limits.')
        # A forged worksheet dimension or sparse last row must not cause Excel's
        # loader to materialise millions of blank records during schedule checks.
        for f in files:
            if f.filename.startswith('xl/worksheets/') and f.filename.endswith('.xml'):
                xml = archive.read(f)
                if any(len(r) > 5 or int(r) > MAX_ROWS + 1 for r in re.findall(
                        rb'<(?:[A-Za-z0-9_]+:)?row\b[^>]*?\br=["\']([0-9]+)["\']', xml)):
                    raise ValueError('The roster exceeds the worksheet limits.')
                for col, row in re.findall(rb'\br=["\']([A-Z]{1,3})([0-9]+)["\']', xml):
                    if len(col) > 2 or len(row) > 5 or int(row) > MAX_ROWS + 1:
                        raise ValueError('The roster exceeds the worksheet limits.')
                if re.search(rb'<!\s*(?:DOCTYPE|ENTITY)', xml, re.I):
                    raise ValueError('Choose a standard Excel workbook.')
    stream.seek(0)
    return openpyxl.load_workbook(stream, read_only=True, data_only=False, keep_links=False)


def _evidence(root):
    try:
        facts = json.loads((root / 'qr-report-data.json').read_text(encoding='utf-8'))
    except FileNotFoundError:
        return {}
    if facts.get('schedule') != MMG_SCHEDULE:
        raise ValueError('The current private report has no verified MMG schedule.')
    evidence = defaultdict(lambda: defaultdict(set))
    workers = facts.get('workers')
    if workers is None:
        workers = (row for group in ('hires', 'movements', 'draws') for row in facts.get(group, []))
    for row in workers:
        name = row.get('hirer', '')
        employer = row.get('employer', '')
        if not name or not employer:
            continue
        ids = evidence[(_normal(name), _normal(employer))][name, employer]
        if row.get('hirer_id'):
            ids.add(row['hirer_id'])
    return evidence


def _parse(root, body, confirmed):
    records = []
    skipped = 0
    with contextlib.closing(_open(body)) as book:
        stamped = 'REFERENCE_INFO' in book.sheetnames
        if stamped:
            check_workbook(io.BytesIO(body))
        if 'ON_HIRE' in book.sheetnames:
            if not stamped:
                raise ValueError('An on-hire export requires an MMG project reference.')
            kind, sheet = 'ON_HIRE', book['ON_HIRE']
        else:
            sheets = [s for s in book.worksheets if s.title != 'REFERENCE_INFO']
            if len(sheets) != 1:
                raise ValueError('Choose a SiteIQ hirer roster or MMG on-hire export.')
            kind, sheet = 'HIRERS_ID', sheets[0]
        sheet.reset_dimensions()
        rows = sheet.iter_rows()
        fields = _headers(next(rows, ()))
        name_key, co_key = ('hirer name', 'company') if kind == 'ON_HIRE' else ('name', 'employer')
        if kind == 'HIRERS_ID' and (name_key not in fields or co_key not in fields):
            name_key, co_key = 'hirer name', 'company'
        if not {name_key, co_key} <= fields.keys() or not {'hirer barcode', 'external id'} & fields.keys():
            raise ValueError('The workbook needs a hirer name, employer and a personal barcode or External ID.')
        if kind == 'ON_HIRE' and 'item number' not in fields:
            raise ValueError('The on-hire worksheet is missing its item number column.')
        row_stamp = 'project schedule' in fields
        attested_only = not stamped and not row_stamp
        if attested_only and confirmed is not True:
            raise ValueError('Confirm that this unstamped hirer roster belongs to MMG Dugald River.')
        if attested_only and 'status' not in fields:
            raise ValueError('An unstamped native hirer roster needs its Status column.')
        evidence = _evidence(root)
        if attested_only and not evidence:
            raise ValueError('Load current MMG report data before linking an unstamped roster.')
        for row_no, cells in enumerate(rows, 1):
            if row_no > MAX_ROWS:
                raise ValueError('The roster exceeds the worksheet limits.')
            if not any(c.value is not None for c in cells):
                continue
            def get(key):
                i = fields.get(key)
                return _field(cells[i]) if i is not None and i < len(cells) else ''
            if row_stamp and _normal(get('project schedule')) != _normal(MMG_SCHEDULE):
                raise ValueError('A roster row does not identify the MMG Dugald River schedule.')
            if 'project' in fields and _normal(get('project')) != _normal(MMG_PROJECT):
                raise ValueError('A roster row does not identify MMG Dugald River Mine.')
            name, employer = get(name_key), get(co_key)
            badges = tuple(dict.fromkeys(s for s in (get('hirer barcode'), get('external id')) if s))
            if not name or not employer:
                skipped += 1
                continue
            pair = (_normal(name), _normal(employer))
            candidates = evidence.get(pair, {})
            if attested_only and not candidates:
                skipped += 1
                continue
            exact_ids = set()
            if len(candidates) == 1:
                (name, employer), exact_ids = next(iter(candidates.items()))
            person_id = get('hirer id')
            ids = exact_ids | ({person_id} if person_id else set())
            status = _normal(get('status'))
            inactive = status in {'inactive', 'disabled', 'archived', 'deactivated', 'suspended', 'terminated', 'blocked'}
            conflicting = len(candidates) > 1 or len(ids) > 1 or status not in {'', 'active', 'enabled', 'current'} and not inactive
            if not badges and not inactive and not conflicting:
                skipped += 1
                continue
            records.append(dict(hirer=name, company=employer, hirer_id=next(iter(ids), ''),
                                badges=badges, inactive=inactive, conflicting=conflicting))
    return kind, records, skipped


def _pair(person):
    return _normal(person['hirer']), _normal(person['company'])


def _badges(person):
    return {s for s in (person.get('barcode'), *person.get('barcodes', [])) if s}


def _merge(kind, records, old):
    # On-hire exports cover current holders only. They cannot revoke an absent
    # worker or reinstate a badge previously disabled by a full roster.
    partial = kind == 'ON_HIRE'
    blocked = set(old.get('blocked_barcodes', [])) if partial else set()
    disabled = {tuple(k) for k in old.get('disabled_pairs', [])} if partial else set()
    groups = defaultdict(list)
    if partial:
        for p in old.get('people', []):
            if p.get('active') is False:
                disabled.add(_pair(p))
                blocked.update(_badges(p))
                continue
            groups[_pair(p)].append(dict(hirer=p['hirer'], company=p['company'], hirer_id=p.get('hirer_id', ''),
                                         badges=tuple(sorted(_badges(p))), inactive=False, conflicting=False))
    changed = set()
    rejected = set()
    for r in records:
        pk = _pair(r)
        changed.add(pk)
        if partial and set(r['badges']) & blocked:
            # A replay containing a retired badge must not retire a worker's
            # currently valid replacement credential.
            rejected.add(pk)
            continue
        groups[pk].append(r)
    candidates = {}
    conflicts = set()
    for pk, rows in groups.items():
        codes = {b for r in rows for b in r['badges']}
        ids = {r['hirer_id'] for r in rows if r['hirer_id']}
        if any(r['inactive'] for r in rows):
            disabled.add(pk)
        # Multiple rows for one asset holder are normal. Disjoint credentials
        # without a common authoritative worker ID can represent namesakes.
        shared = set(rows[0]['badges'])
        for r in rows[1:]:
            shared.intersection_update(r['badges'])
        disputed = len(ids) > 1 or (len(rows) > 1 and not shared and
                                     not (len(ids) == 1 and all(r['hirer_id'] for r in rows)))
        if disputed or any(r['conflicting'] for r in rows):
            conflicts.add(pk)
        if pk in disabled or pk in conflicts:
            blocked.update(codes)
            disabled.add(pk)
            continue
        if codes:
            r = rows[-1]
            primary = next(v for v in r['badges'] if v in codes)
            candidates[pk] = dict(name=r['hirer'], hirer=r['hirer'], company=r['company'], barcode=primary,
                                  barcodes=sorted(codes - {primary}), hirer_id=next(iter(ids), ''))
    by_badge = defaultdict(set)
    by_native_id = defaultdict(set)
    for k, p in candidates.items():
        for badge in _badges(p):
            by_badge[badge].add(k)
        if p.get('hirer_id'):
            by_native_id[p['hirer_id']].add(k)
    for keys in by_native_id.values():
        if len(keys) > 1:
            conflicts.update(keys)
            for k in keys:
                blocked.update(_badges(candidates[k]))
    for b, keys in by_badge.items():
        if len(keys) > 1:
            blocked.add(b)
            conflicts.update(keys)
    people = []
    for pk,p in candidates.items():
        if _badges(p) & blocked:
            disabled.add(pk)
            blocked.update(_badges(p))
        else:
            people.append(p)
    excluded = len(changed & (rejected | disabled))
    if not partial and not people:
        # A workbook of only inactive/ambiguous rows may explicitly revoke
        # known subjects, but cannot establish a complete replacement directory.
        people = [p for p in old.get('people', []) if p.get('active') is not False
                  and _pair(p) not in disabled and not _badges(p) & blocked]
    if not partial:
        # A partial on-hire file may be older than the full roster. Keep a
        # removed/replaced badge disabled until a later full roster restores it.
        current_badges = {c for p in people for c in _badges(p)}
        former = {c for p in old.get('people', []) for c in _badges(p)}
        blocked.update((former | set(old.get('blocked_barcodes', []))) - current_badges)
        live_pairs = {_pair(p) for p in people}
        disabled.update(({_pair(p) for p in old.get('people', [])}
                         | {tuple(k) for k in old.get('disabled_pairs', [])}) - live_pairs)
    _retain_verified_links(people, old.get('people', []))
    return people, sorted(blocked), sorted(disabled), excluded, len(changed & conflicts)


def _retain_verified_links(people, previous):
    """Retain administrator-verified links only across an evidenced identity continuation."""
    exact = defaultdict(list)
    badge_owners = defaultdict(set)
    id_owners = defaultdict(set)
    for p in previous:
        raw = (p['hirer'], p['company'])
        exact[raw].append(p)
        for b in _badges(p):
            badge_owners[b].add(raw)
        if p.get('hirer_id'):
            id_owners[p['hirer_id']].add(raw)
    active_pairs = {(p['hirer'], p['company']) for p in people}
    for p in people:
        raw = (p['hirer'], p['company'])
        old = exact[raw]
        if len(old) != 1 or old[0].get('active') is False:
            continue
        prior = old[0]
        incoming_id, prior_id = p.get('hirer_id'), prior.get('hirer_id')
        if incoming_id and prior_id and incoming_id != prior_id:
            continue
        same_id = bool(prior_id and incoming_id == prior_id and id_owners[prior_id] == {raw})
        shared = _badges(p) & _badges(prior)
        if not same_id and not any(badge_owners[b] == {raw} for b in shared):
            continue
        if prior_id and not incoming_id:
            p['hirer_id'] = prior_id
        if prior.get('person_id'):
            p['person_id'] = prior['person_id']
        for field, keys in (('aliases', ('hirer', 'company')), ('history', ('schedule', 'hirer', 'company'))):
            links = [{k: row[k] for k in keys} for row in prior.get(field, [])
                     if isinstance(row, dict) and all(isinstance(row.get(k), str) and row[k] for k in keys)]
            if field == 'aliases':
                links = [row for row in links if (row['hirer'], row['company']) == raw
                         or (row['hirer'], row['company']) not in active_pairs]
            if links:
                p[field] = links


def _load(root):
    try:
        data = json.loads((root / FILE).read_text(encoding='utf-8'))
    except FileNotFoundError:
        return {'schedule': MMG_SCHEDULE, 'people': []}
    if data.get('schedule') != MMG_SCHEDULE or not isinstance(data.get('people'), list):
        raise ValueError('The existing badge directory needs review.')
    return data


def status(data_dir):
    data = _load(Path(data_dir))
    return dict(linked=len(data['people']), updated=data.get('updated'), kind=data.get('kind'))


def import_roster(data_dir, body_bytes, *, confirmed_mmg=False):
    root = Path(data_dir)
    try:
        kind, records, skipped = _parse(root, body_bytes, confirmed_mmg)
    except ValueError:
        raise
    except Exception as exc:
        raise ValueError('Choose a readable SiteIQ Excel workbook.') from exc
    if not records:
        raise ValueError('No eligible MMG badge records were found. The directory was preserved.')
    root.mkdir(parents=True, exist_ok=True)
    with (root / '.qr-roster.lock').open('a') as lock:
        fcntl.flock(lock, fcntl.LOCK_EX)
        people, blocked, disabled, excluded, conflicts = _merge(kind, records, _load(root))
        updated = dt.datetime.now(dt.timezone.utc).isoformat(timespec='seconds')
        data = dict(schedule=MMG_SCHEDULE, people=people, updated=updated, kind=kind,
                    disabled_pairs=disabled, blocked_barcodes=blocked)
        with tempfile.NamedTemporaryFile(mode='w', encoding='utf-8', dir=root, prefix='.roster-', delete=False) as f:
            tmp = Path(f.name)
            try:
                json.dump(data, f, ensure_ascii=False, separators=(',', ':'))
                f.flush()
                os.fsync(f.fileno())
            except BaseException:
                tmp.unlink(missing_ok=True)
                raise
        try:
            os.replace(tmp, root / FILE)
            directory_fd = os.open(root, os.O_RDONLY | os.O_DIRECTORY)
            try:
                os.fsync(directory_fd)
            finally:
                os.close(directory_fd)
        finally:
            tmp.unlink(missing_ok=True)
    return dict(linked=len(people), skipped=skipped+excluded, conflicts=conflicts, kind=kind, updated=updated)
