#!/usr/bin/env python3
"""Author: Andrew Fisher. Portable exact-source presentation/checklist release; no service writes."""
from pathlib import Path
import hashlib, json, os, re, subprocess, sys, tempfile

HERE = Path(__file__).resolve().parent
TOOLCHAIN = HERE.parent / 'toolchain'
rep = None  # Set only from verified helper bytes, never from an earlier import.

PUBLIC_NAMES = {
    'fencing_css': 'fencing_preview.css',
    'equipment_css': 'refresh-preview.css', 'costs_js': 'costs_preview.js',
    'costs_css': 'costs_preview.css', 'checklist_patch': 'patch_v826.py',
    'fold_adapter': 'demob826_adapter.js',
    'contract_patch': 'apply_reviewed_contract_supplement.py',
    'quote_warning_patch': 'patch_quote_period_warning.py',
}
PRIVATE_NAMES = {'fencing', 'equipment_demob', 'finance_wording', 'contract_supplement', 'checklist'}

def digest(data): return hashlib.sha256(data).hexdigest()

def read_verified(entry, relative_to):
    if not isinstance(entry, dict) or set(entry) != {'path', 'sha256'}:
        raise SystemExit('Each build input needs only path and sha256')
    if not re.fullmatch('[0-9a-f]{64}', entry['sha256'] or ''):
        raise SystemExit('Each build input needs its exact SHA256')
    path = Path(entry['path'])
    if not path.is_absolute(): path = relative_to / path
    if not path.is_file(): raise SystemExit('Required build input is missing: ' + path.name)
    data = path.read_bytes()
    if digest(data) != entry['sha256']:
        raise SystemExit('Build input hash changed: ' + path.name)
    return data.decode('utf-8')

def exactly(page, old, new, name):
    return rep(page, old, new, 'v8.26 release: ' + name, 'candidate')

def add_style(page, name, source):
    if name in page or '</style' in source.lower():
        raise SystemExit('Duplicate or invalid style: ' + name)
    return exactly(page, '</head>\n<body>', '<style id="' + name + '">\n' + source + '\n</style>\n</head>\n<body>', name)

def add_script(page, name, source):
    if name in page or '</script' in source.lower():
        raise SystemExit('Duplicate or invalid script: ' + name)
    if not page.rstrip().endswith('</body></html>'):
        raise SystemExit('Unexpected final page body')
    offset = page.rfind('</body></html>')
    return page[:offset] + '<script id="' + name + '">\n' + source + '\n</script>\n' + page[offset:]

def label_release(page):
    page = exactly(page, '<meta name="gc500-release" content="v8.21">', '<meta name="gc500-release" content="v8.26">', 'release marker')
    matches = list(re.finditer(r"\$\('#footL'\)\.textContent\s*=\s*[^;\n]+\+ ' · v8\.21';", page))
    if len(matches) != 1: raise SystemExit('Expected one v8.21 footer label')
    old = matches[0].group()
    return exactly(page, old, old.replace(" + ' · v8.21';", " + ' · v8.26';"), 'footer label')

def patch(original, public, private, helper):
    if 'const FENCE_PRIVATE_VIEW =' in original or 'function checks826(' in original:
        raise SystemExit('Wider release already applied, wholly or partly')
    if original.count('const DAILY821 =') != 1 or ':not(:where(.ep819 *))' not in original:
        raise SystemExit('The verified v8.21 daily-page and supplier boundary base is required')
    page = exactly(original, 'function renderFencing(){ return holdAssets(renderFencing_held); }', 'function renderFencing(){ return holdAssets(() => { renderFencing_held(); fencePrivateApply(); }); }', 'Fencing held renderer')
    page = exactly(page, 'function renderFencing_held(){', private['fencing'] + '\nfunction renderFencing_held(){', 'Fencing source')
    page = add_style(page, 'fencing-private-preview', public['fencing_css'])
    page = add_style(page, 'private-equipment-demob-refresh', public['equipment_css'])
    page = add_script(page, 'private-equipment-demob-refresh-source', private['equipment_demob'])
    changes = json.loads(private['finance_wording'])
    if not isinstance(changes, list) or len(changes) != 7:
        raise SystemExit('Expected the seven reviewed Finance wording replacements')
    for index, item in enumerate(changes):
        if not isinstance(item, dict) or not isinstance(item.get('before'), str) or not isinstance(item.get('after'), str):
            raise SystemExit('Invalid Finance wording replacement')
        page = exactly(page, item['before'], item['after'], 'Finance wording ' + str(index + 1))
    page = add_style(page, 'costs-private-preview', public['costs_css'])
    page = add_script(page, 'costs-private-preview-source', public['costs_js'])
    # Generic source patches are executed from the verified bytes only.
    contract_scope = {'__name__': 'reviewed_contract_patch'}
    exec(compile(public['contract_patch'], '<verified contract patch>', 'exec'), contract_scope)
    page = contract_scope['apply_reviewed_contract_supplement'](page, json.loads(private['contract_supplement']))
    warning_scope = {'__name__': 'reviewed_quote_warning_patch'}
    exec(compile(public['quote_warning_patch'], '<verified quote warning patch>', 'exec'), warning_scope)
    page = warning_scope['apply'](page)
    # The private controller stays byte-for-byte intact. Only its already-verified
    # bytes are staged beside the unchanged generic owner patch.
    with tempfile.TemporaryDirectory(prefix='gc500-wider-source-') as directory:
        root = Path(directory); source = root / 'source'; source.mkdir()
        (root / 'toolchain').mkdir()
        (root / 'toolchain' / 'rep.py').write_text(helper)
        (source / 'patch_v826.py').write_text(public['checklist_patch'])
        (source / 'checklist826_src.js').write_text(private['checklist'])
        candidate = root / 'candidate.html'; candidate.write_text(page)
        subprocess.run([sys.executable, str(source / 'patch_v826.py'), str(candidate)], check=True)
        page = candidate.read_text()
    page = add_script(page, 'private-demob826-composition-adapter', public['fold_adapter'])
    return label_release(page)

def main():
    global rep
    if len(sys.argv) != 2: raise SystemExit('Usage: patch_v826_release.py candidate.html')
    value = os.environ.get('GC500_PRIVATE_BUILD_INPUTS', '')
    if not value: raise SystemExit('Set GC500_PRIVATE_BUILD_INPUTS to the authorised private build manifest')
    manifest_path = Path(value).resolve()
    if not manifest_path.is_file(): raise SystemExit('The private build manifest is missing')
    config = json.loads(manifest_path.read_text())
    if set(config) != {'expected_base_sha256', 'inputs'} or set(config['inputs']) != PRIVATE_NAMES:
        raise SystemExit('Build manifest must identify the base and the five required reviewed inputs only')
    target = Path(sys.argv[1]).resolve(); raw = target.read_bytes()
    if not re.fullmatch('[0-9a-f]{64}', config['expected_base_sha256'] or '') or digest(raw) != config['expected_base_sha256']:
        raise SystemExit('The current base differs from the approved private build manifest')
    lock = json.loads((HERE / 'SOURCE_MANIFEST.json').read_text())
    public = {name: read_verified({'path': file, 'sha256': lock['files'][file]['sha256']}, HERE) for name, file in PUBLIC_NAMES.items()}
    helper = read_verified({'path': str(TOOLCHAIN / 'rep.py'), 'sha256': lock['shared_rep_sha256']}, HERE)
    helper_scope = {'__name__': 'verified_exact_once_helper'}
    exec(compile(helper, '<verified exact-once helper>', 'exec'), helper_scope)
    rep = helper_scope['rep']
    private = {name: read_verified(config['inputs'][name], manifest_path.parent) for name in sorted(PRIVATE_NAMES)}
    result = patch(raw.decode('utf-8'), public, private, helper)
    # Do not mutate the build file until every input and exact-once anchor succeeds.
    target.write_text(result)
    print('Applied v8.26 presentation and selected-load checks from verified build inputs')

if __name__ == '__main__':
    main()
