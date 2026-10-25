/* Author: Andrew Fisher. Native Explorer modes and map export integrity; no service writes. */
const fs=require('fs'),path=require('path'),assert=require('assert'),crypto=require('crypto'),{open}=require('../../toolchain/harness/open_page');
(async()=>{const out=process.env.OUT,h=await open({pageFile:process.env.PAGE,hash:'#sheet/__explorer'}),p=h.page,checks=[];fs.mkdirSync(out,{recursive:true});
function check(name,ok){checks.push({name,ok:!!ok});fs.writeFileSync(path.join(out,'checks.json'),JSON.stringify(checks,null,2));console.log((ok?'PASS ':'FAIL ')+name);assert(ok,name);}
try{
 await p.waitForFunction(()=>SYNC.status==='live'&&document.querySelector('#expFrame')?.contentWindow?.GC500Area1206?.pickupView1215,null,{timeout:180000});
 const f=p.frames().find(x=>x.url().includes('/explorer/index.html'));await f.evaluate(()=>{const it=ITEMS.find(i=>i.places.length&&parent.MapDemob1211.reference(i.code)?.items.some(x=>/building/i.test(x.type)&&x.units.length));if(!it)throw new Error('No mapped building');window.__map1215item=it;window.__map1215ll=b=>{const x=(b[0]+b[2])/2,y=(b[1]+b[3])/2,R=GEO.inset&&x>=GEO.inset.sheet_region_pts[0]&&x<=GEO.inset.sheet_region_pts[2]&&y>=GEO.inset.sheet_region_pts[1]&&y<=GEO.inset.sheet_region_pts[3]?GEO.inset:GEO.main,w=ap(R.sheet_to_z18px,x,y),N=512*2**18;return {lat:Math.atan(Math.sinh(Math.PI*(1-2*w[1]/N)))*180/Math.PI,lon:w[0]/N*360-180};};GC500Search1210.search(it.code);GC500Search1210.select(it.code,0);});
 await f.waitForFunction(()=>!zAnim&&!gotoAnim887&&!interacting,{},{timeout:30000});
 const hashes=[];
 for(const mode of ['original','hybrid','satellite']){
  await f.evaluate(m=>setMode(m),mode);if(mode!=='original')await f.waitForFunction(()=>satCanFetch(),null,{timeout:45000});
  const r=await f.evaluate(async()=>{const it=__map1215item,b=it.places[0],ll=__map1215ll(b),area=GC500Area1206.snapshot({ll}),focus=area.rows.find(x=>x.code===it.code),before=JSON.stringify([camera,dpr,canvas.width,canvas.height,mcanvas.width,mcanvas.height,mode,opacity,bright,insetOn,legendOn]);
   const result=await GC500Area1206.pickupPicture1213(area,focus),im=await createImageBitmap(result.blob),answer={view:result.view,dimensions:[im.width,im.height],target:result.target,unchanged:before===JSON.stringify([camera,dpr,canvas.width,canvas.height,mcanvas.width,mcanvas.height,mode,opacity,bright,insetOn,legendOn]),bytes:Array.from(new Uint8Array(await result.blob.arrayBuffer()))};im.close();return answer;});
  fs.writeFileSync(path.join(out,mode+'.png'),Buffer.from(r.bytes));hashes.push(crypto.createHash('sha256').update(Buffer.from(r.bytes)).digest('hex'));
  check(mode+' map uses the active Explorer mode',r.view.mode===mode);check(mode+' map retains 3840-pixel detail',r.dimensions[0]===3840&&r.dimensions[1]===4160);check(mode+' export leaves viewer camera and canvases unchanged',r.unchanged);
 }
 check('all three actual Explorer map layers produce distinct exports',new Set(hashes).size===3);
 await f.evaluate(()=>{camera.rot=19;changeView(false);});await f.waitForFunction(()=>!zAnim&&!interacting,null,{timeout:30000});
 const rotated=await f.evaluate(async()=>{const b=__map1215item.places[0],area=GC500Area1206.snapshot({ll:__map1215ll(b)}),r=await GC500Area1206.pickupPicture1213(area,area.rows.find(x=>x.code===__map1215item.code));return r.view.rotation===19&&camera.rot===19;});check('selected Explorer rotation is retained without rotating the viewer',rotated);
 check('no page errors or record-write attempts',!h.errors.length&&!h.counts.blocked);
 await p.screenshot({path:path.join(out,'explorer-after.png')});
}finally{await h.browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});
