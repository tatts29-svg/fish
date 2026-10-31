/* Author: Andrew Fisher. GET-only paired WC31 supplier forecast proof; private financial evidence only. */
'use strict';
const fs=require('fs'),path=require('path'),Module=require('module'),assert=require('assert/strict'),crypto=require('crypto');
const OUT=process.env.OUT,BASE=process.env.BASE_PAGE||process.env.BASE,PAGE=process.env.PAGE,MOBILE=process.env.MOB==='1';
assert(OUT&&path.isAbsolute(OUT)&&BASE&&PAGE,'Set absolute private OUT, BASE_PAGE and PAGE');fs.mkdirSync(OUT,{recursive:true,mode:0o700});
const save=(n,v)=>fs.writeFileSync(path.join(OUT,n),JSON.stringify(v,null,2),{mode:0o600});
const sha=v=>crypto.createHash('sha256').update(v).digest('hex'),r2=v=>Math.round(v*100)/100;
const inputHashes={candidate:sha(fs.readFileSync(PAGE)),base:sha(fs.readFileSync(BASE))};
let checks=0;const eq=(a,b,msg)=>{assert.deepEqual(a,b,msg);checks++},ok=(v,msg)=>{assert(v,msg);checks++};
const data=file=>JSON.parse(fs.readFileSync(file,'utf8').split('const DATA = ',2)[1].split('\n',1)[0].replace(/;\s*$/,''));
eq(data(PAGE),data(BASE),'all embedded source DATA remains byte-equivalent');
let frozen=process.env.STATE?JSON.parse(fs.readFileSync(process.env.STATE,'utf8')):null;
const H=path.resolve(__dirname,'../../toolchain/harness'),hp=H+'/open_page.js',fetcher=require(H+'/curlfetch'),native=fetcher.curlFetch;
fetcher.curlFetch=async(url,headers,method,body)=>{
 assert.equal(method,'GET','network may only GET');const u=new URL(url);
 if(frozen&&u.origin==='https://gc500-production.up.railway.app'&&['/api/state','/api/version'].includes(u.pathname))return{status:200,headers:{'content-type':'application/json','cache-control':'no-store'},body:Buffer.from(JSON.stringify(u.pathname==='/api/state'?frozen:{version:frozen.version,updated:frozen.updated,level:'view'}))};
 const res=await native(url,headers,method,body);
 if(!frozen&&u.origin==='https://gc500-production.up.railway.app'&&u.pathname==='/api/state'&&res.status===200){frozen=JSON.parse(res.body.toString());save('frozen-state.json',frozen)}
 return res;
};
const h=new Module(hp,module);h.filename=hp;h.paths=Module._nodeModulePaths(path.dirname(hp));
const guard="const okPost = r.method() === 'POST' && u.startsWith('https://tile.googleapis.com/v1/createSession');";
let harness=fs.readFileSync(hp,'utf8');ok(harness.includes(guard),'strict GET harness guard found');harness=harness.replace(guard,'const okPost = false;').replace('counts.blocked++;',"counts.blocked++; (counts.denials ||= []).push({method:r.method(),origin:new URL(u).origin,path:new URL(u).pathname});");h._compile(harness,hp);
async function run(label,file){
 const session=await h.exports.open({pageFile:file,hash:'#costs',W:MOBILE?390:1440,H:MOBILE?844:1000,mobile:MOBILE}),p=session.page;
 const timer=setTimeout(()=>session.browser.close().catch(()=>{}),300000);
 try{
  await p.waitForFunction(()=>SYNC.status==='live'&&SYNC.first.size===Object.keys(SYNC_COLLS).length,null,{timeout:120000});
  const result=await p.evaluate(()=>{
   const record=JSON.stringify(S);RENDER_MEMO.clear();
   const value=holdAssets(()=>{
    const a=assetOf('WC31'),line=chargeLines(a).find(l=>l.item==='16Pan Block');
    return{version:SYNC.backend.readVersion821(),record,quote:DATA.rehire_quotes,money:moneySummary(),costs:cj764Model(),profit:pl770Model(),rehire:rh766Model(),handover:fh866Model(),recon:recon888Model(),transport:transport888Core(),buildingTransport:buildingTransportModel831(),otherSupplier:Source949.model(),months:Object.fromEntries(['2026-09','2026-10','2026-11','2026-12'].map(m=>[m,acc761Model(m)])),supplier955:typeof Supplier955==='undefined'?null:Supplier955.model(),customer:{contracts:ONHIRE_ROWS.map(r=>({contract:r.rental_contract,line:r.line,qty:r.quantity,charge:contractCharge(r)})),labour:labourPlan().slots,labourJob:labourRevenue858(),assets:allAssets().filter(a=>!a._cancelled).map(a=>({ref:a.key,total:assetTotal(a)}))},wc31:{quantity:qtyOf(line),units:labourUnits(a,'16Pan Block'),physical:gcModel925(a).rows.filter(u=>u.item==='16Pan Block'),hire:assetTotal(a).lines.find(l=>l.item==='16Pan Block'),slots:labourPlan().slots.filter(s=>s.ref==='WC31'&&s.item==='16Pan Block'),contract:ONHIRE_ROWS.filter(r=>r.rental_contract==='9968955'&&r.line===98).map(r=>({r,charge:contractCharge(r),owner:finance928ContractOwner(r)}))}};
   });return {...value,recordUnchanged:record===JSON.stringify(S)};
  });
  ok(result.recordUnchanged,label+' model reads preserve every S field');eq(result.version,frozen.version,label+' expected frozen native version');
  eq(result.recon.ties.length,17,label+' all 17 native financial/operational ties present');ok(result.recon.ties.every(t=>t.ok),label+' all native financial/operational ties pass');
  ok(Object.values(result.profit.checks).every(x=>x===true),label+' business-line checks pass');ok(result.handover.costCheck,label+' Finance branch cost check passes');ok(result.handover.invCheck.record&&result.handover.invCheck.job,label+' Finance customer Revenue checks pass');
  if(label==='candidate'){
   result.scenarios=await p.evaluate(()=>{
    const before=JSON.stringify(S);const out=holdAssets(()=>{
     const a=assetOf('WC31'),rq=DATA.rehire_quotes,units=gcUnits925(a),input={active:true,quote:rq.quotes.find(q=>q.quote==='Q6845'),approved:rq.authorisation.state==='approved',units,costs:ourCosts(),branch:pl760ToiletBranch()};
     const exact={id:'test-only',side:'ours',usable:true,supplier:'Event Portables Australia',ref:'WC31',reference:'INV-TEST',amount:2750,description:'Second 16-pan block hire',note:'Q6845 variation, whole event',quantity:1};
     const run=cost=>Supplier955.calculate({...input,costs:input.costs.concat(cost?[cost]:[])});
     const contract=ONHIRE_ROWS.find(r=>String(r.rental_contract)==='9968955'&&Number(r.line)===98);
     return{nativeInput:Supplier955.calculate(input),exact:run(exact),broaderQuantity:run({...exact,quantity:2}),partial:run({...exact,amount:500,note:'Q6845 partial deposit'}),generic:run({...exact,description:'Hire charge',note:'supplier charge'}),otherReference:run({...exact,ref:'WC20'}),transport:run({...exact,description:'Second 16-pan block hire transport'}),oneUnit:Supplier955.calculate({...input,units:units.filter(u=>!(u.item==='16Pan Block'&&String(u.assetNo)==='74'))}),owner:Supplier955.owner(contract,units),ownerWrongLine:Supplier955.owner({...contract,line:97},units),ownerMixed:Supplier955.owner(contract,units.map(u=>u.item==='16Pan Block'&&String(u.assetNo)==='74'?{...u,owner:'coates'}:u))};
    });return{...out,stateUnchanged:before===JSON.stringify(S)};
   });
   ok(result.scenarios.stateUnchanged,'pure coverage/ownership scenarios never alter S');
   await p.evaluate(()=>holdAssets(()=>go('costs')));
   const selector=process.env.SUPPLIER_SELECTOR||'[data-supplier955]';
   const panel=p.locator(selector).first();await panel.waitFor({state:'attached',timeout:20000});
   await panel.evaluate(n=>{let q=n;while(q){if(q.tagName==='DETAILS')q.open=true;q=q.parentElement;}n.scrollIntoView({block:'center'});});
   await p.screenshot({path:path.join(OUT,MOBILE?'phone-supplier-forecast.png':'desktop-supplier-forecast.png')});
   const ui=await p.evaluate(sel=>{const n=document.querySelector(sel);return{width:innerWidth,documentWidth:document.documentElement.scrollWidth,text:n.textContent,inputs:n.querySelectorAll('input,select,textarea').length,record:JSON.stringify(S)}},selector);
   ok(ui.documentWidth<=ui.width+1,'supplier forecast fits viewport');eq(ui.inputs,0,'supplier estimate introduces no record entry fields');eq(ui.record,result.record,'opening forecast explanation leaves S unchanged');
   ok(/forecast|estimate|provisional/i.test(ui.text),'supplier estimate visibly qualified');ok(/WC31/.test(ui.text),'forecast linked visibly to WC31');
   result.ui={width:ui.width,documentWidth:ui.documentWidth,text:ui.text};
   if(MOBILE){await panel.evaluate(n=>n.lastElementChild.scrollIntoView({block:'center',inline:'center'}));await p.screenshot({path:path.join(OUT,'phone-supplier-evidence.png')});}
   await p.evaluate(()=>holdAssets(()=>go('costs')));
   const ownership=p.locator('#rehire766 .rh766-basis .acc761-w').filter({hasText:'WC31 contract 9968955 line 98'}).first();await ownership.waitFor({state:'attached',timeout:20000});
   await ownership.evaluate(n=>{let q=n;while(q){if(q.tagName==='DETAILS')q.open=true;q=q.parentElement;}n.scrollIntoView({block:'center'});});
   await p.screenshot({path:path.join(OUT,MOBILE?'phone-customer-ownership.png':'desktop-customer-ownership.png')});
   const ownershipUi=await ownership.evaluate(n=>({text:n.textContent,costJobText:n.closest('tr')?.cells?.[7]?.textContent||'',inputs:n.querySelectorAll('input,select,textarea').length,width:innerWidth,documentWidth:document.documentElement.scrollWidth,record:JSON.stringify(S)}));
   ok(/9968955 line 98/.test(ownershipUi.text)&&/12 and 74/.test(ownershipUi.text),'visible ownership evidence names exact contract and units');ok(/amount is unchanged/.test(ownershipUi.text),'visible ownership evidence distinguishes classification from new charge');
   ok(/estimate|forecast|provisional/i.test(ownershipUi.costJobText),'job-end supplier cost caption includes provisional forecast status');eq(ownershipUi.inputs,0,'ownership evidence introduces no record fields');eq(ownershipUi.record,result.record,'opening original contract evidence leaves S unchanged');ok(ownershipUi.documentWidth<=ownershipUi.width+1,'ownership evidence page fits viewport');
   result.ownershipUi={text:ownershipUi.text,costJobText:ownershipUi.costJobText,width:ownershipUi.width,documentWidth:ownershipUi.documentWidth};
   await ownership.evaluate(n=>n.closest('tr').cells[7].scrollIntoView({block:'center',inline:'center'}));await p.screenshot({path:path.join(OUT,MOBILE?'phone-supplier-cost-caption.png':'desktop-supplier-cost-caption.png')});
  }
  eq(session.errors,[],label+' zero runtime errors');ok((session.counts.denials||[]).every(d=>d.origin==='https://tile.googleapis.com'&&d.path==='/v1/createSession'),label+' no operational write attempts');
  result.requests=session.counts;result.errors=session.errors;save(label+'-private.json',result);return result;
 }finally{clearTimeout(timer);await session.browser.close();}
}
(async()=>{
 const before=await run('before',BASE),after=await run('candidate',PAGE),model=after.supplier955;
 eq(after.version,before.version,'same snapshot across base and candidate');eq(after.record,before.record,'full S byte-identical between source versions');
 eq(after.money,before.money,'all recorded money and customer totals byte-identical');eq(after.customer,before.customer,'every customer contract/asset/labour charge and forecast byte-identical');
 eq(after.quote,before.quote,'all approved quote source data and totals byte-identical');eq(after.money.cost.rehire,118575,'approved four-quote cost remains118575');
 eq(after.transport,before.transport,'transport costs/forecasts/bookings byte-identical');eq(after.buildingTransport,before.buildingTransport,'customer transport model byte-identical');eq(after.otherSupplier,before.otherSupplier,'other supplier forecasts unchanged');
 ok(model,'supplier model exists');eq(model.required,2,'two confirmed supplier blocks');eq(model.quoted,1,'one block already in approved quote');eq(model.additional,1,'one additional supplier block');eq(model.rate,2750,'Q6845 unit amount retained');eq(model.estimate,2750,'extra cost is one unit ×2750');eq(model.held,false,'uncovered extra unit can be forecast');eq(model.month,'2026-10','whole-event estimate allocated to October');
 eq(after.costs.known,before.costs.known,'known direct costs unchanged');eq(r2(after.costs.toCome-before.costs.toCome),2750,'Costs to job end adds forecast once');eq(r2(after.costs.job-before.costs.job),2750,'Costs job total increases exactly2750');eq(after.costs.revenue,before.costs.revenue,'Costs Revenue model unchanged');
 const find=(xs,key)=>xs.find(r=>r.key===key),pc=find(after.profit.cost,'rehire'),pb=find(before.profit.cost,'rehire');eq(pc.now,pb.now,'Rehire actual unchanged');eq(r2(pc.job-pb.job),2750,'Rehire cost job increases2750');
 for(const key of ['directJob','costJob'])eq(r2(after.profit[key]-before.profit[key]),2750,'business lines '+key+' increases2750');for(const key of ['direct','costNow','revNow','revJob'])eq(after.profit[key],before.profit[key],'business lines '+key+' unchanged');
 for(const key of ['hire','rehire'])for(const phase of ['now','job'])eq(r2(find(after.profit.rev,key)[phase]-find(before.profit.rev,key)[phase]),key==='hire'?-5704.26:5704.26,'exact existing customer Revenue reclassification '+key+' '+phase);
 for(const row of before.profit.rev.filter(r=>!['hire','rehire'].includes(r.key)))eq(find(after.profit.rev,row.key),row,'other Revenue stream unchanged '+row.key);
 const ep=xs=>xs.find(g=>g.what==='Toilets — Event Portables'),aep=ep(after.rehire.groups),bep=ep(before.rehire.groups);ok(aep&&bep,'Event Portables group remains identifiable');
 for(const key of ['cost','revToCome'])eq(aep[key],bep[key],'Event Portables '+key+' unchanged');for(const key of ['rev','revJob'])eq(r2(aep[key]-bep[key]),5704.26,'existing hire assigned to Event Portables '+key);for(const key of ['costToCome','costJob'])eq(r2(aep[key]-bep[key]),2750,'Event Portables '+key+' increases2750');eq(aep.lines-bep.lines,1,'one existing contract line classified');eq(aep.units-bep.units,2,'both existing units classified');
 for(const key of ['toCome','job'])eq(r2(after.handover.costTotal[key]-before.handover.costTotal[key]),2750,'Finance handover '+key+' increases2750');eq(after.handover.costTotal.toDate,before.handover.costTotal.toDate,'Finance handover known costs unchanged');eq(r2(after.handover.costTotal.by.KINP-before.handover.costTotal.by.KINP),2750,'forecast assigned once to KINP');for(const branch of Object.keys(before.handover.costTotal.by).filter(b=>b!=='KINP'))eq(after.handover.costTotal.by[branch],before.handover.costTotal.by[branch],'other branch costs unchanged '+branch);eq(after.handover.invTotal,before.handover.invTotal,'Finance invoice/Revenue totals unchanged');
 for(const month of ['2026-09','2026-10','2026-11','2026-12']){
  const a=after.months[month],b=before.months[month];
  if(month!=='2026-10')eq(a,b,month+' Finance model completely unchanged');
  else{
   eq(r2(a.forecastCostTotal-b.forecastCostTotal),2750,'October Finance forecast increases2750');eq(a.revenueTotal,b.revenueTotal,'October total Revenue unchanged');eq(a.forecastRevenueTotal,b.forecastRevenueTotal,'October forecast Revenue unchanged');
   const group=(m,name)=>r2(m.revenue.filter(r=>r.stream===name&&r.branch==='KINP').reduce((n,r)=>n+r.amount,0));
   eq(r2(group(a,'Toilet Hire Revenue — event allocation')-group(b,'Toilet Hire Revenue — event allocation')),-5704.26,'October Hire classification decreases5704.26');eq(r2(group(a,'Toilet Rehire Revenue — event allocation')-group(b,'Toilet Rehire Revenue — event allocation')),5704.26,'October Rehire classification increases5704.26');
   const sources=m=>m.revenue.flatMap(r=>(r.extra.sources||[]).map(s=>({branch:r.branch,...s}))).map(s=>JSON.stringify(s)).sort();eq(sources(a),sources(b),'every October customer Revenue source and amount retained');
   eq(a.costAccrue,b.costAccrue,'estimate does not become an accrual');eq(a.invoiceRecords,b.invoiceRecords,'invoice records unchanged');eq(a.invoiced,b.invoiced,'invoice value unchanged');
  }
 }
 eq(after.wc31.quantity,2,'customer hire already covers two');eq(after.wc31.units,['12','74'],'two physical supplier units retain native labour identities');eq(after.wc31.contract.length,1,'one contract line for both blocks');eq(after.wc31.contract[0].r.quantity,2,'contract quantity already two');eq(after.wc31.contract[0].charge.amount,5704.26,'contract hire already charged5704.26');
 eq(after.wc31.slots.filter(s=>s.key==='install'&&s.state==='charged').map(s=>s.value),[145.74,145.74],'both existing installation charges retained');eq(after.wc31.slots.filter(s=>s.key==='demob'&&s.state==='later').map(s=>s.value),[145.74,145.74],'both demob forecasts retained without completing work');
 eq(after.wc31.contract[0].owner.owner,'event-portables','WC31 contract ownership follows exact native physical identities');eq(after.wc31.contract[0].r.match.key,null,'raw unmatched contract source retained');
 const sc=after.scenarios;eq(sc.nativeInput,model,'native helper closes to existing quote/units/cost getter inputs');eq(sc.exact.estimate,0,'exact recorded variation suppresses extra estimate');eq(sc.exact.state,'recorded-variation','exact coverage remains an actual-record match');eq(sc.partial.estimate,0,'partial recorded coverage does not invent remaining full-period cost');eq(sc.partial.held,true,'partial coverage clearly held');eq(sc.broaderQuantity.estimate,0,'broader quantity cannot suppress an exact-unit forecast as full coverage');eq(sc.broaderQuantity.held,true,'broader coverage quantity is held for review');
 for(const key of ['generic','otherReference','transport'])eq(sc[key].estimate,2750,key+' record does not suppress unrelated hire estimate');eq(sc.oneUnit.estimate,0,'removing second physical EP unit removes forecast');eq(sc.owner.owner,'event-portables','pure exact ownership match');eq(sc.ownerWrongLine,null,'other contract line does not get inferred supplier');eq(sc.ownerMixed,null,'mixed unit ownership does not get blanket supplier classification');
 eq(sha(fs.readFileSync(PAGE)),inputHashes.candidate,'candidate bytes unchanged throughout native proof');eq(sha(fs.readFileSync(BASE)),inputHashes.base,'baseline bytes unchanged throughout native proof');
 const summary={author:'Andrew Fisher',candidateSha256:inputHashes.candidate,baseSha256:inputHashes.base,checks,nativeVersion:after.version,nativeTies:after.recon.ties.length,fullStateUnchanged:true,actualsUnchanged:true,customerChargesUnchanged:true,hireToRehireClassification:5704.26,approvedQuotesUnchanged:true,transportUnchanged:true,forecastDelta:2750,onlyForecastMonth:'2026-10',operationalWrites:0,errors:0,viewport:after.ui&&{width:after.ui.width,documentWidth:after.ui.documentWidth}};
 save('summary.json',summary);console.log(JSON.stringify(summary));
})().catch(e=>{fs.writeFileSync(path.join(OUT,'failure.txt'),e.stack,{mode:0o600});console.error('WC31 forecast proof failed; inspect private failure.txt: '+String(e.message).slice(0,300));process.exitCode=1});
