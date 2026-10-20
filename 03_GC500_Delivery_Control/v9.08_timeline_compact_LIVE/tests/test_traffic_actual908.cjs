// Author: Andrew Fisher. Actual Timeline controls, isolated in-memory saves, every network mutation blocked.
// Run only on the final v9.08 candidate, under flock /tmp/gc500-browser.lock.
const fs=require('fs'),path=require('path'),{open}=require('../../toolchain/harness/open_page');
(async()=>{let s;try{
 const out=process.env.EVIDENCE_DIR;if(!out||!path.isAbsolute(out))throw Error('Use an absolute private evidence directory');fs.mkdirSync(out,{recursive:true});
 const pageFile=process.env.PAGE;if(!pageFile||!fs.existsSync(pageFile))throw Error('Final v9.08 PAGE is required');
 const candidate=fs.readFileSync(pageFile,'utf8');if(!candidate.includes('function timeline908Arrange(')||!candidate.includes('.traffic903 select option:checked'))throw Error('Expected final v9.08 layout and traffic contrast CSS');
 s=await open({pageFile,hash:'#timeline',W:390,H:844});const p=s.page,blocked=[];
 await p.context().route('**/*',r=>{if(r.request().method()!=='GET'){const u=new URL(r.request().url());blocked.push({method:r.request().method(),host:u.host,path:u.pathname});return r.abort();}return r.fallback();});
 await p.waitForFunction(()=>SYNC.status==='live'&&SYNC.first.size===Object.keys(SYNC_COLLS).length,null,{timeout:180000});
 const version=await p.evaluate(()=>SYNC.db.readVersion821());
 // Keep edit-mode practice stable without asking the service for edit access or fetching newer records.
 await p.context().route('**/api/version',r=>r.request().method()==='GET'?r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({level:'edit',version})}):r.abort());
 const context=await p.evaluate(()=>{
  window.TRAFFIC_ACTUAL908={before:JSON.stringify(S),original:{bump,save,capability,mayWrite,whoAmI,flash,doc:SYNC.db.doc,readonly:SYNC.readonly,level:SYNC.level},captured:[],unexpected:[]};const t=TRAFFIC_ACTUAL908;
  // Capture before granting practice edit mode. The production traffic903Save remains unchanged.
  save=()=>{t.unexpected.push('save');return false;};SYNC.db.doc=()=>({set:async()=>{t.unexpected.push('database set')},delete:async()=>{t.unexpected.push('database delete')}});
  bump=()=>{t.captured.push(JSON.parse(JSON.stringify(S.loads[t.key])));bump.kept=true;render();};
  capability=()=> 'edit';mayWrite=()=>true;whoAmI=()=> 'Isolated traffic check';flash=()=>{};SYNC.readonly=false;SYNC.level='edit';
  const d=programmeDays().find(x=>x.iso==='2026-10-12'&&dpLoads(x).length)||programmeDays().find(x=>dpLoads(x).length);if(!d)throw Error('No native load to exercise');
  state.day=d.iso;state.tlView='day';go('timeline');render();const el=document.querySelector('#pane-timeline .traffic903');if(!el)throw Error('No native traffic control editor');
  t.day=el.dataset.traffic903Day;t.id=el.dataset.traffic903Load;t.key=traffic903Key(t.day,t.id);
  return {day:t.day,id:t.id,key:t.key};
 });
 const editor=p.locator('#pane-timeline .traffic903').first(),checks=[],ok=(name,pass,detail)=>checks.push({name,pass:!!pass,...(detail===undefined?{}:{detail})});
 const labels=await editor.locator('option').evaluateAll(es=>es.map(e=>[e.value,e.textContent]));
 ok('exactly four simple native traffic statuses',JSON.stringify(labels)===JSON.stringify([['unknown','To confirm'],['not_required','Not required'],['required','Required'],['arranged','Arranged']]));
 const states=[];
 for(const [status,label] of [['required','Required'],['arranged','Arranged'],['not_required','Not required'],['unknown','To confirm']]){
  await editor.evaluate(e=>e.open=true);const before=await p.evaluate(()=>TRAFFIC_ACTUAL908.captured.length);
  await editor.locator('select').selectOption(status);
  ok(status+': selecting does not save automatically',await p.evaluate(n=>TRAFFIC_ACTUAL908.captured.length===n,before));
  await editor.locator('[data-traffic903-save]').click();await p.waitForTimeout(180); // Let the native button hover colour transition settle.
  const got=await p.evaluate(()=>{const t=TRAFFIC_ACTUAL908,e=[...document.querySelectorAll('#pane-timeline .traffic903')].find(e=>e.dataset.traffic903Day===t.day&&e.dataset.traffic903Load===t.id),sel=e.querySelector('select'),cs=getComputedStyle(sel),box=sel.getBoundingClientRect(),button=e.querySelector('[data-traffic903-save]'),bs=getComputedStyle(button);return {buttonColour:bs.color,buttonBackground:bs.backgroundColor,count:t.captured.length,record:traffic903Plan(t.day,t.id),raw:S.loads[t.key],summary:e.querySelector('summary').textContent,value:sel.value,open:e.open,focus:document.activeElement===sel,inputs:e.querySelectorAll('input[type="number"]').length,text:e.textContent,colour:cs.color,background:cs.backgroundColor,fits:box.left>=0&&box.right<=innerWidth};});states.push(got);
  ok(status+': native save captured once with correct stable day/load',got.count===before+1&&got.raw.status===status&&got.raw.day===context.day&&got.raw.loadId===context.id&&got.raw.by==='Isolated traffic check');
  ok(status+': saved choice, summary and focus survive native redraw',got.value===status&&got.record.status===status&&got.summary==='Traffic control · '+label&&got.open&&got.focus);
  ok(status+': no headcount or extra cost copy',!got.inputs&&Object.keys(got.raw).sort().join(',')==='at,by,day,kind,loadId,status'&&!/no charge|headcount|V8s|Provided through/i.test(got.text));
  ok(status+': native Save button has readable dark text on orange fill',got.buttonColour==='rgb(19, 43, 51)'&&['rgb(255, 150, 79)','rgb(255, 173, 117)'].includes(got.buttonBackground));
  ok(status+': actual phone selector has readable dark palette and fits',got.colour==='rgb(243, 249, 250)'&&got.background==='rgb(16, 38, 45)'&&got.fits);
 }
 await editor.screenshot({path:path.join(out,'traffic-native-phone-390.png')});
 const restored=await p.evaluate(()=>{const t=TRAFFIC_ACTUAL908,unexpected=t.unexpected.slice();S=JSON.parse(t.before);bump=t.original.bump;save=t.original.save;capability=t.original.capability;mayWrite=t.original.mayWrite;whoAmI=t.original.whoAmI;flash=t.original.flash;SYNC.db.doc=t.original.doc;SYNC.readonly=t.original.readonly;SYNC.level=t.original.level;render();return {unchanged:JSON.stringify(S)===t.before,unexpected};});
 ok('all local synthetic changes restored',restored.unchanged&&!restored.unexpected.length,restored);
 ok('no operational network write attempted',!blocked.some(x=>x.host==='gc500-production.up.railway.app')&&!s.counts.blocked,{blocked});
 ok('no runtime errors',!s.errors.length,s.errors);
 fs.writeFileSync(path.join(out,'result.json'),JSON.stringify({checks,context,states,restored,blocked,errors:s.errors},null,2));checks.forEach(c=>console.log((c.pass?'PASS ':'FAIL ')+c.name));console.log(checks.filter(c=>c.pass).length+'/'+checks.length);if(checks.some(c=>!c.pass))process.exitCode=1;
}finally{if(s)await s.browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
