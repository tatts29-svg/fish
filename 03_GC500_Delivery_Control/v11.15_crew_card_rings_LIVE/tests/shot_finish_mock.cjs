/* Phone screenshots on the mock: finish a one-reference area (13) and show the finished moment and the area list. */
const fs=require('fs'),path=require('path');const CARD='/home/user/fish/03_GC500_Delivery_Control/servicing_tracker_DRAFT/card';
module.paths.unshift('/home/user/fish/03_GC500_Delivery_Control/toolchain/node_modules');
const {chromium}=require('playwright');const {createMock}=require(path.join(CARD,'mock_server.js'));const {buildCardHtml,trackerConfig}=require(path.join(CARD,'build_card.js'));
const DATA=JSON.parse(fs.readFileSync(path.join(CARD,'..','tracker_data.json'),'utf8'));const OUT=process.argv[2];const REF=process.argv[3]||'WC19';
(async()=>{const html=buildCardHtml(DATA,{contact:{name:'Servicing contact',phone:'0400 000 000'}}),cfg=trackerConfig(DATA);
 const mock=createMock({control:true});await mock.listen();mock.setNow('2026-10-23T12:00:00Z');
 const E={'Content-Type':'application/json','x-gc500-token':mock.options.editToken};
 const r=await fetch(mock.base+'/api/cards',{method:'POST',headers:E,body:JSON.stringify({load:'servicing-tracker:GC500-2026',title:'GC500 servicing tracker',run_date:'2026-10-23',expires:'2026-10-26',keys:[],targets:[],html,tracker:cfg})});
 const j=await r.json();const T=j.token,L=j.tracker.links;
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||undefined,args:['--no-sandbox']});
 const ctx=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true});const page=await ctx.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 const live=()=>page.waitForFunction(()=>/^Live/.test(document.getElementById('status').textContent),null,{timeout:20000});
 const settle=()=>page.waitForFunction(()=>window.svc1067&&window.svc1067.outbox().length===0,null,{timeout:30000});
 const u=(ref,g)=>mock.base+'/d/'+T+'#r='+ref+'.'+L[ref]+(g?'~'+g:'');
 for(const g of ['pump','clean']){await page.goto('about:blank');await page.goto(u(REF,g));await live();const keys=await page.$$eval('[data-job]:not(.extra)',bs=>bs.map(b=>b.dataset.job));for(const k of keys){await page.click('[data-job="'+k+'"]');await settle();}}
 await page.waitForTimeout(900);await page.screenshot({path:OUT+'/card_7_area_finished.png',fullPage:true});
 await page.click('#saveclose');await page.waitForTimeout(1200);await page.screenshot({path:OUT+'/card_8_saved_area_done.png',fullPage:false});
 await page.goto('about:blank');await page.goto(mock.base+'/d/'+T);await live();await page.waitForTimeout(800);
 const el=await page.$('#a13');if(el){await el.scrollIntoViewIfNeeded();}await page.screenshot({path:OUT+'/card_9_view_area_done.png',fullPage:false});
 const info=await page.evaluate(()=>({compact:document.getElementById('compact').textContent,audit:(document.querySelector('.fin-list')||{}).textContent||null}));
 console.log(JSON.stringify({info,errors}));await browser.close();await mock.close();})().catch(e=>{console.error(String(e).slice(0,500));process.exit(1);});
