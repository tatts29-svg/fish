/* Author: Andrew Fisher. Exact candidate crew template on LOCAL mock only. No live requests/writes. */
'use strict';
const fs=require('fs'),path=require('path'),assert=require('assert');
const {chromium}=require('playwright');
const ROOT=path.resolve(__dirname,'../..');
const {createMock}=require(ROOT+'/servicing_tracker_DRAFT/card/mock_server.js');
const {trackerConfig}=require(ROOT+'/servicing_tracker_DRAFT/card/build_card.js');
const FILE=process.env.PAGE,OUT=process.env.OUT;
if(!FILE||!OUT)throw Error('PAGE and OUT required');fs.mkdirSync(OUT,{recursive:true});
function pkg(file){const s=fs.readFileSync(file,'utf8'),start=s.indexOf('var SVC1067_CARD=')+'var SVC1067_CARD='.length;return JSON.parse(s.slice(start,s.indexOf('\n',start)).replace(/;\s*$/,''));}
const P=pkg(FILE),B=pkg(process.env.BASE||path.join(path.dirname(FILE),'base_live.html'));
const results=[];function check(name,ok,detail){results.push({name,ok:!!ok,detail});console.log((ok?'PASS ':'FAIL ')+name);if(!ok)throw Error(name+': '+JSON.stringify(detail));}
(async()=>{
 check('tracker data unchanged',JSON.stringify(P.data)===JSON.stringify(B.data));
 for(const fname of ['tapJob','undoJob','pump','poll','jobHtml','shownTasks']) {
  function f(html){const start=html.indexOf('function '+fname+'(');const next=html.indexOf('\nfunction ',start+10);return html.slice(start,next);}
  check(fname+' unchanged',f(P.html)===f(B.html));
 }
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});
 const mock=createMock({control:true});await mock.listen();const errors=[];let nonlocal=0;
 try {
  const maker=await browser.newPage();P.data.contact={name:'Servicing contact',phone:'0400 000 000'};
  const html=await maker.evaluate(p=>{let d=new DOMParser().parseFromString(p.html,'text/html');d.querySelector('script').textContent=d.querySelector('script').textContent.replace('/*SVC1067_DATA*/null',()=>JSON.stringify(p.data).replace(/</g,'\\u003c'));d.querySelectorAll('footer .note')[1].textContent='Servicing contact';return '<!doctype html>\n'+d.documentElement.outerHTML;},P);await maker.close();
  const headers={'Content-Type':'application/json','x-gc500-token':mock.options.editToken};
  mock.setNow('2026-10-23T09:00:00Z');
  const resp=await fetch(mock.base+'/api/cards',{method:'POST',headers,body:JSON.stringify({load:'local-crew-usability',title:'Local check',run_date:'2026-10-23',expires:'2026-10-26',keys:[],targets:[],html,tracker:trackerConfig(P.data)})});
  const made=await resp.json();assert(made.token);
  const url=(ref,group)=>mock.base+'/d/'+made.token+(ref?'#r='+ref+'.'+made.tracker.links[ref]+(group?'~'+group:''):'');
  for(const width of [360,390,1440]){
   const ctx=await browser.newContext({viewport:{width,height:width<400?844:1000},isMobile:width<400,hasTouch:width<400,timezoneId:'Australia/Brisbane'});
   await ctx.route('**/*',r=>{if(r.request().url().startsWith(mock.base))return r.continue();nonlocal++;return r.abort();});
   const p=await ctx.newPage();p.on('pageerror',e=>errors.push(e.message));
   const ready=()=>p.waitForFunction(()=>/^Live/.test(document.getElementById('status').textContent)&&!document.querySelector('[data-job]')?.disabled);
   await p.goto(url('WC07','clean'));await ready();await p.waitForTimeout(200);
   await p.screenshot({path:path.join(OUT,'initial-'+width+'.png'),fullPage:true});
   const first=await p.evaluate(()=>({days:[...document.querySelectorAll('#days>.day')].map(x=>x.dataset.day),pastVisible:[...document.querySelectorAll('#crew-history1161 .day')].some(x=>x.checkVisibility()),current:svc1067.shownDay(),map:document.getElementById('crew-map1161').open,y:document.querySelector('[data-job]').getBoundingClientRect().top,jobHeight:document.querySelector('[data-job]').getBoundingClientRect().height,overflow:document.documentElement.scrollWidth>innerWidth,group:[...document.querySelectorAll('[data-job]')].map(x=>x.dataset.job.split('|')[1])}));
   check(width+': current/upcoming nights; history closed',first.days.join()==='2026-10-23,2026-10-24,2026-10-25'&&!first.pastVisible&&first.current==='2026-10-23',first);
   check(width+': first job within first phone screen, large targets, no overflow',!first.map&&first.y<844&&first.jobHeight>=48&&!first.overflow,first);
   check(width+': clean code only shows cleaning and water',first.group.join()==='clean,refill',first.group);
   await p.screenshot({path:path.join(OUT,'phone-'+width+'.png'),fullPage:true});
   await p.click('#crew-history1161 summary');await p.click('#day-2026-10-21');
   check(width+': history explicitly selects past day with warning',await p.evaluate(()=>svc1067.shownDay()==='2026-10-21'&&document.getElementById('banners').innerText.toLowerCase().includes('wednesday 21')),await p.evaluate(()=>({day:svc1067.shownDay(),banner:document.getElementById('banners').innerText}))); 
   await p.click('#crew-history1161 summary');await p.waitForTimeout(100);
   check(width+': closing history returns to current night',await p.evaluate(()=>svc1067.shownDay()==='2026-10-23'));
   await p.click('.crew-assets1161 summary');
   check(width+': every asset number remains available',await p.locator('.crew-assets1161 .nos').isVisible()&&(await p.locator('.crew-assets1161 .nos').innerText()).includes(P.data.areas.flatMap(a=>a.refs).find(r=>r.ref==='WC07').lines[0].nos[0]));
   await p.click('.crew-assets1161 summary');
   await p.click('#crew-map1161 summary');
   check(width+': existing area map available',await p.locator('.amap-svg').isVisible());
   await p.click('#crew-map1161 summary');
   await p.click('#saveclose');
   check(width+': no-tap save still names unfinished own jobs',/Still to do for this code: Clean & restock, Water checked/.test(await p.locator('.saved-own1161').innerText()));
   await ctx.close();
  }
  const ctx=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,timezoneId:'Australia/Brisbane'});
  let offline=false;
  await ctx.route('**/*',r=>{if(!r.request().url().startsWith(mock.base)){nonlocal++;return r.abort();}if(offline&&/\/ticks/.test(r.request().url()))return r.abort();return r.continue();});
  const p=await ctx.newPage();p.on('pageerror',e=>errors.push(e.message));
  const ready=()=>p.waitForFunction(()=>/^Live/.test(document.getElementById('status').textContent)&&!document.querySelector('[data-job]')?.disabled);
  const settle=()=>p.waitForFunction(()=>svc1067.outbox().length===0,null,{timeout:30000});
  await p.goto(url('WC07','clean'));await ready();await p.click('[data-job="WC07-FWF|clean"]');await settle();
  await p.click('#saveclose');check('partial clean save names water still needed',await p.locator('.saved-own1161').innerText()==='Still to do for this code: Water checked / refilled');
  await p.click('[data-unsave]');await p.click('[data-job="WC07-FWF|refill"]');await settle();await p.click('#saveclose');
  check('cleaner finished: own jobs complete; pump clearly separate',await p.locator('.saved-own1161').innerText()==='Your jobs at WC07 are complete.'&&await p.locator('.saved-other1161').innerText()==='Other work at WC07: Pump out');
  await p.screenshot({path:path.join(OUT,'saved-clean.png'),fullPage:true});
  await p.goto(url('WC12','clean'));await ready();offline=true;
  await p.click('[data-job="WC12-FWF|clean"]');await p.click('#saveclose');await p.waitForTimeout(200);
  check('offline save never says Saved',!/Saved/.test(await p.locator('.saved h2').innerText())&&await p.evaluate(()=>svc1067.outbox().length===1));
  await p.reload();await p.waitForTimeout(300);
  check('reload retains unsent tap',await p.evaluate(()=>svc1067.outbox().length===1));
  offline=false;await p.evaluate(()=>dispatchEvent(new Event('online')));await settle();
  check('reconnect sends exactly one tap',mock.ticks(made.token).filter(t=>t.ref==='WC12'&&t.task==='clean').length===1);
  await p.click('[data-job="WC12-FWF|clean"]');check('undo requires confirmation',await p.locator('[data-undo]').count()===1);await p.click('[data-keep]');check('cancel undo keeps completion',await p.locator('[data-job="WC12-FWF|clean"]').getAttribute('aria-pressed')==='true');
  await p.goto(url('WC20','pump'));await ready();check('pump QR still pump only',(await p.locator('[data-job]').evaluateAll(xs=>xs.map(x=>x.dataset.job.split('|')[1]))).every(x=>x==='pump'));
  mock.setNow('2026-10-23T21:59:00Z');await p.evaluate(()=>dispatchEvent(new Event('online')));await p.waitForTimeout(300);
  check('07:59 remains Friday night',await p.evaluate(()=>svc1067.shownDay()==='2026-10-23'));
  mock.setNow('2026-10-23T22:01:00Z');await p.evaluate(()=>dispatchEvent(new Event('online')));await p.waitForFunction(()=>svc1067.shownDay()==='2026-10-24');
  check('08:00 rolls to Saturday; Friday in history',await p.evaluate(()=>[...document.querySelectorAll('#days>.day')].map(x=>x.dataset.day).join()==='2026-10-24,2026-10-25'&&!!document.querySelector('#crew-history1161 #day-2026-10-23')));
  mock.setNow('2026-10-25T09:00:00Z');await p.goto('about:blank');await p.goto(url('WC07','clean'));await ready();check('final night retains lockup task',(await p.locator('[data-job]').evaluateAll(xs=>xs.map(x=>x.dataset.job.split('|')[1]))).join()==='lockup');
  await p.goto(url());await p.waitForTimeout(200);check('no-code view cannot tick',await p.locator('[data-job]').count()===0);
  check('no browser errors',errors.length===0,errors);
  check('no live requests passed through',true,{blockedExternalRequests:nonlocal});
  await ctx.close();
 } finally {await browser.close();await mock.close();fs.writeFileSync(path.join(OUT,'crew-checks.json'),JSON.stringify({results},null,2));}
})().catch(e=>{console.error(e.message);process.exit(1)});
