"""Author: Andrew Fisher. v10.61 idle and live-refresh smoothness (prototype patch, not released).
Applied in place: python3 patch_v1061_idle.py page.html
 1 fold     - a re-delivered record that leaves S exactly as it is no longer counts as a change (no full redraw, no save)
 2 clock    - the header clock writes only the digits that changed, in place (no element replaced every second)
 3 observe  - the Save-bar observer (v10.12) wakes only when a new field arrives
 4 refresh  - the Save-bar refresh walks the fields it has bars for, not the whole page
 5 fmt      - one clock formatter instead of a new one every second
 6 glow     - a completion ring inside a folded section holds its glow until the section opens
Refuses to run twice (looks for text1061) and refuses a base without v10.60.1 (gc500ShapeLayer1060)."""
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', '..', 'toolchain'))
from rep import rep
src = out = sys.argv[1]
fixes = set((sys.argv[2] if len(sys.argv) > 2 else 'fold,clock,observe,refresh,fmt,glow').split(','))
t = open(src, encoding='utf-8').read()
if 'text1061' in t or 'cur1061' in t: sys.exit('v10.61 idle patch already applied')
if 'gc500ShapeLayer1060' not in t: sys.exit('base is not v10.60.1 or later')
if 'fold' in fixes:
    # 1. syncFold: the quantity-scope cache kept inside S.loads made every re-delivery of `loads` look like a change
    t = rep(t, "if (JSON.stringify(next) === JSON.stringify(c.get()) && (name !== 'qtys' || ScopeSync1017.same(next,S))) return false;",
            "const cur1061 = JSON.stringify(c.get());\n if ((JSON.stringify(next) === cur1061 || (c.wouldBe && JSON.stringify(c.wouldBe(next)) === cur1061)) && (name !== 'qtys' || ScopeSync1017.same(next,S))) return false; /* v10.61 - a delivery that would leave the record exactly as it is changes nothing */",
            'syncFold compare', src)
    t = rep(t, "SYNC_COLLS.loads.set=function(v){return loadsSet0({...without(v),...scopes(S)});};",
            "SYNC_COLLS.loads.set=function(v){return loadsSet0({...without(v),...scopes(S)});};\nSYNC_COLLS.loads.wouldBe=function(v){return {...without(v),...scopes(S)};}; /* v10.61 - what set() would make S.loads, for syncFold */",
            'loads wouldBe', src)
    # the save lines (Saved · shared record updated) read SYNC.last, which a delivery refreshes even when it changes nothing:
    # an unchanged delivery used to reach them through the forced redraw, so refresh them the way a poll does
    t = rep(t, " deliverAll();\nif (SYNC.status !== 'live') { SYNC.status = 'live'; syncFooter(); docsRedraw(); }",
            " deliverAll();\nif (SYNC.status !== 'live') { SYNC.status = 'live'; syncFooter(); docsRedraw(); } else syncFooter(); /* v10.61 - save lines read the record just delivered */",
            'post-delivery footer', src)

if 'clock' in fixes:
    helpers = """/* v10.61 - the clock writes only what changed. The same markup with new digits updates the digits in place, so no
 element is replaced every second and the page's document-wide observers are not woken by the clock. */
function text1061(el, v){ v = String(v); if (el.textContent === v) return; const t = el.firstChild; if (t && t.nodeType === 3 && !t.nextSibling) t.nodeValue = v; else el.textContent = v; }
function shape1061(a, b){ const x = a.childNodes, y = b.childNodes; if (x.length !== y.length) return false;
 for (let i = 0; i < x.length; i++) { const p = x[i], q = y[i]; if (p.nodeType !== q.nodeType) return false;
 if (p.nodeType === 1) { if (p.nodeName !== q.nodeName || p.attributes.length !== q.attributes.length) return false;
 for (const at of q.attributes) if (p.getAttribute(at.name) !== at.value) return false;
 if (!shape1061(p, q)) return false; } else if (p.nodeType !== 3) return false; }
 return true; }
function fill1061(a, b){ const x = a.childNodes, y = b.childNodes; for (let i = 0; i < x.length; i++) { if (x[i].nodeType === 3) { if (x[i].nodeValue !== y[i].nodeValue) x[i].nodeValue = y[i].nodeValue; } else fill1061(x[i], y[i]); } }
function html1061(el, html){ const tpl = html1061.tpl || (html1061.tpl = document.createElement('template')); tpl.innerHTML = html;
 if (shape1061(el, tpl.content)) fill1061(el, tpl.content); else el.innerHTML = html; tpl.innerHTML = ''; }
function attr1061(el, k, v){ if (el.getAttribute(k) !== v) el.setAttribute(k, v); }
function tpodPaint(at){"""
    t = rep(t, "function tpodPaint(at){", helpers, 'clock helpers', src)
    t = rep(t, """ num.innerHTML = (cd && r.d ? `<span class="d">${r.d}<small>d</small></span>` : '')
 + `${esc(r.h)}<span class="sep">:</span>${esc(r.m)}<span class="sep">:</span><span class="sec">${esc(r.s)}</span>`;
 num.setAttribute('aria-label', cd""", """ html1061(num, (cd && r.d ? `<span class="d">${r.d}<small>d</small></span>` : '')
 + `${esc(r.h)}<span class="sep">:</span>${esc(r.m)}<span class="sep">:</span><span class="sec">${esc(r.s)}</span>`);
 attr1061(num, 'aria-label', cd""", 'clock digits', src)
    t = rep(t, """ if (dt) { if (cd) dt.textContent = ''; else { try { dt.textContent = fmtDate(isoIn(new Date(at == null ? Date.now() : at))); } catch (e) { dt.textContent = ''; } } }""",
            """ if (dt) { if (cd) text1061(dt, ''); else { try { text1061(dt, fmtDate(isoIn(new Date(at == null ? Date.now() : at)))); } catch (e) { text1061(dt, ''); } } }""", 'clock date', src)
    t = rep(t, """ if (lab) lab.textContent = cd ? (r.expired ? 'Event date reached' : 'Countdown to the event') : 'Gold Coast · AEST';
 if (src) src.textContent = cd ? 'days · hours · minutes' : 'device clock';
 const sub = $('#tpodSub');
 if (sub) sub.innerHTML = cd""", """ if (lab) text1061(lab, cd ? (r.expired ? 'Event date reached' : 'Countdown to the event') : 'Gold Coast · AEST');
 if (src) text1061(src, cd ? 'days · hours · minutes' : 'device clock');
 const sub = $('#tpodSub');
 if (sub) html1061(sub, cd""", 'clock labels', src)
    t = rep(t, """ return `The day cannot be read from this device's clock — the time above is still ${esc(EVENT_TZ)}.`;
 } })();
 const note = $('#tpodNote');
 if (note) note.textContent = 'This is the clock on this device, read in Brisbane time. It is not a server clock, '
 + 'and it says nothing about the record — the record’s own freshness is the sync state beside it.';""",
            """ return `The day cannot be read from this device's clock — the time above is still ${esc(EVENT_TZ)}.`;
 } })());
 const note = $('#tpodNote');
 if (note) text1061(note, 'This is the clock on this device, read in Brisbane time. It is not a server clock, '
 + 'and it says nothing about the record — the record’s own freshness is the sync state beside it.');""", 'clock note', src)
    t = rep(t, """ el.textContent = [h, m, sec].map(x => String(x).padStart(2, '0')).join(':');
}
/* v10.61 - the clock""", """ text1061(el, [h, m, sec].map(x => String(x).padStart(2, '0')).join(':'));
}
/* v10.61 - the clock""", 'banner countdown', src)

if 'observe' in fixes:
    t = rep(t, "new MutationObserver(records=>{if(records.some(r=>[...r.addedNodes,...r.removedNodes].some(n=>n.nodeType===1&&!n.matches?.('.selection1012-controls,.selection1012-controls *'))))schedule();}).observe(document.body,{subtree:true,childList:true});",
            "/* v10.61 - mount() only acts on fields, so only a new field wakes it: a clock digit or a status line no longer re-reads the whole page */\nnew MutationObserver(records=>{if(records.some(r=>[...r.addedNodes].some(n=>n.nodeType===1&&!n.matches?.('.selection1012-controls,.selection1012-controls *')&&(n.matches(selector)||n.querySelector(selector)))))schedule();}).observe(document.body,{subtree:true,childList:true});",
            'selection observer', src)

if 'refresh' in fixes:
    t = rep(t, "function refresh(){for(const el of document.querySelectorAll(selector)){const f=family(el);if(f)draw(el,f);}}",
            "const live1061=new Set(); /* v10.61 - the fields this script has put a Save bar beside; draw() ignores every other field */\nfunction refresh(){for(const el of [...live1061]){if(!el.isConnected||!mounted.get(el)?.isConnected){live1061.delete(el);continue;}const f=family(el);if(f)draw(el,f);}}",
            'selection refresh', src)
    t = rep(t, "anchor.after(bar);mounted.set(el,bar);owners.set(bar,el);\n  }draw(el,f);",
            "anchor.after(bar);mounted.set(el,bar);owners.set(bar,el);\n  }live1061.add(el);draw(el,f);", 'selection mount set', src)

if 'fmt' in fixes:
    t = rep(t, """function tpodParts(at){
 try {
 const f = new Intl.DateTimeFormat('en-AU', {timeZone: EVENT_TZ, hour: '2-digit', minute: '2-digit',
 second: '2-digit', hourCycle: 'h23'}).formatToParts(at);""", """/* v10.61 - one formatter, made once, instead of one a second */
function tpodParts(at){
 try {
 const f = (tpodParts.fmt || (tpodParts.fmt = new Intl.DateTimeFormat('en-AU', {timeZone: EVENT_TZ, hour: '2-digit', minute: '2-digit',
 second: '2-digit', hourCycle: 'h23'}))).formatToParts(at);""", 'clock formatter', src)

if 'glow' in fixes:
    # the glow sits on the completion ring; the Build tab's rings are mostly inside folded <details> (not drawn),
    # where Chrome still ticks the animation and asks for a frame every vsync
    t = rep(t, "@keyframes complete1008-glow{0%,100%{opacity:.55}50%{opacity:1}}",
            "@keyframes complete1008-glow{0%,100%{opacity:.55}50%{opacity:1}} /* v10.61 - a ring inside a folded section is not on screen: its glow waits there and carries on when the section opens */ details:not([open]) > :not(summary) .complete1008-ring{animation-play-state:paused}",
            'glow folded', src)

open(out, 'w', encoding='utf-8').write(t)
print('v10.61 idle patch applied:', sorted(fixes))
