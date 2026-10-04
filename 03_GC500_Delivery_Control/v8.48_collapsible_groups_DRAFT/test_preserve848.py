#!/usr/bin/env python3
"""Author: Andrew Fisher. Independent v8.48 source and preservation boundaries.

Private input files are read in memory. Output names checks and hashes only; it
does not reproduce private source records, commercial figures or documents.
"""
from copy import deepcopy
from pathlib import Path
import argparse
import hashlib
import importlib.util
import json
import re
import sys

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent
PREVIOUS = ROOT / 'v8.47_fencing_category_audit_LIVE'
sys.path.insert(0, str(PREVIOUS))
from fencing_corrections847 import apply_corrections, json_value

BASE_SHA256 = 'c2541d7e51dec18187f9163a213fd6c77d607d8a50823b7c3234354019172f21'


def read(relative):
    return (ROOT / relative).read_text(encoding='utf-8')


def function(text, name):
    """Same top-level function boundary used by the v8.47 preservation suite."""
    start = re.search(r'^(?:async )?function ' + re.escape(name) + r'\(', text, re.M)
    if not start:
        return None
    end = re.search(r'^(?:async )?function \w+\(', text[start.end():], re.M)
    return text[start.start():start.end() + end.start()] if end else None


def resolved_day(source):
    spec = importlib.util.spec_from_file_location('preserve848_day842', ROOT / 'v8.42_today_plan_clarity_LIVE/patch_v842.py')
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module.resolved_day(source)


def main():
    parser = argparse.ArgumentParser()
    for name in ('base', 'candidate', 'corrections', 'catalogue', 'progress'):
        parser.add_argument('--' + name, required=True)
    args = parser.parse_args()
    raw_base, raw_candidate = Path(args.base).read_bytes(), Path(args.candidate).read_bytes()
    base, candidate = raw_base.decode('utf-8'), raw_candidate.decode('utf-8')
    checks = []

    def check(name, ok):
        checks.append((name, bool(ok)))
        print(('PASS ' if ok else 'FAIL ') + name)

    def one_replace(text, old, new, label):
        count = text.count(old)
        check(label + ' is a unique exact boundary', count == 1)
        return text.replace(old, new, 1) if count == 1 else text

    check('base is the exact verified v8.47 public page', hashlib.sha256(raw_base).hexdigest() == BASE_SHA256)
    check('candidate release identifies v8.48 exactly once', candidate.count('<meta name="gc500-release" content="v8.48">') == 1)
    manifest = json.loads(Path(args.corrections).read_text(encoding='utf-8'))
    catalogue = json.loads(Path(args.catalogue).read_text(encoding='utf-8'))
    progress = json.loads(Path(args.progress).read_text(encoding='utf-8'))
    base_data = json_value(base, 'const DATA = ')[0]
    actual_data = json_value(candidate, 'const DATA = ')[0]
    base_catalogue = base_data.pop('fence_ccb_review847')
    actual_catalogue = actual_data.pop('fence_ccb_review847')
    base_review = json_value(base, 'const FENCE_REVIEW836 = ')[0]
    base_trace = json_value(base, 'const FENCE_TRACE837 = ')[0]
    actual_review = json_value(candidate, 'const FENCE_REVIEW836 = ')[0]
    actual_trace = json_value(candidate, 'const FENCE_TRACE837 = ')[0]
    actual_progress = json_value(candidate, 'const FENCE_PROGRESS848 = ')[0]
    corrections = manifest.get('corrections', [])
    check('private category input equals the complete unchanged base catalogue', catalogue == base_catalogue)
    check('manifest contains exactly one assessed whole CCB transfer', len(corrections) == 1 and
          corrections[0].get('from_type') == 'ccb_event' and corrections[0].get('to_type') == 'ccb_demarc' and
          isinstance(corrections[0].get('quantity'), (int, float)) and corrections[0]['quantity'] > 0 and
          corrections[0]['quantity'] == corrections[0].get('expected', {}).get('quantities', {}).get('ccb_event') and
          corrections[0].get('assessment_method') == 'assessed' and
          corrections[0].get('assessment_confidence') == 'medium')
    expected_data, expected_review, expected_trace, expected_catalogue = apply_corrections(
        base_data, base_review, base_trace, catalogue, manifest, BASE_SHA256)
    for correction in corrections:
        matches = [row for row in expected_catalogue['rows'] if row['record_id'] == correction['record_id']]
        if len(matches) != 1:
            raise ValueError('Assessment must bind to one catalogue row')
        matches[0]['decision'].update(method=correction['assessment_method'], confidence=correction['assessment_confidence'])
    check('DATA delta equals only the exact source correction manifest', actual_data == expected_data)
    check('review delta equals only exact source correction bindings', actual_review == expected_review)
    check('trace delta equals only exact source correction bindings', actual_trace == expected_trace)
    check('CCB catalogue contains only the correction and explicit assessment metadata', actual_catalogue == expected_catalogue)
    check('physical progress evidence is separate from DATA and exactly equals private input',
          actual_progress == progress and 'FENCE_PROGRESS848' not in base and
          not any('progress848' in key.lower() for key in actual_data))
    check('physical progress catalogue has the exact source base and author', progress.get('schema') == 1 and
          progress.get('author') == 'Andrew Fisher' and progress.get('base_sha256') == BASE_SHA256)

    # Independent restoration proves preservation without trusting the mutator's
    # entire expected output: only two fields on one source docket may differ.
    old_rows = {row['id']: row for row in base_data['ops']['fencing']['dockets']}
    allowed = {row['record_id']: row for row in corrections}
    restored = deepcopy(actual_data)
    changed_ids = []
    for row in restored['ops']['fencing']['dockets']:
        old = old_rows.get(row['id'])
        if row != old:
            changed_ids.append(row['id'])
        if row['id'] not in allowed:
            continue
        correction = allowed[row['id']]
        check('target docket preserves dates, components and every cached cost/source field',
              {k: v for k, v in row.items() if k not in {'quantities', 'note'}} ==
              {k: v for k, v in old.items() if k not in {'quantities', 'note'}})
        check('target docket retains exact physical CCB metres and all other quantities',
              sum(old['quantities'].get(k, 0) for k in ('ccb_event', 'ccb_demarc')) ==
              sum(row['quantities'].get(k, 0) for k in ('ccb_event', 'ccb_demarc')) == correction['quantity'] and
              {k: v for k, v in row['quantities'].items() if k not in {'ccb_event', 'ccb_demarc'}} ==
              {k: v for k, v in old['quantities'].items() if k not in {'ccb_event', 'ccb_demarc'}})
        check('target audit note preserves original wording and the exact assessed basis',
              row['note'] == correction['after_note'] and row['note'].startswith(old['note'] + ' ') and correction['basis'] in row['note'])
        row['quantities'], row['note'] = deepcopy(old['quantities']), old['note']
    check('only the explicitly named docket changes', changed_ids == list(allowed))
    check('all other DATA including programme, native rates and financial source records is unchanged', restored == base_data)
    check('all map geometry, areas, relations, source inventory and unmapped associations are unchanged',
          {k: v for k, v in base_trace.items() if k != 'rows'} ==
          {k: v for k, v in actual_trace.items() if k != 'rows'})
    changed_trace = {row['record_id'] for row in actual_trace['rows'] if row not in base_trace['rows']}
    check('changed mapped bindings are limited to the assessed source record', changed_trace <= set(allowed))
    check('existing category source rows remain complete and in their original order',
          [(row['record_id'], row['docket_no']) for row in actual_catalogue['rows']] ==
          [(row['record_id'], row['docket_no']) for row in base_catalogue['rows']])

    def rejects(label, mutation):
        variant = deepcopy(manifest)
        mutation(variant)
        try:
            apply_corrections(base_data, base_review, base_trace, catalogue, variant, BASE_SHA256)
        except ValueError:
            check(label, True)
        else:
            check(label, False)

    rejects('manifest rejects another base revision', lambda m: m.update(base_sha256='0' * 64))
    rejects('manifest rejects a duplicate correction identity', lambda m: m['corrections'].append(deepcopy(m['corrections'][0])))
    rejects('manifest rejects a partial physical quantity transfer', lambda m: m['corrections'][0].update(quantity=m['corrections'][0]['quantity'] / 2))
    rejects('manifest rejects a changed original docket signature', lambda m: m['corrections'][0]['expected'].update(date='2000-01-01'))
    rejects('manifest rejects an unbound evidence checksum', lambda m: m['corrections'][0]['evidence'][0].update(sha256='0' * 64))
    rejects('manifest rejects replacement of the original audit note', lambda m: m['corrections'][0].update(after_note='Replacement'))

    for relative in [
        'v8.41_timeline_fencing_clarity_LIVE/fencing_metrics841_src.js',
        'v8.41_timeline_fencing_clarity_LIVE/group_details841_src.js',
        'v8.42_today_plan_clarity_LIVE/work_summary842_src.js',
        'v8.44_linked_completion_LIVE/linked_references844_src.js',
        'v8.41_timeline_fencing_clarity_LIVE/timeline841_src.js',
        'v8.41_timeline_fencing_clarity_LIVE/supplier_print841_src.js',
        'v8.47_fencing_category_audit_LIVE/fencing_metrics847_src.js',
        'v8.47_fencing_category_audit_LIVE/work_summary847_src.js',
        'v8.47_fencing_category_audit_LIVE/fencing_other_views847_src.js',
    ]:
        source = read(relative)
        check(Path(relative).name + ' existing model/controller remains byte-exact', source in base and source in candidate)
    for name in ['setDone', 'deliveryOf', 'deliveryAsOf', 'assetStatusAsOf', 'chargeLines', 'dsnState_',
                 'tradeCharges', 'contractCharge', 'fenceTypes', 'fenceDerived', 'moneySummary', 'greenBookTotals',
                 'costDocket', 'allDockets', 'fenceByWeek', 'recordHireAgreement', 'renderTimeline', 'renderPlant',
                 'renderCosts', 'dsnBoard', 'renderCoatesWay', 'destinationOf', 'dest782', 'navTargetFor',
                 'showOnMap', 'openAsset', 'dropPhotosOf', 'filedPhotosOf', 'photoFor', 'lineNumbersOf']:
        before = function(base, name)
        check(name + ' native implementation remains byte-exact', before is not None and before == function(candidate, name))
    check('native financial functions have no replacement assignment', not re.search(
        r'(?:costDocket|allDockets|fenceByWeek|fenceTypes|fenceDerived)\s*=\s*(?:function|\()', candidate))

    # Revert every explicitly allowed code/presentation change in memory and
    # compare the whole page. This catches extra constants, side effects or any
    # unlisted change even when a sampled native-function check would miss it.
    normal = candidate
    for prefix in ('const DATA = ', 'const FENCE_REVIEW836 = ', 'const FENCE_TRACE837 = '):
        _, old_start, old_end = json_value(base, prefix)
        _, new_start, new_end = json_value(normal, prefix)
        normal = normal[:new_start] + base[old_start:old_end] + normal[new_end:]
    _, progress_start, progress_end = json_value(candidate, 'const FENCE_PROGRESS848 = ')
    progress_literal = candidate[progress_start:progress_end]
    additions = 'const FENCE_PROGRESS848 = ' + progress_literal + ';\n\n' + '\n\n'.join(
        (HERE / name).read_text(encoding='utf-8') for name in
        ['fencing_metrics848_src.js', 'work_summary848_src.js', 'linked_fencing848_src.js'])
    normal = one_replace(normal, additions + '\n\n' + resolved_day((HERE / 'today_work848_src.js').read_text()),
                         resolved_day(read('v8.47_fencing_category_audit_LIVE/today_work847_src.js')), 'new Today modules and separate progress evidence')
    linked_start = base.index('/* Author: Andrew Fisher. v8.44 read-only links beside existing fencing quantities.')
    linked_source = read('v8.44_linked_completion_LIVE/linked_fencing844_src.js')
    # The stored original footer makes the exact block end independent of the
    # next module's comments, which the legacy function reader also includes.
    footer = linked_source[linked_source.index('function todayLinkedToiletSupplier844'):]
    linked_end = base.index(footer, linked_start) + len(footer)
    linked = base[linked_start:linked_end]
    old_guard = "    if (!docket.date || !/^\\d{4}-\\d{2}-\\d{2}$/.test(docket.date) || docket.date > day || !docket.usable) continue;\n    const datedWeek = weeks.find(week => week.start && week.end && week.start <= docket.date && week.end >= docket.date);\n    if (datedWeek && !['Build', 'Event'].includes(datedWeek.phase)) continue;\n    if (!buildNames.has(docket.week) || datedWeek && datedWeek.sheet !== docket.week || (docket.scope || 'programme') !== 'programme') continue;\n"
    check('linked fencing base has the exact original v8.47 inclusion guard', linked.count(old_guard) == 1)
    new_linked = linked.replace(old_guard, "    if (fenceInstallationDocketState848(docket, day) !== 'included') continue;\n")
    normal = one_replace(normal, new_linked, linked, 'linked fencing changes only the shared scope predicate')
    types = read('v8.43_type_instruments_LIVE/type_metrics843_src.js').replace('todayWorkSummary842(', 'todayWorkSummary847(').replace('todayFencingSummary841(', 'todayFencingSummary847(').replace("groupId: 'Build programme', groupName: 'Build programme'", "groupId: 'Build programme', groupName: 'Installation programme · Build + Event'").replace('Recorded Build work by type.', 'Recorded installation work by type.')
    normal = one_replace(normal, types.replace('todayWorkSummary847(', 'todayWorkSummary848(').replace('todayFencingSummary847(', 'todayFencingSummary848('), types, 'default type API changes only the selected summary providers')
    classification = read('v8.47_fencing_category_audit_LIVE/fencing_classification847_src.js')
    assessed = classification.replace("result.reviewState = 'current'; result.reason = row.decision.basis;", "result.reviewState = 'current'; result.reason = row.decision.basis; result.assessed = row.decision.method === 'assessed'; result.confidence = row.decision.confidence || null;")
    normal = one_replace(normal, assessed, classification, 'v8.47 classification adds only assessment provenance')
    ui = read('v8.47_fencing_category_audit_LIVE/fencing_ui847_src.js')
    assessed_ui = ui.replace("? 'CCB category confirmed'", "? (review.assessed ? 'CCB category assessed' : 'CCB category confirmed')").replace("? 'CCB category confirmed.'", "? (review.assessed ? 'CCB category assessed from linked sources.' : 'CCB category confirmed.')").replace('Current CCB category reviews are confirmed.', 'Current CCB categories have been reviewed; assessed classifications are identified in each source record.')
    normal = one_replace(normal, assessed_ui, ui, 'v8.47 audit UI changes only the three assessment labels')
    css = (HERE / 'today_groups848_src.css').read_text(encoding='utf-8')
    normal = one_replace(normal, '\n' + css + '\n</style>', '</style>', 'group disclosure stylesheet is one exact append')
    normal = one_replace(normal, '<meta name="gc500-release" content="v8.48">', '<meta name="gc500-release" content="v8.47">', 'release metadata')
    normal = one_replace(normal, "+ ' · v8.48'; /* v8.19 - the footer names the release once */", "+ ' · v8.47'; /* v8.19 - the footer names the release once */", 'release footer')
    check('entire page is byte-exact after reverting only authorised changes', normal == base)

    faces = re.findall(r'@font-face\s*\{[^}]+\}', base)
    check('all embedded font faces are unchanged', bool(faces) and faces == re.findall(r'@font-face\s*\{[^}]+\}', candidate))
    check('static header, original media markup and navigation shell are unchanged',
          base[base.index('<body>'):base.index('<script', base.index('<body>'))] ==
          candidate[candidate.index('<body>'):candidate.index('<script', candidate.index('<body>'))])
    styles = re.findall(r'<style\b[^>]*>.*?</style>', base, re.S)
    check('all unrelated original stylesheet blocks are unchanged', all(s in candidate for s in styles if 'id="today-work-v840"' not in s))
    scripts = re.findall(r'<script\b[^>]*>.*?</script>', base, re.S)
    check('all unrelated supporting script blocks are unchanged', all(s in candidate for s in scripts if 'function renderToday_held()' not in s))
    check('style and script block counts are unchanged',
          len(styles) == len(re.findall(r'<style\b[^>]*>.*?</style>', candidate, re.S)) and
          len(scripts) == len(re.findall(r'<script\b[^>]*>.*?</script>', candidate, re.S)) and
          len(re.findall(r'<script\b', base)) == len(re.findall(r'<script\b', candidate)))
    check('exactly one Today board stylesheet remains', candidate.count('id="today-work-v840"') == 1)
    print(f'{sum(ok for _, ok in checks)}/{len(checks)} independent preservation checks passed')
    print('Candidate SHA-256: ' + hashlib.sha256(raw_candidate).hexdigest())
    return 0 if all(ok for _, ok in checks) else 1


if __name__ == '__main__':
    raise SystemExit(main())
