# Author: Andrew Fisher. v8.94: the Lighting group's basis is stated wherever its reading is shown (Where we are card,
# its Lighting chip and basis note, and the Lighting group card). The lighting scope audit is pending, so Lighting and the
# whole-job figure are labelled unconfirmed (never ≥: the audit could move the total either way); no number, record, DATA or money changes.
# Needs v8.85 (the Where we are card). Chains after v8.89, v8.90, v8.91, v8.92 or v8.93:
#   toolchain/build.sh v8.94 <full chain> [v8.93_maps_aligned_DRAFT/patch_v893.py] v8.94_lighting_basis_DRAFT/patch_v894.py
import re, sys
from pathlib import Path
here = Path(__file__).resolve().parent
sys.path.insert(0, str(here.parent / 'toolchain'))
from rep import rep

p = Path(sys.argv[1]); s = p.read_text()
assert 'where885-script' in s and 'function progress881Model(' in s and 'function renderToday_held(' in s, 'v8.94 needs v8.85 first'
assert 'lighting894-script' not in s, 'v8.94 already applied'

# footer: whichever release this follows
marks = re.findall(r' · v8\.(?:89|9[0-3])\b', s)
assert len(marks) == 1 and s.count(marks[0]) == 1, 'expected one footer marker once, found %r' % marks
s = rep(s, marks[0], ' · v8.94', 'release footer', str(p))

css = (here / 'lighting894.css').read_text(); js = (here / 'lighting894.js').read_text()
assert '</style' not in css and '</script' not in js
for bad, what in ((r'\$\s?\d', 'a dollar figure'), (r'(?i)site\s?iq', 'SiteIQ'), (r'(?i)\b(?:codex|claude|chatgpt|openai|anthropic)\b', 'an agent name')):
    assert not re.search(bad, js + css), 'v8.94 carries ' + what
s = s.replace('</head>', '<style id="lighting894-style">' + css + '</style>\n</head>', 1)
head, tag, tail = s.rpartition('</body>')
assert tag and '<script' not in tail
s = head + '<script id="lighting894-script">\n' + js + '</script>\n' + tag + tail
p.write_text(s)
print('v8.94 applied: Lighting basis stated; footer', marks[0].strip(), '-> v8.94')
