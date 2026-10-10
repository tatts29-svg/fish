// Author: Andrew Fisher. Daily works preserve dates, quantities, source precedence and work kinds.
const fs=require('fs'),vm=require('vm'),assert=require('assert/strict'),path=require('path');
const context={};vm.createContext(context);vm.runInContext(fs.readFileSync(path.join(__dirname,'../work986.js'),'utf8'),context);
const create=context.BuildWork986.create;let checks=0;const check=(ok,label)=>{assert(ok,label);checks++};
const day='2026-10-09',today='2026-10-10',a={key:'P1',name:'Office',discipline:'Portable buildings'},b={key:'WC1',name:'Toilet',discipline:'Toilets & amenities'};
const at='2026-10-08T20:00:00Z',env={assets:[a,b,a],arrivals:()=>[{a,at},{a,at},{a:b,at:'2026-10-09T20:00:00Z'}],delivery:key=>key==='P1'?{done:true,done_at:at,levelled:true,levelled_at:at,steps:false,steps_at:at}:{done:true,done_at:'2026-10-08T12:00:00Z'},complete:()=>true,
 dockets:[{id:'r1',docket_no:'123',usable:true,date:day,location:'Park',quantities:{clean:90,scrim:90,ped_gates:2}},{id:'r1-photo',docket_no:'123',usable:true,date:day,location:'Park',quantities:{clean:90,scrim:90,ped_gates:2}},{id:'r2',docket_no:'124',usable:true,date:'2026-10-08',location:'Old',quantities:{clean:500}},{id:'r3',docket_no:'125',usable:false,date:day,quantities:{clean:700}}],
 services:[{id:'s1',note_no:'55',usable:true,date:day,location:'Pit Lane',labour_hours:4,metres:150}],
 collections:[{id:'c1',collection_no:'9',usable:true,date:day,location:'Pit Lane',collected:{mesh_panel:38,base:36,clamp:38}}]};
const before=JSON.stringify(env),m=create(env).day(day,today,{iso:day}),find=label=>m.rows.find(r=>r.label===label);
check(m.heading==='WORK RECORDED'&&m.recorded&&!m.planned,'Past facts explicitly recorded');
check(find('Arrived')?.value==='1 ref','Arrivals use Brisbane calendar date and deduplicate references');
check(find('Installed')?.value==='1 ref','Install is dated, deduplicated and separate from arrival');
check(find('Levelled')?.value==='1 ref'&&!find('Stairs fitted'),'False stairs tick never implies completed stairs');
check(find('Mesh fence')?.value==='90 m'&&find('Scrim')?.value==='90 m','Duplicate paper photo counted once; separate physical work types remain separate');
check(find('Pedestrian gates')?.value==='2 each','Gates remain each, never added to metres');
check(find('Fencing service notes')?.value==='4 h','Service hours are separate from physical fencing quantities');
check(find('Mesh panels collected')?.value==='38 each','Collection remains a component count, never new installed metres');
check(m.details.some(r=>r.kind==='fencing'&&r.label.includes('Park')&&r.source==='Hire agreement 123'),'Location and source retained for drilldown');
check(JSON.stringify(env)===before,'Input records are unchanged');
const none=create({}).day(day,today);check(none.empty&&none.rows[0].value==='No work recorded','Absent actual data means no record, not zero completed');
const noPlan=create({}).day(today,today,{iso:today,deliveries:[]});check(noPlan.empty&&noPlan.rows[0].value==='Nothing scheduled','Empty programme is distinct from missing actual record');
const unavailable=create({ready:()=>false}).day(day,today);check(!unavailable.ready&&unavailable.rows[0].value==='Loading records','Incomplete sync never displays no-work conclusion');
check(!create({}).day('2026-02-31',today).ready,'Invalid date rejected');
check(!create({}).day(today,today,{iso:'2026-10-11'}).ready,'Mismatched day rejected');
const plans={sheets:[{sheet:'CON WK1',year:2026,programme_rows951:[{source_row:3,date:today,included:true,location:'Old map',description:'Old perimeter',quantities:{'Temporary Fence (m) — Clean':1000}}],plan_update:{file:'new.pdf',days_covered:[today],rows_by_day:[{date:today,rows:[{id:'new',location:'Main Beach',description:'Residents fence',page:2,fields:{'Temporary Fence (m) — Clean':125,'Ped. Gates':1}},{id:'new',location:'Main Beach',description:'Residents fence',page:2,fields:{'Temporary Fence (m) — Clean':125,'Ped. Gates':1}}]}]}},{sheet:'CON WK2',year:2025,programme_rows951:[{source_row:4,date:today,included:true,quantities:{'Temporary Fence (m) — Clean':3000}}]}]};
const planned=create(plans).day(today,today,{iso:today,deliveries:[{a,events:[{sheet:'Week 1'}]},{a,events:[{sheet:'Week 1'}]},{a:b,events:[]}],removals:[{a}],unref:[]});
check(planned.rows.find(r=>r.label==='Mesh fence')?.value==='125 m','Updated dated plan wins; repeated task deduplicated; stale year excluded');
check(planned.rows.find(r=>r.label==='Buildings · due in')?.value==='1 ref'&&planned.rows.find(r=>r.label==='Buildings · due out')?.value==='1 ref','Movements retain direction and count distinct refs, not mixed units');
check(planned.details.some(r=>r.source==='new.pdf · p2')&&!planned.details.some(r=>r.label.includes('Old map')),'Only authoritative plan evidence shown for replaced dates');
check(planned.heading==='PLANNED WORK'&&!planned.recorded&&planned.planned,'Today schedule never labelled completed');
const future='2026-10-12',fallback=create({sheets:[{sheet:'CON WK1',year:2026,programme_rows951:[{date:future,included:true,location:'Park',description:'Perimeter',quantities:{'Temporary Fence (m) — Clean':12}},{date:future,included:false,location:'Out of scope',quantities:{'Temporary Fence (m) — Clean':1200}}]}]}).day(future,today);
check(fallback.rows.find(r=>r.label==='Mesh fence')?.value==='12 m','Uncovered dates read included programme task rows only');
const bad=create({dockets:[{id:'a',docket_no:'1',date:day,usable:true,quantities:{clean:10}},{id:'b',docket_no:'1',date:day,usable:true,quantities:{clean:11}}]}).day(day,today);
check(bad.issues.length===1&&!bad.rows.some(r=>r.label==='Mesh fence'),'Conflicting copies do not arbitrarily produce a quantity');
const unknown=create({dockets:[{id:'a',date:day,usable:true,location:'Fence',quantities:{clean:null,scrim:'90',ped_gates:-1}}]}).day(day,today);
check(!unknown.rows.some(r=>r.value.includes(' m'))&&unknown.details.length===1,'Blank, string and invalid quantities are not coerced to physical work');
const partial=create({...env,complete:()=>false}).day(day,today);check(!partial.rows.some(r=>r.label==='Installed')&&partial.rows.some(r=>r.label==='Arrived'),'Partial native quantity check prevents complete installation claim');
const movement=create({operations:[{date:day,type:'relocation',unit:'m',quantity:25,location:'Race Admin',number:'24474',paperSourceIds:['24474.jpg']},{date:day,type:'clean',unit:'m',quantity:99}]}).day(day,today);
check(movement.rows.find(r=>r.label==='Fence relocation')?.value==='25 m'&&!movement.rows.some(r=>r.label==='Mesh fence'),'Only reviewed distinct movement operations add physical metres');
const closed=create({sheets:[{year:2026,plan_update:{days_covered:[today],rows_by_day:[{date:today,rows:[{id:'site-closed',description:'Public holiday — site closed',fields:{}}]}]}}]}).day(today,today);
check(closed.rows[0].kind==='closure'&&!closed.rows.some(r=>r.value.includes('tasks')),'Site closure is not counted as scheduled work');
check(bad.rows[0].value==='Records under review','Conflicting records are not described as no work');
console.log(JSON.stringify({author:'Andrew Fisher',pass:true,checks}));
