"""Author: Andrew Fisher. Exact label fitting and compatible map tile-recovery rollout."""
from pathlib import Path
import re
import sys

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent / 'toolchain'))
from rep import rep

OLD = "for (let i = 0; i <= n; i++) for (let j = 0; j <= k; j++) if ((j === 0 || j === k || i === 0 || i === n) && !inGroup(at(x0 + w * i / n, b0 - h / 2 + h * j / k))) return false;"
NEW = "for (let i = 0; i <= n; i++) for (let j = 0; j <= k; j += (i === 0 || i === n ? 1 : k)) if (!inGroup(at(x0 + w * i / n, b0 - h / 2 + h * j / k))) return false;    /* map1064: identical perimeter samples, without discarded interior iterations */"

def patch(text):
    if 'map1064:' in text:
        raise ValueError('v10.64 already applied')
    if 'window.GC500Shape1060' not in text or 'its old ring\'s reach still picks it' not in text:
        raise ValueError('Expected current shape layer and near-miss fix')
    text = rep(text, OLD, NEW, 'exact boundary label samples', 'page')
    old = "const EXPLORER_BUILD = ['explorer.js?v=8586cb7d5008', 'explorer-merge.js?v=97a4087210f3', 'fencing-map-core.js?v=0c26c3b7777f', 'fencing-map-explorer.js?v=e3a4bef6c17d', 'explorer-fix864.js?v=d7041320fc3f', 'explorer-fix887.js?v=6996471a6a0f'].join('|');"
    new = old + "\n const EXPLORER_BUILD_1064 = EXPLORER_BUILD.replace('explorer.js?v=8586cb7d5008', 'explorer.js?v=c096837cb410');    /* both exact reviewed builds during the guarded rollout */"
    text = rep(text, old, new, 'reviewed map script versions', 'page')
    text = rep(text,
        "if ([...doc.querySelectorAll('script[src]')].map(s => s.getAttribute('src')).join('|') !== EXPLORER_BUILD) return false;",
        "if (![EXPLORER_BUILD, EXPLORER_BUILD_1064].includes([...doc.querySelectorAll('script[src]')].map(s => s.getAttribute('src')).join('|'))) return false;",
        'exact map build compatibility', 'page')
    versions = re.findall(r"\+ ' · (v10\.\d+(?:\.\d+)?)'; /\* v8\.19 release922", text)
    if len(versions) != 1:
        raise ValueError('Expected exactly one current release footer')
    text = rep(text, "+ ' · " + versions[0] + "'; /* v8.19 release922", "+ ' · v10.64'; /* v8.19 release922", 'release footer', 'page')
    return text

if __name__ == '__main__':
    page = Path(sys.argv[1]); page.write_text(patch(page.read_text()))
