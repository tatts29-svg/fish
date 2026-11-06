#!/usr/bin/env python3
"""Prototype Build-tab speed fixes on a copy of the live page. Each replacement must match exactly once.
usage: patch_proto.py base.html out.html [F1,F2,...|all]"""
import sys

FIXES = {}

# F1 work986: the daily-works cache key stringified the whole record once PER DAY CARD; once per draw is enough
# (inside a draw the record cannot change; a save inside a draw clears the held memo).
FIXES['F1'] = [(
    "const key=String(ready)+'|'+photoState+'|'+docsAt+'|'+(typeof S==='undefined'?'':JSON.stringify(S));\n  if(cached && key===cachedKey)return cached;",
    "const keyOf=()=>String(ready)+'|'+photoState+'|'+docsAt+'|'+(typeof S==='undefined'?'':JSON.stringify(S));\n  const key=typeof heldMemo==='function'?heldMemo('work986-key1061|'+ready+'|'+photoState+'|'+docsAt,keyOf):keyOf();\n  if(cached && key===cachedKey)return cached;",
), (
    # past984 begin(): the same record string, shared within the draw
    "function begin(){healthRevision=progressHealth985();const key=todayIso()+healthRevision+JSON.stringify(S);",
    "function begin(){healthRevision=progressHealth985();const key=todayIso()+healthRevision+(typeof heldMemo==='function'?heldMemo('S-json1061',()=>JSON.stringify(S)):JSON.stringify(S));",
)]

# F2 EventConfig1013.current(): re-serialised the event dates on every heldMemo/holdAssets call (thousands per draw);
# DATA is static, so inside one draw (same held asset list) the first answer stands.
FIXES['F2'] = [(
    "function makeCurrent(provider,changed=()=>{}){let key,value;return function(){const data=provider(),next=signature(data);if(next!==key){const prior=key;value=read(data);key=next;if(prior!==undefined)changed();}return value;};}",
    "function makeCurrent(provider,changed=()=>{}){let key,value,held1061=null;return function(){const h=typeof ASSETS_HELD!=='undefined'?ASSETS_HELD:null;if(h&&h===held1061&&key!==undefined)return value;const data=provider(),next=signature(data);if(next!==key){const prior=key;value=read(data);key=next;if(prior!==undefined)changed();}held1061=h;return value;};}",
)]

# F3 units925: every reference scanned every load document for its unit metadata; index the scan once per draw.
FIXES['F3'] = [(
    "function model925(a,env){\n const native=sourceUnits925(a,env),docs=metadata925(env.loads).filter(d=>d.ref===a.key),claimed=new Set(),rows=[];",
    "var EMPTY1061={};\nfunction metadataFor925(loads,ref){\n if(typeof ASSETS_HELD==='undefined'||!ASSETS_HELD||typeof heldMemo!=='function')return metadata925(loads).filter(d=>d.ref===ref);\n const idx=heldMemo('metadata925-index1061',()=>new WeakMap()),src=loads&&typeof loads==='object'?loads:EMPTY1061;let byRef=idx.get(src);\n if(!byRef){byRef=new Map();for(const [key,v] of Object.entries(loads||{})){if(key.startsWith(prefix)&&v&&v.kind===kind){const r=v.ref;if(!byRef.has(r))byRef.set(r,[]);byRef.get(r).push([key,v]);}}idx.set(src,byRef);}\n return (byRef.get(ref)||[]).map(([key,v])=>Object.assign({docKey:key},v)).filter(d=>d.ref===ref);\n}\nfunction model925(a,env){\n const native=sourceUnits925(a,env),docs=metadataFor925(env.loads,a.key),claimed=new Set(),rows=[];",
)]

# F4 one time formatter per script instead of a new Intl formatter per call (same options, same text)
FIXES['F4'] = [(
    " const hm = at => { try { const t = new Date(at); return isNaN(t) ? '' : t.toLocaleTimeString('en-AU', {timeZone: 'Australia/Brisbane', hour: '2-digit', minute: '2-digit', hour12: false}); } catch (x) { return ''; } };",
    " let HM1061 = null; const hm = at => { try { const t = new Date(at); if (isNaN(t)) return ''; if (!HM1061) HM1061 = new Intl.DateTimeFormat('en-AU', {timeZone: 'Australia/Brisbane', hour: '2-digit', minute: '2-digit', hour12: false}); return HM1061.format(t); } catch (x) { return ''; } };",
), (
    " const hhmm = at => { try { return new Date(at).toLocaleTimeString('en-AU', {timeZone: 'Australia/Brisbane', hour: '2-digit', minute: '2-digit', hour12: false}); } catch (x) { return ''; } };",
    " let HM1061 = null; const hhmm = at => { try { const t = new Date(at); if (isNaN(t)) return t.toLocaleTimeString('en-AU'); if (!HM1061) HM1061 = new Intl.DateTimeFormat('en-AU', {timeZone: 'Australia/Brisbane', hour: '2-digit', minute: '2-digit', hour12: false}); return HM1061.format(t); } catch (x) { return ''; } };",
)]

# F5 isoIn: the same timestamp text is converted thousands of times per draw; remember the answer per string
FIXES['F5'] = [(
    "function isoIn(when){\n const t = when instanceof Date ? when : new Date(when);\n if (isNaN(t)) return '';\n try {\n if (!ISO_FMT) ISO_FMT = new Intl.DateTimeFormat('en-CA', {timeZone: EVENT_TZ, year: 'numeric', month: '2-digit', day: '2-digit'});\n const s = ISO_FMT.format(t);\n if (/^\\d{4}-\\d{2}-\\d{2}$/.test(s)) return s;",
    "var ISO_MEMO1061;\nfunction isoIn(when){\n if (!ISO_MEMO1061) ISO_MEMO1061 = new Map();\n if (typeof when === 'string') { const m = ISO_MEMO1061.get(when); if (m !== undefined) return m; }\n const t = when instanceof Date ? when : new Date(when);\n if (isNaN(t)) return '';\n try {\n if (!ISO_FMT) ISO_FMT = new Intl.DateTimeFormat('en-CA', {timeZone: EVENT_TZ, year: 'numeric', month: '2-digit', day: '2-digit'});\n const s = ISO_FMT.format(t);\n if (/^\\d{4}-\\d{2}-\\d{2}$/.test(s)) { if (typeof when === 'string' && ISO_MEMO1061.size < 50000) ISO_MEMO1061.set(when, s); return s; }",
)]

# F6 histOf: the de-duplicated, sorted history of a reference, worked out once per draw (copies handed out)
FIXES['F6'] = [(
    "function histOf(key, field){\n const loc = (S.delivery || {})[key], com = (CROW.get(key) || {}).delivery;",
    "function histOf(key, field){ if (typeof ASSETS_HELD !== 'undefined' && ASSETS_HELD && typeof heldMemo === 'function') return heldMemo('histOf1061|' + field + '|' + key, () => histOf0(key, field)).slice(); return histOf0(key, field); }\nfunction histOf0(key, field){\n const loc = (S.delivery || {})[key], com = (CROW.get(key) || {}).delivery;",
), (
    # deliveryAsOf for a past day only reads deliveryOf(key); within one draw it is the same answer
    "function deliveryAsOf(key, asOf){\n const d = deliveryOf(key);\n if (!asOf || asOf >= todayIso()) return d;",
    "function deliveryAsOf(key, asOf){\n if (!asOf || asOf >= todayIso()) return deliveryOf(key);\n const d = typeof ASSETS_HELD !== 'undefined' && ASSETS_HELD && typeof heldMemo === 'function' ? heldMemo('dOf1061|' + key, () => deliveryOf(key)) : deliveryOf(key);",
), (
    # work986 reads three flags off each reference's raw record per day: read it once per draw
    "rawDelivery:key=>typeof deliveryOf==='function'?deliveryOf(key):null",
    "rawDelivery:key=>typeof deliveryOf!=='function'?null:typeof ASSETS_HELD!=='undefined'&&ASSETS_HELD&&typeof heldMemo==='function'?heldMemo('dOf1061|'+key,()=>deliveryOf(key)):deliveryOf(key)",
)]

# F7 the header car picture (a 475 KB data: URL custom property) was copied onto <html> on every Build draw,
# restyling the whole document each time; copy it once - the source rule never changes
FIXES['F7'] = [(
    "try { const hz = getComputedStyle(document.querySelector('header.top')).getPropertyValue('--hzcar'); if (hz) document.documentElement.style.setProperty('--hzcar', hz); } catch (e) {}",
    "try { if (!window.HZCAR1061) { const hz = getComputedStyle(document.querySelector('header.top')).getPropertyValue('--hzcar'); if (hz) { document.documentElement.style.setProperty('--hzcar', hz); window.HZCAR1061 = true; } } } catch (e) {}",
)]

# F8 staff910: every day card rebuilt the whole workforce cost list to read that day's names; once per draw
FIXES['F8'] = [(
    "  function roster(day) { return rosterFromRows(day, ourCosts(), {includes: rosterIncludes858, hours: runHours, worked: runWorked}); }",
    "  function roster(day) { const rows = typeof ASSETS_HELD !== 'undefined' && ASSETS_HELD && typeof heldMemo === 'function' ? heldMemo('roster-costs1061', () => ourCosts()) : ourCosts(); return rosterFromRows(day, rows, {includes: rosterIncludes858, hours: runHours, worked: runWorked}); }",
)]

# F9 quantity-scope1017: each (reference, item, day) rebuilt the set of every labour key in the record to find its own units;
# index the keys by reference once per draw (same keys, same order)
FIXES['F9'] = [(
    "function unitEvidence(ref,discipline,item,labour,stamps){\n const rows={},suffix='|'+discipline+'|'+item+'|install';\n // Native unticking deletes the value but retains its audit stamp.\n const keys=new Set([...Object.keys(labour||{}),...Object.keys(stamps||{}).filter(k=>k.startsWith('labour/')).map(k=>k.slice(7))]);",
    "function unitKeys1061(labour,stamps,ref){\n const all=()=>new Set([...Object.keys(labour||{}),...Object.keys(stamps||{}).filter(k=>k.startsWith('labour/')).map(k=>k.slice(7))]);\n if(typeof ASSETS_HELD==='undefined'||!ASSETS_HELD||typeof heldMemo!=='function'||String(ref).includes('/'))return all();\n const memo=heldMemo('unitKeys1061',()=>({labour:undefined,stamps:undefined,byRef:null}));\n if(!memo.byRef||memo.labour!==labour||memo.stamps!==stamps){const byRef=new Map();for(const k of all()){const i=k.indexOf('/');if(i<0)continue;const r=k.slice(0,i);if(!byRef.has(r))byRef.set(r,[]);byRef.get(r).push(k);}memo.labour=labour;memo.stamps=stamps;memo.byRef=byRef;}\n return memo.byRef.get(String(ref))||[];\n}\nfunction unitEvidence(ref,discipline,item,labour,stamps){\n const rows={},suffix='|'+discipline+'|'+item+'|install';\n // Native unticking deletes the value but retains its audit stamp.\n const keys=unitKeys1061(labour,stamps,ref);",
)]

# F10 arrivalsOn(day): the Build card's work row and its "came in" list each replayed every reference's lights for the
# same day; one replay per day per draw (each caller gets its own copy of the list)
FIXES['F10'] = [(
    "function arrivalsOn(iso){\n const out = [];\n allAssets().forEach(a => {\n const d = deliveryOf(a.key);",
    "function arrivalsOn(iso){ if (typeof ASSETS_HELD !== 'undefined' && ASSETS_HELD && typeof heldMemo === 'function') return heldMemo('arrivalsOn1061|' + iso, () => arrivalsOn0(iso)).slice(); return arrivalsOn0(iso); }\nfunction arrivalsOn0(iso){\n const out = [];\n allAssets().forEach(a => {\n const d = typeof ASSETS_HELD !== 'undefined' && ASSETS_HELD && typeof heldMemo === 'function' ? heldMemo('dOf1061|' + a.key, () => deliveryOf(a.key)) : deliveryOf(a.key);",
)]

# F11 weather1002 reveal(): writing the strip's edge padding variables (8px, the CSS fallback) onto a freshly drawn strip
# restyled all 6,500 elements under it a second time in the same draw; only write a value that changes something
FIXES['F11'] = [(
    " strip.style.setProperty('--wx1002-edge-start',on.classList.contains('today')&&cards[0]===on?edge+'px':'8px');\n strip.style.setProperty('--wx1002-edge-end',on.classList.contains('today')&&cards.at(-1)===on?edge+'px':'8px');",
    " const edge1061=(name,v)=>{const cur=strip.style.getPropertyValue(name);if(cur===v||(!cur&&v==='8px'))return;strip.style.setProperty(name,v);};\n edge1061('--wx1002-edge-start',on.classList.contains('today')&&cards[0]===on?edge+'px':'8px');\n edge1061('--wx1002-edge-end',on.classList.contains('today')&&cards.at(-1)===on?edge+'px':'8px');",
)]

# F12 renderTimeline: the header car picture is read before the pane is redrawn and copied straight after it, so the copy
# lands in the same style pass as the new pane instead of forcing a second whole-page restyle (first Build visit)
FIXES['F12'] = [(
    "function renderTimeline_held(){\n const days = calendarDays();",
    "function renderTimeline_held(){\n let hz1061 = ''; try { if (!window.HZCAR1061) hz1061 = getComputedStyle(document.querySelector('header.top')).getPropertyValue('--hzcar'); } catch (e) {}\n const days = calendarDays();",
), (
    " </div>`;\n const pane = $('#pane-timeline');\n raceMount(pane);",
    " </div>`;\n try { if (hz1061 && !window.HZCAR1061) { document.documentElement.style.setProperty('--hzcar', hz1061); window.HZCAR1061 = true; } } catch (e) {}\n const pane = $('#pane-timeline');\n raceMount(pane);",
)]

# F13 (behaviour: background redraws) a record refresh, a poll or a midnight roll-over redraws the Build tab; it no longer
# snaps the day strip back to the selected day when the person has swiped it elsewhere. Navigation (arriving on the tab,
# Prev / Today / Next, picking a day, filters) still brings the selected day into view exactly as before.
FIXES['F13'] = [(
    '<script id="shapes1060-script">',
    '<script id="strip1061-script">/* Author: Andrew Fisher. A background redraw keeps the day strip where the person left it. */\n'
    '(function(){if(typeof renderTimeline!==\'function\'||typeof timelineChange!==\'function\')return;let nav=0;'
    'const tc=timelineChange;timelineChange=function(){nav++;try{return tc.apply(this,arguments);}finally{nav--;}};'
    'const rt=renderTimeline;renderTimeline=function(){const s0=document.querySelector(\'#pane-timeline .daystrip\');'
    'const keep=!nav&&!(typeof GO_CHANGED!==\'undefined\'&&GO_CHANGED)&&!!s0&&s0.isConnected&&s0.clientWidth>0;'
    'const sl=keep?s0.scrollLeft:0,sel=keep?(s0.querySelector(\'.day.on\')||{}).dataset?.day:null;const r=rt.apply(this,arguments);'
    'if(keep&&sel){const s1=document.querySelector(\'#pane-timeline .daystrip\'),on=s1&&s1.querySelector(\'.day.on\');'
    'if(on&&on.dataset.day===sel&&Math.abs(s1.scrollLeft-sl)>.5)s1.scrollLeft=sl;}return r;};})();\n</script>\n<script id="shapes1060-script">',
)]
# F14 selection-save1012: any element added or removed anywhere (a clock, the footer strip, a card) re-scanned the whole
# document for save-able fields; only an added element that is or holds such a field needs the scan
FIXES['F14'] = [(
    "new MutationObserver(records=>{if(records.some(r=>[...r.addedNodes,...r.removedNodes].some(n=>n.nodeType===1&&!n.matches?.('.selection1012-controls,.selection1012-controls *'))))schedule();}).observe(document.body,{subtree:true,childList:true});",
    "new MutationObserver(records=>{if(records.some(r=>[...r.addedNodes].some(n=>n.nodeType===1&&!n.matches?.('.selection1012-controls,.selection1012-controls *')&&(n.matches?.(selector)||!!n.querySelector?.(selector)))))schedule();}).observe(document.body,{subtree:true,childList:true});",
)]

# F15 Equipment tab: the rows that fill in after the first screen were drawn 6 at a time, each batch in its own hold, so
# every batch rebuilt the building transport model and the asset list (~200 ms a batch, 2 s of stutter on a computer).
# The batches of one fill now share that hold while the record has not changed (a save or a received record ends it).
FIXES['F15'] = [(
    "let ASSETS_HELD = null;\nconst HELD_MEMO = new Map();",
    "let ASSETS_HELD = null;\nconst HELD_MEMO = new Map();\nvar REC_EPOCH1061 = 0; /* v10.61 - moves on every save and every received record */\nfunction holdCarry1061(carry, fn){\n if (ASSETS_HELD) return holdAssets(fn); /* inside another draw: use it and keep nothing */\n const fresh = carry.epoch !== REC_EPOCH1061 || carry.today !== todayIso();\n if (fresh) { const e0 = REC_EPOCH1061; return holdAssets(() => { const r = fn(); if (REC_EPOCH1061 === e0 && !HELD_STALE775) { carry.epoch = e0; carry.today = todayIso(); carry.assets = ASSETS_HELD; carry.memo = new Map(HELD_MEMO); } else carry.epoch = -1; return r; }); }\n if (window.EventConfig1013) window.EventConfig1013.current();\n ASSETS_HELD = carry.assets; HELD_MEMO.clear(); carry.memo.forEach((v, k) => HELD_MEMO.set(k, v)); HELD_STALE775 = false;\n try { const r = fn(); if (carry.epoch === REC_EPOCH1061 && !HELD_STALE775) { carry.assets = ASSETS_HELD; carry.memo = new Map(HELD_MEMO); } else carry.epoch = -1; return r; } finally { ASSETS_HELD = null; HELD_MEMO.clear(); HELD_STALE775 = false; }\n}",
), (
    "function save(){ RENDER_MEMO.clear(); /* v7.80",
    "function save(){ REC_EPOCH1061++; RENDER_MEMO.clear(); /* v7.80",
), (
    "function sharedCache975(){\n RENDER_MEMO.clear();",
    "function sharedCache975(){\n REC_EPOCH1061++;\n RENDER_MEMO.clear();",
), (
    " holdAssets(() => { while (qi < q.length && performance.now() - t0 < 10) if (plantFill(pane, q[qi], qi, 6)) qi++; });",
    " holdCarry1061(carry1061, () => { while (qi < q.length && performance.now() - t0 < 10) if (plantFill(pane, q[qi], qi, 6)) qi++; });",
), (
    " const pane = $('#pane-plant'); let qi = 0;\n const step = () => {",
    " const pane = $('#pane-plant'); let qi = 0; const carry1061 = {};\n const step = () => {",
)]

# F16 Build tab day-close progress: each card's whole-build percentage was worked out in its own hold, rebuilding the
# money, generator and programme models every time; consecutive cards now share them while the record is unchanged
FIXES['F16'] = [(
    "try{const value=holdAssets(()=>progress881Model(iso));if(value?.ready)progress.set(iso,value);return value;}",
    "try{const value=typeof holdCarry1061==='function'?holdCarry1061(PROG_CARRY1061,()=>progress881Model(iso)):holdAssets(()=>progress881Model(iso));if(value?.ready)progress.set(iso,value);return value;}",
), (
    "function jobAtDate(iso){",
    "var PROG_CARRY1061={};\nfunction jobAtDate(iso){",
)]

OPTIONAL = {'F13'}


def main():
    src, out = sys.argv[1], sys.argv[2]
    want = sys.argv[3] if len(sys.argv) > 3 else 'all'
    keys = [k for k in FIXES if k not in OPTIONAL] if want == 'all' else list(FIXES) if want == 'all+' else want.split(',')
    h = open(src, encoding='utf-8').read()
    for k in keys:
        for old, new in FIXES[k]:
            n = h.count(old)
            if n != 1:
                sys.exit(f'{k}: expected 1 match, found {n}: {old[:90]!r}')
            h = h.replace(old, new)
    open(out, 'w', encoding='utf-8').write(h)
    print('applied', ','.join(keys), '->', out)


if __name__ == '__main__':
    main()
