// Author: Andrew Fisher. Native compact-card integration checks; all network requests are GET-only.
// PAGE=/absolute/final.html EVIDENCE_DIR=/absolute/private/output node tests/test_compact911.cjs
// FULL_TIMELINE_SLICES=1 additionally captures every native scrolling viewport; top/card/workspace shots are always kept.
// Run under flock /tmp/gc500-browser.lock. No printing, record writes or provider-session POSTs are allowed.
const fs = require('fs'), path = require('path'), Module = require('module'), crypto = require('crypto');
const pageFile = process.env.PAGE, out = process.env.EVIDENCE_DIR;
if (!pageFile || !path.isAbsolute(pageFile) || !out || !path.isAbsolute(out)) throw Error('Set absolute PAGE and private EVIDENCE_DIR');
const repo = path.resolve(__dirname, '../..');
if (out === repo || out.startsWith(repo + path.sep)) throw Error('Keep screenshots and record evidence outside the repository');
fs.mkdirSync(out, {recursive: true});
const sourceHash=crypto.createHash('sha256').update(fs.readFileSync(pageFile)).digest('hex');
const harness = path.join(repo, 'toolchain/harness/open_page.js'), strict = new Module(harness, module);
strict.filename = harness; strict.paths = Module._nodeModulePaths(path.dirname(harness));
strict._compile(fs.readFileSync(harness, 'utf8')
 .replace(/const okPost = [^;]+;/, 'const okPost = false;')
 .replace('counts.blocked++; return route.abort();', "counts.blocked++; (counts.denied || (counts.denied = [])).push({method:r.method(), origin:new URL(u).origin, path:new URL(u).pathname}); return route.abort();")
 .replace('await page.goto(HOST', "await page.addInitScript(() => { window.print = () => { throw Error('Printing is prohibited in compact-card checks'); }; }); await page.goto(HOST"), harness);

const checks = [], widths = [390, 768, 1440, 1920, 3840], scenes = [];
function ok(name, pass, detail) { checks.push({name, pass: !!pass, ...(detail === undefined ? {} : {detail})}); }
async function settle(page) { await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))); }
async function inspectTargets(locator) {
 return locator.evaluate(e => [...e.querySelectorAll('button,summary,a')].filter(n => {
  const r = n.getBoundingClientRect(); return r.width && r.height && !n.closest('.ldb');
 }).map(n => { const r = n.getBoundingClientRect(); return {tag:n.tagName, text:(n.textContent || n.getAttribute('aria-label') || '').trim().slice(0,100), w:r.width, h:r.height, disabled:!!n.disabled}; }));
}
async function geometry(locator) {
 return locator.evaluate(e => {
  const rect = n => { const r=n.getBoundingClientRect(); return {x:r.x,y:r.y,w:r.width,h:r.height,right:r.right,bottom:r.bottom}; };
  const main = document.querySelector('main');
  return {card:rect(e), layout:rect(e.querySelector('.tl846-layout')), content:rect(e.querySelector('.ldl')),
   plans:rect(e.querySelector('.timeline908-plans')), utility:rect(e.querySelector('.timeline908-utility')),
   pageOverflow:document.documentElement.scrollWidth > innerWidth + 1,
   cardOverflow:e.scrollWidth > e.clientWidth + 1,
   lights:e.querySelectorAll('.tl841-unit').length, running:!!e.querySelector('.tl841-gantry.tl841-live'),
   main:rect(main), refs:[...e.querySelectorAll('[data-tl846-ref]')].map(n => n.dataset.tl846Ref)};
 });
}
async function fieldContrast(locator) {
 return locator.evaluate(e => {
  const parse=x=>{const m=x.match(/[\d.]+/g);return m?[+m[0],+m[1],+m[2],m[3]===undefined?1:+m[3]]:[0,0,0,0];};
  const over=(a,b)=>a.slice(0,3).map((v,i)=>v*a[3]+b[i]*(1-a[3]));
  const lum=rgb=>rgb.map(v=>{v/=255;return v<=.04045?v/12.92:Math.pow((v+.055)/1.055,2.4);}).reduce((s,v,i)=>s+v*[.2126,.7152,.0722][i],0);
  return [...e.querySelectorAll('input:not([type=checkbox]):not([type=radio]),select,textarea,button')].filter(n=>{const r=n.getBoundingClientRect();return r.width&&r.height;}).map(n=>{
   const s=getComputedStyle(n),ancestors=[];for(let a=n.parentElement;a;a=a.parentElement)ancestors.unshift(a);
   let backdrop=[255,255,255];for(const a of ancestors){const t=getComputedStyle(a),c=parse(t.backgroundColor);c[3]*=+t.opacity;backdrop=over(c,backdrop);}
   const background=parse(s.backgroundColor),foreground=parse(s.webkitTextFillColor||s.color),opacity=+s.opacity;
   background[3]*=opacity;const paintedBackground=over(background,backdrop);foreground[3]*=opacity;const paintedForeground=over(foreground,paintedBackground);
   const a=lum(paintedForeground),b=lum(paintedBackground);
   return {tag:n.tagName,type:n.type,id:n.id,attributes:[...n.attributes].filter(a=>a.name.startsWith('data-')).map(a=>[a.name,a.value]),disabled:!!n.disabled,colour:s.color,textFill:s.webkitTextFillColor,background:s.backgroundColor,opacity,contrast:(Math.max(a,b)+.05)/(Math.min(a,b)+.05),text:(n.tagName==='SELECT'?n.selectedOptions[0]?.textContent:n.value||n.textContent||'').trim().slice(0,100)};
  });
 });
}
async function wholePageScene(page,width) {
 await page.evaluate(()=>{const main=document.querySelector('main');main.scrollTop=0;window.scrollTo(0,0);});await settle(page);
 const layout=await page.evaluate(()=>{
  const rect=n=>{if(!n)return null;const r=n.getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height,right:r.right,bottom:r.bottom};};
  const pane=document.querySelector('#pane-timeline'),map=pane.querySelector('.drops911'),cards=[...pane.querySelectorAll('.ldlist[aria-label^="Due in"] .ld.compact908')];
  return {main:rect(document.querySelector('main')),pane:rect(pane),map:rect(map),arrangeButtons:cards.map(c=>c.querySelectorAll('[data-drop911-open]').length),firstCard:rect(cards[0]),cards:cards.map(rect),pageOverflow:document.documentElement.scrollWidth>innerWidth+1};
 });
 ok(width+'px: whole Timeline keeps native cards within the page',!layout.pageOverflow&&layout.cards.length>0&&layout.cards.every(r=>r.x>=-1&&r.right<=width+1),layout);
 ok(width+'px: the map stays hidden until Arrange loads is opened',!layout.map&&layout.arrangeButtons.every(n=>n===1),layout);
 const menus=(await fieldContrast(page.locator('#pane-timeline'))).filter(f=>f.tag==='SELECT');
 ok(width+'px: visible Timeline selection menus retain 4.5:1 contrast',menus.every(f=>f.contrast>=4.5),menus);
 const gaps=layout.cards.slice(1).map((r,i)=>r.y-layout.cards[i].bottom);
 ok(width+'px: native load cards retain compact vertical spacing',gaps.every(g=>g>=-1&&g<=32),gaps);
 await page.screenshot({path:path.join(out,'timeline-top-'+width+'.png')});
 // Record real viewport slices of the native scroll container; no layout CSS is changed for screenshots.
 const total=await page.evaluate(()=>{const e=document.querySelector('main');return {height:e.clientHeight,max:e.scrollHeight-e.clientHeight};});
 for(let top=Math.min(Math.max(1,total.height-100),total.max),part=1;process.env.FULL_TIMELINE_SLICES==='1'&&top>0&&part<=30;top=Math.min(top+Math.max(1,total.height-100),total.max),part++){
  await page.evaluate(top=>{document.querySelector('main').scrollTop=top;},top);await settle(page);
  await page.screenshot({path:path.join(out,'timeline-page-'+width+'-'+String(part).padStart(2,'0')+'.png')});
  if(top===total.max)break;
 }
 return layout;
}
async function nativeIdentity(page) {
 return page.evaluate(() => {
  const d = calendarDays().find(x => x.iso === state.day), all = dpLoads(d), entries=ldGroups(d,d.deliveries,'deliveries');
  const norm = n => ({tag:n.tagName,text:n.textContent.replace(/\s+/g,' ').trim(),attrs:[...n.attributes].filter(a=>!['class','style'].includes(a.name)).map(a=>[a.name,a.name==='name'?a.value.replace(/^(handling875-.*)-\d+$/,'$1-<native-group>'):a.value]).sort()});
  const sign = n => JSON.stringify(norm(n));
  const cards = [...document.querySelectorAll('#pane-timeline .ldlist[aria-label^="Due in"] .ld.compact908')];
  const rows = cards.map(card => {
   const b=card.querySelector('.ldl'),n=+b.querySelector('.ld-n b').textContent,entry=entries.find(x=>x.n===n),g=entry&&entry.g;
   if(!g)return {n,matched:false};
   const t=document.createElement('template');t.innerHTML=ldLine(d,g,n,b.getAttribute('aria-expanded')==='true',entries.some(x=>x.g.time||x.g.carrier));
   // Native Workers refreshes picker labels when its fold opens; compare the same native enhancement on the detached expected form.
   if(window.Workers911)t.content.querySelectorAll('.crew883[data-workers911]').forEach(editor=>Workers911.updateOptions(editor));
   applyCapability(t.content);
   const expected=[...t.content.querySelectorAll('button,a,input,select,textarea,summary')].map(sign);
   const actual=[...card.querySelectorAll('button,a,input,select,textarea,summary')].map(sign);
   const counts=list=>list.reduce((m,k)=>(m.set(k,(m.get(k)||0)+1),m),new Map()),a=counts(actual),e=counts(expected);
   const refs=[...card.querySelectorAll('[data-tl846-ref]')].map(r=>({key:r.dataset.tl846Ref,stage:Number(r.querySelector('.tl841-gantry').dataset.tl841Stage),lights:r.querySelectorAll('.tl841-unit').length}));
   return {n,id:ldId(d,all[n-1]),matched:b.dataset.ld===ldId(d,g),nativeControls:[...e].every(([k,c])=>a.get(k)===c),
    nativeRefs:refs.length===g.rows.length&&refs.every((r,i)=>r.key===g.rows[i].a.key&&r.stage===timeline841State(g.rows[i].a).stage&&r.lights===5),refs};
  });
  return {rows,expectedNumbers:entries.map(x=>x.n),numbers:rows.map(x=>x.n),order:all.map(g=>ldId(d,g))};
 });
}
async function trialControls(card) {
 const selectors=['.ldl','[data-tl841-open]','[data-tl841-print]','.ld-nav','.ld-qr','.flow891-chip', '.flow891-grip','.flow891-mv:not(:disabled)', '[data-drop911-open]', '.timeline908-plans > details > summary'];
 const results=[];
 for(const selector of selectors){
  const targets=card.locator(selector), count=await targets.count();
  for(let i=0;i<count;i++){
   const target=targets.nth(i);if(!(await target.isVisible())||!(await target.isEnabled()))continue;
   try{await target.click({trial:true,timeout:7000});results.push({selector,index:i,unblocked:true});}
   catch(e){results.push({selector,index:i,unblocked:false,error:e.message.slice(0,250)});}
  }
 }
 return results;
}

(async()=>{
 let session, failure;
 try{
  session=await strict.exports.open({pageFile,hash:'#timeline',W:1440,H:1100,gl:true});await require('./assets911.cjs')(session);const p=session.page;
  await p.waitForFunction(()=>window.GC500Refresh904?.report().settled&&SYNC.status==='live'&&SYNC.first.size===Object.keys(SYNC_COLLS).length,null,{timeout:180000});
  const day=process.env.DAY||'2026-10-08';
  await p.evaluate(day=>{state.day=day;state.tlView='day';state.q='';state.tlLoad=null;go('timeline');render();},day);
  ok('native view-link capability is applied before readonly checks',await p.evaluate(()=>capability()==='view'&&document.body.classList.contains('viewonly')));
  const initial=await nativeIdentity(p);
  ok('native load order, references and controls are retained exactly',initial.rows.length>0&&initial.rows.every(r=>r.matched&&r.nativeControls&&r.nativeRefs)&&JSON.stringify(initial.numbers)===JSON.stringify(initial.expectedNumbers),initial);

  for(const width of widths){
   await p.setViewportSize({width,height:width===390?844:width===768?1024:width===3840?2160:1100});
   await p.evaluate(()=>{state.tlLoad=null;render();});await settle(p);
   const pageLayout=await wholePageScene(p,width);
   const card=p.locator('#pane-timeline .ld.compact908').filter({has:p.locator('[data-tl846-ref="WC09"]')}).first();
   if(!(await card.count()))throw Error('Expected the native WC09 load on '+day);
   await card.scrollIntoViewIfNeeded();await settle(p);await p.waitForTimeout(100);
   const collapsed=await geometry(card),targets=await inspectTargets(card),trial=await trialControls(card);
   ok(width+'px: collapsed card fits its page and grid',!collapsed.pageOverflow&&!collapsed.cardOverflow&&collapsed.card.x>=-1&&collapsed.card.right<=width+1,collapsed);
   ok(width+'px: all collapsed native button/summary targets remain 44px',targets.every(t=>t.w>=43.9&&t.h>=43.9),targets);
   ok(width+'px: every native primary action and planning summary is unblocked',trial.every(r=>r.unblocked),trial);
   ok(width+'px: each reference retains five native stage lights',collapsed.lights===collapsed.refs.length*5,collapsed);
   if(width===1440)ok('1440px: typical single-reference load card is at most 260px high',collapsed.card.h<=260,{height:collapsed.card.h});
   await card.scrollIntoViewIfNeeded();await settle(p);
   await card.screenshot({path:path.join(out,'collapsed-'+width+'.png')});

   const arrange=card.locator('[data-drop911-open]');await arrange.click();await settle(p);
   await p.waitForFunction(()=>Drops911.report().status==='ready'||Drops911.report().status==='unavailable',null,{timeout:120000});await settle(p);
   const workspace=await card.locator('.drops911').evaluate(e=>{
    const r=e.getBoundingClientRect(),card=e.closest('.ld'),layout=card.querySelector('.tl846-layout').getBoundingClientRect(),report=Drops911.report();
    const day=calendarDays().find(d=>d.iso===state.day),all=dpLoads(day).filter(g=>g.kind==='deliveries');
    return {count:document.querySelectorAll('#pane-timeline .drops911').length,open:report.open,anchor:report.anchor,x:r.x,right:r.right,width:r.width,top:r.top,summaryBottom:layout.bottom,insideCard:!!card,rows:e.querySelectorAll('[data-drop911-select]').length,expectedRows:all.length,overflow:e.scrollWidth>e.clientWidth+1,ids:report.model.loads.map(l=>l.id),expectedIds:all.map(g=>ldId(day,g))};
   });
   ok(width+'px: Arrange loads opens one workspace beneath this card’s controls',workspace.open&&workspace.count===1&&workspace.insideCard&&workspace.top>=workspace.summaryBottom-1&&workspace.x>=-1&&workspace.right<=width+1&&!workspace.overflow,workspace);
   ok(width+'px: the arranging workspace retains the complete native daily load order',workspace.rows===workspace.expectedRows&&JSON.stringify(workspace.ids)===JSON.stringify(workspace.expectedIds),workspace);
   await card.locator('.drops911').scrollIntoViewIfNeeded();await settle(p);await p.screenshot({path:path.join(out,'arrange-'+width+'.png')});
   await card.locator('[data-drop911-close]').click();await settle(p);
   const closed=await arrange.evaluate(e=>({open:Drops911.report().open,remaining:document.querySelectorAll('#pane-timeline .drops911').length,expanded:e.getAttribute('aria-expanded'),focus:document.activeElement===e}));
   ok(width+'px: closing restores compact cards and focus to Arrange loads',!closed.open&&closed.remaining===0&&closed.expanded==='false'&&closed.focus,closed);

   const folds=[];
   for(const cls of ['loading872:not(.handling875):not(.crew883):not(.traffic903)', 'handling875', 'crew883', 'traffic903']){
    const fold=card.locator('.timeline908-plans > details.'+cls).first();
    if(!(await fold.count())){ok(width+'px: '+cls+' native planning panel exists',false);continue;}
    const summary=fold.locator(':scope > summary');await summary.click();await settle(p);
    if(cls==='crew883')await fold.evaluate(e=>e.querySelectorAll('details').forEach(n=>{n.open=true;}));
    const panel=await fold.evaluate(e=>{
     const r=e.getBoundingClientRect(),parent=e.parentElement.getBoundingClientRect();
     const fields=[...e.querySelectorAll('input,select,textarea,label,button')].filter(n=>{const r=n.getBoundingClientRect();return r.width&&r.height;}).map(n=>{const r=n.getBoundingClientRect(),s=getComputedStyle(n);return {tag:n.tagName,left:r.left,right:r.right,width:r.width,font:parseFloat(s.fontSize),colour:s.color,background:s.backgroundColor,disabled:!!n.disabled,text:(n.textContent||'').replace(/\s+/g,' ').trim().slice(0,100)};});
     return {open:e.open,left:r.left,right:r.right,width:r.width,parentWidth:parent.width,fields,bodyOverflow:e.scrollWidth>e.clientWidth+1,text:e.textContent.replace(/\s+/g,' ').trim()};
    });
    ok(width+'px: '+cls+' opens at full planning-row width without overflow',panel.open&&!panel.bodyOverflow&&Math.abs(panel.width-panel.parentWidth)<=3&&panel.left>=-1&&panel.right<=width+1,panel);
    ok(width+'px: '+cls+' fields are legible inside the panel',panel.fields.every(f=>f.left>=panel.left-1&&f.right<=panel.right+1&&f.font>=11.9),panel.fields);
    if(cls==='crew883'){
     const workers=await fold.evaluate(e=>{
      const plan=crew883Plan(e.dataset.crew883Day,e.dataset.crew883Ref),day=crew883Day(e.dataset.crew883Day),value=attr=>e.querySelector('['+attr+']')?.value;
      const rows=[...e.querySelectorAll('[data-crew883-person]')],actual=rows.map(row=>({slot:row.querySelector('[data-crew883-slot]').value===''?null:Number(row.querySelector('[data-crew883-slot]').value),roles:[...row.querySelectorAll('[data-crew883-role]:checked')].map(n=>n.dataset.crew883Role).sort()}));
      const expected=(plan.people||[]).map(p=>({slot:p.slot,roles:p.roles.slice().sort()}));
      return {heading:e.querySelector(':scope > summary')?.textContent,availability:!!e.querySelector('[data-staff910-availability]')&&value('data-crew883-count')===(day.count===null?'':String(day.count)),start:value('data-crew883-start'),finish:value('data-crew883-finish'),expectedStart:plan.start,expectedFinish:plan.finish,roleChoices:rows.every(row=>JSON.stringify([...row.querySelectorAll('[data-crew883-role]')].map(n=>n.dataset.crew883Role).sort())===JSON.stringify(Object.keys(crew883Roles).sort())),actual,expected};
     });
     ok(width+'px: Workers retains native day availability, role choices, assignments and planned times',/Workers/.test(workers.heading)&&workers.availability&&workers.start===workers.expectedStart&&workers.finish===workers.expectedFinish&&workers.roleChoices&&JSON.stringify(workers.actual)===JSON.stringify(workers.expected),workers);
    }
    if(cls==='crew883'||cls==='traffic903'){
     const contrast=await fieldContrast(fold);
     ok(width+'px: actual readonly '+cls+' disabled fields retain 4.5:1 contrast',contrast.some(f=>f.disabled)&&contrast.filter(f=>f.disabled).every(f=>f.contrast>=4.5),contrast);
    }
    if(cls==='traffic903'){
     const colours=await fold.evaluate(e=>{const n=e.querySelector('select');if(!n)return null;const s=getComputedStyle(n),parse=x=>{const m=x.match(/[\d.]+/g);return m?m.slice(0,3).map(Number):[];},lum=rgb=>rgb.map(v=>{v/=255;return v<=.04045?v/12.92:Math.pow((v+.055)/1.055,2.4);}).reduce((s,v,i)=>s+v*[.2126,.7152,.0722][i],0),a=lum(parse(s.color)),b=lum(parse(s.backgroundColor));return {foreground:s.color,background:s.backgroundColor,contrast:(Math.max(a,b)+.05)/(Math.min(a,b)+.05),options:[...n.options].map(o=>o.textContent)};});
     ok(width+'px: Traffic control retains readable native choices',!!colours&&colours.contrast>=4.5&&['To confirm','Not required','Required','Arranged'].every(w=>colours.options.includes(w)),colours);
    }
    if((width===390||width===1440)&&(cls==='crew883'||cls==='traffic903')){await fold.scrollIntoViewIfNeeded();await settle(p);await p.screenshot({path:path.join(out,cls+'-'+width+'.png')});}
    folds.push({kind:cls,...panel});await summary.click();
   }

   const before=await p.evaluate(()=>({record:JSON.stringify(S),order:dpLoads(calendarDays().find(d=>d.iso===state.day)).map(g=>ldId({iso:state.day},g))}));
   await card.locator('.ldl').click();await settle(p);
   const expanded=await geometry(card);
   ok(width+'px: native expanded delivery cards remain inside the page',await card.locator('.ldl').getAttribute('aria-expanded')==='true'&&!expanded.pageOverflow&&!expanded.cardOverflow,expanded);
   const expandedMenus=(await fieldContrast(card)).filter(f=>f.tag==='SELECT');
   ok(width+'px: native expanded delivery selection menus remain readable',expandedMenus.every(f=>f.contrast>=4.5),expandedMenus);
   const preserved=await card.evaluate(e=>{
    const button=e.querySelector('.ldl'),id=button.dataset.ld,sc=ldScroller(button),top=sc.scrollTop,order=dpLoads(calendarDays().find(d=>d.iso===state.day)).map(g=>ldId({iso:state.day},g));
    render();const replacement=[...document.querySelectorAll('#pane-timeline .ldl[data-ld]')].find(n=>n.dataset.ld===id);
    return {id,open:replacement?.getAttribute('aria-expanded')==='true',before:top,after:sc.scrollTop,sameOrder:JSON.stringify(order)===JSON.stringify(dpLoads(calendarDays().find(d=>d.iso===state.day)).map(g=>ldId({iso:state.day},g)))};
   });
   ok(width+'px: redraw preserves the open native load, scroll and order',preserved.open&&Math.abs(preserved.before-preserved.after)<=2&&preserved.sameOrder,preserved);
   await card.locator('.ldl').click();await settle(p);
   const after=await p.evaluate(()=>({record:JSON.stringify(S),order:dpLoads(calendarDays().find(d=>d.iso===state.day)).map(g=>ldId({iso:state.day},g))}));
   ok(width+'px: expansion and planning review do not change records or order',before.record===after.record&&JSON.stringify(before.order)===JSON.stringify(after.order));
   scenes.push({width,pageLayout,collapsed,workspace,closed,expanded,targets,trial,folds,preserved});
  }

  const actions=await p.evaluate(()=>{
   const before=JSON.stringify(S),find=()=>[...document.querySelectorAll('#pane-timeline .ld.compact908')].find(e=>e.querySelector('[data-tl846-ref="WC09"]'));
   find().querySelector('[data-tl841-open]').click();const dialog=!!document.querySelector('#timeline841-dialog[open]');document.querySelector('[data-tl841-close]').click();const focusRestored=document.activeElement===find().querySelector('[data-tl841-open]');
   const button=find().querySelector('[data-tl841-print]'),expected={day:button.dataset.tl841Print,only:+button.dataset.tl841Only};
   return {dialog,focusRestored,expected,printTargetsSelectedDay:expected.day===state.day&&expected.only===+find().querySelector('.ld-n b').textContent-1,recordUnchanged:before===JSON.stringify(S),readOnly:capability()==='view'};
  });
  ok('progress dialog opens, closes and returns focus to its native action',actions.dialog&&actions.focusRestored,actions);
  ok('print control retains native load metadata; only actionability was trialled',actions.printTargetsSelectedDay,actions);
  ok('read-only review actions never change native records',actions.readOnly&&actions.recordUnchanged,actions);
  const final=await nativeIdentity(p);
  ok('native delivery order remains identical after all layout interactions',JSON.stringify(initial.order)===JSON.stringify(final.order),{before:initial.order,after:final.order});

  // Grant only an isolated browser capability, after capturing all native persistence paths.
  const version=await p.evaluate(()=>SYNC.db.readVersion821());
  await p.context().route('**/api/version',r=>r.request().method()==='GET'?r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({level:'edit',version})}):r.abort());
  await p.evaluate(()=>{
   const t=window.COMPACT911_PRACTICE={before:JSON.stringify(S),attempts:[],original:{capability,mayWrite,bump,save,doc:SYNC.db.doc,readonly:SYNC.readonly,level:SYNC.level}};
   save=()=>{t.attempts.push('save');return false;};bump=()=>{t.attempts.push('bump');return false;};
   SYNC.db.doc=()=>({set:async()=>{t.attempts.push('database set');},delete:async()=>{t.attempts.push('database delete');}});
   capability=()=> 'edit';mayWrite=()=>true;SYNC.readonly=false;SYNC.level='edit';render();
  });
  ok('granted practice edit state uses native unlocked controls',await p.evaluate(()=>capability()==='edit'&&!document.body.classList.contains('viewonly')));
  for(const width of [390,1440,1920,3840]){
   await p.setViewportSize({width,height:width===390?844:width===3840?2160:1100});await p.evaluate(()=>render());await settle(p);
   const card=p.locator('#pane-timeline .ld.compact908').filter({has:p.locator('[data-tl846-ref="WC09"]')}).first();
   for(const cls of ['crew883','traffic903']){
    const fold=card.locator('.timeline908-plans > details.'+cls).first();await fold.locator(':scope > summary').click();
    await fold.evaluate(e=>e.querySelectorAll('details').forEach(n=>{n.open=true;}));await settle(p);
    const contrast=await fieldContrast(fold);
    ok(width+'px: granted-edit '+cls+' native fields retain 4.5:1 contrast',contrast.some(f=>!f.disabled)&&contrast.every(f=>f.contrast>=4.5),contrast);
    const trial=await trialControls(card);ok(width+'px: granted-edit '+cls+' native actions remain reachable without invoking them',trial.every(r=>r.unblocked),trial);
    if(width===390||width===1440){await fold.scrollIntoViewIfNeeded();await settle(p);await p.screenshot({path:path.join(out,'edit-'+cls+'-'+width+'.png')});}
    await fold.locator(':scope > summary').click();
   }
  }
  const editIdentity=await nativeIdentity(p);
  ok('granted-edit controls also retain every native functional attribute',editIdentity.rows.length>0&&editIdentity.rows.every(r=>r.nativeControls&&r.nativeRefs),editIdentity);
  const isolated=await p.evaluate(()=>{
   const t=COMPACT911_PRACTICE,result={recordUnchanged:JSON.stringify(S)===t.before,attempts:t.attempts};
   capability=t.original.capability;mayWrite=t.original.mayWrite;bump=t.original.bump;save=t.original.save;SYNC.db.doc=t.original.doc;SYNC.readonly=t.original.readonly;SYNC.level=t.original.level;render();return result;
  });
  ok('isolated edit review changed no record and invoked no persistence path',isolated.recordUnchanged&&isolated.attempts.length===0,isolated);
  ok('no browser JavaScript errors',session.errors.length===0,session.errors);
  ok('no operational write attempts; all non-GETs were blocked',!(session.counts.denied||[]).some(r=>r.origin==='https://gc500-production.up.railway.app'),session.counts);
  ok('candidate bytes stayed unchanged during the suite',sourceHash===crypto.createHash('sha256').update(fs.readFileSync(pageFile)).digest('hex'));
 }catch(e){failure=e;ok('suite completed without an exception',false,{message:e.message,stack:e.stack});}
 finally{
  fs.writeFileSync(path.join(out,'result.json'),JSON.stringify({sourceHash,checks,scenes,errors:session?.errors||[],requests:session?.counts||{}},null,2));
  if(session)await session.browser.close();
  checks.forEach(c=>console.log((c.pass?'PASS ':'FAIL ')+c.name));console.log(checks.filter(c=>c.pass).length+'/'+checks.length);
  if(failure)console.error(failure);if(failure||checks.some(c=>!c.pass))process.exitCode=1;
 }
})();
