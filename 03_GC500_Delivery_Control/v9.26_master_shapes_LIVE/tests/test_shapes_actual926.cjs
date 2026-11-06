/* Author: Andrew Fisher. Real Arrange loads renderer and native save, all network writes refused. */
const fs=require('fs'),path=require('path'),assert=require('assert');
const {open}=require('/workspace/gc500-shapes926/03_GC500_Delivery_Control/toolchain/harness/open_page');
const pageFile=process.env.PAGE||'/workspace/private-shapes926/candidate.html',out=process.env.EVIDENCE_DIR||'/workspace/private-shapes926/actual';fs.mkdirSync(out,{recursive:true});
(async()=>{
 const results=[];
 for(const W of [1440,390]){
  const s=await open({pageFile,hash:'#timeline',W,H:W===390?844:1000,mobile:W===390,gl:true});const p=s.page;
  await p.context().route('**/*',route=>{const r=route.request();return ['GET','HEAD'].includes(r.method())?route.fallback():route.abort();});
  try{
   await p.waitForFunction(()=>window.GC500Refresh904?.report().settled&&SYNC.status==='live',null,{timeout:60000});
   const setup=await p.evaluate(()=>{
    window.__shape926Writes=0;window.__shape926Record=JSON.stringify(S);window.__shape926ReadBump=0;window.bump=function(){window.__shape926ReadBump++;throw Error('Opening shapes must not save');};
    // Temporary fixture adapter on this v920 base; final combined tests use native gcUnits925.
    if(typeof gcUnits925!=='function')window.gcUnits925=a=>loading872Rows(a).filter(r=>r.no).map(r=>({id:'fixture/'+a.key+'/'+r.no,ref:a.key,physical:true,assetNo:r.no,item:r.item,label:r.item,loadingId:r.id}));
    const eligible=g=>g.kind==='deliveries'&&g.rows.some(r=>{const units=gcUnits925(r.a);return units.length>0&&units.length<=4&&units.every(u=>u.loadingId)&&MasterShapes926.shape(r.a.key)?.components.some(c=>c.source==='master');});
    const days=programmeDays(),day=days.find(d=>dpLoads(d).some(eligible));if(!day)throw Error('No known physical loading unit is available for this captured fixture');const group=dpLoads(day).find(eligible),loadId=ldId(day,group);
    state.day=day.iso;state.tlView='day';go('timeline');render();const p03=days.flatMap(d=>dpLoads(d).flatMap(g=>g.rows.filter(r=>r.a.key==='P03').map(r=>({day:d.iso,markers:Object.keys(r.a).filter(k=>k.startsWith('_')),bookingNumbers:r.a._bookingNumbers801,buildingNumbers:buildingNumbersOf(r.a),loading:loading872Rows(r.a).map(u=>u.no)})))).slice(0,3);return {day:day.iso,loadId,p03};
   });
   await p.locator('[data-drop911-open]').first().click();
   await p.waitForFunction(()=>Drops911.report().status==='ready',null,{timeout:90000});
   const loadId=setup.loadId;
   await p.evaluate(id=>document.querySelectorAll('[data-drop911-select]').forEach(e=>{if(e.dataset.drop911Select===id)e.click();}),loadId);
   await p.waitForSelector('.shape926-unit',{timeout:8000}).catch(async error=>{fs.writeFileSync(path.join(out,'debug-'+W+'.json'),JSON.stringify(await p.evaluate(()=>{const r=Drops911.report(),d=programmeDays().find(d=>d.iso===r.day);return {report:r,shape:document.querySelector('.shapes926')?.outerHTML,groups:dpLoads(d).map(g=>({id:ldId(d,g),refs:g.rows.map(r=>({key:r.a.key,booked:r.a._bookingNumbers801,units:gcUnits925(r.a),native:loading872Rows(r.a)}))})),api:typeof Shapes926};}),null,2));await p.screenshot({path:path.join(out,'debug-'+W+'.png')});throw error;});
   await p.locator('[data-drop911-focus]').click();await p.waitForTimeout(1200);
   const read=await p.evaluate(()=>({units:document.querySelectorAll('.shape926-unit').length,shapes:document.querySelectorAll('.shape926-overlay [data-shape926-map-ref]').length,readonly:[...document.querySelectorAll('[data-shape926-door]')].every(x=>x.disabled),overflow:document.documentElement.scrollWidth>innerWidth+1,recordSame:JSON.stringify(S)===window.__shape926Record,viewWrites:__shape926ReadBump}));
   assert(read.units>0);assert(read.shapes>0);assert(read.readonly);assert(!read.overflow);assert.equal(read.viewWrites,0);
   await p.locator('.shapes926').scrollIntoViewIfNeeded();await p.screenshot({path:path.join(out,'shapes-'+W+'.png')});
   if(W===1440){
    await p.evaluate(()=>{window.capability=()=> 'edit';window.mayWrite=()=>true;window.whoAmI=()=> 'Andrew Fisher via test capture';SYNC.readonly=false;SYNC.level='edit';SYNC.db.doc=()=>({set:()=>{throw Error('Network write prohibited');},update:()=>{throw Error('Network write prohibited');}});window.bump=function(){window.__shape926Writes++;bump.kept=true;};document.querySelector('.shapes926').__shape926Signature=null;document.querySelector('.shapes926').__shape926Selection=null;const r=Drops911.report();Shapes926.panel(document.querySelector('.drops911'),r.model,r.selected);});
    const field=p.locator('[data-shape926-door]').first(),previous=await field.inputValue(),value=previous==='driver'?'passenger':'driver';
    const before=await p.evaluate(()=>JSON.stringify(S.loads));
    await field.selectOption(value);
    const save=await p.evaluate(()=>({writes:__shape926Writes,value:document.querySelector('[data-shape926-door]').value,text:document.querySelector('[data-shape926-door]').closest('.shape926-unit').querySelector('[data-shape926-feedback]').textContent,loads:JSON.stringify(S.loads),native:loading872Side(assetOf(document.querySelector('[data-shape926-door]').dataset.shape926Ref),gcUnits925(assetOf(document.querySelector('[data-shape926-door]').dataset.shape926Ref)).find(u=>u.id===document.querySelector('[data-shape926-door]').dataset.shape926Id).loadingId)}));
    assert.equal(save.writes,1);assert.equal(save.value,value);assert.equal(save.native,value);assert.equal(save.loads,before);assert.equal(save.text,'Loading side saved.');
    await p.evaluate(()=>{bump=function(){window.__shape926Writes++;bump.kept=false;};});
    await field.selectOption(previous);
    assert((await field.evaluate(e=>e.closest('.shape926-unit').querySelector('[data-shape926-feedback]').textContent)).includes('not saved'));
    assert.equal(await p.evaluate(()=>__shape926Writes),2);
    const bad=await p.evaluate(()=>{const el=document.querySelector('[data-shape926-door]');return Shapes926.saveDoor(el.dataset.shape926Ref,el.dataset.shape926Id,'driver','not-the-current-side');});assert(!bad.accepted);
   }
   const folded=await p.evaluate(()=>{const original=gcUnits925;window.gcUnits925=a=>{const rows=original(a);return rows.length?Array.from({length:6},(_,i)=>({...rows[0],id:'fold-fixture-'+i,loadingId:null,assetNo:''})):rows;};const box=document.querySelector('.shapes926');box.__shape926Selection=null;box.__shape926Signature=null;const r=Drops911.report();Shapes926.panel(document.querySelector('.drops911'),r.model,r.selected);const detail=document.querySelector('.shape926-many'),result={exists:!!detail,open:detail?.open,summary:detail?.querySelector('summary').textContent,rows:detail?.querySelectorAll('.shape926-unit').length};window.gcUnits925=original;return result;});
   assert(folded.exists&&!folded.open&&folded.rows===6&&folded.summary.startsWith('6 units'));
   await p.locator('.shape926-many>summary').first().click();assert(await p.locator('.shape926-many').first().evaluate(e=>e.open));
   results.push({width:W,setup,read,folded,errors:s.errors,blocked:s.counts.blocked});assert.equal(s.errors.length,0);
  }finally{await s.browser.close();}
 }
 fs.writeFileSync(path.join(out,'results.json'),JSON.stringify(results,null,2));console.log(JSON.stringify(results));
})().catch(e=>{console.error(e);process.exitCode=1;});
