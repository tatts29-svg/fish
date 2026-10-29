"""Author: Andrew Fisher. v12.61 - the water barriers where the K sheets put them, and three of the evening's asks.

Built on the live v12.56 (requires its footer and the v12.56 map module; refuses to apply twice). No money moves.

 1. Water barriers (Andrew, 30 Oct 2026 01:50: "Your water barriers look all wrong. All locations look all wrong.
    Nothing matches correctly."): every WB reference's position comes from the customer's water barrier drawings
    K220-K231 (wfb1261.json, read by tools/zone_runs.py and tools/make_wfb1261.py): the one destination (dest782) for
    a WB key is the drawn run, so Navigate, the Build cards' map strip, the Demob cards' pictures and Find it on the map
    all point there; the master plan's own point for the Demob plan piece sits on the run; the explorer's barrier
    shapes are rebuilt from the runs (tools/shapes_wb1261.py); four reference names follow the programme (WB01, WB05,
    WB13, WB16); the programme object carries the 29/10/26 updates (WB19 3-6 Nov; WB01, WB07, WB22 removal notes).
 2. Build day cards (Andrew, 01:38: "We cant have last day showing this"): the last build day, Thu 22 Oct, carries
    the whole build to the race-weekend cut-off (Fri 23 Oct 2026, v11.63) - 100%, the day completed - with the reason
    in More info. Every other day card reads as before.
 3. Map explorer (Andrew, 02:01: "The left site icons are really bad... The icon is always the shape of the
    description... a clear departed pulsation or glow... and qty departed"): a departed reference's mark carries the
    equipment's own symbol (the page's map symbols, v11.47), a green pulsing ring (dashed where only part has gone,
    red where it needs review) and a badge with how many have gone (n, or n/total for a part). Always on; the v12.56
    switch comes off and the key says what the marks mean.
 4. Build cards (Andrew, 29 Oct: "In build can we show 3 maps 1 to include the drawing location"): the map strip
    shows three pictures - close up, wider area and the master plan drawing with the equipment's icon on the spot.
"""
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT.parent / 'toolchain'))
sys.path.insert(0, str(ROOT / 'tools'))
from rep import rep
from shapes_wb1261 import shape_entry

FOOT_A = "+' · v12.56'; /* v8.19 release922"
FOOT_B = "+' · v12.61'; /* v8.19 release922"

NAMES = [  # (old register name, new name per the programme TP02-26003-03)
    ('Gold Coast Highway (Near PB3 DR - On GCHWY at the Tedder Avenue intersection)', 'Gold Coast Highway (Northbound) - PB3 Footing/Stairs', 'WB01'),
    ('Gold Coast Highway (Main Beach Light Rail)', 'Main Beach Light Rail - Bus Stop', 'WB05'),
    ('Fence bracing behind S15', 'Fence bracing behind S15 + Ped Crossing', 'WB13'),
    ('Commodore Park (Commodore Drive)', 'Gate 2 - HVM', 'WB16'),
]

REPLACEMENTS = [
    # --- 2. the last build day carries the build to the race-weekend cut-off (past984) ---
    ('last build day: read the cut-off', 1,
     "const p=read(day.iso),valid=p?.ready&&",
     "const cut1261=(typeof LAST_BUILD_DAY1261==='object'&&LAST_BUILD_DAY1261&&day.iso===LAST_BUILD_DAY1261.day&&LAST_BUILD_DAY1261.cutoff<today)?LAST_BUILD_DAY1261.cutoff:null; /* v12.61: the last build day carries the whole build to the race-weekend cut-off (Andrew, 30 Oct 2026: \"We cant have last day showing this\") */\n const p=read(cut1261||day.iso),valid=p?.ready&&"),
    ('last build day: flag on the unready reading', 1,
     "if(!valid)return {past:true,percent:null,pending:!!p?.pending,complete:false,text:'—',bound:false};",
     "if(!valid)return {past:true,percent:null,pending:!!p?.pending,complete:false,text:'—',bound:false,cutoff:!!cut1261};"),
    ('last build day: flag on the reading', 1,
     "return {past:true,percent,bound,text:ProgressPercent1012.text(percent,bound),complete:!!p.allGreen&&!p.provisional&&p.pct.min===100&&p.pct.max===100};",
     "return {past:true,percent,bound,text:ProgressPercent1012.text(percent,bound),complete:!!p.allGreen&&!p.provisional&&p.pct.min===100&&p.pct.max===100,cutoff:!!cut1261};"),
    ('last build day: the cut-off day is computed when the strip has not', 1,
     "p=model(day,today,iso=>progress.get(iso)||{ready:false,pending:todayWorkHealth840().ready})",
     "p=model(day,today,iso=>progress.get(iso)||(typeof jobAtDate==='function'?jobAtDate(iso):null)||{ready:false,pending:todayWorkHealth840().ready})"),
    ('last build day: the label', 1,
     "phaseLine=isToday?'TODAY':p.past?'AT DAY’S CLOSE':'UPCOMING'",
     "phaseLine=isToday?'TODAY':p.past?(p.cutoff?'TO THE RACE WEEKEND':'AT DAY’S CLOSE'):'UPCOMING'"),
    ('last build day: the spoken sentence', 2,
     "(p.bound?'At least ':'')+p.text+' percent whole-build progress at day close.'",
     "(p.bound?'At least ':'')+p.text+(p.cutoff?' percent whole-build progress to the race-weekend cut-off, Friday 23 October 2026: the last build day carries the finished build.':' percent whole-build progress at day close.')"),
    ('last build day: More info says why', 1,
     "<b>Whole build</b><p>Reconstructed from dated work records against the current seven-category build scope. Scope remains provisional. This is separate from that day’s load completion.</p>'",
     "<b>Whole build</b><p>Reconstructed from dated work records against the current seven-category build scope. Scope remains provisional. This is separate from that day’s load completion.</p>'+(typeof LAST_BUILD_DAY1261==='object'&&LAST_BUILD_DAY1261&&d.iso===LAST_BUILD_DAY1261.day?'<p>The last build day carries the whole build to the race-weekend cut-off, Friday 23 October 2026: the last 28 m of event crowd-control barrier went in on the Friday morning, and the demarcation barrier and pedestrian gates the programme listed but were never built came out of the scope at the cut-off.</p>':'')"),
    # --- 3. departed marks on the map explorer ---
    ('departed mark: the equipment symbol helper', 1,
     "const get=mapStatus1009;mapStatus1009=function(it){",
     "const sym1261=(it,s)=>{try{const H=parent.MapUnits1147,k=(H.kinds(it,s)||[])[0]||'unknown';return (H.data.symbols[k]||{}).glyph||'';}catch(e){return '';}}; /* v12.61: a departed mark carries the equipment's own symbol (Andrew, 30 Oct 2026: \"The icon is always the shape of the description\") */\n  const get=mapStatus1009;mapStatus1009=function(it){"),
    ('departed mark: symbol, green, dark disc', 1,
     "...(d.issues.length?{shape:'diamond',glyph:'!',colour:'#ffaaa3',fill:'#742923'}:{}),offsite1225:true,departure1211:d};",
     "...(d.issues.length?{shape:'diamond',glyph:'!',colour:'#ffaaa3',fill:'#742923'}:{shape:'circle',glyph:sym1261(it,s)||s.glyph,colour:'#7fffc1',fill:'#0f1b21'}),offsite1225:true,departure1211:d};"),
    ('departed ring: always on', 1,
     "const left=window.GC500MapLeft1256?.state.showLeft?ITEMS.filter(it=>it.places.length&&states.get(key(it))?.collected):[]; /* v12.56: off until \"Show what has left\" is ticked */",
     "const left=ITEMS.filter(it=>it.places.length&&states.get(key(it))?.collected); /* v12.61: always on - the mark says what it is, that it has gone and how many */"),
    ('departed ring: how many have gone', 1,
     "pts.push({x:c.x,y:c.y,kind:d.issues.length?'review':d.complete?'off':'part'});}",
     "pts.push({x:c.x,y:c.y,kind:d.issues.length?'review':d.complete?'off':'part',n:d.collected,total:(Number.isFinite(d.remaining)&&d.remaining>=0)?d.collected+d.remaining:null,glyph:sym1261(it,mapStatus1009(it)),own:own1261.has(it)});}"),
    ('departed ring: which marks already carry a badge', 1,
     "const M=sheetToDevice(dpr*v.scale,canvas.width,canvas.height),pts=[];",
     "const M=sheetToDevice(dpr*v.scale,canvas.width,canvas.height),pts=[],own1261=new Set((typeof marks!=='undefined'&&Array.isArray(marks)?marks:[]).map(m=>m.it)); /* v12.61: a searched or selected reference already carries its own badge; every other departed reference gets the symbol inside its ring */"),
    ('departed ring: the symbol inside', 1,
     "for(const q of P){g.save();g.strokeStyle='rgba(6,10,12,.55)';g.lineWidth=w+2.5*dpr;g.beginPath();g.arc(q.x,q.y,r0,0,Math.PI*2);g.stroke();",
     "for(const q of P){g.save();if(!q.own){g.fillStyle='#0f1b21';g.beginPath();g.arc(q.x,q.y,r0,0,Math.PI*2);g.fill();if(q.glyph&&r0>=8*dpr){g.fillStyle=C[q.kind];g.font='400 '+Math.round(r0*1.45)+'px GC500MapUnits1147,sans-serif';g.textAlign='center';g.textBaseline='middle';g.fillText(q.glyph,q.x,q.y+0.5*dpr);}} /* v12.61: the equipment's own symbol on a dark disc inside the ring (Andrew, 30 Oct 2026: \"The icon is always the shape of the description\") */g.strokeStyle='rgba(6,10,12,.55)';g.lineWidth=w+2.5*dpr;g.beginPath();g.arc(q.x,q.y,r0,0,Math.PI*2);g.stroke();"),
    ('departed ring: the badge', 1,
     "if(ph>=0&&q.kind!=='part'){g.globalAlpha=(1-ph)*0.75;g.lineWidth=w*1.2;g.beginPath();g.arc(q.x,q.y,r0+ph*r0,0,Math.PI*2);g.stroke();}g.restore();}",
     "if(ph>=0&&q.kind!=='part'){g.globalAlpha=(1-ph)*0.75;g.lineWidth=w*1.2;g.beginPath();g.arc(q.x,q.y,r0+ph*r0,0,Math.PI*2);g.stroke();}\n   if(Number.isFinite(q.n)&&q.n>0){const txt=q.total&&q.total>q.n?q.n+'/'+q.total:String(q.n),rb=Math.max(7*dpr,r0*0.62),bx=q.x+r0*0.95,by=q.y-r0*0.95;g.globalAlpha=1;g.setLineDash([]);g.font='800 '+Math.round(rb*1.25)+'px Inter,sans-serif';const tw=g.measureText(txt).width,bw=Math.max(rb*2,tw+rb*0.9);g.fillStyle=q.kind==='review'?'#ffaaa3':'#7fffc1';g.strokeStyle='rgba(6,10,12,.8)';g.lineWidth=1.5*dpr;g.beginPath();if(g.roundRect)g.roundRect(bx-bw/2,by-rb,bw,rb*2,rb);else g.rect(bx-bw/2,by-rb,bw,rb*2);g.fill();g.stroke();g.fillStyle='#06110c';g.textAlign='center';g.textBaseline='middle';g.fillText(txt,bx,by+0.5*dpr);} /* v12.61: how many have gone */\n   g.restore();}"),
    ('v12.56 switch: marks always on', 1,
     " let showLeft=true;" if False else " let showLeft=false;",
     " let showLeft=true; /* v12.61: the departed marks are always on */"),
    ('v12.56 key: what the marks mean', 1,
     "key.textContent='Green ring = has left site · dashed = part left · red = needs review';",
     "key.textContent='Left site: the symbol says what it is, the green pulse that it has gone, the badge how many (n/total = part gone); dashed = part gone; red = needs review';"),
    ('v12.56 switch: hidden', 1,
     "label.append(check,ownDoc.createTextNode('Show what has left'));bar.appendChild(label);",
     "label.hidden=true;label.style.display='none';label.append(check,ownDoc.createTextNode('Show what has left'));bar.appendChild(label); /* v12.61: no switch - the marks are always on (the bar's own display rule would beat the hidden attribute) */"),
    # --- 4. three maps on the Build cards (the v12.47 strip) ---
    ('strip: the three-picture draw', 1,
     "async draw(description,isCurrent){const view=W.Find1176.VIEWS.find(v=>v.key==='wide');if(!view)throw new Error('Native wide view unavailable');const picture=await W.Find1176.picture(description.L,view);if(!isCurrent())return null;return compact(picture,isCurrent);}",
     "async draw(description,isCurrent){const url=await W.composeMaps1261(description.L,description.key1261||'',isCurrent);if(!isCurrent())return null;return url;} /* v12.61: close up, wider area and the drawing (Andrew, 29 Oct 2026: \"3 maps 1 to include the drawing location\") */"),
    ('strip: the key on the description', 1,
     "return {key:token(L),L,eligible:!!W.Find1176.inAerial(L),reason:'Open recorded location ↗'};",
     "return {key:token(L),L,key1261:button.dataset.build1247Key,eligible:!!W.Find1176.inAerial(L),reason:'Open recorded location ↗'};"),
    ('strip: a new cache key', 1,
     "function token(L){return [L.kind,L.label,L.tag,L.lat,L.lon,L.how,L.warn,W.Find1176?.release,'wide'].join('|');}",
     "function token(L){return [L.kind,L.label,L.tag,L.lat,L.lon,L.how,L.warn,W.Find1176?.release,'three1261'].join('|');}"),
    ('strip css: the picture spans the card', 1,
     "#pane-timeline .ld.tl846.lc991 .b1247-thumb{display:flex;align-items:center;justify-content:center;flex:0 0 112px;width:112px;height:76px;background:#213e4b;color:#d0dfe6;font-size:11px;text-align:center;overflow:hidden}",
     "#pane-timeline .ld.tl846.lc991 .b1247-thumb{display:flex;align-items:center;justify-content:center;flex:1 1 100%;width:100%;height:auto;aspect-ratio:1020/242;min-height:60px;background:#213e4b;color:#d0dfe6;font-size:11px;text-align:center;overflow:hidden}"),
    ('strip css: the picture fills', 1,
     "#pane-timeline .ld.tl846.lc991 .b1247-thumb img{width:100%;height:100%;object-fit:contain;display:block}",
     "#pane-timeline .ld.tl846.lc991 .b1247-thumb img{width:100%;height:100%;object-fit:cover;display:block}"),
    ('strip css: phone', 1,
     "#pane-timeline .ld.tl846.lc991 .b1247-thumb{flex-basis:104px;width:104px;height:80px}",
     "#pane-timeline .ld.tl846.lc991 .b1247-thumb{flex-basis:100%;width:100%;height:auto}"),
    ('strip css: the words sit under the pictures', 1,
     "#pane-timeline .ld.tl846.lc991 .b1247-location{display:flex;align-items:center;gap:12px;width:100%;max-width:520px;",
     "#pane-timeline .ld.tl846.lc991 .b1247-location{display:flex;flex-wrap:wrap;align-items:center;gap:12px;width:100%;max-width:640px;"),
    ('strip css: words padding', 1,
     "#pane-timeline .ld.tl846.lc991 .b1247-map-copy{display:grid;gap:3px;min-width:0;padding:8px 12px 8px 0}",
     "#pane-timeline .ld.tl846.lc991 .b1247-map-copy{display:grid;gap:3px;min-width:0;padding:0 12px 8px 12px}"),
]


def replace_json_object(text, marker, label, edit):
    """find `marker` (the text just before a JSON object), decode that object, apply edit(obj) and write it back compactly"""
    i = text.find(marker)
    if i < 0 or text.count(marker) != 1:
        raise ValueError(label + ': expected the marker once')
    start = i + len(marker)
    obj, n = json.JSONDecoder().raw_decode(text[start:start + 3000000])
    edit(obj)
    return text[:start] + json.dumps(obj, ensure_ascii=False, separators=(',', ':')) + text[start + n:]


def programme_updates(o):
    """the 29/10/26 updates to TP02-26003-03 (Andrew's upload, 30 Oct 2026)"""
    rows = {r['ref']: r for r in o['rows']}
    rows['WB19']['install']['date'] = '2026-11-03'; rows['WB19']['days_hire'] = 4; rows['WB19']['fms_quantity'] = 136
    rows['WB19']['grid'] = {'first': '2026-11-03', 'last': '2026-11-06', 'days': 4}
    rows['WB01']['removal']['comment'] = 'Traffic control required - Coates to remove with their forklift and labour. Site crew will remove and place in median strip Tuesday Night and can be picked up by Coates any nightshift thereafter'
    rows['WB07']['removal']['comment'] = 'Coates to move these WFB into turning lane Monday night. 10x Captured within WB05'
    rows['WB22']['removal']['comment'] = 'Coates to move these WFB into turning lane Monday night.'
    o['updates'] = 'TP02-26003-03 GC500 WFB PROGRAM 2, "UPDATES 29/10/26" (Andrew, 30 Oct 2026): WB19 reinstated 3-6 Nov (4 days, 136 barrier-days); WB01 removal note; WB07 and WB22 moved into the turning lane Monday night'


def patch(text, path='page'):
    if FOOT_B in text or 'wfb1261-script' in text:
        raise ValueError('v12.61 already applied')
    if FOOT_A not in text or 'GC500MapLeft1256' not in text or 'CoveredLabour1255' not in text:
        raise ValueError('v12.61 is built on the live v12.56')
    styles_before = re.findall(r'<style\b[^>]*>[\s\S]*?</style>', text)
    for label, n, old, new in REPLACEMENTS:
        if text.count(old) != n:
            raise ValueError(label + ': expected %d exact occurrence(s), found %d' % (n, text.count(old)))
        text = text.replace(old, rep(old, old, new, label, path))
    # 1a. the reference names per the programme: the register copies and the location string
    for old, new, key in NAMES:
        a, b = '"name":"' + old + '"', '"name":"' + new + '"'
        if text.count(a) != 3:
            raise ValueError(key + ' name: expected 3 register copies, found %d' % text.count(a))
        text = text.replace(a, b)
        a, b = '"' + key + ' ' + old + '"', '"' + key + ' ' + new + '"'
        if text.count(a) != 1:
            raise ValueError(key + ' location string: expected once, found %d' % text.count(a))
        text = text.replace(a, b)
    # 1b. the programme object with the 29/10/26 updates
    text = replace_json_object(text, '"wfb_programme1030":', 'programme object', programme_updates)
    # 1c. the explorer's barrier shapes rebuilt from the drawn runs
    data = json.loads((ROOT / 'wfb1261.json').read_text(encoding='utf-8'))
    s0 = text.find('<script id="shapes926-data"'); s1 = text.find('</script>', s0)
    if s0 < 0 or s1 < 0:
        raise ValueError('shapes data script not found')
    shapes = text[s0:s1]; rebuilt = 0
    for key, rec in data.items():
        entry = shape_entry(rec)
        if not entry: continue
        marker = '"' + key + '":{"c":[{"k":"water_barrier"'
        if shapes.count(marker) == 0:
            continue  # Downer's runs (WB09, WB10) and WB22 have no shape on the page; the cards carry their positions
        if shapes.count(marker) != 1:
            raise ValueError(key + ': shapes entry expected once, found %d' % shapes.count(marker))
        i = shapes.find(marker) + len('"' + key + '":')
        _, n = json.JSONDecoder().raw_decode(shapes[i:i + 400000])
        shapes = shapes[:i] + json.dumps(entry, ensure_ascii=False, separators=(',', ':')) + shapes[i + n:]
        rebuilt += 1
    if rebuilt != 12:
        raise ValueError('expected 12 barrier shapes rebuilt (WB01-06, 13-16, 19, 20), got %d' % rebuilt)
    text = text[:s0] + shapes + text[s1:]
    # 1d/4. the modules, before the map units script (dest782, MASTER_LOC, Find it on the map and the Demob plan piece exist by then)
    module = (ROOT / 'wfb1261.js').read_text(encoding='utf-8').rstrip().replace('__WFB1261_DATA__', json.dumps(data, ensure_ascii=False, separators=(',', ':')))
    three = (ROOT / 'three_maps1261.js').read_text(encoding='utf-8').rstrip()
    old = '<script id="mapunits1147-script">'
    if text.count(old) != 1:
        raise ValueError('map units script tag expected once')
    text = text.replace(old, module + '\n' + three + '\n' + old, 1)
    if text.count(FOOT_A) != 1:
        raise ValueError('release footer expected once')
    text = text.replace(FOOT_A, FOOT_B, 1)
    styles_after = re.findall(r'<style\b[^>]*>[\s\S]*?</style>', text)
    changed = [i for i, (a, b) in enumerate(zip(styles_before, styles_after)) if a != b]
    if len(styles_before) != len(styles_after) or len(changed) != 1 or '.b1247-thumb' not in styles_after[changed[0]]:
        raise ValueError('styles: only the Build strip block may change (changed %s)' % changed)
    return text


if __name__ == '__main__':
    page = Path(sys.argv[1])
    page.write_text(patch(page.read_text(encoding='utf-8'), str(page)), encoding='utf-8')
    print('patch_v1261 applied: water barriers from the K sheets, last build day to the cut-off, departed marks, three maps')
