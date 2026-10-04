"""Author: Andrew Fisher. Narrow native Timeline integration, no live record actions."""
from pathlib import Path
import sys
ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT.parent / 'toolchain'))
from rep import rep

def apply(text):
    if 'function timeline841Project(' in text:
        raise ValueError('Timeline v8.41 already present')
    def change(old,new,label):
        nonlocal text
        text=rep(text,old,new,label,'v8.41')
    change('function ldLine(d, g, n, open, timed){',
           (ROOT/'timeline841_src.js').read_text()+'\n\nfunction ldLine(d, g, n, open, timed){', 'Five-stage native record adapter')
    old='const sts = g.rows.map(r => ldState(r.a));'
    change(old,'const sts = g.rows.map(r => timeline841State(r.a));','Timeline projected progress words')
    start=' const refs = g.rows.map((r, i) => `<span class="ld-ref"'
    at=text.index(start)
    end=text.index(".join('');",at)+len(".join('');")
    change(text[at:end]," const refs = g.rows.map(r => timeline841Ref(r)).join('');",'Five visible sharp lamps per reference')
    change("</span></button>` + go751\n + (open ?", "</span></button>` + go751 + timeline841Actions(d,g,n)\n + (open ?", 'Sibling progress and exact-load print controls')
    change('function ldWire(pane){','function ldWire(pane){\n timeline841Mount();','Visible lamp motion lifecycle')
    change('function dpDayButtons(d){return dpDayButtonsBefore821(d)+`', 'function dpDayButtons(d){return timeline841DayButton(d)+dpDayButtonsBefore821(d)+`','Selected-day run sheet action')
    change('function dpPrint(iso, doc, o){','function dpPrint(iso, doc, o){\n const print841=timeline841PrintStart();','New native print request invalidates prior preparation')
    change('function dpFromLink(kind, iso, only){', 'function dpFromLink(kind, iso, only){\n const link841=timeline841PrintStart();', 'Print link preparation owns its generation')
    change(" const start = () => {\n if (kind === 'prestart')", " const start = () => {\n if(!timeline841PrintCurrent(link841))return;\n if (kind === 'prestart')", 'Closed or replaced print link cannot start later')
    change("else if (kind === 'install') dpPrint(iso, 'ins', {link: true, only}); else drvCheck782(iso, only, () => dpPrint(iso, 'drv', {link: true, only}));", "else if (kind === 'install') dpPrint(iso, 'ins', {link: true, only}); else drvCheck782(iso, only, () => {if(timeline841PrintCurrent(link841))dpPrint(iso, 'drv', {link: true, only});});", 'Delayed driver check cannot revive an old print link')
    change(' dpWaitDocs().then(() => {\nconst pages = pick.map', ' dpWaitDocs().then(() => {\n if(!timeline841PrintCurrent(print841))return;\nconst pages = pick.map','Late document hydration cannot prepare stale sheets')
    change("const pick = o && o.only != null && loads[o.only] ? [o.only] : loads.map((g, i) => i); /* v7.06 - one load, or all */", "const pick = timeline841Pick(loads,o) || (o && o.only != null && loads[o.only] ? [o.only] : loads.map((g, i) => i)); /* v8.41: explicit inbound selection */\n if(!pick.length){flash('No inbound loads selected.');return;}", 'Exact validated print selection')
    change("const go = () => { if (!document.getElementById('dayPage')) return; wrap.dataset.dpReady = '1'; try { window.print(); } catch (e) { if (!link) done(); } };", "const go = () => { if (!timeline841PrintCurrent(print841,wrap)||!document.getElementById('dayPage')) return; wrap.dataset.dpReady = '1'; try { timeline841Printed(iso,doc,loads,pick,o,()=>window.print(),()=>timeline841PrintCurrent(print841,wrap)); } catch (e) { if (!link) done(); } };", 'Transit only after a successful current print request')
    change("const linkReady = r => { wrap.dataset.dpReady = '1';", "const linkReady = r => { if(!timeline841PrintCurrent(print841,wrap))return;wrap.dataset.dpReady = '1';", 'Stale direct-link preparation cannot print')
    change(" try { window.print(); } catch (e) {} };\nconst finish = r =>", " wrap.__timeline841print=()=>timeline841Printed(iso,doc,loads,pick,o,()=>window.print(),()=>timeline841PrintCurrent(print841,wrap));\n try { wrap.__timeline841print(); } catch (e) {} };\nconst finish = r =>", 'Native driver print links use the same scoped transition')
    change("const finish = r => { if (settled) return; settled = true; window.__dpLast = r;", "const finish = r => { if (settled||!timeline841PrintCurrent(print841,wrap)) return; settled = true; window.__dpLast = r;", 'Stale image preparation cannot finish or publish PDF')
    change(".then(() => imgs())\n.then(() => { wrap.querySelectorAll('.dp-img img')", ".then(() => timeline841PrintCurrent(print841,wrap)?imgs():[])\n.then(() => { if(!timeline841PrintCurrent(print841,wrap))return;wrap.querySelectorAll('.dp-img img')", 'Stale image settling cannot alter another wrapper')
    change(".then(() => imgs())\n.then(() => ({failed: wrap.querySelectorAll", ".then(() => timeline841PrintCurrent(print841,wrap)?imgs():[])\n.then(() => ({failed: wrap.querySelectorAll", 'Stale second image pass is skipped')
    change("setTimeout(() => { if (!settled) { settled = true; if (pdf)", "setTimeout(() => { if (!settled&&timeline841PrintCurrent(print841,wrap)) { settled = true; if (pdf)", 'Stale timeout cannot print or mark old refs')
    change("bar.querySelector('[data-dpbar-print]').onclick = () => window.print(); /* v7.06 - the preview is already what prints */", "bar.querySelector('[data-dpbar-print]').onclick = () => {const w=document.getElementById('dayprint');if(kind==='drivers'&&w&&w.__timeline841print)w.__timeline841print();else window.print();}; /* v8.41 - same rendered sheet scope */", 'Native print bar retries preserve selected refs')
    change("wrap.innerHTML = pages.join(''); wrap.classList.remove('ps7wrap');", "wrap.__timeline841print=null;wrap.dataset.timeline841Print=String(print841); wrap.innerHTML = pages.join(''); wrap.classList.remove('ps7wrap');", 'Rendered wrapper belongs to exact request')
    change('function dpBarClose(){','function dpBarClose(){\n timeline841PrintStart();','Closing preview invalidates async preparation')
    change("const w = document.getElementById('dayprint'); if (w) w.classList.remove('dpwrap', 'ps7wrap');", "const w = document.getElementById('dayprint'); if (w) {w.__timeline841print=null;w.classList.remove('dpwrap', 'ps7wrap');}", 'Closing preview clears selected print scope')
    change('function ps7Print(iso, o){', "function ps7Print(iso, o){\n timeline841PrintStart();", 'Prestart preview cannot retain a driver print transition')
    change(" const done = () => { st.remove(); wrap.classList.remove('dpwrap'); document.body.classList.remove('printing-day', 'pdf7-make'); };", " const done = () => { st.remove(); if(!timeline841PrintCurrent(print841,wrap))return;wrap.classList.remove('dpwrap'); document.body.classList.remove('printing-day', 'pdf7-make'); };", 'Old afterprint callback cannot dismiss new sheets')
    change("d.state = state; d.set_at = now; d.by = who;\n d.history", "d.state = state; d.set_at = now; d.by = who;\n timeline841Invalidate(key,state,who);\n d.history",'Native movement resets placement/install proof')
    change("&& typeof d.levelled !== 'boolean' && typeof d.steps !== 'boolean' && typeof d.emptied !== 'boolean' && !d.date_off_at && !d.out_off_at;", "&& typeof d.levelled !== 'boolean' && typeof d.steps !== 'boolean' && typeof d.emptied !== 'boolean' && !d.date_off_at && !d.out_off_at && !d.timeline841;",'Keep proof and reset tombstones')
    change(" if (d.done || d.levelled || d.steps) has.push('ticks');", " if (d.done || d.levelled || d.steps) has.push('ticks');\n if (timeline841Proof(key)) has.push('delivery progress history');",'Do not overwrite progress-only move targets')
    change(" if (!deliveryEmpty(m)) out.delivery[k] = m;", " const progress841=timeline841MergeProof(a.timeline841,b.timeline841); if(progress841)m.timeline841=progress841;\n if (!deliveryEmpty(m)) out.delivery[k] = m;",'Preserve stamped progress through initial sync and imports')
    change(" if (d.steps != null && typeof d.steps !== 'boolean') bad.push('delivery ' + k + ' steps is not true or false');", " if (d.steps != null && typeof d.steps !== 'boolean') bad.push('delivery ' + k + ' steps is not true or false');\n if (d.timeline841 != null && !timeline841MergeProof(d.timeline841,null)) bad.push('delivery ' + k + ' progress proof is invalid');",'Validate optional progress proof on imports')
    change('</head>\n<body>','<style id="timeline-v841">\n'+(ROOT/'timeline841_src.css').read_text()+'\n</style>\n</head>\n<body>','Scoped Timeline clarity and vector lights')
    return text
