// Author: Andrew Fisher. Original read-only fixtures; no network or record writes.
const fs=require('fs'),vm=require('vm'),assert=require('assert'),path=require('path');
for(const n of ['SOURCE974_DATA','SOURCE974_STATE','SOURCE974_MODELS'])if(!process.env[n])throw Error('Set '+n+' to private read-only fixture');
const clone=x=>JSON.parse(JSON.stringify(x)),D=JSON.parse(fs.readFileSync(process.env.SOURCE974_DATA)),S=JSON.parse(fs.readFileSync(process.env.SOURCE974_STATE)).docs,M=JSON.parse(fs.readFileSync(process.env.SOURCE974_MODELS));
const before=JSON.stringify([D,S,M]),C={DATA:D,S,Reference973:{context:()=>({state:S}),sourcePlace:()=>null,destination:(a,b)=>b,suppressNavigation:()=>false,projectRow:(r,b)=>b}};
vm.createContext(C);vm.runInContext(fs.readFileSync(path.join(__dirname,'..','source974.js'),'utf8')+';this.api=Source974;',C);let n=0;const ok=(v,msg)=>{assert(v,msg);n++;};
const a=M.assets.find(x=>x.a.key==='T0021').a,p=C.api.office(a,{state:S});ok(p&&p.label.includes('T0022')&&!p.exactPosition&&!p.ll,'Exact original office/photo pair resolves named area only');
for(const ch of [{asset_numbers:['NEW']},{_cancelled:true},{_movedTo:'NEW'},{_locationMoved:true},{relocation:true}])ok(!C.api.office({...a,...ch},{state:S}),'Current replacement/move wins');
for(const field of ['fixes','places']){const st=clone(S);st[field]={T0021:{lat:-27.98,lon:153.42}};ok(!C.api.office(a,{state:st}),'Native '+field+' wins');}
const moved=clone(S);moved.locations.T0021='NEW';ok(!C.api.office(a,{state:moved}),'Written destination wins');
for(const ref of ['T0021','T0022']){const st=clone(S);st.dropPhotos[ref]={photos:[]};ok(!C.api.office(a,{state:st}),'Missing original photo guard '+ref);}
ok(!C.api.office(a,{state:S,pin:()=>({lat:1,lon:1})}),'Master pin wins');
for(const id of ['T0128','T0158']){
 const row=D.unreferenced.find(r=>r.task_id===id),base=M.references.find(r=>r.id===id),p=C.api.planned(row,base,{assets:[]},D);ok(p&&p.required===''&&p.locationState==='contract-planned-group'&&!p.exactPosition,id+' planned group');ok(!p.boardReferences.length&&p.plannedBoardReferences.length===Number(row.quantity_display),id+' no physical board assignment');
 for(const ch of [{date:'NEW'},{source_range:'NEW'},{quantity_display:'99'},{product:'Other'},{location:'NEW'}])ok(!C.api.planned({...row,...ch},base,{},D),id+' source row guard');
 for(const ch of [{boardReferences:['VMS01']},{relation:'conflict'},{exactPosition:true},{locationState:'named-place'}])ok(!C.api.planned(row,{...base,...ch},{},D),id+' current board/destination wins');
 ok(!C.api.planned(row,base,{given:{[id]:{ref:'VMS01'}}},D),id+' saved assignment wins');
 const altered=clone(D);altered.rental_on_hire.rows.find(r=>r.rental_contract==='9961265'&&r.line===C.api.rules[id].lines[0]).booked_delivery_date='NEW';ok(!C.api.planned(row,base,{},altered),id+' changed contract fails closed');
 const replaced=clone(D);replaced.rental_on_hire.source_sha256='NEW';ok(!C.api.planned(row,base,{},replaced),id+' changed workbook fails closed');
}
for(const id of ['T0159','T0169','T0170'])ok(!C.api.planned(D.unreferenced.find(r=>r.task_id===id),M.references.find(r=>r.id===id),{},D),id+' source discrepancy retained');
ok(before===JSON.stringify([D,S,M]),'All source and operational fixtures preserved');console.log(JSON.stringify({author:'Andrew Fisher',checks:n,passed:true,operationalWrites:0}));
