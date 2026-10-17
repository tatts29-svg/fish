#!/usr/bin/env python3
"""v7.40 - signed fencing papers recorded on the page. Andrew Fisher, 29 Sep 2026: seven signed Advanced papers, "5 for
hire agreement, the other 2 for service." A hire agreement is typed in and saved as a docket (red book); a service note
goes into a new synced list, serviceNotes (green book, cost only). Both on the Fencing tab.
    python3 patch_v740.py <page.html>"""
import os, re, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from patch_v669 import rep  # noqa: E402
here = os.path.dirname(os.path.abspath(__file__))
p = sys.argv[1]
t = open(p, encoding='utf-8').read(); bom = t.startswith('﻿'); t = t.lstrip('﻿')
if 'function recordServiceNote(' in t: sys.exit('v7.40 already applied')
if 'data-po-note=' not in t: sys.exit('needs v7.39')
JS = open(os.path.join(here, 'paper740_src.js'), encoding='utf-8').read()
CSS = open(os.path.join(here, 'paper740.css'), encoding='utf-8').read()
if re.findall(r" \.[A-Za-z_]", JS): sys.exit('space before a dot in the JS')
# the code sits with the other fencing code, ahead of renderFencing
t = rep(t, "function renderFencing(){ return holdAssets(renderFencing_held); }", JS + "\nfunction renderFencing(){ return holdAssets(renderFencing_held); }", 'code', p, True)
# the record: sync, load, export, blank, merge, checker, set-aside
t = rep(t, " fenceDockets: {kind: 'list', id: d => d.id, get: () => S.fenceDockets, set: v => S.fenceDockets = v},",
 " fenceDockets: {kind: 'list', id: d => d.id, get: () => S.fenceDockets, set: v => S.fenceDockets = v},\n /* v7.40 - service notes typed on the page (the green book) */\n serviceNotes: {kind: 'list', id: n => n.id, get: () => S.serviceNotes, set: v => S.serviceNotes = v},", 'sync', p, True)
t = rep(t, " fenceDockets: (j && j.fence_dockets) || [],", " fenceDockets: (j && j.fence_dockets) || [], serviceNotes: (j && j.service_notes) || [],", 'load', p, True)
t = rep(t, " fence_dockets: S.fenceDockets || [],\n", " fence_dockets: S.fenceDockets || [],\n service_notes: S.serviceNotes || [],\n", 'export', p, True)
t = rep(t, " supplied:{}, variances:[], fenceDockets:[], docketPapers:{},", " supplied:{}, variances:[], fenceDockets:[], serviceNotes:[], docketPapers:{},", 'blank', p, True)
t = rep(t, " union('fenceDockets', 'dockets');", " union('fenceDockets', 'dockets');\n union('serviceNotes', 'dockets'); /* v7.40 - counted with the dockets */", 'merge', p, True)
t = rep(t, " ['variances', 'fenceDockets', 'breakdowns', 'costs', 'actions'].forEach(f => { A[f] = (A[f] || []).filter(x => x && x.id && !dead(x.id)); B[f] = (B[f] || []).filter(x => x && x.id && !dead(x.id",
 " ['variances', 'fenceDockets', 'serviceNotes', 'breakdowns', 'costs', 'actions'].forEach(f => { A[f] = (A[f] || []).filter(x => x && x.id && !dead(x.id)); B[f] = (B[f] || []).filter(x => x && x.id && !dead(x.id", 'merge dead', p, True)
t = rep(t, "'weeks', 'supplied', 'variances', 'fenceDockets', 'fenceQuote',", "'weeks', 'supplied', 'variances', 'fenceDockets', 'serviceNotes', 'fenceQuote',", 'checker known', p, True)
t = rep(t, " ['added', 'variances', 'fenceDockets', 'breakdowns', 'costs', 'actions'].forEach(k => { if (k in rec && !Array.isArray(rec[k])) bad.push(k + ' is not a list'); count(rec[k], k); });",
 " ['added', 'variances', 'fenceDockets', 'serviceNotes', 'breakdowns', 'costs', 'actions'].forEach(k => { if (k in rec && !Array.isArray(rec[k])) bad.push(k + ' is not a list'); count(rec[k], k); });", 'checker lists', p, True)
t = rep(t, "const ASIDE_COLLS = {costs: 'id', variances: 'id', fenceDockets: 'id', breakdowns: 'id', actions: 'id', added: 'key'};",
 "const ASIDE_COLLS = {costs: 'id', variances: 'id', fenceDockets: 'id', serviceNotes: 'id', breakdowns: 'id', actions: 'id', added: 'key'};", 'aside', p, True)
t = rep(t, "c === 'fenceDockets' ? 'fencing docket'", "c === 'fenceDockets' ? 'fencing docket' : c === 'serviceNotes' ? 'service note'", 'aside words', p, True)
# the green book reads the typed notes beside the committed ones
t = rep(t, """ return Object.assign({}, n, {docket_no: n.note_no, book: 'green', cost, cost_rate: pr.value, cost_rate_source: pr.source});
 }).sort(""", """ return Object.assign({}, n, {docket_no: n.note_no, book: 'green', cost, cost_rate: pr.value, cost_rate_source: pr.source});
 }).concat(typeof localServiceNotes === 'function' ? localServiceNotes() : []).sort(""", 'green rows', p, True)
t = rep(t, " <td>${docketNoLink(n)}<br><span class=\"mono\">${esc(n.id)}</span>${n.usable === false ?",
 " <td>${docketNoLink(n)}<br><span class=\"mono\">${esc(n.id)}</span>${n._where === 'local' ? ' ' + whereChipF('local') : ''}${n.usable === false ?", 'green where', p, True)
t = rep(t, " <td>${docketAttachBtn(n)}</td></tr>`).join('')}\n <tr class=\"total\"><td colspan=\"3\"><b>Green book</b></td>",
 " <td>${n._where === 'local' ? `<button class=\"btn ghost\" data-sndel=\"${esc(n.id)}\">Set aside</button> ` : ''}${docketAttachBtn(n)}</td></tr>`).join('')}\n <tr class=\"total\"><td colspan=\"3\"><b>Green book</b></td>", 'green aside', p, True)
# the Fencing tab: the forms above the green book, and their wiring
t = rep(t, "\n ${greenBookCard()}\n ${blueBookCard()}", "\n ${paperFormsHtml(!canEdit())}\n ${greenBookCard()}\n ${blueBookCard()}", 'forms', p, True)
t = rep(t, " const pane = $('#pane-fencing');\n", " const pane = $('#pane-fencing');\n paperBind(pane); /* v7.40 */\n", 'bind', p, True)
k = t.find('</style>'); t = t[:k] + CSS + t[k:]
open(p, 'w', encoding='utf-8').write(('﻿' if bom else '') + t); print('ok', p)
