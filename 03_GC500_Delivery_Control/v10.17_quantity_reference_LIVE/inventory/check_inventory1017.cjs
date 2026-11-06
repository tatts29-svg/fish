/* Author: Andrew Fisher. GET-only Inventory, receipt demand, source requests and export regression. */
'use strict';const fs=require('fs'),path=require('path'),crypto=require('crypto');const{open}=require('../../record_14Oct2026_purchase_order/readonly_page.cjs');
(async()=>{const out=process.env.OUT_DIR;if(!out||!process.env.BASELINE)throw Error('Private OUT_DIR and baseline snapshot required');fs.mkdirSync(out,{recursive:true});
 const baseline=JSON.parse(fs.readFileSync(process.env.BASELINE,'utf8'));let h;
 try{h=await open({pageFile:process.env.PAGE,mobile:true,W:390,H:844});await h.page.waitForFunction(()=>SYNC.status==='live'&&GC500Refresh904.report().settled&&Routes1016.ready(),null,{timeout:180000});
 const result=await h.page.evaluate(base=>holdAssets(()=>{
  const checks=[],ck=(name,pass,detail)=>checks.push({name,pass:!!pass,...detail?{detail}:{}}),before=JSON.stringify(S),data=JSON.stringify(DATA),contracts=JSON.stringify(ONHIRE_ROWS),I=inventory();
  ck('Same native version as baseline',SYNC.backend.readVersion821()===base.nativeVersion);
  ck('Every baseline stock and ownership total is unchanged',base.inventory.list.every(old=>{const now=I.list.find(r=>r.type===old.type);return now&&['on','coates','nonum','spareC','spares'].every(k=>now[k]===old[k])&&JSON.stringify(now.sub)===JSON.stringify(old.sub)&&JSON.stringify(now.spareSub)===JSON.stringify(old.spareSub);}));
  const v=I.list.find(r=>r.item==='VMS'),f=I.list.find(r=>r.item==='FWF'),w=I.list.find(r=>r.item==='TL2');
  ck('Moved VMS keeps requested and received eight, current seven, no new demand',v.refs.T0001.asked===8&&v.refs.T0001.received1017===8&&v.refs.T0001.on===7&&v.refs.T0001.remaining1017===0);
  ck('VMS requested24/current9/remaining14',v.asked===24&&v.on===9&&v.remaining1017===14);
  ck('FWF requested227/current175/remaining52',f.asked===227&&f.on===175&&f.remaining1017===52);
  ck('WB new supply311/current76/remaining235 with64 reinstatement',w.asked===311&&w.on===76&&w.remaining1017===235&&waterBarrierPlacements1017().reduce((n,p)=>n+p.quantity,0)===64);
  ck('All row demand totals equal summed per-reference demand',I.list.every(r=>Inventory1017.remaining(r)===Object.values(r.refs).reduce((n,x)=>n+Inventory1017.remaining(x),0)));
  ck('All native requested quantities remain except verified reinstatements',base.inventory.list.every(old=>{const now=I.list.find(r=>r.type===old.type);return Object.values(old.refs).every(ref=>now.refs[ref.key]?.asked===(['WB19','WB20'].includes(ref.key)?0:ref.asked));}));
  const supplier=Supplier996.model(),sources=Inventory1017.sourceRows(supplier);
  ck('Both source-only requests are counted exactly once',sources.length===2&&sources.every(s=>I.list.flatMap(r=>Object.values(r.refs)).filter(x=>x.key===s.ref&&x.asked===1&&x.on===0&&x.sourceOnly1017).length===1));
  ck('Source-only dates match daily supplier plan',sources.every(s=>f.refs[s.ref].due1017===supplier.remaining.find(x=>x.ref===s.ref)?.date));
  const oldDisc=INV.disc,oldDrill=INV.drill;INV.disc='*';
  const outstanding=inv83Togo(I),screen=new DOMParser().parseFromString(togo782Html(I),'text/html'),keys=[...screen.querySelectorAll('li.ln87')].map(e=>e.dataset.k87);
  ck('Screen and PDF share exact outstanding references and order',JSON.stringify(keys)===JSON.stringify(outstanding.map(r=>r.key)));
  ck('Moved, collected and reinstatement fallback excluded',['T0001','WB19','WB20','FL01','FL02','T0159'].every(k=>!keys.includes(k)));
  ck('Every outstanding reference and date occurs once',new Set(outstanding.map(r=>JSON.stringify([r.key,r.due]))).size===outstanding.length);
  const planned=I.list.flatMap(r=>Object.values(r.refs).filter(x=>Inventory1017.remaining(x)>0).map(x=>({ref:x.key,item:r.item,n:Inventory1017.remaining(x)}))),aligned=planned.filter(r=>supplier.remaining.filter(p=>p.ref===r.ref&&p.item===r.item).reduce((n,p)=>n+p.remaining,0)===r.n);
  ck('Every matched supplier item and split date equals current daily runs',aligned.length>20&&aligned.every(r=>{const actual=outstanding.filter(x=>x.key===r.ref).flatMap(x=>x.allocations1017||[]).filter(x=>x.item===r.item).map(x=>[x.date,x.quantity]).sort(),expected=supplier.remaining.filter(p=>p.ref===r.ref&&p.item===r.item).map(x=>[x.date,x.remaining]).sort();return JSON.stringify(actual)===JSON.stringify(expected);}));
  ck('Previously mismatched WC29 and WC45 dates now match supplier runs',outstanding.find(r=>r.key==='WC29').due==='2026-10-16'&&outstanding.find(r=>r.key==='WC45').due==='2026-10-15');
  const nonsupplier=planned.filter(r=>!supplier.remaining.some(x=>x.ref===r.ref&&x.item===r.item));
  ck('Non-supplier delivery dates remain unchanged',nonsupplier.every(r=>outstanding.filter(x=>x.key===r.ref&&x.allocations1017?.some(a=>a.item===r.item)).every(x=>x.due===(effectiveDates(assetOf(r.ref)).in||''))));
  ck('Source request cards have destination, quantity and no fabricated editing or navigation',sources.every(s=>{const el=screen.querySelector('[data-source-request1017="'+s.ref+'"]');return el&&el.textContent.includes('1 ×')&&el.textContent.includes(s.location)&&!el.querySelector('[data-open],[data-fixref],[data-map],a[href],[data-qr87]');}));
  INV.drill={t:f.type,col:'togo'};const drill=new DOMParser().parseFromString(invDrillHtml(I),'text/html');
  ck('FWF remaining drill shows both source requests and52 total',drill.body.textContent.includes('still to come: 52')&&sources.every(s=>drill.querySelector('[data-source-request1017="'+s.ref+'"]')));
  INV.drill={t:f.type,col:'asked'};const ordered=new DOMParser().parseFromString(invDrillHtml(I),'text/html');
  ck('Ordered drill has both read-only source rows without dead form links',sources.every(s=>ordered.body.textContent.includes(s.ref)&&!ordered.querySelector('[data-fixref="'+s.ref+'"]')));
  const pdf=inv83Pages(),pdfText=pdf.pages.map(p=>p.html).join('');
  ck('WC46 and WC55 screen and PDF label their existing master points without changing navigation',['WC46','WC55'].every(key=>{
   const e=outstanding.find(r=>r.key===key),facts=inv87Facts(e),m=masterLoc(key),expected='Master-plan position · '+key,screenCard=screen.querySelector('[data-k87="'+key+'"]'),doc=new DOMParser().parseFromString(pdfText,'text/html'),pdfCard=[...doc.querySelectorAll('.card')].find(el=>el.querySelector('.ref')?.textContent===key);
   return facts.loc===expected&&facts.lat===m.ll[0]&&facts.lon===m.ll[1]&&facts.nav===navUrl({lat:m.ll[0],lon:m.ll[1]})&&screenCard?.querySelector('.tg-loc')?.textContent===expected&&pdfCard?.querySelector('.lo')?.textContent===expected;
  }));
  ck('PDF includes source names quantities dates and no invented QR',sources.every(s=>{const doc=new DOMParser().parseFromString(pdfText,'text/html'),card=[...doc.querySelectorAll('.card')].find(el=>el.textContent.includes(s.ref));return card&&card.textContent.includes(s.name)&&card.textContent.includes('1 ×')&&card.textContent.includes(fmtDate(f.refs[s.ref].due1017))&&!card.querySelector('.qr svg')&&card.textContent.includes('Exact position not recorded');}));
  ck('Source requests cannot be treated as native priced assets',sources.every(s=>assetOf(s.ref)===null||assetOf(s.ref)===undefined));
  const price=inv83Money([f]).get(f.type);ck('Unpriced source requests stay explicitly unpriced in export',price.unknown>=2);
  // In-memory projection fixture only: one pending reference travels on two days.
  const split=JSON.parse(JSON.stringify(I)),portion=split.supplierRemaining1017.find(r=>r.ref==='WC29'&&r.item==='FWF'),savedInventory=inventory;
  split.supplierRemaining1017=split.supplierRemaining1017.filter(r=>r!==portion).concat([{...portion,remaining:4,date:'2026-10-17'},{...portion,remaining:3,date:'2026-10-18'}]);
  const splitEntries=Inventory1017.outstanding({...split,list:[split.list.find(r=>r.type===f.type)]},f.disc,true),locations=Inventory1017.locationCount(splitEntries);
  INV.disc=f.disc;INV.drill={t:f.type,col:'togo'};
  const splitDrill=new DOMParser().parseFromString(invDrillHtml(split),'text/html');let splitPDF;
  try{inventory=()=>split;splitPDF=inv83Pages();}finally{inventory=savedInventory;}
  const fullTradeStops=Inventory1017.outstanding(split,f.disc),fullTradeLocations=Inventory1017.locationCount(fullTradeStops);
  ck('Split-reference fixture labels unique locations separately from dated stops',splitEntries.length===locations+1&&splitEntries.filter(r=>r.key==='WC29').flatMap(r=>r.allocations1017).reduce((n,r)=>n+r.quantity,0)===7&&splitDrill.querySelector('.invdrillh').textContent.includes('at '+locations+' locations')&&splitPDF.togo===fullTradeLocations&&splitPDF.pages.map(p=>p.html).join('').includes(fullTradeStops.length+' delivery stops'),{drillStops:splitEntries.length,drillLocations:locations,tradeStops:fullTradeStops.length,tradeLocations:fullTradeLocations,printedLocations:splitPDF.togo});
  const supplied=Object.values(I.list).flatMap(r=>Object.values(r.refs)).filter(r=>r.sourceOnly1017);
  INV.disc=oldDisc;INV.drill=oldDrill;
  ck('Native records source data and contracts unchanged',before===JSON.stringify(S)&&data===JSON.stringify(DATA)&&contracts===JSON.stringify(ONHIRE_ROWS));
  return {author:'Andrew Fisher',nativeVersion:SYNC.backend.readVersion821(),checks,counts:{types:I.list.length,references:new Set(I.list.flatMap(r=>Object.keys(r.refs))).size,outstanding:keys.length,sourceRequests:supplied.length,supplierDateScopes:aligned.length},pdf};
 }),baseline);
 // Measure the actual export DOM at its authored paper sizes before rasterisation.
 const layout=await h.page.evaluate(pdf=>{const root=document.createElement('div');root.id='audit-inventory1017-export';root.className='i83';root.innerHTML='<style>'+INV83_CSS+'</style>'+pdf.pages.map(p=>p.html).join('');document.body.append(root);
  return [...root.querySelectorAll('section.pg')].map((pg,i)=>{const b=pg.getBoundingClientRect(),footer=pg.querySelector('.ft').getBoundingClientRect();return {page:i+1,width:b.width,height:b.height,scroll:pg.scrollHeight,client:pg.clientHeight,footerBottom:footer.bottom-b.top,childOverflow:[...pg.querySelectorAll('.card.ln87p')].filter(c=>c.scrollHeight>c.clientHeight+2).length,overflowRows:[...pg.querySelectorAll('.card.ln87p')].filter(c=>c.scrollHeight>c.clientHeight+2).map(c=>({ref:c.querySelector('.ref').textContent,height:c.clientHeight,scroll:c.scrollHeight,children:[...c.children].map(x=>({class:x.className,height:x.clientHeight,scroll:x.scrollHeight}))}))};});},result.pdf);
 result.checks.push({name:'Export pages fit authored A4 page bounds',pass:layout.every(p=>p.scroll<=p.client+2&&p.footerBottom<=p.height+2&&p.childOverflow===0),detail:layout});
 await h.page.evaluate(()=>{document.getElementById('audit-inventory1017-export')?.remove();eq796s().seen=true;state.plantGroup='';INV.disc='*';INV.drill=null;go('plant');render();});
 fs.writeFileSync(path.join(out,'inventory-model-checks.json'),JSON.stringify(result,null,2));
 const chip=h.page.locator('[data-invref87="Toilets & amenities|FWF|EP-S7-EW49"]').first();
 await chip.evaluate(el=>{for(let p=el.parentElement;p;p=p.parentElement)if(p.tagName==='DETAILS')p.open=true;});
 await chip.scrollIntoViewIfNeeded();
 await chip.click();await h.page.waitForTimeout(400);
 const request=h.page.locator('#invDrill [data-source-request1017="EP-S7-EW49"]').first();
 result.checks.push({name:'Actual source request chip opens the matching drill',pass:await request.count()===1});
 await request.scrollIntoViewIfNeeded();await h.page.screenshot({path:path.join(out,'inventory-request-phone.png')});
 await h.page.locator('#invDrill [data-invdrill-x]').click();await h.page.waitForTimeout(100);
 result.checks.push({name:'Actual drill Close removes the panel and retains Equipment',pass:await h.page.evaluate(()=>!document.getElementById('invDrill')&&state.tab==='plant')});
 result.errors=h.errors;result.requests=h.counts;result.checks.push({name:'No browser errors or operational writes',pass:!h.errors.length&&!h.counts.blocked});delete result.pdf;
 result.sha256=crypto.createHash('sha256').update(fs.readFileSync(process.env.PAGE)).digest('hex');fs.writeFileSync(path.join(out,'inventory-checks.json'),JSON.stringify(result,null,2));
 console.log(JSON.stringify({checks:result.checks.length,failed:result.checks.filter(c=>!c.pass),counts:result.counts,errors:h.errors,requests:h.counts}));if(result.checks.some(c=>!c.pass))process.exitCode=1;
 }finally{if(h)await h.browser.close();}
})().catch(e=>{console.error(e.stack);process.exitCode=1});
