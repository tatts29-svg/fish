/* Author: Andrew Fisher. Actual candidate/live map functions, all record writes blocked. */
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
  check('current camera and hidden-equipment fixes loaded',await f.evaluate(()=>zoomBy.toString().includes('camera1065:')&&GC500EquipmentBridge1027.active.toString().includes('shown')));
  await f.evaluate(()=>{fit(true,false);});
  const camera=await f.evaluate(async()=>{
   await GC500Explorer.find('P33');const flying=!!gotoAnim887;zoomBy(1.2);const first=zGoal;zoomBy(1.2);
   return{flying,goto:!!gotoAnim887,zoom:!!zAnim,expected:clamp(first*1.2,MIN_Z,MAX_Z),goal:zGoal};
  });
  check('manual zoom takes control of a reference flight',camera.flying&&!camera.goto&&camera.zoom);
  check('repeated wheel input keeps its accumulated target',Math.abs(camera.goal-camera.expected)<1e-9);
  await f.waitForFunction(()=>!gotoAnim887&&!zAnim,null,{timeout:15000});
  check('manual zoom lands at the requested target',await f.evaluate(z=>Math.abs(camera.z-z)<1e-9,camera.expected));
  for(const mode of ['satellite','hybrid','original']){
   await f.locator('.modes [data-mode="'+mode+'"]').click();await p.waitForTimeout(200);
   check('mode '+mode+' opens',await f.evaluate(m=>mode===m,mode));
  }
  await f.evaluate(()=>GC500Explorer.find('P37'));
  await f.waitForFunction(()=>!gotoAnim887&&!zAnim,null,{timeout:15000});
  await p.waitForTimeout(500);
  const before=await f.evaluate(()=>{const c=document.getElementById('xcard'),d=c.querySelector('details');if(d)d.open=true;c.scrollTop=20;return{code:selected.code,camera:JSON.stringify(camera),scroll:c.scrollTop,open:d?.open};});
  await f.evaluate(()=>{complete897Pull();GC500Shape1060.pull();});
  check('refresh preserves selected map, open card and scroll',JSON.stringify(before)===JSON.stringify(await f.evaluate(()=>{const c=document.getElementById('xcard');return{code:selected.code,camera:JSON.stringify(camera),scroll:c.scrollTop,open:c.querySelector('details')?.open};})));
  await f.locator('#xcard [data-xclose]').click();
  check('map card close works',await f.locator('#xcard').isHidden());
  await f.locator('.modes [data-mode="3d"]').click();
  check('visible 3D equipment is active',await f.evaluate(()=>GC500EquipmentBridge1027.active()));
  await p.evaluate(()=>go('plant'));await p.waitForTimeout(200);
  check('leaving map suspends hidden 3D equipment work',await f.evaluate(()=>!GC500EquipmentBridge1027.active()));
  await p.evaluate(()=>go('map'));await p.waitForTimeout(300);
  check('returning resumes selected 3D mode',await f.evaluate(()=>GC500Explorer.is3d()&&GC500EquipmentBridge1027.active()));
  await f.locator('.modes [data-mode="original"]').click();
  check('return to plan suspends 3D equipment work',await f.evaluate(()=>!GC500EquipmentBridge1027.active()));
  check('shape layer stays mounted after modes and navigation',await f.evaluate(()=>GC500Shape1060.state.available&&drawMarks.__shape1060&&GC500Shape1060.state.failed===0));
  check('no page errors',h.errors.length===0);check('no record writes',h.counts.blocked===0);
  if(out){await p.locator('#expFrame').scrollIntoViewIfNeeded();await p.screenshot({path:out+'.png'});fs.writeFileSync(out+'.json',JSON.stringify({author:'Andrew Fisher',mobile,checks,errors:h.errors,counts:h.counts},null,2));}
 }finally{if(h)await h.browser.close();}
})().catch(e=>{console.error(e.stack);process.exitCode=1;});
