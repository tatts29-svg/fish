#!/usr/bin/env python3
"""v7.21 - Daniel Gough on the install team. Andrew Fisher, 28 Sep 2026: "Also add Daniel as part of the install team",
with Daniel's email signature: Mobile 0493610669, Email vangough2023@gmail.com. He was already on the labour sheet
(External, Job Connect) but not on the team list, so the Team page, the pre-start and the install sheet did not name him.
He goes on the list beside Aaron, Alfie and Kyle, and on the pre-start sign-on sheet; the notes that said the install team is "these three" now say four.
No title or branch was given, so none is written.   python3 patch_v721.py <page.html>"""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from patch_v669 import rep  # noqa: E402
DANIEL = ('{"name":"Daniel Gough","event_role":"Installer","group":"install","lead":null,"about":"Install team · added by the '
          'project manager 28 Sep 2026 · name, mobile and email as in Daniel’s own email signature, which the project manager '
          'forwarded. On the labour sheet as External, through Job Connect. No title or branch was given, so none is written",'
          '"title":null,"location":null,"email":"vangough2023@gmail.com","mobile":"0493 610 669","phone":null,"reports_to":null,"company":null}')
p = sys.argv[1]
t = open(p, encoding='utf-8').read(); bom = t.startswith('﻿'); t = t.lstrip('﻿')
if '"name":"Daniel Gough","event_role"' in t: sys.exit('v7.21 already applied')
i = t.index('{"name":"Kyle Gover","event_role":"Installer","group":"install"')
j = t.index('"company":null}', i) + len('"company":null}')
t = t[:j] + ',' + DANIEL + t[j:]
t = rep(t, '{"name": "Kyle Gover", "role": "Installer"}]};', '{"name": "Kyle Gover", "role": "Installer"}, {"name": "Daniel Gough", "role": "Installer"}]};', 'pre-start crew', p, True)
t = rep(t, '"note":"the install team is these three people only', '"note":"the install team is these four people only', 'note 1', p, True)
t = rep(t, 'The install team is these three and nobody else;', 'The install team is these four and nobody else;', 'note 2', p, True)
open(p, 'w', encoding='utf-8').write(('﻿' if bom else '') + t); print('ok', p)
