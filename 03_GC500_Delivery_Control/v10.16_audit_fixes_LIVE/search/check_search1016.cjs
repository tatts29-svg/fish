/* Author: Andrew Fisher. GET-only finder and drawer checks using current saved records. */
'use strict';
const fs=require('node:fs'),path=require('node:path'),{open}=require('../../record_14Oct2026_purchase_order/readonly_page.cjs');
(async()=>{let h;try{
 h=await open({pageFile:process.env.PAGE,hash:'#today',mobile:true,W:390,H:844});
 await h.page.waitForFunction(()=>SYNC.status==='live'&&SYNC.first.size===Object.keys(SYNC_COLLS).length,null,{timeout:180000});
 await h.page.waitForFunction(()=>photoIndex().state==='ready',null,{timeout:180000});
 const result=await h.page.evaluate(()=>holdAssets(()=>{
  const checks=[],ck=(name,pass)=>checks.push({name,pass:!!pass}),before=JSON.stringify(S),version=SYNC.backend.readVersion821();
  const matches=query=>finderMatches(query).filter(r=>r.kind==='unit'&&r.no===query),index=finderIndex();
  ck('Replacement fridge search gives current P46 only',matches('1272751').map(r=>r.key).join()==='P46');
  ck('Moved fridge search gives current P54 only',matches('1328957').map(r=>r.key).join()==='P54');
  ck('Wrong removed toilet number stays absent',matches('0689').length===0);
  for(const no of ['1318501','1260164','1283996','1311992'])ck('Confirmed T0265 fridge '+no+' still findable',matches(no).some(r=>r.key==='T0265'));
  ck('Leading-zero EP unit remains exact',matches('0008').some(r=>r.key==='WC57'&&r.no==='0008'));
  ck('Search results do not imply zero-stripped asset identity',!matches('8').some(r=>r.key==='WC57'));
  const active=allAssets().filter(a=>!a._cancelled&&!a._movedTo&&!movedAway(a.key)).flatMap(a=>(a.accessories||[]).filter(x=>x.asset_no&&x._accId&&x.active!==false).map(x=>({ref:a.key,no:x.asset_no})));
  ck('Every current numbered accessory has a matching finder result',active.every(x=>index.some(i=>i.kind==='unit'&&i.key===x.ref&&i.no===x.no)));
  ck('No duplicate reference/number unit entries introduced',new Set(index.filter(r=>r.kind==='unit'&&r.no).map(r=>JSON.stringify([r.key,AccessorySearch1016.normal(r.no)]))).size===index.filter(r=>r.kind==='unit'&&r.no).length);
  let builds=0;const original=buildAllAssets;buildAllAssets=function(){builds++;return original.apply(this,arguments);};
  try{finderIndex();finderIndex();}finally{buildAllAssets=original;}
  ck('Repeated finder reads reuse held current asset snapshot',builds===0);
  ck('Finder does not edit native state or its version',before===JSON.stringify(S)&&version===SYNC.backend.readVersion821());
  return {author:'Andrew Fisher',nativeVersion:version,checks,accessories:active.length};
 }));
 for(const [query,ref]of [['1272751','P46'],['1328957','P54'],['1318501','T0265'],['0008','WC57']]){
  const state=await h.page.evaluate(async ({query,ref})=>{
   const before=JSON.stringify(S),version=SYNC.backend.readVersion821();
   holdAssets(()=>finderOpen_held(query));const entry=FINDER.list.findIndex(r=>r.kind==='unit'&&r.no===query&&r.key===ref);
   if(entry<0)return{found:false};const selected=FINDER.list[entry];finderPick(entry);
   await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
   const drawer=document.getElementById('drawer'),target=selected.accessoryId1016?[...drawer.querySelectorAll('[data-accessory1016]')].find(el=>el.dataset.accessory1016===selected.accessoryId1016):[...drawer.querySelectorAll('[data-unit925-id]')].find(el=>el.dataset.unit925Id===selected.unitId1006);
   const ancestors=[];for(let p=target?.parentElement;p&&p!==drawer;p=p.parentElement)if(p.tagName==='DETAILS')ancestors.push(p.open);
   return {found:true,ref:state.sel,open:drawer.classList.contains('on'),highlight:!!target?.classList.contains('profile1006-selected'),visible:!!target?.getClientRects().length,foldsOpen:ancestors.every(Boolean),clearQuery:state.q===''&&FINDER.list.length===0,unchanged:before===JSON.stringify(S)&&version===SYNC.backend.readVersion821()};
  },{query,ref});
  result.checks.push({name:query+' opens highlighted current '+ref+' record',pass:state.found&&state.ref===ref&&state.open&&state.highlight&&state.visible&&state.foldsOpen,detail:state});
  result.checks.push({name:query+' selection clears finder without a native mutation',pass:state.clearQuery&&state.unchanged});
 }
 const retained=await h.page.evaluate(()=>{
  holdAssets(()=>finderOpen_held('1272751'));finderPick(FINDER.list.findIndex(r=>r.no==='1272751'&&r.key==='P46'));
  openAsset('P46',{keep:true});
  const selected=document.querySelector('#drawer [data-accessory1016].profile1006-selected');
  return state.sel==='P46'&&selected?.textContent.includes('1272751');
 });
 result.checks.push({name:'Shared drawer refresh retains the selected contents highlight',pass:retained});
 const out=process.env.OUT||'/workspace/private-gc500-audit14Oct2026/operations/search-checks';fs.mkdirSync(out,{recursive:true});
 await h.page.evaluate(()=>{holdAssets(()=>finderOpen_held('1272751'));finderPick(FINDER.list.findIndex(r=>r.no==='1272751'&&r.key==='P46'));});
 await h.page.screenshot({path:path.join(out,'selected-fridge-phone.png'),fullPage:false});
 result.checks.push({name:'No browser errors or attempted operational writes',pass:!h.errors.length&&!h.counts.blocked});
 Object.assign(result,{errors:h.errors,requests:h.counts});fs.writeFileSync(path.join(out,'search-checks.json'),JSON.stringify(result,null,2)+'\n');
 console.log(JSON.stringify({nativeVersion:result.nativeVersion,checks:result.checks.length,failed:result.checks.filter(c=>!c.pass),accessories:result.accessories,errors:h.errors,requests:h.counts}));
 if(result.checks.some(c=>!c.pass))process.exitCode=1;
 }finally{if(h)await h.browser.close();}})().catch(e=>{console.error(e.stack);process.exitCode=1;});
