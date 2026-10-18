"""Author: Andrew Fisher. All network calls mocked; publication guard regressions."""
from pathlib import Path
import contextlib
import copy
import io
import json
import os
import sys
import tempfile
import unittest
from unittest.mock import patch
from urllib.parse import urlparse

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
import machine1064 as guards
import prepare_machine1064 as preparer
import publish_machine1064 as publisher

MACHINE_TOOL = Path(os.environ.get('MACHINE_TOOL', str(HERE.parents[1] / 'satellite_explorer/tools/machine_set.py')))


def stamp(manifest):
    manifest['sha256'] = guards.digest(manifest)
    return manifest


class Response(io.BytesIO):
    status = 200

    def __init__(self, value):
        super().__init__(value if isinstance(value, bytes) else json.dumps(value).encode())


class GuardTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.root = Path(self.tmp.name)
        self.candidate = self.root / 'candidate'
        self.source = self.root / 'source'
        self.out = self.root / 'out'
        self.keep, self.proof = self.root / 'keep.json', self.root / 'proof.json'
        self.original, self.raw = {}, {}
        paths = guards.REPLACED | {'index.html'} | {f'retained/{i}.js' for i in range(233)}
        for path in paths:
            self.original[path] = ('old:' + path).encode()
        script = 'explorer/explorer.js'
        self.original['explorer/index.html'] = ('<script src="explorer.js?v=' + guards.sha(self.original[script])[:12] + '"></script>').encode()
        rows = [{'path': p, 'sha256': guards.sha(self.original[p]), 'bytes': len(self.original[p]),
                 'type': self.mime(p)} for p in sorted(paths)]
        self.before = stamp({'schema': 'gc500-machine-v1', 'entry': 'index.html', 'label': 'Reviewed map set', 'files': rows})
        for module in (guards, preparer, publisher):
            swap = patch.object(module, 'BASE', self.before['sha256'])
            swap.start()
            self.addCleanup(swap.stop)
        self.evidence = {'author': 'Andrew Fisher', 'baseManifest': self.before['sha256'], 'files': {}}
        self.expected = {}
        updated = copy.deepcopy(guards.file_map(self.before))
        for path in sorted(guards.REPLACED):
            for root, raw in ((self.source, self.original[path]), (self.candidate, ('new:' + path).encode())):
                file = root / path
                file.parent.mkdir(parents=True, exist_ok=True)
                file.write_bytes(raw)
            raw = (self.candidate / path).read_bytes()
            self.raw[path] = raw
            detail = {'base': updated[path]['sha256'], 'sha256': guards.sha(raw), 'bytes': len(raw)}
            self.evidence['files'][path] = detail
            self.expected[path] = {k: detail[k] for k in ('sha256', 'bytes')}
            updated[path] = {'path': path, **self.expected[path], 'type': self.mime(path)}
        self.after = stamp({'schema': 'gc500-machine-v1', 'entry': 'index.html', 'label': 'Reviewed map set',
                            'version': 'v10.64-map-performance', 'files': [updated[p] for p in sorted(updated)]})
        self.keep.write_text(json.dumps(self.before))
        self.proof.write_text(json.dumps(self.evidence))
        self.calls, self.staged = [], 0
        self.initial_race = self.staging_race = self.mutate_after_stage = False
        self.corrupt_public = None
        self.level = 'edit'
        self.live = copy.deepcopy(self.before)
        self.runs = 0

    @staticmethod
    def mime(path):
        return 'text/html; charset=utf-8' if path.endswith('.html') else 'text/javascript; charset=utf-8'

    def network(self, request, **kwargs):
        method = request.get_method() if hasattr(request, 'get_method') else 'GET'
        url = request.full_url if hasattr(request, 'full_url') else request
        path = urlparse(url).path
        self.calls.append((method, path))
        if method == 'GET' and path == '/api/machine':
            value = '0' * 64 if self.initial_race or (self.staging_race and self.staged) else self.live['sha256']
            return Response({'status': {'sha256': value, 'files': len(self.live['files'])}})
        if method == 'GET' and path == '/api/version':
            return Response({'level': self.level})
        if method == 'GET' and path == '/api/admin/machine':
            return Response({'blobs': self.before['files']})
        if method == 'PUT' and path.startswith('/api/admin/machine/blob/'):
            self.staged += 1
            if self.mutate_after_stage:
                self.proof.write_text('{}')
            return Response({'ok': True})
        if method == 'POST' and path == '/api/admin/machine/manifest':
            self.live = json.loads(request.data)
            return Response({'ok': True})
        if method == 'GET' and path.startswith('/w/Coates-GC500-2026/'):
            name = path.removeprefix('/w/Coates-GC500-2026/')
            return Response(b'corrupt' if name == self.corrupt_public else self.raw[name])
        raise AssertionError('Unexpected network call: ' + str((method, path)))

    def run_tool(self, publish=False, token='fake-test-token', tool=MACHINE_TOOL, extra=None):
        self.assertTrue(tool.is_file(), 'Set MACHINE_TOOL to the shared machine_set.py')
        self.runs += 1
        self.last_out = self.root / ('run-' + str(self.runs))
        args = ['--keep', str(self.keep), '--candidate-dir', str(self.candidate), '--out', str(self.last_out),
                '--evidence', str(self.proof), '--expected-base', self.before['sha256'], '--machine-tool', str(tool)]
        if publish:
            args.append('--publish')
        args += extra or []
        capture = io.StringIO()
        with patch.dict(os.environ, {'GC500_EDIT_TOKEN': token}), patch.object(publisher.urllib.request, 'urlopen', self.network), contextlib.redirect_stdout(capture):
            result = publisher.run(args)
        if token:
            self.assertNotIn(token, capture.getvalue())
        return result

    def test_exact_two_changes_keep_all_234_other_descriptors(self):
        self.assertEqual(guards.validate_union(self.before, self.after, self.expected), 234)
        self.assertEqual(guards.validate_inputs(self.before, self.evidence, self.candidate), self.expected)

    def test_wrong_pinned_or_corrupt_base_rejected(self):
        with self.assertRaisesRegex(ValueError, 'pinned current'):
            guards.validate_base(self.before, '0' * 64)
        self.before['files'][0]['bytes'] += 1
        with self.assertRaisesRegex(ValueError, 'pinned current'):
            guards.validate_base(self.before)

    def test_schema_entry_and_236_count_required(self):
        for key, value in (('schema', 'other'), ('entry', 'explorer/index.html'), ('files', self.before['files'][:-1])):
            value_before = copy.deepcopy(self.before)
            value_before[key] = value
            with self.subTest(key=key), self.assertRaises(ValueError):
                guards.validate_base(value_before)

    def test_duplicate_added_removed_and_renamed_paths_rejected(self):
        for action in ('duplicate', 'add', 'remove', 'rename'):
            after = copy.deepcopy(self.after)
            if action == 'duplicate': after['files'].append(after['files'][0])
            elif action == 'add': after['files'].append({'path': 'z.js'})
            elif action == 'remove': after['files'].pop()
            else: after['files'][0]['path'] = '../replacement.js'
            with self.subTest(action=action), self.assertRaises(ValueError):
                guards.validate_union(self.before, after, self.expected)

    def test_retained_digest_size_type_or_metadata_cannot_change(self):
        for key, value in (('sha256', 'a' * 64), ('bytes', 999), ('type', 'text/plain'), ('extra', True)):
            after = copy.deepcopy(self.after)
            next(row for row in after['files'] if row['path'] not in guards.REPLACED)[key] = value
            with self.subTest(key=key), self.assertRaisesRegex(ValueError, 'exact two'):
                guards.validate_union(self.before, after, self.expected)

    def test_candidate_digest_and_replacement_mime_checked(self):
        after = copy.deepcopy(self.after)
        after['sha256'] = '0' * 64
        with self.assertRaisesRegex(ValueError, 'digest'):
            guards.validate_union(self.before, after, self.expected)
        after = copy.deepcopy(self.after)
        after['files'][0]['type'] = 'text/plain'
        with self.assertRaisesRegex(ValueError, 'replacement descriptor'):
            guards.validate_union(self.before, after, self.expected)

    def test_source_evidence_base_and_paths_checked(self):
        for change in ('baseManifest', 'source', 'extra'):
            evidence = copy.deepcopy(self.evidence)
            if change == 'baseManifest': evidence['baseManifest'] = '0' * 64
            elif change == 'source': evidence['files']['explorer/explorer.js']['base'] = '0' * 64
            else: evidence['files']['retained/0.js'] = {}
            with self.subTest(change=change), self.assertRaises(ValueError):
                guards.validate_inputs(self.before, evidence, self.candidate)

    def test_changed_candidate_rejected_before_network(self):
        (self.candidate / 'explorer/explorer.js').write_bytes(b'changed')
        with self.assertRaisesRegex(ValueError, 'Candidate changed'):
            self.run_tool()
        self.assertEqual(self.calls, [])

    def test_unchanged_replacement_rejected(self):
        path = 'explorer/explorer.js'
        raw = self.original[path]
        (self.candidate / path).write_bytes(raw)
        self.evidence['files'][path].update(sha256=guards.sha(raw), bytes=len(raw))
        with self.assertRaisesRegex(ValueError, 'unchanged'):
            guards.validate_inputs(self.before, self.evidence, self.candidate)

    def test_prepare_changes_only_script_and_one_index_pin(self):
        with patch.object(preparer, 'apply_tiles', return_value='patched script') as transform:
            proof = preparer.prepare(self.source, self.out, self.keep)
        transform.assert_called_once_with(self.original['explorer/explorer.js'].decode(), 'explorer/explorer.js')
        self.assertEqual(set(proof['files']), guards.REPLACED)
        self.assertEqual((self.out / 'explorer/explorer.js').read_bytes(), b'patched script')
        old_pin = guards.sha(self.original['explorer/explorer.js'])[:12]
        new_pin = guards.sha(b'patched script')[:12]
        self.assertEqual((self.out / 'explorer/index.html').read_bytes(), self.original['explorer/index.html'].replace(old_pin.encode(), new_pin.encode()))

    def test_prepare_bad_source_stops_before_transform_or_output(self):
        (self.source / 'explorer/index.html').write_bytes(b'changed')
        with patch.object(preparer, 'apply_tiles') as transform, self.assertRaisesRegex(ValueError, 'Source bytes differ'):
            preparer.prepare(self.source, self.out, self.keep)
        transform.assert_not_called()
        self.assertFalse(self.out.exists())

    def test_dry_run_only_reads_public_manifest(self):
        result = self.run_tool()
        self.assertFalse(result['published'])
        self.assertEqual(result['otherFilesPreserved'], 234)
        self.assertEqual(result['totalFiles'], 236)
        self.assertEqual(result['stagedBlobs'], 0)
        self.assertEqual(self.calls, [('GET', '/api/machine')])

    def test_dry_run_blocks_faulty_tool_write(self):
        source = MACHINE_TOOL.read_text()
        self.assertEqual(source.count('if a.dry_run: return'), 1)
        source = source.replace('if a.dry_run: return', "if a.dry_run: urllib.request.urlopen(urllib.request.Request(a.base + '/api/admin/machine/manifest', data=b'{}', method='POST'))")
        tool = self.root / 'faulty.py'
        tool.write_text(source)
        with self.assertRaisesRegex(ValueError, 'Dry run cannot send'):
            self.run_tool(tool=tool)
        self.assertEqual(self.calls, [('GET', '/api/machine')])

    def test_publish_stages_two_rechecks_and_verifies_two_public_files(self):
        result = self.run_tool(publish=True)
        self.assertEqual(result['stagedBlobs'], 2)
        at = self.calls.index(('POST', '/api/admin/machine/manifest'))
        self.assertEqual(self.calls[at - 1], ('GET', '/api/machine'))
        self.assertEqual(sum(method == 'POST' for method, _ in self.calls), 1)
        self.assertEqual(sum(path.startswith('/w/') for _, path in self.calls), 2)
        self.assertTrue(result['publicAssetsExact'])

    def test_initial_race_stops_before_admin_access(self):
        self.initial_race = True
        with self.assertRaisesRegex(ValueError, 'Live machine changed'):
            self.run_tool(publish=True)
        self.assertEqual(self.calls, [('GET', '/api/machine')])

    def test_staging_race_or_mutated_evidence_stops_registration(self):
        for field, error in (('staging_race', 'Live machine changed'), ('mutate_after_stage', 'inputs changed')):
            self.calls, self.staged = [], 0
            setattr(self, field, True)
            with self.subTest(field=field), self.assertRaisesRegex(ValueError, error):
                self.run_tool(publish=True)
            self.assertFalse(any(method == 'POST' for method, _ in self.calls))
            setattr(self, field, False)

    def test_public_corruption_never_reports_verified_publication(self):
        self.corrupt_public = 'explorer/explorer.js'
        with self.assertRaisesRegex(ValueError, 'Public bytes differ'):
            self.run_tool(publish=True)
        self.assertFalse((self.last_out / 'publication.json').exists())

    def test_previous_output_cannot_leave_stale_success_for_a_new_run(self):
        self.out.mkdir()
        receipt = self.out / 'publication.json'
        receipt.write_text('{"published": true}')
        with self.assertRaisesRegex(ValueError, 'fresh empty output'):
            self.run_tool(publish=True, extra=['--out', str(self.out)])
        self.assertEqual(self.calls, [])
        self.assertEqual(receipt.read_text(), '{"published": true}')

    def test_publish_requires_credential_edit_level_and_fixed_host(self):
        with self.assertRaisesRegex(ValueError, 'GC500_EDIT_TOKEN required'):
            self.run_tool(publish=True, token='')
        self.level = 'view'
        with self.assertRaisesRegex(ValueError, 'not confirmed edit'):
            self.run_tool(publish=True)
        self.assertFalse(any(method != 'GET' for method, _ in self.calls))
        self.calls = []
        with self.assertRaisesRegex(ValueError, 'established GC500 host'):
            self.run_tool(publish=True, extra=['--base', 'https://other.invalid'])
        self.assertEqual(self.calls, [])


if __name__ == '__main__':
    unittest.main()
