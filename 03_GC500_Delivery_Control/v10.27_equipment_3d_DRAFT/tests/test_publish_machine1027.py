"""Author: Andrew Fisher. Retained-union and publication guards; all network I/O is mocked."""
from pathlib import Path
import contextlib
import copy
import importlib.util
import io
import json
import os
import tempfile
import unittest
from unittest.mock import patch
from urllib.parse import urlparse

HERE = Path(__file__).resolve().parent
SPEC = importlib.util.spec_from_file_location('publish_machine1027', HERE.parent / 'publish_machine1027.py')
publisher = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(publisher)
MACHINE_TOOL = Path(os.environ.get('MACHINE_TOOL', '/workspace/fish/03_GC500_Delivery_Control/v6.67_machine_v5.84_fire_sound_phone/machine_set.py'))


def canonical(value):
    if isinstance(value, list):
        return '[' + ','.join(canonical(x) for x in value) + ']'
    if isinstance(value, dict):
        return '{' + ','.join(json.dumps(k, ensure_ascii=False) + ':' + canonical(value[k]) for k in sorted(value)) + '}'
    return json.dumps(value, ensure_ascii=False)


def stamp(manifest):
    manifest['sha256'] = publisher.sha(canonical({k: manifest[k] for k in ('schema', 'entry', 'files')}).encode())
    return manifest


class Response(io.BytesIO):
    status = 200

    def __init__(self, value):
        super().__init__(value if isinstance(value, bytes) else json.dumps(value).encode())


class PublicationTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.root = Path(self.tmp.name)
        self.candidate_dir = self.root / 'candidate'
        self.out = self.root / 'result'
        self.evidence_path = self.root / 'source-bound.json'
        self.keep_path = self.root / 'retained.json'
        self.raw = {}
        rows = []
        for path in sorted(publisher.REPLACED | {'index.html'} | {f'retained/f{i}.js' for i in range(229)}):
            raw = ('original:' + path).encode()
            rows.append({'path': path, 'sha256': publisher.sha(raw), 'bytes': len(raw),
                         'type': self.mime(path)})
        self.before = stamp({'schema': 'gc500-machine-v1', 'entry': 'index.html', 'files': rows})
        old = publisher.file_map(self.before)
        self.evidence = {'author': 'Andrew Fisher', 'files': {}}
        self.expected = {}
        for path in sorted(publisher.ALLOWED):
            raw = ('candidate:' + path).encode()
            file = self.candidate_dir / path
            file.parent.mkdir(parents=True, exist_ok=True)
            file.write_bytes(raw)
            detail = {'base': old[path]['sha256'] if path in old else None,
                      'sha256': publisher.sha(raw), 'bytes': len(raw)}
            self.raw[path] = raw
            self.evidence['files'][path] = detail
            self.expected[path] = {k: detail[k] for k in ('sha256', 'bytes')}
        updated = copy.deepcopy(old)
        for path, detail in self.expected.items():
            updated[path] = {'path': path, **detail, 'type': self.mime(path)}
        self.after = stamp({'schema': 'gc500-machine-v1', 'entry': 'index.html',
                            'files': [updated[path] for path in sorted(updated)]})
        self.write_sources()
        self.calls = []
        self.staged = 0
        self.race_after_staging = False
        self.initial_race = False
        self.live = copy.deepcopy(self.before)

    @staticmethod
    def mime(path):
        return 'text/html; charset=utf-8' if path.endswith('.html') else 'text/javascript; charset=utf-8'

    def write_sources(self):
        self.keep_path.write_text(json.dumps(self.before))
        self.evidence_path.write_text(json.dumps(self.evidence))

    def inputs(self):
        return publisher.validate_inputs(self.before, self.evidence, self.candidate_dir, self.before['sha256'], canonical)

    def fake_network(self, request, **_kwargs):
        method = request.get_method() if hasattr(request, 'get_method') else 'GET'
        url = request.full_url if hasattr(request, 'full_url') else request
        path = urlparse(url).path
        self.calls.append((method, path))
        if method == 'GET' and path == '/api/machine':
            digest = '0' * 64 if self.initial_race or (self.race_after_staging and self.staged) else self.live['sha256']
            return Response({'status': {'sha256': digest, 'files': len(self.live['files'])}})
        if method == 'GET' and path == '/api/admin/machine':
            return Response({'blobs': self.before['files']})
        if method == 'PUT' and path.startswith('/api/admin/machine/blob/'):
            self.staged += 1
            return Response({'ok': True})
        if method == 'POST' and path == '/api/admin/machine/manifest':
            self.live = json.loads(request.data)
            return Response({'ok': True})
        if method == 'GET' and path.startswith('/w/Coates-GC500-2026/'):
            return Response(self.raw[path.removeprefix('/w/Coates-GC500-2026/')])
        raise AssertionError('Unexpected network call: ' + str((method, path)))

    def run_tool(self, publish=False, token='unit-test-placeholder-not-a-real-token', machine_tool=None):
        machine_tool = machine_tool or MACHINE_TOOL
        if not machine_tool.is_file():
            self.skipTest('Set MACHINE_TOOL to the shared machine_set.py for integration checks')
        args = ['--keep', str(self.keep_path), '--candidate-dir', str(self.candidate_dir),
                '--out', str(self.out), '--evidence', str(self.evidence_path),
                '--expected-base', self.before['sha256'], '--machine-tool', str(machine_tool)]
        if publish:
            args.append('--publish')
        capture = io.StringIO()
        with patch.dict(os.environ, {'GC500_EDIT_TOKEN': token}), \
                patch.object(publisher.urllib.request, 'urlopen', self.fake_network), \
                contextlib.redirect_stdout(capture):
            result = publisher.run(args)
        self.assertNotIn(token, capture.getvalue())
        return result

    def test_valid_six_file_union_retains_all_other_230(self):
        self.assertEqual(publisher.validate_union(self.before, self.after, self.expected), 230)
        self.assertEqual(len(self.after['files']), 236)

    def test_null_base_is_valid_only_for_the_three_new_paths(self):
        digest, expected = self.inputs()
        self.assertEqual(digest, self.before['sha256'])
        self.assertEqual(expected, self.expected)
        self.evidence['files'][next(iter(publisher.ADDED))]['base'] = '1' * 64
        with self.assertRaisesRegex(ValueError, 'base=null'):
            self.inputs()

    def test_new_path_cannot_already_exist_in_retained_manifest(self):
        path = next(iter(publisher.ADDED))
        self.before['files'].append({'path': path, **self.expected[path], 'type': self.mime(path)})
        stamp(self.before)
        with self.assertRaisesRegex(ValueError, 'absent'):
            self.inputs()

    def test_replacement_cannot_have_null_base(self):
        self.evidence['files'][next(iter(publisher.REPLACED))]['base'] = None
        with self.assertRaisesRegex(ValueError, 'input changed'):
            self.inputs()

    def test_changed_candidate_bytes_fail_before_network(self):
        (self.candidate_dir / next(iter(publisher.ADDED))).write_bytes(b'changed')
        with self.assertRaisesRegex(ValueError, 'Candidate changed'):
            self.inputs()

    def test_malformed_digest_or_size_is_rejected(self):
        path = next(iter(publisher.ADDED))
        for field, value in [('sha256', 'not-a-sha'), ('bytes', True), ('bytes', 0)]:
            with self.subTest(field=field, value=value):
                original = self.evidence['files'][path][field]
                self.evidence['files'][path][field] = value
                with self.assertRaisesRegex(ValueError, 'Invalid reviewed'):
                    self.inputs()
                self.evidence['files'][path][field] = original

    def test_wrong_reviewed_manifest_digest_is_rejected(self):
        with self.assertRaisesRegex(ValueError, 'reviewed current base'):
            publisher.validate_inputs(self.before, self.evidence, self.candidate_dir, '0' * 64, canonical)

    def test_duplicate_path_is_rejected(self):
        self.after['files'].append(self.after['files'][0])
        with self.assertRaisesRegex(ValueError, 'Duplicate'):
            publisher.validate_union(self.before, self.after, self.expected)

    def test_retained_deletion_and_modification_are_rejected(self):
        saved = copy.deepcopy(self.after)
        self.after['files'] = [row for row in self.after['files'] if row['path'] != 'index.html']
        with self.assertRaisesRegex(ValueError, 'added or removed'):
            publisher.validate_union(self.before, self.after, self.expected)
        self.after = saved
        next(row for row in self.after['files'] if row['path'] == 'index.html')['bytes'] += 1
        with self.assertRaisesRegex(ValueError, 'exact three'):
            publisher.validate_union(self.before, self.after, self.expected)

    def test_extra_added_path_is_rejected(self):
        self.after['files'].append({'path': 'unreviewed.js', 'sha256': 'a' * 64, 'bytes': 1, 'type': self.mime('x.js')})
        with self.assertRaisesRegex(ValueError, 'added or removed'):
            publisher.validate_union(self.before, self.after, self.expected)

    def test_candidate_descriptor_and_entry_are_checked(self):
        path = next(iter(publisher.ADDED))
        for field, value in [('sha256', 'b' * 64), ('bytes', 500), ('type', 'text/plain')]:
            with self.subTest(field=field):
                altered = copy.deepcopy(self.after)
                next(row for row in altered['files'] if row['path'] == path)[field] = value
                with self.assertRaises(ValueError):
                    publisher.validate_union(self.before, altered, self.expected)
        self.after['entry'] = 'explorer/index.html'
        with self.assertRaisesRegex(ValueError, 'entry or schema'):
            publisher.validate_union(self.before, self.after, self.expected)

    def test_default_dry_run_never_sends_writes(self):
        result = self.run_tool()
        self.assertFalse(result['published'])
        self.assertEqual(result['otherFilesPreserved'], 230)
        self.assertEqual(result['totalFiles'], 236)
        self.assertEqual(self.calls, [('GET', '/api/machine')])
        self.assertTrue((self.out / 'preparation.json').is_file())
        self.assertFalse((self.out / 'publication.json').exists())

    def test_dry_run_guard_blocks_a_tool_that_attempts_a_write(self):
        if not MACHINE_TOOL.is_file():
            self.skipTest('Set MACHINE_TOOL to the shared machine_set.py')
        source = MACHINE_TOOL.read_text()
        self.assertEqual(source.count('if a.dry_run: return'), 1)
        source = source.replace('if a.dry_run: return',
            "if a.dry_run: urllib.request.urlopen(urllib.request.Request(a.base + '/api/admin/machine/manifest', data=b'{}', method='POST'))")
        faulty_tool = self.root / 'faulty_machine.py'
        faulty_tool.write_text(source)
        with self.assertRaisesRegex(ValueError, 'Dry run cannot send network writes'):
            self.run_tool(machine_tool=faulty_tool)
        self.assertEqual(self.calls, [('GET', '/api/machine')])
        self.assertFalse((self.out / 'preparation.json').exists())
        self.assertFalse((self.out / 'publication.json').exists())

    def test_explicit_publish_checks_again_after_staging_and_reads_back(self):
        result = self.run_tool(publish=True)
        self.assertTrue(result['publicAssetsExact'])
        self.assertEqual(self.staged, 6)
        index = self.calls.index(('POST', '/api/admin/machine/manifest'))
        self.assertEqual(self.calls[index-1], ('GET', '/api/machine'))
        self.assertTrue(any(method == 'PUT' for method, _ in self.calls[:index-1]))
        self.assertEqual(sum(method == 'POST' for method, _ in self.calls), 1)
        self.assertEqual(self.live['sha256'], result['candidateManifestSha256'])
        self.assertTrue((self.out / 'publication.json').is_file())

    def test_race_after_staging_blocks_manifest_registration(self):
        self.race_after_staging = True
        with self.assertRaisesRegex(ValueError, 'Live machine changed'):
            self.run_tool(publish=True)
        self.assertEqual(self.staged, 6)
        self.assertFalse(any(method == 'POST' for method, _ in self.calls))
        self.assertFalse((self.out / 'publication.json').exists())

    def test_initial_live_change_blocks_all_admin_calls(self):
        self.initial_race = True
        with self.assertRaisesRegex(ValueError, 'Live machine changed'):
            self.run_tool(publish=True)
        self.assertEqual(self.calls, [('GET', '/api/machine')])

    def test_publish_requires_explicit_credential(self):
        with self.assertRaisesRegex(ValueError, 'GC500_EDIT_TOKEN required'):
            self.run_tool(publish=True, token='')
        self.assertEqual(self.calls, [('GET', '/api/machine')])


if __name__ == '__main__':
    unittest.main()
