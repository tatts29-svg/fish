"""Author: Andrew Fisher. v12.62 - the P&L tab cleaned up: the P&L in Coates P&L lines, whole job and by branch, figures first.

Andrew, 30 Oct 2026 (this chat): "We need to clean up the p&L tab layout. Needs improving. Think terminology with coates p&l
layout and what belongs in and against each branch. And then also as a whole.." and, at 12:0x AEST, "I want the p&l tab
cleaned up".

- pl1262_src.js + pl1262.css: after every render of the Costs & P&L pane the face becomes the P&L (whole job on the Coates
  P&L lines, On the record and Job end, with gross margin and contribution; then by branch, job end, KINP STPS NVAC MEAD
  and the job), "Not in it yet", and two closed folds: "Fencing, everything included" (the card that sat at the top) and
  "Workings" (every other card, moved, not removed; every button still bound). Every figure is the page's own model's.
- the style and the script go in just before the page's closing </body>, after every script they read.
- footer v12.61 -> v12.62.

    python3 patch_v1262.py page.html      (in place, on the live v12.61 page; BASE is its verified SHA-256)
"""
import hashlib, re, sys
from pathlib import Path
HERE = Path(__file__).resolve().parent
BASE = 'ddd1bd7adaf8c9a3749404829d01493c7373e67a43762b8391a1568cf239ba90'  # live v12.61, public GET 30 Oct 2026 04:52 AEST
FOOTER = re.compile(r"\+' · (v12\.\d+(?:\.\d+)?)'; /\* v8\.19 release922")


def patch(text):
    if 'pl1262-script' in text: raise ValueError('v12.62 already applied')
    if hashlib.sha256(text.encode('utf-8')).hexdigest() != BASE: raise ValueError('Live base is not the verified v12.61; rebuild and retest')
    js = (HERE / 'pl1262_src.js').read_text(encoding='utf-8').rstrip()
    css = (HERE / 'pl1262.css').read_text(encoding='utf-8').rstrip()
    end = '</body>\n</html>'
    i = text.rfind(end)
    if i < 0 or len(text) - i > len(end) + 2: raise ValueError('the page does not end with </body></html>')
    block = '<style id="pl1262-style">\n' + css + '\n</style>\n<script id="pl1262-script">\n' + js + '\n</script>\n'
    text = text[:i] + block + text[i:]
    found = FOOTER.findall(text)
    if found != ['v12.61']: raise ValueError('release footer: expected one v12.61 footer, found ' + repr(found))
    return FOOTER.sub(lambda m: m.group(0).replace(m.group(1), 'v12.62'), text, count=1)


if __name__ == '__main__':
    p = Path(sys.argv[1]); t = p.read_text(encoding='utf-8')
    p.write_text(patch(t), encoding='utf-8')
    print('patch_v1262 applied: the P&L tab in Coates lines, whole job and by branch; footer v12.61 -> v12.62')
