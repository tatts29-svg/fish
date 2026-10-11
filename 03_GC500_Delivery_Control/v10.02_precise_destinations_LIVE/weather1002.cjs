// Author: Andrew Fisher. Read-only native navigation, responsive strip, refresh and date-boundary checks.
const fs=require('fs'),path=require('path'),assert=require('assert/strict'),crypto=require('crypto');
const transport=require('../toolchain/harness/curlfetch'),fetch=transport.curlFetch,hashes=new Set();
transport.curlFetch=async function(url,headers,method,body){const r=await fetch(url,headers,method,body);const u=new URL(url);if(u.origin==='https://gc500-production.up.railway.app'&&u.pathname.replace(/\/$/,'')==='/v/Coates-GC500-2026')hashes.add(crypto.createHash('sha256').update(r.body).digest('hex'));return r;};
const {open}=require('../toolchain/harness/open_page');
const out=process.env.OUTDIR||'/workspace/private-gc500-dest1002/weather';fs.mkdirSync(out,{recursive:true});
(async()=>{let h;try{
 h=await open({pageFile:process.env.PUBLIC==='1'?undefined:process.env.PAGE,hash:'#day/2026-10-09',mobile:process.env.MOB==='1',W:1440,H:1050});const p=h.page;
 const ready=()=>p.waitForFunction(()=>SYNC.status==='live'&&SYNC.first.size===Object.keys(SYNC_COLLS).length&&document.documentElement.dataset.refresh904==='ready',null,{timeout:180000});await ready();
 const checks=[],check=(name,ok)=>{assert(ok,name);checks.push(name);};
 const measure=async tab=>p.evaluate(tab=>{const pane=document.getElementById('pane-'+tab),strip=pane.querySelector('.daystrip'),on=strip.querySelector('.day.on'),a=strip.getBoundingClientRect(),b=on.getBoundingClientRect();return {day:on.dataset.day||on.dataset.dday816,markedToday:on.classList.contains('today'),today:todayIso(),left:a.left,right:a.right,width:a.width,cardWidth:b.width,centre:Math.abs((b.left+b.right)/2-innerWidth/2),scroll:strip.scrollLeft,visible:[...strip.querySelectorAll('.day')].filter(c=>{const r=c.getBoundingClientRect();return r.right>0&&r.left<innerWidth;}).length,overflow:document.documentElement.scrollWidth>innerWidth+1,selectedGlow:getComputedStyle(on).boxShadow,navGlow:getComputedStyle(document.querySelector('nav.tabs button[aria-selected=true]')).boxShadow};},tab);
 check('Explicit historical deep link preserved on first navigation',(await measure('timeline')).day==='2026-10-09');
 await p.reload({waitUntil:'load'});await ready();await p.waitForTimeout(100);let r=await measure('timeline');
 check('Build refresh selects today',r.day===r.today&&r.markedToday);check('Build refresh centres today',r.centre<2);check('Selected card and tab have persistent glow',r.selectedGlow!=='none'&&r.navGlow!=='none');
 const legacy=await p.evaluate(()=>{const fixture=document.createElement('div');fixture.hidden=true;fixture.innerHTML='<button class="eqc on"></button><button class="mtile on"></button><div class="finder"><div class="fi on" role="option" aria-selected="true"></div></div><div class="wtog"><button class="on"></button></div><div class="giscope"><button class="gsc on"></button></div>';document.body.append(fixture);const values=[...fixture.querySelectorAll('.on')].map(el=>({control:el.className,shadow:getComputedStyle(el).boxShadow}));fixture.remove();return values;});
 for(const row of legacy)check('Legacy selected control has orange glow: '+row.control,row.shadow.includes('255, 177, 107'));
 await p.locator('#pane-timeline .daystrip').screenshot({path:path.join(out,'desktop-strip.png')});
 await p.evaluate(()=>{window.__weather1002Native=JSON.stringify(S);window.__weather1002Today=todayIso();});
 const geometry=[];
 for(const width of [1440,2560,3440,390]){
  await p.setViewportSize({width,height:1050});await p.evaluate(()=>{go('timeline');renderTimeline();});await p.waitForTimeout(80);r=await measure('timeline');geometry.push({tab:'timeline',width,...r});
  check('Build fills viewport '+width,Math.abs(r.left)<2&&Math.abs(r.right-width)<2&&!r.overflow);check('Build today centred '+width,r.centre<2);
  if(width>=2560)check('Build shows at least six cards on wide screen '+width,r.visible>=6);
  await p.evaluate(()=>{go('demob');DM816.sel=null;renderDemob816();});await p.waitForTimeout(80);r=await measure('demob');geometry.push({tab:'demob',width,...r});
  check('Demob fills viewport '+width,Math.abs(r.left)<2&&Math.abs(r.right-width)<2&&!r.overflow);check('Future Demob chooses honest first scheduled day '+width,r.day==='2026-10-26'&&!r.markedToday);
 }
 await p.setViewportSize({width:1440,height:1050});
 await p.evaluate(()=>{go('timeline');document.querySelector('#pane-timeline [data-day-step="1"]').click();});await p.waitForTimeout(80);r=await measure('timeline');check('Manual Next selects another day',r.day!==r.today);check('Manual Next remains centred',r.centre<2);
 await p.evaluate(()=>document.querySelector('#pane-timeline .daynav [data-day]').click());await p.waitForTimeout(80);r=await measure('timeline');check('Today control returns to today',r.day===r.today&&r.centre<2);
 for(const iso of ['2026-10-26','2026-10-28','2026-11-13']){
  await p.evaluate(iso=>{TODAY_ISO.v=iso;TODAY_ISO.at=Date.now()+100000;DM816.sel=null;go('demob');renderDemob816();},iso);await p.waitForTimeout(80);r=await measure('demob');
  check('Demob selects actual today '+iso,r.day===iso&&r.markedToday);check('Demob centres actual today including endpoints '+iso,r.centre<2);
 }
 await p.evaluate(()=>{TODAY_ISO.v='2026-10-11';TODAY_ISO.at=Date.now()+100000;go('timeline');PastDay984.checkDay();state.day='2026-10-09';TODAY_ISO.v=null;PastDay984.checkDay();});await p.waitForTimeout(80);r=await measure('timeline');check('AEST date rollover resets old Build selection',r.day===r.today);
 check('Native records unchanged by navigation and fixtures',await p.evaluate(()=>window.__weather1002Native===JSON.stringify(S)));
 await p.evaluate(()=>{go('demob');DM816.sel='2026-11-13';renderDemob816();});await p.reload({waitUntil:'load'});await ready();r=await measure('demob');check('Demob refresh resets manual date to current nearest day',r.day==='2026-10-26');
 await p.setViewportSize({width:390,height:844});await p.evaluate(()=>{go('timeline');document.querySelector('#pane-timeline .daystrip').scrollIntoView({block:'start'});});await p.waitForTimeout(80);await p.screenshot({path:path.join(out,'phone.png'),fullPage:false});
 if(process.env.PUBLIC==='1'){check('Actual public page without HTML substitution',h.counts.page===0);if(process.env.EXPECTED_SHA)check('Every actual public reload has the release hash',hashes.size===1&&hashes.has(process.env.EXPECTED_SHA));}
 check('No native writes',h.counts.blocked===0);check('No browser errors',h.errors.length===0);
 const result={author:'Andrew Fisher',pass:true,mobile:process.env.MOB==='1',public:process.env.PUBLIC==='1',sourceHashes:[...hashes],checks:checks.length,names:checks,geometry,errors:h.errors,writes:h.counts.blocked};fs.writeFileSync(path.join(out,'weather.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result));
 }finally{if(h)await h.browser.close();}})().catch(e=>{console.error(e);process.exit(1);});
