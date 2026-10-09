// Author: Andrew Fisher. Selected-date provisional fencing UI probe, GET only.
'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {installWriteGuard,ready840,nativeSnapshot}=require('../v8.40_today_work_progress_LIVE/test_today840.cjs');
const {fencingInputs841,fencingOracle841}=require('../v8.41_timeline_fencing_clarity_LIVE/test_today841.cjs');
const {summaryInputs842,dailyPlan842}=require('./test_summary_oracle842.cjs');
const {front842}=require('./test_front842.cjs');
const {open}=require('../toolchain/harness/open_page.js');
const {PAGE,OUT,CANDIDATE_SHA}=process.env,sha=b=>crypto.createHash('sha256').update(b).digest('hex');
if(!PAGE||!OUT||sha(fs.readFileSync(PAGE))!==CANDIDATE_SHA)throw Error('Frozen PAGE/SHA and private OUT required');
fs.mkdirSync(OUT,{recursive:true});const report={author:'Andrew Fisher',candidate:CANDIDATE_SHA,at:new Date().toISOString(),checks:[]};
const check=(name,pass,evidence)=>{report.checks.push({name,pass:!!pass,evidence});console.log((pass?'PASS ':'FAIL ')+name);};
const guard=installWriteGuard();let session;
(async()=>{try{
 session=await open({pageFile:PAGE,hash:'#today',W:1366,H:768,dpr:1});const p=session.page;await ready840(p);await p.waitForFunction(()=>TodayWork840.report().groupsMerged&&typeof todayWorkSummary842==='function');
 const before=await nativeSnapshot(p),original=await p.evaluate(()=>TodayWork840.report().asOf),input=await summaryInputs842(p,original);
 const candidates=input.weeks.filter(w=>w.phase==='Build'&&w.plan?.rolled_forward).flatMap(w=>w.plan.days.filter(d=>/source\s+conflicts?\s+awaiting\s+confirmation/i.test(String(d.basis||''))&&input.columns.some(c=>c.programme_type&&typeof d.totals?.[c.programme_type]==='number'&&d.totals[c.programme_type]>0)).map(d=>[d.date,w.start].sort().at(-1))).sort();
 const day=candidates[0];check('Native dated programme supplies a real provisional comparison date',!!day,{day,candidates});if(!day)throw Error('No native source-conflict date for this probe');
 await p.locator('#asOf').fill(day);await p.locator('#asOf').press('Tab');await p.waitForFunction(d=>TodayWork840.report().asOf===d,day,{timeout:5000});await p.waitForTimeout(300);
 const source=await summaryInputs842(p,day),fencing=fencingOracle841(await fencingInputs841(p,day)),expected=fencing.map(r=>({id:r.id,plan:dailyPlan842(r,source)})),actual=await p.evaluate(d=>todayWorkSummary842(d),day),ui=(await front842(p)).find(c=>c.id==='fencing');
 report.day=day;report.source=source;report.expected=expected;report.actual=actual;report.ui=ui;
 const provisional=expected.filter(r=>r.plan.provisional);check('Selected source date activates relevant provisional work types',provisional.length>0,provisional);
 for(const row of expected){const a=actual.fencingRows.find(r=>r.id===row.id),u=ui.fenceRows.find(r=>r.id===row.id),fields=['planned','actual','delta','behind','early','status','unit','provisional'];
  check(row.id+' selected-day quantity and provisional scope match independent dated input',fields.every(k=>a.plan[k]===row.plan[k]),{expected:row.plan,actual:a.plan});
  if(row.plan.provisional){check(row.id+' warning remains amber and explicitly qualified beside numeric values',u.plan.provisional==='true'&&u.plan.color==='rgb(255, 210, 168)'&&u.plan.label.startsWith('Provisional:')&&/source date check required/.test(u.plan.label)&&u.values.total.value!=='—'&&u.values.done.value!=='—',u);
   await p.locator('[data-tw840-fence-detail='+row.id+']').click();await p.waitForTimeout(100);const text=await p.locator('#gc500-work-dialog840 .tw840-definition').textContent();check(row.id+' detail exposes the dated source conflict qualification',/source conflicts awaiting confirmation/i.test(text)&&/provisional/i.test(text),text);await p.keyboard.press('Escape');
  }
 }
 await p.locator('[data-tw840-fence-row='+provisional[0].id+']').scrollIntoViewIfNeeded();await p.screenshot({path:path.join(OUT,'laptop-provisional-fencing.png')});
 await p.locator('#asOf').fill(original);await p.locator('#asOf').press('Tab');await p.waitForFunction(d=>TodayWork840.report().asOf===d,original,{timeout:5000});
 check('Date probe restores original selected day',await p.locator('#asOf').inputValue()===original);
 const after=await nativeSnapshot(p);check('Native records unchanged by date and detail navigation',JSON.stringify(before.collections)===JSON.stringify(after.collections));check('No runtime error',session.errors.length===0,session.errors);check('Frozen candidate unchanged',sha(fs.readFileSync(PAGE))===CANDIDATE_SHA);
}catch(e){check('Focused provisional execution',false,e.message);}finally{
 if(session)await session.browser.close();await guard.closeAll();report.guard=guard;check('Every non-GET blocked',guard.nonGetSeen.length===guard.blocked.length);check('No operational write attempted',!guard.nonGetSeen.some(r=>r.operational));const unexpected=guard.consoleErrors.filter(e=>!(/Failed to load resource: net::ERR_BLOCKED_BY_CLIENT/.test(e.text)&&guard.blocked.some(b=>!b.operational&&b.url===e.url)));check('No unexpected console error',!unexpected.length,unexpected);report.passed=report.checks.filter(c=>c.pass).length;report.total=report.checks.length;fs.writeFileSync(path.join(OUT,'provisional842.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({passed:report.passed,total:report.total,candidate:CANDIDATE_SHA}));if(report.passed!==report.total)process.exitCode=1;
}})().catch(e=>{console.error(e.message);process.exitCode=2;});
