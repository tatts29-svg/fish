"""Author: Andrew Fisher. Synthetic source-boundary and exact-release tests."""
import copy
import hashlib
import json
import os
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest
from unittest.mock import patch

import fitz

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
import fencing_trace837 as trace
import commercial_trace837 as commercial
import patch_v837 as release


def sha(raw):
    return hashlib.sha256(raw).hexdigest()


class SourceBoundary(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.folder = Path(self.temp.name)
        pdf = fitz.open()
        pdf.new_page().insert_text((40, 40), 'Synthetic source only')
        self.paper = self.folder / 'synthetic.pdf'
        pdf.save(self.paper)
        pdf.close()
        digest = sha(self.paper.read_bytes())
        self.source = {'id': 'synthetic.pdf', 'sha256': digest, 'pages': 1,
                       'media_type': 'application/pdf', 'title': 'Synthetic source', 'path': str(self.paper)}
        self.proof = {'source_id': 'synthetic.pdf', 'sha256': digest, 'page': 1}
        geometry = {'id': 'synthetic-area', 'kind': 'anchor', 'role': 'area-signoff',
                    'points': [[12, 34]], 'master_sha256': 'b' * 64, 'source_sha256': digest,
                    'source_page': 1, 'region': 'main', 'area_evidence_names': ['Synthetic area']}
        plan = {'id': 'synthetic-plan', 'sha256': digest, 'revision': '2030-01-01',
                'document_file': 'synthetic.pdf'}
        self.catalogue = {'master_sha256': 'b' * 64, 'geometry': [geometry], 'sources': [plan]}
        area = {'id': geometry['id'], 'geometry_id': geometry['id'], 'label': 'Synthetic area',
                'master_sha256': 'b' * 64, 'source_id': plan['id'], 'source_sha256': digest,
                'source_revision': plan['revision'], 'source_page': 1, 'region': 'main',
                'scope': 'area', 'expected_geometry': copy.deepcopy(geometry), 'basis': 'Source area reference'}
        expected = {k: None for k in trace.previous().FIELDS['red'] +
                    ['note', 'map_ref', 'scope', 'to_be_charged', 'not_charged_here', 'as_written']}
        expected.update(date='2030-01-02', location='Synthetic area', quantities={'clean': 12.5},
                        components={'mesh_panel': 5}, note='Andrew Fisher, 3 Jan 2026: exact recorded wording')
        row = {'record_id': 'fixture-1', 'docket_no': '900001', 'book': 'red', 'expected': expected,
               'area_ids': [area['id']], 'scope': 'area', 'activity': 'install',
               'location_as_written': 'Synthetic area', 'basis': 'Andrew Fisher reviewed the source',
               'reviewed_on': '2030-01-03', 'evidence': [self.proof]}
        self.data = {'schema': 1, 'author': 'Andrew Fisher', 'master_sha256': 'b' * 64,
                     'sources': [self.source], 'areas': [area], 'rows': [row], 'relations': [], 'unmapped': []}

    def bound(self, data, name='input.json'):
        file = self.folder / name
        file.write_text(json.dumps(data, allow_nan=False))
        return str(file), sha(file.read_bytes())

    def load(self, data=None):
        return trace.load_input(self.catalogue, *self.bound(self.data if data is None else data))

    def test_valid_input_is_path_free_and_preserves_signature(self):
        result = self.load()
        self.assertEqual(result['rows'][0]['expected'], self.data['rows'][0]['expected'])
        self.assertEqual(result['areas'][0]['expected_geometry'], self.catalogue['geometry'][0])
        self.assertNotIn(str(self.folder), json.dumps(result))

    def test_reviewed_input_sha_is_required(self):
        path, digest = self.bound(self.data)
        with self.assertRaises(ValueError):
            trace.load_input(self.catalogue, path, '0' * 64)
        self.assertEqual(sha(Path(path).read_bytes()), digest)

    def test_master_geometry_scope_and_revision_are_bound(self):
        for change in ('master', 'points', 'scope', 'revision'):
            with self.subTest(change=change):
                data = copy.deepcopy(self.data)
                if change == 'master': data['master_sha256'] = 'c' * 64
                if change == 'points': data['areas'][0]['expected_geometry']['points'][0][0] += 1
                if change == 'scope': data['areas'][0]['scope'] = 'exact_section'
                if change == 'revision': data['areas'][0]['source_revision'] = '2030-01-02'
                with self.assertRaises(ValueError): self.load(data)

    def test_duplicates_are_rejected(self):
        for collection in ('sources', 'areas', 'rows'):
            with self.subTest(collection=collection):
                data = copy.deepcopy(self.data)
                data[collection].append(copy.deepcopy(data[collection][0]))
                with self.assertRaises(ValueError): self.load(data)

    def test_original_bytes_and_page_are_bound(self):
        for change in ('hash', 'page', 'page_count'):
            with self.subTest(change=change):
                data = copy.deepcopy(self.data)
                if change == 'hash': data['sources'][0]['sha256'] = 'd' * 64
                if change == 'page': data['rows'][0]['evidence'][0]['page'] = 2
                if change == 'page_count': data['sources'][0]['pages'] = 2
                with self.assertRaises(ValueError): self.load(data)

    def test_expected_fields_and_area_identity_are_required(self):
        for change in ('signature', 'area', 'book'):
            with self.subTest(change=change):
                data = copy.deepcopy(self.data)
                if change == 'signature': del data['rows'][0]['expected']['note']
                if change == 'area': data['rows'][0]['area_ids'] = ['not-an-area']
                if change == 'book': data['rows'][0]['book'] = '__proto__'
                with self.assertRaises(ValueError): self.load(data)

    def test_parent_relation_requires_both_current_signatures(self):
        data = copy.deepcopy(self.data)
        child = copy.deepcopy(data['rows'][0])
        child.update(record_id='fixture-2', docket_no='900002', activity='additional_bracing')
        data['rows'].append(child)
        relation = {'child_record_id': child['record_id'], 'parent_record_id': data['rows'][0]['record_id'],
                    'kind': 'additional_bracing', 'basis': 'Original points to earlier installation',
                    'expected_child': copy.deepcopy(child['expected']),
                    'expected_parent': copy.deepcopy(data['rows'][0]['expected']), 'evidence': [self.proof]}
        data['relations'] = [relation]
        self.assertEqual(len(self.load(data)['relations']), 1)
        relation['expected_parent']['note'] = 'Changed source attribution'
        with self.assertRaises(ValueError): self.load(data)

    def test_json_keeps_data_safe_and_signature_through_standard_scrub(self):
        data = self.load()
        data['rows'][0]['expected']['note'] += ' </script><script>bad()</script> & \u2028'
        encoded = trace.safe_json(data)
        self.assertNotIn('</script', encoded)
        self.assertEqual(json.loads(encoded), data)
        page = self.folder / 'page.html'
        page.write_text('<script>const TEST_INPUT = ' + encoded + ';</script>')
        subprocess.run([sys.executable, str(ROOT.parent / 'toolchain/scrub_attributions.py'), str(page)],
                       check=True, capture_output=True)
        result = json.JSONDecoder().raw_decode(page.read_text().split('const TEST_INPUT = ', 1)[1])[0]
        self.assertEqual(result['rows'][0]['expected'], data['rows'][0]['expected'])
        self.assertNotEqual(result['rows'][0]['basis'], data['rows'][0]['basis'])

    def test_exact_replacement_refuses_missing_and_repeated_anchors(self):
        self.assertEqual(trace.exact('a target b', 'target', 'new', 'fixture'), 'a new b')
        for value in ('a b', 'target target'):
            with self.assertRaises((ValueError, SystemExit)):
                trace.exact(value, 'target', 'new', 'fixture')

    def test_release_refuses_wrong_predecessor_and_repeat(self):
        with self.assertRaises(ValueError): release.build(b'<html>unknown base</html>')
        with self.assertRaises(ValueError): release.build(b'const FENCE_TRACE837 = {};')

    def commercial_fixture(self):
        report = self.folder / 'report.json'; report.write_text('{}')
        source = {'document_id': self.source['id'], 'sha256': self.source['sha256'], 'local_page': 1}
        def allocation(id, amount, unallocated=False):
            return {'allocation_id': id, 'label': id, 'po_number': '89000001', 'supplier_code': 'SYNTH',
                    'amount_cents': amount, 'ledger_posting': False, 'geometry_ids': [], 'customer_revenue': None,
                    'source': source, 'record_refs': [] if unallocated else [
                        {'record_id': 'fixture-1', 'docket_no': '900001', 'book': 'red'}],
                    'source_lines': [{'line_id': id + ':line', 'source_document_id': self.source['id'],
                        'source_sha256': self.source['sha256'], 'source_page': 1, 'category': 'synthetic',
                        'quantity': 1, 'unit': 'each', 'rate_cents': amount, 'amount_cents': amount, 'row_basis': 'Synthetic'}]}
        return {'schema': 'gc500.source-commercial-display.v1', 'author': 'Andrew Fisher',
                'source_bindings': {'review_report': str(report), 'review_report_sha256': sha(report.read_bytes()),
                                   'registry_snapshot': str(report), 'registry_snapshot_sha256': sha(report.read_bytes())},
                'po_groups': [{'po_number': '89000001', 'supplier_code': 'SYNTH', 'source': source,
                               'source_total_cents': 1200, 'source_allocations': [allocation('synthetic-work', 1000)],
                               'unallocated_activities': [allocation('synthetic-yard', 200, True)]}],
                'additional_source_allocations': []}

    def load_commercial(self, data):
        return commercial.load_commercial(self.load(), trace.read_bound, trace.require, *self.bound(data, 'commercial.json'))

    def test_commercial_total_preserves_explicit_residual_without_assignment(self):
        result = self.load_commercial(self.commercial_fixture())
        group = result['groups'][0]
        self.assertEqual(sum(a['amount_cents'] for a in group['allocations']), group['total_cents'])
        self.assertEqual(group['allocations'][1]['records'], [])
        self.assertNotIn(str(self.folder), json.dumps(result))

    def test_commercial_duplicate_charge_and_total_mismatch_rejected(self):
        for change in ('duplicate', 'total', 'source', 'residual'):
            with self.subTest(change=change):
                data = self.commercial_fixture(); group = data['po_groups'][0]
                if change == 'duplicate': group['unallocated_activities'][0]['source_lines'][0]['line_id'] = 'synthetic-work:line'
                if change == 'total': group['source_total_cents'] += 1
                if change == 'source': group['source_allocations'][0]['source_lines'][0]['source_sha256'] = 'f' * 64
                if change == 'residual': group['unallocated_activities'][0]['record_refs'] = group['source_allocations'][0]['record_refs']
                with self.assertRaises(ValueError): self.load_commercial(data)

    def test_signed_credit_is_not_clamped_or_added_twice(self):
        data = self.commercial_fixture(); group = data['po_groups'][0]
        group['source_allocations'][0]['source_lines'][0]['amount_cents'] = -1000
        group['source_allocations'][0]['source_lines'][0]['rate_cents'] = -1000
        group['source_allocations'][0]['amount_cents'] = -1000
        group['source_total_cents'] = -800
        self.assertEqual(self.load_commercial(data)['groups'][0]['total_cents'], -800)


if __name__ == '__main__':
    unittest.main()
