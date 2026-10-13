/* Author: Andrew Fisher. Quantity truth on the map; every operational write stays blocked. */
'use strict';
const fs=require('fs'),path=require('path'),crypto=require('crypto'),assert=require('node:assert/strict'),Module=require('module');
const release=path.resolve(__dirname,'../..'),live=process.env.LIVE==='1',mobile=process.env.MOB==='1';
const out=process.env.OUT||('/workspace/private-quantity1010-'+(live?'public-':'candidate-')+(mobile?'phone':'desktop'));
if(!live&&(!process.env.PAGE||!process.env.MAP_CODE))throw Error('Candidate mode needs PAGE and MAP_CODE');
fs.mkdirSync(out,{recursive:true});const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const report={author:'Andrew Fisher',mode:live?'public':'candidate',checks:[],servedAssets:[],screenshots:[],errors:[],consoleErrors:[]};
const check=(name,value,detail)=>{report.checks.push({name,pass:!!value,...(detail===undefined?{}:{detail})});assert(value,name);};
const harness=path.resolve(release,'../toolchain/harness/open_page.js'),mod=new Module(harness,module);mod.filename=harness;mod.paths=Module._nodeModulePaths(path.dirname(harness));
global.__quantityTransport1010={live,code:process.env.MAP_CODE,nonce:'quantity1010-'+process.pid+'-'+Date.now(),served:report.servedAssets,consoleErrors:report.consoleErrors};
const hook=`
    const match1010=new URL(u).origin===HOST&&new URL(u).pathname.match(/^\\/w\\/[^/]+\\/explorer\\/(index\\.html|explorer(?:-merge)?\\.js)$/);
    if(r.method()==='GET'&&match1010){const cfg=global.__quantityTransport1010,name=match1010[1];let answer;
      if(cfg.live){const fresh=new URL(u);fresh.searchParams.set('_verify1010',cfg.nonce);answer=await curlFetch(fresh.href,r.headers(),'GET');}
      else answer={status:200,headers:{'content-type':name.endsWith('.html')?'text/html; charset=utf-8':'application/javascript','cache-control':'no-store'},body:fs.readFileSync(require('path').join(cfg.code,name))};
      cfg.served.push({name,status:answer.status,sha256:require('crypto').createHash('sha256').update(answer.body).digest('hex')});return route.fulfill(answer);
    }
`;
const original=fs.readFileSync(harness,'utf8'),anchor='    const okPost =',goto='  await page.goto(';
assert.equal(original.split(anchor).length,2);assert.equal(original.split(goto).length,2);
mod._compile(original.replace(anchor,hook+anchor).replace(goto,"  page.on('console',m=>{if(m.type()==='error')global.__quantityTransport1010.consoleErrors.push(m.text().slice(0,300));});\n"+goto),harness);require.cache[harness]=mod;
const {open}=require(harness);let h,p,frame,before;
const pull=()=>frame.evaluate(()=>{complete897Pull();drawMarks(currentView());});
async function select(key){await frame.evaluate(k=>GC500Explorer.find(k),key);await frame.waitForFunction(()=>gotoAnim887===0&&zAnim===0,null,{timeout:15000});await pull();}
async function shot(name){const f=path.join(out,name+'.png');await p.screenshot({path:f});report.screenshots.push(f);}
async function fixture(quantity,state='complete'){
 await p.evaluate(({quantity,state})=>{window.gc500MapStatus1009=keys=>{const source=window.__quantityBridge1010(keys);return {...source,states:source.states.map(r=>r.key==='WC50'?{...r,state,label:state==='complete'?'COMPLETE':'PARTIAL',quantity}:r)};};},{quantity,state});await pull();
}
(async()=>{try{
 h=await open({pageFile:live?undefined:process.env.PAGE,hash:'#sheet/__explorer',mobile,W:mobile?390:1440,H:mobile?844:1000,dpr:mobile?2:1});p=h.page;
 await p.waitForFunction(()=>SYNC.status==='live'&&SYNC.first.size===Object.keys(SYNC_COLLS).length,null,{timeout:120000});
 before=await p.evaluate(()=>({record:JSON.stringify(S),version:SYNC.backend.readVersion821()}));report.recordVersion=before.version;
 report.sha256=live?await p.evaluate(async()=>{const r=await fetch('/v/Coates-GC500-2026',{cache:'no-store'});if(!r.ok)throw Error('Public parent page unavailable');return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',await r.arrayBuffer())),n=>n.toString(16).padStart(2,'0')).join('');}):hash(fs.readFileSync(process.env.PAGE));
 check('Parent matches expected candidate',!process.env.EXPECTED_SHA||report.sha256===process.env.EXPECTED_SHA);
 await p.waitForFunction(()=>EXP.frame&&EXP.frame.contentWindow.__ready,null,{timeout:120000});frame=p.frames().find(f=>/\/explorer\/index\.html(?:\?|$)/.test(f.url()));assert(frame);
 await frame.evaluate(()=>GC500Explorer.ready);await pull();
 const actual=await p.evaluate(()=>gc500MapStatus1009(['WC09','WC50']));report.actual=actual;
 const wc9=actual.states.find(r=>r.key==='WC09'),wc50=actual.states.find(r=>r.key==='WC50');
 check('WC09 preserves six pee panels',wc9.quantity.items.some(r=>/pee panel/i.test(r.item)&&r.quantity===6));
 check('WC09 preserves four FWF separately',wc9.quantity.items.some(r=>/fwf/i.test(r.item)&&r.quantity===4));
 check('WC09 has two typed groups rather than ten identical toilets',wc9.quantity.items.length===2);
 check('WC50 current quantity is one',wc50.quantity.items.length===1&&wc50.quantity.items[0].quantity===1);
 await select('WC50');let state=await frame.evaluate(()=>mapStatus1009(selected));
 check('WC50 verified complete shows1/1',state.state!=='complete'||state.quantity1010.summary==='1/1');
 check('Selected accessible text includes quantity',await frame.evaluate(()=>document.getElementById('mapStatus1009').textContent.includes(mapStatus1009(selected).quantity1010.summary)));
 await shot('wc50-quantity');await select('WC09');state=await frame.evaluate(()=>mapStatus1009(selected));
 check('Map keeps mixed descriptions',state.quantity1010.items.some(r=>/pee panel/i.test(r.item)&&r.quantity===6)&&state.quantity1010.items.some(r=>/fwf/i.test(r.item)&&r.quantity===4));
 check('Mixed box has no combined identical-unit fraction',state.quantity1010.summary==='');
 const card=await frame.evaluate(()=>document.getElementById('xcard').textContent);check('Reference card shows both descriptions',/Pee Panel/.test(card)&&/FWF/.test(card));await shot('wc09-mixed-quantity');
 await select('WC50');await p.evaluate(()=>{window.__quantityBridge1010=window.gc500MapStatus1009;});const camera=await frame.evaluate(()=>JSON.stringify(GC500Explorer.state.view));
 await fixture({items:[{item:'FWF',quantity:6,completed:6,installed:6}]});state=await frame.evaluate(()=>mapStatus1009(selected));check('Changed shared quantity updates6/6',state.quantity1010.summary==='6/6');
 check('Quantity change keeps the camera',await frame.evaluate(c=>JSON.stringify(GC500Explorer.state.view)===c,camera));
 check('Open reference card updates quantity',await frame.evaluate(()=>document.getElementById('xcard').textContent.includes('6/6')));
 await fixture({items:[{item:'FWF',quantity:6,completed:null,installed:2}]},'partial');state=await frame.evaluate(()=>mapStatus1009(selected));check('Partial remains 2/6 installed without complete claim',state.state==='partial'&&state.quantity1010.summary==='2/6 installed'&&state.glyph!=='check');
 const manyItems=step=>({items:Array.from({length:23},(_,i)=>({item:'Item '+i,quantity:i+1+step,completed:i+1+step}))});
 await fixture(manyItems(0));state=await frame.evaluate(()=>mapStatus1009(selected));check('Many types capped at three quantity lines',state.quantity1010.lines.length===3&&state.quantity1010.lines[2]==='+21 item types');
 check('All 23 types remain available under details',await frame.evaluate(()=>document.querySelectorAll('.map1010-quantities li').length===23));await shot('many-item-quantity');
 await frame.evaluate(()=>{const el=document.querySelector('.map1010-quantities');el.open=true;el.querySelector('summary').focus();});await fixture(manyItems(1));
 check('Open quantities stay open during shared refresh',await frame.evaluate(()=>document.querySelector('.map1010-quantities').open));
 check('Quantity summary retains keyboard focus during refresh',await frame.evaluate(()=>document.activeElement===document.querySelector('.map1010-quantities summary')));
 await frame.evaluate(()=>{document.querySelector('.map1010-quantities').open=false;});await fixture(manyItems(2));
 check('Explicitly closed quantities stay closed during shared refresh',await frame.evaluate(()=>!document.querySelector('.map1010-quantities').open));
 await fixture({items:[{item:'FWF',quantity:null,completed:null}]});state=await frame.evaluate(()=>mapStatus1009(selected));check('Unknown quantity preserves existing complete status',state.state==='complete'&&state.quantity1010.summary==='Qty to confirm');
 await p.evaluate(()=>{window.gc500MapStatus1009=window.__quantityBridge1010;delete window.__quantityBridge1010;});await pull();
 check('Native record remains byte-for-byte unchanged',await p.evaluate(s=>JSON.stringify(S)===s,before.record));
 const expected=JSON.parse(fs.readFileSync(path.join(release,'quantity/evidence/source-bound.json'),'utf8')).changedFiles;
 for(const name of ['explorer.js','explorer-merge.js','index.html']){const actual=report.servedAssets.filter(r=>r.name===name);check(name+' exact reviewed public/candidate bytes',actual.length>0&&actual.every(r=>r.status===200&&r.sha256===expected['explorer/'+name].candidate));}
 check('No page errors',h.errors.length===0);check('No console errors',report.consoleErrors.length===0,report.consoleErrors);check('No operational writes attempted',h.counts.blocked===0);report.pass=true;
 }catch(error){report.pass=false;report.error=String(error.stack||error);process.exitCode=1;}
 finally{if(h){try{await p.evaluate(()=>{if(window.__quantityBridge1010){window.gc500MapStatus1009=window.__quantityBridge1010;delete window.__quantityBridge1010;}});}catch(_){}report.errors=h.errors;report.counts=h.counts;await h.browser.close();}fs.writeFileSync(path.join(out,'quantity1010.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({pass:report.pass,checks:report.checks.length,out,error:report.error}));}})();
