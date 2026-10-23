/* v11.65 on the LIVE service, GET-only: the view link serves the build byte for byte; every one of the 51 takes downloads
   from its hosted address as audio/mpeg with its own byte count and SHA-256; the live page runs the 51-turn programme and a
   press of Broadcast starts turn 1 on the hosted take. Never writes (the harness aborts every non-GET).
     node tests/live_v1165.cjs build/GC500_v11.65/GC500_Delivery_Control_hosted.html            */
const fs=require('fs'),path=require('path'),crypto=require('crypto'),{execFileSync}=require('child_process');
const ROOT=path.resolve(__dirname,'..','..');
module.paths.unshift(path.join(ROOT,'toolchain/node_modules'));
const {open}=require(path.join(ROOT,'toolchain/harness/open_page.js'));
const HOST='https://gc500-production.up.railway.app';
const build=process.argv[2]||path.join(ROOT,'build/GC500_v11.65/GC500_Delivery_Control_hosted.html');
const takes=JSON.parse(fs.readFileSync(path.join(__dirname,'..','takes','takes.json'),'utf8'));
let pass=0,fail=0;const ok=(c,m)=>{if(c)pass++;else{fail++;console.log('  FAIL',m);}};
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const get=u=>execFileSync('curl',['-sS','-f','--max-time','120',u],{maxBuffer:64<<20});
const head=u=>execFileSync('curl',['-sS','-f','-I','--max-time','60',u]).toString();
(async()=>{
 const want=sha(fs.readFileSync(build));
 const live=get(HOST+'/v/Coates-GC500-2026/');
 ok(sha(live)===want,'the view link serves the build byte for byte ('+sha(live).slice(0,12)+' vs '+want.slice(0,12)+')');
 const h=await open({hash:'#progress',W:1440,H:900});const p=h.page;
 await p.waitForFunction(()=>typeof SYNC==='object'&&SYNC.status==='live'&&SYNC.first&&SYNC.first.size===Object.keys(SYNC_COLLS).length,null,{timeout:240000});await p.waitForTimeout(3000);
 const r=await p.evaluate(()=>{const ts=bcTurns();showOpen();BC.ran=5;const started=bcStart();const at=BC.i;
  const pl=BC.player918;const el=pl instanceof HTMLMediaElement?pl:(pl&&Object.values(pl).find(v=>v instanceof HTMLMediaElement));const src=el?el.currentSrc||el.src:'';bcStop();showClose();
  return {n:ts.length,urls:ts.map(t=>({slot:t.slot,url:new URL(t.audio,location.href).href,sha:t.sha256,bytes:t.bytes})),started,at,src,
   footer:/· v11\.65/.test(document.body.innerText)||/· v11\.65'/.test(document.documentElement.outerHTML)};});
 ok(r.n===51,'live programme has 51 turns; got '+r.n);
 ok(r.started===true&&r.at===1,'a press of Broadcast starts at turn 1');
 ok(r.src===r.urls[0].url,'the player is on turn 1\'s hosted take');
 ok(r.footer,'footer v11.65');
 let good=0;const bad=[];
 for(const t of r.urls){
  const k=takes.find(x=>x.slot===t.slot);
  try{const hd=head(t.url);const b=get(t.url);
   const fine=/^HTTP\/[\d.]+ 200/m.test(hd)&&/content-type:\s*audio\/mpeg/i.test(hd)&&b.length===t.bytes&&sha(b)===t.sha&&k&&k.sha256===t.sha;
   if(fine)good++;else bad.push(t.slot);}catch(e){bad.push(t.slot+':'+String(e).slice(0,60));}
 }
 ok(good===51,'all 51 takes answer 200 audio/mpeg with their bytes and SHA-256; bad: '+bad.join(','));
 ok(h.errors.length===0,'no page errors: '+JSON.stringify(h.errors).slice(0,300));
 ok(h.counts.blocked===0,'no writes attempted');
 await h.browser.close();
 console.log(`live_v1165: ${pass} passed, ${fail} failed`);process.exit(fail?1:0);
})().catch(e=>{console.error(String(e).slice(0,600));process.exit(1);});
