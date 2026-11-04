/* Author: Andrew Fisher. Read-only Demob map and native location-snapshot checks. */
const fs=require('fs'),assert=require('assert/strict');
const {open}=require('../toolchain/harness/open_page');
(async()=>{const out=process.env.OUT;fs.mkdirSync(out,{recursive:true});
 const s=await open({pageFile:process.env.PAGE,hash:'#demob',W:390,H:844,mobile:true,dpr:1});
 try{const p=s.page;await p.waitForFunction(()=>window.Singles1238?.mapLoc1297&&window.DemobCollection996);await p.evaluate(()=>go('demob'));await p.waitForFunction(()=>document.querySelector('.sg1238'));
 const result=await p.evaluate(()=>{
  const check=(v,m)=>{if(!v)throw Error(m)},before=JSON.stringify(S),cards=Singles1238.model().cards;
  const locations=cards.map(c=>({c,L:Singles1238.mapLoc1297(c)}));
  check(locations.some(x=>x.L?.demob1297.kind==='footprint'),'Native source footprints missing');
  check(locations.some(x=>['reference','unassigned'].includes(x.L?.demob1297.kind)),'Qualified native reference layouts missing');
  check(locations.every(x=>!x.L||x.L.demob1297.kind!=='unlocated'),'Reporting point leaked');
  check(!document.querySelector('.sg1238 .pu1238'),'Legacy circular overlay retained');
  for(const {c,L}of locations){if(!L)continue;check(L.a||!assetOf(c.key),'Details link lost');if(c.st.s==='gone'){
   const a=[...document.querySelectorAll('article.sg1238')].find(x=>x.dataset.sg1238===c.key&&x.dataset.u1238===c.uid);if(a){check(a.querySelector('.stw1238'),'Pickup stamp lost');check(a.querySelectorAll('[data-pi1238]').length===3,'Picked-up map missing');}
   check(L.pickup1297.historical||L.warn.includes('No map position was saved'),'Older pickup presented as verified historical position');
  }}
  let validation=null;
  for(const c of cards.filter(c=>c.st.s!=='gone'&&c.u&&!c.tank&&!c.group)){
   const snap=DemobCollection996.snapshot(c.key);if(!snap||snap.reading.issues.length||!snap.reading.arrival||snap.record.state!=='on site')continue;
   const item=snap.reading.remaining.find(x=>x.n>0&&(snap.pools[String(x.type).toLowerCase().replace(/\s+/g,' ').trim()]||[]).length>0);if(!item)continue;
   const id=snap.pools[String(item.type).toLowerCase().replace(/\s+/g,' ').trim()][0],now=new Date(Date.now()+36000000).toISOString(),request={token:snap.token,id:'read-only-fixture-1297',date:now.slice(0,10),departedAt1211:now.slice(0,19)+'+10:00',items:[{type:item.type,n:1,unitIds:[id]}]};
   const test=DemobCollection996.validate(c.key,request);check(test.ok,'Native validation failed: '+test.message);check(test.value.items[0].n===1&&test.value.items[0].unitIds[0]===id,'Native selection changed');
   const saved=test.value.pickupLocations1297;if(!saved)continue;
   check(saved.capturedAt&&saved.arrivalAt===new Date(snap.reading.arrival.at).toISOString(),'Snapshot timestamps missing');
   check(Object.keys(saved.units).every(k=>k===id),'Unselected units saved');
   const rows=gcUnits925(c.r.a,{loading:false}),unit=rows.find(u=>u.id===id),card={...c,u:unit,tank:null,st:{s:'gone',at:request.departedAt1211},gone:{at:request.departedAt1211}},reading={...snap.reading,issues:[],events:[test.value]};
   const old=PickupLocations1297.resolve(card,{lat:-28.2,lon:153.3,how:'Later changed pin'},{reading,rows});
   check(old.historical&&old.location.lat!==-28.2,'Later pin overwrote saved historical location');
   check(PickupLocations1297.signature(snap.pickupLocations1297)===PickupLocations1297.signature(DemobCollection996.snapshot(c.key).pickupLocations1297),'Clock invalidates stable form');
   validation={passed:true,selectedOnly:true,historyImmutable:true,stableToken:true};break;
  }
  check(validation,'No native collection snapshot fixture available');check(JSON.stringify(S)===before,'Read-only checks mutated native state');
  const gone=locations.find(x=>x.c.st.s==='gone'&&x.L?.demob1297.kind==='footprint'&&Find1176.inAerial(x.L));
  const footprint=locations.find(x=>x.c.st.s!=='gone'&&x.L?.demob1297.kind==='footprint');
  const simple=x=>({key:x.c.key,uid:x.c.uid});
  return {cards:cards.length,gone:simple(gone),footprint:simple(footprint),validation};
 });
 for(const [name,c]of [['picked-up',result.gone],['plan-shape',result.footprint]]){
  await p.evaluate(c=>Singles1238.goCard(c.key,c.uid),c);
  const selector='article.sg1238[data-sg1238='+JSON.stringify(c.key)+'][data-u1238='+JSON.stringify(c.uid)+']';
  await p.locator(selector+' [data-pic1238]').first().scrollIntoViewIfNeeded();
  await p.waitForFunction(sel=>{const imgs=[...document.querySelectorAll(sel+' img[data-pi1238]')];return imgs.length===3&&imgs.every(i=>i.classList.contains('on')&&i.complete&&i.naturalWidth>0)},selector,{timeout:60000});
  assert.equal(await p.locator(selector).evaluate(a=>a.scrollWidth<=a.clientWidth+1),true);
  await p.locator(selector).screenshot({path:out+'/'+name+'-card.png'});
  await p.locator(selector+' [data-pic1238]').first().tap();
  await p.waitForFunction(()=>document.querySelector('.find1176')?._loc?.demob1297);
  await p.waitForFunction(()=>Object.keys(document.querySelector('.find1176')?._pics||{}).length===3,null,{timeout:60000});
  assert.equal(await p.locator('.find1176 [data-f1176=details]').count(),1);
  const dlg=await p.locator('.find1176').evaluate(d=>({marker:d._loc.demob1297.kind,note:d._loc.warn||'',text:Find1176.words(d._loc),fit:d.scrollWidth<=d.clientWidth+1}));
  assert(dlg.fit);if(name==='picked-up'){assert(dlg.note.includes('No map position was saved'));assert(dlg.text.includes('No map position was saved'));}
  await p.locator('.find1176').screenshot({path:out+'/'+name+'-full-map.png'});
  await p.locator('.find1176 .close').tap();assert.equal(await p.locator('.find1176').count(),0);
 }
 assert.equal(s.errors.length,0,JSON.stringify(s.errors));assert.equal(s.counts.blocked,0);
 fs.writeFileSync(out+'/result.json',JSON.stringify({passed:true,cards:result.cards,validation:result.validation,pickedUpMaps:true,shapes:true,phoneFit:true,details:true,fullSize:true,errors:0,writes:0},null,2));
 console.log('PASS native Demob cards, pickup maps, shape/detail dialogs, snapshot validation, unchanged state, zero writes/errors');
 }catch(e){await s.page.screenshot({path:out+'/failure.png'});fs.writeFileSync(out+'/errors.json',JSON.stringify({errors:s.errors,counts:s.counts}));throw e;}finally{await s.browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
