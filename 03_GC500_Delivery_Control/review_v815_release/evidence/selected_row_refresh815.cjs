// Author: Andrew Fisher. Read-only reproduction of selected-document redraw loss.
// PAGE and OUT must be explicit; OUT is private and outside the repository.
'use strict';
const fs = require('node:fs'), path = require('node:path'), assert = require('node:assert/strict'), crypto = require('node:crypto');
const {open} = require('../../toolchain/harness/open_page');
const {PAGE, OUT} = process.env, fixed = process.env.EXPECT === 'fixed';
assert(PAGE && OUT && path.isAbsolute(PAGE) && path.isAbsolute(OUT));
const repo = path.resolve(__dirname, '../../..');
assert(path.relative(repo, OUT).startsWith('..' + path.sep));
fs.mkdirSync(OUT, {recursive:true});
const report = {author:'Andrew Fisher', expectation:fixed?'corrected behaviour':'defect reproduction', candidateSha256:crypto.createHash('sha256').update(fs.readFileSync(PAGE)).digest('hex'), devices:[]};
(async()=>{
 for(const mobile of [false,true]){
  const h = await open({pageFile:PAGE,hash:'#docs',W:mobile?390:1440,H:mobile?844:900,mobile,dpr:mobile?2:1}), p=h.page;
  const r={device:mobile?'phone':'desktop',states:[]}; report.devices.push(r);
  let consoleErrors=0, attemptedWrites=0;
  p.on('console',m=>{if(m.type()==='error')consoleErrors++});
  p.on('request',q=>{if(!['GET','HEAD','OPTIONS'].includes(q.method()) && q.url().includes('gc500-production.up.railway.app'))attemptedWrites++});
  try{
   await p.waitForFunction(()=>DOCS.state==='ready' && SYNC.level==='view',null,{timeout:240000});
   await p.emulateMedia({reducedMotion:'reduce'});
   await p.evaluate(()=>{
    window.__selectionTrace815=[];
    for(const name of ['finderPick','renderDocs','docsRedraw','selRow815','paintDocs815']){
     const original=window[name];
     window[name]=function(...args){
      const capture=phase=>window.__selectionTrace815.push({name,phase,at:Math.round(performance.now()),pending:!!state.docSel815,marked:!!document.querySelector('#docBody815 [aria-current]'),activeTag:document.activeElement?.tagName});
      capture('before');const result=original.apply(this,args);capture('after');return result;
     };
    }
   });
   const target=await p.evaluate(()=>{const d=holdAssets(()=>docCollection()).items.find(x=>x.availability==='missing'&&/SWMS/.test(x.id));return{id:d.id,title:d.title}});
   if(!await p.locator('#q').isVisible())await p.locator('#searchBtn').click();
   await p.locator('#q').fill(target.title);
   await p.waitForFunction(id=>FINDER.list.some(x=>x.kind==='doc'&&x.id===id),target.id);
   const i=await p.evaluate(id=>FINDER.list.findIndex(x=>x.kind==='doc'&&x.id===id),target.id);
   await p.locator('#finder [data-fi="'+i+'"]').click();
   const capture=async(label)=>{r.states.push({label,...await p.evaluate(id=>{const row=[...document.querySelectorAll('#docBody815 [data-doc815]')].find(x=>x.dataset.doc815===id);const box=row?.getBoundingClientRect();return{rowExists:!!row,marked:row?.getAttribute('aria-current')==='true',focused:document.activeElement===row,inView:!!box&&box.top>=0&&box.bottom<=innerHeight,selectionPending:!!state.docSel815}},target.id)});};
   await p.waitForTimeout(350);await capture('after actual selection');
   await p.waitForTimeout(700);await capture('after 1050ms');
   await p.evaluate(()=>docsRedraw());await p.waitForTimeout(150);await capture('after native docsRedraw');
   if(fixed){
    await p.evaluate(()=>paintDocs815());await p.waitForTimeout(150);await capture('after partial repaint');
    r.checks=r.states.map(s=>({name:s.label+' preserves selected row and focus',pass:s.rowExists&&s.marked&&s.focused&&s.inView}));
    await p.locator('#docQ815').focus();await p.evaluate(()=>docsRedraw());await p.waitForTimeout(150);
    r.checks.push({name:'Full redraw leaves document search focus alone',pass:await p.evaluate(()=>document.activeElement?.id==='docQ815')});
    await p.evaluate(()=>paintDocs815());await p.waitForTimeout(150);
    r.checks.push({name:'Partial redraw leaves document search focus alone',pass:await p.evaluate(()=>document.activeElement?.id==='docQ815')});
    await p.locator('#docQ815').fill('SWMS');await p.waitForTimeout(350);
    r.checks.push({name:'A new typed query clears the previous row selection without losing search focus',pass:await p.evaluate(()=>document.activeElement?.id==='docQ815'&&!document.querySelector('#docBody815 [aria-current]'))});
    if(!await p.locator('#q').isVisible())await p.locator('#searchBtn').click();
    await p.locator('#q').fill(target.title);
    await p.waitForFunction(id=>FINDER.list.some(x=>x.kind==='doc'&&x.id===id),target.id);
    const j=await p.evaluate(id=>FINDER.list.findIndex(x=>x.kind==='doc'&&x.id===id),target.id);
    await p.locator('#finder [data-fi="'+j+'"]').click();await p.waitForTimeout(1050);
    r.checks.push({name:'A later header selection reacquires the chosen row',pass:await p.evaluate(id=>{const row=document.querySelector('#docBody815 [aria-current]');return row?.dataset.doc815===id&&document.activeElement===row},target.id)});
    await p.locator('#docTiles815 [data-tile815="transport"]').focus();await p.keyboard.press('Enter');await p.waitForTimeout(350);
    r.checks.push({name:'Choosing another category clears the old selection and keeps category focus',pass:await p.evaluate(()=>state.docTile815==='transport'&&!document.querySelector('#docBody815 [aria-current]')&&document.activeElement?.dataset.tile815==='transport')});
    await p.evaluate(()=>docsRedraw());await p.waitForTimeout(150);
    r.checks.push({name:'Later refresh does not resurrect an old selected row',pass:await p.evaluate(()=>!document.querySelector('#docBody815 [aria-current]')&&document.activeElement?.dataset.tile815==='transport')});
   }
   await p.screenshot({path:path.join(OUT,r.device+'-after-redraw.png')});
   r.trace=await p.evaluate(()=>window.__selectionTrace815);
   r.reproduced=r.states.some(x=>x.rowExists&&!x.marked&&!x.focused);
  } finally {r.pageErrors=h.errors.length;r.consoleErrors=consoleErrors;r.attemptedWrites=attemptedWrites;await h.browser.close();}
 }
 fs.writeFileSync(path.join(OUT,'selected-row-refresh.json'),JSON.stringify(report,null,2)+'\n');
 console.log(JSON.stringify(report));
 process.exitCode=report.devices.every(x=>(fixed?x.checks.every(c=>c.pass):x.reproduced)&&x.pageErrors===0&&x.consoleErrors===0&&x.attemptedWrites===0)?0:1;
})().catch(e=>{console.error(e.message);process.exitCode=1});
