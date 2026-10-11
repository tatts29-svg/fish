// Author: Andrew Fisher. Read-only live-record grouping and shared delivery projection checks.
const fs=require('fs'),path=require('path'),assert=require('assert/strict'),crypto=require('crypto');
const harness=path.resolve(__dirname,'../toolchain/harness'),f=require(harness+'/curlfetch'),original=f.curlFetch;let publicSha;
f.curlFetch=async function(url,headers,method,body){
 const u=new URL(url);
 if(method==='POST'&&u.origin==='https://tile.googleapis.com'&&u.pathname==='/v1/createSession')return {status:200,headers:{'content-type':'application/json'},body:Buffer.from(JSON.stringify({session:'read-only-map-fixture',expiry:String(Math.floor(Date.now()/1000)+600),tileWidth:256,tileHeight:256,imageFormat:'png'}))};
 assert.equal(method,'GET');
 if(u.origin==='https://tile.googleapis.com'&&u.pathname.startsWith('/v1/2dtiles/'))return {status:200,headers:{'content-type':'image/png'},body:Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aPt8AAAAASUVORK5CYII=','base64')};
 const r=await original(url,headers,method,body);if(u.origin==='https://gc500-production.up.railway.app'&&u.pathname.replace(/\/$/,'')==='/v/Coates-GC500-2026')publicSha=crypto.createHash('sha256').update(r.body).digest('hex');return r;
};
const {open}=require(harness+'/open_page'),out=process.env.OUTDIR||'/workspace/private-gc500-runs999',mobile=process.env.MOB==='1';fs.mkdirSync(out,{recursive:true});
(async()=>{let h;try{
 h=await open({pageFile:process.env.PUBLIC==='1'?undefined:process.env.PAGE,hash:'#subhired',mobile,W:mobile?390:1440,H:mobile?844:960,dpr:mobile?2:1});
 await h.page.waitForFunction(()=>SYNC.status==='live'&&SYNC.first.size===Object.keys(SYNC_COLLS).length&&DOCS.state==='ready'&&document.documentElement.dataset.refresh904==='ready'&&Number(SYNC.backend.readVersion821())>=5320,null,{timeout:180000});
 if(process.env.PUBLIC==='1'){assert.equal(h.counts.page,0);assert.equal(publicSha,process.env.EXPECTED_SHA);}
 const result=await h.page.evaluate(()=>{
  const before=JSON.stringify(S),M=Supplier996.model(),days=[...new Set(M.remaining.map(r=>r.date))],groups=days.map(date=>{const loads=Supplier996.inboundLoads(date),native=dpLoads(programmeDays().find(d=>d.iso===date)).filter(l=>l._supplier996);return {date,units:loads.map(l=>l.units),nativeUnits:native.map(l=>l._supplier996.units),rows:loads.flatMap(l=>l.stops).map(s=>({ref:s.ref,item:s.item,date:s.date,count:s.count})),expected:M.remaining.filter(r=>r.date===date).map(r=>({ref:r.ref,item:r.item,date:r.date,count:r.remaining})),capacity:loads.every(l=>l.units<=24&&l.panels<=6)};});
  renderSubhired932();const wrapper=document.querySelector('[data-supplier996]'),details=[...wrapper.querySelectorAll('details')].filter(d=>d.querySelector(':scope > summary')?.textContent.includes('Tue 13 Oct'));if(details.length)details[0].open=true;
  return {groups,summary:M.summary,version:SYNC.backend.readVersion821(),recordsUnchanged:before===JSON.stringify(S),subhireText:wrapper.innerText,overflow:document.documentElement.scrollWidth>innerWidth+1,demob:Supplier996.demobLoads()};
 });
 const expected={'2026-10-13':[24,3],'2026-10-15':[24],'2026-10-19':[24,20],'2026-10-22':[4]},checks=[];
 const check=(name,test)=>{assert(test,name);checks.push(name);};
 const totals=rows=>{const m={};for(const r of rows){const k=[r.ref,r.item,r.date].join('|');m[k]=(m[k]||0)+r.count;}return m;};
 for(const g of result.groups){assert.deepEqual(g.units,expected[g.date]);checks.push(g.date+' full runs and remainder');assert.deepEqual(g.nativeUnits,g.units);checks.push(g.date+' daily cards match supplier runs');assert.deepEqual(totals(g.rows),totals(g.expected));checks.push(g.date+' each location and date conserved');check(g.date+' capacity respected',g.capacity);}
 check('All 99 outstanding toilets retained',result.summary.remaining===99&&result.groups.flatMap(g=>g.units).reduce((a,b)=>a+b,0)===99);
 check('Six physical delivery runs',result.groups.reduce((n,g)=>n+g.units.length,0)===6);
 check('Both corrected locations retain actual quantities',result.summary.onSite===97&&result.summary.fwf.unallocated===6);
 check('Supplier UI shows full24 and final3',result.subhireText.includes('Proposed load 1 · 24 portaloos')&&result.subhireText.includes('Proposed load 2 · 3 portaloos'));
 check('Native records unchanged',result.recordsUnchanged);check('No viewport overflow',!result.overflow);
 const target=h.page.locator('[data-supplier996] details').filter({has:h.page.locator(':scope > summary',{hasText:'Tue 13 Oct 2026'})}).first();
 await h.page.evaluate(()=>{const s=[...document.querySelectorAll('[data-supplier996] summary')].find(el=>el.textContent.startsWith('Tue 13 Oct 2026'));s?.scrollIntoView({block:'start'});});
 await h.page.screenshot({path:path.join(out,'runs.png')});
 check('No page errors',h.errors.length===0);check('No operational writes',h.counts.blocked===0);
 fs.writeFileSync(path.join(out,'result.json'),JSON.stringify({author:'Andrew Fisher',checks,publicSha,recordVersion:result.version,groups:result.groups.map(({date,units,nativeUnits})=>({date,units,nativeUnits})),counts:h.counts,errors:h.errors},null,2));
 console.log(JSON.stringify({pass:true,checks:checks.length,groups:result.groups.map(({date,units})=>({date,units})),out}));
 }finally{if(h)await h.browser.close();}})().catch(e=>{console.error(e.stack);process.exitCode=1;});
