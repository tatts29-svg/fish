"""Author: Andrew Fisher. Source-backed fencing count correction and activity projection."""
import json
import re
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parents[1] / 'toolchain'))
from rep import rep as shared_rep


def rep(source, old, new, label):
    return shared_rep(source, old, new, label, __file__)


def constant(source, name):
    prefix = 'const ' + name + ' = '
    start = source.index(prefix) + len(prefix)
    value, size = json.JSONDecoder().raw_decode(source[start:])
    return source[start:start + size], value


def replace_constant(source, name, raw, value, label):
    # The shared replacement consumes whitespace before its match. Include the
    # declaration so DATA keeps the canonical spacing used by the build scrubber.
    prefix = 'const ' + name + ' = '
    serialized = json.dumps(value, ensure_ascii=True, separators=(',', ':'))
    # Some source catalogues deliberately escape factual author/by values. Keep
    # those original JSON spellings so a rebuild cannot turn them into prose.
    for token in dict.fromkeys(re.findall(r'"(?:\\.|[^"\\])*"', raw)):
        if '\\u' in token:
            canonical = json.dumps(json.loads(token), ensure_ascii=True)
            if canonical != token:
                serialized = serialized.replace(canonical, token)
    return rep(source, prefix + raw, prefix + serialized, label)


def gate_reviews(source):
    """Update only source expectations for the independently verified gate."""
    for name, path in [('DATA', ('fence_ccb_review847', 'rows')),
                       ('FENCE_REVIEW836', ('rows',)),
                       ('FENCE_TRACE837', ('rows',))]:
        raw, catalogue = constant(source, name)
        rows = catalogue
        for key in path:
            rows = rows[key]
        matches = [r for r in rows if r.get('record_id') == 'F-AFV-0002' and r.get('docket_no') == '36560']
        if len(matches) != 1 or matches[0]['expected']['quantities'] != {'clean': 507.5, 'ccb_demarc': 447.5}:
            raise ValueError('36560 source expectation changed: ' + name)
        row = matches[0]
        row['expected']['quantities']['ped_gates'] = 1
        if name == 'FENCE_REVIEW836':
            if row['query']['open'] is not True or 'One pedestrian gate' not in row['query']['text']:
                raise ValueError('36560 source question changed')
            row['query'] = {'open': False, 'text': 'Original pedestrian gate quantity 1 reconciled on 12 Oct 2026. CCB category follows the separately verified source-plan classification; original prices remain blank.'}
            row['reviewed_on'] = '2026-10-12'
        source = replace_constant(source, name, raw, catalogue, '36560 gate source expectation in ' + name)
    raw, catalogue = constant(source, 'FENCE_EVIDENCE849')
    matches = [r for r in catalogue['items'] if r.get('id') == 'ped-gate-gap-36560']
    if len(matches) != 1 or matches[0].get('quantity') != 1 or matches[0].get('status') != 'original-quantity-not-in-register':
        raise ValueError('36560 missing-gate evidence changed')
    catalogue['items'] = [r for r in catalogue['items'] if r['id'] != 'ped-gate-gap-36560']
    return replace_constant(source, 'FENCE_EVIDENCE849', raw, catalogue, 'retire reconciled missing-gate issue')


def patch(source):
    if 'physical-scrim-existing-24473' in source:
        raise ValueError('Fencing 996 is already present')
    if 'function fencingReview994' not in source or 'function fenceProgrammeReviews958' not in source:
        raise ValueError('Reviewed fencing base missing')
    source = gate_reviews(source)
    # 36589 has no embedded expected-record entry. Its correction is a separate
    # guarded native record action; no programme/source link is invented here.
    raw, progress = constant(source, 'FENCE_PROGRESS848')
    activity = json.loads((HERE / 'scrim_activity996.json').read_text())
    if any(r['id'] == activity['source']['id'] for r in progress['sources']):
        raise ValueError('24473 source already registered in physical evidence')
    progress['sources'].append(activity['source'])
    progress['operations'].append(activity['operation'])
    source = replace_constant(source, 'FENCE_PROGRESS848', raw, progress, 'reviewed existing-fence scrim activity')
    source = rep(source,
        "['relocation','removal','reinstatement','clean','scrim','v_gates','ped_gates','ccb_event','ccb_demarc'].includes(item.type)",
        "['relocation','removal','reinstatement','scrim_existing','clean','scrim','v_gates','ped_gates','ccb_event','ccb_demarc'].includes(item.type)",
        'separate scrim activity identity')
    source = rep(source,
        "if (!['relocation','removal','reinstatement'].includes(item.type) || primary.book === 'red') { reject(item, 'Only separately reviewed movement records may add physical work.'); continue; }",
        "if (!['relocation','removal','reinstatement','scrim_existing'].includes(item.type) || primary.book === 'red') { reject(item, 'Only separately reviewed service or movement records may add physical work.'); continue; }",
        'source-reviewed activity kind')
    source = rep(source,
        "const currentOverlap = records.filter(r => Number((r.quantities || {})[item.type]) > 0).map(r => snapshot(r, fields.red)).sort((a, b) => String(a.id).localeCompare(String(b.id)));",
        "const overlapType = item.type === 'scrim_existing' ? 'scrim' : item.type;\n      const sameSite996 = value => String(value || '').toLowerCase().replace(/[^a-z0-9]/g, '');\n      const currentOverlap = records.filter(r => Number((r.quantities || {})[overlapType]) > 0 && (item.type !== 'scrim_existing' ||\n        r.source_service_id === record.id || r.source_operation_id === record.id + ':scrim' ||\n        r.date === record.date && sameSite996(r.location) === sameSite996(record.location)))\n        .map(r => snapshot(r, fields.red)).sort((a, b) => String(a.id).localeCompare(String(b.id)));",
        'existing scrim overlap guard')
    source = rep(source,
        "result.activities = evidence.operations.filter(operation => operation.type === 'reinstatement');",
        "result.activities = evidence.operations.filter(operation => ['reinstatement','scrim_existing'].includes(operation.type));",
        'separate existing-fence activity')
    marker = "  if (health.stale) result.issues.push(health.basis + '.');\n  result.issues.push('Clean fence, scrim and movements may concern the same fence. No combined fencing percentage or unique-length total is inferred.');"
    block = (HERE / 'scrim_row996.js').read_text().rstrip()
    start = source.index('function todayFencingSummary848(asOf) {')
    end = source.index('function todayWorkSummary848(', start)
    source = source[:start] + rep(source[start:end], marker, block + '\n' + marker, 'shared recorded-only scrim row') + source[end:]
    start = source.index('function todayWorkSummary848(')
    end = source.index('function ', start + 9)
    source = source[:start] + rep(source[start:end],
        "    const plan = noPlan(row.unit, planBasis, 'Dated installation plan unconfirmed');",
        "    if (row.id === 'scrim_existing') {\n      const activity = noPlan(row.unit, row.note, row.evidencePending ? 'Source review required' : 'Recorded service activity');\n      activity.actual = row.evidencePending ? null : row.recorded;\n      return activity;\n    }\n    const plan = noPlan(row.unit, planBasis, 'Dated installation plan unconfirmed');",
        'service activity has no invented programme gap') + source[end:]
    source = rep(source,
        '  function fencingDetailHtml(row) {',
        '  function fencingDetailHtml(row) {\n' + (HERE / 'scrim_detail996.js').read_text().rstrip(),
        'concise recorded service activity detail')
    source = rep(source,
        "const allowed = ['ccb_unclassified', ...FCOL.filter(column => ['m','each','h','hr'].includes(column.unit)).map(column => column.key)];",
        "const allowed = ['ccb_unclassified','scrim_existing', ...FCOL.filter(column => ['m','each','h','hr'].includes(column.unit)).map(column => column.key)];",
        'source drill-down supports separate activity')
    source = rep(source,
        "const column = matches.length === 1 ? matches[0] : id === 'ccb_unclassified' ? {key:id,unit:'m',programme_type:null} : null;",
        "const column = matches.length === 1 ? matches[0] : ['ccb_unclassified','scrim_existing'].includes(id) ? {key:id,unit:'m',programme_type:null} : null;",
        'separate activity source unit')
    source = rep(source,
        "reinstatement: ['Fence reinstatement', 'm'],\n  ccb_event:",
        "reinstatement: ['Fence reinstatement', 'm'], scrim_existing: ['Scrim applied to existing fence', 'm'],\n  ccb_event:",
        'past-day activity label')
    source = rep(source,
        "list(env.operations).filter(r=>r.date===iso && ['relocation','removal','reinstatement'].includes(r.type)).forEach(r=>{",
        "list(env.operations).filter(r=>r.date===iso && ['relocation','removal','reinstatement','scrim_existing'].includes(r.type)).forEach(r=>{",
        'past-day activity once')
    return source


if __name__ == '__main__':
    if len(sys.argv) != 3:
        raise SystemExit('Usage: fencing996.py input.html output.html')
    Path(sys.argv[2]).write_text(patch(Path(sys.argv[1]).read_text()))
