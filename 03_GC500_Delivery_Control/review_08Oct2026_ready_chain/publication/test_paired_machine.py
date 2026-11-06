#!/usr/bin/env python3
"""Author: Andrew Fisher. Offline publication boundary tests; no HTTP/browser."""
import argparse
import copy
import hashlib
import importlib.util
import json
import os
from pathlib import Path
import tempfile
import unittest
from unittest import mock

HERE = Path(__file__).resolve().parent
spec = importlib.util.spec_from_file_location('paired_machine', HERE / 'paired_machine.py')
paired = importlib.util.module_from_spec(spec)
spec.loader.exec_module(paired)


class Server:
    def __init__(self, base, blobs):
        self.active = copy.deepcopy(base)
        self.blobs = dict(blobs)
        self.calls = []
        self.fail_put_number = None
        self.before_version = None
        self.minimal_ack = False

    def call(self, method, path, body=None, ctype='application/json', token=None, timeout=600):
        self.calls.append((method, path))
        if path == '/api/version':
            if self.before_version:
                self.before_version()
                self.before_version = None
            return 200, b'{"level":"edit"}'
        if path == '/api/admin/machine':
            return 200, json.dumps({'status': self.active, 'blobs': [
                {'sha256': digest, 'bytes': len(raw)} for digest, raw in sorted(self.blobs.items())]}).encode()
        if method == 'PUT':
            if sum(m == 'PUT' for m, _ in self.calls) == self.fail_put_number:
                raise OSError('simulated interrupted upload, sensitive remote text')
            digest = path.rsplit('/', 1)[-1]
            assert digest == paired.sha(body)
            self.blobs[digest] = body
            if self.minimal_ack:
                return 200, b'{"ok":true}'
            return 200, json.dumps({'sha256': digest, 'bytes': len(body)}).encode()
        if method == 'POST':
            assert path == '/api/admin/machine/manifest'
            candidate = json.loads(body)
            assert all(len(self.blobs[row['sha256']]) == row['bytes'] for row in candidate['files'])
            self.active = candidate
            return 200, json.dumps({'sha256': candidate['sha256'], 'files': len(candidate['files'])}).encode()
        if path == '/api/machine':
            return 200, json.dumps(self.active).encode()
        if path.startswith('/w/Coates-GC500-2026/'):
            name = path.split('/w/Coates-GC500-2026/', 1)[1].split('?', 1)[0]
            row = next(row for row in self.active['files'] if row['path'] == name)
            return 200, self.blobs[row['sha256']]
        raise AssertionError('Unexpected request')


class PublicationGuards(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        root = Path(self.tmp.name)
        self.publisher_path = paired.CONTROL / 'v8.93_maps_aligned_DRAFT/tools/publish_machine893.py'
        self.publisher = paired.load_publisher(self.publisher_path)
        base_content = {'index.html': b'old machine entry', 'retained.js': b'old retained file',
                        'explorer/index.html': b'old explorer', 'explorer/assets/old.bin': b'old tile',
                        'poc3d/units3d.json': b'{"pins":["old"]}'}
        rows = [{'path': name, 'sha256': paired.sha(body), 'bytes': len(body), 'type': 'application/octet-stream'}
                for name, body in sorted(base_content.items())]
        base = {'schema': 'gc500-machine-v1', 'entry': 'index.html', 'files': rows,
                'version': 'old-release', 'label': 'The Coates Way machine and GC500 Map explorer',
                'sha256': self.publisher.digest_of('index.html', rows)}
        (root / 'base.json').write_text(json.dumps(base))
        for folder in ('code', 'assets/vt', 'over/poc3d'):
            (root / folder).mkdir(parents=True)
        (root / 'code/index.html').write_bytes(b'new explorer')
        (root / 'code/explorer.js').write_bytes(b'new completion code')
        scene = b'exact drawing scene'
        (root / 'assets/drawing-scene.bin').write_bytes(scene)
        self.tile = root / ('assets/vt/tile-' + paired.sha(scene)[:12] + '.bin')
        self.tile.write_bytes(b'exact reviewed tile')
        (root / 'assets/vt/manifest.json').write_text(json.dumps({'levels': [{'file': self.tile.name}]}))
        (root / 'over/plan_items.json').write_text('{"items":[]}')
        (root / 'over/poc3d/units3d.json').write_text('{"pins":[]}')
        self.publisher.VERSION = 'v8.97-maps-completion'
        _, frozen, self.local, _ = self.publisher.plan(root / 'base.json', root / 'code', root / 'assets', root / 'over')
        frozen_path = root / 'machine897.json'
        frozen_path.write_text(json.dumps(frozen, indent=2))
        self.args = argparse.Namespace(base_manifest=root / 'base.json', frozen_manifest=frozen_path,
            code=root / 'code', assets=root / 'assets', over=root / 'over', readme=None,
            expect_candidate=frozen['sha256'], expect_manifest_file=paired.sha(frozen_path.read_bytes()),
            publisher=self.publisher_path, report=root / 'private-report.json')
        self.server = Server(base, {paired.sha(raw): raw for raw in base_content.values()})
        self.publisher.call = self.server.call
        self.token = mock.patch.dict(os.environ, GC500_EDIT_TOKEN='fixture-not-a-real-key')
        self.token.start()
        self.addCleanup(self.token.stop)
        self.sleep = mock.patch.object(self.publisher.time, 'sleep', lambda _: None)
        self.sleep.start()
        self.addCleanup(self.sleep.stop)

    def run_phase(self, mode):
        return paired.execute(self.args, self.publisher, mode, 'fixture-not-a-real-key')

    def test_stage_only_keeps_active_manifest_and_never_posts(self):
        before = copy.deepcopy(self.server.active)
        report = self.run_phase('stage-only')
        self.assertEqual(self.server.active, before)
        self.assertEqual(report['post_attempts'], 0)
        self.assertEqual(report['state'], 'blobs-staged-active-manifest-unchanged')
        self.assertGreater(len(report['uploads']), 0)
        self.assertFalse(any(method == 'POST' for method, _ in self.server.calls))

    def test_staging_proves_inventory_without_assuming_an_acknowledgement_schema(self):
        self.server.minimal_ack = True
        report = self.run_phase('stage-only')
        self.assertEqual(report['state'], 'blobs-staged-active-manifest-unchanged')
        self.assertGreater(len(report['uploads']), 0)

    def test_dry_run_is_get_only(self):
        self.assertEqual(self.run_phase('dry-run')['state'], 'dry-run-complete-no-writes')
        self.assertTrue(all(method == 'GET' for method, _ in self.server.calls))

    def test_wrong_base_rejects_before_any_write(self):
        self.server.active['sha256'] = '0' * 64
        with self.assertRaisesRegex(paired.GuardError, 'base changed'):
            self.run_phase('stage-only')
        self.assertTrue(all(method == 'GET' for method, _ in self.server.calls))

    def test_wrong_candidate_and_modified_frozen_metadata_reject_before_network(self):
        self.args.expect_candidate = '0' * 64
        with self.assertRaisesRegex(paired.GuardError, 'expect-candidate'):
            self.run_phase('stage-only')
        self.assertEqual(self.server.calls, [])
        frozen = json.loads(self.args.frozen_manifest.read_text())
        self.args.expect_candidate = frozen['sha256']
        frozen['version'] = 'v8.93-stale-label-same-asset-digest'
        self.args.frozen_manifest.write_text(json.dumps(frozen))
        with self.assertRaisesRegex(paired.GuardError, 'reviewed file SHA'):
            self.run_phase('stage-only')
        self.assertEqual(self.server.calls, [])

    def test_tampered_tile_bytes_reject_before_network(self):
        self.tile.write_bytes(b'wrong reviewed tile')
        with self.assertRaisesRegex(paired.GuardError, 'full frozen manifest'):
            self.run_phase('stage-only')
        self.assertEqual(self.server.calls, [])

    def test_interrupted_staging_leaves_active_unchanged(self):
        before = copy.deepcopy(self.server.active)
        self.server.fail_put_number = 2
        with self.assertRaisesRegex(paired.GuardError, 'PUT transport failed'):
            self.run_phase('stage-only')
        self.assertEqual(self.server.active, before)
        self.assertFalse(any(method == 'POST' for method, _ in self.server.calls))
        self.assertGreater(len(self.server.blobs), len(before['files']))

    def test_publish_refuses_unstaged_blobs_without_any_put_or_post(self):
        with self.assertRaisesRegex(paired.GuardError, 'not fully staged'):
            self.run_phase('publish')
        self.assertTrue(all(method == 'GET' for method, _ in self.server.calls))

    def test_staged_publication_is_one_post_zero_put_and_preserves_frozen_metadata(self):
        self.run_phase('stage-only')
        self.server.calls.clear()
        report = self.run_phase('publish')
        self.assertEqual(report['state'], 'registered-and-public-readback-verified')
        self.assertEqual(self.server.active, json.loads(self.args.frozen_manifest.read_text()))
        self.assertEqual(self.server.active['version'], 'v8.97-maps-completion')
        self.assertEqual([method for method, _ in self.server.calls if method != 'GET'], ['POST'])
        self.assertEqual(report['post_attempts'], 1)

    def test_file_mutation_between_preparation_and_upstream_main_is_rejected(self):
        self.run_phase('stage-only')
        self.server.calls.clear()
        before = copy.deepcopy(self.server.active)
        self.server.before_version = lambda: (self.args.code / 'explorer.js').write_bytes(b'intervening edit')
        with self.assertRaisesRegex(paired.GuardError, 'full frozen manifest'):
            self.run_phase('publish')
        self.assertEqual(self.server.active, before)
        self.assertTrue(all(method == 'GET' for method, _ in self.server.calls))

    def test_transport_denylist_stops_stage_post_and_publish_put(self):
        package = paired.prepare(self.args, self.publisher)
        for mode, method, path, body in (
            ('stage-only', 'POST', '/api/admin/machine/manifest', json.dumps(package['manifest']).encode()),
            ('publish', 'PUT', '/api/admin/machine/blob/' + next(iter(package['payloads'])), next(iter(package['payloads'].values()))),
            ('stage-only', 'POST', '/api/admin/app', b'page'),
        ):
            client = paired.GuardedTransport(self.server.call, package, mode, {'requests': [], 'post_attempts': 0}, lambda: None, lambda: None)
            with self.assertRaises(paired.GuardError):
                client.call(method, path, body)
        self.assertEqual(self.server.calls, [])


if __name__ == '__main__':
    unittest.main()
