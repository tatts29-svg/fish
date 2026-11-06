"""Author: Andrew Fisher. v12.65 - the P&L tab cleaned up: the P&L in Coates P&L lines, whole job and by branch, figures first.

The release built and tested as v12.62 on 30 Oct 2026 12:08 AEST (on the live v12.61), rebuilt unchanged on the live v12.64 on
Andrew's word "Lets do the p&l" (30 Oct 2026, this chat). The script and style are byte for byte the tested candidate's and keep
their v12.62 ids (pl1262); only the base and the footer differ.

Andrew, 30 Oct 2026 (this chat): "We need to clean up the p&L tab layout. Needs improving. Think terminology with coates p&l
layout and what belongs in and against each branch. And then also as a whole.." and, at 12:0x AEST, "I want the p&l tab
cleaned up for the 1000th time".

- pl1262_src.js + pl1262.css: after every render of the Costs & P&L pane the face becomes the P&L (whole job on the Coates
  P&L lines, On the record and Job end, with gross margin and contribution; then by branch, job end, KINP STPS NVAC MEAD
  and the job), "Not in it yet", and two closed folds: "Fencing, everything included" (the card that sat at the top) and
  "Workings" (every other card, moved, not removed; every button still bound). Every figure is the page's own model's.
- the style and the script go in just before the page's closing </body>, after every script they read.
- footer v12.64 -> v12.65.

    python3 patch_v1265.py page.html      (in place, on the live v12.64 page; BASE is its verified SHA-256)
"""
import hashlib, re, sys
from pathlib import Path
HERE = Path(__file__).resolve().parent
BASE = 'afbbc0d1448f3ecf83db854a2ec44634d3704884a9b0e95e24c4ee6407c966c0'  # live v12.64, public GET 30 Oct 2026 16:45 AEST, read again 17:0x
FOOTER = re.compile(r"\+' · (v12\.\d+(?:\.\d+)?)'; /\* v8\.19 release922")


def patch(text):
    if 'pl1262-script' in text: raise ValueError('the P&L tab release is already applied')
    if hashlib.sha256(text.encode('utf-8')).hexdigest() != BASE: raise ValueError('Live base is not the verified v12.64; rebuild and retest')
    if 'gone1263' not in text or 'Baseplan (11) charges this line' not in text: raise ValueError('the base is missing v12.63 or v12.64')
    js = (HERE / 'pl1262_src.js').read_text(encoding='utf-8').rstrip()
    css = (HERE / 'pl1262.css').read_text(encoding='utf-8').rstrip()
    end = '</body>\n</html>'
    i = text.rfind(end)
    if i < 0 or len(text) - i > len(end) + 2: raise ValueError('the page does not end with </body></html>')
    block = '<style id="pl1262-style">\n' + css + '\n</style>\n<script id="pl1262-script">\n' + js + '\n</script>\n'
    text = text[:i] + block + text[i:]
    found = FOOTER.findall(text)
    if found != ['v12.64']: raise ValueError('release footer: expected one v12.64 footer, found ' + repr(found))
    return FOOTER.sub(lambda m: m.group(0).replace(m.group(1), 'v12.65'), text, count=1)


if __name__ == '__main__':
    p = Path(sys.argv[1]); t = p.read_text(encoding='utf-8')
    p.write_text(patch(t), encoding='utf-8')
    print('patch_v1265 applied: the P&L tab in Coates lines, whole job and by branch; footer v12.64 -> v12.65')
