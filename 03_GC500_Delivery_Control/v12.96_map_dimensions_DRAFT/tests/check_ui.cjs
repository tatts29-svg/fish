/* Author: Andrew Fisher. Read-only map and Demob size presentation. */
const fs=require('fs'),assert=require('assert/strict');
const {open}=require('../../toolchain/harness/open_page');
(async()=>{const out=process.env.OUT;fs.mkdirSync(out,{recursive:true});
 const s=await open({pageFile:process.env.PAGE,hash:'#map',W:390,H:844,mobile:true,dpr:1});
 try{const p=s.page;await p.waitForFunction(()=>typeof go==='function');await p.evaluate(()=>go('map'));
  await p.waitForFunction(()=>document.getElementById('expFrame')?.contentWindow?.GC500StillOnSite1290?.state.ready,null,{timeout:60000});
  const f=p.frames().find(f=>f.url().includes('/explorer/index.html'));
  await p.evaluate(()=>expFullToggle(true));
  const item=await f.evaluate(()=>{
   const rows=GC500StillOnSite1290.state.refs;const r=rows.find(r=>r.mapped&&parent.MapDimensions1296.compact(parent.MapDimensions1296.read(r.key,true)));
   if(!r)throw Error('No native located reference has an available dimension');return {key:r.key,code:r.codes[0]};
  });
  await f.locator('#still-onsite1290').tap();
  await f.evaluate(it=>GC500Search1210.select(it.code,0),item);
  try{await f.waitForFunction(it=>GC500Departure1211.markers1288.some(q=>q.code===it.code&&q.dimension&&q.tag.length),item,{timeout:30000});}catch(e){fs.writeFileSync(out+'/diagnostic.json',JSON.stringify(await f.evaluate(it=>({item:it,points:GC500Departure1211.markers1288,row:GC500StillOnSite1290.row(it.code),expected:parent.MapDimensions1296.read(it.key,true)}),item)));await p.screenshot({path:out+'/diagnostic.png'});throw e;}
  await f.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
  const labels=await f.evaluate(it=>{const q=GC500Departure1211.markers1288.find(q=>q.code===it.code);return {text:q.dimension,expected:parent.MapDimensions1296.compact(parent.MapDimensions1296.read(it.key,true)),tags:q.tag,width:innerWidth,sw,dpr,canvasWidth:canvas.width,overlayWidth:document.getElementById('offsite1225').width,fit:q.tag.every(t=>t.x>=0&&t.x+t.w<=innerWidth+1)};},item);
  fs.writeFileSync(out+'/labels.json',JSON.stringify(labels));
  await p.screenshot({path:out+'/map-phone.png'});
  assert.equal(labels.text,labels.expected);assert(labels.fit);
  await f.locator('#still-onsite-list1290').tap();await f.locator('[data-close]').tap();
  // Open the real Demob component against the native reference at its actual plan position.
  await f.evaluate(it=>{const row=ITEMS.find(r=>r.code===it.code),b=row.places[0],ll=GC500Spot1117.sheetToLL((b[0]+b[2])/2,(b[1]+b[3])/2);
   const area=GC500Area1206.snapshot({ll,at:new Date()});if(!area?.rows.some(r=>r.code===it.key))throw Error('Reference absent from actual map area');window.GC500Demob1211.open(area);
  },item);
  const result=await f.evaluate(()=>{const p=document.getElementById('demob1211');return {visible:!p.hidden,size:p.querySelector('.dimensions1296')?.innerText,fit:p.scrollWidth<=p.clientWidth+1};});
  assert(result.visible);assert(result.size?.includes('Dimensions per unit:'));assert(result.fit);
  await f.locator('#demob1211').screenshot({path:out+'/demob-phone.png'});
  await f.locator('#demob1211 [data-close]').tap();assert(await f.locator('#demob1211').isHidden());
  assert.equal(s.errors.length,0);assert.equal(s.counts.blocked,0);
  fs.writeFileSync(out+'/result.json',JSON.stringify({passed:true,mapDimensions:true,demobDimensions:true,phoneFit:true,errors:0,writes:0},null,2));
  console.log('PASS map dimensions, Demob quantity dimensions, phone fit, list retained, close, zero errors/writes');
 }finally{await s.browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
