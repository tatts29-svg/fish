"""Author: Andrew Fisher. Exact, source-bound transfers between existing CCB columns.

Private manifests carry the reviewed source facts. This generic implementation
permits only a whole recorded CCB quantity transfer and an appended audit note;
native rate functions and historical build calculations remain unchanged.
"""
from copy import deepcopy
from datetime import date
import math
import re

TYPES = {'ccb_event', 'ccb_demarc'}

def one(rows, record_id, docket_no, label):
    matches = [r for r in rows if r.get('id', r.get('record_id')) == record_id or r.get('docket_no') == docket_no]
    if len(matches) != 1 or matches[0].get('id', matches[0].get('record_id')) != record_id or matches[0].get('docket_no') != docket_no:
        raise ValueError(label + ': current identity is not unique and exact')
    return matches[0]

def apply_corrections(data, review, trace, catalogue, manifest, base_sha256):
    if manifest.get('schema') != 1 or manifest.get('author') != 'Andrew Fisher' or manifest.get('base_sha256') != base_sha256:
        raise ValueError('Correction manifest identity or base is invalid')
    corrections = manifest.get('corrections')
    if not isinstance(corrections, list) or not corrections:
        raise ValueError('Correction manifest has no explicit corrections')
    result, checked, mapped, category = map(deepcopy, (data, review, trace, catalogue))
    all_sources = review.get('sources', []) + trace.get('sources', []) + data.get('docs', {}).get('docs', [])
    seen = set()
    for correction in corrections:
        record_id, docket_no = correction.get('record_id'), correction.get('docket_no')
        if not isinstance(record_id, str) or not isinstance(docket_no, str) or record_id in seen:
            raise ValueError('A correction repeats or lacks a docket identity')
        seen.add(record_id)
        current = one(result['ops']['fencing']['dockets'], record_id, docket_no, 'Committed docket')
        if current != correction.get('expected'):
            raise ValueError('Committed docket differs from the exact reviewed original')
        old, new, quantity = correction.get('from_type'), correction.get('to_type'), correction.get('quantity')
        if old not in TYPES or new not in TYPES or old == new or isinstance(quantity, bool) or not isinstance(quantity, (int, float)) or not math.isfinite(quantity) or quantity <= 0:
            raise ValueError('Only a positive transfer between the two CCB columns is allowed')
        amounts = current.get('quantities', {})
        if amounts.get(old) != quantity or amounts.get(new, 0) != 0:
            raise ValueError('Correction must transfer the exact whole current CCB quantity')
        reviewed_on, basis, after_note = correction.get('reviewed_on'), correction.get('basis'), correction.get('after_note')
        try:
            if date.fromisoformat(reviewed_on).isoformat() != reviewed_on:
                raise ValueError()
        except (TypeError, ValueError):
            raise ValueError('A valid review date is required') from None
        if not isinstance(basis, str) or not basis.strip() or not isinstance(after_note, str) or not after_note.startswith((current.get('note') or '') + ' ') or basis not in after_note:
            raise ValueError('The audit note must append the reviewed basis without replacing original wording')
        evidence = correction.get('evidence')
        if not isinstance(evidence, list) or not evidence:
            raise ValueError('Source evidence is required')
        evidence_ids = []
        for pointer in evidence:
            source_id, digest, page = pointer.get('source_id'), pointer.get('sha256'), pointer.get('page')
            matches = [s for s in all_sources if s.get('id') == source_id]
            hashes = {s.get('sha256') for s in matches}
            if not matches or hashes != {digest} or not isinstance(digest, str) or not re.fullmatch('[a-f0-9]{64}', digest) or isinstance(page, bool) or not isinstance(page, int) or page < 1 or any(not isinstance(s.get('pages'), int) or page > s['pages'] for s in matches):
                raise ValueError('Correction evidence does not match an existing exact source and page')
            evidence_ids.append(source_id)
            existing = [s for s in category.get('sources', []) if s.get('id') == source_id]
            if existing and (len(existing) != 1 or existing[0].get('sha256') != digest):
                raise ValueError('Category source identity is ambiguous or conflicting')
            if not existing:
                source = matches[0]
                category['sources'].append({k: source[k] for k in ('id', 'sha256', 'title') if k in source})
        reviewed = one(checked['rows'], record_id, docket_no, 'Original review')
        trace_matches = [r for r in mapped['rows'] if r.get('record_id') == record_id or r.get('docket_no') == docket_no]
        traced = one(mapped['rows'], record_id, docket_no, 'Map source review') if trace_matches else None
        if traced is None and one(mapped['unmapped'], record_id, docket_no, 'Unmapped record') != correction.get('expected_unmapped'):
            raise ValueError('Unmapped record differs from its exact correction baseline')
        if reviewed != correction.get('expected_review') or traced != correction.get('expected_trace'):
            raise ValueError('Original or map review differs from the reviewed correction baseline')
        for evidence_row, fields in [(reviewed, ('date', 'location', 'quantities', 'components')), (traced, ('date', 'location', 'quantities', 'components', 'note'))]:
            if evidence_row is None:
                continue
            if any(evidence_row.get('expected', {}).get(k) != current.get(k) for k in fields):
                raise ValueError('Existing source review does not match the original docket signature')
        entry = one(category['rows'], record_id, docket_no, 'Category review')
        signature = {k: current.get(k) for k in ('date', 'location', 'quantities', 'components', 'note')}
        if entry.get('expected') != signature:
            raise ValueError('Category review does not match the original docket signature')
        changed = deepcopy(amounts)
        del changed[old]
        changed[new] = quantity
        current['quantities'], current['note'] = changed, after_note
        # Cached historical build lines and cost_total are deliberately preserved.
        # allDockets reprices current quantities with the unchanged costDocket.
        for evidence_row in (reviewed, traced):
            if evidence_row is None:
                continue
            evidence_row['expected']['quantities'] = deepcopy(changed)
            if 'note' in evidence_row['expected']:
                evidence_row['expected']['note'] = after_note
            evidence_row['reviewed_on'] = reviewed_on
        reviewed['query']['text'] += ' Category correction ' + reviewed_on + ': ' + basis
        if traced is not None:
            traced['basis'] += ' Category correction ' + reviewed_on + ': ' + basis + ' Existing area association and unmapped status are unchanged.'
            # Keep original paper/hash/page associations and geometry untouched.
            for pointer in evidence:
                if not any(s.get('id') == pointer['source_id'] and s.get('sha256') == pointer['sha256'] for s in mapped['sources']):
                    raise ValueError('Map review correction requires an existing bound source')
                if pointer not in traced['evidence']:
                    traced['evidence'].append(deepcopy(pointer))
        entry['expected']['quantities'], entry['expected']['note'] = deepcopy(changed), after_note
        entry['decision'] = {'state': 'confirmed', 'type': new, 'basis': basis}
        entry['source_ids'] = list(dict.fromkeys(entry['source_ids'] + evidence_ids))
    return result, checked, mapped, category

def json_value(text, prefix):
    import json
    if text.count(prefix) != 1:
        raise ValueError('Expected one source declaration: ' + prefix)
    start = text.index(prefix) + len(prefix)
    value, length = json.JSONDecoder().raw_decode(text[start:])
    return value, start, start + length

def replace_json_value(text, prefix, value):
    import json
    _, start, end = json_value(text, prefix)
    encoded = json.dumps(value, ensure_ascii=False, separators=(',', ':')).replace('<', '\\u003c').replace('\u2028', '\\u2028').replace('\u2029', '\\u2029')
    return text[:start] + encoded + text[end:]
