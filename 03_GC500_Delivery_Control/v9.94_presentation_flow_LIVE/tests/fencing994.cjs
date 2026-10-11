// Author: Andrew Fisher. Read-only status correction; native quantities and records stay intact.
const fs=require('fs'),path=require('path'),crypto=require('crypto'),assert=require('assert/strict');
const {open}=require('../../toolchain/harness/open_page');
const mobile=process.env.MOB==='1',publicMode=process.env.PUBLIC==='1';
const out=process.env.OUTDIR||'/workspace/private-gc500-v994/fencing-'+(mobile?'phone':'desktop');
const sha=x=>crypto.createHash('sha256').update(x).digest('hex');
const source=fs.readFileSync(process.env.BASE||path.resolve(__dirname,'../../build/GC500_v9.93-final/GC500_Delivery_Control_hosted.html'),'utf8');
const prior=source.slice(source.indexOf('function cwReds(){'),source.indexOf('function cwPillars(){')).trim();
assert(prior.startsWith('function cwReds(){'));
const originalFunctions=Object.fromEntries([
 ['todayWorkSummary842','todayTypeMetrics843'],['todayWorkSummary847','fenceCcbBadge847'],
 ['todayWorkSummary848','todayLinkedFencing848'],['cj764Fencing','labourWholeJob865']
].map(([name,next])=>[name,source.slice(source.indexOf('function '+name+'('),source.indexOf('function '+next+'(')).trim()]));
fs.mkdirSync(out,{recursive:true});
const checks=[],check=(ok,name)=>{checks.push({name,pass:!!ok});assert(ok,name);};
(async()=>{
 if(!publicMode)assert.equal(sha(fs.readFileSync(process.env.PAGE)),process.env.EXPECTED_SHA);
 const h=await open({pageFile:publicMode?undefined:process.env.PAGE,hash:'#coatesway',mobile,W:mobile?390:1440,H:mobile?844:960}),p=h.page;
 const evidence={author:'Andrew Fisher',mobile,actualPublic:publicMode,sha256:process.env.EXPECTED_SHA,checks};
 try{
  await p.waitForFunction(()=>SYNC.status==='live'&&SYNC.first.size===Object.keys(SYNC_COLLS).length&&DOCS.state==='ready',null,{timeout:150000});
  await p.evaluate(()=>go('coatesway'));
  const baseline=await p.evaluate(code=>{
   const old=eval('('+code+')'),plain=rows=>JSON.stringify(rows.map(({go,...row})=>row));
   const oldRows=old(),expected=oldRows.filter(row=>!row.what.startsWith('Fencing behind the 2026 programme'));
   return {before:oldRows.length,retired:oldRows.length-expected.length,onlyInferredRemoved:plain(expected)===plain(cwReds()),
    record:JSON.stringify(S),finance:JSON.stringify(pl770Model()),progress:JSON.stringify(progressAsOf(todayIso())),
    dockets:JSON.stringify(allDockets()),comparison:JSON.stringify(fenceCcbDisplayTypes847(progressAsOf(todayIso())))};
  },prior);
  evidence.redComparison={before:baseline.before,retired:baseline.retired};
  check(baseline.onlyInferredRemoved,'Only inferred fencing crew-delay reds removed; genuine reds unchanged');
  const modelChecks=await p.evaluate(originals=>{
   const entries=[];
   for(const [name,code] of Object.entries(originals)){
    const old=eval('('+code+')'),current=eval(name);
    for(const day of name==='cj764Fencing'?[null]:['2026-10-09',todayIso(),'2026-10-23']){
     const before=old(day),after=current(day);
     // The current 848 function includes earlier Lighting/VMS scope wrappers.
     // Compare all fencing fields; those unrelated wrappers are outside this change.
     const comparable=value=>JSON.stringify(name==='cj764Fencing'?value:{fencingRows:value.fencingRows,fencing:value.byId?.fencing},(key,item)=>key==='label'||name==='cj764Fencing'&&key==='state'?undefined:item);
     entries.push({name,day,unchanged:comparable(before)===comparable(after),
      wording:name==='cj764Fencing'?after.weeks.every(w=>!/^behind/.test(w.state)):after.fencingRows.every(r=>!/(?:\bbehind\b|\bahead\b|\bon track\b)/i.test(r.plan?.label||''))});
    }
   }
   const plate=dsnGroups(todayIso(),dsnState(todayIso())),email=decodeURIComponent(progressMailto(todayIso()));
   return {entries,plate:!plate.includes('Behind the programme by type'),email:!email.includes('behind by type:')};
  },originalFunctions);
  evidence.modelChecks=modelChecks;
  for(const entry of modelChecks.entries){check(entry.unchanged,entry.name+' fencing numeric values, flags, qualifications and records preserved '+(entry.day||''));check(entry.wording,entry.name+' quantity labels do not imply crew delay or ahead-of-programme work '+(entry.day||''));}
  check(modelChecks.plate&&modelChecks.email,'Fencing plate/Showcase and email use neutral comparison wording');
  check(await p.locator('#pane-coatesway .fencing994-status').count()===1,'One fencing confirmation badge');
  check(await p.locator('#pane-coatesway [data-cwgo="progress"] .fencing994-status').innerText()==='On track · confirmed 12 Oct 2026','Operations badge states the dated site confirmation');
  const fold=p.locator('#pane-coatesway [data-sfold="fencing994-record-comparison"]');
  check(await fold.count()===1&&!await fold.evaluate(n=>n.open),'One closed native More info comparison');
  check(await p.evaluate(expected=>JSON.stringify(fencingReview994().rows)===expected,baseline.comparison),'Original programme and docket quantities retained exactly');
  check(!await p.locator('#pane-coatesway .cwred').textContent().catch(()=> '').then(t=>t.includes('Fencing behind the 2026 programme')),'No unsupported fencing crew-delay accusation in red scorecard');
  await fold.locator(':scope > summary').focus();await p.keyboard.press('Enter');await p.waitForTimeout(80);
  check(await fold.evaluate(n=>n.open),'Quantity comparison opens by keyboard');
  check((await fold.innerText()).includes('They are not behind in their works'),'User confirmation retained under More info');
  const quantityRows=await fold.locator('tbody tr').evaluateAll(rows=>rows.map(r=>[...r.children].map(c=>c.textContent)));
  const expectedRows=await p.evaluate(()=>fencingReview994().rows.map(r=>[r.name,r.planned==null?'Unconfirmed':fmtNum(r.planned),fmtNum(r.done),r.unit]));
  check(JSON.stringify(quantityRows)===JSON.stringify(expectedRows),'Visible comparison preserves type, programme, docketed amount and unit');
  await p.evaluate(()=>render());await p.waitForTimeout(80);
  check(await fold.evaluate(n=>n.open),'Comparison disclosure retains its state across native redraw');
  await p.locator('#pane-coatesway .fencing994-status').scrollIntoViewIfNeeded();await p.screenshot({path:path.join(out,'fencing-status.png')});
  check(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'Page fits the viewport');
  const after=await p.evaluate(b=>({record:JSON.stringify(S)===b.record,finance:JSON.stringify(pl770Model())===b.finance,
   progress:JSON.stringify(progressAsOf(todayIso()))===b.progress,dockets:JSON.stringify(allDockets())===b.dockets}),baseline);
  check(after.record&&after.finance&&after.progress&&after.dockets,'Shared records, P&L, progress and docket calculations unchanged');
  check(h.errors.length===0,'No browser errors');check(h.counts.blocked===0,'No operational write attempts');
  check(!publicMode||h.counts.page===0,'Public checks use actual HTML');evidence.pass=true;
 }catch(e){evidence.pass=false;evidence.error=String(e.stack||e);throw e;}
 finally{evidence.errors=h.errors;evidence.requests=h.counts;fs.writeFileSync(path.join(out,'fencing994.json'),JSON.stringify(evidence,null,2));await h.browser.close();console.log(JSON.stringify({pass:evidence.pass,checks:checks.length,mobile}));}
})().catch(e=>{console.error(e.stack);process.exitCode=1;});
