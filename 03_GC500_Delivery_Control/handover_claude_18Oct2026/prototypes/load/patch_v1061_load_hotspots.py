"""Prototype load-time fixes on the live v10.60.1 page (scratch only; repo untouched).
usage: python3 patch_proto.py base.html out.html FIXES   (FIXES = comma list of: hold,nights,meta,sig,names,reveal,photo,capture | all)
Every replacement must match exactly once (toolchain rep())."""
import os, sys
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', '..', 'toolchain'))
from rep import rep
src, dst, fixes = sys.argv[1], sys.argv[2], sys.argv[3]
F = set('hold,nights,meta,sig,names,reveal,photo,capture,docs,hist,landing,unitev'.split(',')) if fixes == 'all' else set(fixes.split(','))
t = open(src, encoding='utf-8').read()
if 'load1061' in t: sys.exit('already patched (load1061 present)')
if 'id="shapes1060-script"' not in t or "' · v10.60.1'" not in t: sys.exit('wrong base: expected live v10.60.1 (shapes1060-script and the v10.60.1 footer)')

# 1. v10.26 milestone retry: unseenNow() read every area's facts OUTSIDE a hold, so assetOf() rebuilt the whole asset
#    list once per reference (phone x4: 8.9 s; desktop 1.5 s). Same read the render does, inside one hold.
if 'hold' in F:
    t = rep(t, "function unseenNow(){ if (!W.MS1025 || !boardIsToday()) return []; const s = MS1025.seen(); return MS1025.allFacts().filter(",
              "function unseenNow(){ if (!W.MS1025 || !boardIsToday()) return []; const s = MS1025.seen(); /* load1061: one asset list for the whole read */ return (typeof holdAssets === 'function' ? holdAssets(() => MS1025.allFacts()) : MS1025.allFacts()).filter(",
              'unseenNow hold', src)

# 2. v10.40 nights: nightService1040() is called once per asset and each call built three dates with two
#    toLocaleDateString() calls each (a new Intl formatter every time). Same strings, built once per event-day list.
if 'nights' in F:
    t = rep(t, """function nights1040(){
 let days = null; try { const C = window.EventConfig1013 && EventConfig1013.current ? EventConfig1013.current() : null; days = C && Array.isArray(C.eventDays) && C.eventDays.length ? C.eventDays.slice(0, 3) : null; } catch (e) {}
 days = days || ['2026-10-23', '2026-10-24', '2026-10-25'];
 return days.map(d => {""",
"""const NIGHTS1061 = new Map(); /* load1061: the labels for one event-day list, built once; callers get their own copies */
function nights1040(){
 let days = null; try { const C = window.EventConfig1013 && EventConfig1013.current ? EventConfig1013.current() : null; days = C && Array.isArray(C.eventDays) && C.eventDays.length ? C.eventDays.slice(0, 3) : null; } catch (e) {}
 days = days || ['2026-10-23', '2026-10-24', '2026-10-25'];
 const k1061 = days.join('|'); if (!NIGHTS1061.has(k1061)) NIGHTS1061.set(k1061, nights1040make(days));
 return NIGHTS1061.get(k1061).map(x => Object.assign({}, x));
}
function nights1040make(days){
 return days.map(d => {""", 'nights1040 memo', src)

# 3. v9.25 units: model925() scanned every shared load document (Object.entries(S.loads)) once per asset to find that
#    asset's unit records. Inside a render hold, index them by reference once (HELD_MEMO is cleared by saves/hydration).
if 'meta' in F:
    t = rep(t, "function metadata925(loads){return Object.entries(loads||{}).filter(([k,v])=>k.startsWith(prefix)&&v&&v.kind===kind).map(([key,v])=>Object.assign({docKey:key},v));}",
              "function metadata925(loads){return Object.entries(loads||{}).filter(([k,v])=>k.startsWith(prefix)&&v&&v.kind===kind).map(([key,v])=>Object.assign({docKey:key},v));}\n"
              "/* load1061: the same documents, in the same order, for one reference; indexed once per render hold */\n"
              "function metadataRef1061(loads,ref){if(!ASSETS_HELD||!loads||typeof loads!=='object'||typeof heldMemo!=='function')return metadata925(loads).filter(d=>d.ref===ref);"
              "const memo=heldMemo('metadataRef1061',()=>new WeakMap());let by=memo.get(loads);"
              "if(!by){by=new Map();for(const [key,v] of Object.entries(loads))if(key.startsWith(prefix)&&v&&v.kind===kind){const d=Object.assign({docKey:key},v),L=by.get(d.ref);if(L)L.push([key,v]);else by.set(d.ref,[[key,v]]);}memo.set(loads,by);}"
              "return (by.get(ref)||[]).map(([key,v])=>Object.assign({docKey:key},v));}",
              'metadata925 index', src)
    t = rep(t, "const native=sourceUnits925(a,env),docs=metadata925(env.loads).filter(d=>d.ref===a.key),claimed=new Set(),rows=[];",
              "const native=sourceUnits925(a,env),docs=metadataRef1061(env.loads,a.key),claimed=new Set(),rows=[];",
              'model925 docs', src)

# 4. v10.13 event config: EventConfig1013.current() JSON-stringified the event weeks on EVERY heldMemo()/holdAssets()
#    call. Nothing writes DATA's event dates while a draw runs, so sign once per task (re-signed at the next task).
if 'sig' in F:
    t = rep(t, " const current=makeCurrent(()=>typeof DATA==='undefined'?{}:DATA,",
              " const perTask1061=f=>{let fresh=false,value;return function(){if(fresh)return value;value=f();fresh=true;queueMicrotask(()=>{fresh=false;});return value;};}; /* load1061 */\n"
              " const current=perTask1061(makeCurrent(()=>typeof DATA==='undefined'?{}:DATA,",
              'EventConfig current per task (open)', src)
    t = rep(t, "try{if(typeof HELD_MEMO!=='undefined')HELD_MEMO.clear();}catch(e){}});",
              "try{if(typeof HELD_MEMO!=='undefined')HELD_MEMO.clear();}catch(e){}}));",
              'EventConfig current per task (close)', src)

# 5. v10.44 names: the first pass tested document.body.textContent - which includes every inline script (about 18 MB of
#    text) - before walking. Walk the text nodes directly (scripts/styles are rejected as before).
if 'names' in F:
    t = rep(t, " const start = () => { if (!D.body || W.__names1044) return; W.__names1044 = true; cleanEl(D.body);",
              " const cleanAll1061 = el => { const w = D.createTreeWalker(el, NodeFilter.SHOW_TEXT, {acceptNode: n => { const p = n.parentNode && n.parentNode.tagName; return p === 'SCRIPT' || p === 'STYLE' || p === 'TEXTAREA' ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT; }}); let n; while ((n = w.nextNode())) cleanText(n);\n"
              "  if (el.hasAttribute && el.hasAttribute('title') && RX.test(el.getAttribute('title'))) el.setAttribute('title', fix(el.getAttribute('title')));\n"
              "  el.querySelectorAll('[title]').forEach(x => { const v = x.getAttribute('title'); if (RX.test(v)) x.setAttribute('title', fix(v)); }); }; /* load1061 */\n"
              " const start = () => { if (!D.body || W.__names1044) return; W.__names1044 = true; cleanAll1061(D.body);",
              'names first pass', src)

# 6. v9.04 first draw: when the whole shared record was already in before DOMContentLoaded, route() has just drawn it;
#    reveal that draw instead of queueing a second identical full render behind the loading panel. A redraw that
#    syncFirst queued before route() is for data route() has just drawn, so it is cancelled (update() replaced it too).
if 'reveal' in F:
    t = rep(t, "if (document.readyState === 'loading')document.addEventListener('DOMContentLoaded', () => { WeatherStrip1002.resetRefresh(); route(); Refresh904.update(); }, {once: true});",
              "if (document.readyState === 'loading')document.addEventListener('DOMContentLoaded', () => { WeatherStrip1002.resetRefresh(); const had1061 = Refresh904.report().complete; route(); if (had1061 && Refresh904.report().complete) { clearTimeout(SYNC.rtimer); Refresh904.drawn(); syncFooter(); } else Refresh904.update(); }, {once: true}); /* load1061 */",
              'reveal routed draw', src)

# 7. registry settle: while the loading panel hides every pane and the first-record draw is already queued, that draw
#    renders with the settled registry - skip the extra full render (and its pane capture) here.
if 'photo' in F:
    t = rep(t, """function photoRedraw(){
 try {
 if (state.tab && state.tab !== 'docs') render();""", """/* load1061: a registry settle needs no draw of its own (a) before DOMContentLoaded - route() draws the page then, with
   this registry - or (b) behind the loading panel when the first-record draw is already queued: that draw renders it. */
function photoWait1061(){ if (document.readyState === 'loading') return true;
 try { const r = window.GC500Refresh904 && GC500Refresh904.report ? GC500Refresh904.report() : null; return !!(r && r.hosted && !r.settled && r.drawing && r.state === 'loading'); } catch (e) { return false; } }
function photoRedraw(){
 try {
 if (photoWait1061()) return;
 if (state.tab && state.tab !== 'docs') render();""", 'photoRedraw wait', src)

# 8. v10.10 persistence: capture() read scrollTop/scrollLeft of every element in the pane. A pane with no layout box
#    (display:none behind the loading panel, or detached) has no scroll offsets anywhere inside it.
if 'capture' in F:
    t = rep(t, " for(const el of [scope,...scope.querySelectorAll('*')])if(el.scrollTop||el.scrollLeft)held.scroll.push({el,key:key(el,scope),top:el.scrollTop,left:el.scrollLeft});",
              " if(scope.getClientRects().length||getComputedStyle(scope).display==='contents')for(const el of [scope,...scope.querySelectorAll('*')])if(el.scrollTop||el.scrollLeft)held.scroll.push({el,key:key(el,scope),top:el.scrollTop,left:el.scrollLeft}); /* load1061 */",
              'capture hidden scope', src)

# 9. registry request at boot: the photo/document registry was first asked for from inside the first full render, so on a
#    phone it settled after the page was shown and forced a second full render. Ask for it when the service connects
#    (the same single GET /api/files); a settle before DOMContentLoaded is drawn by route() (fix 7).
if 'docs' in F:
    t = rep(t, " if (rest) { SYNC.backend = rest; syncStart(rest); rest.start(); docsRedraw(); return; }",
              " if (rest) { SYNC.backend = rest; syncStart(rest); rest.start(); docsRedraw(); try { docsRefresh(false); } catch (e) {} /* load1061 */ return; }",
              'docs at boot', src)
# 10. v7.x as-of history: histOf() de-duplicated a reference's history by JSON-stringifying every entry with sorted keys,
#     on every call (deliveryOf, deliveryAsOf, facts...). Inside a render hold, do it once per reference and field and
#     hand each caller its own array (the entries are the record's own objects, exactly as before).
if 'hist' in F:
    t = rep(t, "function histOf(key, field){\n const loc = (S.delivery || {})[key], com = (CROW.get(key) || {}).delivery;",
              "function histOf(key, field){ return typeof heldMemo === 'function' && ASSETS_HELD ? heldMemo('histOf1061|' + field + '|' + key, () => histOf_(key, field)).slice() : histOf_(key, field); } /* load1061 */\n"
              "function histOf_(key, field){\n const loc = (S.delivery || {})[key], com = (CROW.get(key) || {}).delivery;",
              'histOf held', src)
# 11. landing tab: when the first pull and the map key both arrive before DOMContentLoaded, this callback drew the Map
#     pane (no pane carries `hidden` before route() runs): a full hidden Map/Explorer render whose setHash put
#     #sheet/__explorer in the address, so route() then opened the Map explorer instead of Today. route() draws the
#     right tab, with the key, at DOMContentLoaded.
if 'landing' in F:
    t = rep(t, "liveMapKeyFromService().then(() => { const ab = $('#pane-about'), mp = $('#pane-map'); if (ab && !ab.hidden) renderAbout(); if (mp && !mp.hidden) renderMap(); }).catch(() => {});",
              "liveMapKeyFromService().then(() => { if (document.readyState === 'loading') return; /* load1061: route() draws it */ const ab = $('#pane-about'), mp = $('#pane-map'); if (ab && !ab.hidden) renderAbout(); if (mp && !mp.hidden) renderMap(); }).catch(() => {});",
              'map key before route', src)
    t = rep(t, "if (typing) { SYNC.rtimer = setTimeout(syncRedraw, 1500); return; }\ntry { window.Idle1006.redraw(); } catch (e) {}",
              "if (typing) { SYNC.rtimer = setTimeout(syncRedraw, 1500); return; }\nif (document.readyState !== 'loading') try { window.Idle1006.redraw(); } catch (e) {} /* load1061: before DOMContentLoaded route() draws the page */",
              'redraw before route', src)
# 12. v10.17 quantity scope: unitEvidence() rebuilt a Set of every labour key and every labour stamp, then scanned it,
#     once per (reference, item). Inside a render hold, group the same keys (same order) by each '<ref>/u' prefix once.
if 'unitev' in F:
    t = rep(t, """function unitEvidence(ref,discipline,item,labour,stamps){
 const rows={},suffix='|'+discipline+'|'+item+'|install';
 // Native unticking deletes the value but retains its audit stamp.
 const keys=new Set([...Object.keys(labour||{}),...Object.keys(stamps||{}).filter(k=>k.startsWith('labour/')).map(k=>k.slice(7))]);
 for(const k of keys)if(k.startsWith(ref+'/u')&&k.endsWith(suffix)&&k!==ref+'/urest'+suffix)rows[k]={on:!!labour?.[k],at:stamps?.['labour/'+k]||''};
 return rows;
}""", """function unitKeys1061(labour,stamps){const keys=new Set([...Object.keys(labour||{}),...Object.keys(stamps||{}).filter(k=>k.startsWith('labour/')).map(k=>k.slice(7))]),by=new Map();
 for(const k of keys){for(let i=k.indexOf('/u');i>=0;i=k.indexOf('/u',i+1)){const p=k.slice(0,i);let L=by.get(p);if(!L)by.set(p,L=[]);L.push(k);}}return by;} /* load1061 */
function unitEvidence(ref,discipline,item,labour,stamps){
 const rows={},suffix='|'+discipline+'|'+item+'|install';
 if(typeof ASSETS_HELD!=='undefined'&&ASSETS_HELD&&typeof heldMemo==='function'){ /* load1061: the same keys, grouped once per render hold */
  const m=heldMemo('unitKeys1061',()=>({}));if(m.labour!==labour||m.stamps!==stamps||!m.by){m.labour=labour;m.stamps=stamps;m.by=unitKeys1061(labour,stamps);}
  for(const k of m.by.get(ref)||[])if(k.endsWith(suffix)&&k!==ref+'/urest'+suffix)rows[k]={on:!!labour?.[k],at:stamps?.['labour/'+k]||''};
  return rows;
 }
 // Native unticking deletes the value but retains its audit stamp.
 const keys=new Set([...Object.keys(labour||{}),...Object.keys(stamps||{}).filter(k=>k.startsWith('labour/')).map(k=>k.slice(7))]);
 for(const k of keys)if(k.startsWith(ref+'/u')&&k.endsWith(suffix)&&k!==ref+'/urest'+suffix)rows[k]={on:!!labour?.[k],at:stamps?.['labour/'+k]||''};
 return rows;
}""", 'unitEvidence index', src)
t = t.replace('<html', '<html data-load1061="' + ','.join(sorted(F)) + '"', 1) if False else t
open(dst, 'w', encoding='utf-8').write(t)
print('wrote', dst, sorted(F))
