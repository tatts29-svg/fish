// Author: Andrew Fisher. Synthetic servicing records; shared harness blocks every record write.
const assert=require('node:assert/strict'),fs=require('fs'),path=require('path');
const {open}=require('../../toolchain/harness/open_page');
const pageFile=process.env.PAGE, evidence=process.env.EVIDENCE;
function equalSource(base,candidate,start,end){let take=s=>{let i=s.indexOf(start);assert(i>=0);return s.slice(i,s.indexOf(end,i)+end.length);};assert.equal(take(base),take(candidate));}
(async()=>{
 let checks=0;
 const yes=(v)=>{assert(v);checks++;};
 if(pageFile&&process.env.BASE){let b=fs.readFileSync(process.env.BASE,'utf8'),c=fs.readFileSync(pageFile,'utf8');
  equalSource(b,c,'var SvcState =','module.exports = SvcState;');checks++;
  equalSource(b,c,'var SVC1067_CARD=',';\n');checks++;
  equalSource(b,c,'var SVC1099_MAP_DATA=',';\n');checks++;
 }
 const mobile=!!process.env.MOB,s=await open({pageFile,W:mobile?390:1440,H:mobile?844:1000,mobile,dpr:mobile?2:1}),p=s.page;
 try{
  await p.waitForFunction(()=>typeof SvcShare1164!=='undefined'&&typeof SvcMap1099!=='undefined');
  const cons=[];p.on('console',m=>{if(m.type()==='error')cons.push(m.text());});
  const result=await p.evaluate(()=>{
   var checks=0;function check(ok,msg){if(!ok)throw new Error(msg);checks++;}
   var day='2026-10-23',now=Date.parse('2026-10-23T14:00:00Z');
   var D={days:[{id:day,label:'Fri 23',to:'Sat 24',plan:'night'},{id:'2026-10-25',label:'Sun 25',to:'Mon 26',plan:'final'}],
    tasks:{pump:'Pump out',clean:'Clean & restock',refill:'Water checked / refilled',lockup:'Pump out, clean & lock'},extras:[],
    plans:{fwf:{night:['pump','clean','refill'],final:['lockup']},block:{night:['clean'],final:['clean']},tank:{night:['pump'],final:['pump']}},
    areas:[{n:1,name:'Example north area',refs:[{ref:'TEST-A',lines:[{id:'a',label:'Flush toilets',qty:3,kind:'fwf'}]},{ref:'TEST-B',lines:[{id:'b',label:'Toilet block',qty:1,kind:'block'},{id:'t',label:'Waste tank',qty:1,kind:'tank'}]}]},
    {n:2,name:'Example south area',refs:[{ref:'TEST-C',lines:[{id:'c',label:'Other toilet',qty:1,kind:'fwf'}]}]}]};
   var G=Object.assign({},SVC1099_MAP_DATA,{refs:{'TEST-A':{title:'Example gate',pin:[-27.98,153.42],lines:{a:{label:'Flush toilets',point:{x:620,y:550},pin:[-27.98,153.42]}}},'TEST-B':{title:'Example path',pin:[-27.981,153.421],lines:{b:{label:'Toilet block',point:{x:730,y:550}},t:{label:'Waste tank',point:{x:740,y:580}}}},'TEST-C':{title:'Other area',lines:{c:{label:'Other toilet'}}}}});
   var tick=(id,line,task,d,local)=>({id,line,task,day:d||day,done:true,at:'2026-10-23T13:00:00Z',local:!!local});
   var M={D,S:SvcState,geometry:G,day,now,lastRead:now,events:[tick('saved','a','clean'),tick('old','a','refill','2026-10-22'),tick('pending','a','pump',day,true)],context1164:'synthetic',test1164:true};
   var snap=SvcShare1164.snapshot(M,G,{kind:'ref',id:'TEST-A'});
   check(snap.outstanding.length===1,'one selected location');check(snap.outstanding[0].rows[0].qty===3,'source quantities');
   check(snap.outstanding[0].rows[0].tasks.map(t=>t.label).join('|')==='Pump out|Water checked / refilled','separate roles; saved clean excluded; prior night retained');
   check(snap.outstanding[0].rows[0].tasks[0].pending,'pending is still unfinished');
   check(snap.test,'practice mode labelled');check(snap.day===day&&snap.prepared.includes('2026-10-24'),'service night distinct from calendar date');
   var all=SvcShare1164.snapshot(M,G,{kind:'area',id:1});check(all.refs.length===2&&all.outstanding.length===2,'selected area only');
   check(all.outstanding[1].rows[0].tasks.length===1&&all.outstanding[1].rows[0].tasks[0].label==='Clean & restock','block task rules');
   check(all.outstanding[1].rows[1].tasks[0].label==='Pump out','tank task rules');
   check(all.outstanding[1].points.length===2,'all equipment positions');
   var txt=SvcShare1164.shareText(all);check(txt.includes('destination=-27.98%2C153.42')&&txt.includes('Qty 3'),'navigation from actual pin and quantities');
   check(!txt.includes('synthetic')&&!txt.includes('saved\"')&&!txt.includes('contact'),'no credentials or event identifiers');
   var missing=SvcShare1164.snapshot(M,G,{kind:'ref',id:'TEST-C'});check(missing.refs[0].missing&&missing.refs[0].nav.length===0,'honest missing location');
   var undone=Object.assign({},M,{events:[tick('done','a','clean'),{id:'undo',line:'a',task:'clean',day,done:false,undoes:['done']}]});
   check(SvcShare1164.snapshot(undone,G,{kind:'ref',id:'TEST-A'}).refs[0].rows[0].tasks.length===3,'undo restores work');
   undone.events=[Object.assign(tick('void','a','clean'),{voided:true})];check(SvcShare1164.snapshot(undone,G,{kind:'ref',id:'TEST-A'}).refs[0].rows[0].tasks.length===3,'void restores work');
   var complete=Object.assign({},M,{events:['clean','pump','refill'].map(t=>tick(t,'a',t))});check(SvcShare1164.snapshot(complete,G,{kind:'ref',id:'TEST-A'}).outstanding.length===0,'all done no invented work');
   var final=SvcShare1164.snapshot(Object.assign({},M,{day:'2026-10-25'}),G,{kind:'ref',id:'TEST-A'});check(final.refs[0].rows[0].tasks.map(t=>t.label).join('|')==='Pump out, clean & lock','final-night plan');
   check(SvcShare1164.snapshot(Object.assign({},M,{readStatus:'Offline'}),G,{kind:'area',id:1}).stale,'stale status retained');
   var crop=SvcShare1164.cropFor([{x:50,y:50,ref:'P'},{x:99,y:99,ref:'Q'}],[0,0,100,100],1000,1000);
   check(crop.points[0].x===500&&crop.points[1].y===990,'registered projection');check(crop.points.every(p=>p.x>=crop.x&&p.x<=crop.x+crop.w&&p.y>=crop.y&&p.y<=crop.y+crop.h),'crop retains all positions');
   var edge=SvcShare1164.cropFor([{x:0,y:0},{x:100,y:100}],[0,0,100,100],2000,1000);check(edge.x===0&&edge.y===0&&edge.w===2000&&edge.h===1000,'opposite drawing corners remain inside crop');
   var host=document.createElement('div');host.id='fixture1164';host.style.cssText='position:relative;z-index:1;background:#1b252a;color:#fff;max-width:1100px;margin:16px auto;padding:12px';document.body.prepend(host);
   window.__shareFixture={host,M,G,tick};M.refresh=async function(){window.__refreshes=(window.__refreshes||0)+1;SvcMap1099.update(host,M);};SvcMap1099.update(host,M);
   Object.defineProperty(navigator,'canShare',{configurable:true,value:()=>true});Object.defineProperty(navigator,'share',{configurable:true,value:async payload=>{window.__shared={title:payload.title,text:payload.text,name:payload.files[0].name,type:payload.files[0].type,size:payload.files[0].size};}});
   return {checks};
  });checks+=result.checks;
  const host=p.locator('#fixture1164');
  await host.locator('[data-svc1099-area="1"]').click();
  await host.locator('[data-share1164-area]').click();
  const dialog=p.locator('dialog.svc-share1164');
  await dialog.getByRole('button',{name:'Share picture',exact:true}).waitFor();
  await p.waitForFunction(()=>!!document.querySelector('.svc-share1164 img')?.src&&document.querySelector('.svc-share1164 img').complete);
  yes(await dialog.locator('h3').innerText().then(x=>x.includes('Area 1')));
  yes(await dialog.locator('a').count()===2);
  yes(await p.evaluate(()=>window.__refreshes===1));
  yes(await dialog.evaluate(el=>el.scrollWidth<=el.clientWidth+1));
  yes(await dialog.locator('img').evaluate(el=>el.naturalWidth===1080&&el.naturalHeight>1400));
  if(evidence){fs.mkdirSync(evidence,{recursive:true});await p.screenshot({path:path.join(evidence,mobile?'phone.png':'desktop.png')});
   const bytes=await dialog.locator('img').evaluate(async el=>Array.from(new Uint8Array(await(await fetch(el.src)).arrayBuffer())));fs.writeFileSync(path.join(evidence,mobile?'phone-picture.png':'desktop-picture.png'),Buffer.from(bytes));}
  await dialog.getByRole('button',{name:'Share picture',exact:true}).click();
  yes(await p.evaluate(()=>__shared.type==='image/png'&&__shared.size>20000&&__shared.text.includes('TEST-B')&&!__shared.text.includes('TEST-C')));
  await p.evaluate(()=>Object.defineProperty(navigator,'share',{configurable:true,value:async()=>{throw new DOMException('Cancelled','AbortError');}}));
  await dialog.getByRole('button',{name:'Share picture',exact:true}).click();
  yes(await dialog.getByRole('status').innerText().then(t=>t.includes('cancelled')));
  const download=p.waitForEvent('download');await dialog.getByRole('button',{name:'Save picture',exact:true}).click();yes((await download).suggestedFilename()==='GC500-area-1-2026-10-23.png');
  await p.evaluate(()=>{var f=__shareFixture;f.M.events.push(f.tick('pump-saved','a','pump'),f.tick('water-saved','a','refill'));});
  await dialog.getByRole('button',{name:'Refresh picture',exact:true}).click();await p.waitForFunction(()=>document.querySelector('.svc-share1164-actions button').disabled===false);
  yes(await dialog.locator('a').count()===1);
  await p.evaluate(()=>{var f=__shareFixture;f.M.day='2026-10-25';SvcMap1099.update(f.host,f.M);});yes(await dialog.count()===0);
  await host.locator('.svc1099-references summary').click();await host.locator('[data-svc1099-reference="TEST-A"]').click();
  await p.evaluate(()=>Object.defineProperty(navigator,'canShare',{configurable:true,value:()=>false}));
  await host.locator('[data-share1164-ref="TEST-A"]').click();await p.waitForFunction(()=>!!document.querySelector('.svc-share1164 img')?.src);
  yes(await dialog.getByRole('button',{name:'Share picture',exact:true}).isHidden());
  yes(await dialog.getByRole('button',{name:'Save picture',exact:true}).isEnabled());
  await dialog.locator('summary').click();yes(await dialog.getByRole('link').first().getAttribute('href').then(x=>x.startsWith('https://www.google.com/maps/dir/?api=1&destination=')));
  await p.evaluate(()=>{__shareFixture.M.refresh=async()=>{throw Error('synthetic offline');};});
  await dialog.getByRole('button',{name:'Refresh picture',exact:true}).click();await p.waitForFunction(()=>document.querySelector('.svc-share1164-actions button').disabled===false);
  yes(await dialog.getByRole('status').innerText().then(t=>t.includes('Last verified progress only')));
  await p.evaluate(()=>Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async()=>{throw Error('synthetic unavailable');}}}));
  await dialog.getByRole('button',{name:'Copy jobs + directions',exact:true}).click();yes(await dialog.locator('textarea').inputValue().then(t=>t.includes('Pump out, clean & lock')&&t.includes('maps/dir/')));
  await p.evaluate(()=>{var f=__shareFixture;f.M.context1164='different-tracker';SvcMap1099.update(f.host,f.M);});yes(await dialog.count()===0);
  await host.locator('[data-share1164-ref="TEST-A"]').click();await p.waitForFunction(()=>!!document.querySelector('.svc-share1164 img')?.src);
  await p.evaluate(()=>SvcMap1099.clear(__shareFixture.host));yes(await dialog.count()===0);
  yes(s.errors.length===0);yes(cons.length===0);yes(s.counts.blocked===0);
  console.log(JSON.stringify({passed:checks,mobile,errors:s.errors,consoleErrors:cons,blockedWrites:s.counts.blocked}));
 }finally{await s.browser.close();}
})().catch(e=>{console.error(e.stack);process.exit(1);});
