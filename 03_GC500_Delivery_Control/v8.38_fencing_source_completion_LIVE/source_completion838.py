"""Author: Andrew Fisher. Add reviewed private source evidence to the exact live host."""
from copy import deepcopy
import hashlib
import importlib.util
import json
import math
import os
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT.parent / 'toolchain'))
from rep import rep

BASE_SHA256 = '7b4999508c0006c56cb580e448b89d2044f556da367684e094038342003544fd'
MARKER = '/* v8.38 verified source completion */'


def require(value, message):
    if not value:
        raise ValueError(message)


def digest(value):
    return hashlib.sha256(json.dumps(value, sort_keys=True, separators=(',', ':'), ensure_ascii=False, allow_nan=False).encode()).hexdigest()


def dependency(version, filename):
    folders = list(ROOT.parent.glob(version + '_*'))
    require(len(folders) == 1, 'Expected one preserved dependency: ' + version)
    path = folders[0] / filename
    spec = importlib.util.spec_from_file_location(filename[:-3] + '_838_dependency', path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def bound_input(path, expected):
    require(isinstance(path, str) and Path(path).is_absolute(), 'Private absolute input path required')
    require(isinstance(expected, str) and len(expected) == 64, 'Reviewed input SHA-256 required')
    raw = Path(path).read_bytes()
    require(hashlib.sha256(raw).hexdigest() == expected, 'Private reviewed input changed')
    value = json.loads(raw)
    require(value.get('schema') == 1 and value.get('author') == 'Andrew Fisher', 'Unknown private input schema/author')
    return value


def constant(text, name):
    anchor = 'const ' + name + ' = '
    require(text.count(anchor) == 1, 'Expected one existing constant: ' + name)
    start = text.index(anchor) + len(anchor)
    value, size = json.JSONDecoder().raw_decode(text[start:])
    require(text[start + size:start + size + 1] == ';', 'Constant terminator changed')
    return value, start, start + size


def unique_union(existing, incoming, key, label, replace_ids=()):
    result = deepcopy(existing)
    by_key = {r[key]: i for i, r in enumerate(result)}
    require(len(by_key) == len(result), 'Ambiguous existing ' + label)
    seen = set()
    replace_ids = set(replace_ids)
    require(replace_ids <= set(by_key), 'Replacement identity is not existing: ' + label)
    for row in incoming:
        identity = row[key]
        require(identity not in seen, 'Duplicate incoming ' + label)
        seen.add(identity)
        if identity in by_key:
            if identity in replace_ids:
                result[by_key[identity]] = deepcopy(row)
            else:
                require(result[by_key[identity]] == row, 'Existing ' + label + ' changed without reviewed replacement')
        else:
            result.append(deepcopy(row))
    require(replace_ids <= seen, 'Replacement was declared but not supplied: ' + label)
    return result


def merge_review(base, raw, cleaned):
    require(raw.get('base_review_sha256') == digest(base), 'Existing source review changed')
    replacements = raw.get('replace_record_ids', [])
    require(isinstance(replacements, list) and len(replacements) == len(set(replacements)), 'Review replacements must be unique')
    previous = {r['record_id']: r for r in base['rows']}
    for row in cleaned['rows']:
        if row['record_id'] in previous:
            old = previous[row['record_id']]
            # Clarifying source handwriting cannot silently alter quantities, a P/O
            # association, or the native identity that the review authenticates.
            for key in ('record_id', 'docket_no', 'book', 'expected', 'po', 'summary'):
                require(row[key] == old[key], 'Review update changes recorded identity/quantity/P/O basis')
    result = deepcopy(base)
    result['sources'] = unique_union(base['sources'], cleaned['sources'], 'id', 'review source')
    result['rows'] = unique_union(base['rows'], cleaned['rows'], 'record_id', 'review row', replacements)
    require(len({r['docket_no'] for r in result['rows']}) == len(result['rows']), 'Ambiguous reviewed docket number')
    return result


def validate_catalogue_delta(base, raw, checked_file):
    require(raw.get('base_catalogue_sha256') == digest(base), 'Existing map catalogue changed')
    require(isinstance(raw.get('sources'), list) and isinstance(raw.get('geometry'), list), 'Map source/geometry delta required')
    master = checked_file(raw.get('master_path'), base['master_sha256'], 'Current master')
    require(master['media_type'] == 'application/pdf', 'Master must be the current PDF')
    import fitz
    with fitz.open(raw['master_path']) as pdf:
        require(len(pdf) == 1, 'Expected one native master sheet')
        width, height = pdf[0].rect.width, pdf[0].rect.height
    source_fields = ('id', 'label', 'short_label', 'revision', 'pages', 'sha256', 'document_file', 'note')
    sources = []
    existing_sources = base['sources'] + base.get('reference_sources', [])
    existing_ids = {s['id'] for s in existing_sources}
    for src in raw['sources']:
        require(set(src) == set(source_fields) | {'path'}, 'New plan descriptor must use the existing exact source schema')
        require(all(isinstance(src[k], str) and src[k] for k in source_fields if k != 'pages'), 'Plan identity/wording required')
        require(src['id'] not in existing_ids, 'Existing plan sources cannot be rewritten')
        require('/' not in src['document_file'] and '\\' not in src['document_file'], 'Plan registry ID must be path-free')
        actual = checked_file(src['path'], src['sha256'], 'New plan')
        require(actual == {'media_type': 'application/pdf', 'pages': src['pages']}, 'New plan page count/type changed')
        sources.append({k: src[k] for k in source_fields}); existing_ids.add(src['id'])
    source_by_sha = {s['sha256']: s for s in existing_sources + sources}
    allowed_geometry = {'author', 'id', 'kind', 'role', 'region', 'point', 'points', 'master_sha256', 'source_file', 'source_sha256', 'source_page', 'source_revision', 'source_date_conflict', 'source_pixel_point', 'source_panel_sha256', 'source_label', 'source_task_description', 'source_planned_date', 'area_evidence_names', 'evidence_snapshot_sha256', 'reviewed_basis', 'permitted_status_label', 'status_scope', 'excluded_evidence_names', 'confidence', 'line_completion_permitted', 'task_completion_permitted', 'coordinate_space', 'transformation_lineage', 'task_ids', 'category', 'label', 'alignment'}
    geoms = []
    existing_geom_ids = {g['id'] for g in base['geometry']}
    reviews = raw.get('geometry_reviews', [])
    require(isinstance(reviews, list) and len({r.get('geometry_id') for r in reviews}) == len(reviews), 'Unique private geometry reviews required')
    reviews = {r['geometry_id']: r for r in reviews}
    for g in raw['geometry']:
        require(isinstance(g, dict), 'Area geometry must be an object')
        require(set(g) <= allowed_geometry and '/workspace/' not in json.dumps(g) and '/tmp/' not in json.dumps(g), 'Geometry contains unexpected/private fields')
        require('source_date_conflict' not in g or isinstance(g['source_date_conflict'], str) and g['source_date_conflict'].strip(), 'Source-date qualification must be nonempty text')
        require(isinstance(g, dict) and isinstance(g.get('id'), str) and g['id'] and g['id'] not in existing_geom_ids, 'Only unique additive geometry allowed')
        require(g.get('kind') == 'anchor' and g.get('role') == 'area-signoff' and g.get('category') == 'unclassified', 'Only reviewed area anchors allowed')
        require(g.get('master_sha256') == base['master_sha256'], 'Area master changed')
        source = source_by_sha.get(g.get('source_sha256'))
        require(source and type(g.get('source_page')) is int and 1 <= g['source_page'] <= source['pages'] and g.get('source_revision') == source['revision'], 'Area source lineage changed')
        require(g.get('task_ids') == [] and g.get('area_evidence_names') == [] and g.get('line_completion_permitted') is False and g.get('task_completion_permitted') is False, 'Source-area link must not create task/completion evidence')
        points = g.get('points')
        require(isinstance(points, list) and len(points) == 1 and isinstance(points[0], list) and len(points[0]) == 2 and all(type(x) in (int, float) and math.isfinite(x) for x in points[0]), 'One finite native-master area point required')
        require(0 <= points[0][0] <= width and 0 <= points[0][1] <= height, 'Area point lies outside the native master')
        require(g.get('point', points[0]) == points[0], 'Area point representations disagree')
        require(isinstance(g.get('label'), str) and g['label'] and isinstance(g.get('region'), str) and g['region'], 'Area label/region required')
        alignment = g.get('alignment', {})
        require(alignment.get('setout') is False and isinstance(alignment.get('method'), str) and alignment['method'], 'Area registration method and non-setout scope required')
        review = reviews.get(g['id'])
        require(review and review.get('geometry_sha256') == digest(g) and review.get('master_sha256') == base['master_sha256'] and review.get('source_sha256') == source['sha256'] and review.get('source_page') == g['source_page'] and review.get('scope') == 'area' and review.get('approved') is True, 'Exact independently reviewed area geometry proof required')
        require(isinstance(review.get('basis'), str) and review['basis'] and isinstance(review.get('reviewed_on'), str) and review['reviewed_on'], 'Area review basis/date required')
        require(not any(k in g for k in ('metres', 'length', 'cost', 'amount', 'completed', 'done')), 'Area anchors cannot carry measured work or financial totals')
        json.dumps(g, allow_nan=False)
        geoms.append(deepcopy(g)); existing_geom_ids.add(g['id'])
    require(set(reviews) == {g['id'] for g in geoms}, 'Orphan geometry review')
    require(raw.get('coverage', []) == [], 'Area anchors do not assert source-line coverage')
    result = deepcopy(base)
    # The existing explorer reserves reference_sources for the native master.
    # Current plan PDFs belong in sources even when they only supply area context.
    result['sources'] = base['sources'] + sources
    result['geometry'] = base['geometry'] + geoms
    return result


def merge_trace(base, raw, cleaned):
    require(raw.get('base_trace_sha256') == digest(base), 'Existing map trace changed')
    replace_ids = raw.get('replace_record_ids', [])
    require(isinstance(replace_ids, list) and len(replace_ids) == len(set(replace_ids)), 'Trace replacement list must be unique')
    before = {r['record_id']: r for r in base['rows']}
    for row in cleaned['rows']:
        if row['record_id'] in before:
            old = before[row['record_id']]
            require(all(row[k] == old[k] for k in ('record_id', 'docket_no', 'book', 'expected')), 'Map update cannot change native identity/signature')
            require(set(old['area_ids']) <= set(row['area_ids']), 'Existing reviewed area links must be preserved')
    out = deepcopy(base)
    for key, identity in [('sources', 'id'), ('areas', 'id'), ('rows', 'record_id')]:
        out[key] = unique_union(base[key], cleaned[key], identity, 'trace ' + key, replace_ids if key == 'rows' else [])
    require(len({r['docket_no'] for r in out['rows']}) == len(out['rows']), 'Duplicate trace docket identity')
    require(cleaned.get('relations', []) == [], 'Source completion does not add financial/activity parent relations')
    require(cleaned.get('unmapped', []) == [], 'Unmapped records are retained from the current host')
    now_mapped = {r['record_id'] for r in cleaned['rows'] if r['area_ids']}
    out['unmapped'] = [r for r in base['unmapped'] if r['record_id'] not in now_mapped]
    return out


def apply(text, review_path=None, review_sha=None, map_path=None, map_sha=None):
    require(MARKER not in text, 'Source completion already applied')
    require(hashlib.sha256(text.encode()).hexdigest() == BASE_SHA256, 'Exact live v8.37 host required')
    review = dependency('v8.36_fencing_review_status', 'fencing_review836.py')
    trace = dependency('v8.37_fencing_map_trace', 'fencing_trace837.py')
    review_path = review_path or os.environ.get('FENCE_REVIEW838_INPUT')
    map_path = map_path or os.environ.get('FENCE_MAP838_INPUT')
    review_raw = bound_input(review_path, review_sha or os.environ.get('FENCE_REVIEW838_INPUT_SHA256'))
    map_raw = bound_input(map_path, map_sha or os.environ.get('FENCE_MAP838_INPUT_SHA256'))
    old_review = constant(text, 'FENCE_REVIEW836')[0]
    old_map = constant(text, 'PRIVATE_INPUT')[0]
    old_trace = constant(text, 'FENCE_TRACE837')[0]
    new_review = merge_review(old_review, review_raw, review.load_input(review_path))
    new_map = validate_catalogue_delta(old_map, map_raw, review.checked_file)
    require(isinstance(map_raw.get('trace'), dict), 'Reviewed trace delta required')
    # The inherited validator insists on exact private source bytes and strips all
    # paths. A private temporary validation file is never embedded or published.
    import tempfile
    with tempfile.TemporaryDirectory(prefix='gc500-review838-') as td:
        fp = Path(td) / 'trace.json'
        payload = json.dumps(map_raw['trace'], ensure_ascii=False, allow_nan=False).encode()
        fp.write_bytes(payload)
        clean_trace = trace.load_input(new_map, str(fp), hashlib.sha256(payload).hexdigest())
    new_trace = merge_trace(old_trace, map_raw, clean_trace)
    replacements = [('FENCE_REVIEW836', new_review), ('PRIVATE_INPUT', new_map), ('FENCE_TRACE837', new_trace)]
    for name, value in replacements:
        _, start, end = constant(text, name)
        text = text[:start] + trace.safe_json(value) + text[end:]
    require('function fenceTraceReveal837(' in text and 'main.scrollTop=Math.max' in text, 'Preserve current content-only scroll handling')
    require('function pricingAction834(' in text, 'Preserve pricing context handling')
    context_source = (ROOT / 'source_context838.js').read_text()
    changes = [
        ('function fenceTraceRegister837(d){', context_source + '\nfunction fenceTraceRegister837(d){'),
        ('links[k]=items;', '''if(binding&&!binding.area_ids.length){
   const seen=new Set();for(const proof of binding.evidence){
    const plan=[...catalogue.sources,...(catalogue.reference_sources||[])].find(p=>p.document_file===proof.source_id);
    const id=proof.source_id+':'+proof.page;if(!plan||seen.has(id)||core.documentState(proof,FENCE_TRACE837.sources,files))continue;
    const link=fenceTraceLink837(photoFor({id:proof.source_id}),'Open '+(plan.short_label||plan.label)+' · page '+proof.page,proof.page);
    if(link){items.push({...link,kind:'area-context'});seen.add(id);}
   }
  }
  links[k]=items;'''),
        ('</div>${window.GC500FencingTraceView837.recordCommercial(trace,window.GC500FencingTrace837.key(d))}`;', '</div>${fenceTraceContext838(row)}${window.GC500FencingTraceView837.recordCommercial(trace,window.GC500FencingTrace837.key(d))}`;'),
    ]
    for old, new in changes:
        require(text.count(old) == 1, 'Exact source-context host anchor changed')
        text = text.replace(old, new, 1)
    anchor = 'const FENCE_REVIEW836 = '
    rep(text, anchor, MARKER + '\n' + anchor, 'Source completion marker', 'v8.38')
    return text.replace(anchor, MARKER + '\n' + anchor, 1)
