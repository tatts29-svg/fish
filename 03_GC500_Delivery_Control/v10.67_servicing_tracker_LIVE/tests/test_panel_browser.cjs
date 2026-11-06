/* Author: Andrew Fisher. Isolated browser fixture: all tracker/API responses are local, no live writes. */
'use strict';
const fs=require('fs'),path=require('path'),assert=require('node:assert/strict');
const {chromium}=require(process.env.NODE_PATH ? process.env.NODE_PATH+'/playwright' : '../../toolchain/node_modules/playwright');
const HERE=path.resolve(__dirname,'..'),TRACK=path.resolve(HERE,'../servicing_tracker_DRAFT');
const D=require(TRACK+'/tracker_data.json'),B=require(TRACK+'/card/build_card.js');
const C=B.cardData(D),base=B.buildCardHtml(D),mark='var D = '+B.scriptJson(C)+';';
assert.equal(base.split(mark).length,2);const template=base.replace(mark,'var D = /*SVC1067_DATA*/null;');
const code=p=>fs.readFileSync(p,'utf8'), encode=x=>JSON.stringify(x).replace(/</g,'\\u003c');
const css=code(TRACK+'/panel_mockup/panel.css').replace(/#svc1063/g,'#svc1067');
const scripts=['state.js','panel_render.js','admin_reader.js'].map(n=>code(TRACK+'/panel_mockup/'+n)).join('\n')+'\nvar SVC1067_DATA='+encode(D)+';var SVC1067_CARD='+encode({data:C,html:template})+';'+code(HERE+'/admin1067_src.js')+'\n'+code(HERE+'/servicing1067_src.js');
const fixture=`<!doctype html><html><head><meta charset="utf-8"><style>:root{--ink:#14181d;--ink2:#2f3841;--slate:#4a5560;--mute:#4b535b;--paper:white;--tint:#f8f6f4;--tint2:#fcfbfa;--rule:#e4e0dc;--rule2:#f1eeec;--orange:#ff6a13;--amber:#8a5a00;--amber-soft:#fdf5e3;--green:#1f6b3a;--green-soft:#eaf4ee}body{margin:0;font:14px/1.45 sans-serif}.card{padding:16px}.btn{min-height:44px}input:not([type=checkbox]),select{display:block;max-width:100%;min-height:44px}label{display:block;margin:10px 0}button{white-space:normal}#svc1067-host[hidden]{display:none!important}${css}</style></head><body><section class="pane on" id="pane-nights"><input id="run-sheet" value="keep my draft"></section><script>
window.mock={saved:{},posts:[],reads:[],clock:'2026-10-18T01:00:00Z',mode:'edit',nextError:null};
window.capability=()=>mock.mode;window.applyCapability=function(){};window.SYNC={readonly:false,claims:'edit',level:'edit',status:'live',backend:{
 cards:async()=>({cards:Object.values(mock.saved)}),
 ticks:async q=>{mock.reads.push(q);if(!q.token)return {now:mock.clock,service_day:'2026-10-18',trackers:Object.values(mock.saved).map(c=>({token:c.token,title:c.title,load:c.load,tracker:true,expired:false,card_withdrawn:false}))};let c=mock.saved[q.token];if(!c)throw new Error('no tracker');return {token:c.token,load:c.load,title:c.title,updated:c.updated,now:mock.clock,tracker:c.tracker,key_kept:true,expired:false,card_withdrawn:false,epoch:'fixture',seq:0,more:false,ticks:[],links:Object.fromEntries(c.tracker.lines.map(l=>[l.ref,'AAAAAAAAAAAAAAAA']))};},
 makeTracker:async body=>{mock.posts.push(body);if(mock.nextError){let e=mock.nextError;mock.nextError=null;throw Object.assign(new Error(e.message),e);}let token=body.token||'local-fixture-token-123456789';mock.saved[token]=Object.assign({},body,{token,updated:mock.clock});return {token};}
}};
${scripts}</script></body></html>`;
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true,args:['--no-sandbox']});let pass=0;
 function check(name,ok){assert.ok(ok,name);console.log('PASS '+name);pass++;}
 try{for(const width of [360,1280]){
  const ctx=await browser.newContext({viewport:{width,height:800},locale:'en-AU'}),page=await ctx.newPage(),errors=[];let nonGet=0;
  page.on('pageerror',e=>errors.push(e.message));page.on('dialog',d=>d.accept());
  await page.route('**/*',async route=>{let req=route.request(),url=new URL(req.url());if(req.method()!=='GET'){nonGet++;return route.abort();}if(url.pathname==='/')return route.fulfill({status:200,contentType:'text/html',body:fixture});if(url.pathname.startsWith('/d/')){let html=await page.evaluate(t=>mock.saved[t]?.html,url.pathname.slice(3));return route.fulfill({status:html?200:404,contentType:'text/html',body:html||''});}return route.abort();});
  await page.goto('http://127.0.0.1:19067/');await page.waitForSelector('#svc1067-host:not([hidden])');
  check(width+': absent tracker gives a truthful empty state',await page.locator('#svc1067').innerText().then(t=>t.includes('No servicing tracker has been published')));
  check(width+': no automatic publication',await page.evaluate(()=>mock.posts.length===0));
  await page.locator('.svc1067-admin summary').click();await page.locator('[data-make="event"]').click();
  check(width+': event publish waits for explicit readiness',await page.evaluate(()=>mock.posts.length===0));
  await page.locator('[data-contact-name]').fill('Fixture supervisor');await page.locator('[data-contact-phone]').fill('0400 000 000');
  await page.locator('[data-make="test"]').click();await page.waitForFunction(()=>document.querySelector('[data-admin-status]').textContent.includes('saved and read back'));
  await page.waitForFunction(()=>document.querySelector('#svc1067').textContent.includes('TEST / other tracker'));
  check(width+': TEST uses its actual day, not event dates',await page.locator('#svc1067').innerText().then(t=>t.includes('Sun 18')&&!t.includes('Thu 22')));
  check(width+': posted card keeps contact and exact quantity',await page.evaluate(()=>mock.posts.length===1&&mock.posts[0].contact.name==='Fixture supervisor'&&mock.posts[0].tracker.lines.reduce((n,l)=>n+l.qty,0)===263));
  check(width+': TEST card includes a usable following-day label',await page.evaluate(()=>mock.posts[0].html.includes('\"to\":\"Mon 19\"')&&!mock.posts[0].html.includes('closes undefined')));
  check(width+': final card has one script and no unresolved template',await page.evaluate(()=>{let h=mock.posts[0].html;return(h.match(/<script>/g)||[]).length===1&&!h.includes('/*SVC1067_DATA*/null');}));
  check(width+': separate panel does not replace run-sheet draft',await page.locator('#run-sheet').inputValue()==='keep my draft');
  await page.locator('details[data-svc-area="5"]').evaluate(e=>e.open=true);
  await page.evaluate(()=>{document.getElementById('pane-nights').innerHTML='<input id="run-sheet" value="new draw">';window.dispatchEvent(new HashChangeEvent('hashchange'));});
  check(width+': run-sheet redraw preserves open tracker area',await page.locator('details[data-svc-area="5"]').evaluate(e=>e.open));
  await page.locator('[data-make="test"]').click();await page.waitForFunction(()=>mock.posts.length===2&&document.querySelector('[data-admin-status]').textContent.includes('saved and read back'));
  check(width+': update reuses published token',await page.evaluate(()=>mock.posts[1].token===Object.keys(mock.saved)[0]));
  await page.evaluate(()=>{mock.nextError={code:'key_lost',message:'key lost'};});await page.locator('[data-make="test"]').click();await page.waitForFunction(()=>document.querySelector('[data-admin-status]').textContent.includes('codes were not replaced'));
  check(width+': missing key stops without re-key request',await page.evaluate(()=>mock.posts.every(p=>!p.rekey)));
  check(width+': no horizontal overflow',await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  await page.screenshot({path:'/dev/shm/gc500-panel-private/panel_'+width+'.png',fullPage:false});
  await page.evaluate(()=>{mock.mode='view';SYNC.level='view';SYNC.claims='view';window.applyCapability();});
  check(width+': idle REST permission update immediately removes all private panel details',await page.locator('#svc1067-host').evaluate(e=>e.hidden&&e.textContent.trim()===''));
  check(width+': zero page errors or network writes',errors.length===0&&nonGet===0);await ctx.close();
 }
 console.log(pass+' passed, 0 failed');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});
