// Author: Andrew Fisher. Actual print components with isolated instruction fixtures.
// No record mutation: only deliveryOf's return value is wrapped in this browser context.
const fs=require('fs'),path=require('path'),crypto=require('crypto'),assert=require('assert');
const {chromium,devices}=require('playwright'),{curlFetch}=require('../../toolchain/harness/curlfetch');
const html=fs.readFileSync(process.env.PAGE),out=process.env.PRIVATE_OUT;
const noteFixtures=JSON.parse(fs.readFileSync(path.join(__dirname,'control798_note_fixtures.json'),'utf8')).notes;
if(!out)throw new Error('PRIVATE_OUT required');fs.mkdirSync(out,{recursive:true});
const R={author:'Andrew Fisher',candidateSha256:crypto.createHash('sha256').update(html).digest('hex'),runs:[]};
const save=()=>fs.writeFileSync(path.join(out,'print_notes_browser_results.json'),JSON.stringify(R,null,2));
async function run(browser,mobile){
 const r={mode:mobile?'phone':'desktop',checks:[],errors:[],blocked:[],cases:[]};R.runs.push(r);save();
 const c=await browser.newContext({...mobile?{...devices['iPhone 13'],viewport:{width:390,height:844},deviceScaleFactor:1}:{viewport:{width:1440,height:1100}},locale:'en-AU',timezoneId:'Australia/Brisbane'});
 await c.addInitScript(()=>{window.print=()=>{};});
 await c.route('**/*',async route=>{const q=route.request(),u=q.url();if(q.method()!=='GET'){r.blocked.push({method:q.method(),path:new URL(u).pathname});return route.abort();}if(/^https:\/\/gc500-production\.up\.railway\.app\/v\/Coates-GC500-2026\/?(?:\?.*)?$/.test(u.split('#')[0]))return route.fulfill({status:200,contentType:'text/html',body:html});if(u.startsWith('blob:')||u.startsWith('data:'))return route.continue();try{return route.fulfill(await curlFetch(u,q.headers(),'GET'));}catch{return route.abort();}});
 const p=await c.newPage();p.on('pageerror',e=>r.errors.push(e.message));
 const check=(name,yes,detail)=>{r.checks.push({name,pass:!!yes,...detail===undefined?{}:{detail}});save();assert(yes,name);};
 await p.goto('https://gc500-production.up.railway.app/v/Coates-GC500-2026/#timeline',{waitUntil:'load',timeout:180000});await p.waitForFunction(()=>typeof dpDeliveryNotes798==='function'&&SYNC.status==='live',null,{timeout:120000});
 r.browserVersion=browser.version();r.capabilities=await p.evaluate(()=>({isSecureContext,cryptoSubtle:!!crypto.subtle,blobArrayBuffer:typeof Blob.prototype.arrayBuffer==='function',webLocks:!!navigator.locks}));
 const plan=await p.evaluate(noteRows=>{
  const real=deliveryOf,fixtures=Object.fromEntries(noteRows.map(x=>[x.ref,x.note]));window.__fixtures798=fixtures;window.__normalNotes798=dpDeliveryNotes798;
  deliveryOf=key=>Object.assign({},real(key),{note:Object.prototype.hasOwnProperty.call(fixtures,key)?fixtures[key]:null});
  SYNC.db.doc=()=>({set:()=>Promise.reject(new Error('Test prohibits record writes')),delete:()=>Promise.reject(new Error('Test prohibits record writes'))});
  const cases=[];
  for(const iso of ['2026-10-06','2026-10-07']){
   const d=programmeDays().find(x=>x.iso===iso),loads=dpLoads(d);
   const i=loads.findIndex(g=>g.kind==='deliveries'&&g.rows.some(row=>iso==='2026-10-06'?row.a.key==='P08':/building/i.test([row.a.name,row.a.product,...row.a.item_types||[]].join(' '))));
   if(i<0)throw new Error('Expected actual building load for '+iso);
   const g=loads[i],key=g.rows[0].a.key;
   if(!fixtures[key])throw new Error('Exact C2 note fixture required for '+key);
   cases.push({iso,load:i,key,refs:g.rows.map(x=>x.a.key),note:fixtures[key]});
  }
  return cases;
 },noteFixtures);
 // Enter the real preview route once: its dpbar-on state supplies the screen-only phone fit.
 await p.evaluate(item=>dpFromLink('install',item.iso,item.load),plan[0]);
 await p.waitForFunction(()=>document.body.classList.contains('dpbar-on')&&window.__dpLast&&document.querySelector('#dayprint')?.dataset.dpReady==='1',null,{timeout:120000});
 const prepare=async(iso,doc,load)=>{
  await p.evaluate(({iso,doc,load})=>{window.__dpLast=null;dpPrint(iso,doc,{link:true,only:load});},{iso,doc,load});
  await p.waitForFunction(()=>window.__dpLast&&document.querySelector('#dayprint')?.dataset.dpReady==='1',null,{timeout:120000});
  return p.evaluate(()=>{const pg=document.querySelector('#dayprint .dp-page:not(.pl782)'),note=pg.querySelector('.dp-delivery798'),rect=pg.getBoundingClientRect();return{verdict:window.__dpLast,loadPages:document.querySelectorAll('#dayprint .dp-page:not(.pl782)').length,locationSigns:document.querySelectorAll('#dayprint .pl782').length,height:pg.clientHeight,scrollHeight:pg.scrollHeight,width:pg.clientWidth,scrollWidth:pg.scrollWidth,note:note?.innerText||'',noteCount:pg.querySelectorAll('.dp-delivery798').length,photos:pg.querySelectorAll('.dp-fig').length,navQr:pg.querySelectorAll('.dp-pos .dp-qr svg,.dp-wtbl .dp-qr svg').length,hero:pg.querySelector('.dp-hero')?.innerText,k:pg.style.getPropertyValue('--k'),viewRect:{left:rect.left,right:rect.right,width:rect.width,top:rect.top},headerTop:pg.querySelector('.dp-hd').getBoundingClientRect().top,barBottom:document.querySelector('#dpbar').getBoundingClientRect().bottom,viewport:innerWidth};});
 };
 for(const item of plan)for(const doc of ['drv','ins']){
  console.log(r.mode+' '+item.iso+' '+doc);
  await p.evaluate(()=>{dpDeliveryNotes798=()=>'';});const baseline=await prepare(item.iso,doc,item.load);
  await p.evaluate(()=>{dpDeliveryNotes798=window.__normalNotes798;});const added=await prepare(item.iso,doc,item.load);
  r.cases.push({iso:item.iso,doc,refs:item.refs,key:item.key,baseline,added});save();
  check(item.iso+' '+doc+' note appears exactly once on its delivery load',added.noteCount===1&&added.note.includes(item.key)&&added.note.replace(/\s+/g,' ').includes(item.note.replace(/\s+/g,' ')),added.note);
  check(item.iso+' '+doc+' A4 remains within its page',!added.verdict.over.length&&added.scrollHeight<=added.height+1&&added.scrollWidth<=added.width+1,{baseline:{height:baseline.height,scrollHeight:baseline.scrollHeight,k:baseline.k},added:{height:added.height,scrollHeight:added.scrollHeight,k:added.k}});
  check(item.iso+' '+doc+' load hero, QR, photos and location signs preserved',added.verdict.failed===0&&added.loadPages===baseline.loadPages&&added.locationSigns===baseline.locationSigns&&added.hero===baseline.hero&&added.navQr===baseline.navQr&&added.navQr>0&&added.photos===baseline.photos&&added.photos>0,{baseline:{photos:baseline.photos,navQr:baseline.navQr,locationSigns:baseline.locationSigns},added:{photos:added.photos,navQr:added.navQr,locationSigns:added.locationSigns}});
  check(item.iso+' '+doc+' preview fits actual device viewport',added.viewRect.left>=-1&&added.viewRect.right<=p.viewportSize().width+1,added.viewRect);
  check(item.iso+' '+doc+' page header clears wrapped toolbar',added.headerTop>=added.barBottom-1,{headerTop:added.headerTop,barBottom:added.barBottom});
  await p.screenshot({path:path.join(out,r.mode+'-'+item.iso+'-'+doc+'.png')});
  if(!mobile){await p.emulateMedia({media:'print'});await p.pdf({path:path.join(out,item.iso+'-'+doc+'.pdf'),format:'A4',preferCSSPageSize:true,printBackground:true});await p.emulateMedia({media:'screen'});}
 }
 r.previewSequence=[];
 for(const [label,item,doc] of [['A',plan[0],'drv'],['B',plan[1],'ins'],['A again',plan[0],'drv']]){
  const printed=await prepare(item.iso,doc,item.load);r.previewSequence.push({label,iso:item.iso,doc,printed});save();
  const expected=r.cases.find(x=>x.iso===item.iso&&x.doc===doc).added;
  check('reused preview '+label+' retains photos, note and A4/phone fit',printed.photos===expected.photos&&printed.photos===4&&printed.navQr===expected.navQr&&printed.hero===expected.hero&&printed.note===expected.note&&!printed.verdict.over.length&&printed.viewRect.left>=-1&&printed.viewRect.right<=p.viewportSize().width+1&&printed.headerTop>=printed.barBottom-1,{photos:printed.photos,navQr:printed.navQr,over:printed.verdict.over,rect:printed.viewRect,headerTop:printed.headerTop,barBottom:printed.barBottom});
  await p.screenshot({path:path.join(out,r.mode+'-preview-'+label.replace(/ /g,'-')+'.png')});
 }
 const geometry=()=>p.evaluate(()=>({headerTop:document.querySelector('#dayprint .dp-hd').getBoundingClientRect().top,barBottom:document.querySelector('#dpbar').getBoundingClientRect().bottom,offset:document.body.style.getPropertyValue('--dpbar-height798'),pageRight:document.querySelector('#dayprint .dp-page').getBoundingClientRect().right}));
 await p.evaluate(()=>dpBarSay('Preparing the complete recorded delivery instructions, navigation pictures and supporting documents for the selected load. '.repeat(3),true));
 let geo=await geometry();check('long toolbar status keeps full document header clear',geo.headerTop>=geo.barBottom-1,geo);
 for(const width of (mobile?[320,390]:[1000,1440])){await p.setViewportSize({width,height:mobile?844:1100});await p.waitForTimeout(250);geo=await geometry();check('existing resize handler refits toolbar offset at '+width+'px',geo.headerTop>=geo.barBottom-1&&geo.pageRight<=width+1,geo);}
 await p.emulateMedia({media:'print'});const printOffset=await p.evaluate(()=>({padding:parseFloat(getComputedStyle(document.body).paddingTop),bar:getComputedStyle(document.querySelector('#dpbar')).display}));check('physical print retains zero toolbar offset',printOffset.padding===0&&printOffset.bar==='none',printOffset);await p.emulateMedia({media:'screen'});
 // A deliberately overlong instruction must trigger the existing overflow verdict, never silently truncate.
 const first=plan[0];await p.evaluate(({key})=>{window.__fixtures798[key]='Long test instruction: '+('Keep this recorded instruction visible. '.repeat(160))+'FINAL END MARKER';},first);
 const long=await prepare(first.iso,'ins',first.load);r.longInstruction=long;
 check('long note is retained and reported as running long',long.note.includes('FINAL END MARKER')&&long.verdict.over.length>0,{over:long.verdict.over,chars:long.note.length});
 await p.evaluate(()=>dpBarClose());check('closing preview clears measured toolbar offset',await p.evaluate(()=>!document.querySelector('#dpbar')&&!document.body.classList.contains('dpbar-on')&&document.body.style.getPropertyValue('--dpbar-height798')===''));
 check('no page exceptions',!r.errors.length,r.errors);
 check('only expected map-session POST blocked',r.blocked.every(x=>x.method==='POST'&&x.path==='/v1/createSession'),r.blocked);
 r.passed=r.checks.length;save();await c.close();
}
(async()=>{const b=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox','--lang=en-AU']});try{await run(b,true);await run(b,false);}finally{await b.close();save();}console.log(JSON.stringify({candidateSha256:R.candidateSha256,runs:R.runs.map(r=>({mode:r.mode,passed:r.passed,errors:r.errors}))}));})().catch(e=>{R.fatal=e.stack;save();console.error(e.stack);process.exitCode=1;});
