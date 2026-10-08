// Author: Andrew Fisher. Read-only layout and isolated traffic-service record checks.
const fs=require('fs'),path=require('path'),{open}=require('../toolchain/harness/open_page');
(async()=>{let s;try{
 const out=process.env.EVIDENCE_DIR;if(!out||!path.isAbsolute(out))throw Error('Use an absolute private evidence directory');fs.mkdirSync(out,{recursive:true});
 s=await open({pageFile:process.env.PAGE,hash:'#timeline',W:1440,H:1100});const p=s.page;
 await p.context().route('**/*',r=>r.request().method()==='GET'?r.fallback():r.abort());
 await p.waitForFunction(()=>SYNC.status==='live'&&SYNC.first.size===Object.keys(SYNC_COLLS).length,null,{timeout:180000});
 const checks=[],ok=(name,pass)=>checks.push({name,pass:!!pass});
 const model=await p.evaluate(()=>{
  const before=JSON.stringify(S),original={programmeDays,dpLoads,bump,whoAmI,mayWrite,flash,render},results={},day='2026-10-12',other='2026-10-13';
  const a={kind:'deliveries',booking801:true,truck_id:'truck-A',rows:[{a:{key:'SYNTH-A'}},{a:{key:'SYNTH-B'}}]},b={kind:'deliveries',booking801:true,truck_id:'truck-B',rows:[{a:{key:'SYNTH-A'}}]},d={iso:day};let groups=[a,b],bumps=0;
  try{
   programmeDays=()=>[d,{iso:other}];dpLoads=()=>groups;bump=()=>{bumps++;};whoAmI=()=> 'Isolated check';mayWrite=()=>true;flash=()=>{};
   const unrelated={kind:'crew883',day,ref:'SYNTH-A',people:[{slot:1,roles:['escort']}]};S.loads={'crew883/synthetic':unrelated};
   const id=ldId(d,a),idB=ldId(d,b),key=traffic903Key(day,id);
   results.defaultUnknown=traffic903Plan(day,a).status==='unknown'&&!traffic903Plan(day,a).recorded;
   results.save=traffic903Save(day,a,'required')&&traffic903Plan(day,id).status==='required';const first=S.loads[key];
   results.schema=Object.keys(first).sort().join(',')==='at,by,day,kind,loadId,status'&&!('count'in first);
   results.separate=traffic903Plan(day,b).status==='unknown'&&traffic903Plan(other,a).status==='unknown';
   const firstAt=Date.parse(first.at);traffic903Save(day,id,'arranged');results.monotonic=Date.parse(S.loads[key].at)>firstAt;
   groups=[b,a];results.reorder=traffic903Plan(day,groups[1]).status==='arranged'&&traffic903Day(day).loads.find(x=>x.loadId===id).number===2;
   results.byLoad=traffic903Day(day).total===2&&traffic903Day(day).arranged===1;
   results.crewUntouched=JSON.stringify(S.loads['crew883/synthetic'])===JSON.stringify(unrelated);
   const docs=toDocs('loads'),round=fromDocs('loads',docs);results.sync=JSON.stringify(round[key])===JSON.stringify(S.loads[key]);
   const exported=exportRecord(),exportFull=recordsFrom(exported);delete exported.records;const exportShort=recordsFrom(exported);results.export=JSON.stringify(exportFull.loads[key])===JSON.stringify(S.loads[key])&&JSON.stringify(exportShort.loads[key])===JSON.stringify(S.loads[key]);
   const valid=S.loads[key];results.import=validateRecords({loads:{[key]:valid}}).length===0;
   results.badImport=[{status:'maybe'},{count:2},{day:other},{loadId:idB},{kind:'crew883'}].every(change=>validateRecords({loads:{[key]:{...valid,...change}}}).some(x=>x.includes('Traffic control')));
   const prior=JSON.stringify(S),beforeBumps=bumps;
   results.invalid=[()=>traffic903Save(day,id,'maybe'),()=>traffic903Save('2026-02-30',id,'required'),()=>traffic903Save(day,day+'|deliveries|missing','required'),()=>traffic903Save(day,day+'|deliveries|'+'x'.repeat(200),'required')].every(fn=>fn()===false)&&prior===JSON.stringify(S)&&bumps===beforeBumps;
   mayWrite=()=>false;results.readonly=!traffic903Save(day,id,'not_required')&&prior===JSON.stringify(S);mayWrite=()=>true;
   whoAmI=()=>'';results.noActor=!traffic903Save(day,id,'not_required');whoAmI=()=> 'Isolated check';
   S.loads[key]={kind:'anotherKind',day,loadId:id};results.collision=!traffic903Save(day,id,'required');S.loads[key]=valid;
   const earlier={...valid,status:'required',at:'2025-01-01T00:00:00.000Z'};traffic903Save(day,id,'unknown');const reset=S.loads[key];
   results.reset=[mergeRecords({loads:{[key]:earlier}},{loads:{[key]:reset}}),mergeRecords({loads:{[key]:reset}},{loads:{[key]:earlier}})].every(x=>x.merged.loads[key].status==='unknown');
   results.words=Object.keys(TRAFFIC903_STATUS).every(status=>{S.loads[key]={...valid,status};const h=traffic903Sheet(day,a)+traffic903Editor(day,a)+traffic903DayHtml(day);return h.includes(TRAFFIC903_STATUS[status])&&!/no charge|V8s|Provided through|type="number"/i.test(h);});
   bump=()=>{bump.kept=false;};render=()=>{};const beforeFail=JSON.stringify(S.loads);results.saveFailure=!traffic903Save(day,id,'required')&&JSON.stringify(S.loads)===beforeFail;
  }finally{S=JSON.parse(before);programmeDays=original.programmeDays;dpLoads=original.dpLoads;bump=original.bump;whoAmI=original.whoAmI;mayWrite=original.mayWrite;flash=original.flash;render=original.render;}
  results.restored=JSON.stringify(S)===before;return results;
 });Object.entries(model).forEach(([name,pass])=>ok('traffic service: '+name,pass));
 const paper=await p.evaluate(()=>{
  const d=programmeDays().find(x=>x.iso==='2026-10-12'),g=dpLoads(d)[0],before=JSON.stringify(S),key=traffic903Key(d.iso,g);
  try{S.loads[key]={kind:'traffic903',day:d.iso,loadId:ldId(d,g),status:'required',by:'Isolated check',at:'2026-10-08T00:00:00.000Z'};
   return ['drv','ins'].map(doc=>{const w=document.createElement('div');w.innerHTML=dpPage(d,g,doc,1,5);return {doc,count:w.querySelectorAll('.traffic903-sheet').length,text:w.querySelector('.traffic903-sheet')?.textContent};});
  }finally{S=JSON.parse(before);}
 });ok('driver and install sheets show one simple traffic status per load',paper.every(x=>x.count===1&&x.text==='Traffic control · Required'));
 const geometry=[];
 for(const width of (process.env.MODEL_ONLY?[]:[1440,2560,3840,390])){
  await p.setViewportSize({width,height:width===390?844:1100});
  await p.evaluate(()=>{state.day='2026-10-07';state.tlView='day';go('timeline');render();});
  await p.waitForTimeout(500);
  const card=p.locator('#pane-timeline .ld[data-tl846-load]').first();await card.scrollIntoViewIfNeeded();
  const g=await p.evaluate(()=>{const e=document.querySelector('#pane-timeline .ld[data-tl846-load]'),l=e.querySelector('.tl846-layout'),main=e.querySelector('.ldl'),controls=e.querySelector('.tl846-controls'),r=x=>{const b=x.getBoundingClientRect();return {x:b.x,y:b.y,w:b.width,h:b.height};};
   return {width:innerWidth,card:r(e),layout:r(l),main:r(main),controls:r(controls),overflow:e.scrollWidth>e.clientWidth+1||document.documentElement.scrollWidth>innerWidth+1,traffic:e.querySelectorAll('.traffic903').length,lamps:e.querySelectorAll('.tl841-unit').length,summary:e.querySelector('.traffic903 summary')?.textContent,align:getComputedStyle(l).alignItems};});
  geometry.push(g);ok(width+'px: no page or card horizontal overflow',!g.overflow);ok(width+'px: traffic service and all five existing lamps retained',g.traffic===1&&g.lamps===5);ok(width+'px: centred packing replaces bottom-aligned gap',g.align==='center');
  if(width>760)ok(width+'px: controls fit in a compact card',g.card.h<440);
  await card.screenshot({path:path.join(out,'timeline-'+width+'.png')});
  await p.locator('#pane-timeline .traffic903').first().evaluate(e=>e.open=true);
  ok(width+'px: service fold stays within the viewport',await p.evaluate(()=>{const e=document.querySelector('#pane-timeline .traffic903 select'),r=e.getBoundingClientRect();return r.left>=-1&&r.right<=innerWidth+1;}));
 }
 ok('no browser errors',s.errors.length===0);ok('no operational network writes attempted',s.counts.blocked===0);
 fs.writeFileSync(path.join(out,'result.json'),JSON.stringify({checks,model,paper,geometry,errors:s.errors},null,2));checks.forEach(c=>console.log((c.pass?'PASS ':'FAIL ')+c.name));console.log(checks.filter(c=>c.pass).length+'/'+checks.length);if(checks.some(c=>!c.pass))process.exitCode=1;
}finally{if(s)await s.browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
