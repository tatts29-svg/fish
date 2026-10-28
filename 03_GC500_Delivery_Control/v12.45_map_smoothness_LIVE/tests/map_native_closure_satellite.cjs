/* Author: Andrew Fisher. Read-only native closure satellite rendering regression. */
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {openCandidate}=require('./map_native_harness.cjs');
const out=process.env.OUT||(()=>{throw Error('OUT must name a private evidence directory');})();fs.mkdirSync(out,{recursive:true});
process.env.INITIAL_HASH='#fenceclose';process.env.MAP_NATIVE_LOAD_PROBE='1';
(async()=>{const h=await openCandidate(),p=h.page,results=[];const sel='#pane-fenceclose .c1136-svg';try{
 await p.evaluate(()=>go('fenceclose'));await p.locator(sel).waitFor({state:'visible',timeout:20000});
 const paths=await p.locator(sel+' g.lines path').evaluateAll(ns=>ns.map(n=>n.getAttribute('d')));
 for(const mode of ['fit','detail']){
  await p.evaluate(mode=>{const a=ClosureMap1136;a.setBase('sat');if(mode==='fit')a.fit();else{const pt=a.LINES.lines[0].pts[0];a.setZoom(2500,pt[0],pt[1]);}},mode);
  await p.waitForTimeout(400);await p.waitForFunction(sel=>{const a=[...document.querySelector(sel).querySelectorAll('g.satw image')];return a.length&&a.every(n=>__svgLoaded.has(n));},sel,{timeout:30000});
  await p.locator(sel).scrollIntoViewIfNeeded();await p.waitForTimeout(200);
  const r=await p.evaluate(({sel,mode})=>{
   const svg=document.querySelector(sel),images=[...svg.querySelectorAll('g.satw image')],rect=svg.getBoundingClientRect(),geo=ClosureMap1136.GEO;
   const inRect=(p,r)=>p.x>=r[0]&&p.y>=r[1]&&p.x<=r[2]&&p.y<=r[3];const samples=[];
   for(const x of [.2,.5,.8])for(const y of [.2,.5,.8]){
    const screen=new DOMPoint(rect.left+x*rect.width,rect.top+y*rect.height),sheet=screen.matrixTransform(svg.getScreenCTM().inverse());
    if(!inRect(sheet,geo.main)||(geo.exclude||[]).some(r=>inRect(sheet,r)))continue;
    const covered=images.filter(n=>{const q=screen.matrixTransform(n.getScreenCTM().inverse());return q.x>=n.x.baseVal.value&&q.x<=n.x.baseVal.value+n.width.baseVal.value&&q.y>=n.y.baseVal.value&&q.y<=n.y.baseVal.value+n.height.baseVal.value;});
    samples.push({covered:covered.length,loaded:covered.filter(n=>__svgLoaded.has(n)).length});
   }
   const clamped=images.filter(n=>Math.abs(Number(n.getAttribute('x'))-n.x.baseVal.value)>1||Math.abs(Number(n.getAttribute('y'))-n.y.baseVal.value)>1).length;
   return{mode,zoom:ClosureMap1136.pct,tiles:images.length,loaded:images.filter(n=>__svgLoaded.has(n)).length,clamped,samples,paths:[...svg.querySelectorAll('g.lines path')].map(n=>n.getAttribute('d'))};
  },{sel,mode});
  assert(r.tiles>0&&r.loaded===r.tiles,'Requires actual loaded satellite tiles');assert(r.samples.length>0,'Requires points inside the mapped plan area');assert.deepEqual(r.paths,paths,'Closure line geometry must be preserved');
  if(process.env.EXPECT_REUSE!=='0'){assert.equal(r.clamped,0,'SVG lengths must not clamp huge world coordinates');assert(r.samples.every(s=>s.loaded>0),'Loaded imagery must cover each sampled visible plan point');}
  delete r.paths;results.push(r);await p.locator(sel).screenshot({path:path.join(out,mode+'.png')});console.log(JSON.stringify(r));
 }
 assert.equal(h.counts.blocked,0);assert.equal(h.errors.length,0);assert.equal(h.consoleErrors.length,0);
 }finally{fs.writeFileSync(path.join(out,'closure-satellite.json'),JSON.stringify({author:'Andrew Fisher',baseline:h.baseline,results,errors:h.errors,consoleErrors:h.consoleErrors,counts:h.counts},null,2));await h.browser.close();}
})().catch(e=>{console.error(e.stack);process.exitCode=1;});
