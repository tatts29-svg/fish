/* Author: Andrew Fisher. Native photo equality and invalidation; fixtures never leave the browser. */
'use strict';
const assert=require('node:assert/strict'),fs=require('fs');
const {openCandidate}=require('./browser_harness.cjs');
async function capture(pageFile){
 process.env.PAGE=pageFile;process.env.HASH='#today';const s=await openCandidate();
 try{return {result:await s.page.evaluate(()=>{
  const copy=x=>JSON.parse(JSON.stringify(x)),same=(a,b)=>JSON.stringify(a)===JSON.stringify(b),checks=[],check=(ok,name)=>checks.push({ok:!!ok,name});
  const saved=copy(S),before=JSON.stringify(S),sender=syncSend,write=mayWrite,cap=capability,readonly=SYNC.readonly,level=SYNC.level,queue=copy(SYNC.queue),last=copy(SYNC.last),confirm=window.confirm;
  const who=document.querySelector('#who'),oldWho=who&&who.value,actor='Synthetic photo reviewer',snapshots={};
  const tidy=photos=>copy(photos).map(p=>{if(p.area1090?.at)p.area1090.at='fixture-time';return p;});
  const refs=[...new Set([...Object.keys(S.dropPhotos||{}),...Object.values(S.photoLinks||{}).flatMap(p=>AreaPhotos1090.linkedRefs(p))])].sort();
  snapshots.existing=holdAssets(()=>Object.fromEntries(refs.map(ref=>[ref,copy(dropPhotosOf(ref))])));
  try{
   syncSend=function(){clearTimeout(SYNC.timer);SYNC.timer=null;};mayWrite=()=>true;capability=()=> 'edit';SYNC.readonly=false;SYNC.level='edit';S.operator=actor;if(who)who.value=actor;window.confirm=()=>true;
   const opts=AreaPhotos1090.options().filter(t=>t.scope==='reference'),a=opts[0].ref,b=opts.find(t=>t.ref!==a).ref;
   const target=copy(opts.find(t=>t.ref===b)),normal='SYNTHETIC-PHOTO-1241',area='SYNTHETIC-AREA-1241',legacy='SYNTHETIC-LEGACY-1241';
   S.dropPhotos={...(S.dropPhotos||{}),[a]:{photos:[{id:legacy,name:'fixture legacy.jpg',slot:0,caption:'Legacy fixture'}]}};
   sharedCache975();
   holdAssets(()=>{
    const take=name=>snapshots[name]={a:tidy(dropPhotosOf(a)),b:tidy(dropPhotosOf(b))};
    take('legacy');check(dropPhotosOf(a).some(p=>p.id===legacy),'legacy photograph remains visible');
    const original=copy(dropPhotosOf(a)),draw=dropPhotosOf(a);draw.push({id:'MUTATED-ARRAY'});if(draw[0])draw[0].caption='MUTATED-FIELD';
    check(same(dropPhotosOf(a),original),'returned array and photo-field mutations cannot poison later readers');
    photoLinkPut({id:normal,name:'fixture normal.jpg',ref:a,slot:1,caption:'Original caption',at:'2030-01-01T00:00:00Z'},actor);
    take('added');check(dropPhotosOf(a).some(p=>p.id===normal),'native photo put is visible within the same asset hold before save');
    photoLinkPut({id:normal,caption:'Changed caption'},actor);take('changed');check(dropPhotosOf(a).find(p=>p.id===normal)?.caption==='Changed caption','same-hold native update replaces cached photo content');
    photoLinkRemove(a,S.photoLinks[normal],actor,'Synthetic removal');take('removed');check(!dropPhotosOf(a).some(p=>p.id===normal),'same-hold native removal does not leave a stale photo');
    photoLinkPut({id:area,name:'fixture area.jpg',ref:a,slot:2,caption:'Area fixture',area1090:{version:1,label:'Synthetic area',targets:[target],by:actor,at:'2030-01-01T00:00:00Z'}},actor);
    take('area');check(dropPhotosOf(a).some(p=>p.id===area)&&dropPhotosOf(b).some(p=>p.id===area),'shared area photograph appears at owner and linked reference');
    const current=copy(S.photoLinks[area]);
    AreaPhotos1090.drafts.set(a,{ref:a,owner:a,id:area,base:AreaPhotos1090.normalize(current),expected:JSON.stringify(current),stamp:(S.stamps||{})['photoLinks/'+area]||null,actor,label:'Synthetic area',selected:new Map(),primaryDetached:false});
    check(AreaPhotos1090.save(a),'native area editor accepts removal of an existing association');take('area-unlinked');
    check(dropPhotosOf(a).some(p=>p.id===area)&&!dropPhotosOf(b).some(p=>p.id===area),'area unlink preserves owner and removes only the other reference');
    const current2=copy(S.photoLinks[area]);
    AreaPhotos1090.drafts.set(a,{ref:a,owner:a,id:area,base:AreaPhotos1090.normalize(current2),expected:JSON.stringify(current2),stamp:(S.stamps||{})['photoLinks/'+area]||null,actor,label:'Synthetic area',selected:new Map(),primaryDetached:false});
    check(AreaPhotos1090.removeWhole(a),'native area removal accepts disposable fixture');take('area-removed');
    check(!dropPhotosOf(a).some(p=>p.id===area)&&!dropPhotosOf(b).some(p=>p.id===area),'removed area photograph remains absent everywhere');
    SYNC.readonly=true;SYNC.queue={};const docs=copy(toDocs('photoLinks'));
    docs[docIdOf(area)]={...current,_k:area};check(syncFold('photoLinks',docs),'native remote fold accepts changed photo evidence');take('remote-restored');
    check(dropPhotosOf(a).some(p=>p.id===area)&&dropPhotosOf(b).some(p=>p.id===area),'remote fold refreshes both owner and shared-area projections inside a hold');
    const unchanged=REC_EPOCH1066;check(!syncFold('photoLinks',docs)&&REC_EPOCH1066===unchanged,'identical photo polling retains stable record state');
   });
  }finally{
   Object.keys(S).forEach(k=>delete S[k]);Object.assign(S,copy(saved));SYNC.queue=queue;SYNC.last=last;sharedCache975();syncSend=sender;mayWrite=write;capability=cap;SYNC.readonly=readonly;SYNC.level=level;window.confirm=confirm;if(who)who.value=oldWho;
  }
  check(JSON.stringify(S)===before,'entire browser record restored after photo fixtures');return {checks,snapshots};
 }),errors:s.errors.length,writes:s.counts.blocked};}finally{await s.browser.close();}
}
(async()=>{
 assert(process.env.BASE&&process.env.PAGE&&process.env.STATE,'BASE, PAGE and STATE must select exact frozen pages and record');
 const candidate=process.env.PAGE,base=await capture(process.env.BASE),next=await capture(candidate);
 const checks=next.result.checks.concat([{ok:base.result.checks.every(c=>c.ok),name:'all native fixture semantics also pass on the unchanged baseline'},{ok:JSON.stringify(base.result.snapshots)===JSON.stringify(next.result.snapshots),name:'all existing and legacy/area/unlinked/removed projections exactly match baseline'},{ok:base.errors===0&&next.errors===0,name:'zero baseline or candidate runtime errors'},{ok:base.writes===0&&next.writes===0,name:'zero HTTP write attempts'}]);
 const pass=checks.filter(c=>c.ok).length;for(const c of checks)console.log((c.ok?'PASS ':'FAIL ')+c.name);console.log(pass+'/'+checks.length+' photo checks');if(process.env.REPORT)fs.writeFileSync(process.env.REPORT,JSON.stringify({author:'Andrew Fisher',checks,base,candidate:next},null,2));process.exitCode=pass===checks.length?0:1;
})().catch(e=>{console.error('FAIL '+e.stack);process.exitCode=1;});
