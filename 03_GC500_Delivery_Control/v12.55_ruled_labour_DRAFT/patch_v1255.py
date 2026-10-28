"""Author: Andrew Fisher. Integrate only the explicitly ruled contract movements."""
import hashlib
import json
import os
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT))
sys.path.insert(0, str(ROOT.parent / 'toolchain'))
from rep import rep
from source_movements import apply_data
from finance_patch import patch_finance

BASES = {
    '378d4b6632101ad6a1429f31b2241c567b3670ae0888f70b7df6f75109625a5c': 'v12.54',
    '20a81f75b8d47ed1c0d32cf3d5b5e5e79fe1bb5420b2fe459f9d4bbf94c771d5': 'v12.54.1',
}
NEW_FOOTER = "+' · v12.55';"


def data_span(text):
    matches = list(re.finditer(r'\bconst DATA\s*=\s*', text))
    if len(matches) != 1:
        raise ValueError('Expected one original source DATA declaration')
    start = matches[0].end()
    data, size = json.JSONDecoder().raw_decode(text[start:])
    if json.dumps(data, ensure_ascii=False, separators=(',', ':')) != text[start:start + size]:
        raise ValueError('Source serialization differs from the reviewed predecessor')
    return data, start, start + size


def exact(text, old, new, label, path):
    if text.count(old) != 1:
        raise ValueError(label + ': expected one exact boundary')
    if rep(old, old, new, label, path) != new:
        raise ValueError(label + ': replacement escaped its boundary')
    return text.replace(old, new, 1)


def patch(text, path='page', expected_base_sha=None):
    expected = expected_base_sha or os.environ.get('GC500_V1255_BASE_SHA256', '')
    if NEW_FOOTER in text or 'root.RuledFinance1255=' in text:
        raise ValueError('v12.55 already applied')
    if expected not in BASES or hashlib.sha256(text.encode('utf-8')).hexdigest() != expected:
        raise ValueError('v12.55 requires an explicit exact reviewed v12.54 or v12.54.1 predecessor')
    data, start, end = data_span(text)
    revised, manifest = apply_data(data)
    if not manifest:
        raise ValueError('Source movement manifest is required')
    changed = text[:start] + json.dumps(revised, ensure_ascii=False, separators=(',', ':')) + text[end:]
    changed = patch_finance(changed, path)
    changed = exact(changed, "+' · " + BASES[expected] + "';", NEW_FOOTER, 'release footer', path)
    if re.findall(r'<style\b[^>]*>[\s\S]*?</style>', changed) != re.findall(r'<style\b[^>]*>[\s\S]*?</style>', text):
        raise ValueError('The contract correction changed existing styles')
    return changed


if __name__ == '__main__':
    page = Path(sys.argv[1])
    changed = patch(page.read_text(encoding='utf-8'), str(page))
    page.write_text(changed, encoding='utf-8')
    print('v12.55 bounded source and billing reconciliation applied; original styles retained')
