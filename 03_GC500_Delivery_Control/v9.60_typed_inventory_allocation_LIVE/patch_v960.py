# Author: Andrew Fisher
from pathlib import Path
import sys
HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent / 'toolchain'))
from rep import rep

p = Path(sys.argv[1]); raw = p.read_bytes(); s = raw.decode('utf-8-sig')
assert 'root.Inventory960=' not in s, 'v9.60 is already applied'
assert " · v9.59'; /* v8.19" in s and 'function fenceMeasuredCcb959(record, options)' in s and 'const FENCE_PROGRAMME958 =' in s, 'Requires v9.59 base'
def change(old, new, why):
    global s
    s = rep(s, old, new, why, str(p))

end = 'return result;\n};\n\n</script>\n</body></html>'
change(end, 'return result;\n};\n\n</script>\n<script id="inventory960-script">\n' + (HERE/'inventory960.js').read_text() + '\n</script>\n<script id="scope960-bind-script">\n' + (HERE/'scope960-bind.js').read_text() + '\n</script>\n</body></html>', 'read-only typed allocation and scope adapters')
change('function vmsRequirement747Html(){', (HERE/'scope960.js').read_text()+'\nfunction vmsRequirement747Html(){', 'shared canonical VMS source reading')
change('A location with two types counts its numbers against its biggest line.', 'Mixed-item locations use their recorded item identities; identities with an unresolved item or arrival are not assigned to another type.', 'inventory count basis')
change("const description=(a,u,subs)=>{\n   if(!a)return 'Event Portables unit';", "const typedModels960=new Map();\n  const description=(a,u,subs)=>{\n   if(!a)return 'Event Portables unit';\n   if(typeof Inventory960!=='undefined'){\n    if(!typedModels960.has(a.key))typedModels960.set(a.key,gcModel925(a,{loading:false}));\n    const typed=Inventory960.unitDescription(typedModels960.get(a.key),a.key,'event-portables',u.asset_no);if(typed)return typed;\n   }", 'supplier FWF subtotal uses the same typed physical units')
change("const known=x&&['confirmed','lower-bound'].includes(x.pctKind)&&number(x.pct),lower=x?.pctKind==='lower-bound';", "const known=x&&['confirmed','lower-bound','provisional-scope'].includes(x.pctKind)&&number(x.pct),lower=x?.pctKind==='lower-bound';", 'retain numerical schedule reading in whole-job model')
change("provisional:lower||!!x?.reviewQuantity||!!x?.unquantifiedRefs,basis:'Confirmed completion'", "provisional:lower||!!x?.reviewQuantity||!!x?.unquantifiedRefs||!!x?.scopeProvisional960,basis:x?.scopeNote960||'Confirmed completion'", 'carry scope uncertainty into whole-job model')
change("done=x.value===100&&!x.bound;", "done=x.value===100&&!x.bound&&!r.provisional;", 'provisional groups cannot claim finished')
change("(x.bound?'at least ':'')+x.text+'% complete'", "(x.bound?'at least ':'')+x.text+'% '+(r.provisional?'on a provisional basis':'complete')", 'whole-job group accessible label')
change("+groups(m)+'<details class=\"w885-basis\"><summary>How the whole-job figure is worked out</summary><p>'+esc(BASIS)+'</p></details>';", "+groups(m)+'<details class=\"w885-basis\"><summary>How the whole-job figure is worked out</summary><p>'+esc(BASIS)+'</p>'+m.rows.filter(r=>r.id==='vms'&&r.provisional).map(r=>'<p>'+esc(r.basis)+'</p>').join('')+'</details>';", 'explain VMS basis in whole-job disclosure')
change("const scope = fence ? 'Build + Event · quantities by work type' : area.unit + ' · confirmed completion';", "const scope = fence ? 'Build + Event · quantities by work type' : area.unit + (summary.scopeProvisional960 ? ' · provisional schedule scope' : ' · confirmed completion');", 'group footer scope')
change("digits(pct, area.id, 'confirmed complete', summary.pctKind)", "digits(pct, area.id, summary.scopeProvisional960 ? 'complete against provisional schedule scope' : 'confirmed complete', summary.pctKind)", 'group accessible percentage scope')
change("+ compactPlan847(summary.plan);", "+ (summary.scopeNote960 ? '<p class=\"tw846-row-note is-review\" data-scope960>'+escape(summary.scopeNote960)+'</p>' : '') + compactPlan847(summary.plan);", 'visible VMS and Lighting count bases')
change("+ '% confirmed complete. ' + (complete ?", "+ (kind === 'provisional-scope' ? '% complete against provisional schedule scope. ' : '% confirmed complete. ') + (complete ?", 'race-lamp scope label')
change("percentage(item.pct, item.pctKind) + '% confirmed complete'", "percentage(item.pct, item.pctKind) + (item.scopeProvisional960 ? '% complete against schedule · provisional scope' : '% confirmed complete')", 'VMS type instrument scope')
change("' · review included in Left' : '') + '</span>';", "' · review included in Left' : '') + (summary.scopeProvisional960 ? ' · provisional schedule scope' : '') + '</span>';", 'closed category scope')
change("return '<div class=\"notice\" data-vms-requirement747><b>VMS requirement confirmed: 22 boards</b><p>The 23rd board is not required. Five relocations move existing boards; they are not extra hires. The original BOQ quantity of 23 is retained as source history. Confirmation recorded 01 Oct 2026.</p></div>';", "const rows=inventory().list.filter(r=>r.item==='VMS');\n return Scope960.requirementHtml(rows.length?rows.reduce((n,r)=>n+r.asked,0):null);", 'Equipment VMS requirement uses same current source model')
change(" · v9.59'; /* v8.19", " · v9.60'; /* v8.19", 'footer')
p.write_bytes((b'\xef\xbb\xbf' if raw.startswith(b'\xef\xbb\xbf') else b'') + s.encode())
