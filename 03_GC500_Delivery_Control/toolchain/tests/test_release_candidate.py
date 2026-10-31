#!/usr/bin/env python3
"""Author: Andrew Fisher. Runner failure propagation, using fixture processes only; no network/browser."""
import argparse
import hashlib
import importlib.util
import json
import os
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest
from unittest import mock

spec = importlib.util.spec_from_file_location('release_candidate', Path(__file__).resolve().parents[1] / 'release_candidate.py')
runner = importlib.util.module_from_spec(spec)
spec.loader.exec_module(runner)


class MachineBindings(unittest.TestCase):
    """Real byte fixtures exercise stale assets/resumed acceptance without a browser."""
    def setUp(self):
        self.temporary = tempfile.TemporaryDirectory()
        self.addCleanup(self.temporary.cleanup)
        self.root = Path(self.temporary.name)
        self.machine = self.root / 'machine'
        content = {
            'index.html': b'<html>retained machine</html>',
            'app.js': b'// retained dependency',
            'explorer/index.html': b'<html>candidate explorer</html>',
            'explorer/explorer.js': b'// completion code',
            'explorer/assets/drawing-scene.bin': b'candidate scene',
            'explorer/assets/vt/manifest.json': b'{"levels":[{"file":"tile-final.bin"}]}',
            'explorer/assets/vt/tile-final.bin': b'final tile bytes',
            'poc3d/units3d.json': b'{"pins":[]}',
            'poc3d/renderer.js': b'// retained 3D renderer',
        }
        self.manifest = {'schema': 'gc500-machine-v1', 'entry': 'index.html', 'files': []}
        for name, body in sorted(content.items()):
            filename = self.machine / name
            filename.parent.mkdir(parents=True, exist_ok=True)
            filename.write_bytes(body)
            self.manifest['files'].append({'path': name, 'bytes': len(body),
                'sha256': hashlib.sha256(body).hexdigest(), 'type': 'application/octet-stream'})
        self.manifest_path = self.root / 'machine.json'
        self.write_manifest()
        self.env = {**os.environ, 'MACHINE_MANIFEST': str(self.manifest_path),
                    'MACHINE_ROOT': str(self.machine), 'CODE': str(self.machine / 'explorer'),
                    'ASSETS': str(self.machine / 'explorer/assets'), 'POC3D': str(self.machine / 'poc3d'),
                    'LOCAL': str(self.machine / 'explorer')}
        self.env.pop('MACHINE_BINDING', None)

    def write_manifest(self):
        canonical = json.dumps({k: self.manifest[k] for k in ('schema', 'entry', 'files')},
                               sort_keys=True, ensure_ascii=False, separators=(',', ':')).encode()
        self.manifest['sha256'] = hashlib.sha256(canonical).hexdigest()
        self.manifest_path.write_text(json.dumps(self.manifest))

    def test_binds_every_manifest_file_including_retained_dependencies(self):
        binding = runner.machine_binding(self.env)
        self.assertEqual(len(binding['files']), 9)
        self.assertEqual(binding['machine_sha256'], self.manifest['sha256'])
        self.assertEqual(binding['manifest_sha256'], runner.file_hash(self.manifest_path))
        self.assertEqual(binding['files']['app.js']['source'], str(self.machine / 'app.js'))
        self.assertEqual(binding['files']['poc3d/renderer.js']['sha256'],
                         runner.file_hash(self.machine / 'poc3d/renderer.js'))

    def test_rejects_changed_code_and_stale_tiles_even_with_expected_filename_and_size(self):
        for name in ('explorer/explorer.js', 'explorer/assets/vt/tile-final.bin', 'poc3d/units3d.json', 'app.js'):
            with self.subTest(file=name):
                filename = self.machine / name
                original = filename.read_bytes()
                filename.write_bytes(b'X' * len(original))
                with self.assertRaisesRegex(ValueError, 'machine bytes differ'):
                    runner.machine_binding(self.env)
                filename.write_bytes(original)

    def test_missing_retained_and_tile_files_cannot_fall_back_to_live(self):
        for name in ('app.js', 'poc3d/renderer.js', 'explorer/assets/vt/tile-final.bin'):
            with self.subTest(file=name):
                filename = self.machine / name
                body = filename.read_bytes()
                filename.unlink()
                with self.assertRaisesRegex(ValueError, 'missing local machine file'):
                    runner.machine_binding(self.env)
                filename.write_bytes(body)

    def test_missing_stale_manifest_and_alternate_local_code_are_rejected(self):
        with self.assertRaisesRegex(ValueError, 'require MACHINE_MANIFEST'):
            runner.machine_binding({})
        self.manifest['sha256'] = '0' * 64
        self.manifest_path.write_text(json.dumps(self.manifest))
        with self.assertRaisesRegex(ValueError, 'claimed digest'):
            runner.machine_binding(self.env)
        self.write_manifest()
        with self.assertRaisesRegex(ValueError, 'LOCAL must resolve to CODE'):
            runner.machine_binding(dict(self.env, LOCAL=str(self.root)))

    def test_resume_preserves_first_machine_binding_even_if_new_manifest_is_self_consistent(self):
        captured = runner.machine_binding(self.env)
        build = dict.fromkeys(('candidate_sha256', 'base_sha256', 'patches', 'sources'), 'fixture')
        filename = self.root / 'machine-inputs.json'
        runner.bind_browser_inputs(filename, build, captured)
        original = filename.read_bytes()
        runner.bind_browser_inputs(filename, build, runner.machine_binding(self.env))
        self.assertEqual(filename.read_bytes(), original)
        # Even manifest formatting/metadata changes require an explicit new review.
        self.manifest['version'] = 'changed after initial browser attempt'
        self.write_manifest()
        current = runner.machine_binding(self.env)
        with self.assertRaisesRegex(ValueError, 'machine inputs differ'):
            runner.require_same_machine(captured, current)
        with self.assertRaisesRegex(ValueError, 'captured browser attempt'):
            runner.bind_browser_inputs(filename, build, current)
        self.assertEqual(filename.read_bytes(), original)
        self.manifest.pop('version')
        code = self.machine / 'explorer/explorer.js'
        code.write_bytes(b'// replacement candidate code')
        row = next(row for row in self.manifest['files'] if row['path'] == 'explorer/explorer.js')
        row.update(bytes=code.stat().st_size, sha256=runner.file_hash(code))
        self.write_manifest()
        with self.assertRaisesRegex(ValueError, 'captured browser attempt'):
            runner.bind_browser_inputs(filename, build, runner.machine_binding(self.env))

    def test_sweep_machine_requests_are_byte_verified_and_never_fall_back(self):
        binding_file = self.root / 'expected-binding.json'
        binding_file.write_text(json.dumps(runner.machine_binding(self.env)))
        self.env['EXPECTED_BINDING'] = str(binding_file)
        script = r'''
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {prepareMachine, machineAsset, installAssets} = require(process.argv[1]);
(async () => {
  const machine = prepareMachine(process.env);
  assert.deepEqual(machine, JSON.parse(fs.readFileSync(process.env.EXPECTED_BINDING, 'utf8')));
  assert.equal(Object.keys(machine.files).length, 9);
  assert.equal(machineAsset(machine, 'explorer/explorer.js').body.toString(), '// completion code');
  assert.throws(() => machineAsset(machine, 'undeclared.js'), /absent from the frozen manifest/);
  const filename = path.join(process.env.CODE, 'explorer.js');
  fs.writeFileSync(filename, '// malicious stale');
  assert.throws(() => machineAsset(machine, 'explorer/explorer.js'), /machine asset/);
  assert.throws(() => prepareMachine(process.env));
  fs.writeFileSync(filename, '// completion code');
  let handler;
  const session = {counts: {blocked: 0}, page: {context: () => ({route: async (_, cb) => {handler = cb;}})}};
  const result = {failures: []};
  await installAssets(session, {machine, media: new Map(), tileFiles: 1}, result);
  let fulfilled = 0, aborted = 0, fallback = 0;
  const request = name => ({
    request: () => ({url: () => 'https://gc500-production.up.railway.app/w/Coates-GC500-2026/' + name,
      method: () => 'GET', headers: () => ({})}),
    fulfill: async r => {assert.equal(r.status, 200); fulfilled++;},
    abort: async () => {aborted++;}, fallback: async () => {fallback++;}
  });
  await handler(request('poc3d/renderer.js'));
  await handler(request('explorer/assets/undeclared.bin'));
  assert.equal(fulfilled, 1);
  assert.equal(aborted, 1);
  assert.equal(fallback, 0);
  assert.equal(result.failures.length, 1);
  console.log('PASS local manifest-byte and fail-closed routing fixtures');
})().catch(e => {console.error(e); process.exitCode = 1;});
'''
        result = subprocess.run(['node', '-e', script, str(runner.HERE / 'harness/release_sweep.cjs')],
                                env=self.env, capture_output=True, text=True)
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
        self.assertIn('PASS local manifest-byte', result.stdout)


class OutputChecks(unittest.TestCase):
    def test_rejects_failed_or_missing_assertions(self):
        for output in ('', 'all done', 'FAIL missing asset', 'PASS first\nFAIL second',
                       'AssertionError: missing tag', 'PASS first\nTraceback (most recent call last):',
                       '{"first":true,"second":false}', '{"pass":false}', '{}', '{broken'):
            with self.subTest(output=output), self.assertRaises(ValueError):
                runner.validate_output(output)

    def test_accepts_positive_assertions(self):
        runner.validate_output('PASS identity\nPASS all checks\n')
        runner.validate_output('{"first":true,"second":true}')

    def test_review_fixture_requires_selected_source_and_corrected_behaviour(self):
        good = {'pass': True, 'sourceMatchesCandidate': True, 'expected': 'corrected behaviour', 'results': [{}]}
        runner.validate_output(json.dumps(good), 'review')
        for key, value in (('pass', False), ('sourceMatchesCandidate', False),
                           ('expected', 'reviewed defects reproduced'), ('results', [])):
            with self.subTest(field=key), self.assertRaises(ValueError):
                runner.validate_output(json.dumps(dict(good, **{key: value})), 'review')

    def test_counted_summary_keeps_metadata_separate_from_assertions(self):
        good = {'author': 'Andrew Fisher', 'passed': 12, 'failed': 0, 'network': False,
                'reduced': False, 'liveWrites': 0, 'blocked': 0, 'errors': [], 'consoleErrors': []}
        runner.validate_output('PASS example\n' + json.dumps(good))
        for field, value in (('failed', 1), ('passed', 0), ('pass', False), ('success', False),
                             ('errors', ['runtime error']), ('consoleErrors', ['error']), ('blocked', 1), ('liveExplorer', 1)):
            with self.subTest(field=field), self.assertRaises(ValueError):
                runner.validate_output('PASS example\n' + json.dumps(dict(good, **{field: value})))

    def test_sweep_requires_every_route_link_and_back(self):
        row = {'ok': True, 'errors': [], 'console': []}
        result = {'success': True, 'tabs': dict.fromkeys(runner.ROUTES, row),
                  'hashes': dict.fromkeys(runner.LINKS, row), 'counts': {'blocked': 0},
                  'assets': {'machineSha256': 'a' * 64, 'manifestSha256': 'b' * 64,
                             'machineFiles': 9, 'explorerRequests': 1, 'failures': []},
                  'back': {'hash': '#plant', 'pane': 'pane-plant'},
                  'allErrors': [], 'cons': [], 'failures': []}
        runner.validate_output(json.dumps(result), 'sweep')
        variants = []
        for field, value in (('tabs', {}), ('hashes', {}), ('back', {'hash': '#today'}),
                             ('counts', {'blocked': 1}), ('allErrors', ['error']),
                             ('cons', ['error']), ('success', False), ('assets', {})):
            variants.append(dict(result, **{field: value}))
        changed = dict(result, tabs=dict(result['tabs']))
        changed['tabs']['today'] = dict(row, ok=False)
        variants.append(changed)
        for data in variants:
            with self.subTest(data=data), self.assertRaises(ValueError):
                runner.validate_output(json.dumps(data), 'sweep')


class ProcessChecks(unittest.TestCase):
    def test_source_binding_covers_helpers_descriptors_and_direct_assets(self):
        with tempfile.TemporaryDirectory() as folder:
            root = Path(folder)
            tools = root / 'toolchain'
            draft = root / runner.FOLDERS[896]
            tools.mkdir()
            draft.mkdir()
            patch = draft / 'patch_v896.py'
            patch.write_text('# fixture')
            (draft / 'scene.js').write_text('const scene = 1;')
            (draft / 'assets').mkdir()
            (draft / 'assets/small.webp').write_bytes(b'actual build input')
            (draft / 'atlas896.json').write_text('{"cells":[{"file":"small.webp"}]}')
            (tools / 'rep.py').write_text('# build helper')
            for excluded in ('evidence', 'archive', 'generated', 'node_modules'):
                (draft / excluded).mkdir()
                (draft / excluded / 'ignored.json').write_text('{}')
            (draft / 'README.md').write_text('review notes')
            extra = root / 'external.csv'
            extra.write_text('authorised source')
            with mock.patch.multiple(runner, HERE=tools, CONTROL=root):
                bound = runner.source_binding([(896, patch)], {}, [extra])
                files = bound['files']
                for path in (patch, draft / 'scene.js', draft / 'atlas896.json',
                             draft / 'assets/small.webp', tools / 'rep.py', extra):
                    self.assertEqual(files[str(path)], runner.file_hash(path))
                self.assertEqual(len(files), 6)
                (draft / 'evidence/ignored.json').write_text('{"changed":true}')
                runner.require_same_sources(bound, runner.source_binding([(896, patch)], {}, [extra]))
                (draft / 'scene.js').write_text('const scene = 2;')
                with self.assertRaisesRegex(ValueError, 'bounded source inputs differ'):
                    runner.require_same_sources(bound, runner.source_binding([(896, patch)], {}, [extra]))
                with self.assertRaisesRegex(ValueError, 'bounded source inputs differ'):
                    runner.require_same_sources(None, bound)  # Old patch-only snapshots are not upgraded by assumption.

    def run_fixture(self, code, kind='assertions', timeout=10):
        with tempfile.TemporaryDirectory() as folder:
            return runner.run_step('fixture', [sys.executable, '-c', code], os.environ.copy(),
                                   Path(folder), timeout, kind)

    def test_nonzero_exit_wins_over_printed_pass(self):
        with self.assertRaisesRegex(ValueError, 'exited 7'):
            self.run_fixture('print("PASS misleading"); raise SystemExit(7)')

    def test_zero_exit_does_not_mask_fail_or_false_json(self):
        for code in ('print("FAIL hidden by exit zero")', 'print(\'{"pass":false}\')', 'pass'):
            with self.subTest(code=code), self.assertRaises(ValueError):
                self.run_fixture(code)

    def test_positive_process_returns_evidence(self):
        self.assertEqual(self.run_fixture('print("PASS checked")')['status'], 'pass')

    def test_timeout_is_failure(self):
        with self.assertRaises(subprocess.TimeoutExpired):
            self.run_fixture('import time; time.sleep(10)', timeout=0.05)

    def test_known_order_matches_current_patch_dependencies(self):
        args = argparse.Namespace(versions='884,885,886,887,888,889,893,894,891,892,895,896,897', patch=None)
        self.assertEqual([v for v, _ in runner.select_patches(args)], list(runner.CHAIN))
        args.versions = '894,895,891'
        with self.assertRaises(ValueError):
            runner.select_patches(args)

    def test_final_checks_replace_stale_record_and_layout_assumptions(self):
        checks = runner.browser_checks(list(runner.CHAIN), Path('/private/snapshots'), Path('/private/final.html'), regression=True)
        names = {script.name: (environment, scope) for script, environment, scope in checks}
        for name in ('test_ep886_fixtures.cjs', 'test_lighting894_verified.cjs', 'test_scene896.cjs', 'test_scope896.cjs'):
            self.assertEqual(names[name], ({'PAGE': '/private/final.html'}, 'final'))
        for name in ('test_ep886.cjs', 'test_lighting894.cjs', 'test_layout876.cjs'):
            self.assertNotIn(name, names)
        self.assertEqual(names['test_aplus892.cjs'], ({'PAGE': '/private/final.html'}, 'final'))
        self.assertEqual(names['test_money892_pinned.cjs'],
                         ({'PAGE': '/private/final.html', 'BASE': '/private/snapshots/v892.before.html'}, 'final'))

    def test_shell_wrapper_works_outside_checkout(self):
        run = subprocess.run(['bash', str(runner.HERE / 'release_candidate.sh'), '--help'],
                             cwd='/tmp', capture_output=True, text=True)
        self.assertEqual(run.returncode, 0, run.stderr)
        self.assertIn('--evidence-dir', run.stdout)

    def test_wrapper_preserves_stage_sidecar_and_propagates_patch_failure(self):
        with tempfile.TemporaryDirectory() as folder:
            root = Path(folder)
            snapshots = root / 'private'
            snapshots.mkdir()
            page = root / 'page.html'
            page.write_text('before')
            patch = root / 'patch.py'
            patch.write_text('from pathlib import Path\nimport sys\np=Path(sys.argv[1])\np.write_text("after")\np.with_name("media_manifest_v896.json").write_text("{}")\n')
            wrapper = runner.make_wrappers([(896, patch)], snapshots)[0]
            result = subprocess.run([sys.executable, wrapper, str(page)], capture_output=True)
            self.assertEqual(result.returncode, 0)
            self.assertEqual((snapshots / 'v896.before.html').read_text(), 'before')
            self.assertEqual((snapshots / 'v896.after.html').read_text(), 'after')
            self.assertEqual((snapshots / 'media_manifest_v896.json').read_text(), '{}')
            patch.write_text('raise SystemExit(7)\n')
            result = subprocess.run([sys.executable, wrapper, str(page)], capture_output=True)
            self.assertNotEqual(result.returncode, 0)

    def test_fixture_build_binds_resume_to_candidate_and_keeps_evidence_private(self):
        with tempfile.TemporaryDirectory() as folder:
            root = Path(folder)
            repo = root / 'repo'
            control = repo / 'control'
            tools = control / 'toolchain'
            tools.mkdir(parents=True)
            (repo / '.git').mkdir()
            (repo / '.git/HEAD').write_text('ref: refs/heads/fixture\n')
            (tools / 'build.sh').write_text('''#!/bin/bash
set -euo pipefail
here="$(cd "$(dirname "$0")" && pwd)"
out="$here/../build/GC500_$1"
shift
mkdir -p "$out"
printf base > "$out/base_live.html"
cp "$out/base_live.html" "$out/GC500_Delivery_Control_hosted.html"
for p in "$@"; do python3 "$p" "$out/GC500_Delivery_Control_hosted.html"; done
''')
            (tools / 'check_page.py').write_text('print("PASS fixture page")\n')
            patch = repo / 'patch_custom.py'
            source = repo / 'selected.js'
            source.write_text(' changed')
            patch.write_text('from pathlib import Path\nimport sys\np=Path(sys.argv[1]); p.write_text(p.read_text()+Path(__file__).with_name("selected.js").read_text())\n')
            evidence = root / 'private'
            with mock.patch.multiple(runner, HERE=tools, CONTROL=control, REPO=repo):
                self.assertEqual(runner.main(['--patch', str(patch), '--label', 'fixture', '--build-only',
                                              '--evidence-dir', str(evidence)]), 0)
                page = control / 'build/GC500_fixture/GC500_Delivery_Control_hosted.html'
                self.assertEqual(page.read_text(), 'base changed')
                self.assertEqual(evidence.stat().st_mode & 0o777, 0o700)
                binding = json.loads((evidence / 'snapshots/build.json').read_text())
                self.assertEqual(binding['candidate_sha256'], runner.file_hash(page))
                self.assertEqual(binding['sources']['files'][str(source)], runner.file_hash(source))
                source.write_text(' changed after capture')
                with self.assertRaisesRegex(ValueError, 'bounded source inputs differ'):
                    runner.main(['--patch', str(patch), '--page', str(page), '--snapshots', str(evidence / 'snapshots'),
                                 '--test', str(root / 'not-run.cjs'), '--evidence-dir', str(root / 'source-resume')])
                source.write_text(' changed')
                page.write_text('different candidate')
                with self.assertRaisesRegex(ValueError, 'differs from the captured build'):
                    runner.main(['--patch', str(patch), '--page', str(page), '--snapshots', str(evidence / 'snapshots'),
                                 '--test', str(root / 'not-run.cjs'), '--evidence-dir', str(root / 'resume')])
                with self.assertRaisesRegex(ValueError, 'outside every git checkout'):
                    runner.main(['--patch', str(patch), '--label', 'other', '--build-only', '--evidence-dir', str(repo / 'logs')])


if __name__ == '__main__':
    unittest.main()
