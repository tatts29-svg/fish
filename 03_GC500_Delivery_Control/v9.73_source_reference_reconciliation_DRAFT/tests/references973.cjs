// Author: Andrew Fisher. Pure model tests; no network/native writes.
const fs=require('fs'),vm=require('vm'),assert=require('assert'),path=require('path');
const release=path.resolve(__dirname,'..');
if(!process.env.REFERENCE973_MODELS||!process.env.REFERENCE973_BASE_PAGE)throw new Error('Set REFERENCE973_MODELS to the read-only model capture and REFERENCE973_BASE_PAGE to its v9.71 base HTML. No credentials are required.');
const models=JSON.parse(fs.readFileSync(process.env.REFERENCE973_MODELS));
const clone=x=>JSON.parse(JSON.stringify(x));
const page=fs.readFileSync(process.env.REFERENCE973_BASE_PAGE,'utf8');
let old=page.slice(page.indexOf('const Reference966 ='),page.indexOf('function referenceSourceLinks966('));
assert(old.startsWith('const Reference966 ='),'Expected base Reference966 module');
const start='return {id,key:id,ref:a?.key||id,recordRef:',at=old.indexOf(start),end=old.indexOf(';',at);
assert(at>0);old=old.slice(0,at)+'return Reference973.projectRow(row, '+old.slice(at+7,end)+', c)'+old.slice(end);
const fresh=fs.readFileSync(path.join(release,'references973.js'),'utf8');
const C=vm.createContext({});vm.runInContext(old+'\n'+fresh+'\nthis.r=Reference973;this.ref=Reference966;',C);
let checks=0;const ok=(test,msg)=>{assert(test,msg);checks++;};
const ctx={assets:models.assets.map(x=>x.a),rows:models.dataUnref,closed:models.plants.closed_by_demob_row,added:[],given:{},off:id=>!models.references.some(r=>r.id===id),boardRefs:a=>models.references.find(r=>r.recordRef===a.key)?.boardReferences||[],where:a=>{const w=models.assets.find(x=>x.a.key===a.key)?.where;if(!w)return null;const p=C.r.destination(a,w.w,{});return {...w,main:p.known?p.text:'',w:p};},destination:a=>C.r.suppressNavigation(a,{})?null:models.assets.find(x=>x.a.key===a.key)?.dest};
const before=JSON.stringify(models);
for(const key of ['GN25','LT05','LT06']){
 const a=ctx.assets.find(a=>a.key===key),p=C.r.sourcePlace(a,{});
 ok(p&&!p.exactPosition&&!('ll' in p),key+' named place no coordinate');
 for(const change of [{_locationMoved:{to:'New place'}},{_movedTo:'OTHER'},{_cancelled:{why:'cancelled'}},{locations:['Another named place']},{drawing_links:[]},{product:'Different',discipline:'Other',item_types:['Other']}] )ok(!C.r.sourcePlace({...a,...change},{}),key+' changed source/native guard');
 ok(!C.r.sourcePlace(a,{state:{locations:{[key]:'New place'}}}),key+' native location');
 ok(!C.r.sourcePlace(a,{pin:()=>({fix:{lat:-27.9,lon:153.4}})}),key+' native/master pin');
 ok(!C.r.sourcePlace(a,{place:()=>({place:{lat:-27.9,lon:153.4}})}),key+' native placement');
}
for(const id of ['T0222','T0223']){
 const row=ctx.rows.find(r=>r.task_id===id),r=C.ref.resolve(row,ctx),parent=id==='T0222'?'T0021':'T0022';
 ok(r.relation==='paired-demob'&&r.recordRef===parent,id+' original link');
 ok(C.r.officeLink(id,ctx)===parent,id+' Questions API');
 ok(r.sourceRow.item==='Building 6m'&&r.date==='2026-11-12',id+' raw source and date retained');
 const changed={...ctx,assets:ctx.assets.map(a=>a.key===parent?{...a,asset_numbers:['NEW']}:a)};
 ok(C.ref.resolve(row,changed).relation!=='paired-demob',id+' replacement identity guard');
 const assigned={...ctx,given:{[id]:{ref:'P33'}}};ok(C.ref.resolve(row,assigned).recordRef==='P33',id+' saved assignment wins');
 const changedSource={...row,source_range:'NEW'};ok(C.ref.resolve(changedSource,ctx).relation!=='paired-demob',id+' source signature');
}
for(const id of ['T0234','T0273','T0274']){
 const row=ctx.rows.find(r=>r.task_id===id),r=C.ref.resolve(row,ctx);
 ok(r.locationState==='named-area'&&!r.exactPosition&&!r.linked,id+' area only');
 ok(!r.required,id+' no false missing destination');
 ok(C.ref.resolve(row,{...ctx,given:{[id]:{ref:'P33'}}}).recordRef==='P33',id+' native assignment');
 ok(C.ref.resolve({...row,location:'New place'},ctx).location==='New place',id+' new written place');
}
for(const id of ['T0128','T0158','T0159','T0169','T0170']){
 const row=ctx.rows.find(r=>r.task_id===id),r=C.ref.resolve(row,ctx);
 ok(r.locationState==='plan-covered-allocation-open'&&r.required.includes('board numbers'),id+' board allocation remains');
 ok(r.boardReferences.length===0&&!r.exactPosition,id+' no allocation invented');
 const native={...r,location:'Recorded named place',locationState:'named-place'};
 ok(C.r.projectRow(row,native,ctx)===native,id+' later named place wins');
 const boards=Array.from({length:Number(row.quantity_display)},(_,i)=>({ref:'VMS'+(i+1)}));
 const assigned={...r,boardReferences:boards,location:'Known board assignment'};
 ok(C.r.projectRow(row,assigned,ctx)===assigned,id+' actual board assignment wins');
}
const unresolved=C.ref.unresolvedLocations(ctx).map(x=>x.id);
ok(unresolved.length===8,'eight remaining precise facts '+unresolved.join(','));
ok(['T0021','WC85','T0268','T0128','T0158','T0159','T0169','T0170'].every(k=>unresolved.includes(k)),'exact remaining references');
ok(C.ref.rows(ctx).filter(x=>x.linked).length===31,'31 linked source rows');
ok(C.ref.pendingRows(ctx).length===3,'3 real source-only area tasks');
ok(JSON.stringify(models)===before,'all inputs unchanged');
console.log(JSON.stringify({author:'Andrew Fisher',checks,unresolved,linkedRows:31,sourceOnlyTasks:3,mutations:0},null,2));
