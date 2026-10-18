/* Author: Andrew Fisher. Native Today Print and browser PDF parity; all source records remain read-only. */
'use strict';
const C=require('./common.cjs');const {execFileSync}=require('child_process');const [pageFile,outFile,baseFile]=process.argv.slice(2);
if(!pageFile||!outFile)throw new Error('Usage: node print.cjs page.html private-output.json [private-baseline.json]');
(async()=>{
 const mobile=process.env.MOB==='1',out={author:'Andrew Fisher',pageSha256:C.sha(C.fs.readFileSync(pageFile)),mobile,clock:C.CLOCK_ISO,modes:{}};let s;
 C.writePrivate(outFile,{pending:true}); // validates the private destination before any PDF is written
 try{
  for(const mode of ['native','browser']){
   s=await C.launch({pageFile,mobile,hash:'#today'});const p=s.page;await C.ready(s);
   await p.evaluate(()=>SYNC.backend.redeliver());await C.settled(p,1500);const primed=await p.evaluate(()=>JSON.stringify(S));
   await p.evaluate(()=>SYNC.backend.redeliver());await C.settled(p,1500);
   if(C.recordDelta(JSON.parse(primed),JSON.parse(await p.evaluate(()=>JSON.stringify(S)))).length||!(await C.mergeReport(p)).complete)throw new Error('Print fixture not completely merged and stable');
   await p.evaluate(()=>go('today'));await C.settled(p,1800);const record=await p.evaluate(()=>JSON.stringify(S));
   const before=await p.evaluate(()=>({tab:state.tab,hash:location.hash,folds:[...document.querySelectorAll('#pane-progress details[data-sfold],#pane-progress details[data-fold]')].map(d=>({attribute:d.hasAttribute('data-sfold')?'data-sfold':'data-fold',key:d.getAttribute(d.hasAttribute('data-sfold')?'data-sfold':'data-fold'),open:d.open})),scroll:document.querySelector('main')?.scrollTop||0}));
   await p.evaluate(()=>{window.__printValidation={calls:0,frames:[]};addEventListener('beforeprint',()=>{const pane=document.getElementById('pane-progress'),copy=pane?.cloneNode(true);copy?.querySelectorAll('style,script').forEach(x=>x.remove());window.__printValidation.frames.push({full:copy?.textContent||'',visible:pane?.innerText||'',instrument:pane?.querySelector('section.wip')?.textContent||'',model:typeof WIP==='undefined'?null:WIP.model,rootCount:pane?.querySelectorAll('section.wip').length||0,reportVisible:!!pane?.getClientRects().length&&getComputedStyle(pane).visibility!=='hidden',lockVisible:!!document.getElementById('ts1053-lock')?.getClientRects().length,armed:document.documentElement.classList.contains('ts1053-armed')});});});
   if(mode==='native'){
    await p.evaluate(()=>{window.print=()=>{window.__printValidation.calls++;};const button=document.getElementById('printProgress');if(!button)throw new Error('Native Print button missing');button.click();});
   }else{
    // Open the real browser-print gate without bypassing its closure or sending paperwork anywhere.
    await p.evaluate(()=>{try{window.print();}catch(error){if(!String(error).includes('twin-steer'))throw error;}});
   }
   await p.locator('#ts1053c').check();await p.locator('#ts1053n').fill('Validation Harness');await p.locator('[data-ts1053-go]').click();
   await p.waitForFunction(()=>document.documentElement.classList.contains('ts1053-armed')&&!document.getElementById('ts1053'));
   if(mode==='native')await p.waitForFunction(()=>window.__printValidation.calls===1,null,{timeout:15000});
   await p.emulateMedia({media:'print'});
   const pdf=C.path.join(C.path.dirname(C.path.resolve(outFile)),C.path.basename(outFile,'.json')+'-'+mode+'.pdf');
   await p.pdf({path:pdf,format:'A4',printBackground:true,preferCSSPageSize:true,timeout:60000});
   const pdfText=execFileSync('pdftotext',['-layout',pdf,'-'],{encoding:'utf8',maxBuffer:20*1024*1024});
   if(!/Where we are/i.test(pdfText)||/Not printed\.\s*Use the page.s Print buttons/i.test(pdfText))throw new Error('PDF contains no report or contains the print refusal page');
   const frames=await p.evaluate(()=>window.__printValidation.frames);if(!frames.length)throw new Error('Browser beforeprint did not run');
   const printed=frames.at(-1);if(printed.rootCount!==1||!printed.instrument.trim()||!printed.full.trim()||!printed.reportVisible||printed.lockVisible||!printed.armed)throw new Error('Printed report or instrument is missing');
   await p.emulateMedia({media:'screen'});await C.settled(p,1200);
   const returned=await p.evaluate(before=>({tab:state.tab,hash:location.hash,printing:document.body.classList.contains('printing-progress'),pageStyle:!!document.getElementById('progPage'),folds:before.folds.map(x=>({...x,open:[...document.querySelectorAll('#pane-progress details['+x.attribute+']')].find(d=>d.getAttribute(x.attribute)===x.key)?.open})),scroll:document.querySelector('main')?.scrollTop||0}),before);
   if(returned.tab!==before.tab||returned.hash!==before.hash||returned.printing||returned.pageStyle)throw new Error('Printing did not restore the native screen route/style');
   const foldDifferences=before.folds.map((fold,i)=>({index:i,before:fold.open,after:returned.folds[i].open})).filter(x=>x.before!==x.after);
   if(foldDifferences.length)throw new Error('Printing did not restore '+foldDifferences.length+' existing fold states');
   const after=await p.evaluate(()=>JSON.stringify(S)),changes=C.recordDelta(JSON.parse(record),JSON.parse(after));if(changes.length)throw new Error('Printing changed the source record');
   out.modes[mode]={...printed,pdfText,returnState:{before,returned,foldDifferences},recordSha256:C.sha(JSON.stringify(C.canonicalRecord(JSON.parse(record)))),pdfSha256:C.sha(C.fs.readFileSync(pdf)),pdfBytes:C.fs.statSync(pdf).size,printEvents:frames.length,nativeCalls:await p.evaluate(()=>window.__printValidation.calls)};
   C.assertClean(s);await s.browser.close();s=null;console.log(JSON.stringify({phase:'print',mobile,mode,pdfBytes:out.modes[mode].pdfBytes}));
  }
  out.differences=[];
  if(baseFile){const base=JSON.parse(C.fs.readFileSync(baseFile));if(!base.pass||base.mobile!==mobile||base.clock!==C.CLOCK_ISO)throw new Error('Print baseline is invalid or uses different conditions');
   for(const mode of ['native','browser'])for(const field of ['full','visible','instrument','model','recordSha256','pdfText']){
    const normalize=v=>{if(typeof v!=='string')return JSON.stringify(C.canonicalRecord(v));const text=C.normaliseText(v);return field==='pdfText'?text.replace(/ · v10\.(?:65|66)(?= |$)/g,' · RELEASE'):text;};const a=normalize(base.modes[mode][field]),b=normalize(out.modes[mode][field]);
    if(a!==b)out.differences.push({mode,field,baselineSha256:C.sha(a),candidateSha256:C.sha(b),baselineLength:a.length,candidateLength:b.length});
   }
   if(out.differences.length)throw new Error('Printed report differs from frozen baseline');
  }
  out.pass=true;
 }catch(error){out.pass=false;out.error=String(error.stack||error);if(s)out.health=C.errorsOf(s);process.exitCode=1;}
 finally{if(s)await s.browser.close();C.writePrivate(outFile,out);}
 console.log(JSON.stringify({pass:out.pass,mobile,modes:Object.keys(out.modes),differences:out.differences,error:out.error?.split('\n')[0]}));
})();
