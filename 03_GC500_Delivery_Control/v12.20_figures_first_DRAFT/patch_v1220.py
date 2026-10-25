"""Author: Andrew Fisher. v12.20 - figures first on the Costs cards.

Andrew, 25 Oct 2026 (this chat): "i want this the amount of info shortened no one is going to read all this we just want
Figures" (the Forecast P&L's Revenue and Direct costs, "Not in it yet", Transport Revenue, Rehire by Revenue branch).

- figures1220_src.js: on those four cards the explanations fold away under a "Show the workings" button on each card,
  remembered for the visit; "Not in it yet" groups the lines that repeat and keeps each line short, the full list under the
  workings. Presentation only.
- footer v12.19 -> v12.20.

    python3 patch_v1220.py page.html      (in place, on the live v12.19 page)
"""
import hashlib, sys
from pathlib import Path
HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent / 'toolchain'))
from rep import rep
BASE = '6ccc030d201729e50015d77aa2f140ba63660fe32e0a5fc44c958d47b6636a16'


def patch(text):
    if 'Figures1220' in text: raise ValueError('v12.20 already applied')
    if hashlib.sha256(text.encode('utf-8')).hexdigest() != BASE: raise ValueError('Live base changed; rebuild and retest')
    js = (HERE / 'figures1220_src.js').read_text(encoding='utf-8').rstrip()
    end = "W.FenceInvoiced1219 = Object.freeze({version: 'v12.19', billed: billed});\n})(window);\n</script>\n</body>\n</html>"
    text = rep(text, end, end.replace('</script>\n</body>', '</script>\n' + js + '\n</body>'), 'figures first', 'page')
    return rep(text, "+' · v12.19'; /* v8.19 release922", "+' · v12.20'; /* v8.19 release922", 'release footer', 'page')


if __name__ == '__main__':
    p = Path(sys.argv[1]); t = p.read_text(encoding='utf-8')
    p.write_text(patch(t), encoding='utf-8')
    print('patch_v1220 applied: figures first on the Costs cards; footer v12.19 -> v12.20')
