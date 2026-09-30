#!/usr/bin/env python3
"""v7.47 - Text it says what it is and where it goes. Andrew Fisher, 30 Sep 2026: "when I text and send, it will send
them, for example, the P41, what it is - toilets - and the GPS coordinates of where it goes."
The drawer's Text it now writes a short plain text: reference and what it is, GPS (and which source it is), a Maps
link, the pit lane way in, then the day and the pictures link while it fits three texts. It used to be about 700
characters, which the service (480 limit) refused. The long version stays one tap away as "Full details".
    python3 patch_v747.py <page.html>"""
import os, re, sys
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'toolchain'))
from rep import rep  # noqa: E402
here = os.path.dirname(os.path.abspath(__file__))
p = sys.argv[1]
t = open(p, encoding='utf-8').read(); bom = t.startswith('﻿'); t = t.lstrip('﻿')
if 'function text747What(' in t: sys.exit('v7.47 already applied')
if 'function pitLaneWayIn(' not in t or 'function drawerTidy(' not in t: sys.exit('needs v7.42 and v7.43')
JS = open(os.path.join(here, 'text747_src.js'), encoding='utf-8').read()
CSS = '\n/* v7.47 */\n.warn747{color:var(--red,#b42318);font-weight:600}\n'
if re.findall(r" \.[A-Za-z_]", JS): sys.exit('space before a dot in the JS')
# 1. the old text builder stays, renamed, as the "Full details" version; the new one sits beside it
t = rep(t, "function dropSmsText(a){", JS + "\n/* v7.47 - the long version, as it was: Full details in the Text box */\nfunction dropSmsLong(a){", 'text builder', p, True)
# 2. the Text box: a live count under the words
t = rep(t, " <p class=\"hint\" id=\"smMsg\">", " <p class=\"hint\" id=\"smCount\"></p>\n <p class=\"hint\" id=\"smMsg\">", 'count', p, True)
# 3. the Full details button beside Copy
t = rep(t, " <button class=\"btn\" id=\"smCopy\">Copy the words</button>",
 " <button class=\"btn\" id=\"smCopy\">Copy the words</button>\n <button class=\"btn ghost\" id=\"smLong\" type=\"button\">Full details</button>", 'long button', p, True)
# 4. wire the count, the Messages link and the Full details button
t = rep(t, " d.querySelector('#smCopy').onclick = async () => {",
 " text747Wire(d, a, ready); /* v7.47 */\n d.querySelector('#smCopy').onclick = async () => {", 'wire', p, True)
# 5. the words under the heading say what the text carries
t = rep(t, "'Goes from this service through ClickSend. The link opens the card with the pictures.'",
 "'Goes from this service through ClickSend: what it is, the GPS, a Maps link and the way in. The link opens the card with the pictures.'", 'sub', p, True)
k = t.find('</style>'); t = t[:k] + CSS + t[k:]
open(p, 'w', encoding='utf-8').write(('﻿' if bom else '') + t); print('ok', p)
