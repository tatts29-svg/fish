"""Author: Andrew Fisher. Exact Decimal audit; no monetary fixtures or production writes.

OUT=/private/capture python3 verify_cents.py [--baseline /private/baseline/models.json]
Reads OUT/models.json; writes detailed financial evidence only to that private directory.
Stable model keys are emitted by capture_models.cjs even when PL_AUDIT_FACE_API changes.
The Finance reader must retain its contract/invoicing allocation basis. A future change
of that contract requires an explicit capture adapter, never silently applying the
management allocation twice. Source contract branches are neither edited nor replaced.
"""
import argparse
import copy
import json
import os
import subprocess
import sys
from decimal import Decimal, ROUND_HALF_UP
from pathlib import Path

LEGACY_REVENUE_BASIS = 'legacy-staffing-to-kinp'
INVOICE_REVENUE_BASIS = 'invoice-branch'
REVENUE_TRANSITION = 'legacy-to-invoice-branch'


def decimal(value):
    if value is None:
        return Decimal(0)
    return Decimal(str(value))


def cents(value):
    return decimal(value).quantize(Decimal('.01'), rounding=ROUND_HALF_UP)


def total(values):
    return cents(sum((decimal(v) for v in values), Decimal(0)))


def private_output():
    value = os.environ.get('OUT', '')
    if not value or not Path(value).is_absolute():
        raise ValueError('OUT must be an absolute private directory')
    out = Path(value).resolve()
    if not out.is_dir():
        raise ValueError('OUT must already exist')
    probe = subprocess.run(['git', '-C', str(out), 'rev-parse', '--show-toplevel'], capture_output=True)
    if probe.returncode == 0:
        raise ValueError('OUT must be outside every Git worktree')
    if probe.returncode != 128:
        raise ValueError('Could not establish that OUT is outside a Git worktree')
    return out


def revenue_movements(data, codes, revenue_basis):
    """Use the explicitly selected rule, never infer it from candidate figures."""
    if revenue_basis not in (LEGACY_REVENUE_BASIS, INVOICE_REVENUE_BASIS):
        raise ValueError('Unsupported revenue basis')
    now, job = ({b: Decimal(0) for b in codes} for _ in range(2))
    if revenue_basis == LEGACY_REVENUE_BASIS:
        for scope in data['scopeBranchAllocation978']:
            b = scope['branch']
            if 'staffing' in scope.get('source', '').lower() and b != 'KINP' and b in codes:
                now[b] -= decimal(scope.get('recorded'))
                now['KINP'] += decimal(scope.get('recorded'))
                job[b] -= decimal(scope.get('job'))
                job['KINP'] += decimal(scope.get('job'))
    return now, job


def project_invoice_branch_baseline(baseline):
    """Translate only the documented legacy revenue fields for source 994a50ca.

    Prove every replaced old value against the baseline's Finance/source inputs
    first. No candidate values enter the projection. Cost, contract/source
    routing, monetary line items and whole-job totals are copied untouched and
    remain subject to the ordinary strict baseline comparison.
    """
    projected, checks, changes = copy.deepcopy(baseline), [], []
    main, ledger, finance = baseline['PL1267.model'], baseline['PL1267.ledger'], baseline['fh866Model']
    codes = ledger['cols']
    branch_codes = [row['code'] for row in main['branches']]
    structure_ok = len(set(codes)) == len(codes) and set(codes) == set(branch_codes) and len(codes) == len(branch_codes) and main['L']['cols'] == codes and 'KINP' in codes
    checks.append({'name': 'transition baseline branch structure is consistent', 'pass': structure_ok})
    if not structure_ok:
        return projected, checks, {'applied': False, 'reason': 'Baseline branch structure is incompatible'}
    invoice_now, invoice_job = ({b: Decimal(0) for b in codes} for _ in range(2))
    for row in finance['inv']:
        if row['branch'] in invoice_now:
            invoice_now[row['branch']] += decimal(row.get('onRecord'))
            invoice_job[row['branch']] += decimal(row.get('job'))
    movement_now, movement_job = revenue_movements(baseline, codes, LEGACY_REVENUE_BASIS)
    replacements = []

    def old_field(name, path, expected, replacement):
        value = baseline
        try:
            for key in path:
                value = value[key]
            passed = not isinstance(value, bool) and isinstance(value, (int, float, Decimal)) and decimal(value) == cents(expected)
        except (KeyError, IndexError, TypeError):
            value, passed = None, False
        checks.append({'name': name, 'actual': str(value), 'expected': str(cents(expected)), 'pass': passed})
        replacements.append((path, cents(replacement)))

    old_field('transition baseline face moved follows legacy source rule', ['PL1267.model', 'moved'], movement_job['KINP'], 0)
    for i, branch in enumerate(main['branches'], 1):
        b = branch['code']
        old_field(f'transition baseline face branch {i} Revenue follows legacy rule', ['PL1267.model', 'branches', i-1, 'rev'], invoice_job[b]+movement_job[b], invoice_job[b])
        old_field(f'transition baseline face branch {i} difference follows legacy rule', ['PL1267.model', 'branches', i-1, 'diff'], invoice_job[b]+movement_job[b]-decimal(branch['cost']), invoice_job[b]-decimal(branch['cost']))
    for label, prefix, old_ledger in [('ledger', ['PL1267.ledger'], ledger), ('face ledger', ['PL1267.model', 'L'], main['L'])]:
        old_field('transition baseline '+label+' moved follows legacy source rule', prefix+['moved'], movement_job['KINP'], 0)
        for i, b in enumerate(codes, 1):
            old_field(f'transition baseline {label} branch {i} current Revenue follows legacy rule', prefix+['revRec', b], invoice_now[b]+movement_now[b], invoice_now[b])
            old_field(f'transition baseline {label} branch {i} job Revenue follows legacy rule', prefix+['revJobB', b], invoice_job[b]+movement_job[b], invoice_job[b])
            old_field(f'transition baseline {label} branch {i} contribution follows legacy rule', prefix+['contribB', b], invoice_job[b]+movement_job[b]-decimal(old_ledger['costB'][b]), invoice_job[b]-decimal(old_ledger['costB'][b]))
            if 'mvRev' in old_ledger:
                old_field(f'transition baseline {label} branch {i} explanatory move follows legacy rule', prefix+['mvRev', b], movement_job[b], 0)
    if not all(check['pass'] for check in checks):
        return projected, checks, {'applied': False, 'reason': 'Baseline does not satisfy the declared old revenue rule; no projection applied'}
    for path, value in replacements:
        target = projected
        for key in path[:-1]:
            target = target[key]
        target[path[-1]] = value
        changes.append(path)
    return projected, checks, {'applied': True, 'rule': REVENUE_TRANSITION, 'derivedFrom': 'baseline Finance invoice rows and scopeBranchAllocation978 only', 'projectedPaths': changes}


def compare_baseline(data, baseline, revenue_basis=LEGACY_REVENUE_BASIS, baseline_revenue_transition=None):
    """Compare financial projections only after proving the same frozen basis.

    Existing numeric leaves, source classifications and collection lengths form
    the contract. New descriptive fields (including a new branch bridge) are
    allowed. Existing financial leaves may not disappear or change. Detail stays
    in the private result; public console output contains only group labels.
    """
    checks = []
    old_capture, new_capture = baseline.get('capture') or {}, data.get('capture') or {}
    old_hash, new_hash = old_capture.get('stateSha256'), new_capture.get('stateSha256')
    valid_hash = lambda value: isinstance(value, str) and len(value) == 64 and all(c in '0123456789abcdef' for c in value)
    state_matches = valid_hash(old_hash) and valid_hash(new_hash) and old_hash == new_hash
    checks.append({'name': 'baseline uses the same frozen STATE hash', 'pass': state_matches})
    date_keys = ['PL1267.model', 'PL1267.ledger', 'pl770Model', 'fh866Model', 'cj764Model']
    old_dates = {'asAt': baseline.get('asAt'), **{key: (baseline.get(key) or {}).get('asAt') for key in date_keys},
                 'moneySummary': (baseline.get('moneySummary') or {}).get('as_at')}
    new_dates = {'asAt': data.get('asAt'), **{key: (data.get(key) or {}).get('asAt') for key in date_keys},
                 'moneySummary': (data.get('moneySummary') or {}).get('as_at')}
    dates_match = bool(old_dates['asAt']) and old_dates == new_dates
    checks.append({'name': 'baseline uses the same as-at basis', 'pass': dates_match})
    record_matches = baseline.get('record') is not None and baseline.get('record') == data.get('record')
    checks.append({'name': 'baseline uses the same record revision', 'pass': record_matches})
    metadata = {'baselineCapture': old_capture, 'candidateCapture': new_capture,
                'baselineRecord': baseline.get('record'), 'candidateRecord': data.get('record'),
                'baselineAsAtBasis': old_dates, 'candidateAsAtBasis': new_dates,
                'snapshotCompatible': state_matches and dates_match and record_matches}
    if not metadata['snapshotCompatible']:
        metadata['status'] = 'Snapshot mismatch: recapture both pages on the same frozen STATE and as-at basis; financial regression comparison was not run.'
        return checks, metadata

    if baseline_revenue_transition:
        if baseline_revenue_transition != REVENUE_TRANSITION or revenue_basis != INVOICE_REVENUE_BASIS:
            raise ValueError('The legacy-to-invoice-branch transition requires the explicit invoice-branch basis')
        baseline, transition_checks, transition_metadata = project_invoice_branch_baseline(baseline)
        checks.extend(transition_checks)
        metadata['revenueTransition'] = transition_metadata

    identities = {'id', 'key', 'code', 'branch', 'costedBranch', 'revenueBranch', 'type', 'kind', 'category', 'status', 'date'}
    missing = object()

    def relevant(value, key=''):
        if isinstance(value, dict):
            return any(relevant(child, name) for name, child in value.items())
        if isinstance(value, list):
            return any(relevant(child) for child in value)
        return isinstance(value, (int, float, Decimal)) or (key in identities and value is not None)

    def compare(old, new, where, differences, key=''):
        if not relevant(old, key):
            return
        if isinstance(old, dict):
            if not isinstance(new, dict):
                differences.append({'path': where, 'reason': 'Expected object'})
                return
            for child, value in old.items():
                compare(value, new.get(child, missing), where+[child], differences, child)
        elif isinstance(old, list):
            # Protect existing financial/source collection membership, while
            # ignoring unrelated prose lists such as caveats and gap wording.
            if not isinstance(new, list) or len(old) != len(new):
                differences.append({'path': where, 'reason': 'Collection length changed', 'baselineCount': len(old),
                                    'candidateCount': len(new) if isinstance(new, list) else None})
                return
            for index, value in enumerate(old):
                compare(value, new[index], where+[index], differences)
        elif isinstance(old, bool):
            if new is not old:
                differences.append({'path': where, 'baseline': old, 'candidate': None if new is missing else new})
        elif isinstance(old, (int, float, Decimal)):
            # Exact input/projection equality also protects fractional hours and
            # rates; the independent arithmetic above separately checks cents.
            if new is missing or isinstance(new, bool) or not isinstance(new, (int, float, Decimal)) or decimal(old) != decimal(new):
                differences.append({'path': where, 'baseline': str(old), 'candidate': None if new is missing else str(new)})
        elif key in identities and old != new:
            differences.append({'path': where, 'baseline': old, 'candidate': None if new is missing else new})

    # Labour source inputs are normalized to the portable capture schema so old
    # private dumps with additional source notes remain compatible.
    def labour_inputs(capture):
        result = []
        fields = ['id', 'type', 'date', 'paid', 'rate', 'calculatedCost', 'actualCost', 'status', 'auditIsCrew']
        for row in capture['finRows']:
            result.append({**{key: row.get(key) for key in fields}, 'split': (row.get('source') or {}).get('split')})
        return sorted(result, key=lambda row: str(row['id']))

    source_differences = []
    old_rows, new_rows = labour_inputs(baseline), labour_inputs(data)
    if old_rows != new_rows:
        source_differences.append({'reason': 'Normalized source labour inputs changed', 'baseline': old_rows, 'candidate': new_rows})
    checks.append({'name': 'baseline preserves source labour inputs', 'pass': not source_differences, 'differences': source_differences})
    roots = ['PL1267.model', 'PL1267.ledger', 'pl770Model', 'moneySummary', 'fh866Model', 'cj764Model',
             'labourHireSoFar1267', 'scopeBranchAllocation978', 'recon888Model']
    for key in roots:
        differences = []
        if key not in baseline or key not in data:
            differences.append({'reason': 'Required model missing'})
        else:
            compare(baseline[key], data[key], [key], differences)
        checks.append({'name': 'baseline preserves '+key+' financial projection and routing', 'pass': not differences, 'differences': differences})
    metadata['status'] = 'Compared source inputs and existing financial projections; added descriptive fields are allowed.'
    return checks, metadata


def verify(data, revenue_basis=LEGACY_REVENUE_BASIS):
    checks, source_exceptions, branch_bridge = [], [], []

    def check(name, actual, expected):
        a, e = cents(actual), cents(expected)
        checks.append({'name': name, 'actual': str(a), 'expected': str(e), 'pass': a == e})

    def flag(name, passed):
        checks.append({'name': name, 'pass': bool(passed)})

    main, ledger = data['PL1267.model'], data['PL1267.ledger']
    forecast, finance = data['pl770Model'], data['fh866Model']
    money, hire = data['moneySummary'], data['labourHireSoFar1267']
    for side, rev, cost, diff in [('now', 'revNow', 'costNow', 'diffNow'), ('job', 'revJob', 'costJob', 'diffJob')]:
        check('face revenue row sum '+side, total(r.get(side) for r in main['rev']), main[rev])
        check('face cost row sum '+side, total(r.get(side) for g in main['groups'] for r in g['lines'] if not r.get('hours')), main[cost])
        check('face difference subtraction '+side, decimal(main[rev])-decimal(main[cost]), main[diff])
        check('ledger revenue row sum '+side, total(r.get(side) for r in ledger['rev']), ledger[rev])
        direct_key, op_key = ('direct', 'opNow') if side == 'now' else ('directJob', 'opJob')
        check('ledger direct-cost row sum '+side, total(r.get(side) for r in ledger['cost']), ledger[direct_key])
        check('ledger operating-cost row sum '+side, total(r.get(side) for r in ledger['op']), ledger[op_key])
        check('ledger all cost layers '+side, decimal(ledger[direct_key])+decimal(ledger[op_key]), main[cost])
        check('Finance cost-stream sum '+side, total(r.get('toDate' if side == 'now' else 'job') for r in finance['costs']), main[cost])
    for field, main_field in [('rev', 'revJob'), ('cost', 'costJob'), ('diff', 'diffJob')]:
        check('main branch sum '+field, total(r[field] for r in main['branches']), main[main_field])
    for i, row in enumerate(main['branches'], 1):
        check(f'main branch {i} subtraction', decimal(row['rev'])-decimal(row['cost']), row['diff'])
    for i, row in enumerate(finance['costs'], 1):
        check(f'Finance stream {i} period sum', decimal(row['toDate'])+decimal(row['toCome']), row['job'])
        check(f'Finance stream {i} branch sum', total(row['by'].values()), row['job'])
    for i, row in enumerate(finance['inv'], 1):
        check(f'Finance invoice branch {i} period sum', decimal(row['onRecord'])+decimal(row['toCome']), row['job'])
    allowance = forecast.get('wages', {}).get('allowanceForecast')
    if allowance is None:
        flag('salary allowance source available', False)
    else:
        check('salary allowance appears once at job end', total(r.get('job') for g in main['groups'] for r in g['lines'] if 'Salary allowance' in r['name']), allowance)
    for side, source_side in [('now', 'toDate'), ('job', 'job')]:
        check('fencing split preserves stream '+side, total(r.get(side) for g in main['groups'] for r in g['lines'] if r['name'].startswith('Advanced')), total(r[source_side] for r in finance['costs'] if r['kind'] == 'fencing'))
        check('toilet split preserves stream '+side, total(r.get(side) for g in main['groups'] for r in g['lines'] if r['name'].startswith('Event Portables')), total(r[source_side] for r in finance['costs'] if r['kind'] == 'toilets'))

    # Independent source rows: price weighted hours, round each shift, then add.
    rows = [r for r in data['finRows'] if not r['auditIsCrew'] and r['type'] not in ('cna', 'salary')]
    known, future = Decimal(0), Decimal(0)
    for i, row in enumerate(rows, 1):
        split, rate = row.get('source', {}).get('split') or {}, row.get('rate')
        if rate is None or not split:
            source_exceptions.append({'row': i, 'id': row.get('id'), 'reason': 'Missing rate or paid-hour split'})
            continue
        unexpected = set(split)-{'ordinary', 'at_1_5', 'at_2'}
        flag(f'source shift {i} uses supported pay bands', not unexpected)
        weighted = decimal(split.get('ordinary')) + decimal(split.get('at_1_5'))*Decimal('1.5') + decimal(split.get('at_2'))*2
        computed = cents(weighted*decimal(rate))
        check(f'source shift {i} weighted hours times rate', computed, row['calculatedCost'])
        check(f'source shift {i} paid-hour split', total(split.values()), row['paid'])
        selected = decimal(row['actualCost']) if row['status'] == 'confirmed' and row.get('actualCost') is not None else computed
        if row.get('date') and row['date'] <= data['asAt'] and row['status'] != 'forecast':
            known += selected
        else:
            future += selected
    flag('every priced labour row independently recomputed', not source_exceptions)
    for key, value in [('known', known), ('toCome', future), ('job', known+future)]:
        check('independent labour '+key, value, hire[key])
    check('source labour sum matches face', known, total(r.get('now') for g in main['groups'] for r in g['lines'] if r['name'].startswith('The hired-in')))

    # The two branch bases may legitimately differ. Verify the reconciliation bridge
    # independently, without changing or treating either source branch as incorrect.
    inv = {row['branch']: row for row in finance['inv']}
    codes = {row['code'] for row in main['branches']}
    movement_now, movement_job = revenue_movements(data, codes, revenue_basis)
    expense_move = {b: Decimal(0) for b in codes}
    for stream in finance['costs']:
        if stream['kind'] not in ('expenses', 'labour'):
            continue
        for b, value in stream['by'].items():
            if b in codes:
                expense_move[b] -= decimal(value)
        expense_move['KINP'] += decimal(stream['job'])
    check('management revenue bridge is zero-sum now', total(movement_now.values()), 0)
    check('management revenue bridge is zero-sum job', total(movement_job.values()), 0)
    check('management cost bridge is zero-sum job', total(expense_move.values()), 0)
    check('face revenue moved follows explicit basis', main['moved'], movement_job['KINP'])
    check('ledger revenue moved follows explicit basis', ledger['moved'], movement_job['KINP'])
    for i, branch in enumerate(main['branches'], 1):
        b = branch['code']
        if b not in inv:
            flag(f'branch basis {i} has Finance source', False)
            continue
        source = inv[b]
        raw_cost = finance['costTotal']['by'].get(b, 0)
        expected_revenue = decimal(source['job']) + movement_job[b]
        expected_cost = decimal(raw_cost) + expense_move[b]
        check(f'branch basis {i} management Revenue from invoice bridge', branch['rev'], expected_revenue)
        check(f'branch basis {i} management cost from expense bridge', branch['cost'], expected_cost)
        check(f'branch basis {i} current Revenue from invoice bridge', ledger['revRec'][b], decimal(source['onRecord'])+movement_now[b])
        check(f'branch basis {i} ledger job Revenue from invoice bridge', ledger['revJobB'][b], expected_revenue)
        for label, projection in [('ledger', ledger), ('face ledger', main['L'])]:
            if 'mvRev' in projection:
                check(f'branch basis {i} {label} explanatory Revenue move', projection['mvRev'][b], movement_job[b])
        branch_bridge.append({'branch': b, 'contractRevenue': str(cents(source['job'])), 'managementRevenue': str(cents(branch['rev'])),
            'revenueReallocation': str(cents(movement_job[b])), 'financeCost': str(cents(raw_cost)), 'managementCost': str(cents(branch['cost'])),
            'expenseReallocation': str(cents(expense_move[b]))})
    return {'author': 'Andrew Fisher', 'capture': data.get('capture'), 'record': data.get('record'), 'asAt': data['asAt'], 'revenue_basis': revenue_basis,
            'method': 'Independent Decimal row arithmetic and branch-basis bridge; exact cent equality',
            'checks': checks, 'pass_count': sum(c['pass'] for c in checks), 'failures': [c for c in checks if not c['pass']],
            'source_shift_count': len(rows), 'source_shift_exceptions': source_exceptions, 'branch_basis_bridge': branch_bridge,
            'limits': 'Arithmetic and basis reconciliation on the pinned record; not independent verification of every original invoice, rate card, contract or exception.'}


def main():
    out = None
    try:
        parser = argparse.ArgumentParser(description='Private read-only Decimal reconciliation and optional same-snapshot financial regression comparison.')
        parser.add_argument('--baseline', type=Path, help='Absolute path to private baseline models.json captured with the same STATE and as-at basis')
        parser.add_argument('--revenue-basis', choices=[LEGACY_REVENUE_BASIS, INVOICE_REVENUE_BASIS], default=LEGACY_REVENUE_BASIS,
                            help='Explicit branch-revenue rule; defaults to the legacy staffing transfer, never inferred from candidate values')
        parser.add_argument('--baseline-revenue-transition', choices=[REVENUE_TRANSITION],
                            help='Bounded source-994a50ca revenue/difference/moved projection only; requires invoice-branch and --baseline')
        args = parser.parse_args()
        out = private_output()
        if args.baseline_revenue_transition and (args.revenue_basis != INVOICE_REVENUE_BASIS or not args.baseline):
            raise ValueError('The baseline revenue transition requires --revenue-basis invoice-branch and --baseline')
        data = json.loads((out/'models.json').read_text(), parse_float=Decimal)
        result = verify(data, args.revenue_basis)
        if args.baseline:
            if not args.baseline.is_absolute() or not args.baseline.is_file():
                raise ValueError('--baseline must name an existing absolute private models.json')
            baseline = json.loads(args.baseline.read_text(), parse_float=Decimal)
            baseline_checks, metadata = compare_baseline(data, baseline, args.revenue_basis, args.baseline_revenue_transition)
            result['baseline_comparison'] = metadata
            result['checks'].extend(baseline_checks)
            result['pass_count'] = sum(c['pass'] for c in result['checks'])
            result['failures'] = [c for c in result['checks'] if not c['pass']]
        target = out/'independent-cent-results.json'
        target.write_text(json.dumps(result, indent=2, default=str)+'\n')
        target.chmod(0o600)
        print(f"{'PASS' if not result['failures'] else 'FAIL'}: {result['pass_count']}/{len(result['checks'])} independent checks.")
        for failure in result['failures']:
            print('FAIL: '+failure['name'])
        if result.get('baseline_comparison', {}).get('snapshotCompatible') is False:
            print('Snapshot mismatch: recapture both pages on the same frozen STATE and as-at basis; financial regression comparison skipped.')
        return int(bool(result['failures']))
    except Exception as error:
        if out:
            target = out/'verification-failure.json'
            target.write_text(json.dumps({'type': type(error).__name__, 'error': str(error)}, indent=2)+'\n')
            target.chmod(0o600)
        print('FAIL: capture schema or audit execution; see private output.')
        return 1


if __name__ == '__main__':
    sys.exit(main())
