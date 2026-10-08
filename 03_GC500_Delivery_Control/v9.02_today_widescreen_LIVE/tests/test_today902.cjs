// Author: Andrew Fisher. Read-only Today presentation checks, using the page's existing model and controls.
// PAGE=<candidate> OUT=<private evidence> [W=1440|2560|3840|390] node tests/test_today902.cjs
const fs=require('fs'),path=require('path'),assert=require('assert');
const {open}=require('../../toolchain/harness/open_page');
const root=path.resolve(__dirname,'..'),image=JSON.parse(fs.readFileSync(path.join(root,'yard902.json')));
(async()=>{let s;const results=[];const check=(name,pass,detail)=>{results.push({name,pass:!!pass,detail});if(!pass)throw Error(name+' '+JSON.stringify(detail));};try{
 const W=Number(process.env.W||1440),mobile=W===390,H=mobile?844:1200,out=process.env.OUT||'/tmp/gc500-today902';fs.mkdirSync(out,{recursive:true});
 s=await open({pageFile:process.env.PAGE,hash:'#today',W,H,mobile,dpr:1});const p=s.page,errors=[];p.on('console',m=>{if(m.type()==='error'&&!/Failed to load resource|net::|ERR_FAILED/.test(m.text()))errors.push(m.text())});
 // Every non-GET request is blocked, including external map session creation.
 const blocked=[];await p.route('**/*',r=>{if(r.request().method()==='GET')return r.fallback();const u=new URL(r.request().url());blocked.push({method:r.request().method(),host:u.hostname,path:u.pathname});return r.abort();});
 await p.route(new RegExp('/m/Coates-GC500-2026/'+image.file+'(?:\\?.*)?$'),r=>r.fulfill({status:200,contentType:image.type,body:fs.readFileSync(path.join(root,'assets',image.file))}));
 await p.waitForFunction(()=>typeof Scene896==='object'&&SYNC.status==='live'&&todayWorkHealth840().ready,null,{timeout:150000});
 await p.evaluate(sha=>{go('today');DATA.media[sha]+='?check902='+Date.now();document.getElementById('scene896-atlas')?.remove();Scene896.mount();},image.sha256);
 await p.waitForTimeout(2600);
 const scroll=()=>p.evaluate(()=>{const e=document.getElementById('where885'),m=document.querySelector('main');m.scrollTop+=e.getBoundingClientRect().top-m.getBoundingClientRect().top-10;});
 await scroll();await p.waitForTimeout(300);
 const geometry=await p.evaluate(()=>{
  const bounds=e=>{const r=e.getBoundingClientRect();return{x:r.x,y:r.y,width:r.width,height:r.height,right:r.right,bottom:r.bottom};};
  const card=document.getElementById('where885'),g=card.querySelector('.w885-gauge'),gr=bounds(g),c=bounds(card),programme=bounds(card.querySelector('.w885-programme'));
  const parts=['.w885-lights','.w885-title','.w885-reading','.w885-caption','.s896-wx'].map(sel=>({sel,...bounds(g.querySelector(sel))}));
  const chips=[...card.querySelectorAll('.w885-group')].map(e=>({id:e.dataset.w885Jump,...bounds(e),name:e.querySelector('.w885-gname').textContent,overflow:e.scrollWidth>e.clientWidth+1}));
  const over=[...card.querySelectorAll('*')].filter(e=>{const r=e.getBoundingClientRect();return !e.closest('.s896-sky')&&!e.classList.contains('w885-sr')&&r.width>0&&(r.left<c.x-2||r.right>c.right+2);}).map(e=>e.className);
  const controls=[card.querySelector('.w885-motion'),card.querySelector('.w885-basis summary'),card.querySelector('.pkeyhead [role=link]'),...card.querySelectorAll('.pweek')].filter(Boolean).map(e=>({class:e.className,...bounds(e)}));
  return {card:c,hero:gr,programme,parts,chips,over,controls,mainOverflow:document.documentElement.scrollWidth>innerWidth+1,columns:getComputedStyle(card.querySelector('.today-enhanced.racecard')).gridTemplateColumns.split(' ').length};
 });
 check('five native lights and all seven linked readings',await p.locator('#where885 .w885-lights .tl841-lamp').count()===5&&geometry.chips.length===7);
 check('full-width centred hero and instrument',geometry.parts.every(r=>Math.abs((r.x+r.width/2)-(geometry.hero.x+geometry.hero.width/2))<3)&&geometry.programme.y>geometry.hero.bottom,geometry.parts);
 check('widescreen hero remains compact',W===390||geometry.hero.height<=540,geometry.hero);
 check('programme uses available desktop width',W<1440||geometry.columns===3,geometry.columns);
 check('no horizontal clipping or page overflow',!geometry.mainOverflow&&!geometry.over.length&&geometry.chips.every(c=>!c.overflow),geometry.over);
 check('native touch targets retain 44 px height',geometry.controls.every(c=>c.height>=43.9)&&geometry.chips.every(c=>c.height>=44),geometry.controls);
 await p.locator(mobile?'#where885 .w885-gauge':'#where885').screenshot({path:path.join(out,'today-'+W+'.png')});await p.screenshot({path:path.join(out,'screen-'+W+'.png')});
 if(mobile){await p.evaluate(()=>{const e=document.querySelector('.w885-programme'),m=document.querySelector('main');m.scrollTop+=e.getBoundingClientRect().top-m.getBoundingClientRect().top-10;});await p.screenshot({path:path.join(out,'programme-'+W+'.png')});await scroll();}
 const decode=await p.evaluate(sha=>new Promise(resolve=>{const i=new Image();i.onload=()=>resolve({width:i.naturalWidth,height:i.naturalHeight});i.onerror=()=>resolve(null);i.src=DATA.media[sha];}),image.sha256);
 check('new source panorama decodes at its original resolution',decode&&decode.width===image.width&&decode.height===image.height,decode);
 const settled=await p.evaluate(()=>{document.getElementById('w885-motion').click();const m=progress881Model(todayWorkDay841()),t=document.querySelector('[data-w885-pct]');return{model:m.pct,shown:t.textContent,expected:t.dataset.text,scene:Scene896.report(),where:Where885.report()};});
 check('Pause keeps the source percentage and stops scene motion',settled.shown===settled.expected&&settled.scene.paused&&!settled.scene.running,settled);
 await p.click('#w885-motion');await p.waitForTimeout(150);check('Play restores native scene motion',await p.evaluate(()=>Scene896.report().running));
 const weather=await p.evaluate(()=>{const keep=wxfDay,day=todayWorkDay841(),out=[];for(const [kind,code] of [['sun',1000],['rain',1183],['storm',1273],['fog',1135],['unknown',9999]]){wxfDay=()=>({date:day,src:'wapi',code,max_c:24,min_c:18,rain_pc:40,wind_kph:20});Scene896.weather();out.push({expected:kind,actual:Scene896.report().kind});}wxfDay=keep;Scene896.weather();return out;});
 check('weather keeps its existing forecast semantics',weather.every(w=>w.expected===w.actual),weather);
 await p.emulateMedia({reducedMotion:'reduce'});await p.evaluate(()=>renderToday());await scroll();await p.waitForTimeout(100);check('reduced motion stops all scene animations',await p.evaluate(()=>!Scene896.report().running&&Scene896.report().animations===0));
 await p.emulateMedia({reducedMotion:'no-preference'});await p.evaluate(()=>renderToday());await scroll();await p.waitForTimeout(100);
 const redraw=await p.evaluate(()=>{for(let i=0;i<3;i++)renderToday();return{scene:document.querySelectorAll('.s896-sky').length,style:document.querySelectorAll('#today902-style').length,atlas:document.querySelectorAll('#scene896-atlas').length};});check('redraws retain one scene and stylesheet',redraw.scene===1&&redraw.style===1&&redraw.atlas===1,redraw);
 await p.locator('#where885 .w885-basis summary').click();check('source basis remains available',await p.locator('#where885 .w885-basis').getAttribute('open')!==null);
 await p.locator('#w885-jump-buildings').click();await p.waitForTimeout(900);check('category jump still reveals the native group',await p.evaluate(()=>{const c=document.getElementById('tw840-card-buildings'),r=c.getBoundingClientRect(),m=document.querySelector('main').getBoundingClientRect();return c.querySelector('[data-tw848-group-fold]').open&&r.top<m.bottom&&r.bottom>m.top;}));
 check('no JavaScript errors or record-write attempts; all non-GET requests blocked',!s.errors.length&&!errors.length&&!blocked.some(r=>r.host!=='tile.googleapis.com')&&!s.counts.blocked,{page:s.errors,console:errors,blocked,counts:s.counts});
 fs.writeFileSync(path.join(out,'result-'+W+'.json'),JSON.stringify({width:W,results,geometry},null,2));console.log('PASS '+results.length+'/'+results.length+' Today checks at '+W+'; GET only.');
 }catch(e){console.error(e.stack);process.exitCode=1;}finally{if(s)await s.browser.close();}})();
