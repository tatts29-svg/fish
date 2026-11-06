"""Author: Andrew Fisher. Bounded refinement guards; every network call is mocked."""
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
SPEC = importlib.util.spec_from_file_location('compass1041', HERE.parent / 'publish_compass1041.py')
publisher = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(publisher)
MACHINE_TOOL = Path(os.environ.get('MACHINE_TOOL', '/workspace/fish/03_GC500_Delivery_Control/v6.67_machine_v5.84_fire_sound_phone/machine_set.py'))


def canonical(value):
    if isinstance(value, list):
        return '[' + ','.join(canonical(x) for x in value) + ']'
    if isinstance(value, dict):
        return '{' + ','.join(json.dumps(k) + ':' + canonical(value[k]) for k in sorted(value)) + '}'
    return json.dumps(value)


def stamp(manifest):
    manifest['sha256'] = publisher.sha(canonical({k: manifest[k] for k in ('schema', 'entry', 'files')}).encode())
    return manifest


class Response(io.BytesIO):
    status = 200

    def __init__(self, value):
        super().__init__(value if isinstance(value, bytes) else json.dumps(value).encode())


class RefinementTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.root = Path(self.tmp.name)
        self.candidate = self.root / 'candidate'
        self.out = self.root / 'out'
        self.keep = self.root / 'keep.json'
        self.proof = self.root / 'proof.json'
        self.raw = {}
        paths = publisher.REVIEWED | {'index.html'} | {f'retained/{i}.js' for i in range(229)}
        rows = [{'path': p, 'sha256': publisher.sha(('old:' + p).encode()), 'bytes': len('old:' + p),
                 'type': self.mime(p)} for p in sorted(paths)]
        self.before = stamp({'schema': 'gc500-machine-v1', 'entry': 'index.html', 'files': rows})
        self.assertEqual(len(rows), 236)
        pinned = patch.object(publisher, 'EXPECTED_BASE', self.before['sha256'])
        pinned.start()
        self.addCleanup(pinned.stop)
        self.evidence = {'files': {}}
        self.expected = {}
        updated = copy.deepcopy(publisher.file_map(self.before))
        for path in sorted(publisher.REVIEWED):
            raw = (('new:' if path in publisher.REPLACED else 'old:') + path).encode()
            self.raw[path] = raw
            file = self.candidate / path
            file.parent.mkdir(parents=True, exist_ok=True)
            file.write_bytes(raw)
            detail = {'base': None, 'sha256': publisher.sha(raw), 'bytes': len(raw)}
            self.evidence['files'][path] = detail
            if path in publisher.REPLACED:
                self.expected[path] = {k: detail[k] for k in ('sha256', 'bytes')}
                updated[path] = {'path': path, **self.expected[path], 'type': self.mime(path)}
        self.after = stamp({'schema': 'gc500-machine-v1', 'entry': 'index.html',
                            'files': [updated[p] for p in sorted(updated)]})
        self.keep.write_text(json.dumps(self.before))
        self.proof.write_text(json.dumps(self.evidence))
        self.calls = []
        self.staged = 0
        self.initial_race = False
        self.staging_race = False
        self.corrupt_public = None
        self.live = copy.deepcopy(self.before)

    @staticmethod
    def mime(path):
        return 'text/html; charset=utf-8' if path.endswith('.html') else 'text/javascript; charset=utf-8'

    def inputs(self):
        return publisher.validate_inputs(self.before, self.evidence, self.candidate, self.before['sha256'], canonical)

    def network(self, request, **kwargs):
        method = request.get_method() if hasattr(request, 'get_method') else 'GET'
        url = request.full_url if hasattr(request, 'full_url') else request
        path = urlparse(url).path
        self.calls.append((method, path))
        if method == 'GET' and path == '/api/machine':
            digest = '0' * 64 if self.initial_race or (self.staging_race and self.staged) else self.live['sha256']
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
            name = path.removeprefix('/w/Coates-GC500-2026/')
            return Response(b'corrupt' if name == self.corrupt_public else self.raw[name])
        raise AssertionError('Unexpected network call: ' + str((method, path)))

    def run_tool(self, publish=False, token='fake-test-token', tool=MACHINE_TOOL):
        if not tool.is_file():
            self.skipTest('Set MACHINE_TOOL to the shared machine_set.py')
        args = ['--keep', str(self.keep), '--candidate-dir', str(self.candidate), '--out', str(self.out),
                '--evidence', str(self.proof), '--expected-base', self.before['sha256'], '--machine-tool', str(tool)]
        if publish:
            args.append('--publish')
        capture = io.StringIO()
        with patch.dict(os.environ, {'GC500_EDIT_TOKEN': token}), patch.object(publisher.urllib.request, 'urlopen', self.network), contextlib.redirect_stdout(capture):
            result = publisher.run(args)
        if token:
            self.assertNotIn(token, capture.getvalue())
        return result

    def test_exact_four_changes_keep_all_232_other_descriptors(self):
        self.assertEqual(publisher.validate_union(self.before, self.after, self.expected), 232)
        self.assertEqual(self.inputs()[1], self.expected)

    def test_nonpinned_base_rejected_even_when_its_own_hash_matches(self):
        with patch.object(publisher, 'EXPECTED_BASE', '0' * 64), self.assertRaisesRegex(ValueError, 'pinned current'):
            self.inputs()

    def test_corrupt_retained_digest_rejected(self):
        self.before['files'][0]['bytes'] += 1
        with self.assertRaisesRegex(ValueError, 'pinned current'):
            self.inputs()

    def test_geometry_and_layout_changes_rejected(self):
        for path in publisher.PROTECTED:
            with self.subTest(path=path):
                old = copy.deepcopy(self.evidence['files'][path])
                raw = b'changed-protected-module'
                (self.candidate / path).write_bytes(raw)
                self.evidence['files'][path].update(sha256=publisher.sha(raw), bytes=len(raw))
                with self.assertRaisesRegex(ValueError, 'Geometry and layout'):
                    self.inputs()
                self.evidence['files'][path] = old
                (self.candidate / path).write_bytes(self.raw[path])

    def test_changed_candidate_after_review_rejected_before_network(self):
        (self.candidate / next(iter(publisher.REPLACED))).write_bytes(b'changed')
        with self.assertRaisesRegex(ValueError, 'Candidate changed'):
            self.run_tool()
        self.assertEqual(self.calls, [])

    def test_source_evidence_must_include_all_six_paths(self):
        del self.evidence['files'][next(iter(publisher.PROTECTED))]
        with self.assertRaisesRegex(ValueError, 'six reviewed'):
            self.inputs()

    def test_unchanged_replacement_is_rejected(self):
        path = next(iter(publisher.REPLACED))
        raw = ('old:' + path).encode()
        (self.candidate / path).write_bytes(raw)
        self.evidence['files'][path].update(sha256=publisher.sha(raw), bytes=len(raw))
        with self.assertRaisesRegex(ValueError, 'replacement is unchanged'):
            self.inputs()

    def test_duplicate_added_or_removed_path_is_rejected(self):
        for action in ('duplicate', 'add', 'remove'):
            after = copy.deepcopy(self.after)
            if action == 'duplicate':
                after['files'].append(after['files'][0])
            elif action == 'add':
                after['files'].append({'path': 'extra.js'})
            else:
                after['files'].pop()
            with self.subTest(action=action), self.assertRaises(ValueError):
                publisher.validate_union(self.before, after, self.expected)

    def test_retained_digest_size_or_type_cannot_change(self):
        for key, value in [('sha256', 'a' * 64), ('bytes', 999), ('type', 'text/plain')]:
            after = copy.deepcopy(self.after)
            next(r for r in after['files'] if r['path'] in publisher.PROTECTED)[key] = value
            with self.subTest(key=key), self.assertRaisesRegex(ValueError, 'exact four'):
                publisher.validate_union(self.before, after, self.expected)

    def test_entry_schema_or_reviewed_descriptor_cannot_change(self):
        for key in ('entry', 'schema'):
            after = copy.deepcopy(self.after)
            after[key] = 'wrong'
            with self.assertRaises(ValueError):
                publisher.validate_union(self.before, after, self.expected)
        after = copy.deepcopy(self.after)
        next(r for r in after['files'] if r['path'] in publisher.REPLACED)['type'] = 'text/plain'
        with self.assertRaisesRegex(ValueError, 'content type'):
            publisher.validate_union(self.before, after, self.expected)

    def test_dry_run_only_reads_public_manifest(self):
        result = self.run_tool()
        self.assertFalse(result['published'])
        self.assertEqual(result['otherFilesPreserved'], 232)
        self.assertEqual(result['totalFiles'], 236)
        self.assertEqual(result['stagedBlobs'], 0)
        self.assertEqual(self.calls, [('GET', '/api/machine')])

    def test_dry_run_blocks_a_faulty_tool_write(self):
        source = MACHINE_TOOL.read_text()
        self.assertEqual(source.count('if a.dry_run: return'), 1)
        source = source.replace('if a.dry_run: return', "if a.dry_run: urllib.request.urlopen(urllib.request.Request(a.base + '/api/admin/machine/manifest', data=b'{}', method='POST'))")
        tool = self.root / 'faulty.py'
        tool.write_text(source)
        with self.assertRaisesRegex(ValueError, 'Dry run cannot send'):
            self.run_tool(tool=tool)
        self.assertEqual(self.calls, [('GET', '/api/machine')])

    def test_publish_stages_exact_four_rechecks_and_verifies_all_six_public_files(self):
        result = self.run_tool(publish=True)
        self.assertEqual(result['stagedBlobs'], 4)
        self.assertEqual(self.staged, 4)
        at = self.calls.index(('POST', '/api/admin/machine/manifest'))
        self.assertEqual(self.calls[at - 1], ('GET', '/api/machine'))
        self.assertEqual(sum(m == 'POST' for m, _ in self.calls), 1)
        self.assertEqual(sum(p.startswith('/w/') for _, p in self.calls), 6)
        self.assertEqual(result['addedFiles'], {})
        self.assertTrue(result['publicAssetsExact'])

    def test_initial_race_stops_before_admin_access(self):
        self.initial_race = True
        with self.assertRaisesRegex(ValueError, 'Live machine changed'):
            self.run_tool(publish=True)
        self.assertEqual(self.calls, [('GET', '/api/machine')])

    def test_staging_race_prevents_manifest_registration(self):
        self.staging_race = True
        with self.assertRaisesRegex(ValueError, 'Live machine changed'):
            self.run_tool(publish=True)
        self.assertEqual(self.staged, 4)
        self.assertFalse(any(m == 'POST' for m, _ in self.calls))

    def test_public_changed_or_protected_bytes_are_verified(self):
        for path in [next(iter(publisher.REPLACED)), next(iter(publisher.PROTECTED))]:
            with self.subTest(path=path):
                self.live = copy.deepcopy(self.before)
                self.corrupt_public = path
                with self.assertRaisesRegex(ValueError, 'Public bytes differ'):
                    self.run_tool(publish=True)
                self.assertFalse((self.out / 'publication.json').exists())

    def test_publish_requires_explicit_credential(self):
        with self.assertRaisesRegex(ValueError, 'GC500_EDIT_TOKEN required'):
            self.run_tool(publish=True, token='')
        self.assertEqual(self.calls, [('GET', '/api/machine')])


if __name__ == '__main__':
    unittest.main()
