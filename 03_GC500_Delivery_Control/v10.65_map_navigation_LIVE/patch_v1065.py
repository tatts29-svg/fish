"""Author: Andrew Fisher. Scoped navigation fixes and the exact reviewed map build."""
from pathlib import Path
import re
import sys

HERE = Path(__file__).resolve().parent
for folder in [HERE / 'navigation', HERE / 'shape', HERE.parent / 'toolchain']:
    sys.path.insert(0, str(folder))
from patch_costs_scroll1065 import apply as costs
from patch_ripple1065 import patch as ripple
from rep import rep


def patch(text):
    if 'EXPLORER_BUILD_1065' in text:
        raise ValueError('v10.65 already applied')
    if 'map1064:' not in text:
        raise ValueError('Expected v10.64 base or later preserving its shape fix')
    text = costs(text)
    text = ripple(text)
    anchor = "const EXPLORER_BUILD_1064 = EXPLORER_BUILD.replace('explorer.js?v=8586cb7d5008', 'explorer.js?v=c096837cb410');"
    addition = "\n const EXPLORER_BUILD_1065 = EXPLORER_BUILD_1064.replace('explorer.js?v=c096837cb410', 'explorer.js?v=e175ec073b2d').replace('explorer-merge.js?v=97a4087210f3', 'explorer-merge.js?v=7c276bb18154');"
    text = rep(text, anchor, anchor + addition, 'reviewed map build', 'page')
    text = rep(text, '[EXPLORER_BUILD, EXPLORER_BUILD_1064].includes', '[EXPLORER_BUILD, EXPLORER_BUILD_1064, EXPLORER_BUILD_1065].includes', 'exact script allowlist', 'page')
    versions = re.findall(r"\+ ' · (v10\.\d+(?:\.\d+)?)'; /\* v8\.19 release922", text)
    if len(versions) != 1:
        raise ValueError('Expected one current release footer')
    return rep(text, "+ ' · " + versions[0] + "'; /* v8.19 release922", "+ ' · v10.65'; /* v8.19 release922", 'release footer', 'page')


if __name__ == '__main__':
    page = Path(sys.argv[1]); page.write_text(patch(page.read_text()))
