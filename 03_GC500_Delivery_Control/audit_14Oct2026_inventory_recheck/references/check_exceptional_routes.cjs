/* Author: Andrew Fisher. Read-only exceptional reference/link rendering checks. */
'use strict';
const fs=require('fs'),path=require('path');
const {open}=require('../../record_14Oct2026_purchase_order/readonly_page.cjs');
const PAGE=process.env.PAGE,OUT=process.env.OUT;
if(!PAGE||!OUT)throw Error('PAGE and private OUT required');
const refs=['P33','P54','WC57','WC53','WC51','WC48','WC49','WC54','WC09','WC31','T0265','T0266','GN?','GN20','FL01','FL02','T0003','T0004','T0001','T0103','T0159','NVLT','LT01','LTC01','P27'];
(async()=>{
 const h=await open({pageFile:PAGE,mobile:true,W:390,H:844}),rows=[];
 try{
  await h.page.waitForFunction(()=>SYNC.status==='live'&&GC500Refresh904.report().settled&&Routes1016.ready(),null,{timeout:180000});
  const initial=await h.page.evaluate(()=>JSON.stringify(S));
  const context=await h.page.evaluate(()=>holdAssets(()=>{
   const aliases=physicalCountAssets963(allAssets());
   return {aliases:{keys:aliases.assets.map(a=>a.key),aliases:aliases.aliases,pending:aliases.pending},
    excluded:[...DATA.assets,...PLANT_LINES,...(S.added||[])].filter(a=>!allAssets().some(b=>a.key===b.key)).map(a=>({key:a.key,deleted:assetDeleted(a.key),context:!!lighting894Context(a.key),resolved:assetOf(a.key)?.key||null,search:finderMatches(a.key).map(r=>({kind:r.kind,key:r.key}))})),
    supplier:Supplier996.requests.map(r=>({id:r.id,state:Supplier996.resolveRequest(r).state,source:Supplier996.requestAsset(r.id),schedule:programmeDays().flatMap(d=>d.deliveries.filter(x=>x.a.key===r.id).map(x=>({day:d.iso,card:dayCard(x.a)})))})),
    sourceExtras:{orphan:DATA.orphan_rows,unreferenced:DATA.unreferenced,sourceTasks:DATA.plant_lines.fencing_rows_not_plant},
   };
  }));
  for(const ref of refs){
   await h.page.evaluate(ref=>{location.hash='#asset/'+encodeURIComponent(ref);},ref);
   await h.page.waitForTimeout(180);
   const row=await h.page.evaluate(ref=>({ref,hash:location.hash,selected:state.sel,drawer:document.querySelector('#drawer').classList.contains('on'),text:document.querySelector('#drawer').innerText,close:!!document.querySelector('#drawer [data-nav934-back]'),asset:assetOf(ref)?.key||null}),ref);
   row.pass=row.drawer&&row.selected===ref&&row.close;
   rows.push(row);console.log(JSON.stringify({ref,pass:row.pass}));
  }
  const viewChecks=[];
  for(const day of ['2026-10-16','2026-10-17']){
   await h.page.evaluate(day=>{location.hash='#day/'+day;},day);await h.page.waitForTimeout(250);
   viewChecks.push(await h.page.evaluate(day=>({day,tab:state.tab,daySelected:state.day,links:[...document.querySelectorAll('.pane.on [data-open],.pane.on a[href]')].map(b=>({key:b.dataset.open||'',href:b.getAttribute('href')||'',text:b.innerText})).filter(x=>(x.key+x.href).includes('EP-S7')),sourceNames:document.querySelector('.pane.on').innerText.includes(day==='2026-10-16'?'Brad Jones':'Shell V-Power')}),day));
  }
  const final=await h.page.evaluate(()=>JSON.stringify(S));
  fs.writeFileSync(path.join(OUT,'exceptional-routes.json'),JSON.stringify({author:'Andrew Fisher',rows,context,viewChecks,recordUnchanged:initial===final,errors:h.errors,requests:h.counts},null,2)+'\n');
  await h.page.evaluate(()=>openAsset('WC57'));await h.page.waitForTimeout(400);await h.page.screenshot({path:path.join(OUT,'reference-phone.png')});
  console.log(JSON.stringify({cases:rows.length,passed:rows.filter(r=>r.pass).length,recordUnchanged:initial===final,errors:h.errors,requests:h.counts}));
 }finally{await h.browser.close();}
})().catch(e=>{console.error(e.stack||e);process.exitCode=1;});
