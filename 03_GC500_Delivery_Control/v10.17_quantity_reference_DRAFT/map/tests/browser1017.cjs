/* Author: Andrew Fisher. Current public map: exhaustive model checks and selected UI evidence. */
'use strict';
const fs=require('fs'),path=require('path'),Module=require('module');
const harness=path.resolve(__dirname,'../../../record_14Oct2026_purchase_order/readonly_page.cjs'),mod=new Module(harness,module);
mod.filename=harness;mod.paths=Module._nodeModulePaths(path.dirname(harness));
const hook=`
    if(r.method()==='GET'&&process.env.MAP_CODE&&new URL(u).origin===HOST&&['explorer.js','explorer-merge.js','index.html'].some(n=>new URL(u).pathname.endsWith('/explorer/'+n))){const name=new URL(u).pathname.split('/').pop();return route.fulfill({status:200,contentType:name.endsWith('.html')?'text/html':'application/javascript',body:fs.readFileSync(require('path').join(process.env.MAP_CODE,name))});}
    if(r.method()==='GET'&&new URL(u).origin===HOST&&/\\/explorer\\/[^/]+\\.(js|html)$/.test(new URL(u).pathname)){const fresh=new URL(u);fresh.searchParams.set('_mapRecheck',String(Date.now()));return route.fulfill(await curlFetch(fresh.href,r.headers(),'GET'));}
`;
mod._compile(fs.readFileSync(harness,'utf8').replace('    const okPost =',hook+'    const okPost ='),harness);
const {open}=mod.exports,mobile=process.env.MOB==='1',out=process.env.OUT||'/workspace/private-gc500-recheck14Oct2026/maps';fs.mkdirSync(out,{recursive:true});
let h;const report={author:'Andrew Fisher',mobile,checks:[],samples:[]};
function check(name,pass,detail){report.checks.push({name,pass:!!pass,detail});}
(async()=>{try{
 h=await open({pageFile:process.env.PAGE,hash:'#sheet/__explorer',mobile,W:mobile?390:1440,H:mobile?844:1000,dpr:mobile?2:1});const p=h.page;
 await p.waitForFunction(()=>SYNC.status==='live'&&SYNC.first.size===Object.keys(SYNC_COLLS).length,null,{timeout:120000});
 await p.waitForFunction(()=>EXP.frame&&EXP.frame.contentWindow.__ready,null,{timeout:120000});
 const f=p.frames().find(f=>/\/explorer\/index\.html(?:\?|$)/.test(f.url()));await f.evaluate(()=>GC500Explorer.ready);await f.waitForFunction(()=>!!window.GC500MapCompletion1009,null,{timeout:30000});
 await p.waitForFunction(()=>{const rows=gc500PlanItems().unplaced.filter(r=>r._supplier996MapRequest);return rows.length===2&&rows.every(r=>r.planState1017==='planned')},null,{timeout:60000});
 await f.evaluate(()=>GC500Explorer.refresh());
 const before=await p.evaluate(()=>({version:SYNC.backend.readVersion821(),record:JSON.stringify(S)}));report.version=before.version;
 const original=JSON.parse(fs.readFileSync(process.env.MAP_BASE_SNAPSHOT||'/workspace/private-gc500-recheck14Oct2026/maps/parent-private.json'));
 const preservation=await p.evaluate(base=>({unchanged:Object.keys(MASTER_LOC).filter(k=>k!=='GN?').every(k=>JSON.stringify(MASTER_LOC[k])===JSON.stringify(base[k])),pin:MASTER_LOC['GN?'].ll}),original.master);
 check('All other 166 master positions unchanged',preservation.unchanged);check('Authorised Concert geographic position unchanged',JSON.stringify(preservation.pin)===JSON.stringify(original.master['GN?'].ll));
 report.model=await f.evaluate(()=>{
  complete897Pull();const parent=window.parent,model=parent.gc500PlanItems(),active=parent.allAssets().filter(a=>!a._cancelled),normKey=k=>norm(k),by=new Map(ITEMS.map(it=>[it.code,it]));
  const quantityDiff=[],statusDiff=[],missing=[],masterDiff=[],categoryDiff=[],duplicates=[];
  const status=parent.gc500MapStatus1009(active.map(a=>a.key));
  for(const row of status.states){const it=by.get(normKey(row.key));if(!it){missing.push(row.key);continue;}const actual=mapStatus1009(it);if(actual?.state!==row.state)statusDiff.push(row.key);if(JSON.stringify(actual?.quantity1010.items)!==JSON.stringify(row.quantity.items))quantityDiff.push(row.key);}
  for(const row of model.items){const it=by.get(normKey(row.key)),b=it?.places?.[0];if(!b||Math.abs((b[0]+b[2])/2-row.pt[0]*2384)>.001||Math.abs((b[1]+b[3])/2-row.pt[1]*1684)>.001)masterDiff.push(row.key);}
  for(const cat of CATS_NOW){showCategory(cat.id);const expected=ITEMS.filter(it=>it.cat.id===cat.id&&it.places.length).map(it=>it.code).sort();const actual=marks.map(m=>m.it.code).sort();if(JSON.stringify(expected)!==JSON.stringify(actual))categoryDiff.push(cat.name);}
  for(const it of ITEMS)if(ITEMS.filter(x=>x.code===it.code).length!==1)duplicates.push(it.code);
  return {active:active.length,items:ITEMS.length,categories:CATS_NOW.length,masterEntries:model.items.length,fallbackPins:model.placed.length,unplaced:ITEMS.filter(it=>!it.places.length).length,quantityDiff,statusDiff,missing,masterDiff,categoryDiff,duplicates,invalidBounds:ITEMS.flatMap(it=>it.places.filter(b=>b.length!==4||!b.every(Number.isFinite)||b[0]<0||b[1]<0||b[2]>2384||b[3]>1684).map(()=>it.code))};
 });
 for(const k of ['quantityDiff','statusDiff','missing','masterDiff','categoryDiff','duplicates','invalidBounds'])check('All '+k+' checks',report.model[k].length===0,report.model[k]);
 const keys=['WC09','WC48','GN?','GN25','T0268','P66','T0022','T0159','EP-S7-EW49','EP-S7-EW50'];
 for(const key of keys){
  await f.evaluate(async k=>{await GC500Explorer.find(k);panel813(false)},key);await f.waitForFunction(()=>gotoAnim887===0&&zAnim===0,null,{timeout:15000});
  const value=await f.evaluate(()=>{drawMarks(currentView());return {key:selected?.code,label:selected&&referenceQuantity1010(selected,mapStatus1009(selected)),places:selected?.places,status:mapStatus1009(selected),card:document.getElementById('xcard')?.textContent,visibleCard:document.getElementById('xcard')?.innerText,detailOpen:document.querySelector('#xcard .map-source1017')?.open,planned:selected?.reg?.plannedDeliveries1017,open:document.querySelector('#xcard [data-xopen]')?.getAttribute('data-xopen'),accessible:document.getElementById('mapStatus1009')?.textContent,location:location.hash}});report.samples.push({request:key,...value});
  check(key+' selects correct reference',value.key===key.replace(/-/g,' '));
  if(key.startsWith('EP-')){const plan=await p.evaluate(k=>Supplier996.model().remaining.filter(r=>r.ref===k&&r.item==='FWF').map(r=>({date:r.date,quantity:r.remaining})),key);check(key+' planned portions exactly match Supplier996',JSON.stringify(value.planned)===JSON.stringify(plan)&&plan.length>0,{map:value.planned,shared:plan});check(key+' shows current plan while original date stays folded',value.visibleCard.includes(key.endsWith('49')?'16 Oct 2026':'17 Oct 2026')&&!value.visibleCard.includes('22 Oct 2026')&&value.detailOpen===false,value.visibleCard);check(key+' preserves requested quantity and provenance',value.status.state==='unknown'&&value.status.label==='Source request'&&value.status.quantity1010.items.length===1&&value.status.quantity1010.items[0].quantity===1&&value.status.quantity1010.items[0].completed===null&&value.card.includes('1 × FWF')&&value.card.includes('22 Oct 2026')&&!value.card.includes('In the register')&&value.places.length===0,value);}
  if(key==='GN?'){const ll=await f.evaluate(()=>{const b=selected.places[0],x=(b[0]+b[2])/2,y=(b[1]+b[3])/2,m=GEO.main.sheet_to_z18px,W=512*2**18,px=m[0][0]*x+m[0][1]*y+m[0][2],py=m[1][0]*x+m[1][1]*y+m[1][2];return [Math.atan(Math.sinh(Math.PI*(1-2*py/W)))*180/Math.PI,px/W*360-180]});check('Rendered Concert marker matches exact authorised pin',Math.abs(ll[0]+27.984576)<1e-8&&Math.abs(ll[1]-153.427700)<1e-8,ll);}
  if(key==='EP-S7-EW49')await p.screenshot({path:path.join(out,(mobile?'phone':'desktop')+'-source-request.png')});
  if(key==='WC48'||key==='GN?'){
   await f.locator('#xcard [data-xclose]').click();
   await f.waitForFunction(()=>/Drawing sharp/.test(document.getElementById('qualText')?.textContent||''),null,{timeout:60000}).catch(()=>{});
   await p.screenshot({path:path.join(out,(mobile?'phone':'desktop')+'-'+(key==='GN?'?'concert':'wc48')+'-label.png')});
  }
 }
 await f.evaluate(async()=>{await GC500Explorer.find('EP-S7-EW49')});
 await f.locator('#xcard .map-source1017 > summary').click();
 const camera=await f.evaluate(()=>JSON.stringify(GC500Explorer.state.view));
 await p.evaluate(()=>{window.__plan1017=window.gc500PlanItems;window.gc500PlanItems=function(){const m=window.__plan1017();return {...m,unplaced:m.unplaced.map(r=>r.key==='EP-S7-EW49'?{...r,quantity:3,plannedDeliveries1017:[{date:'2026-10-19',quantity:3}]}:r)}};});
 await f.evaluate(()=>GC500Explorer.refresh());
 await f.waitForFunction(()=>document.getElementById('xcard')?.textContent.includes('3 × FWF'),null,{timeout:15000});
 check('Open source request card refreshes date and preserves More info',await f.evaluate(()=>document.getElementById('xcard').innerText.includes('19 Oct 2026')&&document.querySelector('#xcard .map-source1017').open));
 check('Open source request card refreshes quantity without moving camera',await f.evaluate(c=>JSON.stringify(GC500Explorer.state.view)===c,camera));
 await p.evaluate(()=>{window.gc500PlanItems=window.__plan1017;delete window.__plan1017});await f.evaluate(()=>GC500Explorer.refresh());
 await f.evaluate(async()=>{await GC500Explorer.find('WC09')});await f.locator('#xcard [data-xopen]').click();
 await p.waitForFunction(()=>location.hash.includes('WC09'),null,{timeout:15000});
 const route=await p.evaluate(()=>({hash:location.hash,tab:state.tab,asset:state.asset}));check('Open record retains selected WC09 scope',route.hash.includes('WC09'),route);
 await p.evaluate(()=>expFind('WC09'));await f.evaluate(()=>GC500Explorer.ready);await f.evaluate(()=>GC500FencingMap.open());
 report.fencing=await f.evaluate(()=>({state:GC500FencingMap.state,text:document.getElementById('fmSummary')?.textContent,list:document.getElementById('fmList')?.textContent,alert:document.getElementById('fmAlert')?.textContent}));
 const fence=await p.evaluate(()=>gc500FencingMapSnapshot());fs.writeFileSync(path.join(out,'fencing-private.json'),JSON.stringify(fence,null,2));
 check('Fencing geometry not rejected',report.fencing.state.rejected.length===0,report.fencing.state);
 check('No native state changed',await p.evaluate(s=>JSON.stringify(S)===s,before.record));check('No operational write attempts',h.counts.blocked===0,h.counts);check('No browser errors',h.errors.length===0,h.errors);
}catch(e){report.failure=String(e.stack||e);process.exitCode=1;}finally{if(report.checks.some(x=>!x.pass))process.exitCode=1;if(h){report.counts=h.counts;report.errors=h.errors;await h.browser.close()}fs.writeFileSync(path.join(out,(mobile?'phone':'desktop')+'-browser.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({mobile,version:report.version,model:report.model,checks:report.checks.length,failed:report.checks.filter(x=>!x.pass),failure:report.failure}));}})();
