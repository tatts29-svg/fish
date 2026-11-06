"""Author: Andrew Fisher. Bind final card-only correction to completed standing checks."""
from pathlib import Path
import hashlib
import json
import os

root = Path(__file__).resolve().parents[2]
out = Path(__file__).resolve().parent
page = Path(os.environ['PAGE'])
expected = os.environ['CANDIDATE_SHA256']
final = page.read_text()
sha = lambda text: hashlib.sha256(text.encode()).hexdigest()
assert sha(final) == expected
restored = final
changes = [
    ('selected booking number helper', "function bookingNosLine801(a){ return Array.isArray(a._bookingNumbers801) ? a._bookingNumbers801.map(esc).join(' · ') : assetNosLine(a); }\n", ''),
    ('selected day card header', '<div class="dcno"><em>${Array.isArray(a._bookingNumbers801) ? \'Booked asset\' : \'Asset no.\'}</em><b>${bookingNosLine801(a) || \'<span class="todo">none supplied</span>\'}</b></div>', '<div class="dcno"><em>Asset no.</em><b>${assetNosLine(a) || \'<span class="todo">none supplied</span>\'}</b></div>'),
]
for eventword in ['events', '(events || [])']:
    changes.append(('verified booking provenance ' + eventword,
                    'const inferred = ' + eventword + '.some(e => !e.movement_stated && (!e.booking801 || e.bookingMoved801));',
                    'const inferred = ' + eventword + '.some(e => !e.movement_stated);'))
for name, after, before in changes:
    assert restored.count(after) == 1, name
    restored = restored.replace(after, (' ' + before) if before else '')
standing_sha = 'f2a4abfd1d483840cc5e1346acddba62b9e1c9d6de1c1fdd6766bae90441c6fb'
assert sha(restored) == standing_sha, sha(restored)
status = json.loads((out / 'review801_suite_status.json').read_text())
assert status['candidateSha256'] == standing_sha
assert len(status['results']) == 12 and all(r['exit'] == 0 for r in status['results'])
result = {'author': 'Andrew Fisher', 'candidateSha256': expected,
          'standingCandidateSha256': standing_sha,
          'fullPageReconstructedByteForByte': True,
          'changedScopes': [name for name, _, _ in changes],
          'standingSuitesAllPassed': status['results'],
          'binding': 'Reversing only these four selected-card display edits reproduces every byte of the fully tested f2 candidate. DATA, storage, sync, navigation, Equipment, packed Today, rules, freshness, print and drawer-status sources are unchanged. The final selected-card header/provenance behaviour receives focused booking source and actual desktop/phone card tests; the standing suite is not represented as rerun on the later hash.',
          'liveWrites': 0}
(out / 'review801_standing_binding.json').write_text(json.dumps(result, indent=2) + '\n')
print(json.dumps({'candidateSha256': expected, 'standingCandidateSha256': standing_sha,
                  'fullPageReconstructedByteForByte': True, 'changedScopes': len(changes)}))
