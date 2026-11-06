/* Author: Andrew Fisher. Native current-model pin identity and hit-target regression. */
const fs=require('fs'),path=require('path'),assert=require('node:assert/strict');
const {openCandidate}=require('./map_native_harness.cjs');const out=process.env.OUT;assert(out,'OUT must name a private evidence directory');fs.mkdirSync(out,{recursive:true});process.env.INITIAL_HASH='#map';
(async()=>{const h=await openCandidate(),p=h.page;let result={};try{
 await p.evaluate(()=>{go('map');Map1188.set('sat');});const sel='#pane-map .s1141-map[data-s1141="map"] .s1141-svg';await p.locator(sel).waitFor({state:'visible'});await p.locator(sel).scrollIntoViewIfNeeded();await p.evaluate(()=>SatMap1141.setZoom('map',2500));await p.waitForTimeout(1000);
 result=await p.evaluate(sel=>{const svg=document.querySelector(sel),gp=svg.querySelector('g.pins'),M=SatMap1141.maps.map,oldFilter=M.filter,old=[...gp.children],before=gp.innerHTML;
  const targets=()=>[...gp.querySelectorAll('[data-s1141-nav]')].map(n=>[n.dataset.id,n.dataset.s1141Nav]);const beforeTargets=JSON.stringify(targets());
  const sentinel=document.createElementNS('http://www.w3.org/2000/svg','g');sentinel.setAttribute('data-native-test-overlay','');svg.append(sentinel);
  for(let i=0;i<20;i++)SatMap1141.setZoom('map',2500);
  const same={pins:old.length,retained:old.filter(n=>n.isConnected).length,markupUnchanged:gp.innerHTML===before,hitTargetsUnchanged:JSON.stringify(targets())===beforeTargets,overlayRetained:sentinel.isConnected};
  M.filter='gen';SatMap1141.setZoom('map',2500);const filtered={pins:gp.children.length,changed:gp.innerHTML!==before,onlyGenerators:[...gp.children].every(n=>n.classList.contains('gen'))};
  M.filter=oldFilter;SatMap1141.setZoom('map',2500);const restored={markup:gp.innerHTML===before,hitTargets:JSON.stringify(targets())===beforeTargets};
  SatMap1141.setZoom('map',3000);const zoomed={markupChanged:gp.innerHTML!==before,hitTargetsUnchanged:JSON.stringify(targets())===beforeTargets};SatMap1141.setZoom('map',2500);sentinel.remove();return{same,filtered,restored,zoomed};
 },sel);
 assert(result.same.pins>0);if(process.env.EXPECT_REUSE!=='0')assert.equal(result.same.retained,result.same.pins);assert(result.same.markupUnchanged&&result.same.hitTargetsUnchanged&&result.same.overlayRetained);assert(result.filtered.changed&&result.filtered.onlyGenerators);assert(result.restored.markup&&result.restored.hitTargets);assert(result.zoomed.markupChanged&&result.zoomed.hitTargetsUnchanged);assert.equal(h.errors.length,0);assert.equal(h.consoleErrors.length,0);assert.equal(h.counts.blocked,0);console.log(JSON.stringify(result));
 }finally{fs.writeFileSync(path.join(out,'pin-regression.json'),JSON.stringify({author:'Andrew Fisher',baseline:h.baseline,result,errors:h.errors,consoleErrors:h.consoleErrors,counts:h.counts},null,2));await h.browser.close();}})().catch(e=>{console.error(e.stack);process.exitCode=1;});
