// Author: Andrew Fisher. Actual Demob controls; no printing, emails, saves or uploads performed.
const fs=require('fs'),path=require('path'),crypto=require('crypto'),assert=require('assert/strict');
const {open}=require('../../toolchain/harness/open_page');
const mobile=process.env.MOB==='1',out=process.env.OUTDIR||'/workspace/private-flow994/demob-'+(mobile?'phone':'desktop');
const checks=[],failures=[],check=(ok,name,detail)=>{checks.push({name,pass:!!ok,...(detail===undefined?{}:{detail})});if(!ok)failures.push(name);console.log(JSON.stringify({step:name,pass:!!ok}));};
fs.mkdirSync(out,{recursive:true});
(async()=>{
 const pageFile=process.env.PAGE;assert(pageFile);const hash=crypto.createHash('sha256').update(fs.readFileSync(pageFile)).digest('hex');if(process.env.EXPECTED_SHA)assert.equal(hash,process.env.EXPECTED_SHA);
 const h=await open({pageFile:process.env.PUBLIC==='1'?undefined:pageFile,hash:'#demob',W:mobile?390:1440,H:mobile?844:960,mobile}),p=h.page;
 p.setDefaultTimeout(15000);
 try{
  await p.waitForFunction(()=>SYNC.status==='live'&&SYNC.first.size===Object.keys(SYNC_COLLS).length&&DOCS.state==='ready',null,{timeout:150000});
  const chosen=await p.evaluate(()=>{
   go('demob');const M=demob816();
   for(const day of M.days){const d=M.day[day],branches=[...new Set(d.list.map(r=>r.branch))];
    for(const branch of branches){const load=d.loads.find(L=>!L.rows.some(x=>x.r.branch===branch));if(load)return {day,branch,id:load.id,refs:load.rows.map(x=>x.r.key)};}
   }
   const d=M.days.find(day=>M.day[day].loads.length);return d?{day:d,branch:M.day[d].list[0].branch,id:M.day[d].loads[0].id,refs:M.day[d].loads[0].rows.map(x=>x.r.key)}:null;
  });
  check(!!chosen,'Native Demob toilet load available for interaction proof',chosen);if(!chosen)throw Error('No native toilet loads available');
  const before=await p.evaluate(()=>JSON.stringify(S));
  await p.evaluate(({day,branch})=>{DM816.sel=day;DM816.branch=branch;DM816.view='toilets';renderDemob816();applyCapability();},chosen);
  check(await p.locator('.demob994-scope b').textContent()==='All branches','Toilet content explicitly says All branches');
  check(await p.locator('[data-print816="day"]').textContent().then(x=>x.includes(chosen.branch)),'Day print action names selected branch');
  const scope=await p.evaluate(x=>({branch:DM816.branch,all:selectedDemob826(x.day,'all','load',x.id).map(L=>L.toilet.rows.map(r=>r.r.key)),filtered:selectedDemob826(x.day,x.branch,'load',x.id).length}),chosen);
  check(scope.all.length===1&&JSON.stringify(scope.all[0])===JSON.stringify(chosen.refs),'Native full-load selection preserves all original reference rows',scope);
  await p.evaluate(()=>{window.__nativePrint994=printDay816;window.__calls994=[];printDay816=(...args)=>window.__calls994.push(args);});
  const loadButton=p.locator('[data-print816="load"][data-load816="'+chosen.id+'"]');
  // Pane switching briefly hides the whole pane; keyboard focus must wait for visibility.
  await loadButton.waitFor({state:'visible'});await loadButton.press('Enter');
  const loadActivation=await p.evaluate(()=>({args:window.__calls994.at(-1),branch:DM816.branch,day:DM816.sel,focus:document.activeElement?.outerHTML.slice(0,400)}));
  check(JSON.stringify(loadActivation.args)===JSON.stringify([chosen.day,'all','load',chosen.id])&&loadActivation.branch===chosen.branch,'Print this load selects its exact whole load without changing branch',loadActivation);
  await p.locator('[data-print816="day"]').click();
  check(await p.evaluate(x=>window.__calls994.at(-1)[1]===x.branch&&window.__calls994.at(-1)[2]==='day',chosen),'Day print keeps selected branch scope');
  await p.locator('[data-view816="pump"]').click();
  check(await p.locator('.demob994-scope').textContent().then(x=>x.includes('All branches')&&x.includes('this day and the next demob day')),'Pump-out content declares full day-ahead scope');
  check(await p.evaluate(x=>DM816.branch===x.branch,chosen),'View changes do not mutate branch or confirmation scope');
  await p.screenshot({path:path.join(out,'demob-pump.png')});
  await p.locator('[data-view816="list"]').click();
  check(await p.locator('.demob994-scope').count()===0,'Branch-filtered pickup list is not labelled all branches');
  await p.evaluate(()=>{printDay816=window.__nativePrint994;delete window.__nativePrint994;delete window.__calls994;});
  check(before===await p.evaluate(()=>JSON.stringify(S)),'Operational records unchanged');
  check(h.errors.length===0,'No browser errors',h.errors);check(h.counts.blocked===0,'No operational writes attempted',h.counts);
  check(process.env.PUBLIC!=='1'||h.counts.page===0,'Public mode has no HTML substitution');
 }catch(e){failures.push(String(e.stack||e));}
 finally{fs.writeFileSync(path.join(out,'demob994.json'),JSON.stringify({author:'Andrew Fisher',mobile,sha256:hash,checks,failures,counts:h.counts,errors:h.errors},null,2));await h.browser.close();}
 console.log(JSON.stringify({passed:checks.filter(x=>x.pass).length,total:checks.length,failures,out}));if(failures.length)process.exitCode=1;
})();
