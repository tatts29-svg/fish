// Author: Andrew Fisher. Native browser checks; all network mutations are blocked by the harness.
const fs=require('fs'),path=require('path'),assert=require('assert/strict');
const root=path.resolve(__dirname,'../../..'),out=process.env.AUDIT_DIR||'/workspace/private-gc500-fencing996';
const {open}=require(path.join(root,'toolchain/harness/open_page'));
const mob=process.env.MOB==='1',checks=[];
function check(name,value){assert(value,name);checks.push({name,pass:true});}
(async()=>{const h=await open({pageFile:process.env.PAGE||path.join(out,'candidate.html'),hash:'#today',W:mob?390:1440,H:mob?844:960,mobile:mob});const p=h.page;try{
 await p.waitForFunction(()=>SYNC.status==='live'&&SYNC.first.size===Object.keys(SYNC_COLLS).length&&DOCS.state==='ready',null,{timeout:150000});
 const r=await p.evaluate(()=>{
  const day=todayIso(),summary=todayFencingSummary848(day),work=todayWorkSummary848(day),linked=todayLinkedFencing848('scrim_existing',day),past=BuildWork986.day('2026-10-08',day);
  const baseline={actual:fenceDerived(),forecast:cj764Fencing(),components:fenceComponents849(day),reviews:fenceProgrammeReviews958(allDockets()).map(r=>({number:r.row.docket_no,state:r.state})),state:JSON.stringify(S)};
  const saved=S.fenceDockets;let corrected;
  try{S.fenceDockets=S.fenceDockets.map(d=>d.docket_no==='36589'?{...d,components:{...d.components,base:12,clamp:12}}:d.docket_no==='36560'?{...d,quantities:{...d.quantities,ped_gates:1}}:d);corrected={actual:fenceDerived(),forecast:cj764Fencing(),components:fenceComponents849(day),reviews:fenceProgrammeReviews958(allDockets()).map(r=>({number:r.row.docket_no,state:r.state})),summary:todayFencingSummary848(day),ccb:fenceCcbSummary847(allDockets()),evidence:fenceComponentEvidence849(day)};}finally{S.fenceDockets=saved;}
  return {summary,work,linked,past,baseline,corrected,stateRestored:baseline.state===JSON.stringify(S),before:todayFencingSummary848('2026-10-07'),html:BuildWorkView986.details(past)};
 });
 const rows=r.summary.summaryRows.filter(x=>x.id==='scrim_existing');check('one150m existing-fence activity',rows.length===1&&rows[0].recorded===150);check('no programme total or percentage',rows[0].planned===null&&rows[0].pct===null&&rows[0].remaining===null&&rows[0].kind==='recorded-only');
 check('native work summary uses same150m',r.work.fencingRows.find(x=>x.id==='scrim_existing')?.done===150);check('no activity before work date',!r.before.summaryRows.some(x=>x.id==='scrim_existing'));
 check('activity has no false programme gap',r.work.fencingRows.find(x=>x.id==='scrim_existing')?.plan.label==='Recorded service activity');
 check('one source drill-down record',r.linked.state==='ready'&&r.linked.dockets.length===1&&r.linked.dockets[0].number==='24473'&&r.linked.dockets[0].papers.some(p=>p.id==='24473.jpg'&&p.state==='ready'));
 check('past-day work150m once',r.past.rows.filter(x=>x.label==='Scrim applied to existing fence').length===1&&r.past.rows.find(x=>x.label==='Scrim applied to existing fence').value==='150 m');
 check('past-day HTML retains activity',r.html.includes('Scrim applied to existing fence')&&r.html.includes('150 m'));
 const close=(a,b)=>Math.abs(a-b)<0.001;
 check('only missing gate adds36.18 Revenue',close(r.corrected.actual.charged-r.baseline.actual.charged,36.18));check('only missing gate adds36 Direct costs',close(r.corrected.actual.cost-r.baseline.actual.cost,36));
 check('gate moves36.18 Revenue from remaining forecast',close(r.corrected.forecast.revenue-r.baseline.forecast.revenue,-36.18));check('gate moves36 Direct costs from remaining forecast',close(r.corrected.forecast.cost-r.baseline.forecast.cost,-36));
 check('gate actual count becomes8',r.corrected.summary.summaryRows.find(x=>x.id==='ped_gates')?.recorded===8);
 check('CCB classification remains current after gate correction',r.corrected.ccb.rows.find(x=>x.docketNo==='36560')?.reviewState==='current');check('missing gate question absent',!r.corrected.evidence.issues.some(x=>x.id==='ped-gate-gap-36560')&&!r.corrected.evidence.pending.some(x=>x.recordId==='F-AFV-0002'));
 for(const key of ['base','clamp'])check('36589 reduces '+key+' by5',r.baseline.components.recorded.find(x=>x.id===key).quantity-r.corrected.components.recorded.find(x=>x.id===key).quantity===5);
 check('programme matches survive correction',JSON.stringify(r.baseline.reviews)===JSON.stringify(r.corrected.reviews));check('correction does not suppress24473',r.corrected.summary.summaryRows.find(x=>x.id==='scrim_existing')?.recorded===150);check('local fixture restored',r.stateRestored);
 // Render the page's existing work-progress panel and use its own drill-down controls.
 await p.evaluate(()=>{const row=document.querySelector('[data-tw840-fence-row="scrim_existing"]');if(!row)throw Error('Native activity row is missing from the rendered work board');let node=row;while(node){if(node.tagName==='DETAILS')node.open=true;node=node.parentElement;}row.scrollIntoView({block:'center'});});
 await p.screenshot({path:path.join(out,'browser-'+(mob?'phone':'desktop')+'.png'),fullPage:false});
 await p.locator('[data-tw840-fence-row="scrim_existing"] [data-tw840-fence-detail]').first().click();
 const detail=p.locator('#gc500-work-dialog840');
 await detail.waitFor({state:'visible'});
 check('native click opens one supporting service note',await detail.locator('[data-tw844-docket]').count()===1&&(await detail.innerText()).includes('24473'));
 check('activity detail avoids unsupported percentage and plan',!/(Percentage unconfirmed|Plan position unconfirmed|Dated installation plan unconfirmed)/.test(await detail.innerText()));
 await detail.locator('[data-tw840-close]').click();
 check('native close closes activity detail',await detail.isHidden());
 check('no page errors',h.errors.length===0);check('no operational writes',h.counts.blocked===0);
 fs.writeFileSync(path.join(out,'browser-'+(mob?'phone':'desktop')+'.json'),JSON.stringify({author:'Andrew Fisher',pass:true,checks,errors:h.errors,requests:h.counts},null,2));console.log(JSON.stringify({pass:true,checks:checks.length,mobile:mob}));
 }finally{await h.browser.close();}})().catch(e=>{console.error(e.stack);process.exitCode=1;});
