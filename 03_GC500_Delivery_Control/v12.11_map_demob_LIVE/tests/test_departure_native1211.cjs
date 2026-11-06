/* Author: Andrew Fisher. Native departure rehearsal; captures sync locally, blocks every network write. */
const fs=require('fs'),path=require('path'),assert=require('assert'),{open}=require('../../toolchain/harness/open_page');
(async()=>{const mobile=process.env.MOB==='1',out=process.env.OUT,checks=[],h=await open({pageFile:process.env.PAGE,hash:'#sheet/__explorer',W:mobile?390:1440,H:mobile?844:1000,dpr:mobile?2:1,mobile}),p=h.page;fs.mkdirSync(out,{recursive:true});
function check(name,ok){checks.push({name,ok:!!ok});fs.writeFileSync(path.join(out,'checks.json'),JSON.stringify(checks,null,2));console.log((ok?'PASS ':'FAIL ')+name);assert(ok,name);}
try{
 await p.waitForFunction(()=>document.querySelector('#expFrame')?.contentWindow?.GC500Departure1211&&SYNC.status==='live',null,{timeout:180000});const f=p.frames().find(x=>x.url().includes('/explorer/index.html'));
 check('departure helper loaded without errors',!h.errors.length);
 const key=await p.evaluate(()=>holdAssets(()=>demob816().refs.find(r=>{const s=DemobCollection996.snapshot(r.key);return r.units.length===1&&r.units[0].type==='FWF'&&r.units[0].n>=2&&s?.record.state==='on site'&&s.reading.arrival&&!s.reading.issues.length&&!s.reading.recorded&&s.pools.fwf?.length===r.units[0].n;})?.key));check('native multi-unit reference available for local rehearsal',!!key);
 check('view link refuses departure recording',await p.evaluate(k=>DemobCollection996.open(k)===false,key));
 // Freeze incoming polling after hydration; no service writes can pass the harness.
 await p.context().route('**/api/version',r=>r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({version:0,level:'edit'})}));
 await p.context().route('**/api/state*',r=>r.abort());
 await p.evaluate(k=>{window.__saved1211=JSON.stringify(S);window.__captured1211=[];SYNC.claims='edit';Object.defineProperty(SYNC,'level',{configurable:true,get:()=> 'edit',set:()=>{}});Object.defineProperty(SYNC,'readonly',{configurable:true,get:()=>false,set:()=>{}});SYNC.db.doc=name=>({set:async value=>{__captured1211.push({name,value});return{};},delete:async()=>{throw Error('Deletion disallowed');}});S.operator='Example test recorder';const who=document.getElementById('who');if(who)who.value=S.operator;const d=S.delivery[k]||(S.delivery[k]={});d.emptied=true;d.emptied_at=new Date().toISOString();d.emptied_by=S.operator;window.__before1211={record:JSON.parse(JSON.stringify(deliveryOf(k))),numbers:gcUnits925(assetOf(k),{loading:false}).map(u=>[u.id,u.assetNo]),arrival:lastOnSite816(k),green:greenDayOf(deliveryOf(k)),charges:JSON.stringify(chargeLines(assetOf(k)))};},key);
 check('native pump-out hold remains effective',await p.evaluate(k=>{const d=S.delivery[k],old=d.emptied;d.emptied=false;const ok=DemobCollection996.open(k);d.emptied=old;return ok===false&&!document.querySelector('#collection996');},key));
 check('native departure modal opens',await p.evaluate(k=>DemobCollection996.open(k),key));
 check('actual time starts blank',await p.locator('[name=collection-time]').inputValue()==='');
 await p.locator('#collection996 input[type=checkbox]').first().check();await p.locator('[data-departure-now]').click();
 await p.screenshot({path:path.join(out,'departure-dialog.png')});check('phone departure dialog fits width',await p.evaluate(()=>{const e=document.querySelector('#collection996'),r=e.getBoundingClientRect();return r.left>=0&&r.right<=innerWidth+1&&e.scrollWidth<=e.clientWidth+1;}));
 const firstId=await p.locator('#collection996 input[type=checkbox]').first().inputValue();await p.locator('#collection996 button[type=submit]').click();await p.waitForFunction(()=>!document.querySelector('#collection996'),null,{timeout:10000});
 const first=await p.evaluate(({k,id})=>{const r=Departure1211.status(k),d=deliveryOf(k);return{collected:r.collected,remaining:r.remaining,complete:r.complete,stamp:r.events[0]?.departedAt1211,pool:DemobCollection996.snapshot(k).pools.fwf,availability:d.state,kept:JSON.stringify([d.done,d.steps,d.levelled])===JSON.stringify([__before1211.record.done,__before1211.record.steps,__before1211.record.levelled]),pump:emptiedOf816(k).on,arrival:lastOnSite816(k)===__before1211.arrival,green:greenDayOf(d)===__before1211.green,numbers:JSON.stringify(gcUnits925(assetOf(k),{loading:false}).map(u=>[u.id,u.assetNo]))===JSON.stringify(__before1211.numbers),charges:JSON.stringify(chargeLines(assetOf(k)))===__before1211.charges,badge:Departure1211.unitHtml(k,id,'FWF').includes('LEFT SITE')};},{k:key,id:firstId});
 check('one selected unit recorded with actual departure time',first.collected===1&&first.remaining>0&&!first.complete&&!!first.stamp);
 check('partial keeps installation and remaining availability',first.kept&&first.availability==='on site');
 check('partial does not revoke pump-out or create a new arrival',first.pump&&first.arrival&&first.green);
 check('collected identity absent from remaining pool',!first.pool.includes(firstId));
 check('physical identity and charge lines preserved',first.numbers&&first.charges);
 check('departed physical unit has explicit marker',first.badge);
 check('inventory count and identities agree with remaining stock',await p.evaluate(k=>holdAssets(()=>{const s=DemobCollection996.snapshot(k),a=assetOf(k),r=inventory().list.find(x=>x.item==='FWF')?.refs[k];return r&&r.on===s.reading.remaining[0].n&&inventoryNumbers938(a,'FWF',r.on).length===s.pools.fwf.length;}),key));
 check('Coates finder excludes collected physical identity',await p.evaluate(({k,id})=>!MapDemob1211.coatesFWF().find(r=>r.key===k)?.units.some(u=>u.id===id),{k:key,id:firstId}));
 await f.evaluate(()=>GC500Departure1211.refresh());check('map marker updates from the native record',await f.evaluate(k=>GC500Departure1211.state.some(x=>x.key===k&&x.collected===1&&!x.complete),key));
 check('Left site search includes every recorded departure location',await f.evaluate(k=>GC500Search1210.search('Demob departed').rows.some(r=>r.code1210===k),key));
 check('Still to leave search keeps partially collected reference',await f.evaluate(k=>GC500Search1210.search('Demob remaining').rows.some(r=>r.code1210===k),key));
 await f.evaluate(k=>{const r=GC500Search1210.search(k).rows.find(x=>x.code1210===k&&!x.none);if(!r)throw Error('No map place');GC500Search1210.select(r.code1210,r.place1210);const it=ITEMS.find(x=>x.code===r.code1210),b=it.places[0],g=toGeo((b[0]+b[2])/2,(b[1]+b[3])/2),v=applyM(sheetToDevice(currentView().scale,sw,sh),g.x,g.y);GC500Spot1117.drop(v.x,v.y);},key);
 await f.locator('[data-demob1211]').click();check('50 m picker displays departure history',await f.locator('#demob1211').innerText().then(t=>t.includes('Departure history')&&t.includes('AEST')));
 check('50 m picker cannot select already departed asset',await f.evaluate(({k,id})=>{const r=parent.MapDemob1211.reference(k);return !r.items.some(i=>i.units.some(u=>u.id===id));},{k:key,id:firstId}));
 await f.locator('[data-close]').click();await p.evaluate(k=>DemobCollection996.open(k),key);
 check('second native picker excludes collected identity',await p.evaluate(id=>![...document.querySelectorAll('#collection996 input[type=checkbox]')].some(x=>x.value===id),firstId));
 for(const b of await p.locator('#collection996 input[type=checkbox]').all())await b.check();await p.locator('[data-departure-now]').click();await p.locator('#collection996 button[type=submit]').click();await p.waitForFunction(()=>!document.querySelector('#collection996'),null,{timeout:10000});
 check('final collection records zero remaining and native transit state',await p.evaluate(k=>{const s=Departure1211.status(k);return s.complete&&s.remaining===0&&s.events.length===2&&deliveryOf(k).state==='in transit';},key));
 check('completed reference has no pickup selections',await p.evaluate(k=>MapDemob1211.reference(k).items.length===0,key));
 await f.evaluate(()=>GC500Departure1211.refresh());check('departed reference loses the map completion tick',await f.evaluate(k=>!GC500Explorer897.isComplete(k),key));
 check('map shows LEFT SITE and removes reference from remaining search',await f.evaluate(k=>GC500Departure1211.state.some(x=>x.key===k&&x.complete&&x.label==='Left site')&&!GC500Search1210.search('Demob remaining').rows.some(x=>x.code1210===k),key));
 await p.screenshot({path:path.join(out,'left-site-map.png')});
 check('native history remains readable with two departure times',await p.evaluate(k=>Departure1211.historyHtml(k).includes('Departure history · 2')&&journal().filter(x=>x.ref===k&&x.what.startsWith('Left site:')).length===2,key));
 check('record writes captured locally only',await p.evaluate(()=>__captured1211.length>0)&&!h.counts.blocked);
 check('no runtime errors during native collection and map redraw',!h.errors.length);
} catch(e){fs.writeFileSync(path.join(out,'failure-private.json'),JSON.stringify(await p.evaluate(()=>({dialog:document.querySelector('#collection996')?.innerText,invalid:[...document.querySelectorAll('#collection996 :invalid')].map(x=>({tag:x.tagName,name:x.name,validation:x.validationMessage,value:x.value})),sync:SYNC.status,readonly:SYNC.readonly,unkept:SYNC.unkept,bump:bump.kept,level:SYNC.level})),null,2));console.error('Runtime errors',h.errors);throw e;}finally{await h.browser.close();}console.log(checks.length+'/'+checks.length);
})().catch(e=>{console.error(e);process.exit(1)});
