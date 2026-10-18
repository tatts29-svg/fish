// Author: Andrew Fisher. Sequential read-only comparison against exact live v8.06.
// BASE=... PAGE=... PRIVATE_OUT=/workspace/private-v807-review CHROMIUM_PATH=... node this-file
const fs=require('fs'),path=require('path'),crypto=require('crypto'),cp=require('child_process');
const {open}=require('../../toolchain/harness/open_page');
const output=process.env.PRIVATE_OUT||'/workspace/private-v807-review';fs.mkdirSync(output,{recursive:true});
const sha=x=>crypto.createHash('sha256').update(x).digest('hex');
const wait=ms=>new Promise(r=>setTimeout(r,ms));
// Only the named instrument/footer clocks vary between sequential real PDFs.
// Keep booking/load times, race-day count, calendar dates and every financial figure.
function normalisePdf(raw){return raw.replace(/\s+/g,' ').trim()
 .replace(/(GOLD COAST · AEST \d+) \d{2}:\d{2}:\d{2} LIVE \d{2}:\d{2}:\d{2} D AY S LAST CONFIRMED \d{2}:\d{2}/g,'$1 [race countdown] LIVE [clock] D AY S LAST CONFIRMED [sync time]')
 .replace(/last confirmed \d{2}:\d{2}/g,'last confirmed [sync time]');}
const tabs=['today','costs','fencing','questions','coatesway','runsheet','plant'];
const report={author:'Andrew Fisher',baseSha256:sha(fs.readFileSync(process.env.BASE)),candidateSha256:sha(fs.readFileSync(process.env.PAGE)),checks:[],runs:[]};
function check(name,pass,detail){report.checks.push({name,pass:!!pass,detail});console.log((pass?'PASS ':'FAIL ')+name);}
function layout(){
 const pane=document.getElementById('pane-today'),sections={'By group':pane.querySelector('#pane-progress .groups:not(.branches)'),'By branch':pane.querySelector('#pane-progress .groups.branches')},out={height:Math.round(pane.getBoundingClientRect().height),sections:{}};
 for(const[name,box]of Object.entries(sections)){if(!box||box.closest('details:not([open])'))continue;const r=box.getBoundingClientRect(),used=[...box.children].filter(k=>k.getClientRects().length).reduce((n,k)=>{const q=k.getBoundingClientRect();return n+q.width*q.height;},0);out.sections[name]={height:Math.round(r.height),emptyPct:+(Math.max(0,r.width*r.height-used)/(r.width*r.height)*100).toFixed(1)};}return out;
}
async function grab(tag,file,mobile=false){
 const h=await open({pageFile:file,W:mobile?390:1440,H:mobile?844:900,dpr:mobile?2:1,mobile,gl:false}),p=h.page,run={tag,mobile,sha256:sha(fs.readFileSync(file)),figures:{},prints:{},screenshots:[],consoleErrors:[]};
 p.on('console',m=>{if(m.type()==='error')run.consoleErrors.push(m.text().slice(0,180));});
 try{
  await p.waitForFunction(()=>SYNC.status==='live'&&SYNC.first.size===Object.keys(SYNC_COLLS).length,null,{timeout:240000});await p.emulateMedia({reducedMotion:'reduce'});await wait(1800);
  run.recordVersion=await p.evaluate(()=>SYNC.version||SYNC.ver||null);
  await p.evaluate(()=>{folds795().clear();go('today');});await wait(1600);
  if(tag==='candidate807'){
   for(const name of ['By branch','On site']){
    await p.evaluate(()=>{folds795().clear();go('timeline');go('today');});await wait(700);
    const result=await p.evaluate(name=>{
     const button=[...document.querySelectorAll('#pane-today .jump95 .jb95')].find(b=>b.textContent===name);
     const native=window.requestAnimationFrame,pending=[];window.requestAnimationFrame=cb=>{pending.push(cb);return 0;};
     try{if(!button)throw Error('Existing jump button absent: '+name);button.click();const fold=jump799(name);return {open:fold.open,lazy:!!fold.querySelector('.lazy799'),connected:fold.isConnected,heldFrameCallbacks:pending.length};}
     finally{window.requestAnimationFrame=native;pending.forEach(cb=>native(cb));}
    },name);
    check('Jump draws '+name+' immediately while animation frames are held ('+(mobile?'phone':'desktop')+')',result.open&&!result.lazy&&result.connected,result);
   }
   await p.evaluate(()=>{folds795().clear();go('timeline');go('today');});await wait(900);
  }
  run.normalClosedLayout=await p.evaluate(layout);
  await p.evaluate(()=>{$('main').scrollTop=0;});await wait(200);
  async function normalShot(name){const file=path.join(output,`${tag}-normal-${mobile?'phone':'desktop'}-${name}.png`);await p.screenshot({path:file});run.screenshots.push({path:file,sha256:sha(fs.readFileSync(file))});}
  await normalShot('top');
  const branchSummary='#pane-today details.fold95[data-fold="By branch"] > summary';
  await p.locator(branchSummary).scrollIntoViewIfNeeded();if(mobile)await p.tap(branchSummary);else await p.click(branchSummary);await wait(1600);
  run.normalBranchLayout=await p.evaluate(layout);
  run.normalNestedDetailsOpen=await p.evaluate(()=>document.querySelectorAll('#pane-progress .groups.branches details[open]').length);
  check(tag+' normal branch capture keeps nested More info collapsed ('+(mobile?'phone':'desktop')+')',run.normalNestedDetailsOpen===0,run.normalNestedDetailsOpen);
  await p.evaluate(()=>{const sm=document.querySelector('#pane-today details.fold95[data-fold="By branch"] > summary'),m=$('main');m.scrollTop+=sm.getBoundingClientRect().top-m.getBoundingClientRect().top-12;});await wait(250);await normalShot('branches-top');
  if(!mobile){await p.evaluate(()=>{const box=document.querySelector('#pane-progress .groups.branches'),m=$('main');m.scrollTop+=box.getBoundingClientRect().bottom-m.getBoundingClientRect().bottom+12;});await wait(250);await normalShot('branches-bottom');}
  await p.evaluate(()=>{folds795().clear();go('timeline');go('today');});await wait(900);
  if(!mobile){
   run.closedLayout=await p.evaluate(layout);
   run.speed=await p.evaluate(async()=>{const out={};for(const tab of ['today','plant']){const samples=[];for(let i=0;i<6;i++){go('timeline');await new Promise(r=>setTimeout(r,350));const before=performance.now();go(tab);samples.push(performance.now()-before);await new Promise(r=>setTimeout(r,500));}const sorted=samples.slice().sort((a,b)=>a-b);out[tab]={medianMs:+((sorted[2]+sorted[3])/2).toFixed(1),samplesMs:samples.map(x=>+x.toFixed(1))};}return out;});
   for(const tab of tabs){
    await p.evaluate(t=>go(t),tab);await wait(1300);
    await p.evaluate(t=>document.querySelectorAll('#pane-'+t+' details').forEach(d=>d.open=true),tab);await wait(1600);
    const lines=await p.evaluate(t=>{document.querySelectorAll('#pane-'+t+' details').forEach(d=>d.open=true);return document.getElementById('pane-'+t).innerText.replace(/last confirmed \d\d:\d\d/g,'').split('\n').map(x=>x.replace(/[ \t]+/g,' ').trim()).filter(Boolean).sort();},tab);
    fs.writeFileSync(path.join(output,tag+'-'+tab+'-lines.json'),JSON.stringify(lines));
    run.figures[tab]={lineCount:lines.length,sha256:sha(JSON.stringify(lines))};
   }
  }
  await p.evaluate(()=>{folds795().clear();go('timeline');go('today');});await wait(1600);
  for(const state of ['closed','open']){
   if(state==='open'){await p.evaluate(()=>document.querySelectorAll('#pane-today details.fold95').forEach(d=>d.open=true));await wait(1800);}
   if(!mobile&&state==='open')run.openLayout=await p.evaluate(layout);
   await p.evaluate(()=>{$('main').scrollTop=0;});await wait(250);
   const image=path.join(output,`${tag}-${mobile?'phone':'desktop'}-${state}.png`);await p.screenshot({path:image});run.screenshots.push({path:image,sha256:sha(fs.readFileSync(image))});
   if(state==='open'){
    const selector='#pane-today details.fold95[data-fold="By branch"]';await p.locator(selector).scrollIntoViewIfNeeded();await wait(350);
    const image=path.join(output,`${tag}-${mobile?'phone':'desktop'}-branches.png`);await p.screenshot({path:image});run.screenshots.push({path:image,sha256:sha(fs.readFileSync(image))});
   }
   if(!mobile){
    for(const mode of ['ctrl-p','a4-report']){
     if(mode==='a4-report')await p.evaluate(()=>document.body.classList.add('printing-progress'));
     const file=path.join(output,`${tag}-${state}-${mode}.pdf`),buf=await p.pdf({path:file,format:'A4'});
     const raw=cp.execFileSync('pdftotext',['-layout',file,'-'],{encoding:'utf8'});
     const words=normalisePdf(raw);
     run.prints[state+'/'+mode]={pages:(buf.toString('latin1').match(/\/Type\s*\/Page[^s]/g)||[]).length,pdfSha256:sha(buf),textSha256:sha(words),characters:words.length};
     if(mode==='a4-report')await p.evaluate(()=>document.body.classList.remove('printing-progress'));
     await wait(450);
    }
   }
  }
  run.viewport=await p.evaluate(()=>({width:innerWidth,scrollWidth:document.documentElement.scrollWidth}));
  run.errors=h.errors;run.requests=h.counts;
  check(tag+' '+(mobile?'phone':'desktop')+' has no page errors',!h.errors.length,h.errors);
  check(tag+' '+(mobile?'phone':'desktop')+' has no console errors',!run.consoleErrors.length,run.consoleErrors);
  check(tag+' '+(mobile?'phone':'desktop')+' attempts no service writes',h.counts.blocked===0,h.counts);
  if(mobile)check('Phone keeps a single column without sideways overflow',run.viewport.scrollWidth<=run.viewport.width+1,run.viewport);
 }finally{await h.browser.close();report.runs.push(run);}
 return run;
}
(async()=>{
 if(process.argv.includes('--recheck-pdfs')){
  const file=path.join(__dirname,'integration807_browser.json'),prior=JSON.parse(fs.readFileSync(file));
  if(prior.baseSha256!==report.baseSha256||prior.candidateSha256!==report.candidateSha256)throw Error('PDF recheck requires the original exact page hashes');
  for(const run of prior.runs.filter(r=>!r.mobile))for(const key of Object.keys(run.prints)){
   const pdf=path.join(output,run.tag+'-'+key.replace('/','-')+'.pdf'),bytes=fs.readFileSync(pdf);
   if(sha(bytes)!==run.prints[key].pdfSha256)throw Error('PDF artifact changed: '+pdf);
   const words=normalisePdf(cp.execFileSync('pdftotext',['-layout',pdf,'-'],{encoding:'utf8'}));
   run.prints[key].textSha256=sha(words);run.prints[key].characters=words.length;
  }
  const a=prior.runs.find(r=>r.tag==='base806'),b=prior.runs.find(r=>r.tag==='candidate807'&&!r.mobile);
  for(const key of Object.keys(a.prints)){const c=prior.checks.find(c=>c.name==='Real PDF words unchanged: '+key);c.pass=a.prints[key].textSha256===b.prints[key].textSha256;c.detail={base:a.prints[key].textSha256,candidate:b.prints[key].textSha256};}
  prior.pdfComparisonNote='Initial closed Ctrl+P comparison differed only in sequential race countdown, live clock and last-confirmed times. Rechecked the same SHA-verified PDFs after normalising only those labelled clock fields; booking times, dates, day count and all figures remain compared.';
  prior.passed=prior.checks.filter(c=>c.pass).length;fs.writeFileSync(file,JSON.stringify(prior,null,2)+'\n');
  console.log(prior.passed+'/'+prior.total+' after exact-PDF clock-field recheck');if(prior.checks.some(c=>!c.pass))process.exitCode=1;return;
 }
 try{
  const base=await grab('base806',process.env.BASE),candidate=await grab('candidate807',process.env.PAGE);
  for(const tab of tabs)check('Every displayed line including repeat counts is unchanged: '+tab,base.figures[tab].sha256===candidate.figures[tab].sha256,{base:base.figures[tab],candidate:candidate.figures[tab]});
  for(const key of Object.keys(base.prints)){const a=base.prints[key],b=candidate.prints[key];check('Real PDF page count unchanged: '+key,a.pages===b.pages,{base:a.pages,candidate:b.pages});check('Real PDF words unchanged: '+key,a.textSha256===b.textSha256,{base:a.textSha256,candidate:b.textSha256});}
  await grab('candidate807',process.env.PAGE,true);
 }finally{
  report.passed=report.checks.filter(c=>c.pass).length;report.total=report.checks.length;
  fs.writeFileSync(path.join(__dirname,'integration807_browser.json'),JSON.stringify(report,null,2)+'\n');
 }
 if(report.checks.some(c=>!c.pass))process.exitCode=1;
})().catch(e=>{console.error(String(e));process.exitCode=1;});
