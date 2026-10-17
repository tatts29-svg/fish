/* Author: Andrew Fisher. Read-only candidate/live map navigation checks. */
'use strict';
const assert=require('node:assert/strict'),fs=require('fs');
const {open}=require('../../toolchain/harness/open_page');
(async()=>{
 const mobile=process.env.MOB==='1',out=process.env.OUT;let h;const checks=[];
 const check=(name,ok)=>{assert(ok,name);checks.push(name);console.log('PASS '+name);};
 try{
  h=await open({pageFile:process.env.PAGE,hash:'#map',mobile,W:mobile?390:1440,H:mobile?844:900,dpr:mobile?2:1});const p=h.page;
  await p.waitForFunction(()=>typeof EXP!=='undefined'&&EXP.frame?.contentWindow?.GC500Shape1060,null,{timeout:90000});
  const f=await(await p.$('#expFrame')).contentFrame();
  check('tile recovery loaded in the actual explorer frame',await f.evaluate(()=>pumpVT.toString().includes('Pyramid recovery v10.64')));
  await f.evaluate(()=>GC500Explorer.find('P37'));
  await f.waitForFunction(()=>gotoAnim887===0&&zAnim===0,null,{timeout:15000});await p.waitForTimeout(700);
  const before=await f.evaluate(()=>{const c=document.getElementById('xcard'),d=c.querySelector('details');if(d)d.open=true;c.scrollTop=20;return{code:selected.code,camera:JSON.stringify(camera),scroll:c.scrollTop,open:d?.open};});
  await f.evaluate(()=>{complete897Pull();complete897Pull();GC500Shape1060.pull();});
  const after=await f.evaluate(()=>{const c=document.getElementById('xcard');return{code:selected.code,camera:JSON.stringify(camera),scroll:c.scrollTop,open:c.querySelector('details')?.open};});
  check('background refresh preserves selection, camera and open card',JSON.stringify(before)===JSON.stringify(after));
  const button=f.locator('#xcard [data-xprog]');await button.scrollIntoViewIfNeeded();
  check('card action can be reached by scrolling',await button.isVisible()&&await button.evaluate(b=>{const r=b.getBoundingClientRect(),c=b.closest('#xcard').getBoundingClientRect();return r.top>=c.top&&r.bottom<=c.bottom+1;}));
  await f.locator('#xcard [data-xclose]').click();check('card closes with its close button',await f.locator('#xcard').isHidden());
  for(const mode of ['satellite','hybrid','original']){await f.locator('.modes [data-mode="'+mode+'"]').click();await p.waitForTimeout(400);check('mode '+mode+' opens',await f.evaluate(m=>mode===m,mode));}
  const camera=await f.evaluate(()=>JSON.stringify(camera));await p.evaluate(()=>go('plant'));await p.waitForTimeout(400);await p.evaluate(()=>go('map'));await p.waitForTimeout(600);
  check('leaving and returning preserves the map camera',await f.evaluate(c=>JSON.stringify(camera)===c,camera));
  check('shape layer remains attached after navigation',await f.evaluate(()=>GC500Shape1060.state.available&&drawMarks.__shape1060&&GC500Shape1060.state.failed===0));
  check('no page errors',h.errors.length===0);check('no record writes attempted',h.counts.blocked===0);
  if(out){await p.locator('#expFrame').scrollIntoViewIfNeeded();await p.screenshot({path:out+'.png'});fs.writeFileSync(out+'.json',JSON.stringify({author:'Andrew Fisher',mobile,checks,errors:h.errors,counts:h.counts},null,2));}
 }finally{if(h)await h.browser.close();}
})().catch(e=>{console.error(e.stack);process.exitCode=1;});
