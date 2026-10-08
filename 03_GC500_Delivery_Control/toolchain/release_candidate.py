#!/usr/bin/env python3
"""Author: Andrew Fisher. Portable, serial GC500 candidate build and checks. No publication."""
import argparse
import fcntl
import hashlib
import json
import os
from pathlib import Path, PurePosixPath
import re
import signal
import subprocess
import sys

HERE = Path(__file__).resolve().parent
CONTROL = HERE.parent
REPO = CONTROL.parent
# v8.91 currently accepts v8.94's footer, not v8.95's; keep that dependency explicit.
CHAIN = (884, 885, 886, 887, 888, 889, 893, 894, 891, 892, 895, 896, 897)
NAMES = ('today_wide_layout', 'where_we_are', 'event_portables_days', 'map_explorer',
         'costs_transport', 'master_map', 'maps_aligned', 'lighting_basis',
         'truck_flow', 'a_plus_pass', 'baseplan_07oct', 'today_scene', 'map_completion')
FOLDERS = {v: f'v8.{v % 100:02d}_{n}_DRAFT' for v, n in zip(CHAIN, NAMES)}
BROWSER = {884: ['test_wide884'], 885: ['test_where885'], 886: ['test_ep886'],
           887: ['test_explorer887'], 888: ['test_transport888'], 889: ['test_master889'],
           893: ['test_master889_v893', 'test_align893'],
           894: ['test_lighting894', 'test_where885_894'], 895: ['test_contracts895'],
           891: ['test_flow891'], 892: ['test_aplus892', 'test_money892'],
           896: ['test_scene896'], 897: ['test_browser897']}
IDENTITY = {886: 'test_data886', 889: 'test_identity889', 893: 'test_identity893',
            895: 'test_identity895', 892: 'test_identity892', 896: 'test_identity896'}
REGRESSION = ('v8.76_today_layout_LIVE/tests/test_layout876.cjs',
              'v8.83_crew_planning_LIVE/tests/test_crew883.cjs',
              'v8.74_vms_today_LIVE/tests/test_vms874.cjs',
              'v8.66_finance_handover_LIVE/tests/test_handover866.cjs',
              'v8.73_asset_priority_LIVE/tests/test_asset873.cjs',
              'v8.72_timeline_loading_LIVE/tests/test_loading872.cjs',
              'v8.81_unloading_LIVE/tests/test_unloading881.cjs',
              'v8.81_unloading_LIVE/tests/test_paired881.cjs',
              'v8.71_baseplan_schedule4_LIVE/tests/test_v871.cjs',
              'v8.70_supplier_confirmation_LIVE/tests/test_supplier870.cjs',
              'v8.69_kinp_installation_LIVE/tests/test_kinp869.cjs',
              'v8.65_costs_one_source_DRAFT/tests/test_costs865.cjs')
ROUTES = {'today', 'progress', 'map', 'docs', 'register', 'plant', 'demob', 'fencing',
          'prestarts', 'coatesway', 'journal', 'breakdowns', 'variances', 'costs', 'edit',
          'change', 'add', 'pricing', 'timeline', 'questions', 'about'}
LINKS = {'#timeline', '#day/2026-09-28', '#change/2026-09-28',
         '#print/drivers/2026-09-28', '#sheet/__satellite3d', '#plant', '#today'}
SOURCE_EXTENSIONS = {'.py', '.js', '.cjs', '.mjs', '.css', '.json', '.sh', '.html'}
SOURCE_EXCLUDED_DIRS = {'evidence', 'archive', 'archives', 'generated', 'build',
                        'node_modules', '__pycache__', '.git', '.pytest_cache'}


def resolved(value):
    return Path(value).expanduser().resolve()


def file_hash(path):
    digest = hashlib.sha256()
    with Path(path).open('rb') as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b''):
            digest.update(block)
    return digest.hexdigest()


def machine_binding(env):
    """Verify the exact frozen machine manifest and every local byte it declares; no network."""
    if not env.get('MACHINE_MANIFEST'):
        raise ValueError('browser checks require MACHINE_MANIFEST for the exact final machine set')
    manifest_path = resolved(env['MACHINE_MANIFEST'])
    raw = manifest_path.read_bytes()
    manifest = json.loads(raw)
    if manifest.get('schema') != 'gc500-machine-v1' or not isinstance(manifest.get('files'), list):
        raise ValueError('invalid final machine manifest')
    # Same recursive key order and UTF-8 representation used by the machine publisher/service.
    canonical = json.dumps({k: manifest[k] for k in ('schema', 'entry', 'files')},
                           sort_keys=True, ensure_ascii=False, separators=(',', ':')).encode('utf-8')
    digest = hashlib.sha256(canonical).hexdigest()
    if manifest.get('sha256') != digest:
        raise ValueError('final machine manifest does not reproduce its claimed digest')
    roots = {key: str(resolved(env[key])) for key in ('CODE', 'ASSETS', 'POC3D', 'MACHINE_ROOT') if env.get(key)}
    if env.get('LOCAL') and resolved(env['LOCAL']) != resolved(env.get('CODE', '')):
        raise ValueError('LOCAL must resolve to CODE; browser inputs must use the same bound explorer')
    for key, root in roots.items():
        if not Path(root).is_dir():
            raise ValueError('missing machine input directory ' + key)
    files = {}
    for descriptor in manifest['files']:
        name = descriptor.get('path') if isinstance(descriptor, dict) else None
        if (not isinstance(name, str) or not name or '\\' in name or
                PurePosixPath(name).is_absolute() or
                any(part in ('', '.', '..') for part in name.split('/')) or name in files):
            raise ValueError('invalid or duplicate machine manifest path: ' + str(name))
        if (not re.fullmatch('[a-f0-9]{64}', str(descriptor.get('sha256', ''))) or
                type(descriptor.get('bytes')) is not int or descriptor['bytes'] <= 0 or
                not isinstance(descriptor.get('type'), str) or not descriptor['type']):
            raise ValueError('invalid machine file descriptor: ' + name)
        choices = []
        for prefix, key in (('explorer/assets/', 'ASSETS'), ('explorer/', 'CODE'), ('poc3d/', 'POC3D')):
            if name.startswith(prefix) and key in roots:
                choices.append((roots[key], name[len(prefix):]))
                break
        if 'MACHINE_ROOT' in roots:
            choices.append((roots['MACHINE_ROOT'], name))
        source = None
        for root, relative in choices:
            proposed = Path(root) / relative
            if not proposed.exists():
                continue
            target = proposed.resolve()
            if not target.is_relative_to(Path(root)) or not target.is_file():
                raise ValueError('machine input escapes its root or is not a file: ' + name)
            source = target
            break
        if source is None:
            raise ValueError('missing local machine file: ' + name)
        if source.stat().st_size != descriptor['bytes'] or file_hash(source) != descriptor['sha256']:
            raise ValueError('machine bytes differ from the frozen manifest: ' + name)
        files[name] = dict(descriptor, source=str(source))
    if not files or manifest.get('entry') not in files:
        raise ValueError('machine manifest entry is missing from its files')
    return {'schema': 'gc500-machine-inputs-v1', 'manifest': str(manifest_path),
            'manifest_sha256': hashlib.sha256(raw).hexdigest(), 'machine_sha256': digest,
            'roots': roots, 'files': files}


def require_same_machine(captured, current):
    if captured != current:
        raise ValueError('machine inputs differ from the captured browser attempt; prepare a fresh reviewed candidate')


def bind_browser_inputs(path, build, current):
    """A build-only snapshot can acquire one binding; resume must match it exactly."""
    bound = {'schema': 'gc500-browser-inputs-v1',
             'build': {key: build[key] for key in ('candidate_sha256', 'base_sha256', 'patches', 'sources')},
             'machine': current}
    if path.exists():
        previous = json.loads(path.read_text())
        if previous != bound:
            raise ValueError('machine/browser inputs differ from the captured browser attempt')
    else:
        # Exclusive creation prevents two first attempts silently rebinding the same build.
        with path.open('x') as stream:
            stream.write(json.dumps(bound, indent=2) + '\n')
    return bound


def source_binding(patches, env, extra=()):
    """Bind the selected source trees and known direct build inputs, not restored media archives."""
    files = {p.resolve() for _, p in patches}
    roots = {p.parent.resolve() for _, p in patches} | {HERE.resolve()}
    # Owned final-candidate review suites replace stale, live-record-dependent
    # assertions. Their source must be bound even though it is outside a draft.
    if any(v is not None for v, _ in patches):
        roots.add(CONTROL / 'review_08Oct2026_ready_chain/tests')
    if env.get('GC500_TOOLCHAIN'):
        roots.add(resolved(env['GC500_TOOLCHAIN']))
    for root in roots:
        for directory, dirs, names in os.walk(root):
            dirs[:] = sorted(d for d in dirs if d not in SOURCE_EXCLUDED_DIRS)
            for name in names:
                path = Path(directory) / name
                if path.suffix.lower() in SOURCE_EXTENSIONS:
                    files.add(path.resolve())
    versions = {v for v, _ in patches}
    if 886 in versions:
        files.add(CONTROL / 'meet_points_03Oct2026/event_portables_plan.json')
    if 894 in versions:
        files.add(CONTROL / FOLDERS[894] / 'evidence/d024_keyed_towers.json')
    if 896 in versions:
        draft = CONTROL / FOLDERS[896]
        atlas = json.loads((draft / 'atlas896.json').read_text())
        files.update(draft / 'assets' / cell['file'] for cell in atlas['cells'])
    input_vars = ([] if 895 not in versions else ['V895_BASEPLAN', 'V895_MATCHES'])
    input_vars += [] if 894 not in versions else ['V882_SCHEDULE']
    external = {key: str(resolved(env[key])) if env.get(key) else None for key in input_vars}
    files.update(Path(path) for path in external.values() if path)
    files.update(resolved(path) for path in extra)
    return {'schema': 'gc500-candidate-sources-v1',
            'scope': 'selected source trees, toolchain helpers, known direct build inputs and explicit source-input files',
            'external_inputs': external,
            'files': {str(p.resolve()): file_hash(p) for p in sorted(files)}}


def require_same_sources(captured, current):
    if captured != current:
        raise ValueError('bounded source inputs differ from the captured build; rebuild with the current sources')


def outside_checkout(path):
    # Managed workspaces can expose empty, protected .git placeholders at /tmp
    # and /workspace. A checkout has a gitdir pointer or an actual Git HEAD.
    return not any((p / '.git').is_file() or (p / '.git' / 'HEAD').is_file()
                   for p in (path, *path.parents))


def validate_output(output, kind='assertions'):
    """A zero exit is insufficient: require positive assertions and reject explicit failures."""
    if re.search(r'(?im)^\s*(?:FAIL(?:ED)?\b|AssertionError\b|Traceback\b)', output):
        raise ValueError('reported a failed assertion or exception')
    if kind == 'command':
        return
    if kind == 'review':
        try:
            data = json.loads(output.strip())
        except json.JSONDecodeError:
            raise ValueError('review fixture did not produce valid JSON') from None
        if (not isinstance(data, dict) or data.get('pass') is not True or
                data.get('sourceMatchesCandidate') is not True or
                data.get('expected') != 'corrected behaviour' or
                not isinstance(data.get('results'), list) or not data['results']):
            raise ValueError('review fixture did not prove corrected behaviour against the selected source')
        return
    if kind in ('json', 'sweep'):
        try:
            data = json.loads(output)
        except (ValueError, TypeError):
            raise ValueError('did not produce valid JSON') from None
        if kind == 'json':
            if not isinstance(data, dict) or not data:
                raise ValueError('JSON assertions are missing')
            if 'failed' in data:
                if type(data.get('passed')) is not int or data['passed'] < 1 or type(data['failed']) is not int or data['failed'] != 0:
                    raise ValueError('JSON assertion summary contains a failure or no assertions')
                if any(data[k] is not True for k in ('pass', 'ok', 'success') if k in data):
                    raise ValueError('JSON assertion summary reports failure')
                if any(data[k] != [] for k in ('errors', 'consoleErrors', 'missing', 'failures') if k in data):
                    raise ValueError('JSON assertion summary reports errors')
                if any(data[k] != 0 for k in ('blocked', 'liveWrites', 'liveExplorer') if k in data):
                    raise ValueError('JSON assertion summary reports writes or live explorer fallback')
            elif not all(v is True for v in data.values()):
                raise ValueError('JSON assertion map contains a failure')
            return
        if not isinstance(data, dict) or data.get('success') is not True:
            raise ValueError('sweep did not assert success')
        if set(data.get('tabs', {})) != ROUTES or set(data.get('hashes', {})) != LINKS:
            raise ValueError('sweep did not cover all 21 routes and 7 links')
        if data.get('back', {}).get('hash') != '#plant' or data['back'].get('pane') != 'pane-plant':
            raise ValueError('browser Back did not restore Equipment')
        if data.get('counts', {}).get('blocked') != 0:
            raise ValueError('sweep did not prove zero attempted writes')
        assets = data.get('assets', {})
        if (not all(re.fullmatch('[a-f0-9]{64}', str(assets.get(key, '')))
                    for key in ('machineSha256', 'manifestSha256')) or
                type(assets.get('machineFiles')) is not int or assets['machineFiles'] < 1 or
                type(assets.get('explorerRequests')) is not int or assets['explorerRequests'] < 1 or
                assets.get('failures') != []):
            raise ValueError('sweep did not prove verified local machine inputs and explorer requests')
        for errors in (data.get('allErrors'), data.get('cons'), data.get('failures')):
            if errors != []:
                raise ValueError('sweep reported errors or omitted its error evidence')
        for row in list(data['tabs'].values()) + list(data['hashes'].values()):
            if row.get('ok') is not True or row.get('errors') != [] or row.get('console') != []:
                raise ValueError('a route or deep link assertion failed')
        return
    # Some inherited suites print a JSON boolean map but forget their exit status.
    stripped = output.strip()
    if stripped.startswith('{'):
        return validate_output(stripped, 'json')
    if not re.search(r'\bPASS\b', output):
        raise ValueError('no positive assertion evidence')
    for line in output.splitlines():
        if re.match(r'^\s*\{', line):
            validate_output(line, 'json')


def run_step(name, command, env, evidence, timeout, kind='assertions'):
    """Keep raw output private; stop our entire process group on timeout/interruption."""
    log = evidence / (name + '.log')
    with log.open('w') as stream:
        proc = subprocess.Popen(command, cwd=CONTROL, env=env, stdout=stream,
                                stderr=subprocess.STDOUT, start_new_session=True)
        try:
            code = proc.wait(timeout=timeout)
        except BaseException:
            os.killpg(proc.pid, signal.SIGTERM)
            try:
                proc.wait(timeout=3)
            except subprocess.TimeoutExpired:
                os.killpg(proc.pid, signal.SIGKILL)
                proc.wait()
            raise
    if code:
        raise ValueError(f'{name}: exited {code}; inspect its private log')
    try:
        validate_output(log.read_text(errors='replace'), kind)
    except ValueError as exc:
        raise ValueError(f'{name}: {exc}; inspect its private log') from None
    print(f'PASS {name}', flush=True)
    return {'name': name, 'argv': command, 'log': str(log), 'status': 'pass'}


def select_patches(args):
    if args.versions:
        versions = [int(x) for x in args.versions.split(',')]
        if not versions or len(set(versions)) != len(versions) or any(v not in CHAIN for v in versions):
            raise ValueError('choose unique versions from ' + ','.join(map(str, CHAIN)))
        if versions != [v for v in CHAIN if v in versions]:
            raise ValueError('versions must follow the documented chain order')
        return [(v, CONTROL / FOLDERS[v] / f'patch_v{v}.py') for v in versions]
    result = []
    for value in args.patch or []:
        path = resolved(value)
        match = re.fullmatch(r'patch_v(\d+)\.py', path.name)
        version = int(match[1]) if match and int(match[1]) in CHAIN else None
        if version and path != (CONTROL / FOLDERS[version] / path.name).resolve():
            version = None  # A similarly named custom patch does not inherit another source's checks.
        result.append((version, path))
    if len({p for _, p in result}) != len(result) or len({v for v, _ in result if v}) != len([v for v, _ in result if v]):
        raise ValueError('a patch/version was selected more than once')
    return result


def make_wrappers(patches, snapshots):
    wrappers = []
    for index, (version, patch) in enumerate(patches):
        key = f'v{version}' if version else f'patch{index + 1}'
        wrapper = snapshots / (key + '.py')
        wrapper.write_text('import pathlib, shutil, subprocess, sys\n'
                           'p = pathlib.Path(sys.argv[1])\n'
                           f'shutil.copyfile(p, {str(snapshots / (key + ".before.html"))!r})\n'
                           f'subprocess.run([sys.executable, {str(patch)!r}, str(p)], check=True)\n'
                           f'shutil.copyfile(p, {str(snapshots / (key + ".after.html"))!r})\n'
                           'for manifest in p.parent.glob("media_manifest_v*.json"):\n'
                           f'    shutil.copyfile(manifest, pathlib.Path({str(snapshots)!r}) / manifest.name)\n')
        wrappers.append(str(wrapper))
    return wrappers


def browser_checks(versions, snapshots, page, extra=(), regression=False):
    checks = []
    for v in versions:
        if v == 889 and 893 in versions or v == 885 and 894 in versions:
            continue  # Replaced by the version-specific master / Lighting-basis checks below.
        for name in BROWSER[v]:
            script = CONTROL / FOLDERS[v] / 'tests' / (name + '.cjs')
            if name in ('test_ep886', 'test_lighting894', 'test_money892', 'test_align893'):
                replacement = {'test_ep886': 'test_ep886_fixtures.cjs',
                               'test_lighting894': 'test_lighting894_verified.cjs',
                               'test_money892': 'test_money892_pinned.cjs',
                               'test_align893': 'test_align893_css_pixels.cjs'}[name]
                script = CONTROL / 'review_08Oct2026_ready_chain/tests' / replacement
            # Scene896 deliberately supersedes the earlier banner/geometry assertions.
            # Aplus892 accepts later footers; money checks the same pinned input on final.
            stage = 896 in versions and (v in (884, 885) or name == 'test_where885_894')
            target = snapshots / f'v{v}.after.html' if stage else page
            environment = {'PAGE': str(target)}
            if name == 'test_money892':
                environment['BASE'] = str(snapshots / 'v892.before.html')
            checks.append((script, environment, 'stage' if stage else 'final'))
    if 893 in versions:
        checks.append((CONTROL / 'v8.90_explorer_master_DRAFT/tests/test_explorer890.cjs', {'PAGE': str(page)}, 'final'))
    if 896 in versions:
        checks.append((CONTROL / FOLDERS[896] / 'tests/test_scope896.cjs', {'PAGE': str(page)}, 'final'))
    checks += [(resolved(p), {'PAGE': str(page)}, 'final') for p in extra]
    if regression:
        checks += [(CONTROL / p, {'PAGE': str(page)}, 'final') for p in REGRESSION
                   if not (895 in versions and p.endswith('/test_v871.cjs'))
                   and not (896 in versions and p.endswith('/test_layout876.cjs'))]
    return checks


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__)
    selection = ap.add_mutually_exclusive_group(required=True)
    selection.add_argument('--versions', help='ordered comma list, e.g. 884,885,886,887,888,889,893,894,895')
    selection.add_argument('--patch', action='append', help='explicit ordered patch path; repeat as needed')
    ap.add_argument('--source-input', action='append', default=[], type=resolved,
                    help='additional direct build input file outside the captured source trees; repeat as needed')
    ap.add_argument('--label', help='new build label (must not already exist)')
    ap.add_argument('--page', type=resolved, help='check an existing candidate instead of building')
    ap.add_argument('--snapshots', type=resolved, help='previous build snapshots; first browser attempt also captures its machine binding here')
    ap.add_argument('--build-only', action='store_true', help='build and static identities only; no browser checks')
    ap.add_argument('--test', action='append', default=[], help='additional final-candidate .cjs/.js assertion suite')
    ap.add_argument('--regression', action='store_true', help='also run the active standing regression set')
    ap.add_argument('--wide', action='store_true', help='also check affected layouts at 1600 and 2560 px')
    ap.add_argument('--evidence-dir', required=True, type=resolved, help='new private directory outside every git checkout')
    ap.add_argument('--timeout', type=int, default=900, help='per-command seconds, default 900')
    args = ap.parse_args(argv)
    if args.timeout < 1 or args.page and args.build_only:
        ap.error('use a positive timeout, and do not combine --page with --build-only')
    if args.snapshots and not args.page:
        ap.error('--snapshots is for --page; new builds keep snapshots under their private evidence')
    if not args.page and (not args.label or not re.fullmatch(r'[A-Za-z0-9][A-Za-z0-9._-]*', args.label)):
        ap.error('a new build requires a plain --label')
    patches = select_patches(args)
    for _, patch in patches:
        if not patch.is_file():
            raise ValueError('missing patch: ' + str(patch))
    if any(v is None for v, _ in patches) and not args.build_only and not args.test:
        raise ValueError('an unknown patch needs an explicit --test (or --build-only)')
    evidence = args.evidence_dir
    if not outside_checkout(evidence):
        raise ValueError('evidence must be outside every git checkout')
    if evidence.exists() and any(evidence.iterdir()):
        raise ValueError('evidence directory must be new or empty')
    os.umask(0o077)
    evidence.mkdir(parents=True, exist_ok=True, mode=0o700)
    evidence.chmod(0o700)
    snapshots = args.snapshots or evidence / 'snapshots'
    if args.page and not args.snapshots:
        raise ValueError('--page requires --snapshots from the selected build')
    if not outside_checkout(snapshots):
        raise ValueError('snapshots must remain outside every git checkout')
    if not args.page:
        snapshots.mkdir(parents=True, exist_ok=True)
    page = args.page or CONTROL / 'build' / ('GC500_' + args.label) / 'GC500_Delivery_Control_hosted.html'
    if not args.page and page.parent.exists():
        raise ValueError('build label already exists; use a fresh label')
    env = dict(os.environ)
    env.pop('GC500_DEBUG', None)
    env.update(PYTHONDONTWRITEBYTECODE='1', V895_LOG=str(evidence / 'changes_v895.json'),
               NODE_PATH=env.get('NODE_PATH') or str(HERE / 'node_modules'))
    # Relative asset/dependency paths stay tied to the caller, not the runner's cwd.
    for key in ('CODE', 'ASSETS', 'MEDIA', 'MEDIA889', 'MEDIA893', 'POC3D', 'LOCAL', 'ATLAS896',
                'MACHINE_MANIFEST', 'MACHINE_ROOT',
                'V895_BASEPLAN', 'V895_MATCHES', 'V882_SCHEDULE', 'GC500_TOOLCHAIN', 'CHROMIUM_PATH'):
        if env.get(key):
            env[key] = str(resolved(env[key]))
    if env.get('MEDIA893') and not env.get('MEDIA'):
        env['MEDIA'] = env['MEDIA893']
    if env.get('CODE'):
        env.setdefault('LOCAL', env['CODE'])
    env['NODE_PATH'] = os.pathsep.join(str(resolved(p)) for p in env['NODE_PATH'].split(os.pathsep) if p)
    versions = [v for v, _ in patches if v]
    report = {'author': 'Andrew Fisher', 'state': 'incomplete', 'publication': 'not attempted',
              'patches': [{'path': str(p), 'sha256': file_hash(p)} for _, p in patches], 'checks': []}
    report['sources'] = source_binding(patches, env, args.source_input)
    report['test_scope'] = {
        'v889_master': 'replaced by v893 master/alignment checks' if 893 in versions else 'selected source suite',
        'v885_basis': 'replaced by v894 Lighting-basis checks' if 894 in versions else 'selected source suite',
        'v884_v885_layout': 'stage pages; final Today layout covered by scene896' if 896 in versions else 'final page',
        'v892': 'final page: upstream polish accepts later footer; owned money wrapper pins clock and compares identical native record content against v892.before',
        'v871': 'replaced by identity895 and final contracts895 (7 Oct export)' if 895 in versions else 'included with --regression',
        'v876_layout': 'superseded by final scene896, scope896 and sweep geometry' if 896 in versions else 'included with --regression',
        'v886_v894': 'owned final fixtures; source and shared operational record remain unchanged',
        'legacy_875_879': 'not in active regression set: known unchanged baseline failures documented in full-chain README',
    }
    def step(name, command, overrides=None, kind='assertions'):
        result = run_step(name, command, dict(env, **(overrides or {})), evidence, args.timeout, kind)
        report['checks'].append(result)
    try:
        binding_path = snapshots / 'build.json'
        if args.page:
            binding = json.loads(binding_path.read_text())
            require_same_sources(binding.get('sources'), report['sources'])
        if not args.page:
            step('build', ['bash', str(HERE / 'build.sh'), args.label, *make_wrappers(patches, snapshots)], kind='command')
        require_same_sources(report['sources'], source_binding(patches, env, args.source_input))
        if not page.is_file():
            raise ValueError('candidate page is missing')
        step('check_page', [sys.executable, str(HERE / 'check_page.py'), str(page), '--base', str(page.parent / 'base_live.html')])
        report.update(page=str(page), candidate_sha256=file_hash(page), base_sha256=file_hash(page.parent / 'base_live.html'))
        if args.page:
            if any(binding.get(k) != report[k] for k in ('candidate_sha256', 'base_sha256', 'patches')):
                raise ValueError('candidate/base/source differs from the captured build')
            if any(not (snapshots / f).is_file() or file_hash(snapshots / f) != digest
                   for f, digest in binding['snapshots'].items()):
                raise ValueError('a captured stage or sidecar changed')
        else:
            binding = {k: report[k] for k in ('candidate_sha256', 'base_sha256', 'patches', 'sources')}
            binding['snapshots'] = {p.name: file_hash(p) for p in sorted(snapshots.iterdir()) if p.suffix in ('.html', '.json')}
            binding_path.write_text(json.dumps(binding, indent=2) + '\n')
        for v in versions:
            if v in IDENTITY:
                command = [sys.executable, str(CONTROL / FOLDERS[v] / 'tests' / (IDENTITY[v] + '.py')),
                           str(snapshots / f'v{v}.before.html'), str(snapshots / f'v{v}.after.html')]
                if v == 886:
                    command.append(str(CONTROL / 'meet_points_03Oct2026/event_portables_plan.json'))
                step('identity' + str(v), command)
        if 897 in versions:
            step('semantics897', ['node', str(CONTROL / FOLDERS[897] / 'tests/test_semantics897.cjs')])
        if 892 in versions:
            step('aplus892_final', ['node', str(CONTROL / 'review_08Oct2026_ready_chain/tests/repro_aplus892.cjs'),
                                   str(page), '--expect-fixed'], kind='review')
        require_same_sources(report['sources'], source_binding(patches, env, args.source_input))
        if args.build_only:
            report['state'] = 'built; browser checks not run'
            print('Built and statically checked. Browser checks not run; not READY.', flush=True)
            return 0
        checks = browser_checks(versions, snapshots, page, args.test, args.regression)
        checks.append((HERE / 'harness/release_sweep.cjs', {'PAGE': str(page)}, 'final'))
        for script, overrides, _ in checks:
            if not script.is_file() or not Path(overrides['PAGE']).is_file():
                raise ValueError('missing selected test or stage page: ' + str(script))
            if '/home/user/fish/' in script.read_text():
                raise ValueError('selected test has a hardcoded checkout path; its owner must make it portable: ' + str(script))
        required = ['CODE', 'ASSETS']  # Every final sweep checks the paired local explorer.
        required += ['MEDIA893', 'POC3D'] if 893 in versions else ['MEDIA889'] if 889 in versions else []
        for key in required:
            if not env.get(key) or not Path(env[key]).is_dir():
                raise ValueError('selected checks require the local directory ' + key)
        report['machine'] = machine_binding(env)
        machine_inputs = snapshots / 'machine-inputs.json'
        bind_browser_inputs(machine_inputs, binding, report['machine'])
        machine_inputs_sha = file_hash(machine_inputs)
        env['MACHINE_BINDING'] = str(machine_inputs)
        def recheck_inputs():
            require_same_sources(report['sources'], source_binding(patches, env, args.source_input))
            require_same_machine(report['machine'], machine_binding(env))
            if file_hash(machine_inputs) != machine_inputs_sha:
                raise ValueError('captured machine/browser input binding changed during checks')
            if (file_hash(page) != report['candidate_sha256'] or
                    file_hash(page.parent / 'base_live.html') != report['base_sha256'] or
                    any(file_hash(snapshots / f) != digest for f, digest in binding['snapshots'].items())):
                raise ValueError('candidate/base/stage bytes changed during checks')
        lockpath = resolved(env.get('GC500_BROWSER_LOCK', '/tmp/gc500-browser.lock'))
        lockpath.parent.mkdir(parents=True, exist_ok=True)
        with lockpath.open('a') as lock:
            print('Waiting for the shared browser lock.', flush=True)
            fcntl.flock(lock, fcntl.LOCK_EX)
            for index, (script, overrides, scope) in enumerate(checks):
                devices = ['laptop', 'phone']
                if args.wide and script.stem in ('test_wide884', 'test_where885', 'test_where885_894',
                                                'test_transport888', 'test_flow891', 'test_aplus892', 'test_scene896'):
                    devices += ['1600', '2560']
                for device in devices:
                    recheck_inputs()
                    name = f'{index + 1:02d}_{script.stem}_{scope}_{device}'
                    private = evidence / name
                    private.mkdir()
                    width = '390' if device == 'phone' else '1440' if device == 'laptop' else device
                    settings = dict(overrides, MOB='1' if device == 'phone' else '', W=width,
                                    H='844' if device == 'phone' else '1370' if device == '2560' else '1000', OUT=str(private), GC500_CACHE=str(private / 'cache'),
                                    GC500_EDIT_TOKEN='')
                    kind = 'sweep' if script.name == 'release_sweep.cjs' else 'json' if script.stem == 'test_crew883' else 'assertions'
                    step(name, ['node', str(script)], settings, kind)
                    recheck_inputs()
        recheck_inputs()
        report['state'] = 'selected checks passed; review and release decision still required'
        print('Selected checks passed. No publication attempted; inspect stage/final scope in the private report.', flush=True)
        return 0
    except (ValueError, OSError, subprocess.TimeoutExpired) as exc:
        report['failure'] = str(exc)
        raise
    finally:
        (evidence / 'result.json').write_text(json.dumps(report, indent=2) + '\n')


if __name__ == '__main__':
    try:
        if sys.argv[1:] == ['--verify-machine']:
            print(json.dumps(machine_binding(os.environ)))
        else:
            sys.exit(main())
    except (ValueError, OSError, subprocess.TimeoutExpired) as exc:
        print('STOP: ' + str(exc), file=sys.stderr)
        sys.exit(1)
