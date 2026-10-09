// Author: Andrew Fisher. Read-only actual-record instrument and interaction checks.
'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {installWriteGuard,ready840,nativeSnapshot}=require('../v8.40_today_work_progress_LIVE/test_today840.cjs');
const {immutable}=require('../v8.49_fencing_components_LIVE/test_components849_browser.cjs');
const {PAGE,BASE,OUT}=process.env,live=process.env.LIVE==='1',day='2026-10-05';
const sha=x=>crypto.createHash('sha256').update(x).digest('hex');
const canon=x=>Array.isArray(x)?'['+x.map(canon)+']':x&&typeof x==='object'?'{'+Object.keys(x).sort().map(k=>JSON.stringify(k)+':'+canon(x[k])).join(',')+'}':JSON.stringify(x);
const same=(a,b)=>canon(a)===canon(b),fmt=x=>x.toLocaleString('en-AU',{maximumFractionDigits:2});
const fence='[data-tw840-area="fencing"]',fold=fence+' [data-tw848-group-fold]';
(async()=>{
 if(!PAGE||!BASE||!OUT)throw Error('PAGE BASE OUT required');fs.mkdirSync(OUT,{recursive:true});
 const candidate=sha(fs.readFileSync(PAGE)),report={author:'Andrew Fisher',candidate,live,checks:[],views:[]};
 const save=()=>fs.writeFileSync(path.join(OUT,'overall853.json'),JSON.stringify(report,null,2));
 const check=(name,pass,evidence)=>{report.checks.push({name,pass:!!pass,evidence});save();console.log((pass?'PASS ':'FAIL ')+name);};
 const guard=installWriteGuard(),{open}=require('../toolchain/harness/open_page.js');let s;
 try{
  s=await open({pageFile:BASE,hash:'#today',W:1366,H:900});await ready840(s.page);await s.page.waitForFunction(()=>DOCS.state==='ready');
  const baseline=await immutable(s.page,day);await s.browser.close();s=null;
  for(const view of [{name:'laptop',W:1366,H:900},{name:'phone',W:390,H:844,dpr:2,mobile:true},{name:'smallphone',W:320,H:740,dpr:2,mobile:true}]){
   s=await open({pageFile:live?undefined:PAGE,hash:'#today',...view});const p=s.page;await ready840(p);await p.waitForFunction(()=>DOCS.state==='ready');await p.evaluate(day=>{state.asOf=day;renderToday();},day);
   const bytes=fs.readFileSync(PAGE),received=guard.documentResponses.at(-1),bom=bytes[0]===239&&bytes[1]===187&&bytes[2]===191;
   check(view.name+' exact requested HTML and mode',guard.fulfilledDocuments.at(-1)?.sha===candidate&&(live?s.counts.page===0:s.counts.page>0));
   check(view.name+' browser bytes match exact candidate or leading BOM removal only',received?.status===200&&(received.sha===candidate&&received.bytes===bytes.length||bom&&received.sha===sha(bytes.subarray(3))&&received.bytes===bytes.length-3),received);
   check(view.name+' original quantities source models and finances unchanged',same(baseline,await immutable(p,day)));
   const before=await nativeSnapshot(p),model=await p.evaluate(day=>fenceOverall853(day),day);
   const expected=model.rows.reduce((sum,r)=>sum+Math.min(r.recorded,r.total),0),total=model.rows.reduce((sum,r)=>sum+r.total,0);
   check(view.name+' whole-metres arithmetic reconciles independently',model.state==='ready'&&model.credited.min===expected&&model.credited.max===expected&&model.total===total&&model.left.min===total-expected&&model.pct.min===Math.round(expected/total*10000)/100,model);
   check(view.name+' Fencing starts closed',await p.locator(fold).evaluate(n=>!n.open));
   await p.locator(fold+' > summary').click();await p.locator(fence+' .tw846-lights').scrollIntoViewIfNeeded();await p.waitForTimeout(500);
   const state=await p.locator(fence).evaluate(n=>({title:n.querySelector('.tw846-title')?.textContent,pct:n.querySelector('.tw840-reading')?.textContent.replace(/\s/g,''),lamps:n.querySelectorAll('.tl841-lamp').length,lit:n.querySelectorAll('.tl841-lamp.is-on').length,green:n.querySelectorAll('.tl841-lamp.is-finished').length,caption:n.querySelector('.tw840-caption')?.textContent,notes:n.querySelector('.tw853-qualifier')?.textContent,counts:Object.fromEntries([...n.querySelectorAll('[data-tw853-quantity]')].map(e=>[e.dataset.tw853Quantity,e.textContent.trim()])),details:n.querySelector('[data-tw841-group-card]')?.open,componentsVisible:n.querySelector('[data-fc849-scope]')?.checkVisibility() || false,componentsInsideClosedDetails:!!n.querySelector('[data-fc849-scope]')?.closest('details:not([open])')}));
   check(view.name+' same five native lamps title and scoped percentage',state.title==='Fencing'&&state.lamps===5&&state.lit===Math.min(4,Math.floor(model.lampPct/20))&&state.green===0&&state.pct===fmt(model.pct.min)+'%'&&state.caption.includes('work metres recorded'),state);
   check(view.name+' provisional label and folded supporting data',state.notes==='Provisional programme'&&!state.details&&!state.componentsVisible&&state.componentsInsideClosedDetails,state);
   check(view.name+' recorded and left show correct scoped quantities',state.counts.done===fmt(expected)+' m'&&state.counts.left===fmt(total-expected)+' m',state.counts);
   const motion=await p.evaluate(()=>({report:TodayWork840.report(),running:document.querySelectorAll('#gc500-work-board840 .tw840-running').length,animations:[...document.querySelectorAll('[data-tw840-area="fencing"] .race-sweep-window')].map(n=>({name:getComputedStyle(n).animationName,play:getComputedStyle(n).animationPlayState}))}));
   check(view.name+' automatic reflection runs only on visible selected Fencing',motion.report.running==='fencing'&&motion.running===1&&motion.animations.length>0&&motion.animations.every(a=>a.name!=='none'&&a.play==='running'),motion);
   await p.screenshot({path:path.join(OUT,view.name+'-instrument.png')});
   await p.locator(fence+' .tw840-reading').scrollIntoViewIfNeeded();await p.screenshot({path:path.join(OUT,view.name+'-percentage.png')});
   await p.locator(fence+' .tw853-gates').scrollIntoViewIfNeeded();await p.screenshot({path:path.join(OUT,view.name+'-counts.png')});
   for(const mode of ['total','done','left']){
    const button=mode==='total'?p.locator(fence+' [data-tw840-focus="fencing-indicator"]'):p.locator(fence+' [data-tw853-quantity="'+mode+'"]').locator('..');await button.click();
    await p.locator('#gc500-work-dialog840[open] [data-tw853-detail]').waitFor();
    const detail=await p.locator('#gc500-work-dialog840').evaluate(n=>({heading:n.querySelector('h2').textContent,rows:n.querySelectorAll('.tw853-detail-table tbody tr').length,basisOpen:n.querySelector('.tw853-basis')?.open,text:n.innerText,scroll:n.scrollWidth,client:n.clientWidth}));
    check(view.name+' '+mode+' opens all six work activities instead of clean only',detail.heading.startsWith('Fencing ·')&&detail.rows===6&&!detail.basisOpen&&!detail.heading.startsWith('Clean fence'),detail);
    check(view.name+' '+mode+' dialog fits viewport with local table scroll',detail.scroll<=detail.client+1,detail);
    const basis=p.locator('#gc500-work-dialog840 .tw853-basis > summary');await basis.focus();await p.keyboard.press('Enter');check(view.name+' '+mode+' method disclosure opens by keyboard',await p.locator('#gc500-work-dialog840 .tw853-basis').evaluate(n=>n.open));
        await p.keyboard.press('Escape');await p.waitForFunction(()=>!document.querySelector('#gc500-work-dialog840').open);
    check(view.name+' '+mode+' Close returns focus to original board control',await button.evaluate(n=>document.activeElement===n));
   }
   await p.locator(fence+' .tw853-gates [data-tw840-fence-detail="v_gates"]').click();check(view.name+' gate opens original programme gate details',await p.locator('#gc500-work-dialog840 h2').textContent()==='Vehicle gates');await p.keyboard.press('Escape');
   await p.locator(fence+' [data-tw841-group-card] > summary').click();
   const types=await p.locator(fence+' [data-tw840-fence-row]').evaluateAll(rows=>rows.map(n=>n.dataset.tw840FenceRow));
   check(view.name+' all eight type and two recorded-only rows remain once',types.length===model.rows.length+model.gates.length+2&&new Set(types).size===types.length&&types.includes('fence_blocks')&&types.includes('labour'),types);
   check(view.name+' component and source comparison folds remain',await p.locator(fence+' [data-fc849-scope="today"]').count()===1&&await p.locator(fence+' [data-fc849-fold="po-quantities"]').count()===1);
   await p.locator(fence+' [data-tw841-group-card] > summary').focus();const retained=await p.evaluate(()=>({token:document.activeElement.dataset.tw840Focus,top:document.querySelector('main').scrollTop}));await p.evaluate(()=>renderToday());await p.waitForTimeout(400);
   const after=await p.evaluate(()=>({token:document.activeElement.dataset.tw840Focus,top:document.querySelector('main').scrollTop,open:document.querySelector('[data-tw841-group-card="fencing"]').open}));
   check(view.name+' redraw retains disclosure focus and scroll',after.open&&after.token===retained.token&&Math.abs(after.top-retained.top)<=2,{before:retained,after});
   const geometry=await p.evaluate(()=>({width:innerWidth,document:document.documentElement.scrollWidth,main:document.querySelector('main').clientWidth,scroll:document.querySelector('main').scrollWidth,card:document.querySelector('[data-tw840-area="fencing"]').clientWidth,cardScroll:document.querySelector('[data-tw840-area="fencing"]').scrollWidth}));
   check(view.name+' open card and page fit horizontally',geometry.document<=geometry.width+1&&geometry.scroll<=geometry.main+1&&geometry.cardScroll<=geometry.card+1,geometry);
   await p.locator(fold+' > summary').click();await p.waitForTimeout(150);check(view.name+' closing Fencing stops its lamp animation',await p.locator(fence).evaluate(n=>!n.classList.contains('tw840-running')));
   await p.emulateMedia({reducedMotion:'reduce'});await p.locator(fold+' > summary').click();await p.locator(fence+' .tw846-lights').scrollIntoViewIfNeeded();await p.waitForTimeout(200);check(view.name+' reduced motion disables the animation control',await p.locator(fence+' [data-tw840-motion]').isDisabled()&&await p.evaluate(()=>TodayWork840.report().running===null));
   check(view.name+' interactions preserve all shared collections',same(before.collections,(await nativeSnapshot(p)).collections));check(view.name+' zero runtime errors',!s.errors.length,s.errors);report.views.push({view,state,geometry,model,motion});await s.browser.close();s=null;
  }
 }catch(e){check('Browser execution completed',false,e.stack);}finally{if(s)await s.browser.close();await guard.closeAll();report.guard=guard;const unexpected=guard.consoleErrors.filter(e=>!(/Failed to load resource: net::ERR_BLOCKED_BY_CLIENT/.test(e.text)&&guard.blocked.some(b=>!b.operational&&b.url===e.url)));check('No unexpected console errors',!unexpected.length,unexpected);check('Frozen candidate unchanged',sha(fs.readFileSync(PAGE))===candidate);check('Every non-GET blocked with no operational write attempt',guard.nonGetSeen.length===guard.blocked.length&&!guard.nonGetSeen.some(r=>r.operational),guard.nonGetSeen);report.passed=report.checks.filter(x=>x.pass).length;report.total=report.checks.length;save();console.log(JSON.stringify({passed:report.passed,total:report.total}));if(report.passed!==report.total)process.exitCode=1;}
})().catch(e=>{console.error(e.stack);process.exitCode=2;});
