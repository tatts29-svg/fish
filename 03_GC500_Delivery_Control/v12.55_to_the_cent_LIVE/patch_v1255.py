"""Author: Andrew Fisher. v12.55 - the P&L to the cent against Baseplan (10), Andrew's bits only.

Built on the exact live v12.59. What moves (29 Oct 2026, "Fix your bits and get v12.55 ready to upload"):
 1. The install and demob ticks on the generators, light towers and VMS boards are no longer charged a second time
    beside the contracts' own labour lines (-5,631.86 today).
 2. Every contract line Baseplan (10) prices differently from the site rule is pinned to Baseplan (10)'s figure, WB02
    (9972648/3) excepted: the four 7 Sep boards termed 28 Oct, Baseplan's inclusive day count, the pins struck
    against Baseplan (8) re-struck against (10), the two booms at five days, the 2.5 t forklift to 30 Oct.
 3. The lines the page did not carry are added at Baseplan (10)'s figures: contract 9994248 (five lines, 1,795.30)
    and 9997710 line 3 (225.30).
Nothing else: cleaning stays charged (it is inside Baseplan's Install & Demob rates), the pee panels, track mats and
T0021/T0022 stay charged and flagged for the branch and Andrew, the fencing stays held out.
"""
import hashlib
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT))
sys.path.insert(0, str(ROOT.parent / 'toolchain'))
from rep import rep
from source_rows_v1255 import apply_data
from baseplan10_pins import replace_pins

BASE_SHA256 = '1e35528f32ff0b9cd3e0fb646b52cd92bc0c58733d3d9efaf9d02485e7c3a89b'  # live v12.59
FOOT_A = "+' · v12.59'; /* v8.19 release922"
FOOT_B = "+' · v12.55'; /* v8.19 release922"
OLD_BOOM = "{amount: 2176.65, days: 7, basis: '$310.95 a day x 7 days, 21 to 27 Oct 2026 - Baseplan (8) dates (Andrew, 28 Oct 2026)'}"
NEW_BOOM = "{amount: 1554.75, days: 5, basis: '$310.95 a day x 5 days, 21 to 26 Oct 2026 - Baseplan (10) dates (Andrew, 29 Oct 2026)'}"

# the drawer and card words for a covered line: the same places the held references (v11.52) speak from
DISPLAY = [
    ('tick label words',
     "const labWords = L => L.held1152 ? 'not charged here' : L.included1152 ? 'one charge with the toilet block' :",
     "const labWords = L => L.covered1255 ? 'in the contract labour line' : L.held1152 ? 'not charged here' : L.included1152 ? 'one charge with the toilet block' :"),
    ('charges fold words',
     "const said = info.held1152 ? esc(info.held1152) : info.included1152 ? esc(info.included1152) :",
     "const said = info.covered1255 ? esc(info.covered1255) : info.held1152 ? esc(info.held1152) : info.included1152 ? esc(info.included1152) :"),
    ('automatic charge row words',
     "esc(r.held1152?'not charged here':r.included1152?'one charge with the toilet block':Number.isFinite(r.rate)?chargeRateDisplay977(r.rate):'Rate to confirm')",
     "esc(r.covered1255?'in the contract labour line':r.held1152?'not charged here':r.included1152?'one charge with the toilet block':Number.isFinite(r.rate)?chargeRateDisplay977(r.rate):'Rate to confirm')"),
    ('manual charge row words',
     "esc(r.held1152?'not charged here':r.included1152?'one charge with the toilet block':money(r.rate))",
     "esc(r.covered1255?'in the contract labour line':r.held1152?'not charged here':r.included1152?'one charge with the toilet block':money(r.rate))"),
    ('charges included words',
     "(info.held1152?esc(info.held1152):info.included1152?esc(info.included1152):'Charges included · '",
     "(info.covered1255?esc(info.covered1255):info.held1152?esc(info.held1152):info.included1152?esc(info.included1152):'Charges included · '"),
]


def digest(text):
    return hashlib.sha256(text.encode('utf-8')).hexdigest()


def data_span(text):
    matches = list(re.finditer(r'\bconst DATA\s*=\s*', text))
    if len(matches) != 1:
        raise ValueError('Expected one DATA declaration')
    start = matches[0].end()
    data, size = json.JSONDecoder().raw_decode(text[start:])
    if json.dumps(data, ensure_ascii=False, separators=(',', ':')) != text[start:start + size]:
        raise ValueError('DATA serialisation differs from the live predecessor')
    return data, start, start + size


def exact(text, old, new, label, path):
    if text.count(old) != 1:
        raise ValueError(label + ': expected one exact occurrence, found %d' % text.count(old))
    return text.replace(old, new, 1)


def insert_module(text):
    """The covered-labour wrapper goes right after the held-references script (v11.52), so it wraps that wrapper."""
    marker = 'W.NotChargedHere1152 = api;'
    if text.count(marker) != 1:
        raise ValueError('held-references script: expected once')
    i = text.find(marker)
    close = text.find('</script>', i)
    if close < 0:
        raise ValueError('held-references script: no closing tag after it')
    module = (ROOT / 'covered1255.js').read_text(encoding='utf-8')
    if 'CoveredLabour1255' in text:
        raise ValueError('covered-labour module already present')
    return text[:close + len('</script>')] + module + text[close + len('</script>'):]


def patch(text, path='page'):
    if FOOT_B in text or 'CoveredLabour1255' in text:
        raise ValueError('v12.55 already applied')
    if digest(text) != BASE_SHA256:
        raise ValueError('v12.55 requires the exact live v12.59 predecessor (%s)' % BASE_SHA256[:8])
    styles = re.findall(r'<style\b[^>]*>[\s\S]*?</style>', text)
    data, start, end = data_span(text)
    revised, manifest = apply_data(data)
    if len(manifest['added']) != 6:
        raise ValueError('six Baseplan (10) lines expected')
    text = text[:start] + json.dumps(revised, ensure_ascii=False, separators=(',', ':')) + text[end:]
    text = replace_pins(text)
    text = exact(text, OLD_BOOM, NEW_BOOM, 'straight boom at Baseplan (10) dates', path)
    text = insert_module(text)
    for label, old, new in DISPLAY:
        text = exact(text, old, new, label, path)
    text = exact(text, FOOT_A, FOOT_B, 'release footer', path)
    if re.findall(r'<style\b[^>]*>[\s\S]*?</style>', text) != styles:
        raise ValueError('the release changed existing styles')
    return text


if __name__ == '__main__':
    page = Path(sys.argv[1])
    result = patch(page.read_text(encoding='utf-8'), str(page))
    page.write_text(result, encoding='utf-8')
    print('patch_v1255 applied: to the cent against Baseplan (10) - covered labour once, pins re-struck, two lines added')
