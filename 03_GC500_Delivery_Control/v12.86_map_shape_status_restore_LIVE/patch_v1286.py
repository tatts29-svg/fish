"""Author: Andrew Fisher. Restore reviewed map adapters after the v12.85 script update.

The two parent adapters intentionally reject unreviewed Explorer builds. Retain
that guard and their previous accepted builds, and add only the exact current
six-script identity. No equipment, completion, geometry or record logic changes.
"""
from pathlib import Path
import hashlib
import sys

BASE_SHA256 = 'be38bdbeffbf82adbb6a6f51b03bba66a1184dd3618b3d0c5504fdb6f7ca196a'
CURRENT_SCRIPTS = 'explorer.js?v=641db3a7b324|explorer-merge.js?v=c62854961e0d|fencing-map-core.js?v=0c26c3b7777f|fencing-map-explorer.js?v=e3a4bef6c17d|explorer-fix864.js?v=d7041320fc3f|explorer-fix887.js?v=6996471a6a0f'
PREVIOUS_SCRIPTS = 'explorer.js?v=e175ec073b2d|explorer-merge.js?v=7c276bb18154|fencing-map-core.js?v=0c26c3b7777f|fencing-map-explorer.js?v=e3a4bef6c17d|explorer-fix864.js?v=d7041320fc3f|explorer-fix887.js?v=6996471a6a0f'
HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent / 'toolchain'))
from rep import rep

SHAPE_OLD = "if (![EXPLORER_BUILD, EXPLORER_BUILD_1064, EXPLORER_BUILD_1065].includes([...doc.querySelectorAll('script[src]')].map(s => s.getAttribute('src')).join('|'))) return false;"
SHAPE_NEW = "if (![EXPLORER_BUILD, EXPLORER_BUILD_1064, EXPLORER_BUILD_1065, '" + CURRENT_SCRIPTS + "'].includes([...doc.querySelectorAll('script[src]')].map(s => s.getAttribute('src')).join('|'))) return false; /* v12.86: retain exact identity checks and admit the reviewed v12.85 map. */"
SPOT_OLD = "if ([...doc.querySelectorAll('script[src]')].map(s => s.getAttribute('src')).join('|') !== EXPLORER_BUILD) return false;"
SPOT_NEW = "if (![EXPLORER_BUILD, '" + CURRENT_SCRIPTS + "'].includes([...doc.querySelectorAll('script[src]')].map(s => s.getAttribute('src')).join('|'))) return false; /* v12.86: same reviewed map identity for departure, search and equipment adapters. */"


def apply(text):
    if 'v12.86: retain exact identity checks' in text:
        raise ValueError('v12.86 map adapter fix is already applied')
    if hashlib.sha256(text.encode()).hexdigest() != BASE_SHA256:
        raise ValueError('Expected the exact live v12.85 dashboard; rebuild if live changed')
    text = rep(text, SHAPE_OLD, SHAPE_NEW, 'reviewed equipment shapes and doors adapter', 'v12.86')
    text = rep(text, SPOT_OLD, SPOT_NEW, 'reviewed departure and map tools adapter', 'v12.86')
    return rep(text, "+' · v12.85';", "+' · v12.86';", 'release footer', 'v12.86')


if __name__ == '__main__':
    path = Path(sys.argv[1])
    path.write_text(apply(path.read_text()), encoding='utf-8')
