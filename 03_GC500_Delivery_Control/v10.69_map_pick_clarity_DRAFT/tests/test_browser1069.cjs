/* Author: Andrew Fisher. Overview reproduction using actual master geometry and GET-only state.
   PAGE=... OUT=/private/evidence MOB=1 BASELINE=1(optional) node tests/test_browser1069.cjs
   Synthetic chip/Done visibility affects only this disposable browser; no site data is changed. */
'use strict';
const fs=require('fs'),path=require('path'),{open}=require('../../toolchain/harness/open_page.js');
const mobile=process.env.MOB==='1',baseline=process.env.BASELINE==='1',out=process.env.OUT;
if(!out)throw Error('OUT must be an authorised private evidence directory');fs.mkdirSync(out,{recursive:true});
(async()=>{const h=await open({pageFile:process.env.PAGE,hash:'#sheet/__explorer',mobile,W:mobile?390:1440,H:mobile?844:1000,dpr:mobile?2:1});const checks=[],cases=[];let failures=0;const check=(name,ok,detail)=>{checks.push({name,ok:!!ok,detail});if(!ok)failures++;console.log((ok?'PASS ':'FAIL ')+name)};
try{const p=h.page;await p.waitForFunction(()=>typeof SYNC!=='undefined'&&SYNC.status==='live',null,{timeout:180000});await p.waitForFunction(()=>typeof EXP!=='undefined'&&EXP.frame?.contentWindow?.GC500Shape1060?.state.available,null,{timeout:180000});const f=p.frames().find(f=>/\/explorer\/index\.html/.test(f.url()));await f.evaluate(()=>GC500Explorer.ready);await p.emulateMedia({reducedMotion:'reduce'});await f.waitForFunction(()=>!gotoAnim887&&!zAnim,null,{timeout:20000});const before=await p.evaluate(()=>JSON.stringify(S));const geoBefore=await f.evaluate(()=>JSON.stringify(ITEMS.map(i=>[i.code,i.places])));
check('expected map fix presence',await f.evaluate(()=>!!GC500Shape1060.clarity1069)!==baseline);
for(const [keep,shape]of[['T0258','P52'],['T0266','P55'],['PG01','WC16']]){let observed=0,wrong=0;for(const done of[false,true])for(const z of[1,2,4,8]){
 const r=await f.evaluate(({keep,shape,z,done})=>{
  const it=ITEMS.find(i=>i.code===shape),k=ITEMS.find(i=>i.code===keep);if(!it?.places?.length||!k?.places?.length)return{unavailable:true,keep,shape,z,done};
  DONE782_ON=done;DONE782.clear();if(done)DONE782.add(shape);selected=null;marks=(done?[k]:[k,it]).map(it=>({it,c:it.cat.c}));const b=it.places[0];camera={...camera,cx:(b[0]+b[2])/2,cy:(b[1]+b[3])/2,z};changeView(false);drawMarks(currentView());
  const drawn=GC500Shape1060.shaped().concat(GC500Shape1060.done());if(!drawn.includes(shape))return{unavailable:true,why:'not a drawn shape in fixture',keep,shape,z,done};
  const at=GC500Shape1060.at(shape),v=currentView(),M=sheetToDevice(v.scale,sw,sh),shapes=window.parent.gc500MapShapes1060().refs[shape];
  const raw=shapes.comps.map(c=>c.poly.map(([x,y])=>{const q=toGeo(x*SHEET_W,y*SHEET_H);return applyM(M,q.x,q.y)}));let x0=Infinity,x1=-Infinity,y0=Infinity,y1=-Infinity;raw.flat().forEach(p=>{x0=Math.min(x0,p.x);x1=Math.max(x1,p.x);y0=Math.min(y0,p.y);y1=Math.max(y1,p.y)});const mx=(x0+x1)/2,my=(y0+y1)/2,k0=Math.max(1,12/Math.max(x1-x0,y1-y0)),parts=raw.map(poly=>poly.map(q=>({x:mx+(q.x-mx)*k0,y:my+(q.y-my)*k0})));
  const inPoly=(x,y,poly)=>{let c=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){const a=poly[i],b=poly[j];if((a.y>y)!==(b.y>y)&&x<(b.x-a.x)*(y-a.y)/(b.y-a.y)+a.x)c=!c}return c};
  let free=0,wrong=0,first=null;const hits={};for(let y=Math.ceil(at.box.y0)+1;y<at.box.y1-1;y+=1)for(let x=Math.ceil(at.box.x0)+1;x<at.box.x1-1;x+=1){if(x<1||y<1||x>=sw-1||y>=sh-1||!parts.some(poly=>inPoly(x,y,poly)))continue;const rgba=mctx.getImageData(Math.floor(x*dpr),Math.floor(y*dpr),1,1).data;if(rgba[3]>=100)continue;free++;const picked=markAt(x,y)||itemAt887(x,y);hits[picked?.it?.code||'none']=(hits[picked?.it?.code||'none']||0)+1;if(picked?.it?.code!==shape){wrong++;if(!first)first={x,y,picked:picked?.it?.code||null,alpha:rgba[3]};}}
  const labels=labelBounds1010.filter(b=>b.it?.code===keep).map(b=>({x:b.x,y:b.y,w:b.w,h:b.h}));
  // An unrotated kept label must not contain any point from the adjacent visible shape.
  const labelCross=labels.some(b=>parts.some(poly=>poly.some(q=>q.x>b.x&&q.x<b.x+b.w&&q.y>b.y&&q.y<b.y+b.h)||inPoly(b.x+b.w/2,b.y+b.h/2,poly)));
  return{keep,shape,z,done,free,wrong,first,hits,labelCross,labels,box:at.box,failed:GC500Shape1060.state.failed};
 },{keep,shape,z,done});cases.push(r);if(!r.unavailable){observed+=r.free;wrong+=r.wrong;if(!baseline){check(`${keep}/${shape} z${z} ${done?'Done':'active'} visible free ink picks shape`,r.wrong===0,r);check(`${keep}/${shape} z${z} ${done?'Done':'active'} label clears visible shape`,!r.labelCross,r)}}
 if(z===2){await p.waitForTimeout(100);await f.evaluate(()=>drawMarks(currentView()));await f.locator('#stage').screenshot({path:path.join(out,`${mobile?'phone':'desktop'}-${shape}-${done?'done':'active'}.png`)});}
}
check(`${keep}/${shape} has measurable visible shape points`,observed>0,{observed,wrong});if(baseline)check(`${keep}/${shape} baseline demonstrates misdirected taps`,wrong>0,{observed,wrong});}
check('master pins and bounding places unchanged',await f.evaluate(()=>JSON.stringify(ITEMS.map(i=>[i.code,i.places])))===geoBefore);check('shared site record unchanged',await p.evaluate(()=>JSON.stringify(S))===before);check('no page errors',h.errors.length===0,h.errors);check('no write attempts',h.counts.blocked===0,h.counts);fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({baseline,mobile,checks,cases,errors:h.errors,counts:h.counts},null,2));if(failures)process.exitCode=1;
}finally{await h.browser.close()}})().catch(e=>{console.error(e);process.exitCode=1});
