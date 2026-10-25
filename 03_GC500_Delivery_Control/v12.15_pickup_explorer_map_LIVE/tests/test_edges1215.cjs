/* Author: Andrew Fisher. Inset registration, stale-view and unavailable-imagery export boundaries. */
const fs=require('fs'),path=require('path'),assert=require('assert'),{open}=require('../../toolchain/harness/open_page');
(async()=>{const out=process.env.OUT,h=await open({pageFile:process.env.PAGE,hash:'#sheet/__explorer'}),p=h.page,checks=[];fs.mkdirSync(out,{recursive:true});
const check=(name,ok)=>{checks.push({name,ok:!!ok});fs.writeFileSync(path.join(out,'checks.json'),JSON.stringify(checks,null,2));console.log((ok?'PASS ':'FAIL ')+name);assert(ok,name);};
try{
 await p.waitForFunction(()=>SYNC.status==='live'&&document.querySelector('#expFrame')?.contentWindow?.GC500Area1206?.pickupView1215,null,{timeout:180000});
 const f=p.frames().find(x=>x.url().includes('/explorer/index.html'));
 const original=await f.evaluate(async()=>{
  setMode('original');const rect=GEO.inset.sheet_region_pts,inset=b=>(b[0]+b[2])/2>rect[0]&&(b[0]+b[2])/2<rect[2]&&(b[1]+b[3])/2>rect[1]&&(b[1]+b[3])/2<rect[3];
  const it=ITEMS.find(i=>i.places.some(inset));if(!it)throw Error('No native inset reference');const b=it.places.find(inset),w=ap(GEO.inset.sheet_to_z18px,(b[0]+b[2])/2,(b[1]+b[3])/2),N=512*2**18,ll={lat:Math.atan(Math.sinh(Math.PI*(1-2*w[1]/N)))*180/Math.PI,lon:w[0]/N*360-180};
  window.__edge1215area=GC500Area1206.snapshot({ll});window.__edge1215focus=__edge1215area.rows.find(r=>r.code===it.code);if(!__edge1215focus)throw Error('Inset reference missing from area snapshot');
  const r=await GC500Area1206.pickupPicture1213(__edge1215area,__edge1215focus),im=await createImageBitmap(r.blob),c=document.createElement('canvas');c.width=c.height=3840;const g=c.getContext('2d');g.drawImage(im,0,0);const pixel=[...g.getImageData(1920,1920,1,1).data];im.close();c.width=c.height=1;window.__edge1215target=r.target;
  return {delta:Math.abs(r.target.ll.lat-ll.lat)+Math.abs(r.target.ll.lon-ll.lon),pixel};
 });
 check('original inset pickup point uses the inset registration',original.delta<1e-8);
 check('inset pickup marker is centred on the physical destination',original.pixel[0]===233&&original.pixel[1]===87&&original.pixel[2]===0);
 const stale=await f.evaluate(async()=>{const b=bright;bright+=.01;try{await GC500Area1206.pickupPicture1213(__edge1215area,__edge1215focus);return false;}catch(e){return /Map view changed/.test(e.message);}finally{bright=b;}});
 check('cached picture refuses a changed Explorer style',stale);
 await f.evaluate(()=>setMode('satellite'));await f.waitForFunction(()=>satCanFetch(),null,{timeout:45000});
 const sat=await f.evaluate(async()=>{const s=GC500Area1206.snapshot({ll:__edge1215area.pin.ll}),focus=s.rows.find(r=>r.code===__edge1215focus.code),r=await GC500Area1206.pickupPicture1213(s,focus);return r.view.mode==='satellite'&&JSON.stringify(r.target.ll)===JSON.stringify(__edge1215target.ll);});
 check('satellite export keeps the same physical inset destination',sat);
 const missing=await f.evaluate(async()=>{const old=regionsForTiles;regionsForTiles=()=>[];try{await GC500Area1206.pickupPicture1213(GC500Area1206.snapshot({ll:__edge1215area.pin.ll}));return false;}catch(e){return /Satellite imagery is unavailable/.test(e.message);}finally{regionsForTiles=old;}});
 check('missing satellite coverage fails explicitly without plan substitution',missing);
 check('no page errors or record-write attempts',!h.errors.length&&!h.counts.blocked);
}finally{await h.browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});
