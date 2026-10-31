#!/usr/bin/env python3
"""Author: Andrew Fisher. Exact existing explorer detail enhancement; no registrations."""
from pathlib import Path
import argparse
import hashlib
from fencing_trace837 import ROOT, exact, require

EXPECTED = {
    'fencing-map-explorer.js': '72058f977770652fe3d003dc52965a52cf02fde2aedb5c71d39031527ddb2d18',
    'fencing-map.css': '58a1d5f2d8c0b5b2917c0998a1a4cffcfcf79972d5fb187fa63282c5f26fdf3d',
    'index.html': '3e87cefe7c210070acf6543456f86ecd0770010cab6475831b39ebfd155eaa22',
}


def build(base):
    raw = {name: (base / name).read_bytes() for name in EXPECTED}
    require(all(hashlib.sha256(raw[n]).hexdigest() == h for n, h in EXPECTED.items()), 'Expected exact registered explorer predecessor assets')
    js = raw['fencing-map-explorer.js'].decode()
    old_areas = """function areaMarkers(){
 if(!model||!model.masterValid||!$('fmSourceLines').checked||filters.status!=='all'&&filters.status!=='area'||filters.day||filters.types.length)return[];
 return model.geometry.filter(g=>g.role==='area-signoff'&&(filters.source==='all'||g.source_sha256===(source()||{}).sha256)).map(g=>({...g,areaRecords:(snapshot.areaEvidence||[]).filter(a=>a.done&&(g.area_evidence_names||[]).some(n=>C.key(n)===C.key(a.name)))})).filter(g=>g.areaRecords.length&&(!filters.query||C.key(g.label).includes(C.key(filters.query))));
}"""
    new_areas = """function areaMarkers(){
 if(!model||!model.masterValid||!$('fmSourceLines').checked||filters.status!=='all'&&filters.status!=='area'||filters.day||filters.types.length)return[];
 const trace=snapshot.trace||{},used=new Set((trace.rows||[]).filter(r=>r.state==='current').flatMap(r=>r.area_ids)),reviewed=new Set((trace.areas||[]).filter(a=>a.state==='current'&&used.has(a.id)).map(a=>a.geometry_id));
 return model.geometry.filter(g=>g.role==='area-signoff'&&(filters.source==='all'||g.source_sha256===(source()||{}).sha256)).map(g=>({...g,traceRecorded:reviewed.has(g.id),areaRecords:(snapshot.areaEvidence||[]).filter(a=>a.done&&(g.area_evidence_names||[]).some(n=>C.key(n)===C.key(a.name)))})).filter(g=>(g.areaRecords.length||filters.status==='all'&&g.traceRecorded)&&(!filters.query||C.key(g.label).includes(C.key(filters.query))));
}"""
    reveal = """function revealTraceTarget837(id){
 if(!model||!model.rows.some(r=>r.id===id)&&!model.geometry.some(g=>g.id===id))return false;
 filters={source:'all',day:'',status:'all',query:'',types:[]};$('fmSource').value='all';$('fmStatus').value='all';$('fmQuery').value='';$('fmSourceLines').checked=true;panel.querySelectorAll('[data-fmtype]').forEach(b=>b.setAttribute('aria-pressed','true'));updateDays();choose(id,true);adapter.panel(true);return true;
}
"""
    changes = [
        (old_areas, new_areas, 'Trace pins remain distinct from completion'),
        ('<span class="fm-area">Area sign-off</span>', '<span class="fm-area">Area sign-off</span><span class="fm-recorded-work">Recorded work</span>', 'Existing legend distinguishes recorded work'),
        ('  renderDetails();adapter.requestPaint();', "  $('fmList').insertAdjacentHTML('beforeend',window.GC500FencingTraceView837.areas(snapshot.trace,filters.query)+window.GC500FencingTraceView837.unmapped(snapshot.trace));\n  renderDetails();adapter.requestPaint();", 'Unmapped records in existing work list'),
        (" box.querySelector('[data-fmzoom]')?.addEventListener", " box.insertAdjacentHTML('beforeend',window.GC500FencingTraceView837.details(window.GC500FencingTrace837.selection(snapshot.trace,geoms.map(g=>g.id))));\n box.querySelectorAll('[data-fmtrace-record]').forEach(b=>b.onclick=()=>{if(parentCall('gc500FencingTraceDocket837',b.dataset.fmtraceRecord)!==true)adapter.toast('This record is unavailable. Reopen the fencing register to check it.');});\n box.querySelector('[data-fmzoom]')?.addEventListener", 'Current record detail in existing panel'),
        ("g.role==='area-signoff'||complete?'#40db9a':g.role==='coverage'", "g.role==='area-signoff'?(g.areaRecords&&g.areaRecords.length?'#40db9a':'#ffad64'):complete?'#40db9a':g.role==='coverage'", 'Amber unconfirmed work marker'),
        ("g.role==='area-signoff'?'Area ✓':'p'+g.source_page", "g.role==='area-signoff'?(g.areaRecords&&g.areaRecords.length?'Area ✓':'Recorded work'):'p'+g.source_page", 'No completion inferred from trace'),
        ('function setActive(on,id){', reveal + 'function setActive(on,id){', 'Reveal exact reverse-navigation target'),
        ('if(on===active){if(on){refresh(true);if(id)choose(id,true);}return;}', 'if(on===active){if(on){refresh(true);if(id)revealTraceTarget837(id);}return;}', 'Clear incompatible filters on active reverse navigation'),
        ('if(id&&model)choose(id,true);schedule();', 'if(id&&model)revealTraceTarget837(id);schedule();', 'Clear incompatible filters on initial reverse navigation'),
        ("$('fmList').onclick=ev=>{const b=", "$('fmList').onclick=ev=>{const area=ev.target.closest('[data-fmtrace-area]');if(area){if(!revealTraceTarget837(area.dataset.fmtraceArea))adapter.toast('This area is unavailable. Reopen the map to check it.');return;}const trace=ev.target.closest('[data-fmtrace-record]');if(trace){if(parentCall('gc500FencingTraceDocket837',trace.dataset.fmtraceRecord)!==true)adapter.toast('This record is unavailable. Reopen the fencing register to check it.');return;}const b=", 'Unmapped row opens existing register'),
    ]
    for old, new, label in changes:
        js = exact(js, old, new, label)
    js = (ROOT / 'source/fencing-trace-core837.js').read_text() + '\n' + (ROOT / 'source/fencing-trace-view837.js').read_text() + '\n' + js
    css = raw['fencing-map.css'].decode() + '\n' + (ROOT / 'source/fencing-trace837.css').read_text()
    html = raw['index.html'].decode()
    for name, value in [('fencing-map-explorer.js', js), ('fencing-map.css', css)]:
        html = exact(html, name + '?v=' + EXPECTED[name][:12], name + '?v=' + hashlib.sha256(value.encode()).hexdigest()[:12], 'Content-addressed ' + name)
    return {'fencing-map-explorer.js': js.encode(), 'fencing-map.css': css.encode(), 'index.html': html.encode()}


if __name__ == '__main__':
    parser = argparse.ArgumentParser(); parser.add_argument('--base-dir', type=Path, required=True); parser.add_argument('--output', type=Path, required=True); args = parser.parse_args()
    require(args.base_dir.resolve() != args.output.resolve(), 'Keep registered predecessor assets intact')
    output = build(args.base_dir)
    args.output.mkdir(parents=True, exist_ok=True)
    for name, raw in output.items():
        (args.output / name).write_bytes(raw)
    print('Three existing explorer assets prepared; no publication or registration performed.')
