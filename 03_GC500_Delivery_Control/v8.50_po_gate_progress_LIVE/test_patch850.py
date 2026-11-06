#!/usr/bin/env python3
"""Author: Andrew Fisher. Synthetic patch boundaries, escaping and helper binding.

Pass the verified base HTML with --base. No private catalogue is read or retained.
The synthetic candidate and evidence exist only inside a temporary directory.
"""
from pathlib import Path
import argparse
import importlib.util
import json
import os
import subprocess
import sys
import tempfile

HERE = Path(__file__).resolve().parent


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--base', required=True)
    args = parser.parse_args()
    raw = Path(args.base).read_bytes()
    spec = importlib.util.spec_from_file_location('reviewed_patch850', HERE / 'patch_v850.py')
    patch = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(patch)
    checks = []

    def check(name, passed):
        checks.append((name, bool(passed)))
        print(('PASS ' if passed else 'FAIL ') + name)
        if not passed:
            raise AssertionError(name)

    def refuses(data, message):
        try:
            patch.build(data)
        except ValueError as error:
            return str(error) == message
        return False

    record = {'id': 'synthetic-record', 'docket_no': 'SYN-01', 'date': '2026-10-01',
              'week': 'Build', 'scope': 'programme', 'usable': True, 'location': 'Synthetic area',
              'quantities': {'clean': 10}, 'components': {'wheels': 2}, 'note': None,
              'signed_by': 'Synthetic signatory', 'origin': 'captured'}
    fields = ['id', 'docket_no', 'date', 'week', 'scope', 'usable', 'location',
              'quantities', 'components', 'note', 'signed_by', 'origin']
    payload = '</script><script>globalThis.injectionRan=true</script><!--\n"` ${synthetic}\u2028\u2029 Andrew Fisher | Andrew\\u0020Fisher | \\u2028 literal'
    unit = 'Vehicle Gates / INC 1 X WHEEL'
    evidence = {
        'schema': 1, 'author': 'Andrew Fisher', 'type': 'supplier_vehicle_gate_actuals',
        'total': 2, 'unit': 'each', 'unitAsWritten': unit,
        'programmeMapping': 'unconfirmed', 'canAddToProgrammeDone': False,
        'sources': [{'id': 'synthetic-po.pdf', 'sha256': 'a' * 64},
                    {'id': 'synthetic-original.pdf', 'sha256': 'b' * 64},
                    {'id': 'synthetic-programme.pdf', 'sha256': 'c' * 64}],
        'items': [{'id': 'synthetic-finding', 'recordId': record['id'], 'book': 'red',
                   'number': record['docket_no'], 'type': 'supplier_vehicle_gate_units',
                   'quantity': 2, 'unit': 'each', 'unitAsWritten': unit,
                   'programmeMapping': 'unconfirmed', 'canAddToProgrammeDone': False,
                   'poNumber': 'SYN-PO', 'source_ids': ['synthetic-po.pdf', 'synthetic-original.pdf'],
                   'papers': [{'id': 'synthetic-po.pdf', 'page': 1},
                              {'id': 'synthetic-original.pdf', 'page': 1}],
                   'expected': {key: record[key] for key in fields}, 'title': payload, 'detail': payload}],
        'excluded': [],
        'unitEvidence': {'source_id': 'synthetic-programme.pdf', 'sha256': 'c' * 64,
                         'page': 1, 'row': 'Synthetic layout', 'vehicleGates': 1,
                         'noteAsWritten': 'One opening can have multiple wheels.',
                         'conclusion': 'No supplier unit conversion is established.'}}
    original_env = os.environ.get('FENCE_PO850_INPUT')
    try:
        os.environ.pop('FENCE_PO850_INPUT', None)
        check('foreign base refuses before reading any evidence input',
              refuses(b'unrelated page', 'Refusing changed live base or repeated patch'))
        check('a valid base refuses when the evidence input is absent',
              refuses(raw, 'Reviewed private P/O quantity evidence is required'))
        with tempfile.TemporaryDirectory(prefix='gc500-synthetic-patch850-') as temporary:
            directory = Path(temporary)
            input_path = directory / 'synthetic-evidence.json'
            input_path.write_text(json.dumps(evidence, ensure_ascii=False), encoding='utf-8')
            os.environ['FENCE_PO850_INPUT'] = str(input_path)
            original_input = input_path.read_bytes()
            candidate = patch.build(raw)
            check('a built candidate refuses a second application',
                  refuses(candidate, 'Refusing changed live base or repeated patch'))
            check('patch construction preserves the input evidence bytes', input_path.read_bytes() == original_input)
            text = candidate.decode('utf-8')
            prefix = 'const FENCE_PO850 = '
            check('output declares exactly one FENCE_PO850 catalogue', text.count(prefix) == 1)
            start = text.index(prefix) + len(prefix)
            decoded, length = json.JSONDecoder().raw_decode(text[start:])
            literal = text[start:start + length]
            check('malicious strings and literal escapes round-trip exactly as data', decoded == evidence)
            check('catalogue cannot terminate an HTML script or introduce markup', '<' not in literal and text.count('</script>') == raw.decode('utf-8').count('</script>'))
            check('actual Unicode line separators are escaped without changing their values', '\u2028' not in literal and '\u2029' not in literal and '\\u2028' in literal and '\\u2029' in literal)
            check('author Unicode escaping preserves the exact author and literal backslash text',
                  decoded['author'] == 'Andrew Fisher' and 'Andrew\\u0020Fisher' in literal
                  and decoded['items'][0]['detail'] == payload)
            helper = (HERE / 'po_progress850_src.js').read_text(encoding='utf-8')
            runtime_input = {'literal': literal, 'helper': helper, 'record': record}
            runtime = r'''
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const x=JSON.parse(fs.readFileSync(0,'utf8')),catalogue=JSON.parse(x.literal);
const ctx=vm.createContext({Date,Map,Set,DATA:{weeks:[{sheet:'Build',phase:'Build',start:'2026-10-01',end:'2026-10-18'}]},allDockets:()=>[x.record],photoIndex:()=>({state:'ready',files:Object.fromEntries(catalogue.sources.map(s=>[s.id,{sha256:s.sha256}]))})});
vm.runInContext('const FENCE_PO850 = '+x.literal+';\n'+x.helper,ctx);
const r=vm.runInContext('fencePoGateEvidence850("2026-10-05")',ctx);
assert.equal(r.state,'ready');assert.equal(r.acceptedQuantity,2);assert.equal(r.canAddToProgrammeDone,false);assert.equal(ctx.injectionRan,undefined);
assert.equal(r.accepted[0].detail,catalogue.items[0].detail);
'''
            completed = subprocess.run(['node', '-e', runtime], input=json.dumps(runtime_input), text=True, capture_output=True)
            check('the emitted catalogue binds to the helper without executing embedded strings', completed.returncode == 0)
            candidate_path = directory / 'synthetic-candidate.html'
            candidate_path.write_bytes(candidate)
            preserved = subprocess.run([sys.executable, str(HERE / 'test_preserve850.py'),
                                        '--base', args.base, '--candidate', str(candidate_path),
                                        '--evidence', str(input_path)], text=True, capture_output=True)
            if preserved.returncode:
                print(preserved.stdout)
                print(preserved.stderr)
            check('independent full-page restoration preserves every unrelated byte', preserved.returncode == 0)
            evidence['canAddToProgrammeDone'] = True
            input_path.write_text(json.dumps(evidence), encoding='utf-8')
            check('a catalogue requesting programme promotion is refused', refuses(raw, 'Invalid separate source-quantity input'))
    finally:
        if original_env is None:
            os.environ.pop('FENCE_PO850_INPUT', None)
        else:
            os.environ['FENCE_PO850_INPUT'] = original_env
    print(str(len(checks)) + ' synthetic patch checks passed')


if __name__ == '__main__':
    main()
