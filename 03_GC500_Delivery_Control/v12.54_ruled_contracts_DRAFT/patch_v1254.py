"""Author: Andrew Fisher. Apply only the coordinated ruled-contract movements."""
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

BASE_SHA256 = '69bf04e72a45e084f0ba5227b4a26cf95ffe4078429044946af473120d4e7bb2'
OLD_FOOTER = "+' · v12.50.1';"
NEW_FOOTER = "+' · v12.54';"


def digest(text):
    return hashlib.sha256(text.encode('utf-8')).hexdigest()


def data_span(text):
    matches = list(re.finditer(r'\bconst DATA\s*=\s*', text))
    if len(matches) != 1:
        raise ValueError('Expected one original source DATA declaration')
    start = matches[0].end()
    data, size = json.JSONDecoder().raw_decode(text[start:])
    if json.dumps(data, ensure_ascii=False, separators=(',', ':')) != text[start:start + size]:
        raise ValueError('Original DATA serialization differs from the reviewed predecessor')
    return data, start, start + size


def exact(text, old, new, label, path):
    if text.count(old) != 1:
        raise ValueError(label + ': expected one exact source boundary')
    replacement = rep(old, old, new, label, path)
    if replacement != new:
        raise ValueError(label + ': shared replacement changed the reviewed boundary')
    return text.replace(old, replacement, 1)


def patch(text, path='page', expected_base_sha=None):
    expected = expected_base_sha or os.environ.get('GC500_V1254_BASE_SHA256', '')
    if NEW_FOOTER in text or 'RuledContracts1254' in text:
        raise ValueError('v12.54 already applied')
    if expected != BASE_SHA256 or digest(text) != BASE_SHA256:
        raise ValueError('v12.54 requires the explicit exact reviewed live50.1 SHA256')
    data, start, end = data_span(text)
    revised, manifest = apply_data(data)
    if not manifest:
        raise ValueError('Source movement manifest is required')
    changed = text[:start] + json.dumps(revised, ensure_ascii=False, separators=(',', ':')) + text[end:]
    changed = patch_finance(changed, path)
    changed = exact(changed, OLD_FOOTER, NEW_FOOTER, 'release footer', path)
    if re.findall(r'<style\b[^>]*>[\s\S]*?</style>', changed) != re.findall(r'<style\b[^>]*>[\s\S]*?</style>', text):
        raise ValueError('The financial correction changed existing styles')
    return changed


if __name__ == '__main__':
    page = Path(sys.argv[1])
    changed = patch(page.read_text(encoding='utf-8'), str(page))
    page.write_text(changed, encoding='utf-8')
    print('v12.54 scoped source and financial corrections applied; original layout retained')
