// Author: Andrew Fisher. Actual-track and rendered phone/desktop release checks, read-only.
const fs=require('fs'),path=require('path'),crypto=require('crypto'),assert=require('assert/strict');
const tool=path.resolve(__dirname,'../../toolchain/harness'),fetcher=require(tool+'/curlfetch'),native=fetcher.curlFetch;
const expected=process.env.EXPECTED_SHA,publicMode=process.env.PUBLIC==='1',file=publicMode?undefined:process.env.PAGE;
assert(/^[a-f0-9]{64}$/.test(expected||''));if(!publicMode)assert.equal(crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex'),expected);
let served;fetcher.curlFetch=async(u,h,method,b)=>{const r=await native(u,h,method,b);if(new URL(u).pathname==='/v/Coates-GC500-2026')served=crypto.createHash('sha256').update(r.body).digest('hex');return r;};
const {open}=require(tool+'/open_page.js'),phone=process.env.MOB==='1',out=process.env.OUTDIR;fs.mkdirSync(out,{recursive:true});
(async()=>{const h=await open({pageFile:file,gl:true,W:phone?390:1440,H:phone?844:900,mobile:phone,dpr:1}),p=h.page,checks=[];const ok=(name,pass)=>{assert(pass,name);checks.push(name)};try{
await p.waitForFunction(()=>SYNC.status==='live'&&SYNC.first.size===Object.keys(SYNC_COLLS).length,null,{timeout:150000});
const before=await p.evaluate(()=>JSON.stringify(S));await p.evaluate(()=>photoIndex());await p.waitForFunction(()=>photoIndex().state==='ready',null,{timeout:60000});
if(publicMode)ok('Exact actual-public bytes with no page substitution',served===expected&&h.counts.page===0);
const sources=await p.evaluate(()=>holdAssets(()=>{const rows=Reference966.rows(),remaining=Reference966.unresolvedLocations();return {office:Reference973.sourcePlace(assetOf('T0021')),vms:rows.filter(r=>['T0128','T0158'].includes(r.id)),remaining:remaining.map(r=>r.id),count:remaining.length};}));
ok('Original office photo relation applied',sources.office?.label==='Coates compound · beside lunchroom T0022'&&!sources.office.exactPosition);
ok('Two original-contract planned VMS groups applied',sources.vms.length===2&&sources.vms.every(r=>r.locationState==='contract-planned-group'&&r.plannedBoardReferences.length>0));
fs.writeFileSync(out+'/source-observation.json',JSON.stringify(sources,null,2));
ok('Three specific VMS source differences retained after compound directions',sources.count===3);
await p.evaluate(()=>{showOpen();if(SHOW.playing)showPause();});await p.waitForFunction(()=>GC3D.startupReport971()?.shown&&GC3D.S?.dressStats?.photoLandmarks970?.landmarks?.length===5,null,{timeout:150000});
ok('Default sound stays off without context',await p.evaluate(()=>!GC3D.sound.active&&!GC3D.sound.ctx));
ok('Existing photo detail and startup retained',await p.evaluate(()=>GC3D.S.dressStats.photoLandmarks970.landmarks.length===5&&GC3D.startupReport971().prepared&&!GC3D.failed));
const track=await p.evaluate(()=>{const G=GC3D,S=G.S,result=[];for(const pace of [.25,1,2]){
G.setPace(pace);G.simReset();S.paused=true;S.fps=60;let peakSlip=0,peakSmoke=0,peakOpening=0,peakWheelspin=0,finite=true,bounded=true,steps=0,peak=null;
while((S.sim.s-S.gridS)<S.CL.L&&steps++<180000){G.step(1/120);const m=S.sim,slip=Math.abs(m.slip);finite=finite&&[m.s,m.v,m.slip,m.lat,m.pitch,m.roll,S.pose.hd,...S.pose.pos].every(Number.isFinite);bounded=bounded&&Math.abs(m.lat)<=S.tune.lineOffset+.001&&m.smoke.length<=218&&m.marks.length<=S.tune.maxMarks;
if(!m.go)peakOpening=Math.max(peakOpening,m.smoke.length);peakSmoke=Math.max(peakSmoke,m.smoke.length);peakWheelspin=Math.max(peakWheelspin,m.wheelspin||0);
if(slip>peakSlip){peakSlip=slip;peak={clock:S.clock,sim:JSON.parse(JSON.stringify(m))};}}
result.push({pace,steps,complete:S.sim.s-S.gridS>=S.CL.L,peakSlip,peakSmoke,peakOpening,peakWheelspin,finite,bounded,peak});}
return result;});
for(const r of track){ok('Complete finite lap at '+r.pace+'x',r.complete&&r.finite);ok('Bounded grip and particles at '+r.pace+'x',r.peakSlip<.196&&r.bounded&&r.peakOpening<=40);}
fs.writeFileSync(out+'/track-observation.json',JSON.stringify(track.map(({peak,...r})=>r),null,2));
const render=track.find(r=>r.pace===1);await p.evaluate(peak=>{const G=GC3D,S=G.S;G.setPace(1);G.simReset();S.clock=peak.clock;Object.assign(S.sim,peak.sim);S.sim.rnd=G.rng(5);S.paused=true;G.setView('chase');G.pose();for(let i=0;i<60;i++)G.camStep(1/60);G.render();},render.peak);
ok('Day smoke/car frame renders without GL error',await p.evaluate(()=>GC3D.S.gl.getError()===0));await p.screenshot({timeout:120000,path:out+'/'+(phone?'phone':'desktop')+'-day-slide.png'});
await p.evaluate(()=>{GC3D.setLook('night');GC3D.render();});ok('Night frame renders without GL error',await p.evaluate(()=>GC3D.S.gl.getError()===0));await p.screenshot({timeout:120000,path:out+'/'+(phone?'phone':'desktop')+'-night-slide.png'});
await p.evaluate(()=>{GC3D.sound.on();GC3D.sound.tick(GC3D.S);});
ok('Audio starts with finite speed-linked RPM',await p.evaluate(()=>GC3D.sound.active&&Number.isFinite(GC3D.sound.rpm)&&GC3D.sound.rpm<=7150));
await p.evaluate(()=>GC3D.sound.off());ok('Audio stops and clears engine',await p.evaluate(()=>!GC3D.sound.active&&!GC3D.sound.nodes.engine&&!GC3D.sound.nodes.loops));
await p.locator('#showBack').click();ok('Back closes and disposes Showcase',await p.evaluate(()=>!SHOW.open&&!GC3D.S&&!GC3D._raceCarModels&&!GC3D.playbackRuntime971.report().active));
ok('Complete native record unchanged',await p.evaluate(b=>JSON.stringify(S)===b,before));ok('Zero page errors or operational writes',h.errors.length===0&&h.counts.blocked===0);
const r={author:'Andrew Fisher',sha256:expected,mobile:phone,actualPublic:publicMode,checks,pass:true,sources,track:track.map(({peak,...r})=>r),errors:h.errors,operationalWrites:h.counts.blocked,scope:'Actual track fixed-step/rendered browser checks using software Chromium; not a physical-device frame-rate or subjective listening claim.'};fs.writeFileSync(out+'/'+(phone?'phone':'desktop')+'.json',JSON.stringify(r,null,2));console.log(JSON.stringify({pass:true,checks:checks.length,sha256:expected,mobile:phone,track:r.track}));
}finally{await h.browser.close();}})().catch(e=>{console.error(e.stack);process.exit(1)});
