/* Author: Andrew Fisher. Independent read-only P&L presentation/print regression.
 * PAGE STATE OUT are required. OUT must be an absolute directory outside every Git worktree: it contains private
 * financial values, screenshots and PDFs. Operational writes are blocked by the harness.
 * MOB=1 selects a phone. No application source, models or live records are changed.
 */
'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {spawnSync,execFileSync}=require('node:child_process');
const {isDeepStrictEqual}=require('node:util');
const {openCandidate}=require('../../v12.43.1_offsite_pictures_LIVE/tests/native_harness.cjs');
let out;
const mobile=process.env.MOB==='1',tag=mobile?'phone':'desktop';
const checks=[];
const check=(id,pass)=>checks.push({id,pass:Boolean(pass)});
const sha=file=>crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const populated=docs=>Object.fromEntries(Object.entries(docs).filter(([,v])=>Object.keys(v||{}).length));
function privateOutput(){
  const requested=process.env.OUT;
  if(!requested||!path.isAbsolute(requested))throw Error('OUT must be an absolute private directory');
  fs.mkdirSync(requested,{recursive:true,mode:0o700});
  const resolved=fs.realpathSync(requested);
  try{execFileSync('git',['-C',resolved,'rev-parse','--show-toplevel'],{stdio:'ignore'});}
  catch(e){if(e.status===128)return resolved;throw e;}
  throw Error('OUT must be outside every Git worktree');
}
function safePrint(){
  for(const c of checks) console.log((c.pass?'PASS ':'FAIL ')+c.id);
  console.log('Presentation '+tag+': '+checks.filter(c=>c.pass).length+'/'+checks.length+' checks passed; details in private OUT.');
}
async function main(){
  out=privateOutput();
  for(const key of ['PAGE','STATE'])if(!process.env[key]||!path.isAbsolute(process.env[key])||!fs.existsSync(process.env[key]))throw Error(key+' must name an existing absolute local file');
  process.env.INITIAL_HASH='#costs';
  const state=JSON.parse(fs.readFileSync(process.env.STATE)),h=await openCandidate(),p=h.page;
  let report={author:'Andrew Fisher',tag,pageSha256:sha(process.env.PAGE),stateSha256:sha(process.env.STATE),recordVersion:state.version,checks};
  try{
    await p.waitForFunction(()=>document.querySelector('#pane-costs [id^="pl"][id$="-branch"]')&&window.PL1267?.model,null,{timeout:60000});
    await p.evaluate(()=>document.querySelector('#pl1267')?.scrollIntoView({block:'start'}));
    await p.screenshot({path:path.join(out,'presentation-'+tag+'-screen.png'),animations:'disabled'});
    const screen=await p.evaluate(()=>{
      const P=holdAssets(()=>PL1267.model()),F=holdAssets(()=>fh866Model());
      const txt=n=>n?String(n.textContent||'').replace(/\s+/g,' ').trim():'';
      const visibility=n=>{
        for(let at=n;at&&at!==document.body;at=at.parentElement){
          if(at.tagName==='DETAILS'&&!at.open&&!at.querySelector(':scope > summary')?.contains(n))return false;
          const s=getComputedStyle(at);if(s.display==='none'||s.visibility==='hidden')return false;
        }
        return true;
      };
      const pane=document.getElementById('pane-costs');
      const face=[...pane.children].filter(n=>n.tagName!=='DETAILS'&&visibility(n));
      const branch=document.querySelector('#pl1267-branch');
      const supportNotes=[...document.querySelectorAll('#pl1267-cost td:first-child small')].map(n=>({text:txt(n),visible:visibility(n)}));
      const visibleText=[...pane.querySelectorAll('*')].filter(n=>!n.children.length&&visibility(n)).map(txt).join(' ');
      const invoice={};for(const r of F.inv||[])invoice[r.branch]=(invoice[r.branch]||0)+(r.job||0);
      const bridges=(P.branches||[]).map(b=>({branch:b.code,management:b.rev,invoicing:invoice[b.code]||0,difference:Math.round((b.rev-(invoice[b.code]||0))*100)/100}));
      // A bridge may be a note, a labelled container, or one coherent table with
      // management/invoicing columns. Do not concatenate unrelated report sections.
      const bridgeTexts=[...pane.querySelectorAll('p,small,li,caption,[role="note"],[id*="bridge"],[class*="bridge"],table')].filter(visibility).map(n=>({text:txt(n),limit:n.matches('table,[id*="bridge"],[class*="bridge"]')?5000:1500})).filter(n=>n.text.length<n.limit).map(n=>n.text);
      return{screen:{width:innerWidth,height:innerHeight,pageOverflow:document.documentElement.scrollWidth-innerWidth,tableOverflow:[...document.querySelectorAll('#pl1267-rev .tblwrap,#pl1267-cost .tblwrap')].map(n=>n.scrollWidth-n.clientWidth)},faceText:face.map(txt).join(' '),branchText:txt(branch),visibleText,supportNotes,bridges,bridgeTexts,
        expected:{headings:['Charged to the V8s','What it costs us','Difference so far'],amounts:[{id:'revenue-so-far',value:P.revNow},{id:'revenue-job-end',value:P.revJob},{id:'cost-so-far',value:P.costNow},{id:'cost-job-end',value:P.costJob},{id:'difference-so-far',value:P.diffNow},{id:'difference-job-end',value:P.diffJob}]},
        recordVersion:SYNC.backend.readVersion821(),byBranch:(P.branches||[]).map(b=>({branch:b.code,management:b.rev,cost:b.cost,difference:b.diff}))};
    });
    report.screen=screen;
    check('record-snapshot-loaded',Number(screen.recordVersion)===state.version);
    check('no-horizontal-page-overflow',screen.screen.pageOverflow<=1);
    check('main-financial-tables-fit-viewport',screen.screen.tableOverflow.length===2&&screen.screen.tableOverflow.every(n=>n<=1));
    check('primary-financial-headings-present',screen.expected.headings.every(t=>screen.faceText.includes(t)));
    check('currency-tax-and-as-at-basis-visible',/AUD\s+EX\s+GST/i.test(screen.faceText)&&/AS AT/i.test(screen.faceText));
    check('incomplete-cost-qualification-visible',/not a margin|costs? (?:are |is )?(?:not )?complete|costs? (?:still )?incomplete/i.test(screen.faceText));
    const notes=screen.supportNotes.filter(n=>n.visible&&n.text.includes('$'));
    const amounts=notes.flatMap(n=>[...n.text.matchAll(/\$\s*-?[\d,]+(?:\.\d+)?/g)].map(m=>m[0]));
    check('supporting-breakdown-amounts-exercised',amounts.length>0);
    check('supporting-breakdowns-retain-two-decimal-cents',amounts.length>0&&amounts.every(m=>/\.\d{2}$/.test(m)));
    const hasBridge=screen.bridges.some(b=>Math.abs(b.difference)>=.005);
    check('management-branch-basis-explicit',/management|allocation|allocated|reporting basis/i.test(screen.branchText));
    check('invoicing-branch-basis-explicit',/\binvoicing(?:\s+branch(?:es)?)?(?:\s+basis)?\b|\binvoice(?:d)?\s+branch(?:es)?\b|\bcontract\s+branch(?:es)?\b/i.test(screen.visibleText));
    const bridgeAmounts=screen.bridges.filter(b=>Math.abs(b.difference)>=.005).map(b=>Math.abs(b.difference).toLocaleString('en-AU',{minimumFractionDigits:2,maximumFractionDigits:2}));
    const bridgeBranches=screen.bridges.filter(b=>Math.abs(b.difference)>=.005).map(b=>b.branch);
    const completeBridge=screen.bridgeTexts.some(t=>/bridge|reallocat|allocated|allocation|moved|transferred|sit on|sits on|\bfrom\b|\bto\b|→|management.*invoic|invoic.*management/i.test(t)&&bridgeAmounts.every(a=>t.includes(a))&&bridgeBranches.every(b=>t.includes(b)));
    check('nonzero-branch-allocation-bridge-disclosed',!hasBridge||completeBridge);
    // Capture exactly the native print transaction. Do not replace window.print,
    // satisfy a missing guard, alter source CSS, or invent an approval class.
    await p.evaluate(()=>{
      window.__plAuditNativePrint=[];
      window.addEventListener('beforeprint',()=>{
        window.__plAuditNativePrint.push({htmlClass:document.documentElement.className,bodyClass:document.body.className,style:document.getElementById('costPage')?.textContent||null,
          realPrintCalls:window.ts1053?.stats?.real??null,allowed:window.ts1053?.armed?.()??null,confirmationDialog:!!document.getElementById('ts1053')});
      });
      let b=document.getElementById('printCosts');
      for(let a=b?.parentElement;a;a=a.parentElement)if(a.tagName==='DETAILS')a.open=true;
    });
    const printButton=p.locator('#printCosts');
    check('native-print-button-present',await printButton.count()===1);
    if(await printButton.count()===1){
      await printButton.click();
      await p.waitForFunction(()=>window.__plAuditNativePrint.length||document.getElementById('ts1053'),null,{timeout:10000}).catch(()=>{});
      const transaction=await p.evaluate(()=>({events:window.__plAuditNativePrint,dialog:!!document.getElementById('ts1053'),realPrintCalls:window.ts1053?.stats?.real??null}));
      report.nativePrint=transaction;
      check('native-print-handler-reached-browser',transaction.events.length>0);
      check('native-print-route-not-blocked-by-unoffered-confirmation',!transaction.dialog&&transaction.events.length>0);
      if(transaction.events.length){
        // Headless window.print returns before a PDF can be saved. Restore only the
        // classes and @page style actually captured in that native beforeprint event;
        // afterprint may already have removed them. This does not fix application state.
        const captured=transaction.events[transaction.events.length-1];
        await p.evaluate(s=>{
          document.documentElement.className=s.htmlClass;document.body.className=s.bodyClass;
          const old=document.getElementById('costPage');if(old)old.remove();
          if(s.style!==null){const n=document.createElement('style');n.id='costPage';n.textContent=s.style;document.head.append(n);}
        },captured);
        await p.emulateMedia({media:'print'});
        report.printStyle=await p.evaluate(()=>({lockDisplay:document.getElementById('ts1053-lock')?getComputedStyle(document.getElementById('ts1053-lock')).display:null,appDisplay:getComputedStyle(document.querySelector('.app')).display}));
        const pdf=path.join(out,'presentation-'+tag+'-native-print.pdf'),expect=path.join(out,'presentation-'+tag+'-pdf-expect.json'),pdfResult=path.join(out,'presentation-'+tag+'-pdf-result.json');
        fs.writeFileSync(expect,JSON.stringify(screen.expected,null,2),{mode:0o600});
        await p.pdf({path:pdf,preferCSSPageSize:true,printBackground:true});
        const probe=spawnSync('python3',[path.join(__dirname,'inspect_pdf.py'),'--pdf',pdf,'--expect',expect,'--out',pdfResult],{encoding:'utf8'});
        if(fs.existsSync(pdfResult)){
          const result=JSON.parse(fs.readFileSync(pdfResult));report.pdf=result;
          for(const c of result.checks||[])check(c.id,c.pass);
        }else check('pdf-inspection-completed',false);
        check('pdf-inspector-executed',probe.status===0||probe.status===1);
        await p.emulateMedia({media:'screen'});
        await p.evaluate(()=>window.dispatchEvent(new Event('afterprint')));
      }else{
        check('pdf-report-headings-present',false);check('pdf-current-cent-totals-present',false);
      }
    }
    const persisted=await p.evaluate(()=>({docs:JSON.parse(JSON.stringify(Object.fromEntries(Object.keys(SYNC_COLLS).map(k=>[k,toDocs(k)])))),queued:Object.values(SYNC.queue||{}).reduce((n,q)=>n+Object.keys(q).length,0),inflight:Object.keys(SYNC.inflight||{}).length}));
    check('record-documents-unchanged',isDeepStrictEqual(populated(persisted.docs),populated(state.docs)));
    check('no-record-write-queue',persisted.queued===0&&persisted.inflight===0);
    check('zero-operational-write-attempts',h.counts.blocked===0);
    check('zero-runtime-errors',h.errors.length===0);check('zero-console-errors',h.consoleErrors.length===0);
    report.runtime={errors:h.errors,consoleErrors:h.consoleErrors,blockedWrites:h.counts.blocked};
  }finally{
    await h.browser.close();
    report.finishedAt=new Date().toISOString();
    fs.writeFileSync(path.join(out,'presentation-'+tag+'-result.json'),JSON.stringify(report,null,2),{mode:0o600});
  }
  safePrint();if(checks.some(c=>!c.pass))process.exitCode=1;
}
main().catch(error=>{
  // out is assigned only after the realpath/Git-worktree privacy check succeeds.
  // An invalid or repository-pointing OUT gets no diagnostic evidence written to it.
  if(out){try{fs.writeFileSync(path.join(out,'presentation-'+tag+'-error.json'),JSON.stringify({author:'Andrew Fisher',error:String(error.stack||error),checks},null,2),{mode:0o600});}catch(_){}}
  console.error('Presentation verification ERROR; inspect private OUT evidence.');process.exitCode=2;
});
