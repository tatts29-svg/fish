// Author: Andrew Fisher. Practice only: the harness aborts service writes.
const fs=require('fs'),path=require('path'),crypto=require('crypto');
const {open}=require('../../toolchain/harness/open_page');
const out=process.env.OUT || '/workspace/private-wed7-bookings';
const pageFile=process.env.PAGE || '/workspace/private-wed7-bookings/candidate.html';
const candidateSha256=crypto.createHash('sha256').update(fs.readFileSync(pageFile)).digest('hex');
(async()=>{const h=await open({pageFile,W:1440,H:1000});try{
 await h.page.waitForFunction(()=>SYNC.status==='live'&&SYNC.first.size===Object.keys(SYNC_COLLS).length,null,{timeout:240000});
 const result=await h.page.evaluate(()=>{
  const checks=[];const ck=(name,pass,detail)=>checks.push({name,pass:!!pass,...(detail===undefined?{}:{detail})});
  const d=programmeDays().find(d=>d.iso==='2026-10-07'),groups=dpLoads(d),booked=groups.filter(g=>g.truck_id),parts=groups.flatMap(g=>g.rows.flatMap(r=>r.events));
  ck('14 source rows on 13 original references',d.deliveries.length===13&&d.deliveries.flatMap(r=>r.events).filter(e=>e.booking801).length===14);
  ck('28 units across all 14 source rows',parts.reduce((s,e)=>s+Number(e.quantity_display),0)===28);
  ck('11 trucks and 4 unassigned FWF groups',d.loads.length===11&&booked.length===11&&groups.length===15);
  ck('DD order wins over loading clock',JSON.stringify(booked.map(g=>g.departure_order))===JSON.stringify([1,2,3,4,5,6,7,7,8,8,null]));
  ck('Distinct 05:00 SFL trucks P55/P56',groups[0].rows[0].a.key==='P55'&&groups[1].rows[0].a.key==='P56'&&groups[0].truck_id!==groups[1].truck_id);
  const shared=booked.filter(g=>g.departure_order===4);ck('Rank 4 one shared container/toilet truck',shared.length===1&&shared[0].rows.length===2&&shared[0].rows.some(r=>r.a.key==='T0258')&&shared[0].rows.some(r=>r.a.key==='WC86')&&shared[0].dds.length===2);
  const wc=booked.filter(g=>g.rows.some(r=>r.a.key==='WC20'));
  ck('WC20 exactly four one-unit bookings',wc.length===4&&wc.every(g=>g.rows.length===1&&g.rows[0].events.length===1&&g.rows[0].events[0].quantity_display==='1'));
  ck('WC20 tank sheets carry no toilet-block asset numbers',wc.filter(g=>g.departure_order===7).every(g=>dpNums(g.rows[0].a).length===0&&!dpTruck(g,'drv').includes('1327228')&&!dpTruck(g,'drv').includes('1327225')));
  ck('WC20 block numbers map in supplied order',JSON.stringify(wc.filter(g=>g.departure_order===8).map(g=>dpNums(g.rows[0].a)))===JSON.stringify([['1327228'],['1327225']]));
  const gen=booked.find(g=>g.rows[0].a.key==='GN18');const genHtml=document.createElement('div');genHtml.innerHTML=dpTruck(gen,'drv');
  ck('GN18 sheet booked asset1261273 plus allocation conflict',genHtml.querySelector('.dp-num').textContent==='1261273'&&genHtml.textContent.includes('GN13')&&genHtml.textContent.includes('1276501')&&genHtml.textContent.includes('Check allocation'));
  ck('GN18/GN13 operational allocations untouched',JSON.stringify(assetOf('GN18').asset_numbers)==='["1276501"]'&&assetOf('GN13').asset_numbers.includes('1261273'));
  ck('P52 supplied number13227211 kept',assetOf('P52').asset_numbers.includes('13227211'));
  ck('Full-size fridges appear once per print cargo component',['P52','P57'].every(k=>(dpTruck(booked.find(g=>g.rows.some(r=>r.a.key===k)),'drv').match(/Fridge \(Full Size\)/g)||[]).length===1));
  const fwf=groups.filter(g=>!g.truck_id);ck('FWF no invented carrier/order/load clock',fwf.length===4&&fwf.every(g=>g.time===null&&!g.carrier&&g.departure_order===null)&&fwf.reduce((s,g)=>s+Number(g.rows[0].events[0].quantity_display),0)===16);
  ck('WC38 07–11 window remains note only',fwf.find(g=>g.rows[0].a.key==='WC38').time===null&&dpTruck(fwf.find(g=>g.rows[0].a.key==='WC38'),'drv').includes('7.00-11.00am'));
  ck('No booking print hero invents site arrival or departure time',groups.every(g=>!dpHero(d,g,'ins').includes('Truck leaves')&&!dpHero(d,g,'drv').includes('After 07:00')));
  ck('No booking dispatch card invents site arrival',d.loads.every((l,i)=>!pitBoard(l,i).includes('Gold Coast after')&&!loadLi(l).includes('Gold Coast after')));
  ck('Load pairing projection uses supplied references',d.loads.every(l=>JSON.stringify(loadOf(l).keys)===JSON.stringify(l.refs)&&JSON.stringify(loadOf(loadId(l)).keys)===JSON.stringify(l.refs)));
  ck('Load assets keep single cargo item quantity',d.loads.filter(l=>l.refs.includes('WC20')).every(l=>loadAssets(l).length===1&&itemRows(loadAssets(l)[0]).length===1&&itemRows(loadAssets(l)[0])[0].qty_asked===1));
  ck('Driver email list carries rank and DD',booked.every(g=>dpLoadLine(g).includes('DD departure')&&g.dds.every(dd=>dpLoadLine(g).includes(dd))));
  ck('15 unique day-card identities',new Set(groups.map(g=>ldId(d,g))).size===15);
  const prevOpen=state.tlLoad;
  try{ck('Each booked truck opens only its own card',booked.every(g=>{state.tlLoad=ldId(d,g);return groups.filter(x=>ldIsOpen(d,x)).length===1&&ldIsOpen(d,g);}));}finally{state.tlLoad=prevOpen;}
  ck('Split WC20 schedule includes only selected DD',wc.every(g=>{const text=bookingDayWords801(g.rows[0].a,g.rows[0].events);return g.dds.every(dd=>text.includes(dd))&&wc.filter(x=>x!==g).every(x=>x.dds.every(dd=>!text.includes(dd)));}));
  ck('Selected WC20 day-card header shows only its truck asset and quantity',wc.every(g=>{const r=g.rows[0],box=document.createElement('div');box.innerHTML=dayCard(r.a,r.events,null,true);const header=box.querySelector('.dcno').textContent;return dpNums(r.a).every(n=>header.includes(n))&&['1327228','1327225'].filter(n=>!dpNums(r.a).includes(n)).every(n=>!header.includes(n))&&box.querySelector('.dcqty .dcbig').textContent==='1';}));
  ck('GN18 day-card labels booked number and keeps allocation conflict',(()=>{const r=gen.rows[0],box=document.createElement('div');box.innerHTML=dayCard(r.a,r.events,null,true);return box.querySelector('.dcno').textContent.includes('1261273')&&!box.querySelector('.dcno').textContent.includes('1276501')&&box.querySelector('.dcsays').textContent.includes('GN13')&&box.querySelector('.dcsays').textContent.includes('1276501');})());
  ck('Explicit booking day cards do not carry old inferred movement badge',groups.every(g=>g.rows.every(r=>{const box=document.createElement('div');box.innerHTML=dayCard(r.a,r.events,null,true);return ![...box.querySelectorAll('.dcsays .chip')].some(x=>x.textContent==='inferred');})));
  ck('Booking clocks never enter legacy departure or arrival calculations',d.deliveries.every(r=>loads782(r.a).every(l=>l.date!=='2026-10-07')));
  ck('Full details explicitly distinguishes DD order and loading clocks',d.deliveries.every(r=>{const t=dropSmsLong(r.a);return t.includes('DD departure order')&&t.includes('departure and site arrival times were not supplied')&&!t.includes('away from Kingston after 05:00');}));
  const old=programmeDaysBefore801().filter(x=>x.iso!=='2026-10-07'),now=programmeDays().filter(x=>x.iso!=='2026-10-07');
  ck('All other day projections unchanged',JSON.stringify(old)===JSON.stringify(now));
  ck('Other day print grouping unchanged',now.every(x=>JSON.stringify(dpLoads(x))===JSON.stringify(dpLoadsBefore801(x))));
  const prev=S.delivery.P55;
  try{S.delivery.P55=Object.assign({},prev,{date:'2026-10-08'});const moved=programmeDays().find(x=>x.iso==='2026-10-08');const gs=dpLoads(moved).filter(g=>g.rows.some(r=>r.a.key==='P55'));ck('Rescheduling does not reconfirm original booked clock',gs.length===1&&gs[0].time===null&&!gs[0].carrier&&!moved.loads.some(l=>(l.refs||[]).includes('P55'))&&gs[0].rows[0].events[0].note.includes('has not been supplied'));}finally{if(prev)S.delivery.P55=prev;else delete S.delivery.P55;}
  try{S.delivery.P55=Object.assign({},prev,{state:'not on site',eta:'10:00',date:'2026-10-07'});const t=timeCheck782(assetOf('P55')).join(' ');ck('Explicit unloaded-by ETA remains a plan without inferred booking departure',t.includes('no departure time supplied; booked loading times are separate')&&t.includes('unloaded by 10:00')&&!t.includes('load 05:00')&&!t.includes('on site about'));}finally{if(prev)S.delivery.P55=prev;else delete S.delivery.P55;}
  const docs=['drv','ins'].map(doc=>({doc,html:groups.map((g,i)=>dpPage(d,g,doc,i+1,groups.length)).join('')}));
  ck('Both print modes render all15 groups without exceptions',docs.every(x=>(x.html.match(/class="dp-page /g)||[]).length===15));
  return {author:'Andrew Fisher',checks,groups:groups.map(g=>({rank:g.departure_order,dds:g.dds,keys:g.rows.map(r=>r.a.key),time:g.time,carrier:g.carrier,qty:g.rows.map(r=>r.events.map(e=>e.quantity_display)),numbers:g.rows.map(r=>dpNums(r.a))}))};
 });result.candidateSha256=candidateSha256;result.errors=h.errors;result.requests=h.counts;fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,'bookings801_tests.json'),JSON.stringify(result,null,2));console.log(JSON.stringify({checks:result.checks,errors:h.errors,requests:h.counts}));if(result.checks.some(x=>!x.pass)||h.errors.length||h.counts.blocked)process.exitCode=1;
}finally{await h.browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
