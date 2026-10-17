// Author: Andrew Fisher. Independent native quantity and reference checks for compact Today rows.
// Runtime figures are written only to callers' private evidence directories.
'use strict';
const {typeInputs843,typeOracle843,identity}=require('../v8.43_type_instruments_LIVE/test_type_oracle843.cjs');
const {linkedEvidence844,safeURL}=require('../v8.44_linked_completion_LIVE/test_linked_oracle844.cjs');
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b),finite=n=>typeof n==='number'&&Number.isFinite(n);
const matches=(got,want)=>!!got&&Object.keys(want).every(k=>same(got[k],want[k]));
async function evidence846(page,day,independent=false){
 const actual=await linkedEvidence844(page,day);
 return {actual,expected:independent?typeOracle843(await typeInputs843(page,day)):null};
}
function assertModel846(check,label,{actual:e,expected}){
 if(!expected)throw Error('Independent native oracle required');
 const assets=e.types.instruments.filter(t=>t.kind==='asset-type'),fences=e.types.instruments.filter(t=>t.kind==='fence-work');
 check(label+' every native asset and Build work type has exactly one owner',same(assets.map(identity).sort(),expected.instruments.map(identity).sort())&&same(fences.map(t=>t.fenceId).sort(),expected.fencing.map(t=>t.id).sort())&&new Set(e.types.instruments.map(t=>t.id)).size===e.types.instruments.length&&e.types.health.ready&&e.types.coverage.allRepresented,{assetTypes:assets.length,fenceTypes:fences.length,coverage:e.types.coverage});
 for(const [id,want] of Object.entries(expected.summary.byId)){
  const {plan,...scalars}=want,got=e.summary.byId[id];
  check(label+' '+id+' headline retains native quantity scope and review qualification',matches(got,scalars)&&(!plan||matches(got.plan,plan)),{expected:want,actual:got});
 }
 for(const want of expected.instruments){
  const got=assets.find(t=>identity(t)===identity(want)),keys=['cardId','groupId','name','unit','total','knownTotal','scheduleTotal','done','left','pct','pctKind','onSite','reviewQuantity','reviewRefs','keys'];
  check(label+' '+want.groupId+' / '+want.name+' quantities, member plan and reference rows reconcile independently',got&&keys.every(k=>same(got[k],want[k]))&&matches(got.plan,want.plan)&&same(got.rows.map(r=>r.key),want.rows.map(r=>r.key))&&want.rows.every(r=>matches(got.rows.find(g=>g.key===r.key),r))&&got.unquantifiedRefs===want.unknownKeys.length,{expected:want,actual:got});
 }
 for(const want of expected.fencing){const got=fences.find(t=>t.fenceId===want.id);check(label+' '+want.id+' retains separate Build units and dated plan',got&&['unit','total','done','left','pct'].every(k=>same(got[k],want[k]))&&matches(got.plan,want.plan),{expected:want,actual:got});}
 const native=new Map(e.native.map(r=>[r.key,r]));
 const invalid=e.linked.rows.filter(r=>{const n=native.get(r.key),ph=new Map(n?.photos.map(p=>[p.id,p]));return !n||!r.found||r.current.done!==n.current.done||r.current.state!==n.current.state||r.current.stage!==n.current.stage||r.current.label!==n.current.label||r.actions.referenceKey!==r.key||r.actions.mapKey&&r.actions.mapKey!==r.key||!same(r.photos.map(p=>p.id).sort(),n.photos.map(p=>p.id).sort())||r.photos.some(p=>{const q=ph.get(p.id);return !q||p.availability!==q.media.state||p.unit!==q.unit||p.slot!==q.slot||p.source!==q.source||(p.availability==='ready'?p.src!==q.media.thumb||!safeURL(p.fullSrc)||p.fullSrc!==q.media.url:!!p.src||!!p.fullSrc);});});
 check(label+' linked references preserve current native status, exact actions and photo provenance',e.linked.ready&&same(e.linked.rows.map(r=>r.key),e.native.map(r=>r.key))&&new Set(e.linked.rows.map(r=>r.key)).size===e.linked.rows.length&&!invalid.length,{references:e.linked.rows.length,invalid});
}
module.exports={evidence846,assertModel846,same,finite,matches};
