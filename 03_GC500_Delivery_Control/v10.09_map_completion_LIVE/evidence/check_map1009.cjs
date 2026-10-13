/* Author: Andrew Fisher. Independent map completion checks; operational writes remain blocked. */
'use strict';
const fs=require('fs'),path=require('path'),crypto=require('crypto'),assert=require('node:assert/strict'),Module=require('module');
const release=path.resolve(__dirname,'..'),live=process.env.LIVE==='1',mobile=process.env.MOB==='1';
const pageFile=live?undefined:process.env.PAGE,mapCode=live?null:process.env.MAP_CODE;
const out=process.env.OUT||('/workspace/private-map1009-'+(live?'public-':'candidate-')+(mobile?'phone':'desktop'));
if(!live&&(!pageFile||!mapCode))throw Error('Candidate mode requires PAGE and MAP_CODE');
fs.mkdirSync(out,{recursive:true});
const hash=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
const report={author:'Andrew Fisher',mode:live?'public':'candidate',viewport:mobile?'390×844':'1440×1000',checks:[],screenshots:[],servedAssets:[],errors:[],operationalWritesAttempted:0};
const check=(name,ok,details)=>{report.checks.push({name,passed:!!ok,...(details===undefined?{}:{details})});assert(ok,name+(details===undefined?'':': '+JSON.stringify(details)));};
// Install only a source transport adapter. Leave the standard harness's write guard and map-session exception intact.
const harness=path.resolve(release,'../toolchain/harness/open_page.js'),mod=new Module(harness,module);
mod.filename=harness;mod.paths=Module._nodeModulePaths(path.dirname(harness));
global.__mapTransport1009={live,mapCode,nonce:'map1009-'+process.pid+'-'+Date.now(),served:report.servedAssets};
const hook=`
    const mapMatch1009=new URL(u).origin===HOST&&new URL(u).pathname.match(/^\\/w\\/[^/]+\\/explorer\\/(index\\.html|explorer(?:-merge)?\\.js)$/);
    if(r.method()==='GET'&&mapMatch1009){
      const cfg=global.__mapTransport1009,name=mapMatch1009[1];let answer;
      if(cfg.live){const fresh=new URL(u);fresh.searchParams.set('_verify1009',cfg.nonce);answer=await curlFetch(fresh.href,r.headers(),'GET');}
      else answer={status:200,headers:{'content-type':name.endsWith('.html')?'text/html; charset=utf-8':'application/javascript','cache-control':'no-store'},body:fs.readFileSync(require('path').join(cfg.mapCode,name))};
      cfg.served.push({name,status:answer.status,sha256:require('crypto').createHash('sha256').update(answer.body).digest('hex'),source:cfg.live?'fresh-public-get':'local-candidate'});
      return route.fulfill(answer);
    }
`;
const original=fs.readFileSync(harness,'utf8'),anchor='    const okPost =';
assert.equal(original.split(anchor).length,2,'Harness interception anchor changed');
mod._compile(original.replace(anchor,hook+anchor),harness);require.cache[harness]=mod;
const {open}=require(harness);
let h,p,frame,before;
const snapshot=()=>({
  api:GC500MapCompletion1009.state,
  selectedText:document.getElementById('mapStatus1009')?.textContent||'',
  marks:marks.map(m=>({key:m.it.code,places:m.it.places})),
  camera:JSON.stringify(GC500Explorer.state.view),
  done:done782List().map(it=>it.code)
});
async function pull(){await frame.evaluate(()=>{complete897Pull();drawMarks(currentView());});}
async function select(key){
  await frame.evaluate(key=>GC500Explorer.find(key),key);
  await frame.waitForFunction(()=>gotoAnim887===0&&zAnim===0,null,{timeout:15000});
  await pull();
}
async function screenshot(name){const file=path.join(out,name+'.png');await p.screenshot({path:file});report.screenshots.push(file);}
async function fixture(kind){
  await p.evaluate(kind=>{
    const saved=window.__review1009;
    deliveryOf=saved.delivery;timeline841State=saved.timeline;window.gc500MapStatus1009=saved.map;window.gc500CompleteKeys897=saved.keys;
    if(kind==='unavailable'){window.gc500MapStatus1009=()=>({available:false,states:[]});return;}
    if(kind==='throwing'){window.gc500MapStatus1009=()=>{throw Error('Isolated unavailable-provider fixture');};return;}
    if(kind==='duplicate'){window.gc500MapStatus1009=()=>({available:true,states:[{key:'WC50',state:'complete',label:'COMPLETE'},{key:'WC50',state:'incomplete',label:'NOT COMPLETE'}]});return;}
    if(kind==='item-error'){timeline841State=a=>{if(a.key==='WC50')throw Error('Isolated item reading failure');return saved.timeline(a);};return;}
    const variants={complete:{stage:5},incomplete:{stage:2},installed:{stage:4},partial:{stage:2,partial962:true},conflict:{stage:5,conflict:true},unknown:{stage:0}};
    const view=variants[kind];if(!view)throw Error('Unknown fixture '+kind);
    deliveryOf=key=>key==='WC50'?{...saved.delivery(key),recorded:kind!=='unknown',done:['complete','partial','conflict'].includes(kind),where:'shared',moved:null}:saved.delivery(key);
    timeline841State=a=>a.key==='WC50'?{...view,blocked:false,conflict:!!view.conflict}:saved.timeline(a);
  },kind);
  await pull();
  return frame.evaluate(snapshot);
}
(async()=>{
 try{
  h=await open({pageFile,hash:'#sheet/__explorer',mobile,W:mobile?390:1440,H:mobile?844:1000,dpr:mobile?2:1});p=h.page;
  await p.waitForFunction(()=>SYNC.status==='live'&&SYNC.first.size===Object.keys(SYNC_COLLS).length,null,{timeout:120000});
  before=await p.evaluate(()=>({record:JSON.stringify(S),version:SYNC.backend.readVersion821()}));report.recordVersion=before.version;
  report.sha256=live?await p.evaluate(async()=>{const r=await fetch('/v/Coates-GC500-2026',{cache:'no-store'});if(!r.ok)throw Error('Public parent page unavailable');return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',await r.arrayBuffer())),n=>n.toString(16).padStart(2,'0')).join('');}):hash(fs.readFileSync(pageFile));
  check('Exact parent page matches expected source',!process.env.EXPECTED_SHA||report.sha256===process.env.EXPECTED_SHA,report.sha256);
  await p.waitForFunction(()=>EXP.frame&&EXP.frame.contentWindow.__ready,null,{timeout:120000});
  frame=p.frames().find(f=>/\/explorer\/index\.html(?:\?|$)/.test(f.url()));assert(frame,'Embedded explorer frame');
  await frame.evaluate(()=>GC500Explorer.ready);
  await frame.waitForFunction(()=>!!window.GC500MapCompletion1009,null,{timeout:10000});
  for(const name of ['index.html','explorer.js','explorer-merge.js']){
   const served=report.servedAssets.filter(r=>r.name===name);check('Fresh '+name+' loaded',served.length>0&&served.every(r=>r.status===200),served);
   if(!live)check(name+' exactly matches local candidate',served.every(r=>r.sha256===hash(fs.readFileSync(path.join(mapCode,name)))));
  }
  report.source=await p.evaluate(()=>({states:gc500MapStatus1009(['WC50','WC26']),verified:['WC50','WC26'].map(key=>({key,complete:gc500IsComplete897(key),stage:timeline841State(assetOf(key)).stage})),mapPoints:gc500PlanItems().items.filter(a=>['WC50','WC26'].includes(a.key)).map(a=>({key:a.key,pt:a.pt}))}));
  check('Current physical status source available',report.source.states.available&&report.source.states.states.length===2,report.source);
  const sourceStates=new Map(report.source.states.states.map(r=>[r.key,r]));
  for(const key of ['WC50','WC26']){
   await select(key);
   const current=await frame.evaluate(snapshot),expected=sourceStates.get(key);
   check(key+' marker follows verified current record',current.api.selected===key&&current.api.selectedStatus.state===expected.state,{expected,actual:current.api.selectedStatus});
   check(key+' status has accessible words',current.selectedText.includes(key)&&current.selectedText.toLowerCase().includes(current.api.selectedStatus.label.toLowerCase()),current.selectedText);
   const rendered=await frame.evaluate(key=>{const it=ITEMS.find(a=>a.code===key),box=document.createElement('div');box.innerHTML=ok897(it,'card');return {text:box.textContent,shape:box.querySelector('svg')?.innerHTML,svg:!!box.querySelector('svg[aria-hidden="true"]')};},key);
   check(key+' result/card badge carries icon plus readable status',rendered.svg&&rendered.text.toLowerCase().includes(current.api.selectedStatus.label.toLowerCase()),rendered);
   const labelWords=await frame.evaluate(()=>{const calls=[],orig=mctx.fillText;mctx.fillText=function(text,...args){calls.push(String(text));return orig.call(this,text,...args)};try{drawMarks(currentView())}finally{mctx.fillText=orig}return calls;});
   check(key+' selected canvas label says reference and status',labelWords.includes(key)&&labelWords.includes(current.api.selectedStatus.label.toUpperCase()),labelWords);
   await frame.evaluate(()=>{const card=document.getElementById('xcard');if(card&&!card.hidden)card.querySelector('[data-xclose]')?.click();panel813(false);});
   await p.locator('#expFrame').scrollIntoViewIfNeeded();
   await frame.waitForFunction(()=>/Drawing sharp/.test(document.getElementById('qualText')?.textContent||''),null,{timeout:60000});
   await screenshot((mobile?'phone':'desktop')+'-'+key.toLowerCase());
  }
  const distinction=await frame.evaluate(()=>['WC50','WC26'].map(key=>({key,...GC500MapCompletion1009.status(key)})));
  report.realComparison=distinction;
  if(distinction[0].state!==distinction[1].state)check('Real differing statuses use different shapes and words',distinction[0].shape!==distinction[1].shape&&distinction[0].label!==distinction[1].label,distinction);
  await p.evaluate(()=>{window.__review1009={delivery:deliveryOf,timeline:timeline841State,map:window.gc500MapStatus1009,keys:window.gc500CompleteKeys897,oldDone:window.gc500DoneKeys};});
  await select('WC50');const prior=await frame.evaluate(snapshot);
  const scenarios=[['complete','complete'],['incomplete','incomplete'],['installed','incomplete'],['partial','partial'],['conflict','review'],['unknown','unknown'],['unavailable','unknown'],['throwing','unknown'],['duplicate','review'],['item-error','unknown']];
  for(const [kind,expected] of scenarios){
   const state=await fixture(kind);
   check(kind+' provider scenario gives truthful marker',state.api.selectedStatus.state===expected,{state:state.api.selectedStatus,available:state.api.available});
   check(kind+' never moves camera or selection',state.camera===prior.camera&&state.api.selected==='WC50');
   check(kind+' keeps exact map positions',JSON.stringify(state.marks)===JSON.stringify(prior.marks));
   if(kind!=='complete')check(kind+' removes complete claim',!state.api.complete.includes('WC50')&&state.api.selectedStatus.glyph!=='check');
   if(['unavailable','throwing','item-error'].includes(kind))check(kind+' says unavailable rather than absent record',/unavailable/i.test(state.api.selectedStatus.label),state.api.selectedStatus);
  }
  await fixture('partial');
  await p.evaluate(()=>{window.gc500DoneKeys=()=>['WC50'];});
  await frame.evaluate(()=>{window.__doneLayer1009={on:DONE782_ON};DONE782_ON=true;done782Pull();drawMarks(currentView());});
  const donePartial=await frame.evaluate(snapshot);check('Legacy Done layer cannot mark partial work complete',!donePartial.done.includes('WC50'),donePartial.done);
  await fixture('complete');
  const doneComplete=await frame.evaluate(snapshot);check('Done layer includes verified completion',doneComplete.done.includes('WC50'),doneComplete.done);
  const marker=await frame.evaluate(()=>{const c=document.createElement('canvas');c.width=c.height=100*dpr;const g=c.getContext('2d'),s=GC500MapCompletion1009.status('WC50');badge1009(g,50*dpr,50*dpr,s);const pix=g.getImageData(0,0,c.width,c.height).data;let minX=c.width,maxX=-1,minY=c.height,maxY=-1;for(let y=0;y<c.height;y++)for(let x=0;x<c.width;x++)if(pix[(y*c.width+x)*4+3]){minX=Math.min(minX,x);maxX=Math.max(maxX,x);minY=Math.min(minY,y);maxY=Math.max(maxY,y)}return {width:(maxX-minX+1)/dpr,height:(maxY-minY+1)/dpr,shape:s.shape,glyph:s.glyph};});
  check('Complete marker is materially larger than old 13px dot',marker.width>=28&&marker.height>=28&&marker.shape==='octagon'&&marker.glyph==='check',marker);
  await p.emulateMedia({reducedMotion:'reduce'});
  const motion=await frame.evaluate(()=>['','::before','::after'].map(pseudo=>getComputedStyle(document.getElementById('pulse'),pseudo||null).animationName));
  check('Reduced motion stops selection pulse without hiding status',motion.every(n=>n==='none')&&(await frame.evaluate(snapshot)).selectedText.includes('WC50'),motion);
  await p.emulateMedia({reducedMotion:'no-preference'});
  await frame.evaluate(()=>{document.documentElement.classList.add('d782still');});
  const off=await frame.evaluate(()=>['','::before','::after'].map(pseudo=>getComputedStyle(document.getElementById('pulse'),pseudo||null).animationName));
  check('Project Motion Off stops selection pulse',off.every(n=>n==='none'),off);
  await frame.evaluate(()=>{clearSelection813();drawMarks(currentView());});
  const cleared=await frame.evaluate(snapshot);check('Clear selection clears selected status',cleared.api.selected===null&&cleared.selectedText==='');
  await p.evaluate(()=>{const saved=window.__review1009;deliveryOf=saved.delivery;timeline841State=saved.timeline;window.gc500MapStatus1009=saved.map;window.gc500CompleteKeys897=saved.keys;window.gc500DoneKeys=saved.oldDone;delete window.__review1009;});
  await frame.evaluate(()=>{const saved=window.__doneLayer1009;DONE782_ON=saved.on;delete window.__doneLayer1009;document.documentElement.classList.remove('d782still');complete897Pull();});
  const after=await p.evaluate(()=>({record:JSON.stringify(S),version:SYNC.backend.readVersion821()}));
  check('No native state was changed by provider fixtures',after.record===before.record,{beforeVersion:before.version,afterVersion:after.version});
  check('No browser exceptions',h.errors.length===0,h.errors);check('No operational writes attempted',h.counts.blocked===0,h.counts);
  report.passed=true;
 }catch(error){report.passed=false;report.failure=String(error.stack||error);process.exitCode=1;}
 finally{
  if(h){report.errors=h.errors;report.operationalWritesAttempted=h.counts.blocked;report.counts=h.counts;await h.browser.close();}
  delete global.__mapTransport1009;
  fs.writeFileSync(path.join(out,'map-review.json'),JSON.stringify(report,null,2));
  const summary={author:report.author,mode:report.mode,sha256:report.sha256,viewport:report.viewport,recordVersion:report.recordVersion,checks:report.checks.length,passed:!!report.passed,browserErrors:report.errors.length,operationalWritesAttempted:report.operationalWritesAttempted,servedAssets:report.servedAssets,scope:['verified map status and source availability','complete/pending shapes and selected status words','partial and conflicted completion','legacy Done-layer filtering','refresh without camera movement','clear selection and reduced motion','native record preservation']};
  fs.writeFileSync(path.join(out,'map-summary.json'),JSON.stringify(summary,null,2));console.log(JSON.stringify({...summary,failure:report.failure,out}));
 }
})();
