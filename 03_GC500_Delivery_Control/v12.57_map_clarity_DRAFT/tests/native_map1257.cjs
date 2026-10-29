/* Author: Andrew Fisher. Read-only real Map explorer controls and preserved native record. */
'use strict';
const fs=require('fs'),path=require('path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const {openCandidate}=require('../../v12.43.1_offsite_pictures_LIVE/tests/native_harness.cjs');
const out=process.env.OUT;assert(out,'Private OUT is required');fs.mkdirSync(out,{recursive:true});
const mobile=process.env.MOB==='1',tag=mobile?'phone':'desktop';process.env.INITIAL_HASH='#questions';
const oracle=process.env.EXPECTED_OFFSHEET?JSON.parse(fs.readFileSync(process.env.EXPECTED_OFFSHEET,'utf8')):null;assert(oracle,'Independent private EXPECTED_OFFSHEET oracle is required');
const checks=[];
function check(name,condition,detail){checks.push({name,pass:!!condition,detail});fs.writeFileSync(path.join(out,tag+'-checkpoint.json'),JSON.stringify({at:new Date().toISOString(),checks},null,2));console.log((condition?'PASS ':'FAIL ')+name);assert(condition,name);}
(async()=>{const h=await openCandidate(),p=h.page;let frame;try{
 check('independent geometry oracle uses the tested record',oracle.stateSha256===h.baseline.stateSha256);
 const cold=await p.evaluate(()=>holdAssets(()=>({frameLoaded:!!document.getElementById('expFrame')?.contentWindow?.MapUnits1147,openState:QH_OPEN,rows:questionsList().filter(q=>q.id==='map-offsheet1257'),keys:MapClarity1257.offSheet().map(r=>r.key),questionNodes:document.querySelectorAll('#pane-questions [data-question-id="map-offsheet1257"]').length}))); 
 check('location review exists before explorer frame initialisation',!cold.frameLoaded&&cold.rows.length===1&&cold.rows[0].st===cold.openState&&cold.questionNodes===1,cold);
 assert.deepEqual(cold.keys,oracle.refs,'Cold Questions independent off-drawing oracle');
 const question=p.locator('#pane-questions li[data-question-id="map-offsheet1257"]');assert.equal(await question.count(),1);
 for(const details of await question.locator('xpath=ancestor::details[not(@open)]').all())await details.locator(':scope > summary').click();
 await question.scrollIntoViewIfNeeded();check('cold Questions row is actually visible before the explorer opens',await question.isVisible());
 assert.deepEqual(await question.locator('.qrows > li').allTextContents(),oracle.refs.map(key=>key+' · pinned off the drawing'),'Actual Questions rows match the independent recorded-pin oracle');
 check('actual Questions explains that recorded locations stay unchanged',/No location has been changed/.test(await question.locator('.qneed').innerText()));
 await question.screenshot({path:path.join(out,tag+'-cold-question.png')});
 const renderMs=await p.evaluate(()=>{const start=performance.now();renderQuestions();return performance.now()-start;});check('native held Questions redraw remains available',Number.isFinite(renderMs),{renderMs,benchmark:false});

 check('cold Questions names the independent recorded references',cold.rows[0].rows.length===oracle.refs.length&&oracle.refs.every(key=>cold.rows[0].rows.some(s=>s.startsWith(key+' · '))));
 const repeats=await p.evaluate(()=>holdAssets(()=>[questionsList(),questionsList(),questionsList()].map(q=>q.filter(x=>x.id==='map-offsheet1257').length))); check('location question is not duplicated by repeated reads',repeats.every(n=>n===1));
 await p.evaluate(()=>location.hash='#sheet/__explorer');
 await p.waitForFunction(()=>document.getElementById('expFrame')?.contentWindow?.GC500MapClarity1257,null,{timeout:90000});
 frame=p.frames().find(f=>f.url().includes('/explorer/index.html'));assert(frame,'Native explorer frame');
 await frame.waitForFunction(()=>MapUnits1147.state.ready);await p.locator('#expcard').scrollIntoViewIfNeeded();await p.waitForTimeout(900);
 const placesBefore=await frame.evaluate(()=>{window.__map1257PlaceIdentity=ITEMS.map(it=>({it,places:it.places,values:JSON.stringify(it.places)}));return ITEMS.length;});
 const docs=()=>p.evaluate(()=>JSON.stringify(Object.fromEntries(Object.keys(SYNC_COLLS).map(k=>[k,toDocs(k)]))));
 const before=await docs();
 const pixels=()=>frame.evaluate(()=>{const c=document.querySelector('#offsite1225');const d=c.getContext('2d').getImageData(0,0,c.width,c.height).data;let painted=0;for(let i=3;i<d.length;i+=4)if(d[i])painted++;return painted;});
 const state=()=>frame.evaluate(()=>({clarity:GC500MapClarity1257.state,areas:MapUnits1147.state}));
 const tools=async open=>{if(!mobile)return;const b=p.locator('[data-map1196-tools]');if(await b.getAttribute('aria-expanded')!==String(open))await b.click();await p.waitForTimeout(200);};
 const ensureVisible=async locator=>{await locator.scrollIntoViewIfNeeded();const q=await locator.evaluate(e=>{const r=e.getBoundingClientRect(),hit=document.elementFromPoint(r.left+r.width/2,r.top+r.height/2);return {x:r.x,y:r.y,w:r.width,h:r.height,visible:r.width>0&&r.height>0&&r.left>=0&&r.right<=innerWidth&&r.top>=0&&r.bottom<=innerHeight,hit:hit===e||e.contains(hit)};});check('real control is visible and hit-testable',q.visible&&q.hit,q);};
 let s=await state();check('new view starts with rings and servicing areas off',s.clarity.showLeft===false&&s.areas.filter==='off'&&s.areas.shown.length===0,s);
 check('default ring canvas is empty',await pixels()===0);
 await p.screenshot({path:path.join(out,tag+'-after-default.png')});
 await p.locator('#expcard').screenshot({path:path.join(out,tag+'-after-default-card.png')});
 await tools(true);
 const sel=p.locator('#map1147-controls select');await ensureVisible(sel);
 const options=await sel.locator('option').evaluateAll(os=>os.map(o=>({value:o.value,text:o.textContent.trim()})));
 assert.deepEqual(options.map(o=>o.value),['off','',...Array.from({length:13},(_,i)=>String(i+1))]);
 check('plain servicing-area options have only Off, All and Areas 1–13',options[0].text==='Off'&&options[1].text==='All areas'&&options.slice(2).every((o,i)=>new RegExp('^Area '+(i+1)+'(?:$| )').test(o.text)),options);
 const hint=p.locator('#map1147-controls > small');check('servicing-area hint is visibly available in Map tools',await hint.isVisible());
 const labels=await p.locator('#map1147-controls').innerText();check('servicing area control explains outlines without silent toilet coupling',/Servicing areas/.test(labels)&&!/With the toilets|belong to the toilets|What the outlines mean/.test(labels));
 // Optional extra modes and real map navigation are tested below once the toggle is exercised.
 const left=p.locator('#map1257-left');await ensureVisible(left);await left.click();await tools(false);await p.locator('#expFrame').scrollIntoViewIfNeeded();
 await frame.waitForFunction(()=>GC500MapClarity1257.state.showLeft===true);await p.waitForTimeout(500);
 check('explicit control enables actual ring canvas',await pixels()>0);
 const key=frame.locator('#map1257-key');check('ring key is visible while rings are shown',await key.isVisible());
 const keyText=await key.innerText();check('ring key explains full, partial and review',/has left site/i.test(keyText)&&/part left/i.test(keyText)&&/needs review/i.test(keyText),keyText);
 await p.screenshot({path:path.join(out,tag+'-after-left-site.png')});
 await p.setViewportSize(mobile?{width:390,height:760}:{width:1280,height:900});await p.waitForTimeout(400);await p.locator('#expFrame').scrollIntoViewIfNeeded();await p.waitForTimeout(250);check('ring selection survives real viewport resize',(await state()).clarity.showLeft&&await pixels()>0);
 await p.setViewportSize(mobile?{width:390,height:844}:{width:1440,height:1000});await p.waitForTimeout(400);
 const resizeControl={checked:await left.isChecked(),state:(await state()).clarity.showLeft};check('ring control follows the selection after viewport restoration',resizeControl.checked===resizeControl.state,resizeControl);

 await frame.locator('button[data-mode="satellite"]').click();await frame.waitForFunction(()=>GC500MapClarity1257.state.planVisible===false);
 await frame.evaluate(()=>{GC500Search1210.search('vms');GC500Search1210.showAll();});await p.waitForTimeout(1200);
 const offVms=oracle.frameCodes.filter(code=>/^VMS /.test(code));assert(offVms.length,'Independent oracle has outside-sheet VMS fixtures');
 const satelliteSelect=await frame.evaluate(code=>GC500Search1210.select(code,0),offVms[0]);
 try{await frame.waitForFunction(code=>GC500VmsIcons1211.points.some(p=>p.code===code),offVms[0],{timeout:15000});}catch(e){fs.writeFileSync(path.join(out,tag+'-satellite-diagnostic.json'),JSON.stringify({satelliteSelect,frame:await frame.evaluate(code=>({code,mode,plan:GC500MapClarity1257.state,selected:selected?.code,view:currentView(),camera,fixture:ITEMS.find(it=>it.code===code),points:GC500VmsIcons1211.points,search:GC500Search1210.state,screen:[sw,sh],buttons:[...document.querySelectorAll('button[data-mode]')].map(b=>({mode:b.dataset.mode,pressed:b.getAttribute('aria-pressed')}))}),offVms[0])},null,2));throw e;}

 check('actual Satellite control retains a known outside-sheet VMS marker',await frame.evaluate(code=>GC500VmsIcons1211.points.some(p=>p.code===code),offVms[0]));
 for(const which of ['hybrid','original']){
  await frame.locator('button[data-mode="'+which+'"]').click();await frame.waitForFunction(()=>GC500MapClarity1257.state.planVisible===true);await p.waitForTimeout(350);
  const plotted=await frame.evaluate(()=>GC500VmsIcons1211.points.map(p=>p.code));check('actual '+which+' mode suppresses outside-sheet VMS markers',!plotted.some(code=>offVms.includes(code)),{plotted:plotted.length});
  const nativeHit=await frame.evaluate(code=>{const it=ITEMS.find(it=>it.code===code&&it.places.length);if(!it)return {fixture:false};const b=it.places[0],g=toGeo((b[0]+b[2])/2,(b[1]+b[3])/2),v=currentView(),q=applyM(sheetToDevice(v.scale,sw,sh),g.x,g.y),rows=ITEMS.map(it=>({it,places:it.places,values:JSON.stringify(it.places)}));drawMarks(v);const item=itemAt887(q.x,q.y),mark=markAt(q.x,q.y);return {fixture:true,outside:!GC500MapClarity1257.onSheet(b),itemBlocked:item?.it?.code!==code,markBlocked:mark?.it?.code!==code,preserved:rows.every(({it,places,values})=>it.places===places&&JSON.stringify(it.places)===values)};},offVms[0]);
  check('actual '+which+' draw and hit tests suppress the outside fixture without changing current arrays',nativeHit.fixture&&nativeHit.outside&&nativeHit.itemBlocked&&nativeHit.markBlocked&&nativeHit.preserved,nativeHit);
 }
 await frame.locator('button[data-mode="hybrid"]').click();await frame.evaluate(()=>{GC500Search1210.search('');clearSelection813();});await frame.getByRole('button',{name:'Fit',exact:true}).click();await p.waitForTimeout(700);
 await frame.locator('button[data-mode="3d"]').click();await frame.waitForFunction(()=>GC500Explorer.is3d()===true&&document.body.classList.contains('in3d'),null,{timeout:15000});
 check('actual 3D control opens its native pane and hides plan overlays',await frame.locator('#model3d').isVisible()&&!await frame.locator('#offsite1225').isVisible()&&!await key.isVisible());
 await frame.locator('button[data-mode="hybrid"]').click();await frame.waitForFunction(()=>GC500Explorer.is3d()===false&&!document.body.classList.contains('in3d'));
 check('actual 3D exit retains chosen ring visibility',(await state()).clarity.showLeft&&await key.isVisible());
 await frame.locator('#fenceMode').click();await frame.waitForFunction(()=>document.body.classList.contains('fencing-map'),null,{timeout:10000});
 check('actual Fencing control opens its layer and hides plan overlays',!await frame.locator('#offsite1225').isVisible()&&!await key.isVisible());
 await frame.locator('#fenceMode').click();await frame.waitForFunction(()=>!document.body.classList.contains('fencing-map'));
 check('actual Fencing exit retains chosen ring visibility',(await state()).clarity.showLeft&&await key.isVisible());
 const synchronous=await frame.evaluate(()=>{const rows=ITEMS.map(it=>({it,places:it.places,values:JSON.stringify(it.places)}));drawMarks(currentView());return rows.every(({it,places,values})=>it.places===places&&JSON.stringify(it.places)===values);});check('current native draw restores every item place array and value',synchronous);

 await tools(true);await ensureVisible(left);await left.click();await tools(false);await p.locator('#expFrame').scrollIntoViewIfNeeded();await frame.waitForFunction(()=>{const c=document.querySelector('#offsite1225'),a=c.getContext('2d').getImageData(0,0,c.width,c.height).data;return !GC500MapClarity1257.state.showLeft&&!a.some((v,i)=>i%4===3&&v)&&document.querySelector('#map1257-key').hidden;},null,{timeout:5000});
 s=await state();const cleared={showLeft:s.clarity.showLeft,pixels:await pixels(),keyVisible:await key.isVisible(),checked:await left.isChecked()};check('explicit off clears rings and key',cleared.showLeft===false&&cleared.pixels===0&&!cleared.keyVisible,cleared);
 const toilets=frame.locator('button.chip[data-cat]').filter({hasText:/^Toilets/});assert.equal(await toilets.count(),1);
 await toilets.evaluate(e=>e.click());await p.waitForTimeout(500);s=await state();check('Toilets filter cannot turn areas on',s.areas.filter==='off'&&s.areas.shown.length===0);
 await toilets.evaluate(e=>e.click());
 await tools(true);
 for(let i=1;i<=13;i++){
   await sel.selectOption(String(i));await frame.waitForFunction(id=>MapUnits1147.state.filter===id&&MapUnits1147.state.shown.length===1&&String(MapUnits1147.state.shown[0])===id,String(i),{timeout:5000});
   const a=await frame.evaluate(()=>MapUnits1147.state);check('Area '+i+' selects only its outline',a.filter===String(i)&&a.shown.length===1&&String(a.shown[0])===String(i),{filter:a.filter,shown:a.shown});
 }
 await sel.selectOption('1');await frame.waitForFunction(()=>MapUnits1147.state.filter==='1'&&MapUnits1147.state.shown.length===1&&String(MapUnits1147.state.shown[0])==='1',null,{timeout:5000});
 await toilets.evaluate(e=>e.click());await p.waitForTimeout(500);await frame.evaluate(()=>drawMarks(currentView()));s=await state();check('chosen area stays selected when Toilets filter changes',s.areas.filter==='1'&&s.areas.shown.every(id=>String(id)==='1'),{filter:s.areas.filter,shown:s.areas.shown,viewportCullingAllowed:true});await toilets.evaluate(e=>e.click());
 await sel.selectOption('1');await frame.waitForFunction(()=>MapUnits1147.state.filter==='1'&&MapUnits1147.state.shown.length===1&&String(MapUnits1147.state.shown[0])==='1',null,{timeout:5000});check('chosen area still draws after returning from category camera fit',true);

 await sel.selectOption('');await p.waitForTimeout(350);s=await state();check('All areas is explicit and draws areas',s.areas.filter===''&&s.areas.shown.length>0);
 await sel.selectOption('off');await p.waitForTimeout(250);s=await state();check('Off clears all servicing outlines',s.areas.filter==='off'&&s.areas.shown.length===0);
 const expectedSet=oracle.refs.slice().sort((a,b)=>a.localeCompare(b,undefined,{numeric:true}));assert.deepEqual((await state()).clarity.offSheet,expectedSet,'Map list uses independent recorded-pin oracle');
 const offsheet=await p.locator('#map1257-offsheet').innerText();s=await state();check('off-drawing locations are listed, not silently discarded',s.clarity.offSheet.length>0&&s.clarity.offSheet.every(code=>offsheet.includes(code)),{listed:s.clarity.offSheet});
 await p.screenshot({path:path.join(out,tag+'-after-tools.png')});
 await tools(false);
 const projection=await frame.evaluate(()=>GC500MapClarity1257.projectedOffSheet().map(r=>r.code));assert.deepEqual([...new Set(projection)].sort(),oracle.frameCodes.slice().sort(),'Native outside-bbox set matches independent baseline');
 const rejected=await frame.evaluate(code=>{const before=JSON.stringify(currentView()),result=selectCode(code);return {blocked:result===false,viewUnchanged:JSON.stringify(currentView())===before};},oracle.frameCodes[0]);check('off-drawing native selection cannot move the plan to a blank location',rejected.blocked&&rejected.viewUnchanged);
 const bounds=await frame.evaluate(()=>{const a=GC500MapClarity1257,{width:w,height:h}=a.bounds;return [[true,[0,0,0,0]],[true,[w,h,w,h]],[true,[-1,-1,1,1]],[false,[-1,0,-1,0]],[false,[0,-1,0,-1]],[false,[w+1,0,w+1,0]],[false,[0,h+1,0,h+1]],[false,[-2,-2,0,0]],[false,[0,0,Infinity,1]],[false,[0,0,NaN,1]],[false,['0',0,0,0]],[false,[2,2,1,1]],[false,[]],[false,null]].map(([expected,box])=>({expected,actual:a.onSheet(box)}));});
 for(let i=0;i<bounds.length;i++)check('native sheet boundary fixture '+(i+1),bounds[i].expected===bounds[i].actual);
 const identities=await frame.evaluate(()=>__map1257PlaceIdentity.every(({it,places,values})=>it.places===places&&JSON.stringify(it.places)===values));check('native item places preserve identity and values across controls',identities,{items:placesBefore});
 const after=await docs();check('all native documents remain unchanged',before===after);
 check('zero runtime errors',h.errors.length===0,h.errors);check('zero console errors',h.consoleErrors.length===0,h.consoleErrors);check('zero operational writes',h.counts.blocked===0,h.counts);
 console.log(JSON.stringify({author:'Andrew Fisher',tag,passed:checks.length,pageSha256:h.baseline.pageSha256,stateSha256:h.baseline.stateSha256}));
 }finally{fs.writeFileSync(path.join(out,tag+'-native-map.json'),JSON.stringify({author:'Andrew Fisher',tag,baseline:h.baseline,checks,errors:h.errors,consoleErrors:h.consoleErrors,counts:h.counts},null,2));await h.browser.close();}
})().catch(e=>{fs.writeFileSync(path.join(out,tag+'-fatal.json'),JSON.stringify({at:new Date().toISOString(),error:String(e.stack),checks},null,2));console.error(e.stack);process.exitCode=1;});
