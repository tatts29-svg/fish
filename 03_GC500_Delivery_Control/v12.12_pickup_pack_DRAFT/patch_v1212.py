"""Author: Andrew Fisher. Coates-style pickup PDF, pack references and navigation QR."""
import hashlib,re,sys
from pathlib import Path
HERE=Path(__file__).resolve().parent
sys.path.insert(0,str(HERE.parent/'toolchain'))
from rep import rep
BASE='3b51c50a7766f2f37d222f49c2cad18c03eb868356c8019ce600581eac46915d'
def patch(html):
 if "version:'v12.12',make,reference" in html: raise ValueError('v12.12 already applied')
 if hashlib.sha256(html.encode()).hexdigest()!=BASE: raise ValueError('Live base changed; rebuild and retest')
 old=(HERE.parent/'v12.11_map_demob_LIVE/demob1211_pdf.js').read_text().replace("author:'Andrew Fisher'","author:'the project manager'")
 html=rep(html,old,(HERE/'pickup1212_specs.js').read_text()+'\n'+(HERE/'pickup1212_pdf.js').read_text(),'designed pickup PDF','page')
 def change(a,b,label):
  nonlocal html
  html=rep(html,a,b,label,'pickup export')
 change('function lines(rows){','function lines(rows,packRef,preparedAt){','reference metadata parameters')
 change("'Prepared '+when(new Date()),'50 m x 50 m area", "'Pack reference '+packRef,'Prepared '+when(preparedAt),'50 m x 50 m area",'stable export metadata')
 change("const serial=generation,s=selectedSnapshot(rows),selection=selected(),text=lines(rows).join('\\n');", "const serial=generation,s=selectedSnapshot(rows),selection=selected(),preparedAt=new Date(),packRef=parent.MapDemobPdf1211.reference(preparedAt),text=lines(rows,packRef,preparedAt).join('\\n');",'one reference per prepared pack')
 change("const pdf=await parent.MapDemobPdf1211.make({blob,rows:rows.map(r=>({...r,map:refs.find(x=>x.key===r.key).map})),text,centre:s.pin.ll});", """const pdf=await parent.MapDemobPdf1211.make({blob,rows:rows.map(r=>{const map=refs.find(x=>x.key===r.key).map,numbers=new Set(r.items.flatMap(i=>i.units.map(u=>u.number))),types=new Set(r.items.map(i=>i.type));return {...r,map,doors:A.doorWords(map),pickupLoading:r.loading.filter(l=>numbers.has(l.asset)||!l.asset&&types.has(l.item))};}),centre:s.pin.ll,packRef,preparedAt});""",'structured verified selected details')
 change("const stamp=new Date().toISOString().replace(/[:.]/g,'-'),base='GC500-demob-'+stamp,urls=", "const base=packRef,urls=",'document reference filenames')
 change("ready={text,pdf:new File([pdf]", "ready={text,packRef,pdf:new File([pdf]",'share reference')
 change("title:'GC500 Demob pickup pack',text:mail?", "title:'GC500 pickup pack '+r.packRef,text:mail?",'share title')
 change("encodeURIComponent('GC500 Demob pickup pack')", "encodeURIComponent('GC500 pickup pack '+r.packRef)",'email subject')
 change("status('Pickup pack ready. '+rows.reduce", "status('Pickup pack '+packRef+' ready. '+rows.reduce",'visible reference')
 change('+(r.items.length&&parent.capability()===\'edit\'?\'<button type="button" data-record-departure="\'+i+\'">Record selected items left site…</button>\':\'\')','', 'remove departure action from driver selection')
 change("panel.querySelectorAll('[data-record-departure]').forEach(b=>b.onclick=()=>{try{const r=refs[Number(b.dataset.recordDeparture)],p=selected().find(x=>x.key===r.key);if(!p)throw new Error('Select the items that actually left this location.');H.validate([p]);mapFresh([r]);if(!parent.mayWrite('a pick-up'))return;close();parent.Departure1211.open(r.key,p);}catch(err){status(err.message);}});",'', 'remove departure shortcut handler')
 change("rows=H.validate(selected());mapFresh(rows);", "rows=parent.MapPickupSpecs1212.read(H.validate(selected()));mapFresh(rows);",'read selected transport facts')
 change("selection=selected(),preparedAt=new Date()", "selection=selected(),specToken=parent.MapPickupSpecs1212.fingerprint(rows),preparedAt=new Date()",'capture transport snapshot')
 change("function assertFresh(){consent();mapFresh(H.validate(selected()));if(!ready)throw new Error('Prepare the pickup pack first.');}", "function assertFresh(){consent();const rows=H.validate(selected());mapFresh(rows);if(!ready)throw new Error('Prepare the pickup pack first.');if(parent.MapPickupSpecs1212.fingerprint(parent.MapPickupSpecs1212.read(rows))!==ready.specToken)throw new Error('Weights or dimensions changed. Prepare a new pickup pack.');}", 'transport evidence stale guard')
 change("if(serial!==generation)return;mapFresh(H.validate(selection));consent();", "if(serial!==generation)return;const fresh=H.validate(selection);mapFresh(fresh);consent();if(parent.MapPickupSpecs1212.fingerprint(parent.MapPickupSpecs1212.read(fresh))!==specToken)throw new Error('Weights or dimensions changed. Prepare a new pickup pack.');", 'check transport facts after asynchronous render')
 change("ready={text,packRef,pdf:new File", "ready={text,packRef,specToken,pdf:new File",'store export snapshot')
 change("   const selectedNumbers=new Set(r.items.flatMap", "   out.push('Weights & dimensions');for(const it of r.items)for(const spec of it.specs||[])out.push(it.type+' | '+spec.labels.join(', '),...spec.lines);\n   const selectedNumbers=new Set(r.items.flatMap", 'transport facts in share text')
 f=re.search(r"\+' · v(\d+(?:\.\d+)+)'; /\* v8.19 release922",html)
 return rep(html,f[0],"+' · v12.12'; /* v8.19 release922",'version','page')
if __name__=='__main__':
 p=Path(sys.argv[1]);p.write_text(patch(p.read_text()));print('Coates-style pickup sheets and navigation QR applied')
