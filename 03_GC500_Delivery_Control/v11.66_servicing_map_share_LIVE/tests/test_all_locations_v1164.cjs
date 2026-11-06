// Author: Andrew Fisher. Actual registered map geometry, synthetic empty progress.
// PNGs are checked in memory and discarded; never present these as live progress.
const assert=require('node:assert/strict');
const {open}=require('../../toolchain/harness/open_page');
(async()=>{
 const s=await open({pageFile:process.env.PAGE}),p=s.page;
 try{
  const targets=await p.evaluate(()=>{
   const D=SVC1067_CARD.data,G=SVC1099_MAP_DATA;
   const M={D,S:SvcState,day:'2026-10-23',now:Date.now(),lastRead:Date.now(),events:[],test1164:true,geometry:G};
   const image=new Image();image.src=G.detailImage||G.image;
   window.__locationAudit={M,G,I:{detailImage:image}};
   return D.areas.flatMap(a=>[{kind:'area',id:String(a.n)},...a.refs.map(r=>({kind:'ref',id:r.ref}))]);
  });
  let references=0,areas=0,registeredPoints=0,rendered=0;const missing=new Set();
  for(const target of targets){
   const result=await p.evaluate(async target=>{
    const {M,G,I}=__locationAudit,snap=SvcShare1164.snapshot(M,G,target),seen=new Set(),missing=[];
    for(const a of M.D.areas)for(const r of a.refs){
     if(target.kind==='ref'?r.ref!==target.id:String(a.n)!==target.id)continue;
     const out=snap.refs.find(x=>x.ref===r.ref);
     for(const line of r.lines){
      if(!SvcState.tasksFor(M.D,line,M.day).length)continue;
      const source=G.refs[r.ref]?.lines?.[line.id]?.point;
      if(source){if(!out.points.some(q=>q.x===source.x&&q.y===source.y))throw Error('Recorded position lost');seen.add(line.id);}
      else {missing.push(line.id);if(!out.missing)throw Error('Missing position not disclosed');}
     }
    }
    // Observe the actual canvas drawing, not a second rendering implementation.
    const proto=CanvasRenderingContext2D.prototype,draw=proto.drawImage,arc=proto.arc;
    let transform=null,anchors=[];
    proto.drawImage=function(...args){if(args.length===9)transform=args.slice(1);return draw.apply(this,args);};
    proto.arc=function(x,y,r,...rest){if(r===5)anchors.push({x,y});return arc.call(this,x,y,r,...rest);};
    let blob;
    try{blob=await SvcShare1164.picture(snap,G,I);}finally{proto.drawImage=draw;proto.arc=arc;}
    if(!blob||blob.type!=='image/png'||blob.size<10000||!transform)throw Error('PNG did not render');
    const image=I.detailImage;await image.decode();
    const [sx,sy,sw,sh,dx,dy,dw,dh]=transform;
    for(const r of snap.outstanding)for(const q of r.points){
     const px=(q.x-G.rect[0])/(G.rect[2]-G.rect[0])*image.naturalWidth;
     const py=(q.y-G.rect[1])/(G.rect[3]-G.rect[1])*image.naturalHeight;
     const x=dx+(px-sx)*dw/sw,y=dy+(py-sy)*dh/sh;
     if(!anchors.some(a=>Math.abs(a.x-x)<.01&&Math.abs(a.y-y)<.01))throw Error('Rendered anchor moved from registered position');
     if(x<dx-.01||x>dx+dw+.01||y<dy-.01||y>dy+dh+.01)throw Error('Registered anchor outside closer view');
    }
    return {points:seen.size,missing,bytes:blob.size};
   },target);
   rendered++;
   if(target.kind==='ref'){references++;registeredPoints+=result.points;result.missing.forEach(x=>missing.add(x));}else areas++;
   if(rendered%10===0)console.error('Rendered geometry checks:',rendered,'of',targets.length);
  }
  assert.equal(references,75);assert.equal(registeredPoints,82);
  assert.deepEqual([...missing].sort(),['WC100-FWFTRAIL','WC85-FWF']);
  assert.equal(s.errors.length,0);assert.equal(s.counts.blocked,0);
  console.log(JSON.stringify({references,areas,registeredPoints,rendered,missingPositionsExplicit:missing.size,exactCanvasAnchors:true,errors:s.errors,blockedWrites:s.counts.blocked}));
 }finally{await s.browser.close();}
})().catch(e=>{console.error(e.stack);process.exit(1);});
