/* Author: Andrew Fisher. Fresh public release smoke check; all operational writes blocked. */
'use strict';
const fs=require('fs'),{open}=require('./map/tests/readonly1018.cjs');
if(process.env.PAGE||process.env.MAP_CODE)throw Error('Actual-public check refuses local substitutions');
(async()=>{let h;const out={author:'Andrew Fisher',checks:[]},check=(name,pass)=>out.checks.push({name,pass:!!pass});try{
 h=await open({hash:'#today',mobile:true,W:390,H:844,dpr:2});const p=h.page;
 await p.waitForFunction(()=>SYNC.status==='live'&&GC500Refresh904.report().settled,null,{timeout:180000});
 const before=await p.evaluate(()=>({record:JSON.stringify(S),version:SYNC.backend.readVersion821()}));
 const facts=await p.evaluate(()=>({footer:document.querySelector('footer.foot')?.innerText||'',feedback:typeof VisualClarity1018==='object',memo:gcModel925.toString().includes('unitModels1018'),cycle:supplierPricing1014.toString().includes('allCosts(supplierBaseDocket1014)'),version:SYNC.backend.readVersion821()}));
 check('Public page serves v10.18',facts.footer.includes('v10.18'));
 check('Shared feedback module is present',facts.feedback);
 check('Unit projection optimisation is present',facts.memo);
 check('Supplier dependency correction is present',facts.cycle);
 out.routeTimings=[];
 for(const route of ['costs','timeline','plant','today']){
  const r=await p.evaluate(route=>{const t=performance.now();go(route);const pane=document.getElementById('pane-'+state.tab);return {route,milliseconds:Math.round(performance.now()-t),visible:!!pane&&!pane.hidden&&pane.offsetHeight>0,text:!!pane?.innerText.trim(),overflow:document.documentElement.scrollWidth>innerWidth+2};},route);
  check('Public '+route+' opens with content and no horizontal overflow',r.visible&&r.text&&!r.overflow);out.routeTimings.push({route:r.route,milliseconds:r.milliseconds});
 }
 await p.evaluate(()=>{location.hash='#sheet/__explorer'});
 await p.waitForFunction(()=>EXP.frame?.contentWindow?.__ready,null,{timeout:120000});
 const f=p.frames().find(frame=>/\/explorer\/index\.html(?:\?|$)/.test(frame.url()));await f.evaluate(()=>GC500Explorer.ready);
 check('Public map exports camera-change events',await f.evaluate(()=>GC500Explorer.viewEvents1018===true));
 await f.evaluate(()=>{setMode('original');GC500Explorer.find('WC09')});
 await f.waitForFunction(()=>selected?.code==='WC09'&&!gotoAnim887&&!interacting,null,{timeout:20000});
 check('Public map uses compact More info card',await f.evaluate(()=>!!$('xcard').querySelector('.map-why1018')));
 const camera=await f.evaluate(()=>JSON.stringify(camera));await f.evaluate(()=>GC500Explorer.refresh());
 check('Public refresh keeps selected camera',await f.evaluate(c=>selected?.code==='WC09'&&JSON.stringify(camera)===c,camera));
 check('Native record and version stay unchanged',await p.evaluate(b=>JSON.stringify(S)===b.record&&SYNC.backend.readVersion821()===b.version,before));
 check('No local page substitution',h.counts.page===0);check('No operational writes',h.counts.blocked===0);check('No application errors',h.errors.length===0);
 out.nativeVersion=before.version;out.requests=h.counts;out.errors=h.errors;
 }catch(e){out.failure=String(e.stack||e);process.exitCode=1;}finally{if(h)await h.browser.close();if(out.checks.some(c=>!c.pass))process.exitCode=1;fs.writeFileSync(process.env.OUT,JSON.stringify(out,null,2));console.log(JSON.stringify({checks:out.checks.length,failures:out.checks.filter(c=>!c.pass),failure:out.failure,nativeVersion:out.nativeVersion}));}})();
