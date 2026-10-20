/* Author: Andrew Fisher. Read-only browser integration; all source fixtures and rendered evidence remain private. */
'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
for(const k of ['PAGE','BASE_PAGE','STATE','PRICING_SPEC','PRIOR_PO','OUT_DIR'])if(!process.env[k])throw Error('Missing '+k);
const fixture=JSON.parse(fs.readFileSync(process.env.STATE,'utf8')),spec=JSON.parse(fs.readFileSync(process.env.PRICING_SPEC,'utf8'));
const rig=path.resolve(__dirname,'../../toolchain/harness'),fetcher=require(rig+'/curlfetch'),originalFetch=fetcher.curlFetch;
let nativeTransportWrites=0,externalPostsBlocked=0,pinnedFiles=null;
fetcher.curlFetch=async function(url,headers,method='GET',body){
 const p=new URL(url).pathname;
 if(method!=='GET'){if(p.startsWith('/api/'))nativeTransportWrites++;else externalPostsBlocked++;return{status:405,headers:{'content-type':'text/plain'},body:'Read-only test'};}
 if(p==='/api/state'||p==='/api/version')return{status:200,headers:{'content-type':'application/json'},body:JSON.stringify(p==='/api/state'?fixture:{version:fixture.version,level:'view',updated:fixture.updated})};
 if(p==='/api/files'){if(!pinnedFiles)pinnedFiles=await originalFetch.call(this,url,headers,method,body);return pinnedFiles;}
 return originalFetch.call(this,url,headers,method,body);
};
const {open}=require(rig+'/open_page'),outDir=process.env.OUT_DIR;fs.mkdirSync(outDir,{recursive:true,mode:0o700});
const checks=[];function ck(name,pass,detail){checks.push({name,pass:!!pass,...(!pass&&detail!==undefined?{detail}:{})});}
const canonical=x=>JSON.stringify((function sorted(v){return Array.isArray(v)?v.map(sorted):v&&typeof v==='object'?Object.fromEntries(Object.keys(v).sort().map(k=>[k,sorted(v[k])])):v;})(x));
const snapshot=function(arg){return holdAssets(()=>{
 const clone=x=>JSON.parse(JSON.stringify(x)),m=moneySummary(),p=pl770Model(),f=fh866Model(),orders=supplierPricing1014();
 return clone({docs:Object.fromEntries(Object.keys(SYNC_COLLS).map(k=>[k,toDocs(k)])),split:fencePaidSplit(),derived:fenceDerived(),green:greenBookTotals(),money:m,pl:p,finance:f,monthly:acc761Model(arg.month),dockets:allDockets(),notes:serviceNoteRows(),collections:collectionRows(),costs:allCosts(),po:poOf(arg.no),priorPo:poOf(arg.prior),priorPricing:orders.orders.find(o=>o.number===arg.prior)||null,pricing:orders.orders.find(o=>o.number===arg.no)||null,extras:supplierExtras1014(),forecast:cj764Fencing(),evidence:{state:DOCS.state,busy:DOCS.busy,files:Object.keys(DOCS.files||{}).length,attributions:fenceProgrammeReviews958(allDockets()).filter(r=>r.row.attribution).map(r=>({number:r.row.docket_no,state:r.state,attribution:r.attribution}))}});
});};
const arg={no:String(spec.po_number||spec.number),prior:String(process.env.PRIOR_PO),month:spec.supplier_pricing.source.date.slice(0,7)};
async function boot(file,mobile=false){const h=await open({pageFile:file,hash:'#fencing',W:mobile?390:1440,H:mobile?844:1000,mobile});await h.page.waitForFunction(()=>SYNC.status==='live'&&SYNC.first.size===Object.keys(SYNC_COLLS).length,null,{timeout:180000});await h.page.evaluate(()=>docsRefresh(true));await h.page.waitForFunction(()=>DOCS.state==='ready'&&!DOCS.busy,null,{timeout:60000});const fixed=new Date(fixture.updated||Date.now());await h.page.clock.install({time:fixed});await h.page.clock.pauseAt(new Date(fixed.getTime()+1000));await h.page.evaluate(()=>sharedCache975());return h;}
async function practice(h){return h.page.evaluate(input=>{
 const before=Object.fromEntries(Object.keys(SYNC_COLLS).map(k=>[k,toDocs(k)]));
 capability=()=> 'edit';mayWrite=()=>true;whoAmI=()=> 'Andrew Fisher via Codex';SYNC.readonly=false;SYNC.level='edit';
 window.__testOriginalSyncSend1088=syncSend;syncSend=function(){clearTimeout(SYNC.timer);SYNC.timer=null;syncStage();};
 const ok=setPo(input.no,{supplier_pricing:JSON.parse(JSON.stringify(input.pricing))});sharedCache975();
 return{ok,before,after:Object.fromEntries(Object.keys(SYNC_COLLS).map(k=>[k,toDocs(k)])),queued:SYNC.queue};
 },{no:arg.no,pricing:spec.supplier_pricing});}
const cents=n=>Math.round(Number(n)*100),sum=xs=>xs.reduce((n,x)=>n+cents(x),0),eq=(a,b)=>cents(a)===cents(b),changedDocs=(a,b)=>{const out=[];for(const c of new Set([...Object.keys(a),...Object.keys(b)]))for(const id of new Set([...Object.keys(a[c]||{}),...Object.keys(b[c]||{})]))if(canonical(a[c]?.[id]??null)!==canonical(b[c]?.[id]??null))out.push(c+'/'+id);return out;};
(async()=>{let h;const errors=[],counts=[];try{
 h=await boot(process.env.BASE_PAGE);const base=await h.page.evaluate(snapshot,arg);errors.push(...h.errors);counts.push({...h.counts});await h.browser.close();h=null;
 h=await boot(process.env.PAGE);const before=await h.page.evaluate(snapshot,arg);
 ck('candidate without new allocation preserves live financial projections',canonical({money:base.money,pl:base.pl,split:base.split,finance:base.finance,monthly:base.monthly})===canonical({money:before.money,pl:before.pl,split:before.split,finance:before.finance,monthly:before.monthly}));
 ck('candidate preserves prior supplier allocation before staging',canonical(base.priorPricing)===canonical(before.priorPricing)&&canonical(base.priorPo)===canonical(before.priorPo));
 const staged=await practice(h),after=await h.page.evaluate(snapshot,arg),p=after.pricing,expected=spec.expectations;
 ck('source evidence remains ready and unchanged throughout staging',canonical(before.evidence)===canonical(after.evidence)&&after.evidence.state==='ready'&&!after.evidence.busy);
 ck('native setPo accepts source allocation',staged.ok);
 const changes=changedDocs(staged.before,staged.after),allowed=['purchaseOrders/'+arg.no,'stamps/po~2f~'+arg.no,'by/po~2f~'+arg.no];
 ck('native staging changes only the existing PO and audit documents',changes.includes(allowed[0])&&changes.every(x=>allowed.includes(x)),changes);
 ck('supplier source validates in actual page',p?.valid===true,p?.errors);
 ck('supplier source equals PO to exact cents',p?.difference===0&&cents(p.total)===expected.allocation_total_cents&&eq(after.po.amount,p.total));
 ck('red green extras reconcile independently',eq(p.red,expected.book_allocation_totals.red)&&eq(p.green,expected.book_allocation_totals.green)&&eq(p.extrasTotal,expected.extras_total));
 ck('every source record and extra counted once',p.records.length===expected.records_total&&new Set(p.records.map(r=>r.key)).size===p.records.length&&p.extras.length===expected.extras_count&&new Set(p.extras.map(r=>r.id)).size===p.extras.length);
 ck('prior PO fields and supplier allocation remain unchanged',canonical(before.priorPricing)===canonical(after.priorPricing)&&canonical(before.priorPo)===canonical(after.priorPo));
 ck('all physical collections remain unchanged',canonical(before.docs.fenceDockets)===canonical(after.docs.fenceDockets)&&canonical(before.docs.serviceNotes)===canonical(after.docs.serviceNotes)&&canonical(before.docs.fenceCollections)===canonical(after.docs.fenceCollections));
 ck('all customer Revenue projections remain unchanged',canonical(before.money.charge)===canonical(after.money.charge)&&eq(before.pl.revNow,after.pl.revNow)&&eq(before.pl.revJob,after.pl.revJob)&&eq(before.monthly.revenueTotal,after.monthly.revenueTotal)&&canonical(before.costs)===canonical(after.costs));
 ck('remaining physical forecast stays unchanged',canonical(before.forecast)===canonical(after.forecast));
 ck('receipt and invoice states are not invented',canonical(before.monthly.invoiceRecords)===canonical(after.monthly.invoiceRecords)&&['invoice_no','receipted','receipted_amount','confirmed'].every(k=>canonical(before.po[k])===canonical(after.po[k])));
 const redIds=new Set(p.records.filter(r=>r.book==='red').map(r=>r.id)),greenIds=new Set(p.records.filter(r=>r.book==='green').map(r=>r.id));
 const gear=new Set(['clean','scrim','v_gates','ped_gates','ccb_event','ccb_demarc','flat_feet','bases','misc']),labour=new Set(['labour','team_leader','relocation','removal']);
 const oldRed=before.dockets.filter(r=>redIds.has(r.id)).flatMap(r=>r.supplier_lines||r.lines||[]),newRed=p.records.filter(r=>r.book==='red').flatMap(r=>r.lines),oldGreen=before.notes.filter(r=>greenIds.has(r.id));
 const gearDelta=sum(newRed.concat(p.extras).filter(l=>gear.has(l.column)).map(l=>l.paid))-sum(oldRed.filter(l=>gear.has(l.column)).map(l=>l.paid||0));
 const labDelta=sum(newRed.concat(p.extras).filter(l=>labour.has(l.column)).map(l=>l.paid))+cents(p.green)-sum(oldRed.filter(l=>labour.has(l.column)).map(l=>l.paid||0))-sum(oldGreen.map(n=>n.cost||0));
 ck('bases and materials enter Rehire once at source costs',cents(after.split.gear)-cents(before.split.gear)===gearDelta&&newRed.filter(l=>l.column==='bases').length>0&&p.extras.filter(x=>x.column==='misc').length===expected.misc_extras_count);
 ck('daily leaders enter Installation once',cents(after.split.installation)-cents(before.split.installation)===labDelta&&eq(p.extras.filter(x=>x.column==='team_leader').reduce((n,x)=>n+x.paid,0),expected.daily_leader_extras_total));
 ck('gear and Installation completely reconcile supplier cost',after.split.clean&&after.split.other===0&&eq(after.split.gear+after.split.installation,after.derived.cost+after.green.amount));
 const totalDelta=gearDelta+labDelta;
 ck('Direct costs and P&L share exact net change',cents(after.money.cost.known)-cents(before.money.cost.known)===totalDelta&&cents(after.pl.direct)-cents(before.pl.direct)===totalDelta&&cents(after.pl.directJob)-cents(before.pl.directJob)===totalDelta);
 ck('P&L keeps Rehire and Installation categories separate',cents(after.pl.cost.find(r=>r.key==='rehire').now)-cents(before.pl.cost.find(r=>r.key==='rehire').now)===gearDelta&&cents(after.pl.cost.find(r=>r.key==='install').now)-cents(before.pl.cost.find(r=>r.key==='install').now)===labDelta);
 ck('unrelated docket and service costs unchanged',before.dockets.filter(r=>!redIds.has(r.id)).every(r=>canonical(r)===canonical(after.dockets.find(n=>n.id===r.id)))&&before.notes.filter(r=>!greenIds.has(r.id)).every(r=>canonical(r)===canonical(after.notes.find(n=>n.id===r.id))));
 const sources=after.monthly.costs.flatMap(row=>(row.extra?.sources||[]).map(s=>({...s,stream:row.stream,branch:row.branch}))),extraSources=sources.filter(s=>p.extras.some(e=>e.id===s.id));
 ck('Finance accrual includes each dated extra exactly once',extraSources.length===p.extras.length&&new Set(extraSources.map(s=>s.id)).size===p.extras.length,extraSources.map(s=>({id:s.id,stream:s.stream})));
 ck('Finance materials are Rehire and leaders Installation',extraSources.every(s=>{const e=p.extras.find(x=>x.id===s.id);return e.column==='misc'?s.stream==='Rehire — fencing supplier materials':s.stream==='Installation — external contractors, approved team leaders';}));
 ck('Finance extra amounts dates and branch follow source',extraSources.every(s=>{const e=p.extras.find(x=>x.id===s.id);return eq(s.amount,e.paid)&&s.date===e.date&&s.branch===p.branch;}));
 ck('Finance monthly Direct costs use exact source delta',cents(after.monthly.costCandidateTotal)-cents(before.monthly.costCandidateTotal)===totalDelta);
 const outside=expected.unmatched_estimate_outside_total,unmatched=after.notes.find(n=>n.id===outside.id);
 ck('unallocated service note retains separate nonzero estimate',!!unmatched&&!unmatched.supplier_po&&eq(unmatched.cost,outside.amount)&&!p.records.some(r=>r.id===outside.id));
 const ui=await h.page.evaluate(input=>{
 const html=poSupplierBlock1014(input.no),t=document.createElement('template');t.innerHTML=html;
 const more=t.content.querySelector('details'),text=t.content.textContent;
 const escaped=supplierLocation1014({current_location:'<img src=x onerror="window.__unsafe=1">',current_reference:'<svg onload="window.__unsafe=2">',original_source:{file:'<script>window.__unsafe=3</script>',part:2,page:1},linkage:{schedule:[{sheet:'<img src=x onerror=1>',row:1,description:'& <script>x</script>',status:'<b>review</b>'}],maps:[{label:'<img src=x>',scope:'location context',status:'candidate'}],notes:['<script>bad()</script>']}}),e=document.createElement('template');e.innerHTML=escaped;
 return{rows:more?.querySelectorAll('tbody>tr').length,collapsed:!!more&&!more.open,matched:text.includes('Supplier charges match P/O to the cent'),total:text.includes(money(input.amount)),outside:text.includes(String(input.outside.number))&&text.includes('separate docket estimate '+money(Number(input.outside.amount))),caveat:text.includes('does not certify every physical quantity or map location'),safe:e.content.querySelectorAll('img,svg,script').length===0&&e.content.textContent.includes('<script>bad()</script>'),noClaim:e.content.querySelectorAll('[data-fence-trace-map]').length===0,source:text.includes(input.file),html};
 },{no:arg.no,amount:p.total,outside,file:spec.supplier_pricing.source.file});
 ck('PO detail retains all source rows and folded disclosure',ui.rows===p.records.length+p.extras.length&&ui.collapsed);
 ck('PO detail displays exact total and separate unmatched estimate',ui.matched&&ui.total&&ui.outside);
 ck('source metadata is escaped as text',ui.safe);
 ck('source links do not assert a new map claim',ui.noClaim&&ui.caveat);
 ck('source filename survives render',ui.source);
 const snapshotAgain=await h.page.evaluate(snapshot,arg);ck('repeated reads do not duplicate supplier items',canonical(snapshotAgain.split)===canonical(after.split)&&canonical(snapshotAgain.monthly)===canonical(after.monthly));
 await h.page.evaluate(no=>{go('fencing');render();const el=document.querySelector('[data-po-amt="'+no+'"]');if(!el)throw Error('P/O amount control missing');for(let n=el;n;n=n.parentElement)if(n.tagName==='DETAILS')n.open=true;const block=el.closest('tr').querySelector('.po-supplier1014');block.querySelector('details').open=true;block.scrollIntoView({block:'start'});},arg.no);
 await h.page.clock.runFor(200);await h.page.locator('[data-po-amt="'+arg.no+'"]').evaluate(el=>el.closest('tr').querySelector('.po-supplier1014').scrollIntoView({block:'start'}));await h.page.screenshot({path:path.join(outDir,'desktop-po-detail.png')});
 const rendered=await h.page.locator('[data-po-amt="'+arg.no+'"]').evaluate(el=>({rows:el.closest('tr').querySelectorAll('.po-supplier1014 tbody>tr').length,text:el.closest('tr').querySelector('.po-supplier1014').textContent}));
 ck('real Fencing DOM retains source detail after cleanup',rendered.rows===p.records.length+p.extras.length&&rendered.text.includes('Supplier charges match P/O to the cent'));
 fs.writeFileSync(path.join(outDir,'private-comparison.json'),JSON.stringify({before,after,changes,gearDelta,labDelta},null,2),{mode:0o600});
 errors.push(...h.errors);counts.push({...h.counts});await h.browser.close();h=null;
 h=await boot(process.env.PAGE,true);await practice(h);
 await h.page.evaluate(no=>{go('fencing');render();const el=document.querySelector('[data-po-amt="'+no+'"]');if(!el)throw Error('P/O amount control missing');for(let n=el;n;n=n.parentElement)if(n.tagName==='DETAILS')n.open=true;const block=el.closest('tr').querySelector('.po-supplier1014');block.querySelector('details').open=true;block.scrollIntoView({block:'start'});for(const w of document.querySelectorAll('.tblwrap'))w.scrollLeft=0;},arg.no);
 await h.page.clock.runFor(200);await h.page.locator('[data-po-amt="'+arg.no+'"]').evaluate(el=>el.closest('tr').querySelector('.po-supplier1014').scrollIntoView({block:'start'}));await h.page.screenshot({path:path.join(outDir,'phone-po-detail.png')});
 const phone=await h.page.locator('[data-po-amt="'+arg.no+'"]').evaluate(el=>{const row=el.closest('tr'),block=row.querySelector('.po-supplier1014');return{rows:block.querySelectorAll('tbody>tr').length,text:block.textContent,viewport:innerWidth,scroll:document.documentElement.scrollWidth};});
 ck('phone retains complete source allocation and unmatched evidence',phone.rows===p.records.length+p.extras.length&&phone.text.includes(String(outside.number))&&phone.text.includes('Supplier charges match P/O to the cent'),phone);fs.writeFileSync(path.join(outDir,'rendered-phone.json'),JSON.stringify(phone,null,2),{mode:0o600});
 errors.push(...h.errors);counts.push({...h.counts});
 ck('all browser sessions have no page errors',errors.length===0,errors);ck('no native request left read-only test harness',nativeTransportWrites===0&&counts.every(c=>c.blocked===0),{nativeTransportWrites,counts});
 const result={author:'Andrew Fisher',pass:checks.every(c=>c.pass),checks,pageErrors:errors,counts,nativeTransportWrites,externalPostsBlocked,fixtureVersion:fixture.version,candidate:path.basename(process.env.PAGE)};
 fs.writeFileSync(path.join(outDir,'runtime-result.json'),JSON.stringify(result,null,2),{mode:0o600});
 console.log(JSON.stringify({pass:result.pass,checks:checks.length,failed:checks.filter(c=>!c.pass).map(c=>c.name),pageErrors:errors.length,nativeWrites:nativeTransportWrites}));if(!result.pass)process.exitCode=1;
 }finally{if(h)await h.browser.close();}
})().catch(e=>{console.error(e.stack);process.exitCode=1;});
