#!/usr/bin/env python3
r"""v7.74 - Tidy, the second pass. The rest of the management read of 1 Oct 2026 (the readers' findings verified against the
page source by seven verifiers, each with the exact source string and its replacement) - wording only; no figure, rule or
record changes. Apply after v7.73.

  Every item in evidence/replacements.json is a verified finding: the quote as a manager read it, why it misleads, the
  exact source string (which occurs once in the build) and the replacement in the page's voice. The patch applies each
  only where the string still occurs exactly once; one that does not is skipped and printed, never guessed.
    python3 patch_v774.py <page.html>"""
import os, sys, json
p = sys.argv[1]
t = open(p, encoding='utf-8').read(); bom = t.startswith('﻿'); t = t.lstrip('﻿')
if 'v7.73 - CRYSTAL' not in t: sys.exit('needs v7.73 first')
lst = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'evidence', 'replacements.json')
applied = skipped = 0
for item in json.load(open(lst, encoding='utf-8')):
    old, new = item['old'], item['new']
    if not old or old == new: continue
    if t.count(old) == 1: t = t.replace(old, new); applied += 1
    else: skipped += 1; print(f"  skip (found {t.count(old)}): {item.get('tab', '')} - {item.get('quote', '')[:70]!r}")
if not applied: sys.exit('v7.74: nothing applied')
t = t.replace('/* v7.73 - CRYSTAL.', '/* v7.74 - tidy, the second pass: ' + str(applied) + ' verified wordings from the management read of 1 Oct 2026. */\n/* v7.73 - CRYSTAL.', 1)
open(p, 'w', encoding='utf-8').write(('﻿' if bom else '') + t)
print(f'v7.74 applied: {applied} wordings from the management read, {skipped} skipped')
