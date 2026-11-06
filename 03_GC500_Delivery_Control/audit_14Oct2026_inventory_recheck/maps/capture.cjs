/* Author: Andrew Fisher. Read-only complete map/reference capture. */
'use strict';
const fs=require('fs'),path=require('path'),crypto=require('crypto');
const Module=require('module');
const harness=path.resolve(__dirname,'../../record_14Oct2026_purchase_order/readonly_page.cjs'),mod=new Module(harness,module);
mod.filename=harness;mod.paths=Module._nodeModulePaths(path.dirname(harness));
const hs=fs.readFileSync(harness,'utf8');
const hook=`
    if(r.method()==='GET'&&new URL(u).origin===HOST&&/\\/explorer\\/[^/]+\\.(js|html)$/.test(new URL(u).pathname)){const fresh=new URL(u);fresh.searchParams.set('_mapRecheck',String(Date.now()));return route.fulfill(await curlFetch(fresh.href,r.headers(),'GET'));}
`;
mod._compile(hs.replace('    const okPost =',hook+'    const okPost ='),harness);
const {open}=mod.exports;
const out=process.env.OUT||'/workspace/private-gc500-recheck14Oct2026/maps';
fs.mkdirSync(out,{recursive:true});
let h;
(async()=>{try{
 h=await open({pageFile:process.env.PAGE,hash:'#sheet/__explorer',W:1440,H:1000});const p=h.page;
 await p.waitForFunction(()=>SYNC.status==='live'&&SYNC.first.size===Object.keys(SYNC_COLLS).length,null,{timeout:120000});
 await p.waitForFunction(()=>EXP.frame&&EXP.frame.contentWindow.__ready,null,{timeout:120000});
 const f=p.frames().find(f=>/\/explorer\/index\.html(?:\?|$)/.test(f.url()));await f.evaluate(()=>GC500Explorer.ready);await f.waitForFunction(()=>!!window.GC500MapCompletion1009,null,{timeout:30000});
 const parent=await p.evaluate(()=>({version:SYNC.backend.readVersion821(),assets:allAssets(),sheets:DATA.sheets,master:MASTER_LOC,layers:MASTER_LAYERS,mapLayers:MAP_LAYERS,model:gc500PlanItems(),status:gc500MapStatus1009(allAssets().map(a=>a.key)),cards:allAssets().map(a=>({key:a.key,card:gc500PlanCard(a.key),master:masterUnit(a.key),fix:fixOf(a.key)})),fixes:S.fixes,places:S.places}));
 fs.writeFileSync(path.join(out,'parent-private.json'),JSON.stringify(parent,null,2));
 const frame=await f.evaluate(()=>({url:location.href,items:ITEMS,cats:CATS_NOW,geo:GEO,pyr:PYR,labels:P,register:REG,snapshot:PLAN_SNAP,host:HOST,underlay:UNDER,state:GC500Explorer.state,status:GC500MapCompletion1009.state,allStatus:ITEMS.map(it=>({key:it.code,status:mapStatus1009(it),quantityLabel:referenceQuantity1010(it,mapStatus1009(it))})),dom:{chips:document.getElementById('chips').textContent,modes:Array.from(document.querySelectorAll('[data-mode]')).map(x=>({text:x.textContent,mode:x.dataset.mode}))}}));
 fs.writeFileSync(path.join(out,'frame-private.json'),JSON.stringify(frame,null,2));
 const samples=[];
 for(const key of ['WC09','WC48','P66','GN06','GN? Concert','VMS01']){
  const result=await f.evaluate(k=>{const hit=GC500Explorer.find(k);return {hit,selected:selected?.code,card:document.getElementById('xcard')?.textContent,status:document.getElementById('mapStatus1009')?.textContent}},key);samples.push({key,...result});
 }
 for(const c of frame.cats){
  const r=await f.evaluate(id=>{showCategory(id);return {id,marks:marks.map(m=>m.it.code),text:document.getElementById('findList').textContent,selected:selected?.code}},c.id);fs.writeFileSync(path.join(out,'category-'+c.id+'.json'),JSON.stringify(r,null,2));
 }
 await f.evaluate(()=>{GC500Explorer.find('WC09');panel813(false)});await p.waitForTimeout(900);await p.screenshot({path:path.join(out,'desktop-wc09.png')});
 await p.setViewportSize({width:390,height:844});await f.evaluate(()=>{GC500Explorer.find('WC48');panel813(false)});await p.waitForTimeout(900);await p.screenshot({path:path.join(out,'phone-wc48.png')});
 fs.writeFileSync(path.join(out,'capture.json'),JSON.stringify({author:'Andrew Fisher',version:parent.version,samples,errors:h.errors,counts:h.counts},null,2));
 console.log(JSON.stringify({version:parent.version,assets:parent.assets.length,sheets:parent.sheets.length,items:frame.items.length,cats:frame.cats.length,errors:h.errors,counts:h.counts}));
}finally{if(h)await h.browser.close()}})().catch(e=>{console.error(e.stack);process.exitCode=1});
