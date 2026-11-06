#!/usr/bin/env python3
"""Author: Andrew Fisher. Reproduce a combined release and its single-part comparison pages.

The JSON argument names base_page (v9.22), final_page, output_dir and later_patches
(the exact ordered v9.24 onward Python patch paths). All private input environment
variables must match the real build. Nothing uploads or edits a shared record.
"""
import hashlib, json, pathlib, re, shutil, subprocess, sys
config = json.loads(pathlib.Path(sys.argv[1]).read_text())
base = pathlib.Path(config['base_page']).resolve()
final = pathlib.Path(config['final_page']).resolve()
out = pathlib.Path(config['output_dir']).resolve()
source = pathlib.Path(__file__).resolve().parents[1]
patches = [pathlib.Path(x).resolve() for x in config['later_patches']]
out.mkdir(parents=True, exist_ok=True)
assert base.is_file() and final.is_file() and all(p.is_file() for p in patches)
assert out not in (base.parent, final.parent), 'comparison output must be separate from release build'
manifest = source / 'media_manifest_v900.json'
manifest_before = manifest.read_bytes() if manifest.exists() else None
sha = lambda p: hashlib.sha256(p.read_bytes()).hexdigest()

def patch(script, target, log):
    subprocess.run([sys.executable, str(script), str(target)], check=True,
                   stdout=log, stderr=subprocess.STDOUT)

def build(omitted):
    target = out / ('base_without_' + omitted + '.html' if omitted else 'full_replay.html')
    shutil.copyfile(base, target)
    with (out / ((omitted or 'full') + '-build.log')).open('w') as log:
        if omitted:
            for part in ('crew', 'broadcast', 'split', 'lines', 'vms'):
                if part != omitted:
                    patch(source / ('patch_v900_' + part + '.py'), target, log)
            text = target.read_text()
            assert text.count(" · v9.22'") == 1
            target.write_text(text.replace(" · v9.22'", " · v9.23'"))
        else:
            patch(source / 'patch_v923.py', target, log)
        for script in patches:
            patch(script, target, log)
        patch(source.parent / 'toolchain/scrub_attributions.py', target, log)
        patch(source.parent / 'toolchain/check_page.py', target, log)
    return target

try:
    replay = build(None)
    assert replay.read_bytes() == final.read_bytes(), 'full replay differs from final; stop before comparison tests'
    footer = re.search(r" · v\d+\.\d+'; /\* v8\.19", final.read_text()).group(0)
    fixtures = {}
    for part in ('crew', 'broadcast', 'split', 'lines', 'vms'):
        target = build(part)
        assert footer in target.read_text(), 'comparison footer differs from final'
        fixtures[part] = {'path': str(target), 'sha256': sha(target)}
    report = {'author': 'Andrew Fisher', 'base_sha256': sha(base), 'final_sha256': sha(final),
              'full_replay_identical': True, 'later_patches': [str(p) for p in patches], 'fixtures': fixtures}
    (out / 'fixtures.json').write_text(json.dumps(report, indent=2) + '\n')
    print(json.dumps({'full_replay_identical': True, 'final_sha256': sha(final), 'fixtures': len(fixtures)}))
finally:
    if manifest_before is not None:
        manifest.write_bytes(manifest_before)
    elif manifest.exists():
        manifest.unlink()
