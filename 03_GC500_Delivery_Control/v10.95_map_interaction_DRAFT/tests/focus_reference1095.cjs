/* Author: Andrew Fisher. Read-only selected-reference proof and optional private pictures. */
'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
module.exports=async function focusReference(page,frame,ref,out,screenshot){
 const host=await page.evaluate(key=>holdAssets(()=>{
  const a=assetOf(key),ap=andrewPin1084(a),nav=navPoint917(a),model=gc500PlanItems();
  return {ref:key,approved:ap&&{lat:ap.place.lat,lon:ap.place.lon},navigation:nav&&nav.ll,
   masterItems:model.items.filter(r=>r.key===key),placed:model.placed.filter(r=>r.key===key),
   units:gcUnits925(a,{loading:false}).map(u=>({id:u.id,assetNo:u.assetNo,item:u.item,owner:u.owner})),card:gc500PlanCard(key)};
 }),ref);
 assert(host.approved,'Selected reference has an existing approved saved pin');
 assert.equal(host.masterItems.length,0,'No stale master marker for the approved reference');
 assert.equal(host.placed.length,1,'Exactly one current reference destination');
 assert.deepEqual(host.placed[0].ll,[host.approved.lat,host.approved.lon]);
 assert.deepEqual([host.navigation.lat,host.navigation.lon],host.placed[0].ll);
 await frame.evaluate(()=>setMode('hybrid'));
 assert(await frame.evaluate(key=>GC500Explorer.find(key),ref),'Selected reference opens in current iframe');
 await frame.waitForFunction(()=>!gotoAnim887&&!zAnim,null,{timeout:15000});
 await page.waitForTimeout(500);
 const child=await frame.evaluate(()=>({selected:{code:selected?.code,places:selected?.places,placedHow:selected?.placedHow},
  hostItems:HOST.items.filter(r=>r.key===selected?.code),shape:GC500Shape1060.at(selected?.code),card:document.getElementById('xcard')?.innerText}));
 assert.equal(child.selected.code,ref);assert.equal(child.selected.places.length,1);
 assert.equal(child.hostItems.length,1);assert.match(child.selected.placedHow,/reference location/);
 assert.equal(child.shape,null,'The old master footprint does not follow the reference pin');
 if(host.units.length>1){assert.match(child.card,/reference location/i,'Reference-location wording is visible without More info');
  assert.match(child.card,/individual units may be elsewhere/i,'Grouped identity is not a claim of exact co-location');}
 fs.writeFileSync(path.join(out,'focus-reference-private.json'),JSON.stringify({host,child}),{mode:0o600});
 if(screenshot){
  await page.locator('#expFrame').screenshot({path:path.join(out,'focus-reference-card.png')});
  await frame.evaluate(()=>{document.getElementById('xcard').hidden=true;});
  try{await page.locator('#expFrame').screenshot({path:path.join(out,'focus-reference-map.png')});}
  finally{await frame.evaluate(()=>{document.getElementById('xcard').hidden=false;});}
 }
 return {pass:true,approvedReferenceLocation:true,oneCurrentMarker:true,historicalFootprint:false,unitIdentityCount:host.units.length,visibleReferenceScope:true};
};
