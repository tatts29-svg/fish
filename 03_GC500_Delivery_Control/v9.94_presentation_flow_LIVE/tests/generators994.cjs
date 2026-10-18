/* Author: Andrew Fisher. Read-only generator identity, destination and shared-view checks. */
const fs=require('fs'),path=require('path'),Module=require('module'),assert=require('node:assert/strict');
const harness=path.resolve(__dirname,'../../toolchain/harness/open_page.js');
const m=new Module(harness,module);m.filename=harness;m.paths=Module._nodeModulePaths(path.dirname(harness));
// Map transport is an explicit local fixture. Every operational write stays blocked.
let hs=fs.readFileSync(harness,'utf8').replace(/const okPost = [^;]+;/,`if(r.method()==='POST'&&new URL(u).origin==='https://tile.googleapis.com'&&new URL(u).pathname==='/v1/createSession'){counts.localMapSessions=(counts.localMapSessions||0)+1;return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({session:'local-readonly-fixture',expiry:String(Math.floor(Date.now()/1000)+600),tileWidth:256,tileHeight:256,imageFormat:'png'})});} if(r.method()==='GET'&&new URL(u).origin==='https://tile.googleapis.com'&&new URL(u).pathname.startsWith('/v1/2dtiles/'))return route.fulfill({status:200,contentType:'image/png',body:Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aPt8AAAAASUVORK5CYII=','base64')}); const okPost=false;`);
m._compile(hs,harness);require.cache[harness]=m;
const {open}=require(harness),mobile=process.env.MOB==='1';
const out=process.env.OUTDIR||'/workspace/private-gc500-audit994/generator-browser-'+(mobile?'phone':'desktop');
fs.mkdirSync(out,{recursive:true});const evidence={author:'Andrew Fisher',mobile,checks:[],mapFixture:'Local tile/session only, no project data fixture'};
function check(value,name){evidence.checks.push({name,pass:!!value});assert(value,name);}
(async()=>{let h;try{
 h=await open({pageFile:process.env.PAGE,hash:'#day/2026-10-12',W:mobile?390:1440,H:mobile?844:960,mobile,dpr:1});const p=h.page;
 await p.waitForFunction(()=>SYNC.status==='live'&&SYNC.first.size===Object.keys(SYNC_COLLS).length&&DOCS.state==='ready',null,{timeout:150000});
 const before=await p.evaluate(()=>({record:JSON.stringify(S),money:JSON.stringify(pl770Model()),map:JSON.stringify(MASTER_LOC),data:JSON.stringify(DATA)}));
 const facts=await p.evaluate(()=>{
  state.day='2026-10-12';go('timeline');renderTimeline();
  const day=programmeDays().find(d=>d.iso==='2026-10-12'),groups=dpLoads(day);
  const concert=groups.filter(g=>g.rows.some(r=>r.a.key==='GN?')).map(g=>({dd:g.dds,time:g.time,rows:g.rows.map(r=>({key:r.a.key,nums:dpNums(r.a),quantity:r.events[0].quantity_raw}))}));
  const a=assetOf('GN13'),d=destinationOf(a),target=dest782(a);
  return {concert,gn13:{label:d.text,source:d.source,nums:assetNumbersOf(a),target},concertTarget:dest782(assetOf('GN?'))};
 });evidence.facts=JSON.parse(JSON.stringify(facts,(k,v)=>k==='a'||k==='nt'?undefined:v));
 check(JSON.stringify(facts.concert.map(g=>[g.dd,g.time,g.rows[0].key,g.rows[0].nums,g.rows[0].quantity]))===JSON.stringify([
  [['26121298'],'11:00','GN?',['1316182'],1],[['26121310'],'11:30','GN?',['1316183'],1]
 ]),'One asset per exact delivery docket and load time');
 check(facts.gn13.label==='SLS Equipment Compound · Narrowneck','GN13 names the source-proved orange-symbol destination');
 check(facts.gn13.nums.includes('1261271')&&facts.gn13.target.ll.lat===-27.9883915&&facts.gn13.target.ll.lon===153.4300855,'GN13 identity and approved coordinates retained');
 check(!facts.concertTarget||facts.concertTarget.kind==='report','No invented exact Concert pin');
 const loadCards=p.locator('#pane-timeline [data-tl841-ref="GN?"]');
 check(await loadCards.count()===2,'Both Concert loads rendered with the original data key');
 const cardText=await loadCards.allTextContents();
 check(cardText.every(t=>/Concert\s*generators/.test(t)&&t.includes('Exact map position not recorded')),'Clear Concert name and physical-location gap on each card');
 check(cardText[0].includes('1316182')&&!cardText[0].includes('1316183')&&cardText[1].includes('1316183')&&!cardText[1].includes('1316182'),'Displayed asset numbers are scoped to their loads');
 await loadCards.first().scrollIntoViewIfNeeded();await p.screenshot({path:path.join(out,'concert-loads.png')});
 const gn=p.locator('#pane-timeline [data-tl841-ref="GN13"]');await gn.scrollIntoViewIfNeeded();
 check((await gn.innerText()).includes('SLS Equipment Compound · Narrowneck'),'Build uses the same GN13 destination');
 await p.screenshot({path:path.join(out,'gn13-load.png')});
 const finder=await p.evaluate(()=>({concert:finderMatches('Concert generators').filter(r=>r.kind==='asset').map(r=>({key:r.key,name:r.name})),gn13:finderMatches('SLS Equipment Compound').filter(r=>r.kind==='asset').map(r=>r.key)}));
 check(finder.concert.some(r=>r.key==='GN?'&&r.name==='Concert generators')&&finder.gn13.includes('GN13'),'Map finder accepts useful names and preserves identities');
 const booking=await p.evaluate(()=>bookingBrief801(assetOf('GN?')));
 check(booking.includes('1316182')&&booking.includes('1316183')&&booking.includes('26121298')&&booking.includes('26121310'),'Booking details share both exact asset/DD joins');
 await p.evaluate(()=>{state.asOf='2026-10-12';go('today');render();});
 const today=await p.evaluate(()=>({plate:refPlate('GN?',15),gn13:whereText(assetOf('GN13')).main}));
 check(today.plate.includes('Concert')&&!today.plate.includes('GN?')&&today.gn13==='SLS Equipment Compound · Narrowneck','Today shares Concert label and GN13 destination');
 check(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'No horizontal page overflow');
 check(await p.evaluate(b=>JSON.stringify(S)===b.record&&JSON.stringify(pl770Model())===b.money&&JSON.stringify(MASTER_LOC)===b.map&&JSON.stringify(DATA)===b.data,before),'No operational data, financial, source or map mutation');
 check(h.errors.length===0,'No browser exceptions');check(h.counts.blocked===0,'No operational write attempted');
 evidence.pass=true;evidence.counts=h.counts;
}catch(e){evidence.pass=false;evidence.error=String(e.stack||e);process.exitCode=1;}
finally{if(h){evidence.errors=h.errors;await h.browser.close();}fs.writeFileSync(path.join(out,'generators.json'),JSON.stringify(evidence,null,2));console.log(JSON.stringify({pass:evidence.pass,mobile,checks:evidence.checks.length,out,error:evidence.error}));}})();
