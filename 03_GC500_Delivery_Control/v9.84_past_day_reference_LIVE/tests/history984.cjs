// Author: Andrew Fisher. Historical data integrity: periods, missing observations and immutable read-only API.
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const folder=path.resolve(__dirname,'..'),data=JSON.parse(fs.readFileSync(path.join(folder,'history984.json'),'utf8'));
const src=fs.readFileSync(path.join(folder,'history984.js'),'utf8');
assert.equal(src.split('__BUILD_HISTORY984_DATA__').length,2,'One build substitution');
const sandbox={window:{}};vm.runInNewContext(src.replace('__BUILD_HISTORY984_DATA__',JSON.stringify(data)),sandbox);
const api=sandbox.window.BuildHistory984;let checks=0;
function check(name,test){test();checks++;}
check('All requested dates and only closed days',()=>{
 assert.equal(api.dates().length,33);assert.equal(api.dates()[0],'2026-09-07');assert.equal(api.dates().at(-1),'2026-10-09');
 for(let n=0;n<33;n++){const d=new Date(Date.UTC(2026,8,7+n)).toISOString().slice(0,10);assert(api.get(d),d);}
 assert.equal(api.get('2026-10-10'),null);assert.equal(api.get('2026-10-23'),null);
});
check('October approved card dates use official daily observations',()=>{
 const expected={'2026-10-07':[18.6,26.6,41,63],'2026-10-08':[16.3,23.1,20,39],'2026-10-09':[18.1,27.6,28,37]};
 for(const [day,values] of Object.entries(expected)){
  const row=api.get(day);assert.deepEqual([row.min_c,row.max_c,row.wind_kph,row.gust_kph],values);
  assert.equal(row.provenance.station_id,'040764');assert.equal(row.src,'bom-history');
 }
});
check('Unreported temperatures and gusts stay unknown',()=>{
 const r=api.get('2026-10-05');assert.equal(r.min_c,null);assert.equal(r.max_c,null);assert.equal(r.gust_kph,null);
 assert.equal(r.partial,true);assert.equal(r.readings[0].temp_c,23.6);assert.equal(r.observations,1);
 assert.equal(api.get('2026-10-06').min_c,null);assert.equal(api.get('2026-10-04').gust_kph,null);
});
check('Rain period never becomes calendar rain or probability',()=>{
 assert.equal(api.get('2026-10-06').rain_to_9am_mm,4.6);
 for(const day of api.dates()){const r=api.get(day);assert.equal(r.rain_pc,null);assert.equal(r.rain_mm,null);}
 assert.match(api.metadata.periods.rain_to_9am_mm,/24 hours to 09:00.*not calendar-day/);
});
check('Gust and sampled sustained wind retain distinct periods',()=>{
 const r=api.get('2026-10-07');assert.equal(r.gust_time,'12:23');assert.equal(r.gust_direction,'SE');
 assert.match(r.wind_basis,/09:00 and 15:00.*not an all-day maximum/);
 assert.match(r.provenance.periods.gust_kph,/24 hours to midnight/);
 assert.match(r.provenance.periods.min_c,/24 hours to 09:00/);
 assert.match(r.provenance.periods.max_c,/24 hours from 09:00/);
});
check('Thermal descriptions do not fabricate atmospheric conditions',()=>{
 for(const day of api.dates()){
  const r=api.get(day);assert.equal(r.code,null);
  if(!['2026-09-12','2026-10-06'].includes(day)){assert.equal(r.kind,'unknown');assert.equal(r.sky_recorded,false);}
 }
 for(const day of ['2026-09-12','2026-10-06']){
  const r=api.get(day);assert.equal(r.kind,'fog');assert.equal(r.text,'Fog observed');
  assert.equal(r.condition_observations[0].time,'09:00');assert.match(r.condition_source.url,/timeanddate\.com\/weather/);
 }
});
check('Every row has dated source and immutable provenance',()=>{
 for(const day of api.dates()){
  const r=api.get(day),source=r.provenance;assert.equal(r.date,day);assert.equal(r.historical,true);
  assert.match(source.url,new RegExp(day.slice(0,7).replace('-','')));
  assert.match(source.snapshot_sha256,/^[a-f0-9]{64}$/);assert.equal(source.timezone,'Australia/Brisbane');
  assert(Object.isFrozen(r));assert(Object.isFrozen(r.readings));assert(Object.isFrozen(source));
 }
 assert.throws(()=>{api.get('2026-10-09').max_c=999;},TypeError);
 assert.equal(api.get('2026-10-09').max_c,27.6);
});
check('Missing and malformed dates are honest and safe',()=>{
 for(const value of ['',null,'__proto__','2025-10-09','2026-10-09T00:00:00Z','2026-02-31'])assert.equal(api.get(value),null);
 assert.equal(api.status('2026-10-11').available,false);assert.equal(api.status('2026-10-11').reason,'Historical observations unavailable');
 assert.equal(api.status('2026-10-05').partial,true);
});
check('No network, storage or operational write dependency',()=>{
 assert(!/\b(?:fetch|XMLHttpRequest|localStorage|indexedDB|SYNC|save|setInterval)\b/.test(src));
 assert.deepEqual(Object.keys(sandbox.window),['BuildHistory984']);
});
console.log(JSON.stringify({author:'Andrew Fisher',passed:checks,days:api.dates().length,through:api.metadata.coverage.through,network:false,writes:0}));
