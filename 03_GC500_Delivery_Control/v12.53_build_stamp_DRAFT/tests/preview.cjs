/* Author: Andrew Fisher. Private frozen-record, native-card preview proof.
 * All evidence and fixtures stay at caller-supplied private paths. No record writes.
 */
'use strict';
const fs = require('fs'), assert = require('node:assert/strict'), crypto = require('crypto');
const {openCandidate} = require('../../v12.43_responsiveness_LIVE/tests/candidate_harness.cjs');
const sha = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const expectedBase = '7ea8e4d2b8230bdece88a7d566c8ae8d2eea63892b8ba1b928a3440149ca4404';
const styleId = 'build-stamp1253-preview';
const geometry = async card => card.evaluate(async c => {
  const face = c.querySelector('.bc984-card'), stamp = face.querySelector('.bc984-stamp');
  const rect = face.getBoundingClientRect();
  const relative = r => ({x:r.x-rect.x,y:r.y-rect.y,width:r.width,height:r.height,right:r.right-rect.x,bottom:r.bottom-rect.y});
  const native = [...face.children].filter(n=>n!==stamp).map(n=>({class:n.className,rect:relative(n.getBoundingClientRect()),html:n.outerHTML}));
  const css = getComputedStyle(stamp), matrix = new DOMMatrix(css.transform);
  const width = parseFloat(css.width), height = parseFloat(css.height);
  const image = new Image(); image.src = css.backgroundImage.slice(5,-2); await image.decode();
  const canvas = document.createElement('canvas');canvas.width=image.width;canvas.height=image.height;
  const ctx=canvas.getContext('2d',{willReadFrequently:true});ctx.drawImage(image,0,0);
  const pixels=ctx.getImageData(0,0,image.width,image.height).data;
  const bounds={x:Infinity,y:Infinity,right:-Infinity,bottom:-Infinity};
  for(let y=0;y<image.height;y++) for(let x=0;x<image.width;x++) {
    if(pixels[(y*image.width+x)*4+3]<16) continue;
    const px=(x+.5)*width/image.width-width/2, py=(y+.5)*height/image.height-height/2;
    const dx=stamp.offsetLeft+width/2+matrix.a*px+matrix.c*py+matrix.e;
    const dy=stamp.offsetTop+height/2+matrix.b*px+matrix.d*py+matrix.f;
    bounds.x=Math.min(bounds.x,dx);bounds.y=Math.min(bounds.y,dy);bounds.right=Math.max(bounds.right,dx);bounds.bottom=Math.max(bounds.bottom,dy);
  }
  bounds.width=bounds.right-bounds.x;bounds.height=bounds.bottom-bounds.y;
  const textRects=[];
  for(const node of face.querySelectorAll('.bc984-cap,.bc984-weekday,.bc984-date-number,.bc984-date-month,.bc984-weather-reading')) {
    const walker=document.createTreeWalker(node,NodeFilter.SHOW_TEXT);let text;
    while(text=walker.nextNode()) if(text.textContent.trim()) {
      const range=document.createRange();range.selectNodeContents(text);
      for(const r of range.getClientRects()) if(r.width&&r.height) textRects.push({class:node.className,rect:relative(r)});
    }
  }
  const overlaps=textRects.filter(({rect:r})=>bounds.x<r.right&&bounds.right>r.x&&bounds.y<r.bottom&&bounds.bottom>r.y);
  const keep=['backgroundImage','opacity','filter','mixBlendMode','maskImage','maskPosition','maskComposite','animation','pointerEvents'];
  return {width,height,face:relative(rect),ink:bounds,textRects,overlaps,
    artwork:Object.fromEntries(keep.map(k=>[k,css[k]])),angle:{a:matrix.a,b:matrix.b,c:matrix.c,d:matrix.d},native,
    data:c.outerHTML,otherStamps:[...document.querySelectorAll('#pane-demob .bc984-stamp')].map(n=>({width:getComputedStyle(n).width,transform:getComputedStyle(n).transform}))};
});
function unchanged(before,after) {
  assert.deepEqual(after.native,before.native,'Every other native field, weather scene, control and box must remain unchanged');
  assert.equal(after.data,before.data,'Complete native card markup must remain unchanged');
  assert.deepEqual(after.artwork,before.artwork,'Original image, ink, mask and effects must remain exact');
  assert.deepEqual(after.angle,before.angle,'Original per-card stamp angle must remain exact');
  assert.deepEqual(after.otherStamps,before.otherStamps,'Demob stamps must remain unchanged');
}
(async()=>{
  for(const name of ['BASE','PAGE','STATE','OUT','DAY','EXPECTED_PAGE_SHA','EXPECTED_STATE_SHA']) assert(process.env[name],name+' required');
  const base=fs.readFileSync(process.env.BASE),page=fs.readFileSync(process.env.PAGE),frozen=JSON.parse(fs.readFileSync(process.env.STATE));
  assert.equal(sha(base),expectedBase,'Pinned live base required');assert.equal(sha(page),process.env.EXPECTED_PAGE_SHA,'Pinned preview required');assert.equal(sha(fs.readFileSync(process.env.STATE)),process.env.EXPECTED_STATE_SHA,'Pinned private record required');
  assert.equal(page.toString().replace(/<style id="build-stamp1253-preview">[\s\S]*?<\/style>\n/,''),base.toString(),'Removing the CSS must recover every base byte');
  fs.mkdirSync(process.env.OUT,{recursive:true});
  const s=await openCandidate(),p=s.page,results=[];
  try {
    await p.emulateMedia({reducedMotion:'reduce'});
    for(const [label,width,height] of [['desktop',1440,1200],['phone',390,1200],['small-phone',360,1200]]) {
      await p.setViewportSize({width,height});
      await p.evaluate(day=>{state.day=day;state.tlView='day';go('timeline');renderTimeline();},process.env.DAY);
      const card=p.locator('#pane-timeline .day[data-day="'+process.env.DAY+'"]');await card.waitFor();await card.scrollIntoViewIfNeeded();await p.waitForTimeout(200);
      await p.evaluate(id=>document.getElementById(id).disabled=true,styleId);
      const before=await geometry(card);await card.screenshot({path:process.env.OUT+'/before-'+label+'-card.png'});
      await p.evaluate(id=>document.getElementById(id).disabled=false,styleId);
      const after=await geometry(card);unchanged(before,after);
      fs.writeFileSync(process.env.OUT+'/geometry-'+label+'.json',JSON.stringify({before,after},null,2));
      await card.screenshot({path:process.env.OUT+'/after-'+label+'-card.png'});
      assert(after.width>before.width,'Existing stamp must be enlarged');assert.equal(after.overlaps.length,0,'Stamp ink bounds must not overlap date, week or weather text');
      assert(after.ink.x>=0&&after.ink.y>=0&&after.ink.right<=after.face.width&&after.ink.bottom<=after.face.height,'Stamp ink must stay within its native card');
      await p.screenshot({path:process.env.OUT+'/after-'+label+'-context.png'});
      results.push({label,width,before,after,widthRatio:after.width/before.width,areaRatio:(after.width/before.width)**2});
      console.log(label+': exact native content/artwork, no text collision');
    }
    const records=await p.evaluate(()=>({docs:JSON.parse(JSON.stringify(Object.fromEntries(Object.keys(SYNC_COLLS).map(k=>[k,toDocs(k)])))),queued:Object.values(SYNC.queue||{}).reduce((n,q)=>n+Object.keys(q).length,0),inflight:Object.keys(SYNC.inflight||{}).length}));
    const populated=x=>Object.fromEntries(Object.entries(x).filter(([,v])=>Object.keys(v).length));
    assert.deepEqual(populated(records.docs),populated(frozen.docs));assert.equal(records.queued,0);assert.equal(records.inflight,0);assert.equal(s.counts.blocked,0);assert.equal(s.errors.length,0);assert.equal(s.consoleErrors.length,0);
    fs.writeFileSync(process.env.OUT+'/preview-report.json',JSON.stringify({author:'Andrew Fisher',previewOnly:true,baseline:s.baseline,results,recordsUnchanged:true,counts:s.counts,errors:s.errors,consoleErrors:s.consoleErrors},null,2));
    console.log('PASS: CSS reversibility, native preservation, safe geometry and no operational writes');
  } finally {await s.browser.close();}
})().catch(e=>{if(process.env.OUT)fs.writeFileSync(process.env.OUT+'/failure.txt',e.stack||String(e));console.error(e.message);process.exitCode=1;});
