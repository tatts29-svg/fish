/* Author: Andrew Fisher. GET-only collection model, rendered rows and driver-sheet regression. */
'use strict';const fs=require('node:fs'),path=require('node:path');const{open}=require('../../record_14Oct2026_purchase_order/readonly_page.cjs');
(async()=>{let h;try{
 h=await open({pageFile:process.env.PAGE,hash:'#demob',W:390,H:844,mobile:true});
 await h.page.waitForFunction(()=>SYNC.status==='live'&&photoIndex().state==='ready'&&Refresh904.report().state==='ready',null,{timeout:180000});
 const result=await h.page.evaluate(()=>holdAssets(()=>{
  const checks=[],ck=(name,pass,detail)=>checks.push({name,pass:!!pass,...detail?{detail}:{}}),native=JSON.stringify(S),source=JSON.stringify(DATA),contracts=JSON.stringify(ONHIRE_ROWS),assets=allAssets(),M=demob816(),expected=physicalCountAssets963(assets).assets.filter(a=>!a._cancelled&&!a.relocation&&!a.rest_of&&!rowOff(a.key)&&!movedAway(a.key)),by=new Map(M.refs.map(r=>[r.key,r]));
  ck('Every eligible canonical reference appears once',M.refs.length===new Set(M.refs.map(r=>r.key)).size&&JSON.stringify(M.refs.map(r=>r.key).sort())===JSON.stringify(expected.map(a=>a.key).sort()));
  ck('Source aliases and relocation are not separate pickups',['FL01','FL02','T0159'].every(k=>!by.has(k)));
  ck('Canonical forklift deliveries remain',['T0003','T0004'].every(k=>by.get(k)?.units.length===1));
  ck('Aliases remain searchable and original source remains available',['FL01','FL02','T0159'].every(k=>assetOf(k)&&finderMatches(k).some(x=>x.key===k)));
  ck('Changed locations remain in collection plan',['WC100','WC85','T0268'].every(k=>by.has(k)));
  ck('Cancelled references are not collected',assets.filter(a=>a._cancelled).every(a=>!by.has(a.key)));
  const src=by.get('T0001'),dst=by.get('T0103'),planned=by.get('T0128'),received=itemRows(assetOf('T0001')).find(x=>x.asked==='VMS');
  ck('Moved VMS collected only at current reference',src.units.find(u=>u.type==='VMS').n===7&&dst.units.find(u=>u.type==='VMS').n===2);
  ck('Original eight-board receipt remains intact',received.qty_asked===8&&(received.qty_supplied==null||received.qty_supplied===8)&&deliveryOf('T0001').done);
  ck('Unreceived planned equipment remains collectable later',planned?.units.find(u=>u.type==='VMS')?.n===2);
  const allTrucks=M.days.flatMap(day=>trucks816(day,'all').map(load=>({day,load}))),stops=allTrucks.flatMap(({day,load})=>load.stops.map(s=>({day,key:s.r.key,parts:s.parts}))),sourceStops=stops.filter(s=>s.key==='T0001');
  ck('Truck stops omit aliases and relocation',stops.every(s=>!['FL01','FL02','T0159'].includes(s.key)));
  ck('Truck typed quantities use seven source boards',sourceStops.length===1&&sourceStops[0].parts.find(p=>p.type==='VMS')?.n===7);
  ck('All current and future eligible references retain matching truck scope',stops.every(s=>by.has(s.key)));
  const table=document.createElement('table');table.innerHTML=rowHtml816(src);const rowText=table.textContent;
  ck('Rendered source row shows current seven rather than original eight',rowText.includes('VMS × 7')&&!rowText.includes('VMS × 8'));
  const load=allTrucks.find(x=>x.load.stops.some(s=>s.r.key==='T0001')),sheet=sheet816Before826(load.day,load.load);
  const doc=new DOMParser().parseFromString(sheet,'text/html'),sheetRow=[...doc.querySelectorAll('tbody tr')].find(tr=>tr.textContent.includes('T0001'));
  ck('Printable driver sheet carries seven source boards',sheetRow?.textContent.includes('7 × VMS')&&!sheetRow?.textContent.includes('8 × VMS'));
  ck('Original assignment model retains moved identity as history',gcModel925(assetOf('T0001')).rows.some(u=>u.assetNo==='1211404'&&!u.physical&&u.source==='history'));
  ck('Collection required scope matches current seven',DemobCollection996.read('T0001').required.find(u=>u.type==='VMS')?.n===7);
  ck('Inventory remains nine currently on-site VMS',inventory().list.find(r=>r.item==='VMS')?.on===9);
  ck('Original Build delivery remains eight boards',programmeDays().flatMap(d=>d.deliveries).filter(r=>r.a?.key==='T0001').some(r=>r.events.some(e=>e.item==='VMS'&&Number(e.quantity_raw)===8)));
  const originalModel=gcModel925;
  try{
   gcModel925=function(a,options){const m=originalModel(a,options);return a.key==='T0001'?{...m,rows:m.rows.concat([{physical:true,item:'VMS',assetNo:'AUDIT-REPLACEMENT',owner:'coates'}])}:m;};
   ck('Later confirmed replacement restores the collection count once',units816(assetOf('T0001')).find(u=>u.type==='VMS').n===8);
   gcModel925=function(a,options){const m=originalModel(a,options);return a.key==='T0001'?{...m,rows:m.rows.filter(r=>r.physical&&r.item==='VMS').slice(0,3)}:m;};
   const partial=DemobScope1017.units(assetOf('T0001'),[{type:'VMS',n:4,unknown:false}],(a,item,n)=>VmsAssignment1016.quantity(a,item,todayIso(),n));
   ck('Partial receipt with one moved board keeps three at source',partial[0].n===3);
  }finally{gcModel925=originalModel;}
  ck('Synthetic identity checks restore original collection scope',units816(assetOf('T0001')).find(u=>u.type==='VMS').n===7);
  ck('Native records, sources and contract rows remain byte-equivalent',native===JSON.stringify(S)&&source===JSON.stringify(DATA)&&contracts===JSON.stringify(ONHIRE_ROWS));
  DM816.sel=src.iso;renderDemob816();return{author:'Andrew Fisher',nativeVersion:SYNC.backend.readVersion821(),checks,counts:{refs:M.refs.length,truckStops:stops.length,vmsPlanned:M.refs.flatMap(r=>r.units).filter(u=>u.type==='VMS').reduce((n,u)=>n+u.n,0)},sourceRow:rowText,printRow:sheetRow?.textContent};
 }));
 result.errors=h.errors;result.requests=h.counts;result.checks.push({name:'No browser errors or operational write attempts',pass:!h.errors.length&&!h.counts.blocked});
 const out=process.env.OUT_DIR;if(!out)throw Error('Private OUT_DIR required');fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,'demob-checks.json'),JSON.stringify(result,null,2));
 await h.page.locator('[data-row816="T0001"]').first().evaluate(el=>{for(let p=el.parentElement;p;p=p.parentElement)if(p.tagName==='DETAILS')p.open=true;el.scrollIntoView({block:'center'});});
 await h.page.screenshot({path:path.join(out,'demob-phone.png')});console.log(JSON.stringify({nativeVersion:result.nativeVersion,checks:result.checks.length,failed:result.checks.filter(c=>!c.pass),counts:result.counts,errors:h.errors,requests:h.counts}));if(result.checks.some(c=>!c.pass))process.exitCode=1;
 }finally{if(h)await h.browser.close();}
})().catch(e=>{console.error(e.stack);process.exitCode=1});
