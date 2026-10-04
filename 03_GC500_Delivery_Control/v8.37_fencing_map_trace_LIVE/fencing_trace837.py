"""Author: Andrew Fisher. Validate private area evidence; patch generic read-only views."""
import hashlib
import importlib.util
import json
import os
from pathlib import Path
import re
import sys
from datetime import date

ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT.parent / 'toolchain'))
from rep import rep


def require(ok, message):
    if not ok:
        raise ValueError(message)


def previous():
    folders = list(ROOT.parent.glob('v8.36_fencing_review_status_*'))
    require(len(folders) == 1, 'Expected one reviewed v8.36 component')
    spec = importlib.util.spec_from_file_location('fencing_review836_dependency', folders[0] / 'fencing_review836.py')
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def exact(text, old, new, label):
    rep(text, old, new, label, 'v8.37')
    require(text.count(old) == 1, 'Expected exact single anchor: ' + label)
    return text.replace(old, new, 1)


def read_bound(path, expected):
    require(path and isinstance(expected, str) and re.fullmatch(r'[a-f0-9]{64}', expected), 'Private input path and reviewed SHA-256 are required')
    raw = Path(path).read_bytes()
    require(hashlib.sha256(raw).hexdigest() == expected, 'Private input changed since review')
    return json.loads(raw)


def identity(row, allow_unnumbered=False):
    require(isinstance(row, dict) and row.get('book') in ('red', 'green', 'blue'), 'Unknown book identity')
    require(isinstance(row.get('record_id'), str) and row['record_id'], 'Record ID is required')
    require(isinstance(row.get('docket_no'), str) and row['docket_no'] or allow_unnumbered and row.get('docket_no') is None, 'Docket number is required for a reviewed association')
    return {k: row[k] for k in ('record_id', 'docket_no', 'book')}


def load_input(catalogue, path=None, expected=None):
    data = read_bound(path or os.environ.get('FENCE_TRACE837_INPUT'), expected or os.environ.get('FENCE_TRACE837_INPUT_SHA256'))
    require(data.get('schema') == 1 and data.get('author') == 'Andrew Fisher', 'Wrong trace schema or author')
    require(data.get('master_sha256') == catalogue.get('master_sha256'), 'Master drawing changed')
    old = previous()
    sources, source_ids = [], set()
    for source in data.get('sources', []):
        sid = source.get('id')
        require(isinstance(sid, str) and sid and '/' not in sid and '\\' not in sid and sid not in source_ids, 'Source identity must be unique and path-free')
        checked = old.checked_file(source.get('path'), source.get('sha256'), 'Trace source')
        require(source.get('pages') == checked['pages'] and source.get('media_type') == checked['media_type'], 'Source page count or media type changed')
        require(isinstance(source.get('title'), str) and source['title'], 'Source title required')
        sources.append({k: source[k] for k in ('id', 'sha256', 'pages', 'media_type', 'title')})
        source_ids.add(sid)
    require(sources, 'Trace sources required')
    by_source = {s['id']: s for s in sources}

    def proofs(items):
        require(isinstance(items, list) and items, 'Reviewed source proof required')
        out = []
        for p in items:
            source = by_source.get(p.get('source_id'))
            require(source and p.get('sha256') == source['sha256'], 'Evidence source fingerprint changed')
            require(type(p.get('page')) is int and 1 <= p['page'] <= source['pages'], 'Evidence page outside original')
            out.append({k: p[k] for k in ('source_id', 'sha256', 'page')})
        return out

    areas, area_ids = [], set()
    for a in data.get('areas', []):
        require(a.get('id') == a.get('geometry_id') and a['id'] not in area_ids, 'Area identity must be unique existing geometry')
        geoms = [g for g in catalogue['geometry'] if g['id'] == a['geometry_id']]
        plans = [s for s in catalogue['sources'] + catalogue.get('reference_sources', []) if s['id'] == a.get('source_id')]
        require(len(geoms) == 1 and len(plans) == 1, 'Area geometry/source identity changed')
        g, p = geoms[0], plans[0]
        fields = {'id', 'kind', 'role', 'points', 'master_sha256', 'source_sha256', 'source_page', 'region', 'area_evidence_names'}
        require(set(a.get('expected_geometry', {})) == fields and a['expected_geometry'] == {k: g.get(k) for k in fields}, 'Exact reviewed geometry changed')
        require(g.get('kind') == 'anchor' and g.get('role') == 'area-signoff' and a.get('scope') == 'area', 'Only existing reviewed area anchors are supported')
        require(a.get('master_sha256') == catalogue['master_sha256'] and a.get('source_sha256') == p['sha256'] and a.get('source_revision') == p['revision'] and a.get('source_page') == g['source_page'] and a.get('region') == g['region'], 'Area lineage changed')
        proofs([{'source_id': p['document_file'], 'sha256': p['sha256'], 'page': a['source_page']}])
        require(all(isinstance(a.get(k), str) and a[k] for k in ('label', 'basis')), 'Area wording required')
        areas.append({k: a[k] for k in ('id', 'label', 'geometry_id', 'master_sha256', 'source_id', 'source_sha256', 'source_page', 'source_revision', 'region', 'scope', 'expected_geometry', 'basis')})
        area_ids.add(a['id'])
    rows, ids, numbers = [], set(), set()
    extra = ['note', 'map_ref', 'scope', 'to_be_charged', 'not_charged_here', 'as_written']
    for row in data.get('rows', []):
        clean = identity(row)
        require(row['record_id'] not in ids and row['docket_no'] not in numbers, 'Duplicate record identity')
        fields = old.FIELDS[row['book']] + (extra if row['book'] == 'red' else [])
        require(isinstance(row.get('expected'), dict) and set(row['expected']) == set(fields), 'Incomplete reviewed record signature')
        json.dumps(row['expected'], allow_nan=False)
        require(row.get('scope') == 'area' and row.get('activity') in ('install', 'additional_bracing', 'relocate', 'remove', 'collect', 'stockpile', 'service', 'unknown'), 'Unsupported area/activity scope')
        require(isinstance(row.get('area_ids'), list) and len(row['area_ids']) == len(set(row['area_ids'])) and set(row['area_ids']) <= area_ids, 'Unknown or duplicate area')
        require(all(isinstance(row.get(k), str) and row[k] for k in ('location_as_written', 'basis', 'reviewed_on')), 'Reviewed row wording required')
        require(date.fromisoformat(row['reviewed_on']).isoformat() == row['reviewed_on'], 'Review day must be ISO date')
        clean.update({k: row[k] for k in ('expected', 'area_ids', 'scope', 'activity', 'location_as_written', 'basis', 'reviewed_on')})
        clean['evidence'] = proofs(row.get('evidence'))
        rows.append(clean); ids.add(row['record_id']); numbers.add(row['docket_no'])
    relations = []
    by_record = {r['record_id']: r for r in rows}
    for r in data.get('relations', []):
        require(r.get('child_record_id') in ids and r.get('parent_record_id') in ids and r['child_record_id'] != r['parent_record_id'], 'Relation endpoints need reviewed records')
        require(r.get('expected_child') == by_record[r['child_record_id']]['expected'] and r.get('expected_parent') == by_record[r['parent_record_id']]['expected'], 'Relation signatures differ from reviewed endpoints')
        require(all(isinstance(r.get(k), str) and r[k] for k in ('kind', 'basis')), 'Relation source wording required')
        clean = {k: r[k] for k in ('child_record_id', 'parent_record_id', 'kind', 'basis', 'expected_child', 'expected_parent')}; clean['evidence'] = proofs(r.get('evidence')); relations.append(clean)
    unmapped, unkeys = [], set()
    for u in data.get('unmapped', []):
        clean = identity(u, allow_unnumbered=True); k = tuple(clean.values())
        require(k not in unkeys and isinstance(u.get('reason'), str) and u['reason'], 'Unmapped identity/reason must be unique')
        clean['reason'] = u['reason']; unmapped.append(clean); unkeys.add(k)
    return {'schema': 1, 'author': 'Andrew Fisher', 'master_sha256': data['master_sha256'], 'sources': sources, 'areas': areas, 'rows': rows, 'relations': relations, 'unmapped': unmapped}


def catalogue_of(text):
    anchor = 'const PRIVATE_INPUT = '
    require(text.count(anchor) == 1, 'Expected the existing private map catalogue')
    return json.JSONDecoder().raw_decode(text.split(anchor, 1)[1])[0]


def safe_json(data):
    # Exact record signatures are machine data. Protect only their name bytes from
    # the standard narrative-attribution scrub; visible basis prose still scrubs.
    def encode(value, signature=False):
        if isinstance(value, dict):
            return '{' + ','.join(json.dumps(k) + ':' + encode(v, signature or k in ('expected', 'expected_child', 'expected_parent')) for k, v in value.items()) + '}'
        if isinstance(value, list):
            return '[' + ','.join(encode(v, signature) for v in value) + ']'
        token = json.dumps(value, ensure_ascii=False, allow_nan=False)
        return token.replace('Andrew Fisher', r'\u0041ndrew Fisher') if signature and isinstance(value, str) else token
    return encode(data).replace('<', '\\u003c').replace('>', '\\u003e').replace('&', '\\u0026').replace('\u2028', '\\u2028').replace('\u2029', '\\u2029')


def apply(text, path=None, expected=None):
    require('function fencingReview836(' in text and 'function fenceTraceSnapshot837(' not in text, 'Exact reviewed-source predecessor required; repeat refused')
    data = load_input(catalogue_of(text), path, expected)
    from commercial_trace837 import load_commercial
    data['commercial'] = load_commercial(data, read_bound, require)
    source = 'const FENCE_TRACE837 = ' + safe_json(data) + ';\n' + (ROOT / 'source/fencing-trace-core837.js').read_text() + '\n' + (ROOT / 'source/fencing-trace-view837.js').read_text() + '\n' + (ROOT / 'source/fencing-trace-host837.js').read_text()
    style = '<style id="fencing-trace-host837">\n' + (ROOT / 'source/fencing-trace-host837.css').read_text() + '</style>\n'
    changes = [
        ('</head>\n<body>', style + '</head>\n<body>', 'Commercial detail styles scoped to the register'),
        ("explorer/index.html?embed=1&back=", "explorer/index.html?embed=1&trace=837&back=", 'Invalidate the previous embedded explorer index'),
        ('function fencePrivatePapers(d){', source + '\nfunction fencePrivatePapers(d){', 'Read-only trace model'),
        ('window.gc500FencingMapSnapshot = function(){', 'window.gc500FencingTraceCatalogue837 = ()=>PRIVATE_INPUT;\nwindow.gc500FencingMapSnapshot = function(){', 'Existing catalogue reader'),
        ('areaEvidence,sectionEvidence:[],received_at:new Date().toISOString()', 'areaEvidence,sectionEvidence:[],trace:fenceTraceSnapshot837(PRIVATE_INPUT),received_at:new Date().toISOString()', 'Current trace in existing map snapshot'),
        ('function fencePrivateApply(){', 'function fencePrivateApply(){\n FENCE_TRACE_RENDER837=fenceTraceCurrent837();', 'One trace projection per register render'),
        ('${fenceReviewDetails836(review,paper)}', '${fenceReviewDetails836(review,paper)}${fenceTraceRegister837(d)}', 'Reverse navigation in existing source details'),
    ]
    for old, new, label in changes:
        text = exact(text, old, new, label)
    return text
