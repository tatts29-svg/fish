/* Author: Andrew Fisher. Native map searching, complete locations, source guards and read-only integration. */
const fs=require('fs'),path=require('path'),assert=require('assert'),{open}=require('../../toolchain/harness/open_page');
(async()=>{const mobile=process.env.MOB==='1',out=process.env.OUT,checks=[],h=await open({pageFile:process.env.PAGE,hash:'#sheet/__explorer',W:mobile?390:1440,H:mobile?844:1000,dpr:mobile?2:1,mobile}),p=h.page;
fs.mkdirSync(out,{recursive:true});const consoles=[];p.on('console',m=>{if(m.type()==='error')consoles.push(m.text());});
function check(name,ok,detail){checks.push({name,ok:!!ok,detail});fs.writeFileSync(path.join(out,'checks.json'),JSON.stringify(checks,null,2));console.log((ok?'PASS ':'FAIL ')+name);assert(ok,name);}
try{
 await p.waitForFunction(()=>document.querySelector('#expFrame')?.contentWindow?.GC500Search1210?.state.sourceOK&&SYNC.status==='live',null,{timeout:180000});const f=p.frames().find(f=>f.url().includes('/explorer/index.html'));const record=await p.evaluate(()=>JSON.stringify(S));
 const expected={firstaid:6,information:3,police:1,photographer:12,broadcast:20,marshal:25,yellowflag:1,emergency:24,hydrant:18};const state=await f.evaluate(()=>GC500Search1210.state);
 check('reviewed drawing identity and all 110 source occurrences available',state.sourceOK&&Object.entries(expected).every(([k,n])=>state.symbolCounts[k]===n),state.symbolCounts);
 await p.locator('#f1176q').fill('first aid');await p.waitForTimeout(500);
 check('actual parent search shows all first-aid locations',await p.locator('[data-f1176-hit]').count()===6&&await f.evaluate(()=>GC500Search1210.state.marked===6));
 await p.locator('#f1176find form button[type=submit]').click();await p.waitForTimeout(750);
 check('Find fits every match instead of opening the first drawer',await p.locator('.drawer.find1176').count()===0&&await f.evaluate(()=>GC500Search1210.state.marked===6));
 check('all six first-aid markers fit the current map',await f.evaluate(()=>{const M=sheetToDevice(currentView().scale,sw,sh);return marks.length===6&&marks.every(m=>m.it.places.every(b=>{const p=toGeo((b[0]+b[2])/2,(b[1]+b[3])/2),v=applyM(M,p.x,p.y);return v.x>=-2&&v.x<=sw+2&&v.y>=-2&&v.y<=sh+2;}));}));
 await p.screenshot({path:path.join(out,'parent-search.png'),fullPage:false});
 const categories=[['information',3],['police',1],['photographer',12],['broadcast camera',20],['cameras',32],['MP',25],['YFR',1],['emergency egress',24],['FH',18]];
 for(const [q,count]of categories){const r=await f.evaluate(q=>{const r=GC500Search1210.search(q);return {rows:r.rows.length,placed:r.placed,marked:GC500Search1210.state.marked,unplaced:r.unplaced};},q);check(q+' finds every source location without substring or legend duplicates',r.rows===count&&r.placed===count&&r.marked===count&&!r.unplaced,r);}
 const toilets=await p.evaluate(()=>{const r=Find1176.search('toilets');return {rows:r.rows.length,placed:r.placed,unplaced:r.unplaced,noFalsePins:r.rows.filter(x=>x.none).every(x=>!Number.isFinite(x.lat)&&!Number.isFinite(x.lon))};});
 check('toilets are not truncated to ten or twenty matches',toilets.rows>20&&toilets.placed>20&&toilets.unplaced>0,toilets);
 check('unplaced references never become pit-lane equipment pins',toilets.noFalsePins);
 for(const [q,count]of [['stand 5',1],['turn 2',1],['stand 26',0],['turn 16',0]])check(q+' keeps exact reference semantics',await f.evaluate(({q,count})=>GC500Search1210.search(q).rows.length===count,{q,count}));
 for(const q of ['gate 6','VMS 10','WC 41']){const r=await f.evaluate(q=>{const r=GC500Search1210.search(q);return {count:r.rows.length,ids:r.rows.map(x=>x.code1210)};},q);check(q+' retains spaced reference matching',r.count>0,r);}
 const armco=await f.evaluate(()=>{const r=GC500Search1210.search('armco');return {n:r.placed,clear:marks.every(m=>m.it.places.every(b=>b[1]<1466))};});check('all Armco positions exclude the legend sample',armco.n>20&&armco.clear,armco);
 await p.locator('#expFull').click();await p.waitForTimeout(200);
 await f.evaluate(()=>panel813(true));await f.locator('#q').fill('first aid');await p.waitForTimeout(600);
 check('native search input lists all matches and the Show all control',await f.locator('[data-search1210-code]').count()===6&&await f.locator('[data-search1210-all]').count()===1);
 await f.locator('[data-search1210-all]').click();await p.waitForTimeout(600);check('native Show all keeps all markers',await f.evaluate(()=>GC500Search1210.state.marked===6));
 await p.screenshot({path:path.join(out,'all-first-aid.png')});
 await f.evaluate(()=>panel813(true));await f.locator('[data-cat="legend1210-marshal"]').click();await p.waitForTimeout(500);
 check('legend category chip highlights all 25 marshal posts',await f.evaluate(()=>marks.reduce((n,m)=>n+m.it.places.length,0)===25));
 const picks=await f.evaluate(()=>['first aid','photographer','MP','FH','turn 2'].map(q=>{const L=GC500Search1210.search(q).rows[0];return !!L&&GC500Search1210.select(L.code1210,L.place1210)&&selected?.code===L.code1210;}));check('every symbol type and turn can be individually selected',picks.every(Boolean),picks);
 const sourceGuard=await f.evaluate(()=>{const original=P.meta.sha256;try{P.meta.sha256='test changed drawing';buildItems();return !GC500Search1210.state.sourceOK&&!ITEMS.some(i=>i.cat.key);}finally{P.meta.sha256=original;buildItems();}});check('changed drawing stands down the extra source positions',sourceGuard);
 const fresh=await f.evaluate(()=>{for(let i=0;i<3;i++)GC500Explorer.refresh(true);return {count:ITEMS.filter(i=>i.cat.key).length,chips:document.querySelectorAll('[data-cat^="legend1210-"]').length};});check('repeated native refresh does not duplicate symbols or chips',fresh.count===110&&fresh.chips===9,fresh);
 const multi=await f.evaluate(()=>{const old=P.labels,origin=ITEMS.find(i=>i.places.length).places[0],b=origin.slice(),other=b.map((x,i)=>x+(i%2?10:20));try{P.labels=old.concat([['Unique source label1210',...b],['Unique source label1210',...other],['Unique source label1210',100,1500,110,1510]]);const r=GC500Search1210.search('Unique source label1210');return {placed:r.placed,rows:r.rows.length,marked:GC500Search1210.state.marked};}finally{P.labels=old;}});check('free-text drawing search keeps all locations and excludes legend text',multi.placed===2&&multi.rows===2&&multi.marked===2,multi);
 await f.evaluate(()=>GC500Search1210.search(''));check('clearing the search clears stale markers',await f.evaluate(()=>GC500Search1210.state.marked===0));
 check('unknown search creates no location',await f.evaluate(()=>GC500Search1210.search('unrecorded place xyz1210').rows.length===0&&GC500Search1210.state.marked===0));
 check('phone and desktop map controls do not overflow horizontally',await f.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
 check('Showcase version and prior area sharing preserved',await p.evaluate(()=>ShowcaseIncident1207.version===1207&&MapArea1206.version==='v12.06')&&await f.evaluate(()=>GC500Area1206.version==='v12.06'));
 check('shared record unchanged',record===await p.evaluate(()=>JSON.stringify(S)));
 check('zero page or console errors and attempted writes',!h.errors.length&&!consoles.length&&!h.counts.blocked,{errors:h.errors,consoles,writes:h.counts.blocked});
}catch(e){console.error('Page errors',h.errors);throw e;}finally{await h.browser.close();}console.log(checks.length+'/'+checks.length);
})().catch(e=>{console.error(e);process.exit(1)});
