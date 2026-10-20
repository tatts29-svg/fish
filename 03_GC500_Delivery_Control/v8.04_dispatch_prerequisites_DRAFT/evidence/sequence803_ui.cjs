// Author: Andrew Fisher. Actual view-only controls on desktop and phone; no record changes.
const fs=require('fs'),path=require('path'),crypto=require('crypto');
const {open}=require('../../toolchain/harness/open_page');
const pageFile=process.env.PAGE || '/workspace/private-wed7-bookings/v804_capability_candidate.html',out=process.env.OUT || '/workspace/private-wed7-bookings/sequence804-ui';
fs.mkdirSync(out,{recursive:true});
(async()=>{const result={candidateSha256:crypto.createHash('sha256').update(fs.readFileSync(pageFile)).digest('hex'),runs:[]};
for(const mobile of [false,true]){const h=await open({pageFile,W:mobile?390:1440,H:mobile?844:1000,mobile});const r={mode:mobile?'phone':'desktop',checks:[]},ck=(name,pass)=>r.checks.push({name,pass:!!pass});result.runs.push(r);try{
 await h.page.waitForFunction(()=>SYNC.status==='live'&&SYNC.first.size===Object.keys(SYNC_COLLS).length,null,{timeout:240000});
 await h.page.evaluate(()=>{state.day='2026-10-07';go('timeline');});
 await h.page.locator('#pane-timeline details[data-ldsec="carrier"] > summary').click();
 const controls=h.page.locator('#pane-timeline [data-dispatch803]');ck('Every known truck has an actual departure-check control',await controls.count()===11);
 await controls.first().click();const modal=h.page.locator('.drawer[role="dialog"][aria-label="Departure checks"]');await modal.waitFor();
 const words=await modal.innerText();ck('Departure dialog shows first DD cargo and loading-clock distinction',words.includes('26112709')&&words.includes('P55')&&words.includes('loading time does not record departure or arrival'));
 ck('Three unchecked confirmations; no automatic approval',await modal.locator('[data-dispatch803-check]').count()===3&&await modal.locator('[data-dispatch803-check]:checked').count()===0);
 ck('View-only link cannot change checks or depart',await modal.locator('[data-dispatch803-check]:disabled').count()===3&&await modal.locator('[data-dispatch803-depart]').isDisabled());
 ck('Applicable full checklist linked and not replaced by reminders',await modal.locator('a').filter({hasText:'full pre-transit'}).count()===1&&words.includes('reminders do not replace it'));
 ck('Departure drawer stays within viewport',await modal.evaluate(e=>{const b=e.getBoundingClientRect();return b.x>=-1&&b.right<=innerWidth+1;}));
 await modal.locator('[data-dispatch803-close]').focus();await h.page.waitForTimeout(1700);ck('First refresh preserves keyboard focus',await modal.locator('[data-dispatch803-close]').evaluate(e=>document.activeElement===e));
 await h.page.screenshot({path:path.join(out,r.mode+'-departure.png')});await modal.locator('[data-dispatch803-close]').click();
 const expected=[['26112709','P55','05:00','1 ×'],['26112730','P56','05:00','1 ×'],['26112733','P54','05:30','1 ×'],['26112749','26112797','T0258','05:30','WC86'],['26112756','P57','08:30','1 ×'],['26112762','P52','08:30','1 ×'],['26112769','WC20','06:30','1 ×'],['26112776','WC20','07:00','1 ×'],['26112783','WC20','09:00','1 ×'],['26112786','WC20','09:00','1 ×'],['26112495','GN18','09:30','GN13']];
 for(let i=0;i<expected.length;i++){
  const detail=h.page.locator('#pane-timeline details[data-ldsec="carrier"]');if(!await detail.evaluate(e=>e.open))await detail.locator(':scope > summary').click();
  await h.page.locator('#pane-timeline [data-dispatch803]').nth(i).click();await modal.waitFor();const t=await modal.innerText();
  ck('Truck '+(i+1)+' drawer retains its exact DD, references and clock',expected[i].every(x=>t.includes(x)));
  await modal.locator('[data-dispatch803-depart]').scrollIntoViewIfNeeded();ck('Truck '+(i+1)+' departure control is reachable and held',await modal.locator('[data-dispatch803-depart]').isDisabled()&&await modal.locator('[data-dispatch803-depart]').evaluate(e=>{const b=e.getBoundingClientRect();return b.top>=0&&b.bottom<=innerHeight+1;}));
  await modal.locator('[data-dispatch803-close]').click();
 }
 await h.page.evaluate(()=>go('fencing'));
 const week=await h.page.locator('[data-fweek]').evaluateAll(es=>es.map(e=>e.dataset.fweek));r.weeks=week;
 const key=week.find(x=>x==='Week 2');if(!key)throw new Error('No CW2 week control');
 await h.page.locator('[data-fweek="Week 2"]').click();
 const checks=h.page.locator('[data-cw2-plan803] [data-sequence803-row]');ck('Source prerequisites have actual review controls',await checks.count()===23);
 const q=h.page.locator('[data-sequence803-row="pit-stairs"][data-sequence803-req="pit-stairs-1"]');await q.click();
 const fence=h.page.locator('.drawer[role="dialog"][aria-label="Fencing prerequisite confirmation"]');await fence.waitFor();const text=await fence.innerText();
 ck('Fencing dialog retains source requirement and dated provenance',text.includes('Ben / Cliftons')&&text.includes('2026-10-02')&&text.includes('p. 5'));
 ck('Fencing confirmation is view-only and separate from completion',await fence.locator('[data-sequence803-check]').isDisabled()&&text.includes('does not record work as installed'));
 ck('Fencing drawer stays within viewport',await fence.evaluate(e=>{const b=e.getBoundingClientRect();return b.x>=-1&&b.right<=innerWidth+1;}));
 await h.page.screenshot({path:path.join(out,r.mode+'-fencing.png')});await fence.locator('[data-sequence803-close]').click();
 await h.page.locator('[data-sequence803-row="club-creek"]').click();const conditional=(await fence.textContent()).toLowerCase();r.conditional=conditional;ck('Conditional instruction preserves later-work alternative',conditional.includes('completed later')&&conditional.includes('condition reviewed with the crew')&&conditional.includes('does not mean all conditional work has already happened'));
 await fence.locator('[data-sequence803-close]').click();r.errors=h.errors;r.requests=h.counts;ck('No page errors or service-write attempts',!h.errors.length&&!h.counts.blocked);
 await h.page.evaluate(()=>{
  const x=sequence803Requirement('pit-stairs','pit-stairs-1'),record={id:'e'.repeat(32),confirmed:true,by:'Practice UI reviewer',at:'2026-10-02T01:02:03.000Z',source:x.plan.sha256,revision:x.plan.revision,requirement:x.requirement.text,supersedes:[]},key=sequence803Key(x)+':'+record.id;
  window.review804HistoryBackup={key,local:S.answers[key],ack:SYNC.last.answers[docIdOf(key)]};S.answers[key]=JSON.stringify(record);SYNC.last.answers[docIdOf(key)]=JSON.stringify({_k:key,v:JSON.stringify(record)});RENDER_MEMO.clear();render();
 });
 await q.click();await fence.waitFor();ck('Recorded operator and time are visible in actual prerequisite drawer',await fence.locator('.db > p').filter({hasText:'Confirmation recorded by Practice UI reviewer'}).isVisible());
 await fence.locator('summary').filter({hasText:'Recorded confirmations and revocations'}).click();ck('Expanded history retains exact source instruction and operator',await fence.locator('details').innerText().then(t=>t.includes('Practice UI reviewer')&&t.includes('Ben / Cliftons')&&t.includes('2026-10-02')));
 await h.page.screenshot({path:path.join(out,r.mode+'-fencing-history.png')});await fence.locator('[data-sequence803-close]').click();
 await h.page.evaluate(()=>{const b=window.review804HistoryBackup;if(b.local===undefined)delete S.answers[b.key];else S.answers[b.key]=b.local;if(b.ack===undefined)delete SYNC.last.answers[docIdOf(b.key)];else SYNC.last.answers[docIdOf(b.key)]=b.ack;delete window.review804HistoryBackup;RENDER_MEMO.clear();render();});
 r.errors=h.errors;r.requests=h.counts;ck('Synthetic UI history caused no service-write attempts',!h.errors.length&&!h.counts.blocked);
}finally{await h.browser.close();fs.writeFileSync(path.join(out,'ui_results.json'),JSON.stringify(result,null,2));}}
console.log(JSON.stringify(result));if(result.runs.some(r=>r.checks.some(c=>!c.pass)))process.exitCode=1;
})().catch(e=>{console.error(e);process.exitCode=1;});
