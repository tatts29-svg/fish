#!/usr/bin/env python3
"""v7.43 - the drawer shows what is relevant. Andrew Fisher, 29 Sep 2026: no option to add accessories on a generator;
WC43 reads as sub-hired clear as day; data not needed comes off. Also: the id generator no longer breaks on punctuation
in a recorder's name (the "F-AF(-0001" fault of 29 Sep).
    python3 patch_v743.py <page.html>"""
import os, re, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from patch_v669 import rep  # noqa: E402
here = os.path.dirname(os.path.abspath(__file__))
p = sys.argv[1]
t = open(p, encoding='utf-8').read(); bom = t.startswith('﻿'); t = t.lstrip('﻿')
if 'function drawerTidy(' in t: sys.exit('v7.43 already applied')
if 'function pitLaneWayIn(' not in t: sys.exit('needs v7.42')
JS = open(os.path.join(here, 'tidy743_src.js'), encoding='utf-8').read()
CSS = open(os.path.join(here, 'tidy743.css'), encoding='utf-8').read()
if re.findall(r" \.[A-Za-z_]", JS): sys.exit('space before a dot in the JS')
# the code sits with the drawer
t = rep(t, "function openAsset_held(key, opts){", JS + "\nfunction openAsset_held(key, opts){", 'code', p, True)
# 1. the header line: the SUB-HIRED chip, and no Coates Rental ID on a sub-hired location
t = rep(t, "<div class=\"sub\">${shortChip(a)} ${esc(a.name||'')} · ${esc(a.discipline)}${(() => { const c = contractOf(a.key); return c.id ? ` · Rental ID <b class=\"mono\">",
 "<div class=\"sub\">${shortChip(a)}${subhireChip(a.key)} ${esc(a.name||'')} · ${esc(a.discipline)}${(() => { const c = contractOf(a.key); return c.id && !subhireOf(a.key) ? ` · Rental ID <b class=\"mono\">", 'header', p, True)
# 2. the banner, first thing under the header
t = rep(t, " ${reportedCard(a.key)}\n", " ${reportedCard(a.key)}\n ${subhireBanner(a)}\n", 'banner', p, True)
# 3. the Coates-only blocks stay out of a sub-hired location's drawer
t = rep(t, " ${contractBlock(a)}\n ${branchBlock(a)}\n", " ${subhireOf(a.key) ? '' : contractBlock(a) + branchBlock(a)} ${/* v7.43 - not a sub-hired location's story */ ''}\n", 'coates blocks', p, True)
# 4. after the draw: what does not apply comes out
t = rep(t, "\n wireSupplied(a);\n wireDelivery(a);", "\n drawerTidy(a); /* v7.43 */\n wireSupplied(a);\n wireDelivery(a);", 'tidy call', p, True)
# 5. the accessory form's handler tolerates the form being absent
t = rep(t, " $('#accAdd').onclick = () => {", " if ($('#accAdd')) $('#accAdd').onclick = () => {", 'acc handler', p, True)
# 5b. the number box's handler tolerates the box being absent (not-numbered references have none)
t = rep(t, " $('#numBtn').onclick = () => {", " if ($('#numBtn')) $('#numBtn').onclick = () => {", 'num handler', p, True)
# 6. the banner's button
t = rep(t, " const eof = e.target.closest('[data-entryoff]');",
 " const sho = e.target.closest('[data-subhireoff]');\n if (sho) { e.stopPropagation(); e.preventDefault(); if (subhireUnmark(sho.dataset.subhireoff)) render(); return; } /* v7.43 */\n const eof = e.target.closest('[data-entryoff]');", 'banner button', p, True)
# 7. the id generator: initials are letters only, so a bracket or a dot in a name can never make every id the same
t = rep(t, " const pre = (S.operator || '').trim().split(/\\s+/).map(w => w[0] || '').join('').toUpperCase().slice(0, 3);",
 " const pre = (S.operator || '').trim().split(/\\s+/).map(w => (String(w).match(/[A-Za-z]/) || [''])[0]).join('').toUpperCase().replace(/[^A-Z]/g, '').slice(0, 3); /* v7.43 - letters only */", 'id generator', p, True)
k = t.find('</style>'); t = t[:k] + CSS + t[k:]
open(p, 'w', encoding='utf-8').write(('﻿' if bom else '') + t); print('ok', p)
