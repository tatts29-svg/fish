/* v11.71: both McAvoys spelt "McAvoy" on the page; the crew is still ten; the fencing scene and broadcast unchanged otherwise.
   Opens the build (or, with LIVE=1, the live page) read-only; never writes.  node tests/test_v1171.cjs build/GC500_v11.71/GC500_Delivery_Control_hosted.html */
const fs=require('fs'),path=require('path');
const ROOT=path.resolve(__dirname,'..','..');
module.paths.unshift(path.join(ROOT,'toolchain/node_modules'));
const {open}=require(path.join(ROOT,'toolchain/harness/open_page.js'));
const page=process.argv[2]||path.join(ROOT,'build/GC500_v11.71/GC500_Delivery_Control_hosted.html');
let pass=0,fail=0;const ok=(c,m)=>{if(c)pass++;else{fail++;console.log('  FAIL',m);}};
(async()=>{
 const html=fs.readFileSync(page,'utf8');const i=html.indexOf('const DATA = '),j=html.indexOf('\n',i);const DATA=JSON.parse(html.slice(i+13,j-1));
 const F=DATA.team.people.filter(p=>p.group==='fencing');
 ok(!html.includes('Mcavoy'),'no "Mcavoy" left on the page');
 ok(F.length===10&&F[8].name==='Hayden McAvoy'&&F[9].name==='Alonzo McAvoy','crew ten; Hayden McAvoy then Alonzo McAvoy');
 ok(/added by the project manager on 8 Oct 2026/.test(F[8].about)&&F[8].event_role==='Fencing crew'&&F[8].company==='Advanced Temporary Fencing','Hayden\'s line otherwise unchanged');
 ok(DATA.broadcast.turns.length===51&&DATA.broadcast.turns[24].text.includes('Hayden McAvoy! Alonzo McAvoy!'),'broadcast unchanged (turn 25 names both)');
 ok(/· v11\.71'; \/\* v8\.19 release922/.test(html),'footer v11.71');
 const h=await open(process.env.LIVE?{hash:'#today'}:{pageFile:page,hash:'#today'});const p=h.page;
 await p.waitForFunction(()=>typeof SYNC==='object'&&SYNC.status==='live'&&SYNC.first&&SYNC.first.size===Object.keys(SYNC_COLLS).length,null,{timeout:240000});await p.waitForTimeout(3000);
 const sc=await p.evaluate(()=>{const d=document.createElement('div');d.innerHTML=showScene('fencing',todayIso());return d.innerText.replace(/\s+/g,' ');});
 ok(sc.includes('Hayden McAvoy')&&sc.includes('Alonzo McAvoy')&&!sc.includes('Mcavoy'),'the fencing scene shows Hayden McAvoy and Alonzo McAvoy');
 ok(/10 names from the project record: 8 as the crew.s sign-on sheet reads, in its order, and 2 added by the project manager on 8 Oct 2026 and 24 Oct 2026/.test(sc),'the scene still counts ten (eight off the sheet, two added)');
 ok(h.errors.length===0,'no page errors: '+JSON.stringify(h.errors).slice(0,200));ok(h.counts.blocked===0,'no writes attempted');
 await h.browser.close();console.log(`test_v1171: ${pass} passed, ${fail} failed`);process.exit(fail?1:0);
})().catch(e=>{console.error(String(e).slice(0,500));process.exit(1);});
