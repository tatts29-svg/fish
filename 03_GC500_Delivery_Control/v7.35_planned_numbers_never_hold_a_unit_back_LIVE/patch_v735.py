#!/usr/bin/env python3
"""v7.35 - a planned number never holds a unit back. Andrew Fisher, 29 Sep 2026, P53: cancelled, never arrived, still carrying
the schedule's 1327222 (also the schedule's on P36, whose building on site is 1282487). Stale claims no longer block a
number; putting it on a location takes it off them; the inventory check releases a cancelled order's planned number
instead of moving it to spares.
    python3 patch_v735.py <page.html>"""
import os, re, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from patch_v669 import rep  # noqa: E402
here = os.path.dirname(os.path.abspath(__file__))
p = sys.argv[1]
t = open(p, encoding='utf-8').read(); bom = t.startswith('﻿'); t = t.lstrip('﻿')
if 'function staleClaim(' in t: sys.exit('v7.35 already applied')
if 'function bookRest(' not in t: sys.exit('needs v7.34')
JS = open(os.path.join(here, 'stale735_src.js'), encoding='utf-8').read()
if re.findall(r" \.[A-Za-z_]", JS): sys.exit('space before a dot in the JS')
t = rep(t, "function locNums(a){", JS + "\nfunction locNums(a){", 'code', p, True)
# owners: a stale claim is not an owner
t = rep(t, """ allAssets().forEach(a => { if (a.key === key) return;
 if (assetNumbersOf(a).includes(s)) out.push({key: a.key, how: 'number'});""", """ allAssets().forEach(a => { if (a.key === key) return;
 if (assetNumbersOf(a).includes(s)) { if (!staleClaim(a, s)) out.push({key: a.key, how: 'number'}); } /* v7.35 — a planned-only claim holds nothing back */""", 'owners', p, True)
# putting a number on a location takes it off the stale claims
t = rep(t, "function numberPutOn(key, v, who){", "function numberPutOn(key, v, who){\n try { releaseStale(v, key, who); } catch (e) {} /* v7.35 */", 'put on', p, True)
# the inventory check: a cancelled order that never arrived releases its planned number; one on site moves to spares
t = rep(t, """ I.offOn.map(x => `<li><b>${esc(x.a.key)}</b> is cancelled but still carries ${esc(x.nums.concat(x.subs.map(s => s.co + (s.no ? ' ' + s.no : ''))).join(', '))}${x.on ? ' and is marked on site' : ''}. <button type="button" class="btn ghost sm" data-spfromcx="${esc(x.a.key)}"${dis}>Move to spares</button></li>`));""",
 """ I.offOn.map(x => x.on ? `<li><b>${esc(x.a.key)}</b> is cancelled but on site, carrying ${esc(x.nums.concat(x.subs.map(s => s.co + (s.no ? ' ' + s.no : ''))).join(', '))}. <button type="button" class="btn ghost sm" data-spfromcx="${esc(x.a.key)}"${dis}>Move to spares</button></li>`
  : `<li><b>${esc(x.a.key)}</b> is cancelled and never arrived - ${esc(x.nums.join(', ') || 'its number')} was only planned for it. <button type="button" class="btn ghost sm" data-sprelease="${esc(x.a.key)}"${dis}>Release ${esc(x.nums.join(', ') || 'it')}</button></li>`));""", 'check list', p, True)
t = rep(t, " pane.querySelectorAll('[data-spfromcx]').forEach(b => b.onclick = () => spareFromCancelled(b.dataset.spfromcx));",
 """ pane.querySelectorAll('[data-spfromcx]').forEach(b => b.onclick = () => spareFromCancelled(b.dataset.spfromcx));
 pane.querySelectorAll('[data-sprelease]').forEach(b => b.onclick = () => { const k = b.dataset.sprelease, a = assetOf(k); if (!a || !mayWrite('a number')) return; const who = whoAmI(); if (!who) return;
  const ns = invCoatesNums(a); ns.forEach(n => numberTakeOff(k, n, who)); bump(); flash(ns.join(', ') + ' released from cancelled ' + k + ' by ' + who + ' - free to go on the location it is really at.'); });""", 'release wire', p, True)
# say where it came off
t = rep(t, " numberPutOn(key, v, who); if (spareClaim(v, INV_COATES, who)) chSay(v + ' is now on ' + key + ' — out of spares'); bump();",
 " numberPutOn(key, v, who); if (spareClaim(v, INV_COATES, who)) chSay(v + ' is now on ' + key + ' — out of spares'); if (releasedWords(v)) chSay(v + ' is now on ' + key + releasedWords(v)); bump();", 'said', p, True)
t = rep(t, "  numberPutOn(key, n, who); const sp = spareClaim(n, INV_COATES, who); bump();\n  flash(n + ' is on ' + key + (sp ? ' - out of spares' : '') + '. By ' + who + '.'); return true;",
 "  numberPutOn(key, n, who); const sp = spareClaim(n, INV_COATES, who); bump();\n  flash(n + ' is on ' + key + (sp ? ' - out of spares' : '') + releasedWords(n) + '. By ' + who + '.'); return true;", 'walk said', p, True)
open(p, 'w', encoding='utf-8').write(('﻿' if bom else '') + t); print('ok', p)
