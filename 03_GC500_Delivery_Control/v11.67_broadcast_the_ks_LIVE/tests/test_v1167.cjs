/* v11.67 the kilometres in the race call: turns 2, 28, 35 and 43 re-voiced with the record's own distances; the programme on the page is the 51 takes, each over the scene it names, media table and
   manifest agree, the Crew Showcase programme object follows it, every press starts at the welcome. Read-only: opens the
   built page from file:// and reads; never writes to the service.
     node tests/test_v1167.cjs build/GC500_v11.67/GC500_Delivery_Control_hosted.html            */
const fs=require('fs'),path=require('path'),crypto=require('crypto');
const ROOT=path.resolve(__dirname,'..','..');
module.paths.unshift(path.join(ROOT,'toolchain/node_modules'));
const {open}=require(path.join(ROOT,'toolchain/harness/open_page.js'));
const page=process.argv[2]||path.join(ROOT,'build/GC500_v11.67/GC500_Delivery_Control_hosted.html');
const V65=path.join(__dirname,'..','..','v11.65_broadcast_the_team_LIVE');
const CH=JSON.parse(fs.readFileSync(path.join(__dirname,'..','turns_changes.json'),'utf8')).turns;
const script=JSON.parse(fs.readFileSync(path.join(V65,'turns.json'),'utf8'));
script.turns.forEach(t=>{const c=CH.find(x=>x.slot===t.slot);if(c)t.text=c.text;});
const t65=JSON.parse(fs.readFileSync(path.join(V65,'takes','takes.json'),'utf8')),t66=JSON.parse(fs.readFileSync(path.join(__dirname,'..','takes','takes.json'),'utf8'));
const takes=t65.map(k=>t66.find(x=>x.slot===k.slot)||k);
const OLD=t65.filter(k=>CH.some(c=>c.slot===k.slot)).map(k=>k.sha256);
const REV=CH.map(c=>c.slot);
let pass=0,fail=0;const ok=(c,m)=>{if(c)pass++;else{fail++;console.log('  FAIL',m);}};
function canonical(v){if(Array.isArray(v))return '['+v.map(canonical).join(',')+']';if(v&&typeof v==='object')return '{'+Object.keys(v).sort().map(k=>JSON.stringify(k)+':'+canonical(v[k])).join(',')+'}';return JSON.stringify(v);}
(async()=>{
 const html=fs.readFileSync(page,'utf8');
 const i=html.indexOf('const DATA = '),j=html.indexOf('\n',i);const DATA=JSON.parse(html.slice(i+13,j-1));
 /* static: DATA */
 const B=DATA.broadcast;
 ok(B.schema==='gc500-broadcast-v2','schema v2');
 ok(B.turns.length===51,'51 turns');
 ok(B.turns.every((t,n)=>t.slot===n+1),'slots 1..51 in order');
 /* the page's transcript follows the v5.97 rule: the name becomes "the project manager" (turns 4 and 47 are written so they read cleanly) */
 const transcript=(slot,text)=>(slot===4?text.replace('the project manager — Andrew Fisher!','the project manager!'):slot===47?text.replace('Andrew Fisher! Aaron Zelvis!','The project manager! Aaron Zelvis!'):text).replace(/\bAndrew Fisher\b/g,'the project manager');
 ok(B.turns.every(t=>t.text===transcript(t.slot,script.turns.find(s=>s.slot===t.slot).text)),'texts are the script (transcript rule applied)');
 ok(B.turns[3].text.startsWith('[race-caller, warm] Running the Coates show on site — the project manager! [fast]')&&B.turns[46].text.startsWith('[race-caller, naming them] The project manager! Aaron Zelvis!'),'turns 4 and 47 transcripts read cleanly');
 ok(!B.turns.some(t=>/Andrew Fisher/.test(t.text)),'no full name in the transcript (v5.97 rule)');
 ok(['Aaron Zelvis','Kyle Gover','Alfie Harris','Daniel Gough','Jayden Paul','Wayne Crimmin','Ludwig Chee','Frank Devilles','Wayne Woods','Owen Cowell McPaul','Daniel Macleod','Cody Woods','Chase Hireni','Tahi Peni','Daniel Smith','Scott Hildebrand','Hayden McAvoy','Rob Simmons'].every(n=>B.turns.some(t=>t.text.includes(n))),'every person named in the programme');
 ok(B.turns.every(t=>t.audio&&t.audio.media===t.sha256&&DATA.media[t.sha256]&&DATA.media[t.sha256].file===t.sha256+'.mp3'&&DATA.media[t.sha256].bytes===t.bytes),'every turn names its take in the media table');
 ok(B.turns.every(t=>{const k=takes.find(x=>x.slot===t.slot);return k&&k.sha256===t.sha256&&k.bytes===t.bytes&&Math.abs(k.measured_s-t.secs)<0.05;}),'take sha, bytes and length match the mixed takes');
 ok(B.turns.filter(t=>t.loop).length===1&&B.turns[50].loop===true,'only turn 51 loops');
 ok(B.turns.every(t=>!t.standin&&t.voice==='GC500 Race Caller'),'no stand-ins, one voice');
 ok(B.about.have===51&&B.about.of===51&&B.about.standins===0,'about 51/51');
 ok(Math.abs(B.about.body_s-B.turns.filter(t=>!t.loop).reduce((a,t)=>a+t.secs,0))<0.05,'body length is the sum of the body takes');
 const audio=Object.values(DATA.media).filter(m=>m.type==='audio/mpeg');
 ok(audio.length===58,'58 audio files in the media table (51 takes + 7 effects); got '+audio.length);
 ok(OLD.length===4&&OLD.every(s=>!html.includes(s)),'the four replaced v11.65 takes are gone from the page');
 ok(B.turns.filter(t=>t.revoiced==='2026-10-24-ks').map(t=>t.slot).join()===REV.join(),'exactly turns '+REV.join()+' re-voiced');
 ok(/THIRTEEN POINT TWO KILOMETRES of temporary fence put in!/.test(B.turns[27].text)&&/eighty-seven and a half metres/.test(B.turns[27].text)&&/five hundred and seventy metres MORE/.test(B.turns[27].text)&&!/standing/.test(B.turns[27].text),'turn 28: 13.2 km put in, 13,187.5 m, 570 m over');
 ok(/TWENTY POINT SEVEN kilometres/.test(B.turns[34].text)&&/seven point two of crowd control/.test(B.turns[34].text)&&/four point four K of scrim/.test(B.turns[34].text),'turn 35: 20.7 km, 7.2 CCB, 4.4 scrim');
 ok(/Thirteen point two kilometres of fence! Seven point two of crowd control! Four point four of scrim!/.test(B.turns[42].text)&&/Twenty point seven kilometres of fence and crowd control/.test(B.turns[42].text),'turn 43: 13.2, 7.2, 4.4, 20.7');
 ok(/More than twenty kilometres of fence and crowd control/.test(B.turns[1].text),'turn 2: more than 20 km of fence and crowd control');
 ok(B.turns[31].text.includes('Seven point two kilometres of crowd-control barrier')&&B.turns[32].text.includes('Four point four kilometres of scrim'),'turns 32 and 33 (CCB 7.2 km, scrim 4.4 km) unchanged');
  ok(Object.keys(DATA.media).length===1999&&Object.keys(DATA.media).length<=2000,'1,999 media files, inside the service limit of 2,000; got '+Object.keys(DATA.media).length);
 const assets=Object.values(DATA.media).map(m=>({bytes:m.bytes,file:m.file,scope:m.scope,sha256:m.sha256,type:m.type})).sort((a,b)=>a.file<b.file?-1:a.file>b.file?1:0);
 const digest=crypto.createHash('sha256').update(canonical({schema:'gc500-media-v1',assets})).digest('hex');
 ok(DATA.hostedMedia.manifest===digest,'hostedMedia.manifest is the digest of the media table');
 const manPath=path.join(path.dirname(page),'media_manifest_v1167.json');
 const man=JSON.parse(fs.readFileSync(manPath,'utf8'));
 ok(man.sha256===digest&&man.assets.length===assets.length,'media_manifest_v1167.json carries the same digest and count');
 ok(B.turns.filter(t=>REV.includes(t.slot)).every(t=>{const f=path.join(path.dirname(page),'media_v1167',t.sha256+'.mp3');return fs.existsSync(f)&&crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex')===t.sha256;}),'media_v1167/ holds the four new takes under their sha');
 ok(/· v11\.67'; \/\* v8\.19 release922/.test(html),'footer v11.67');
 ok(!/via (Claude|Codex)|Claude Code|OpenAI|ChatGPT/.test(html.slice(i+13,j)),'no agent names in DATA');
 /* live: the page */
 const h=await open({pageFile:page,hash:'#progress',W:1440,H:900});const p=h.page;
 await p.waitForFunction(()=>typeof SYNC==='object'&&SYNC.status==='live'&&SYNC.first&&SYNC.first.size===Object.keys(SYNC_COLLS).length,null,{timeout:240000});await p.waitForTimeout(3000);
 const r=await p.evaluate(()=>{
  const V=RaceDayBroadcast1111,api=CrewShowcase1090,ts=bcTurns();
  const loopWas=SHOW.loop;SHOW.loop=false;
  const chain=[];let s=1;for(let n=0;n<60&&s>0;n++){chain.push(s);s=bcNextSlot(s);}
  const end50=bcNextSlot(50);SHOW.loop=true;const after50=bcNextSlot(50),after51=bcNextSlot(51);SHOW.loop=loopWas;
  return {present:!!V,turns:ts.length,sameObject:api.broadcast.turns===ts,
   audioUrls:ts.every(t=>typeof t.audio==='string'&&/^\/m\/[^/]+\/[a-f0-9]{64}\.mp3$/.test(t.audio)),
   scenes:ts.map(t=>bcScenes()[t.slot]),orderOk:ts.every(t=>SHOW_ORDER.includes(bcScenes()[t.slot])),
   distinct:new Set(ts.map(t=>bcScenes()[t.slot])).size,chain,after50,after51,end50,first:api.broadcast.first,bodyLast:api.broadcast.bodyLast,loopFirst:api.broadcast.loopFirst,
   label:bcLabel(false),have:bcHave(),smooth:typeof ShowcaseSmooth1110,order:SHOW_ORDER.length,
   secsMin:Math.min(...ts.map(t=>t.secs)),secsMax:Math.max(...ts.map(t=>t.secs)),
   km:bcScenes()[28],complete:bcScenes()[42],site:bcScenes()[44],finish:bcScenes()[49],
   titles:ts.every(t=>typeof SHOW_TITLE[bcScenes()[t.slot]]==='string')};
 });
 ok(r.present,'RaceDayBroadcast1111 installed');
 ok(r.turns===51&&r.sameObject,'bcTurns() is the 51-turn programme object');
 ok(r.audioUrls,'every take resolved to a hosted media URL');
 ok(r.orderOk&&r.titles,'every scene named is in SHOW_ORDER with a title');
 ok(r.distinct===25,'all 25 Showcase scenes spoken; got '+r.distinct);
 ok(r.chain.join(',')===Array.from({length:50},(_,n)=>n+1).join(','),'without Loop the programme runs 1..50 and stops; got '+r.chain.join(','));
 ok(r.end50===-1090,'after 50 with Loop off: stop');
 ok(r.after50===51&&r.after51===3,'with Loop on: 50 -> 51 (loop opener) -> 3 (settle in; never the welcome again)');
 ok(r.first===1&&r.bodyLast===50&&r.loopFirst===51,'first 1, bodyLast 50, loopFirst 51');
 ok(r.have&&r.label==='Broadcast','Broadcast button, no stand-in note');
 ok(r.smooth==='object'&&r.order===25,'v11.10 smooth module present, 25 scenes');
 ok(r.km==='fence_length1090'&&r.complete==='complete'&&r.site==='site'&&r.finish==='crews_finish1090','turn 28 over the kilometre card, 42 complete, 44 site, 49 crews finish');
 ok(r.secsMin>4&&r.secsMax<40,'take lengths 4-40 s; got '+r.secsMin+'-'+r.secsMax);
 /* a press starts at the welcome even after a run */
 const start=await p.evaluate(()=>{showOpen();BC.ran=7;const was=bcStart();const at=BC.i;bcStop();showClose();return {was,at,ran:BC.ran};});
 ok(start.was===true&&start.at===1&&start.ran===0,'bcStart begins at turn 1 after a previous run; got '+JSON.stringify(start));
 ok(h.errors.length===0,'no page errors: '+JSON.stringify(h.errors).slice(0,300));
 await h.browser.close();
 console.log(`test_v1167: ${pass} passed, ${fail} failed`);process.exit(fail?1:0);
})().catch(e=>{console.error(String(e).slice(0,600));process.exit(1);});
