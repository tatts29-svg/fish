# Author: Andrew Fisher
import os,sys
from pathlib import Path
sys.path.insert(0,os.path.join(os.path.dirname(os.path.abspath(__file__)),'..','toolchain'))
from rep import rep as checked_rep
def rep(s,old,new): return checked_rep(s,old,new,"v8.72 loading and identifiers",sys.argv[1])
p=Path(sys.argv[1]);s=p.read_text()
assert 'function loading872Set(' not in s and 'function timeline841Printed(' in s
s=rep(s,"&& typeof d.levelled !== 'boolean' && typeof d.steps !== 'boolean' && typeof d.emptied !== 'boolean' && !d.date_off_at && !d.out_off_at && !d.timeline841;", "&& typeof d.levelled !== 'boolean' && typeof d.steps !== 'boolean' && typeof d.emptied !== 'boolean' && !d.date_off_at && !d.out_off_at && !d.timeline841 && !Object.keys(d.loading872 || {}).length;")
s=rep(s," const progress841=timeline841MergeProof(a.timeline841,b.timeline841); if(progress841)m.timeline841=progress841;", " const loading872=loading872Merge(a.loading872,b.loading872); if(Object.keys(loading872).length)m.loading872=loading872;\n const progress841=timeline841MergeProof(a.timeline841,b.timeline841); if(progress841)m.timeline841=progress841;")
s=rep(s,"<span class=\"ld-w\">'+esc(ldWhat(r))+'</span>'+timeline841Lights(v)","<span class=\"ld-w\">'+esc(ldWhat(r))+'</span>'+loading872AssetHtml(r.a)+timeline841Lights(v)")
s=rep(s,"data-tl841-open=\"'+esc(r.a.key)+'\">'+esc(r.a.key)+' · Progress</button>').join('')+'<button", "data-tl841-open=\"'+esc(r.a.key)+'\">'+esc(r.a.key)+' · Progress</button>').join('')+g.rows.map(r=>loading872Editor(r.a)).join('')+'<button")
s=rep(s,"'<span class=\"tl846-ticks\">' + ldTicks(asset)","loading872AssetHtml(asset) + '<span class=\"tl846-ticks\">' + ldTicks(asset)")
s=rep(s,"const m = lineNumbersOf(a); const fromLine = m ? (m[item] || []) : []; const noted = tank768NotedNumbers(a.key);", "const m = itemNumbersOf(a), supplied = localSupplied(a.key).items || []; const typed = supplied.find(l => l.asked === item); const assigned = typed && Array.isArray(typed.nums) ? typed.nums.map(String) : []; const elsewhere = new Set(supplied.filter(l => l.asked !== item).flatMap(l => l.nums || []).map(String)); const fromLine = assigned.length ? assigned : m ? (m[item] || []) : []; const noted = tank768NotedNumbers(a.key).filter(n => !elsewhere.has(String(n)));")
s=rep(s,'<td class="rs-wc">${s.drops.map(x => `<span><b>${esc(x.ref || x.name)}</b> ×${x.fwf}', '<td class="rs-wc">${s.drops.map(x => `<span><b>${esc(x.ref || x.name)}</b> ×${x.fwf}<small>${esc(loading872Compact(assetOf(x.ref)) || "Door side not set — confirm before loading")}</small>')
s=rep(s,'<div class="rs-so"><b>Sign-off</b>${pd', '<div class="rs-so"><b>Sign-off</b><p class="rs-pd"><i class="rs-bx" aria-hidden="true"></i><span>Door-side loading instructions checked with the driver.</span></p>${pd')
s=rep(s,'function unitBlockInline(a){ return unitBlock(a); }','function unitBlockInline(a){ return loading872Editor(a)+unitBlock(a); }')
s=s.replace('</head>','<style id="loading872css">.asset872{display:flex;flex-wrap:wrap;gap:6px 12px;margin:8px 0 12px;font:600 15px/1.5 Inter,sans-serif;color:#fff}.asset872 b{font-size:19px;letter-spacing:.02em}.loading872{width:100%;border:1px solid #77878a;border-radius:8px;padding:10px;margin:8px 0}.loading872 summary{font-weight:700;cursor:pointer}.loading872 fieldset{border:1px solid #809196;border-radius:6px;margin:10px 0;padding:10px;min-width:0}.loading872 legend{font-weight:700;font-size:15px}.loading872 label{display:flex;align-items:center;gap:8px;padding:9px 0;line-height:1.4}.loading872 input{width:20px;height:20px;accent-color:#ff7300}.loading872-sheet{border:1px solid #333;padding:2mm;margin:2mm 0;font:600 9pt/1.3 Inter,sans-serif;break-inside:avoid;color:#111;background:#fff}.loading872-sheet div{margin-top:1mm}@media(max-width:600px){.asset872 b{font-size:18px}.tl841-actions .loading872{flex-basis:100%}}</style></head>',1)
# Append after all native functions have been defined, before final script closes.
pos=s.index('</script>',s.index('const DATA ='));assert pos>0
s=s[:pos]+Path(__file__).with_name('loading872_src.js').read_text()+'\n'+s[pos:]
s=s.replace('v8.71','v8.72') if False else s
# Only the release footer marker changes.
s=rep(s,' · v8.71',' · v8.72')
p.write_text(s)
