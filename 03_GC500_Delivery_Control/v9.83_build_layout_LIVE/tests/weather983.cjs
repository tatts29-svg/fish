// Author: Andrew Fisher. Explicit browser-only WMO fixtures; never operational weather data.
const fs=require('fs'),assert=require('assert/strict'),crypto=require('crypto');const {open}=require('../../toolchain/harness/open_page');
(async()=>{assert.equal(crypto.createHash('sha256').update(fs.readFileSync(process.env.PAGE)).digest('hex'),process.env.EXPECTED_SHA);const mobile=process.env.MOB==='1',h=await open({pageFile:process.env.PAGE,hash:'#timeline',mobile,W:mobile?390:1440,H:900}),p=h.page;try{
await p.waitForFunction(()=>SYNC.status==='live'&&SYNC.first.size===Object.keys(SYNC_COLLS).length,null,{timeout:150000});await p.evaluate(()=>{go('timeline');window.__weather983Original=wxfDay;window.__native983=JSON.stringify(S);window.__wxDay983=document.querySelector('#pane-timeline .day.on').dataset.day;window.__wxBase983=wxfDay(__wxDay983)||{};});
const cases=[];
for(const kind of ['sun','part','cloud','rain','pour','storm','fog','sleet']){
await p.evaluate(kind=>{const code=Object.keys(WX_WMO).find(k=>WX_WMO[k][0]===kind);if(code==null)throw Error('Missing WMO kind '+kind);const day=window.__wxDay983,fixture={...window.__wxBase983,date:day,src:'om',code:Number(code),max_c:24,min_c:18,rain_pc:['rain','pour','storm'].includes(kind)?80:15,wind_kph:12,text:'Browser-only '+kind};wxfDay=iso=>iso===day?fixture:window.__weather983Original(iso);wxfPaint();WX818.refresh();},kind);
await p.waitForTimeout(200);const card=p.locator('#pane-timeline .day.on');await card.scrollIntoViewIfNeeded();await p.waitForTimeout(100);
assert.equal(await card.getAttribute('data-weather-card'),kind,'Native classification '+kind);
const state=await p.evaluate(()=>{const r=WX818.report(),el=document.querySelector('#pane-timeline .day.on');return {report:r,svg:!!el.querySelector('.wm-card-scene svg'),gradient:!!el.querySelector('.wm-card-scene radialGradient'),overflow:document.documentElement.scrollWidth>innerWidth+1,selected:r.cards.filter(c=>c.selected).length};});
assert(state.svg&&state.gradient&&!state.overflow);assert.equal(state.selected,1);assert.equal(state.report.cards.find(c=>c.selected).source,'om');
cases.push({kind,svg:true,source:'browser-only WMO fixture',selectedScenes:state.selected});
if(process.env.OUTDIR&&['part','storm'].includes(kind)){fs.mkdirSync(process.env.OUTDIR,{recursive:true});await p.screenshot({path:process.env.OUTDIR+'/'+kind+'-fixture.png'});}
}
await p.emulateMedia({reducedMotion:'reduce'});await p.waitForTimeout(150);assert(await p.evaluate(()=>WX818.report().reduced&&!WX818.report().playing),'Reduced motion stops weather');
await p.emulateMedia({reducedMotion:'no-preference'});await p.evaluate(()=>{wxfDay=window.__weather983Original;wxfPaint();WX818.refresh();go('plant');});await p.waitForTimeout(100);assert(await p.evaluate(()=>!WX818.report().playing),'Weather stops outside Build');
assert(await p.evaluate(()=>JSON.stringify(S)===window.__native983),'Native record unchanged');assert.equal(h.errors.length,0);assert.equal(h.counts.blocked,0);
const result={author:'Andrew Fisher',sha256:process.env.EXPECTED_SHA,pass:true,mobile,cases,reducedMotion:true,offTabStopped:true,nativeUnchanged:true,errors:0,writes:0};if(process.env.OUTDIR)fs.writeFileSync(process.env.OUTDIR+'/weather.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result));
}finally{await h.browser.close();}})().catch(e=>{console.error(e.stack);process.exit(1)});
