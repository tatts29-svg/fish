"""Author: Andrew Fisher. v12.22 - figures first on the Costs cards (built as v12.20, renumbered to follow Codex's v12.21).

Andrew, 25 Oct 2026 (this chat): "i want this the amount of info shortened no one is going to read all this we just want
Figures" (the Forecast P&L's Revenue and Direct costs, "Not in it yet", Transport Revenue, Rehire by Revenue branch).

- figures1220_src.js: on those four cards the explanations fold away under a "Show the workings" button on each card,
  remembered for the visit; "Not in it yet" groups the lines that repeat and keeps each line to its figures, the full
  list under the workings. Presentation only. (Its ids keep the 1220 suffix it was written with.)
- the script goes in just before the page's closing </body>, so it does not depend on what the release before it appended.
- footer v12.21 -> v12.22.

    python3 patch_v1222.py page.html      (in place, on the live v12.21 page; BASE is its verified SHA-256)
"""
import hashlib, re, sys
from pathlib import Path
HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent / 'toolchain'))
from rep import rep
BASE = 'PENDING: the verified live v12.21 SHA-256, filled in when Codex posts it LIVE'
FOOTER = re.compile(r"\+' · (v12\.\d+(?:\.\d+)?)'; /\* v8\.19 release922")


def patch(text):
    if 'Figures1220' in text: raise ValueError('v12.22 already applied')
    if hashlib.sha256(text.encode('utf-8')).hexdigest() != BASE: raise ValueError('Live base is not the verified v12.21; rebuild and retest')
    js = (HERE / 'figures1220_src.js').read_text(encoding='utf-8').rstrip()
    end = '</body>\n</html>'
    i = text.rfind(end)
    if i < 0 or len(text) - i > len(end) + 2: raise ValueError('the page does not end with </body></html>')
    text = text[:i] + js + '\n' + text[i:]
    found = FOOTER.findall(text)
    if found != ['v12.21']: raise ValueError('release footer: expected one v12.21 footer, found ' + repr(found))
    return FOOTER.sub(lambda m: m.group(0).replace(m.group(1), 'v12.22'), text, count=1)


if __name__ == '__main__':
    p = Path(sys.argv[1]); t = p.read_text(encoding='utf-8')
    p.write_text(patch(t), encoding='utf-8')
    print('patch_v1222 applied: figures first on the Costs cards; footer v12.21 -> v12.22')
