#!/usr/bin/env python3
"""Author: Andrew Fisher. Contain the existing phone drawer Navigate button."""
import argparse
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT.parent / 'toolchain'))
from rep import rep

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('page', type=Path)
parser.add_argument('--reverse', action='store_true')
args = parser.parse_args()
p = args.page
s = p.read_text()
marker = 'id="drawer-navigation806"'
css = (ROOT / 'drawer_navigation806_src.css').read_text()
if args.reverse:
    matches = list(re.finditer(r'<style id="drawer-navigation806" data-previous-release="(v\d+\.\d+)">\n', s))
    if len(matches) != 1:
        raise SystemExit('v8.06 reverse requires exactly one applied style marker')
    previous = matches[0].group(1)
    block = matches[0].group(0) + css + '</style>\n'
    s = rep(s, block, '', 'remove only the v8.06 containment rules', str(p))
    s = rep(s, '<meta name="gc500-release" content="v8.06">', f'<meta name="gc500-release" content="{previous}">', 'restore the previous release marker', str(p))
else:
    if marker in s:
        raise SystemExit('v8.06 phone drawer containment already applied')
    if 'function cw2Plan803(' not in s or '.navbtn{display:inline-flex;align-items:center;gap:6px;white-space:nowrap}' not in s:
        raise SystemExit('v8.06 requires the current plan release and native Navigate component')
    versions = re.findall(r'<meta name="gc500-release" content="(v\d+\.\d+)">', s)
    if len(versions) != 1 or versions[0] == 'v8.06':
        raise SystemExit('v8.06 requires exactly one earlier release marker')
    previous = versions[0]
    block = f'<style id="drawer-navigation806" data-previous-release="{previous}">\n' + css + '</style>\n'
    s = rep(s, '</head>\n<body>', block + '</head>\n<body>', 'phone drawer Navigate containment', str(p))
    s = rep(s, f'<meta name="gc500-release" content="{previous}">', '<meta name="gc500-release" content="v8.06">', 'phone drawer release marker', str(p))
p.write_text(s)
print('v8.06 phone drawer navigation: ' + ('reversed' if args.reverse else 'existing button contained; no data or script changes'))
