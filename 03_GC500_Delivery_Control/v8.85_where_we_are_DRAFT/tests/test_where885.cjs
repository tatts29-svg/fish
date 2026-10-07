// Author: Andrew Fisher. v8.85 Where we are: placement, figures against the group records, lights, motion, native links, redraw, print; no live writes.
// W sets the desktop width (default 1600); MOB=1 runs the phone.
const fs=require('fs'),{open}=require('../../toolchain/harness/open_page');
(async()=>{let s;try{const mob=!!process.env.MOB,W=mob?390:Number(process.env.W||1600),H=mob?844:Number(process.env.H||1000);s=await open({pageFile:process.env.PAGE,W,H,mobile:mob,dpr:mob?2:1});const p=s.page,R=[];const ok=(n,v)=>R.push({name:n,pass:!!v});
await p.waitForFunction(()=>typeof Where885==='object'&&SYNC.status==='live'&&todayWorkHealth840().ready);await p.evaluate(()=>go('today'));await p.waitForTimeout(500);
const clean=t=>String(t||'').replace(/\s+/g,'');
const m=await p.evaluate(()=>{window.__before885=JSON.stringify([S,moneySummary(),fh866Model()]);
 const pane=document.getElementById('pane-today'),el=document.getElementById('where885'),board=document.getElementById('gc500-work-board840');
 const day=todayWorkDay841(),sum=todayWorkSummary848(day),fence=fenceOverall853(day,sum),ids=['buildings','toilets','fencing','generators','lighting','vms','equipment'];
 const parts=ids.map(id=>id==='fencing'?{min:fence.pct?.min,lower:(fence.pct?.max??fence.pct?.min)>fence.pct?.min}:{min:sum.byId[id].pct,lower:sum.byId[id].pctKind==='lower-bound'});
 const known=parts.every(x=>typeof x.min==='number'),mean=known?parts.reduce((n,x)=>n+x.min,0)/7:null,lower=parts.some(x=>x.lower);
 const expected=known?(lower?Math.floor((mean+1e-9)*100)/100:mean).toLocaleString('en-AU',{maximumFractionDigits:2}):'—';
 const lamp=el.querySelector('.w885-lights .tl841-lamp'),groupLamp=board.querySelector('.tw846-lights .tl841-lamp');
 return {mounted:!!el,above:el?.nextElementSibling===board,inside:!!el?.querySelector('.w885-programme .today-work-programme840'),
  oldGone:!pane.querySelector(':scope > .today-work-programme840'),programmes:pane.querySelectorAll('.today-work-programme840').length,
  weeks:el.querySelectorAll('.w885-programme [data-week-day]').length,rail:!!el.querySelector('.w885-programme .prail'),openLink:!!el.querySelector('.w885-programme .hubgo'),
  shown:el.querySelector('[data-w885-pct]')?.textContent,expected,bound:!!el.querySelector('.w885-reading .w885-bound'),lower,mean,
  lit:el.querySelectorAll('.w885-lights .tl841-lamp.is-on').length,expectLit:known?(mean===100&&!lower?5:Math.min(4,Math.floor(mean/20))):0,
  label:el.querySelector('.w885-lights')?.getAttribute('aria-label')||'',
  chips:ids.map(id=>({id,chip:el.querySelector('[data-w885-jump="'+id+'"] b')?.textContent,card:document.querySelector('#tw840-card-'+id+' .tw840-reading')?.textContent})),
  lampW:lamp?.getBoundingClientRect().width||0,groupLampW:groupLamp?.getBoundingClientRect().width||0,
  heading:el.querySelector('h2')?.textContent,unique:new Set([...pane.querySelectorAll('[id]')].map(x=>x.id)).size===pane.querySelectorAll('[id]').length,
  groupsCols:getComputedStyle(el.querySelector('.w885-groups')).gridTemplateColumns.split(' ').length,overflow:document.documentElement.scrollWidth<=innerWidth+2};});
ok('card sits directly above the group cards',m.mounted&&m.above);
ok('programme panel moved inside, once',m.inside&&m.oldGone&&m.programmes===1);
ok('programme controls kept ('+m.weeks+' week buttons, rail, Where we are link)',m.rail&&m.openLink&&(mob?m.weeks===0:m.weeks>=8)); // the page draws week buttons on desktop only, as live does
ok('whole job matches the seven group records ('+m.shown+' = '+m.expected+')',m.shown===m.expected&&m.bound===m.lower);
ok('lights match the 20% steps ('+m.lit+' lit)',m.lit===m.expectLit);
ok('lights describe the reading for screen readers',m.label.includes(m.expected+'%'));
const badChips=m.chips.filter(c=>clean(c.chip)!==clean(c.card));
ok('each group reading matches its card',badChips.length===0);
ok('lights are much larger than the group lights ('+Math.round(m.lampW)+' vs '+Math.round(m.groupLampW)+' px)',mob?m.lampW>=44:m.lampW>=m.groupLampW*1.6);
ok('heading and unique identifiers',m.heading==='Where we are'&&m.unique);
ok('group strip columns ('+m.groupsCols+')',m.groupsCols===(mob?2:W>=1280?7:4));
ok('no page-wide horizontal overflow',m.overflow);
// motion: pause settles, play replays the lights and the count, then the reflection runs
await p.evaluate(()=>{const h=document.getElementById('where885'),main=document.querySelector('main');main.scrollTop+=h.getBoundingClientRect().top-main.getBoundingClientRect().top-10;});await p.waitForTimeout(300);
await p.click('#w885-motion');await p.waitForTimeout(150);
const paused=await p.evaluate(()=>({r:Where885.report(),label:document.querySelector('#w885-motion').textContent}));
ok('pause settles the figure and stops the motion',paused.r.paused&&!paused.r.running&&!paused.r.intro&&paused.r.shown===m.expected&&paused.label.includes('Play'));
await p.click('#w885-motion');await p.waitForTimeout(160);
const mid=await p.evaluate(()=>({r:Where885.report(),dots:[...document.querySelectorAll('#where885 .w885-lights .tl841-unit.reached .tl841-dots')].map(d=>getComputedStyle(d).animationName)}));
ok('play replays the count and the lights',mid.r.intro&&mid.r.shown!==m.expected&&mid.dots.every(n=>n==='w885-dots-on'));
await p.waitForTimeout(2900);
const after=await p.evaluate(()=>Where885.report());
ok('intro finishes on the exact figure, then the reflection runs',!after.intro&&after.shown===m.expected&&after.running);
// native link: a group tap goes to its card
await p.click('#w885-jump-generators');await p.waitForTimeout(900);
ok('group tap goes to its card',await p.evaluate(()=>{const c=document.getElementById('tw840-card-generators').getBoundingClientRect(),mr=document.querySelector('main').getBoundingClientRect();return c.top<mr.bottom&&c.bottom>mr.top;}));
// redraw keeps place, focus and data, and does not replay
await p.evaluate(()=>{const h=document.getElementById('where885'),main=document.querySelector('main');main.scrollTop+=h.getBoundingClientRect().top-main.getBoundingClientRect().top-10;});await p.waitForTimeout(200);
await p.focus('#w885-motion');const before=await p.evaluate(()=>document.querySelector('main').scrollTop);await p.evaluate(()=>renderToday());await p.waitForTimeout(350);
const red=await p.evaluate(()=>({top:document.querySelector('main').scrollTop,focus:document.activeElement?.id,intro:Where885.report().intro,same:window.__before885===JSON.stringify([S,moneySummary(),fh866Model()]),cards:document.querySelectorAll('#where885').length}));
ok('redraw keeps scroll position',Math.abs(red.top-before)<4);
ok('redraw keeps focus on the card control',red.focus==='w885-motion');
ok('redraw does not replay or duplicate the card',!red.intro&&red.cards===1);
ok('redraw does not change data or money',red.same);
// another day: the figure follows the selected day and says so
const other=await p.evaluate(()=>{const keep=state.asOf;state.asOf='2026-10-05';renderToday();const el=document.getElementById('where885'),mm=progress881Model('2026-10-05');const out={note:[...el.querySelectorAll('.w885-note')].map(n=>n.textContent).join(' '),shown:el.querySelector('[data-w885-pct]').dataset.text,model:mm.ready?(mm.pct.max-mm.pct.min>.005?Math.floor((mm.pct.min+1e-9)*100)/100:mm.pct.min).toLocaleString('en-AU',{maximumFractionDigits:2}):'—'};state.asOf=keep;renderToday();return out;});
ok('selected day drives the figure, labelled "As of" ('+other.shown+')',other.note.includes('As of')&&other.shown===other.model);
// reduced motion: no count, no sweep, control says motion is off
await p.emulateMedia({reducedMotion:'reduce'});await p.evaluate(()=>renderToday());await p.waitForTimeout(300);
const still=await p.evaluate(()=>({r:Where885.report(),off:document.querySelector('#w885-motion').disabled,anim:getComputedStyle(document.querySelector('#where885 .w885-lights .race-sweep-window')||document.body).animationName}));
ok('reduced motion shows the final figure without motion',!still.r.intro&&!still.r.running&&still.r.shown===m.expected&&still.off&&(still.anim==='none'||still.anim===''));
await p.emulateMedia({reducedMotion:'no-preference'});
if(process.env.OUT){fs.mkdirSync(process.env.OUT,{recursive:true});await p.evaluate(()=>{const h=document.getElementById('where885'),main=document.querySelector('main');main.scrollTop+=h.getBoundingClientRect().top-main.getBoundingClientRect().top-10;});await p.waitForTimeout(400);await p.screenshot({path:process.env.OUT+'/where-'+(mob?'phone':W)+'.png'});}
await p.emulateMedia({media:'print'});await p.waitForTimeout(200);
ok('print keeps the figure and drops the lights and control',await p.evaluate(()=>getComputedStyle(document.querySelector('#where885 .w885-lights')).display==='none'&&getComputedStyle(document.querySelector('#w885-motion')).display==='none'&&getComputedStyle(document.querySelector('#where885 .w885-reading')).display!=='none'));
await p.emulateMedia({media:'screen'});
ok('no runtime errors',s.errors.length===0);ok('no attempted live writes',s.counts.blocked===0);
R.forEach(r=>console.log((r.pass?'PASS ':'FAIL ')+r.name));if(badChips.length)console.log(JSON.stringify(badChips));console.log((mob?'phone':W+' px')+': '+R.filter(r=>r.pass).length+'/'+R.length);if(R.some(r=>!r.pass))process.exitCode=1;
}finally{if(s)await s.browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
