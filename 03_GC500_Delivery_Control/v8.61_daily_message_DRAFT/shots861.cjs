// Author: Andrew Fisher. v8.61 laptop and phone screenshots with a SYNTHETIC recipient only; live reads only.
// The installer list is replaced in the browser by one made-up contact (no record is changed; the harness aborts every
// write and counts it). Nothing is sent: the view link cannot send, and the send button is never pressed.
//   PAGE=<candidate> SHOTS=<private dir> node v8.61_daily_message_DRAFT/shots861.cjs
const fs=require('fs'),path=require('path'),assert=require('node:assert/strict');
const {open}=require(path.resolve(__dirname,'../toolchain/harness/open_page.js'));
const SHOTS=process.env.SHOTS;if(!SHOTS||!process.env.PAGE)throw Error('Set PAGE and SHOTS');fs.mkdirSync(SHOTS,{recursive:true});
const SYN={id:'Sam Example',name:'Sam Example',to:'+61400000000'};
let pass=0;const ok=(c,w)=>{console.log((c?'PASS ':'FAIL ')+w);if(c)pass++;else process.exitCode=1;};
(async()=>{for(const [label,W,H,mobile] of [['laptop',1366,900,false],['phone',390,844,true]]){
 const s=await open({pageFile:process.env.PAGE,hash:'#timeline',W,H,mobile,dpr:mobile?2:1});const p=s.page;const cons=[];
 p.on('console',m=>{if(m.type()==='error')cons.push(m.text().slice(0,160));});
 await p.waitForFunction(()=>typeof go==='function'&&typeof SYNC!=='undefined'&&SYNC.status==='live'&&SYNC.first.size===Object.keys(SYNC_COLLS).length,null,{timeout:180000});
 await p.waitForFunction(()=>typeof daily861Message==='function');
 await p.evaluate(s=>{window.daily821Contacts=()=>[Object.assign({},s)];},SYN);
 const iso=await p.evaluate(()=>{go('timeline');const d=programmeDays().find(d=>d.iso>=todayIso()&&(d.deliveries||[]).length);state.day=d.iso;state.tlView='day';renderTimeline();return d.iso;});
 await p.waitForTimeout(1500);
 const plate=p.locator('#pane-timeline .dplate').first();await plate.scrollIntoViewIfNeeded();
 const tiles=await plate.locator('.dpt').evaluateAll(es=>es.map(e=>(e.querySelector('.dpt-w')||e).textContent.trim()));
 ok(!tiles.some(t=>/^Email/.test(t)),label+': Timeline day plate has no generic Email tile ('+tiles.join(' | ')+')');
 ok(await p.locator('#pane-timeline .dplate [data-pdf7]').count()>0,label+': document-group PDF/email controls remain');
 await plate.screenshot({path:SHOTS+'/timeline-no-email-tile-'+label+'.png'});
 await p.locator('.dplate [data-daily821-toggle="'+iso+'"]').click();const panel=p.locator('[data-daily821-panel="'+iso+'"]');
 await p.locator('[data-daily821-recipient="'+iso+'"]').selectOption(SYN.id);
 const popupP=p.waitForEvent('popup');await p.locator('[data-daily821-preview="'+iso+'"]').click();const popup=await popupP;
 await p.waitForFunction(iso=>daily821Session(iso).prepared&&!daily821Session(iso).busy,iso,{timeout:60000});await popup.close();
 const info=await p.evaluate(iso=>{const s=daily821Session(iso);return {weather:s.prepared.weather861,sendDisabled:document.querySelector('[data-daily821-send="'+iso+'"]').disabled,status:s.message,far:daily861Weather('2026-10-23'),past:daily861Weather('2026-10-01')};},iso);
 const text=await panel.locator('.daily861-preview pre').textContent();
 ok(text.startsWith('Good morning, Sam.'),label+': greeting uses the synthetic first name');
 ok(text.split('\n').pop()==='[Daily run link]',label+': daily link placeholder is last');
 ok(/Take 5/.test(text),label+': Take 5 reminder');ok(text.length<=480,label+': '+text.length+' characters (limit 480)');
 ok(info.weather.available&&/^Surfers Paradise (forecast|outlook): /.test(info.weather.text),label+': sourced forecast for '+iso+': '+info.weather.text);
 ok(!info.far.available&&/unavailable/.test(info.far.text),label+': 23 Oct (beyond ten days) reads unavailable');
 ok(!info.past.available,label+': a past day reads unavailable');
 ok(info.sendDisabled,label+': view link cannot send');
 await panel.scrollIntoViewIfNeeded();await panel.screenshot({path:SHOTS+'/message-daily-runs-preview-'+label+'.png'});
 const seen=await p.evaluate(()=>document.querySelector('#pane-timeline').innerText);
 ok(!/SiteIQ|Claude|Codex|ChatGPT|\bGPT\b/.test(seen),label+': no SiteIQ or agent/model names in the Timeline text');
 await p.locator('[data-daily821-close="'+iso+'"]').click();
 await p.evaluate(()=>go('plant'));await p.waitForTimeout(1500);
 const btn=p.locator('#pane-plant .eqtools [data-ep860-inventory]');ok(await btn.count()===1&&await btn.isVisible(),label+': Equipment shows Print Event Portables inventory');
 await btn.scrollIntoViewIfNeeded();await p.locator('#pane-plant .eqtools').screenshot({path:SHOTS+'/equipment-tools-'+label+'.png'});
 await btn.click();await p.waitForFunction(()=>typeof EP860!=='undefined'&&EP860.file&&document.querySelector('#ep860-dialog [data-ep860-share]'),null,{timeout:120000});
 const inv=await p.evaluate(()=>({pages:EP860.file.pages,type:EP860.file.file.type}));ok(inv.type==='application/pdf'&&inv.pages>0,label+': inventory PDF '+inv.pages+' pages');
 await p.screenshot({path:SHOTS+'/equipment-inventory-print-'+label+'.png'});await p.locator('[data-ep860-close]').click();
 const plantText=await p.evaluate(()=>document.querySelector('#pane-plant').innerText);ok(!/SiteIQ|Claude|Codex|ChatGPT|\bGPT\b/.test(plantText),label+': no SiteIQ or agent/model names in the Equipment text');
 ok(s.errors.length===0,label+': '+s.errors.length+' page errors');ok(cons.filter(c=>!/createSession|ERR_BLOCKED/.test(c)).length===0,label+': console errors '+JSON.stringify(cons));
 ok(s.counts.blocked===0,label+': attempted writes '+JSON.stringify(s.counts));
 await s.browser.close();}
 console.log('shots861: '+pass+' passed');})().catch(e=>{console.error('FAIL',e.stack);process.exit(1);});
