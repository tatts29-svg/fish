# Author: Andrew Fisher. Exact v9.64 predecessor; all replacements complete before the atomic write.
from pathlib import Path
import hashlib,sys
HERE=Path(__file__).resolve().parent
sys.path.insert(0,str(HERE.parent/'toolchain'))
from rep import rep
p=Path(sys.argv[1]);raw=p.read_bytes();s=raw.decode('utf-8-sig')
assert 'const ItemPhotos965 =' not in s,'v9.65 already applied'
assert hashlib.sha256(raw).hexdigest()=='82d23168b4df656016bc8be2e7da74e58ac09a585eaebca3418f87bc4656291f','Requires exact live v9.64'
assert " · v9.64'; /* v8.19" in s and 'function quantitySubhire964Read(' in s,'Requires v9.64 source'
def change(old,new,why):
 global s
 s=rep(s,old,new,why,str(p))
change('function inventory(){',(HERE/'items965.js').read_text()+'\nfunction inventory(){','guarded item-group photo associations and selected item context')
change('const reason=Items933.guard(key,item933.unitId,slot,item933.expected,item933.replace);','const reason=item933.quantityOnly?ItemPhotos965.guard(key,item933.unitId,slot,item933.expected,item933.replace):Items933.guard(key,item933.unitId,slot,item933.expected,item933.replace);','revalidate captured item group after image processing using existing native upload pipeline')
change("function friendly(ref,id){if(!id)return 'Location';", "function friendly(ref,id){if(!id)return 'Location';const q=ItemPhotos965.parse(id);if(q&&q.ref===ref)return q.item+' · quantity only';",'photo tools name quantity groups without inventing an asset number')
change("(unitKey(x.unit) ? ' \\u2014 asset ' + unitKey(x.unit) : ' \\u2014 ' + key)","(unitKey(x.unit) ? ' \\u2014 ' + Items933.friendly(key,x.unit) : ' \\u2014 ' + key)",'existing photo picker names its actual item association')
change("const g=model.groups.find(g=>g.item===choice), quantityOnly962=a.key==='WC09'&&g.item==='Pee Panel', receipt962=quantityOnly962?toiletItem962(a,g.item,deliveryAsOf(a.key,todayIso()),todayIso()):null,photos=dropPhotosOf(a.key),assigned=new Set(model.rows.flatMap(u=>photos925(u,model.rows,photos)).map(p=>p.id)),unassigned=photos.filter(p=>!assigned.has(p.id));", "const g=model.groups.find(g=>g.item===choice), quantity965=ItemPhotos965.group(a,g.item,model), quantityOnly962=!!quantity965,photos=dropPhotosOf(a.key),assigned=new Set(model.rows.flatMap(u=>photos925(u,model.rows,photos)).concat(ItemPhotos965.assigned(a,model,photos)).map(p=>p.id)),unassigned=photos.filter(p=>!assigned.has(p.id));",'each selected description has its own quantity photo scope; legacy group links are not unassigned')
change("model.rows.filter(r=>r.physical).length+' identified</span></div><label", "model.rows.filter(r=>r.physical&&!ItemPhotos965.catalogue(a,r)).length+' individually identified · whole location</span></div><label",'whole-location identity count has an explicit scope and excludes the known trackmat product code')
change("(quantityOnly962?quantitySubhire964Drawer(a.key,g.item,receipt962):g.units.filter(u=>u.physical).length+' identified')", "(quantityOnly962?'Quantity only':g.units.filter(u=>u.physical).length+' identified')",'selected quantity card supplies the item owner and concise receipt data')
change("+toiletScopeHtml962(a)+Source949.note(a.key)+g.units.map(u=>rowHtml925(a,u,model)).join('')", "+ItemPhotos965.scope(a)+(Source949.note(a.key)?'<details class=\"units925-edit\"><summary>Source</summary>'+Source949.note(a.key)+'</details>':'')+(quantity965?ItemPhotos965.card(a,quantity965):g.units.map(u=>rowHtml925(a,u,model)).join(''))",'quantity groups use the existing photo card styles and source explanations remain folded')
change("(a.key==='WC31'&&g.item==='16Pan Block'?'<p class=\"units925-note\">The original Q6845 quote covers one 16-pan block. The additional identified block has a same-item cost estimate in Costs; the variation and any extra transport remain to confirm.</p>':'')", "(a.key==='WC31'&&g.item==='16Pan Block'?'<details class=\"units925-edit\"><summary>Supplier quote</summary><p class=\"units925-note\">The original Q6845 quote covers one 16-pan block. The additional identified block has a same-item cost estimate in Costs; the variation and any extra transport remain to confirm.</p></details>':'')",'selected item main view shows data; supplier explanation stays in details')
change("Items933.tidy(a,body);}","Items933.tidy(a,body);ItemPhotos965.header(a,body);}",'drawer sticky header follows the selected item')
change("panel.outerHTML=panel925(a);document.querySelector('[data-units925=", "panel.outerHTML=panel925(a);ItemPhotos965.header(a,document.querySelector('#drawer .db'));document.querySelector('[data-units925=",'native description changes update the sticky header immediately')
change("if(u.branch)return {code:u.branch,basis:'Unit record'};const b=branchOf(a.key);", "if(u.branch)return {code:u.branch,basis:'Unit record'};if(u.owner!=='coates')return {code:'Not recorded',basis:''};const b=branchOf(a.key);",'sub-hired item cannot borrow the Coates branch belonging to another item')
change(" · v9.64'; /* v8.19"," · v9.65'; /* v8.19",'footer')
out=(b'\xef\xbb\xbf' if raw.startswith(b'\xef\xbb\xbf') else b'')+s.encode()
tmp=p.with_name(p.name+'.v965.tmp');tmp.write_bytes(out);tmp.replace(p)
