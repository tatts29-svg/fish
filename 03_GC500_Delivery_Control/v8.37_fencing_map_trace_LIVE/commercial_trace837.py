"""Author: Andrew Fisher. Optional supplier-summary display, never financial posting."""
import hashlib
import json
import os
from pathlib import Path


def load_commercial(trace, read_bound, require, path=None, expected=None):
    path = path or os.environ.get('FENCE_TRACE837_COMMERCIAL_INPUT')
    expected = expected or os.environ.get('FENCE_TRACE837_COMMERCIAL_SHA256')
    if not path and not expected:
        return None
    data = read_bound(path, expected)
    require(data.get('schema') == 'gc500.source-commercial-display.v1' and data.get('author') == 'Andrew Fisher', 'Wrong commercial display schema')
    bindings = data.get('source_bindings', {})
    for key in ('review_report', 'registry_snapshot'):
        require(isinstance(bindings.get(key), str) and Path(bindings[key]).is_absolute(), 'Private commercial proof path required')
        require(hashlib.sha256(Path(bindings[key]).read_bytes()).hexdigest() == bindings.get(key + '_sha256'), 'Commercial proof changed')
    sources = {s['id']: s for s in trace['sources']}
    allocation_ids, line_ids = set(), set()

    def source(p):
        s = sources.get(p.get('document_id'))
        require(s and p.get('sha256') == s['sha256'] and type(p.get('local_page')) is int and 1 <= p['local_page'] <= s['pages'], 'Commercial source page/hash is not bound')
        return {'source_id': s['id'], 'sha256': s['sha256'], 'page': p['local_page']}

    def allocation(a, unallocated=False):
        require(isinstance(a.get('allocation_id'), str) and a['allocation_id'] not in allocation_ids, 'Duplicate supplier allocation')
        allocation_ids.add(a['allocation_id'])
        require(type(a.get('amount_cents')) is int and a.get('ledger_posting') is False, 'Integer-cent source amount and no posting required')
        require(a.get('geometry_ids') == [] and a.get('customer_revenue') is None, 'Supplier source allocation cannot carry geometry or customer Revenue')
        proof = source(a['source'])
        lines = []
        for line in a.get('source_lines', []):
            require(isinstance(line.get('line_id'), str) and line['line_id'] not in line_ids, 'Duplicate supplier charge line')
            line_ids.add(line['line_id'])
            require(type(line.get('amount_cents')) is int, 'Supplier line amount must be integer cents')
            require(line.get('source_document_id') == proof['source_id'] and line.get('source_sha256') == proof['sha256'] and line.get('source_page') == proof['page'], 'Supplier line proof differs from allocation')
            lines.append({k: line.get(k) for k in ('line_id', 'category', 'quantity', 'unit', 'rate_cents', 'amount_cents', 'row_basis')})
        require(lines and sum(l['amount_cents'] for l in lines) == a['amount_cents'], 'Source allocation lines do not reconcile')
        refs = []
        for r in a.get('record_refs', []):
            require(r.get('book') in ('red', 'green', 'blue') and all(isinstance(r.get(k), str) and r[k] for k in ('record_id', 'docket_no')), 'Commercial record identity missing')
            refs.append({k: r[k] for k in ('record_id', 'docket_no', 'book')})
        require(not unallocated or not refs, 'Unnumbered source activity cannot acquire a docket allocation')
        require(unallocated or refs, 'Numbered supplier allocation needs exact record identities')
        parents = []
        for r in a.get('parent_record_refs', []):
            require(r.get('book') in ('red', 'green', 'blue') and all(isinstance(r.get(k), str) and r[k] for k in ('record_id', 'docket_no')), 'Parent source identity missing')
            parents.append({k: r[k] for k in ('record_id', 'docket_no', 'book')})
        parent_source = source(a['parent_source']) if parents else None
        return {'parents': parents, 'parent_source': parent_source, 'id': a['allocation_id'], 'label': a['label'], 'number': a['po_number'], 'supplier': a['supplier_code'], 'source': proof, 'records': refs, 'amount_cents': a['amount_cents'], 'lines': lines, 'unallocated': unallocated,
                'note': a.get('physical_relationship') or a.get('customer_basis_note') or a.get('customer_allocation_note') or ('Unnumbered source activity; no docket allocation.' if unallocated else 'Supplier-summary area allocation; no precise fence-section allocation.')}

    groups = []
    for group in data.get('po_groups', []):
        allocations = [allocation(a) for a in group.get('source_allocations', [])] + [allocation(a, True) for a in group.get('unallocated_activities', [])]
        total = group.get('source_total_cents')
        require(type(total) is int and sum(a['amount_cents'] for a in allocations) == total, 'Supplier allocations and residual do not equal whole source total')
        require(all(a['number'] == group['po_number'] and a['supplier'] == group['supplier_code'] and a['source'] == source(group['source']) for a in allocations), 'Supplier allocation group or source changed')
        groups.append({'number': group['po_number'], 'supplier': group['supplier_code'], 'source': source(group['source']), 'total_cents': total, 'allocations': allocations})
    extra = [allocation(a) for a in data.get('additional_source_allocations', [])]
    return {'schema': 1, 'groups': groups, 'additional': extra}
