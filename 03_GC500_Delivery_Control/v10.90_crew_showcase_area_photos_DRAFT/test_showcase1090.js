/* Author: Andrew Fisher. Synthetic evidence only; no operational fixtures. */
'use strict';
const assert=require('node:assert/strict'),S=require('./crew_showcase1090');
const input={day:'2026-10-12',base:{ready:true,stale:false,areas:[
 {id:'buildings',name:'Buildings',unit:'buildings',done:4,total:5,left:1,rows:[{levelled:true}],complete:false},
 {id:'toilets',name:'Toilets',unit:'toilet units',done:7,total:9,left:2,rows:[],complete:false},
 {id:'barriers',name:'Water barriers',unit:'barriers',done:8,total:10,left:2,rows:[],complete:false},
 {id:'vms',name:'VMS',unit:'boards',done:2,total:3,left:1,rows:[],complete:false}
 ],fences:[{id:'clean',recorded:1250},{id:'scrim',recorded:60},{id:'scrim_existing',recorded:40},
 {id:'ccb_event',classificationPending:true,recordedRange:{min:20,max:30}},{id:'ccb_demarc',classificationPending:true,recordedRange:{min:40,max:50}}],
 components:[{id:'base',quantity:20,completeCoverage:false,missingRecordCount:2},{id:'clamp',quantity:30,completeCoverage:false},{id:'cc_barrier',quantity:8,completeCoverage:true}],
 checks:{steps:3,levelled:4,done:5,total:7},toiletArrived:8,completeAreas:0,dockets:4,docketDays:2},
 weather:[{date:'2026-10-01',rain_to_9am_mm:0,max_c:25,gust_kph:40},{date:'2026-10-02',rain_to_9am_mm:2.2,max_c:26,gust_kph:50},{date:'2026-10-13',rain_to_9am_mm:90}],
 bookings:[{id:'a',d:'2026-10-01',t:'12:00'},{id:'a',d:'2026-10-01',t:'12:00'},{id:'b',d:'2026-10-02',f:true},{id:'c',d:'2026-10-03',nb:true,t:'13:00'},{id:'d',d:'2026-10-03',x:true,t:'13:00'},{id:'e',d:'2026-10-04',td:'2026-10-13',t:'13:00'}],
 linked:{state:'ready',dockets:[{id:'a',areas:[{id:'one',label:'<script>Area</script>'}]},{id:'a',areas:[{id:'one',label:'Area'}]},{id:'b',areas:[]}]},
 componentRows:[{date:'2026-10-01',number:'one'},{date:'2026-10-01',number:'one'},{date:'2026-10-02',number:'two'},{date:'2026-10-13',number:'later'}]};
const before=JSON.stringify(input),m=S.model(input);
assert.equal(S.order.length,25);assert.equal(new Set(S.order).size,25);assert.equal(S.keys.length,15);
assert.equal(m.bookings.delivered,1);assert.equal(m.weather.rainMm,2.2);assert.equal(m.weather.wetPeriods,1);
assert.equal(m.weather.last,'2026-10-02');assert.equal(m.links.areas[0].records,1);assert.equal(m.links.unmapped,1);
assert.equal(m.dates.length,2);assert.equal(m.dates[1].records,1);
for(const key of S.keys){const h=S.html(key,m);assert(h.includes('<h2>'),key);assert(!/NaN|undefined/.test(h),key);}
assert(S.html('fence_length1090',m).includes('1.25'));
assert(S.html('fence_panels1090',m).includes('partial record'));
assert(S.html('fence_ccb1090',m).includes('20–30 m'));assert(S.html('fence_ccb1090',m).includes('40–50 m'));
assert(S.html('fence_areas1090',m).includes('&lt;script&gt;'));assert(!S.html('fence_areas1090',m).includes('<script>'));
assert(S.html('install_checks1090',m).includes('not physical stair quantities'));
assert(S.html('fence_repeat1090',m).includes('existing fence'));
assert(S.html('delivery_context1090',m).includes('not counted truck arrivals'));
assert(S.html('weather_context1090',m).includes('not crew exposure'));
assert.equal(S.html('crew',m),null);
const loading=S.model({day:'2026-10-12',base:{ready:false}});
for(const key of S.keys)assert(S.html(key,loading).includes('Progress<br>is loading'));
assert.equal(S.bookingsModel([{id:'a',d:'2026-10-01',t:'12:00'},{id:'a',d:'2026-10-01',t:'13:00'}],'2026-10-12').conflicts,1);
assert.equal(S.weatherModel([],'2026-10-12').rainMm,null);
assert.equal(S.areaModel({state:'loading'}).ready,false);
assert.equal(JSON.stringify(input),before);
console.log('PASS: 25-scene inventory, synthetic counts, date boundaries, booking deduplication, physical units, weather scope, unknowns, escaping and immutable inputs');
