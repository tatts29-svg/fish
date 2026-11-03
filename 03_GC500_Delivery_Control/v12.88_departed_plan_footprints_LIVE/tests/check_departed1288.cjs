/* Author: Andrew Fisher. Read-only departed equipment footprint integration.
 * Run under /tmp/gc500-browser.lock with PAGE and a private OUT outside Git.
 * The harness aborts every operational write. Fixtures alter presentation-only
 * item copies and restore them; native departure records are never changed.
 */
'use strict';
const fs=require('fs'),path=require('path'),crypto=require('crypto'),assert=require('node:assert/strict');
assert(process.env.OUT,'OUT is required');
const out=path.resolve(process.env.OUT),repo=path.resolve(__dirname,'../../..');
assert(!out.startsWith(repo+path.sep),'Screenshots and detailed evidence must stay private');
assert(process.env.PAGE||process.env.LIVE==='1','PAGE or LIVE=1 required');
assert(!(process.env.PAGE&&process.env.LIVE==='1'),'Live verification cannot replace the served page');
fs.mkdirSync(out,{recursive:true});
process.env.GC500_CACHE=process.env.GC500_CACHE||fs.mkdtempSync(path.join(out,'fetch-'));
const {open}=require('../../toolchain/harness/open_page');
const {curlFetch}=require('../../toolchain/harness/curlfetch');
const safe=e=>String(e?.message||e).replace(/https?:\/\/[^\s"'<>]+/g,'[URL]').replace(/\bAIza[\w-]+|\bpk\.[\w.-]+/g,'[key]').slice(0,350);
const result={author:'Andrew Fisher',suite:'departed1288',checkedAt:new Date().toISOString(),passed:false,checks:[],errors:[],consoleErrors:[],recordWrites:0};
let session,child;
const check=(name,condition,detail)=>{result.checks.push({name,passed:!!condition,...(detail===undefined?{}:{detail})});assert(condition,name);};
const save=()=>fs.writeFileSync(path.join(out,'result.json'),JSON.stringify(result,null,2)+'\n');

async function focus(code,mode='original',rotation=0,pixels=160,selected=false){
 return child.evaluate(({code,mode,rotation,pixels,selected:choose})=>{
  GC500Explorer.setMode(mode);complete897Pull();stopCameraMotion813();clearSelection813();
  marks=[];DONE782_ON=false;
  const it=ITEMS.find(it=>it.code===code),s=parent.gc500MapShapes1060().refs[code];
  if(!it||!s)return {available:false};
  const coords=s.comps.flatMap(c=>c.poly.map(p=>toGeo(p[0]*SHEET_W,p[1]*SHEET_H)));
  const xs=coords.map(p=>p.x),ys=coords.map(p=>p.y),span=Math.max(Math.max(...xs)-Math.min(...xs),Math.max(...ys)-Math.min(...ys));
  camera.cx=(Math.max(...xs)+Math.min(...xs))/2;camera.cy=(Math.max(...ys)+Math.min(...ys))/2;camera.rot=rotation;
  camera.z=Math.max(MIN_Z,Math.min(MAX_Z,pixels/(span*fitScale)));
  if(choose){selected=it;marks=[{it,c:it.cat?.c||'#ff6a13'}];selectedStatus1009();}
  panel813(false);document.getElementById('xcard')?.classList.remove('show');
  requestPaint();return {available:true,code,selected:!!selected,shape:!!GC500Shape1060.projected1288(code)};
 },{code,mode,rotation,pixels,selected});
}

// Capture real canvas paths, not just the new diagnostic's projected values.
async function capture(code){
 return child.evaluate(async code=>{
  const api=GC500Shape1060,source=parent.gc500MapShapes1060().refs[code],projected=api.projected1288(code);
  if(!projected||!source)return {available:false};
  const captured=[],restore=[];
  for(const cv of [document.getElementById('shape1060'),document.getElementById('offsite1225')].filter(Boolean)){
   const g=cv.getContext('2d');let commands=[];
   const point=(x,y)=>{const m=g.getTransform();return [m.a*x+m.c*y+m.e,m.b*x+m.d*y+m.f];};
   for(const name of ['beginPath','moveTo','lineTo','bezierCurveTo','closePath','arc','stroke','fill']){
    const old=g[name];restore.push(()=>{g[name]=old;});
    g[name]=function(...args){
     if(name==='beginPath')commands=[];
     else if(name==='moveTo'||name==='lineTo')commands.push([name==='moveTo'?'M':'L',...point(...args)]);
     else if(name==='bezierCurveTo')commands.push(['C',...point(args[0],args[1]),...point(args[2],args[3]),...point(args[4],args[5])]);
     else if(name==='closePath')commands.push(['Z']);
     else if(name==='arc')commands.push(['A',...point(args[0],args[1]),args[2]]);
     else if(name==='stroke'||name==='fill')captured.push({canvas:cv.id,op:name,path:commands.map(c=>c.slice()),style:String(name==='stroke'?g.strokeStyle:g.fillStyle),dash:g.getLineDash(),alpha:g.globalAlpha});
     return old.apply(this,args);
    };
   }
  }
  try{drawMarks(currentView());}finally{restore.reverse().forEach(f=>f());}
  // Count tags are deliberately deferred and stale hit boxes are cleared by
  // set(). Observe the next actual label paint before checking tag visibility.
  await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));
  const now=api.projected1288(code),M=sheetToDevice(currentView().scale,sw,sh);
  const project=p=>{const q=toGeo(p[0]*SHEET_W,p[1]*SHEET_H);return applyM(M,q.x,q.y);};
  const raw=source.comps.map(c=>c.poly.map(project)),xs=raw.flat().map(p=>p.x),ys=raw.flat().map(p=>p.y);
  const mx=(Math.min(...xs)+Math.max(...xs))/2,my=(Math.min(...ys)+Math.max(...ys))/2,extent=Math.max(Math.max(...xs)-Math.min(...xs),Math.max(...ys)-Math.min(...ys));
  const k=extent>0&&extent<12?12/extent:1,T=q=>({x:mx+(q.x-mx)*k,y:my+(q.y-my)*k}),P=p=>T(project(p));
  const difference=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
  const samePath=(a,b)=>a.length===b.length&&a.every((v,i)=>v.length===b[i].length&&v.every((n,j)=>j===0?n===b[i][j]:Math.abs(n-b[i][j])<.7));
  const poly=ps=>ps.map((p,i)=>[i?'L':'M',p.x*dpr,p.y*dpr]).concat([['Z']]);
  const line=ps=>ps.map((p,i)=>[i?'L':'M',p.x*dpr,p.y*dpr]);
  let maxError=0,sourceMatch=now.parts.length===source.comps.length,allPolygonsPainted=true,allDoorsPainted=true,doorsAfterFill=true,doorCount=0,doorLines=0;
  const fills=[];
  source.comps.forEach((c,i)=>{
   const expected=c.poly.map(P),part=now.parts[i];
   sourceMatch=sourceMatch&&JSON.stringify(part.sourcePoly)===JSON.stringify(c.poly)&&part.standard===c.std&&part.tank===c.tank;
   if(!part||part.points.length!==expected.length){maxError=Infinity;return;}
   expected.forEach((p,j)=>{maxError=Math.max(maxError,difference(p,part.points[j]));});
   const matches=captured.map((o,n)=>({o,n})).filter(x=>samePath(x.o.path,poly(expected)));
   allPolygonsPainted=allPolygonsPainted&&matches.some(x=>x.o.op==='stroke');
   const lastFill=Math.max(-1,...matches.filter(x=>x.o.op==='fill').map(x=>x.n));fills.push({standard:c.std,tank:c.tank,styles:matches.filter(x=>x.o.op==='fill').map(x=>x.o.style),strokes:matches.filter(x=>x.o.op==='stroke').map(x=>({style:x.o.style,dash:x.o.dash}))});
   sourceMatch=sourceMatch&&part.doors.length===c.doors.length;
   c.doors.forEach((dr,di)=>{
    doorCount++;const output=part.doors[di];
    for(const type of ['arcs','leaves','landing']){
     sourceMatch=sourceMatch&&output[type].length===dr[type].length;
     dr[type].forEach((points,li)=>{
      const ps=points.map(P);ps.forEach((p,j)=>{maxError=Math.max(maxError,difference(p,output[type][li][j]));});
      if(ps.length<2)return;doorLines++;
      const expectedPath=type==='arcs'&&ps.length===4?[['M',ps[0].x*dpr,ps[0].y*dpr],['C',...ps.slice(1).flatMap(p=>[p.x*dpr,p.y*dpr])]]:line(ps);
      const strokes=captured.map((o,n)=>({o,n})).filter(x=>x.o.op==='stroke'&&samePath(x.o.path,expectedPath));
      allDoorsPainted=allDoorsPainted&&strokes.length>0;doorsAfterFill=doorsAfterFill&&strokes.some(x=>x.n>lastFill);
     });
    }
   });
  });
  const inside=(x,y,ps)=>{let hit=false;for(let i=0,j=ps.length-1;i<ps.length;j=i++){const a=ps[i],b=ps[j];if((a.y>y)!==(b.y>y)&&x<(b.x-a.x)*(y-a.y)/(b.y-a.y)+a.x)hit=!hit;}return hit;};
  const primary=now.parts.find(p=>!p.tank)||now.parts[0];let tap=null;
  const b={x0:Math.min(...primary.points.map(p=>p.x)),x1:Math.max(...primary.points.map(p=>p.x)),y0:Math.min(...primary.points.map(p=>p.y)),y1:Math.max(...primary.points.map(p=>p.y))};
  for(let i=1;i<5&&!tap;i++)for(let j=1;j<5&&!tap;j++){const x=b.x0+(b.x1-b.x0)*i/5,y=b.y0+(b.y1-b.y0)*j/5;if(inside(x,y,primary.points)&&markAt(x,y)?.it?.code===code)tap={x,y};}
  const off=document.getElementById('offsite1225'),pixels=off?.getContext('2d').getImageData(0,0,off.width,off.height).data;
  let ink=0;for(let i=3;i<(pixels?.length||0);i+=4)if(pixels[i])ink++;
  return {available:true,code,selected:selected?.code===code,unselected:!selected,projectionError:maxError,sourceMatch,allPolygonsPainted,allDoorsPainted,doorsAfterFill,doorCount,doorLines,components:source.comps.length,sourceHasNoUnitMap:parent.MasterShapes926.shape(code).units.length===0,dep:now.departure,painted:api.departed1288().includes(code),fills,tap,offsiteInk:ink,markers:GC500Departure1211.markers1288.filter(m=>m.code===code),shapeErrors:api.state.failed};
 },code);
}

async function screenshot(name){await session.page.waitForTimeout(350);await child.locator('#stage').screenshot({path:path.join(out,name+'-map.png'),timeout:15000});await session.page.screenshot({path:path.join(out,name+'-page.png'),timeout:15000});}

async function fallback(code,variant){
 return child.evaluate(async({code,variant})=>{
  GC500Explorer.setMode('original');complete897Pull();stopCameraMotion813();clearSelection813();marks=[];DONE782_ON=variant==='done';
  const it=ITEMS.find(x=>x.code===code),bb=it.places[0],point=toGeo((bb[0]+bb[2])/2,(bb[1]+bb[3])/2);
  camera.cx=point.x;camera.cy=point.y;camera.rot=0;camera.z=Math.min(MAX_Z,8/fitScale);
  if(variant==='selected')selected=it;
  if(variant==='selected'||variant==='search')marks=[{it,c:it.cat?.c||'#ff6a13'}];
  panel813(false);
  let circles=0;const undo=[];const center=applyM(sheetToDevice(dpr*currentView().scale,canvas.width,canvas.height),point.x,point.y);
  for(const id of ['marks','offsite1225']){const g=document.getElementById(id).getContext('2d'),old=g.arc;g.arc=function(x,y,r,...rest){const t=g.getTransform(),xx=t.a*x+t.c*y+t.e,yy=t.b*x+t.d*y+t.f;if(Math.hypot(xx-center.x,yy-center.y)<1&&r>=8*dpr)circles++;return old.call(this,x,y,r,...rest);};undo.push(()=>g.arc=old);}
  try{drawMarks(currentView());await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));}finally{undo.forEach(f=>f());}
  const tags=GC500Departure1211.markers1288.filter(m=>m.code===code),tag=tags[0]?.tag[0];
  const hit=tag&&markAt(tag.x+tag.w/2,tag.y+tag.h/2)?.it?.code===code;
  return {code,variant,circles,tags,hit,point:tag?{x:tag.x+tag.w/2,y:tag.y+tag.h/2}:null};
 },{code,variant});
}

(async()=>{
 try{
  const bytes=process.env.PAGE?fs.readFileSync(process.env.PAGE):(await curlFetch('https://gc500-production.up.railway.app/v/Coates-GC500-2026?departed1288='+Date.now(),{'Cache-Control':'no-store'},'GET')).body;
  result.dashboardSha256=crypto.createHash('sha256').update(bytes).digest('hex');
  if(process.env.EXPECTED_SHA)assert.equal(result.dashboardSha256,process.env.EXPECTED_SHA,'Wrong candidate bytes');
  session=await open({pageFile:process.env.PAGE,hash:'#map',W:1153,H:1280,dpr:1,mobile:true,gl:true,init:"localStorage.setItem('gc500.map1188','plan');localStorage.setItem('gc500.explorer.mode','original');"});
  const p=session.page;p.on('console',m=>{if(m.type()==='error')result.consoleErrors.push(safe(m.text()));});
  await p.waitForFunction(()=>typeof go==='function'&&!!document.getElementById('expFrame'),null,{timeout:30000});await p.evaluate(()=>go('map'));
  await p.waitForFunction(()=>{const w=document.getElementById('expFrame')?.contentWindow;return w?.__ready&&w.GC500Shape1060?.projected1288&&w.GC500Departure1211;},null,{timeout:45000});
  child=p.frames().find(f=>new URL(f.url()).pathname.endsWith('/explorer/index.html'));assert(child,'Explorer iframe missing');
  await child.waitForFunction(()=>MapUnits1147.state.ready&&GC500Shape1060.state.available,null,{timeout:15000});
  await p.waitForFunction(()=>window.gc500MapStatus1009?.().available&&window.Departure1211?.mapStates,null,{timeout:30000});
  result.status=await child.evaluate(()=>{complete897Pull();const rows=new Map(parent.Departure1211.mapStates().map(r=>[norm(r.key),r]));let checked=0,mismatches=0;const types={};for(const it of ITEMS){const d=rows.get(norm(it.reg?.sourceRequest1017?it.reg.sourceKey1017:it.code));if(!d?.collected)continue;checked++;const st=mapStatus1009(it),expected=d.issues.length?'review':d.complete?'moved':'partial';types[expected]=(types[expected]||0)+1;if(st?.state!==expected||st.label!==d.label||!st.offsite1225)mismatches++;}return {checked,mismatches,types};});
  check('Native departure states and wording are preserved',result.status.checked>0&&!result.status.mismatches,result.status);
  result.inventory=await child.evaluate(()=>{complete897Pull();return ITEMS.filter(it=>mapStatus1009(it)?.offsite1225).map(it=>({code:it.code,shape:!!GC500Shape1060.projected1288(it.code),kind:mapStatus1009(it).state,doors:parent.gc500MapShapes1060().refs[it.code]?.comps.reduce((s,c)=>s+c.doors.length,0)||0}));});
  const chosen=['P51','P52','P54','AA'].find(code=>result.inventory.some(r=>r.code===code&&r.shape&&r.doors))||result.inventory.find(r=>r.shape&&r.doors)?.code;
  check('An actual recorded departure has a sourced footprint and door',!!chosen);
  result.transforms=[];
  for(const [mode,rotation,pixels] of [['original',0,180],['original',37,260],['hybrid',90,180],['satellite',-28,130]]){
   await focus(chosen,mode,rotation,pixels);await p.waitForTimeout(120);const r=await capture(chosen);result.transforms.push({mode,rotation,pixels,...r});
   check(`${mode}/${rotation}: unselected departure is actually painted`,r.unselected&&r.painted&&r.allPolygonsPainted);
   check(`${mode}/${rotation}: source footprint and door projection`,r.sourceMatch&&r.projectionError<.05&&r.allDoorsPainted&&r.doorsAfterFill);
   check(`${mode}/${rotation}: footprint remains selectable`,!!r.tap);
   check(`${mode}/${rotation}: one count tag references its traced shape`,r.markers.length===1&&r.markers.every(m=>m.shape===true&&m.tag.length===1));
  }
  await focus(chosen,'original',0,190,true);await p.waitForTimeout(120);result.selected=await capture(chosen);
  check('Selected departed outline and source doors still paint',result.selected.selected&&result.selected.allPolygonsPainted&&result.selected.allDoorsPainted&&result.selected.doorsAfterFill);
  // Actual touch on an unselected outline, not a direct selectCode call.
  await focus(chosen,'original',0,190);await p.waitForTimeout(120);const touched=await capture(chosen);assert(touched.tap,'No exact interior touch target');
  await child.locator('#stage').tap({position:touched.tap});await p.waitForTimeout(250);
  result.touch=await child.evaluate(code=>({selected:selected?.code===code,hasShape:!!GC500Shape1060.projected1288(code)}),chosen);check('Touch selects the intended unselected footprint',result.touch.selected&&result.touch.hasShape);
  result.neighborhoods=[];
  for(const code of ['WC59','P51','P52','P54','AA']){
   const available=await focus(code,'hybrid',code==='WC59'?90:0,code==='WC59'?230:110);if(!available.shape){result.neighborhoods.push({code,available:false});continue;}
   await p.waitForTimeout(180);const r=await capture(code);result.neighborhoods.push(r);
   check(code+': supplied geometry and door inventory unchanged',r.sourceMatch&&r.projectionError<.05);
   if(code==='WC59')check('WC59 does not gain invented open-door geometry',r.doorCount===0&&r.doorLines===0);
   if(code==='WC59'||code==='P51')await screenshot(code.toLowerCase()+'-tablet');
  }
  const partial=result.inventory.find(r=>r.code==='WC01'&&r.shape&&r.kind==='partial')||result.inventory.find(r=>r.shape&&r.kind==='partial');check('A partial group is available for aggregation test',!!partial);
  await focus(partial.code,'original',23,230);await p.waitForTimeout(120);result.partial=await capture(partial.code);
  check('Partial group uses the entire sourced footprint without slot attribution',result.partial.sourceMatch&&result.partial.sourceHasNoUnitMap&&result.partial.allPolygonsPainted&&result.partial.dep.kind==='part'&&result.partial.dep.total>result.partial.dep.n);
  check('Every partial group part retains dashed departure edging',result.partial.fills.filter(f=>!f.tank).every(f=>f.strokes.some(s=>s.style==='#7fffc1'&&s.dash.length>0)));
  const marker=result.partial.markers[0];if(marker)check('Partial count stays at group level',marker.n===result.partial.dep.n&&marker.total===result.partial.dep.total);
  await screenshot('partial-group-tablet');
  // A review fixture replaces only the local presentation reader. It neither
  // edits the shared state nor substitutes a test collection record.
  await focus(chosen,'original',0,180);
  await child.evaluate(code=>{window.__originalStatus1288=mapStatus1009;window.mapStatus1009=function(it){const s=window.__originalStatus1288.apply(this,arguments);if(it?.code!==code||!s?.departure1211)return s;return {...s,state:'review',colour:'#ffaaa3',departure1211:{...s.departure1211,issues:['presentation fixture']}};};},chosen);
  try{result.reviewFixture=await capture(chosen);check('Review presentation retains red source outline and actual doors',result.reviewFixture.dep.kind==='review'&&result.reviewFixture.allPolygonsPainted&&result.reviewFixture.allDoorsPainted&&result.reviewFixture.fills.filter(f=>!f.tank).every(f=>f.strokes.some(s=>s.style==='#ffaaa3')));}
  finally{await child.evaluate(()=>{window.mapStatus1009=window.__originalStatus1288;delete window.__originalStatus1288;complete897Pull();requestPaint();});}
  const fallbackCode=await child.evaluate(()=>ITEMS.find(it=>mapStatus1009(it)?.offsite1225&&it.places?.length===1&&!GC500Shape1060.projected1288(it.code)&&parent.gc500MapShapes1060().refs[it.code]?.shared)?.code||ITEMS.find(it=>mapStatus1009(it)?.offsite1225&&it.places?.length===1&&!GC500Shape1060.projected1288(it.code)&&it.location1210?.kind!=='vms')?.code);
  check('An actual unassigned departed reference is available',!!fallbackCode);
  result.fallbacks=[];
  for(const variant of ['unselected','search','selected','done']){const f=await fallback(fallbackCode,variant);result.fallbacks.push(f);check(variant+': unassigned outline uses one truthful selectable tag and no circular badge',f.circles===0&&f.hit&&f.tags.length===1&&!f.tags[0].shape&&!!f.tags[0].reason&&f.tags[0].tag.length===1);}
  const f=await fallback(fallbackCode,'unselected');await child.locator('#stage').tap({position:f.point});await p.waitForTimeout(150);check('Actual touch selects an unassigned-outline tag',await child.evaluate(code=>selected?.code===code,fallbackCode));
  result.guards=await child.evaluate(()=>{
   const sample=ITEMS.find(it=>GC500Shape1060.projected1288(it.code)),index=ITEMS.indexOf(sample),original=ITEMS[index],checks=[];
   const shift=(ps,n)=>ps.map(b=>b.map((v,i)=>v+(i%2===0?n:0)));
   const trial=(name,fields)=>{ITEMS[index]={...original,...fields};try{checks.push({name,blocked:GC500Shape1060.projected1288(original.code)===null});}finally{ITEMS[index]=original;}};
   trial('moved recorded pin',{placedHow:'Andrew’s pin — presentation fixture'});
   trial('multiple locations',{places:[...original.places,...shift(original.places,.0001)]});
   trial('furniture inside a building',{cat:{...original.cat,name:'Furniture'},places:shift(original.places,.0002)});
   trial('marker far from historical geometry',{places:shift(original.places,500)});
   const shared=Object.values(parent.gc500MapShapes1060().refs).filter(r=>r.shared);checks.push({name:'shared outlines',blocked:shared.every(r=>GC500Shape1060.projected1288(r.ref)===null),cases:shared.length});
   checks.push({name:'cancelled plan reference',blocked:GC500Shape1060.projected1288('P53')===null});
   checks.push({name:'unmapped reference',blocked:GC500Shape1060.projected1288('NO_SOURCE1288')===null});
   return {checks,restored:ITEMS[index]===original};
  });
  check('Ambiguous, relocated, cancelled and unmapped footprints stay guarded',result.guards.restored&&result.guards.checks.every(r=>r.blocked),result.guards);
  result.performance=[];
  for(const name of ['overview','close-up']){
   if(name==='overview')await child.evaluate(()=>{GC500Explorer.setMode('original');clearSelection813();marks=[];fit(false,false);requestPaint();});else await focus(chosen,'original',0,200);
   await p.waitForTimeout(150);
   const timing=await child.evaluate(async()=>{const times=[];for(let n=0;n<35;n++){const t=performance.now();drawMarks(currentView());if(n>=5)times.push(performance.now()-t);}times.sort((a,b)=>a-b);
    const labels=[],g=document.getElementById('offsite1225').getContext('2d'),old=g.clearRect;g.clearRect=function(...a){const t=performance.now();queueMicrotask(()=>labels.push(performance.now()-t));return old.apply(this,a);};
    try{for(let n=0;n<12;n++){drawMarks(currentView());await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));}}finally{g.clearRect=old;}
    labels.sort((a,b)=>a-b);return {scope:'synchronous footprint paint; deferred labels measured separately, no network timing',samples:times.length,medianMs:times[Math.floor(times.length*.5)],p95Ms:times[Math.floor(times.length*.95)],maxMs:times.at(-1),labelSamples:labels.length,labelMedianMs:labels[Math.floor(labels.length*.5)],labelP95Ms:labels[Math.floor(labels.length*.95)],drawn:GC500Shape1060.state.drawn,failed:GC500Shape1060.state.failed};});result.performance.push({name,...timing});check(name+': repeated paints have no renderer errors',timing.failed===0);
  }
  await p.setViewportSize({width:390,height:844});await p.waitForTimeout(200);
  for(const code of ['WC59','P51']){await focus(code,'hybrid',code==='WC59'?90:0,code==='WC59'?180:100);await p.waitForTimeout(180);await screenshot(code.toLowerCase()+'-phone');}
  await p.evaluate(()=>{window.__departed1288Frame=document.getElementById('expFrame').contentWindow;go('today');});await p.waitForTimeout(150);await p.evaluate(()=>go('map'));await p.waitForTimeout(200);
  result.returnCheck=await p.evaluate(()=>{const w=document.getElementById('expFrame').contentWindow;return w===window.__departed1288Frame&&!!w.GC500Shape1060.projected1288&&!!w.GC500Departure1211;});check('Leaving and returning retains the upgraded map',result.returnCheck);
  result.errors=session.errors.map(safe);result.recordWrites=session.counts.blocked;
  check('No page or console errors',!result.errors.length&&!result.consoleErrors.length);check('No attempted operational record writes',!result.recordWrites);
  result.passed=true;
 }catch(e){result.failure=safe(e);}
 finally{if(session){result.errors=session.errors.map(safe);result.recordWrites=session.counts.blocked;await session.browser.close();}save();}
 console.log(JSON.stringify({passed:result.passed,sha256:result.dashboardSha256,checks:result.checks.length,statuses:result.status?.checked,performance:result.performance,errors:result.errors.length,consoleErrors:result.consoleErrors.length,recordWrites:result.recordWrites,failure:result.failure}));
 if(!result.passed)process.exitCode=1;
})().catch(e=>{console.error(safe(e));process.exitCode=1;});
