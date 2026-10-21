/* v11.13 (built from the v11.12 test): turn 30 re-voiced with the fencing crew named; the other 32 takes are v11.12's. Earlier note - the eleven re-voiced takes are on the page, the other 22 are v11.11's, media table and manifest agree, the Crew Showcase programme still follows, the servicing glow style is in, every press starts at the welcome. Read-only. Original note - the programme on the page is the 33 takes, each over the scene it names, media table and
   manifest agree, the Crew Showcase programme object follows it, every press starts at the welcome. Read-only: opens the
   built page from file:// and reads; never writes to the service.
     node tests/test_broadcast1111.cjs build/GC500_v11.13/GC500_Delivery_Control_hosted.html            */
const fs=require('fs'),path=require('path'),crypto=require('crypto');
const ROOT=path.resolve(__dirname,'..','..');
module.paths.unshift(path.join(ROOT,'toolchain/node_modules'));
const {open}=require(path.join(ROOT,'toolchain/harness/open_page.js'));
const page=process.argv[2]||path.join(ROOT,'build/GC500_v11.13/GC500_Delivery_Control_hosted.html');
const script=JSON.parse(fs.readFileSync(path.join(__dirname,'..','turns.json'),'utf8'));
const takes11=JSON.parse(fs.readFileSync(path.join(ROOT,'v11.11_race_day_broadcast_LIVE','takes','takes.json'),'utf8')),takes12=JSON.parse(fs.readFileSync(path.join(ROOT,'v11.12_complete_call_and_servicing_glow_LIVE','takes','takes.json'),'utf8')),takes13=JSON.parse(fs.readFileSync(path.join(__dirname,'..','takes','takes.json'),'utf8'));const REVOICED12=[11,13,14,15,17,18,19,20,21,23,28],REVOICED=[30];const takes=takes11.filter(t=>!REVOICED12.includes(t.slot)&&!REVOICED.includes(t.slot)).concat(takes12).concat(takes13);
let pass=0,fail=0;const ok=(c,m)=>{if(c)pass++;else{fail++;console.log('  FAIL',m);}};
function canonical(v){if(Array.isArray(v))return '['+v.map(canonical).join(',')+']';if(v&&typeof v==='object')return '{'+Object.keys(v).sort().map(k=>JSON.stringify(k)+':'+canonical(v[k])).join(',')+'}';return JSON.stringify(v);}
(async()=>{
 const html=fs.readFileSync(page,'utf8');
 const i=html.indexOf('const DATA = '),j=html.indexOf('\n',i);const DATA=JSON.parse(html.slice(i+13,j-1));
 /* static: DATA */
 const B=DATA.broadcast;
 ok(B.schema==='gc500-broadcast-v2','schema v2');
 ok(B.turns.length===33,'33 turns');
 ok(B.turns.every((t,n)=>t.slot===n+1),'slots 1..33 in order');
 /* the page's transcript follows the v5.97 rule: the name becomes "the project manager" (turn 3 is written so that reads cleanly) */
 const transcript=(slot,text)=>(slot===3?text.replace('the project manager, Andrew Fisher!','Andrew Fisher!'):text).replace(/\bAndrew Fisher\b/g,'the project manager');
 ok(B.turns.every(t=>t.text===transcript(t.slot,script.turns.find(s=>s.slot===t.slot).text)),'texts are the script (transcript rule applied)');
 ok(B.turns[2].text.startsWith('[race-caller, warm] Leading the Coates effort on site — the project manager! [fast]'),'turn 3 transcript reads cleanly');
 ok(B.turns.every(t=>t.audio&&t.audio.media===t.sha256&&DATA.media[t.sha256]&&DATA.media[t.sha256].file===t.sha256+'.mp3'&&DATA.media[t.sha256].bytes===t.bytes),'every turn names its take in the media table');
 ok(B.turns.every(t=>{const k=takes.find(x=>x.slot===t.slot);return k&&k.sha256===t.sha256&&k.bytes===t.bytes&&Math.abs(k.measured_s-t.secs)<0.05;}),'take sha, bytes and length match the mixed takes');
 ok(B.turns.filter(t=>t.loop).length===1&&B.turns[32].loop===true,'only turn 33 loops');
 ok(B.turns.every(t=>!t.standin&&t.voice==='GC500 Race Caller'),'no stand-ins, one voice');
 ok(B.about.have===33&&B.about.of===33&&B.about.standins===0,'about 33/33');
 ok(Math.abs(B.about.body_s-B.turns.filter(t=>!t.loop).reduce((a,t)=>a+t.secs,0))<0.05,'body length is the sum of the body takes');
 const audio=Object.values(DATA.media).filter(m=>m.type==='audio/mpeg');
 ok(audio.length===40,'40 audio files in the media table (33 takes + 7 effects); got '+audio.length);
 ok(!html.includes('9a764cf8dab0fd51cccb591aa4885fa2e4c8afdb2b9c000fff41e9d0b2c71962'),'September take 1 is gone from the page');
 ok(takes11.filter(t=>REVOICED12.includes(t.slot)||REVOICED.includes(t.slot)).every(t=>!html.includes(t.sha256)),'the replaced v11.11 takes are gone from the page');
 ok(B.turns.filter(t=>t.revoiced==='2026-10-22').map(t=>t.slot).join(',')===REVOICED12.join(',')&&B.turns.filter(t=>t.revoiced==='2026-10-22b').map(t=>t.slot).join(',')==='30','the eleven v11.12 turns and turn 30 are marked re-voiced');
 ok(/Wayne Woods! Owen Cowell McPaul! Daniel Macleod! Cody Woods! Chase Hireni! Tahi Peni! Daniel Smith! Scott Hildebrand! Hayden McAvoy!/.test(B.turns[29].text),'turn 30 names the fencing crew');
 ok(html.includes('id="svc1112-glow"')&&html.lastIndexOf('svc1112-glow')>html.lastIndexOf('svc1106-area-glow'),'servicing glow style present, after the servicing styles');
 const assets=Object.values(DATA.media).map(m=>({bytes:m.bytes,file:m.file,scope:m.scope,sha256:m.sha256,type:m.type})).sort((a,b)=>a.file<b.file?-1:a.file>b.file?1:0);
 const digest=crypto.createHash('sha256').update(canonical({schema:'gc500-media-v1',assets})).digest('hex');
 ok(DATA.hostedMedia.manifest===digest,'hostedMedia.manifest is the digest of the media table');
 const manPath=path.join(path.dirname(page),'media_manifest_v1113.json');
 const man=JSON.parse(fs.readFileSync(manPath,'utf8'));
 ok(man.sha256===digest&&man.assets.length===assets.length,'media_manifest_v1113.json carries the same digest and count');
 ok(B.turns.filter(t=>REVOICED.includes(t.slot)).every(t=>{const f=path.join(path.dirname(page),'media_v1113',t.sha256+'.mp3');return fs.existsSync(f)&&crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex')===t.sha256;}),'media_v1113/ holds the eleven new takes under their shas');
 ok(/· v11\.13'; \/\* v8\.19 release922/.test(html),'footer v11.13');
 ok(!/via (Claude|Codex)|Claude Code|OpenAI|ChatGPT/.test(html.slice(i+13,j)),'no agent names in DATA');
 /* live: the page */
 const h=await open({pageFile:page,hash:'#progress',W:1440,H:900});const p=h.page;
 await p.waitForFunction(()=>typeof SYNC==='object'&&SYNC.status==='live'&&SYNC.first&&SYNC.first.size===Object.keys(SYNC_COLLS).length,null,{timeout:240000});await p.waitForTimeout(3000);
 const r=await p.evaluate(()=>{
  const V=RaceDayBroadcast1111,api=CrewShowcase1090,ts=bcTurns();
  const loopWas=SHOW.loop;SHOW.loop=false;
  const chain=[];let s=1;for(let n=0;n<40&&s>0;n++){chain.push(s);s=bcNextSlot(s);}
  const end32=bcNextSlot(32);SHOW.loop=true;const after32=bcNextSlot(32),after33=bcNextSlot(33);SHOW.loop=loopWas;
  return {present:!!V,turns:ts.length,sameObject:api.broadcast.turns===ts,
   audioUrls:ts.every(t=>typeof t.audio==='string'&&/^\/m\/[^/]+\/[a-f0-9]{64}\.mp3$/.test(t.audio)),
   scenes:ts.map(t=>bcScenes()[t.slot]),orderOk:ts.every(t=>SHOW_ORDER.includes(bcScenes()[t.slot])),
   distinct:new Set(ts.map(t=>bcScenes()[t.slot])).size,chain,after32,after33,end32,first:api.broadcast.first,bodyLast:api.broadcast.bodyLast,loopFirst:api.broadcast.loopFirst,
   label:bcLabel(false),have:bcHave(),smooth:typeof ShowcaseSmooth1110,order:SHOW_ORDER.length,
   secsMin:Math.min(...ts.map(t=>t.secs)),secsMax:Math.max(...ts.map(t=>t.secs)),
   twelve:bcScenes()[12],twentyEight:bcScenes()[28],twentyNine:bcScenes()[29],
   titles:ts.every(t=>typeof SHOW_TITLE[bcScenes()[t.slot]]==='string')};
 });
 ok(r.present,'RaceDayBroadcast1111 installed');
 ok(r.turns===33&&r.sameObject,'bcTurns() is the 33-turn programme object');
 ok(r.audioUrls,'every take resolved to a hosted media URL');
 ok(r.orderOk&&r.titles,'every scene named is in SHOW_ORDER with a title');
 ok(r.distinct===24&&!r.scenes.includes('fence_length1090'),'24 distinct scenes spoken, only the kilometre card unspoken; got '+r.distinct);
 ok(r.chain.join(',')===Array.from({length:32},(_,n)=>n+1).join(','),'without Loop the programme runs 1..32 and stops; got '+r.chain.join(','));
 ok(r.end32===-1090,'after 32 with Loop off: stop');
 ok(r.after32===33&&r.after33===3,'with Loop on: 32 -> 33 (loop opener) -> 3 (never the welcome again)');
 ok(r.first===1&&r.bodyLast===32&&r.loopFirst===33,'first 1, bodyLast 32, loopFirst 33');
 ok(r.have&&r.label==='Broadcast','Broadcast button, no stand-in note');
 ok(r.smooth==='object'&&r.order===25,'v11.10 smooth module present, 25 scenes');
 ok(r.twelve==='equipment'&&r.twentyEight==='complete'&&r.twentyNine==='site','turn 12 over equipment, 28 over complete, 29 over site');
 ok(r.secsMin>4&&r.secsMax<36,'take lengths 4-36 s (turn 30 names eighteen people)');
 /* a press starts at the welcome even after a run */
 const start=await p.evaluate(()=>{showOpen();BC.ran=7;const was=bcStart();const at=BC.i;bcStop();showClose();return {was,at,ran:BC.ran};});
 ok(start.was===true&&start.at===1&&start.ran===0,'bcStart begins at turn 1 after a previous run; got '+JSON.stringify(start));
 ok(h.errors.length===0,'no page errors: '+JSON.stringify(h.errors).slice(0,300));
 await h.browser.close();
 console.log(`test_broadcast1113: ${pass} passed, ${fail} failed`);process.exit(fail?1:0);
})().catch(e=>{console.error(String(e).slice(0,600));process.exit(1);});
