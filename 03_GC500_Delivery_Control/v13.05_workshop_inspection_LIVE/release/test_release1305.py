"""Author: Andrew Fisher. Fake-network publication tests; never contacts the live service."""
from pathlib import Path
import contextlib
import ast
import hashlib
import copy
import io
import json
import os
import sys
import tempfile
import subprocess
import unittest
from unittest.mock import patch
from urllib.parse import urlparse

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
import machine1305 as guards
import publish1305 as publisher
from protected_server1305 import SERVER_BLOBS
from build1305 import MACHINE_TOOL
sys.path.insert(0, str(HERE.parent))
from prepare1305 import validate_import_boundaries


class Response(io.BytesIO):
    status = 200

    def __init__(self, value):
        super().__init__(value if isinstance(value, bytes) else json.dumps(value).encode())


class ReleaseTests(unittest.TestCase):
    def setUp(self):
        temp = tempfile.TemporaryDirectory()
        self.addCleanup(temp.cleanup)
        self.root = Path(temp.name)
        self.tree = self.root / 'machine'
        self.tree.mkdir()
        self.keep = self.root / 'keep.json'
        self.proof = self.root / 'evidence.json'
        self.manifest = self.root / 'candidate.json'
        self.page = b'reviewed unchanged dashboard'
        self.raw = {}
        original_paths = guards.REPLACEMENTS | {'explorer/explorer.js', 'poc3d/index.html',
            'engine-lift-preview.js', 'workshop-service.js', 'workshop-showcase.js', 'workshop-lessons.js',
            'crew-polish.js', 'workshop-learning.js', 'workshop-render.js'}
        paths = original_paths | {f'retained/{i}.js' for i in range(246 - len(original_paths))}
        rows = {}
        for path in paths:
            raw = ('original:' + path).encode()
            rows[path] = guards.descriptor(path, raw)
            local = self.tree / path
            local.parent.mkdir(parents=True, exist_ok=True)
            local.write_bytes(raw)
        self.before = {'schema': 'gc500-machine-v1', 'entry': 'index.html', 'label': 'Retained set',
                       'files': [rows[p] for p in sorted(rows)]}
        self.before['sha256'] = guards.digest(self.before)
        for module, key, value in ((guards, 'BASE', self.before['sha256']),
                                  (publisher, 'BASE', self.before['sha256']),
                                  (guards, 'PAGE_BASE', guards.sha(self.page)),
                                  (publisher, 'DASHBOARD_BASE_SHA256', guards.sha(self.page))):
            swap = patch.object(module, key, value)
            swap.start()
            self.addCleanup(swap.stop)
        self.evidence = {'author': 'Andrew Fisher', 'baseManifest': self.before['sha256'],
                         'dashboardBaseSha256': guards.sha(self.page), 'releaseScopeSha256': guards.SCOPE_SHA256, 'files': {}}
        self.expected = {}
        for path in guards.REQUIRED:
            raw = ('new:' + path).encode()
            self.raw[path] = raw
            detail = guards.descriptor(path, raw)
            self.evidence['files'][path] = {'base': rows[path]['sha256'] if path in rows else None,
                                            'sha256': detail['sha256'], 'bytes': detail['bytes']}
            self.expected[path] = detail
            rows[path] = detail
            (self.tree / path).write_bytes(raw)
        self.after = {'schema': 'gc500-machine-v1', 'entry': 'index.html', 'label': 'Retained set',
                      'version': guards.VERSION, 'files': [rows[p] for p in sorted(rows)]}
        self.after['sha256'] = guards.digest(self.after)
        self.keep.write_text(json.dumps(self.before))
        self.proof.write_text(json.dumps(self.evidence))
        self.manifest.write_text(json.dumps(self.after))
        self.checks = []
        for suite in ('machine1305', 'dashboard1305'):
            for viewport in ('desktop', 'phone'):
                path = self.root / (suite + '-' + viewport + '.json')
                path.write_text(json.dumps({'suite': suite, 'viewport': viewport, 'passed': True,
                    'errors': [], 'consoleErrors': [], 'recordWrites': 0,
                    'machineFiles': {p: d['sha256'] for p, d in self.expected.items()},
                    'machineManifestSha256': self.after['sha256'], 'dashboardSha256': guards.sha(self.page)}))
                self.checks.append(path)
        self.inventory = {row['sha256']: row['bytes'] for row in self.before['files']}
        self.inventory.update(SERVER_BLOBS)
        self.calls = []
        self.live = copy.deepcopy(self.before)
        self.staged = 0
        self.mutate = None
        self.fail_path = None
        self.corrupt_path = None
        self.level = 'edit'
        self.health = {'ok': True, 'build': 'v5.94', 'record_recovered': None, 'tracker_refusing': None}
        self.runs = 0

    def network(self, request, **kwargs):
        method = request.get_method() if hasattr(request, 'get_method') else 'GET'
        url = request.full_url if hasattr(request, 'full_url') else request
        path = urlparse(url).path
        self.calls.append((method, path))
        if path == self.fail_path:
            raise RuntimeError('failure containing fake-test-secret')
        if method == 'GET' and path == '/v/Coates-GC500-2026':
            return Response(self.page)
        if method == 'GET' and path == '/api/machine':
            return Response({'sha256': self.live['sha256'], 'files': len(self.live['files'])})
        if method == 'GET' and path == '/health':
            return Response(self.health)
        if method == 'GET' and path == '/api/version':
            return Response({'level': self.level})
        if method == 'GET' and path == '/api/admin/machine':
            return Response({'status': {'sha256': self.live['sha256'], 'files': len(self.live['files'])},
                             'blobs': [{'sha256': k, 'bytes': v} for k, v in self.inventory.items()]})
        if method == 'PUT' and path.startswith('/api/admin/machine/blob/'):
            self.staged += 1
            self.inventory[path.rsplit('/', 1)[1]] = len(request.data)
            if self.mutate:
                self.mutate()
            return Response({'ok': True})
        if method == 'POST' and path == '/api/admin/machine/manifest':
            self.live = json.loads(request.data)
            self.inventory = {row['sha256']: row['bytes'] for row in self.live['files']}
            self.inventory.update(SERVER_BLOBS)
            return Response({'sha256': self.live['sha256'], 'files': len(self.live['files'])})
        if method == 'GET' and path.startswith('/w/Coates-GC500-2026/'):
            name = path.removeprefix('/w/Coates-GC500-2026/')
            return Response(b'corrupt' if name == self.corrupt_path else self.raw[name])
        raise AssertionError('Unexpected network call: ' + str((method, path)))

    def run_tool(self, publish=False, preflight=False, token='fake-test-secret'):
        self.runs += 1
        args = ['--keep', str(self.keep), '--candidate-dir', str(self.tree), '--evidence', str(self.proof),
                '--manifest', str(self.manifest), '--expected-base', self.before['sha256'],
                '--machine-tool', str(MACHINE_TOOL), '--out', str(self.root / ('out-' + str(self.runs)))]
        if publish:
            args.append('--publish')
            for check in self.checks:
                args += ['--check', str(check)]
        if preflight:
            args.append('--preflight')
        log = io.StringIO()
        with patch.dict(os.environ, {'GC500_EDIT_TOKEN': token}), patch.object(publisher, 'transport', self.network), contextlib.redirect_stdout(log):
            result = publisher.run(args)
        if token:
            self.assertNotIn(token, log.getvalue())
        return result

    def assert_no_register(self):
        self.assertNotIn(('POST', '/api/admin/machine/manifest'), self.calls)

    def test_default_preparation_is_get_only(self):
        result = self.run_tool(token='')
        self.assertFalse(result['published'])
        self.assertEqual(result['totalFiles'], 249)
        self.assertTrue(all(method == 'GET' for method, _ in self.calls))

    def test_authenticated_preflight_is_get_only(self):
        self.assertTrue(self.run_tool(preflight=True)['serverPreflightPassed'])
        self.assertTrue(all(method == 'GET' for method, _ in self.calls))

    def test_publication_preserves_all_paths_and_reads_back_every_changed_file(self):
        result = self.run_tool(publish=True)
        self.assertEqual(result['otherFilesPreserved'], 242)
        self.assertEqual(len(result['addedFiles']), 3)
        self.assertEqual(guards.file_map(self.live), guards.file_map(self.after))
        self.assertEqual(self.staged, len(guards.REQUIRED))
        self.assertTrue(result['publicAssetsExact'])
        self.assertTrue(result['dashboardUnchanged'])
        registration = self.calls.index(('POST', '/api/admin/machine/manifest'))
        self.assertEqual(self.calls[registration - 1], ('GET', '/api/machine'))
        public = {p.removeprefix('/w/Coates-GC500-2026/') for m, p in self.calls if p.startswith('/w/')}
        self.assertEqual(public, guards.REQUIRED)

    def test_changed_source_blocks_before_network(self):
        (self.tree / 'car-app.js').write_bytes(b'changed')
        with self.assertRaises(ValueError): self.run_tool(publish=True)
        self.assertEqual(self.calls, [])

    def test_changed_retained_map_blocks_before_network(self):
        (self.tree / 'explorer/explorer.js').write_bytes(b'changed')
        with self.assertRaises(ValueError): self.run_tool(publish=True)
        self.assertEqual(self.calls, [])

    def test_original_lift_and_other_modules_must_stay_exact(self):
        for name in ('engine-lift-preview.js', 'crew-polish.js', 'workshop-render.js'):
            with self.subTest(name=name):
                local = self.tree / name
                original = local.read_bytes()
                local.write_bytes(b'unreviewed change')
                with self.assertRaises(ValueError): self.run_tool(publish=True)
                self.assertEqual(self.calls, [])
                local.write_bytes(original)

    def test_unconfirmed_scope_blocks_before_network(self):
        with patch.object(guards, 'SCOPE_CONFIRMED', False):
            with self.assertRaisesRegex(ValueError, 'whitelist is not confirmed'): self.run_tool(publish=True)
        self.assertEqual(self.calls, [])

    def test_other_scope_evidence_blocks_before_network(self):
        self.evidence['releaseScopeSha256'] = '0' * 64
        self.proof.write_text(json.dumps(self.evidence))
        with self.assertRaises(ValueError): self.run_tool(publish=True)
        self.assertEqual(self.calls, [])

    def test_every_reviewed_replacement_is_required(self):
        for name in guards.REPLACEMENTS:
            with self.subTest(name=name):
                detail = self.evidence['files'].pop(name)
                self.proof.write_text(json.dumps(self.evidence))
                with self.assertRaises(ValueError): self.run_tool(publish=True)
                self.assertEqual(self.calls, [])
                self.evidence['files'][name] = detail

    def test_removed_path_rejected_even_with_correct_new_digest(self):
        changed = copy.deepcopy(self.after)
        changed['files'] = [r for r in changed['files'] if r['path'] != 'poc3d/index.html']
        changed['sha256'] = guards.digest(changed)
        self.manifest.write_text(json.dumps(changed))
        with self.assertRaises(ValueError): self.run_tool(publish=True)
        self.assertEqual(self.calls, [])

    def test_unknown_addition_rejected(self):
        self.evidence['files']['extra.js'] = {'base': None, 'bytes': 1, 'sha256': guards.sha(b'x')}
        self.proof.write_text(json.dumps(self.evidence))
        with self.assertRaises(ValueError): self.run_tool(publish=True)
        self.assertEqual(self.calls, [])

    def test_missing_required_module_rejected(self):
        del self.evidence['files']['workshop-selection.js']
        self.proof.write_text(json.dumps(self.evidence))
        with self.assertRaises(ValueError): self.run_tool(publish=True)
        self.assertEqual(self.calls, [])

    def test_receipts_must_identify_exact_manifest_and_all_suites(self):
        original = self.checks[0].read_text()
        for field, value in [('machineManifestSha256', '0' * 64), ('machineFiles', {}),
                             ('consoleErrors', ['error']), ('recordWrites', 1),
                             ('viewport', 'tablet'), ('dashboardSha256', '0' * 64), ('passed', False)]:
            with self.subTest(field=field):
                receipt = json.loads(original)
                receipt[field] = value
                self.checks[0].write_text(json.dumps(receipt))
                with self.assertRaises(ValueError): self.run_tool(publish=True)
                self.assertEqual(self.calls, [])
        self.checks[0].write_text(original)
        self.checks[1] = self.checks[0]
        with self.assertRaises(ValueError): self.run_tool(publish=True)

    def test_stale_machine_blocks_before_staging(self):
        self.live['sha256'] = '0' * 64
        with self.assertRaises(ValueError): self.run_tool(publish=True)
        self.assertEqual(self.staged, 0)

    def test_stale_dashboard_blocks_before_staging(self):
        self.page = b'another release'
        with self.assertRaises(ValueError): self.run_tool(publish=True)
        self.assertEqual(self.staged, 0)

    def test_no_edit_access_blocks_staging(self):
        self.level = 'view'
        with self.assertRaises(ValueError): self.run_tool(publish=True)
        self.assertEqual(self.staged, 0)

    def test_missing_token_blocks_staging(self):
        with self.assertRaises(ValueError): self.run_tool(publish=True, token='')
        self.assertEqual(self.staged, 0)

    def test_secret_control_characters_rejected(self):
        with self.assertRaises(ValueError): self.run_tool(publish=True, token='fake\nsecret')
        self.assertEqual(self.calls, [])

    def test_unknown_inventory_blob_blocks_staging(self):
        self.inventory['0' * 64] = 7
        with self.assertRaises(ValueError): self.run_tool(publish=True)
        self.assertEqual(self.staged, 0)

    def test_protected_server_blob_missing_blocks_staging(self):
        del self.inventory[next(iter(SERVER_BLOBS))]
        with self.assertRaises(ValueError): self.run_tool(publish=True)
        self.assertEqual(self.staged, 0)

    def test_evidence_mutation_during_staging_blocks_register(self):
        self.mutate = lambda: self.proof.write_text('{}')
        with self.assertRaises(ValueError): self.run_tool(publish=True)
        self.assert_no_register()

    def test_base_race_during_staging_blocks_register(self):
        self.mutate = lambda: self.live.update(sha256='0' * 64)
        with self.assertRaises(ValueError): self.run_tool(publish=True)
        self.assert_no_register()

    def test_inventory_race_during_staging_blocks_register(self):
        self.mutate = lambda: self.inventory.update({'0' * 64: 7})
        with self.assertRaises(ValueError): self.run_tool(publish=True)
        self.assert_no_register()

    def test_dashboard_race_during_staging_blocks_register(self):
        def mutate(): self.page = b'changed page'
        self.mutate = mutate
        with self.assertRaises(ValueError): self.run_tool(publish=True)
        self.assert_no_register()

    def test_server_change_during_staging_blocks_register(self):
        self.mutate = lambda: self.health.update(build='v5.95')
        with self.assertRaises(ValueError): self.run_tool(publish=True)
        self.assert_no_register()

    def test_wrong_public_readback_is_not_success(self):
        self.corrupt_path = 'car-app.js'
        with self.assertRaisesRegex(ValueError, 'Public bytes differ'): self.run_tool(publish=True)
        journal = json.loads((self.root / 'out-1/publication-attempt.json').read_text())
        self.assertEqual(journal['state'], 'registered-awaiting-public-verification')

    def test_candidate_metadata_mismatch_cannot_register(self):
        self.after['built'] = '2026-11-05'
        self.manifest.write_text(json.dumps(self.after))
        with self.assertRaisesRegex(ValueError, 'Proposed manifest differs'): self.run_tool(publish=True)
        self.assert_no_register()

    def test_preflight_and_public_errors_redact_secret(self):
        for path in ('/api/version', '/w/Coates-GC500-2026/car-app.js'):
            with self.subTest(path=path):
                self.fail_path = path
                with self.assertRaises(RuntimeError) as error: self.run_tool(publish=True)
                self.assertNotIn('fake-test-secret', str(error.exception))
                self.assertIn('[REDACTED]', str(error.exception))


class ProtectionHandoverTests(unittest.TestCase):
    def test_entire_protected_blob_table_matches_verified_v1304(self):
        # Read the previous committed release as data, never importing its mutable
        # module namespace. All eleven hashes and byte counts must be identical.
        relative = '03_GC500_Delivery_Control/v13.04_workshop_detail_LIVE/release/protected_server1304.py'
        # Sparse worktrees need not materialise the previous release folder.
        previous_source = subprocess.check_output(['git', 'show', 'HEAD:' + relative],
                                                  cwd=HERE.parents[2], text=True)
        tree = ast.parse(previous_source)
        previous = next(ast.literal_eval(node.value) for node in tree.body
                        if isinstance(node, ast.Assign) and any(isinstance(target, ast.Name)
                        and target.id == 'SERVER_BLOBS' for target in node.targets))
        self.assertEqual(len(previous), 11)
        self.assertEqual(SERVER_BLOBS, previous)
        self.assertEqual(hashlib.sha256(json.dumps(previous, sort_keys=True, separators=(',', ':')).encode()).hexdigest(),
                         'c7c5a5cf3e4e134d386926c7664b04515f7b4057c8b5b632bae79e5b8c6b2d85')


class SourceBoundaryTests(unittest.TestCase):
    def setUp(self):
        self.files = {
            'index.html': b'<small>Workshop v13.05</small><script type="module" src="./car-app.js?v=13.05"></script>',
            'car-app.js': b"import './workshop-ui.js?v=13.05';import './workshop-lighting.js';import './workshop-selection.js';",
            'workshop-ui.js': b"import './workshop-learning.js?v=13.05';import './workshop-camera.js';",
            'workshop-learning.js': b'export const learning = true;',
            'workshop-camera.js': b'export const camera = true;',
            'workshop-lighting.js': b'export const lighting = true;',
            'workshop-selection.js': b'export const selection = true;',
        }

    def test_complete_changed_graph_is_accepted(self):
        validate_import_boundaries(self.files)

    def test_stale_app_query_is_rejected(self):
        self.files['index.html'] = self.files['index.html'].replace(b'car-app.js?v=13.05', b'car-app.js?v=13.04')
        with self.assertRaises(ValueError): validate_import_boundaries(self.files)

    def test_stale_ui_and_learning_queries_are_rejected(self):
        for source, target in [('car-app.js', b'workshop-ui.js'), ('workshop-ui.js', b'workshop-learning.js')]:
            with self.subTest(source=source):
                original = self.files[source]
                self.files[source] = original.replace(target + b'?v=13.05', target + b'?v=13.04')
                with self.assertRaises(ValueError): validate_import_boundaries(self.files)
                self.files[source] = original

    def test_unreachable_new_module_is_rejected(self):
        self.files['car-app.js'] = self.files['car-app.js'].replace(b"import './workshop-lighting.js';", b'')
        with self.assertRaises(ValueError): validate_import_boundaries(self.files)

    def test_duplicate_app_script_is_rejected(self):
        self.files['index.html'] += b'<script type="module" src="./car-app.js?v=13.05"></script>'
        with self.assertRaises(ValueError): validate_import_boundaries(self.files)


if __name__ == '__main__':
    unittest.main()
