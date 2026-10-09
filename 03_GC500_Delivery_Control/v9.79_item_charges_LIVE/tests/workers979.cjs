// Author: Andrew Fisher. Read-only roster projection and explicit-save mapping tests.
const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const html=fs.readFileSync(process.env.PAGE,'utf8');
const a=html.indexOf('const StaffNames910 = (() => {'),b=html.indexOf('</script>',a),code=html.slice(a,b);
let rows=[],writes=[];const c={S:{loads:{}},ourCosts:()=>rows,rosterIncludes858:r=>!r.didNotWork,runHours:r=>r.hours,runWorked:r=>r.hours,crew883Key:(d,r)=>'crew/'+d+(r?'/'+r:''),crew883Plan:(d,r)=>c.S.loads[c.crew883Key(d,r)]||{people:[],start:'',finish:'',location:'',order:null},crew883SaveDay:(d,count,names)=>{writes.push('day');c.S.loads[c.crew883Key(d)]={count,names};return true},crew883SavePlan:(d,r,v)=>{writes.push('plan');c.S.loads[c.crew883Key(d,r)]=v;return true},bump:()=>{}};
vm.createContext(c);vm.runInContext(code+'\nthis.api=StaffNames910;',c);const api=c.api;
const shift=(name,extra={})=>({id:name,person:name,date:'2026-10-13',kind:'labour',usable:true,hours:8,start:'06:00',finish:'14:00',...extra});
rows=[shift('Andrew Fisher'),shift('Scott'),shift('Andrew Fisher',{id:'second'}),shift('Did not work',{didNotWork:true}),shift('Fencing Crew',{headcount:6}),shift('Blank hours',{hours:null})];
let m=api.day('2026-10-13');assert.equal(m.count,2);assert.deepEqual(Array.from(m.names),['Andrew Fisher','Scott']);assert.equal(m.rosterDefault979,true);assert.equal(writes.length,0);
const token=m.mappingToken;rows.reverse();assert.notEqual(api.day('2026-10-13').mappingToken,token);rows.reverse();
const values={people:[{slot:1,roles:[]}],start:'',finish:'',location:'Higman',order:null};let result=api.savePlan('2026-10-13','P25',values,token,api.planToken('2026-10-13','P25'));assert.equal(result.kept,true);assert.deepEqual(writes,['day','plan']);assert.equal(api.day('2026-10-13').rosterDefault979,undefined);rows.reverse();assert.equal(api.day('2026-10-13').names[0],'Andrew Fisher');
c.S.loads={};rows=[shift('Andrew Fisher')];m=api.day('2026-10-13');rows.push(shift('New person'));result=api.savePlan('2026-10-13','P25',values,m.mappingToken,api.planToken('2026-10-13','P25'));assert.equal(result.accepted,false);assert.equal(writes.length,2);
c.S.loads['crew/2026-10-13']={count:0,names:[]};assert.equal(api.day('2026-10-13').count,0);assert.equal(api.day('2026-10-13').rosterDefault979,undefined);
c.S.loads={'crew/2026-10-13/P25':{kind:'crew883',day:'2026-10-13',ref:'P25',people:[{slot:1,roles:[]}]}};assert.equal(api.day('2026-10-13').rosterDefault979,undefined);assert.equal(api.day('2026-10-13').count,null);
c.S.loads={};rows=[];assert.equal(api.day('2026-10-13').count,null);assert.equal(api.day('2026-10-10').roster.length,0);
console.log(JSON.stringify({author:'Andrew Fisher',checks:17,passed:true,renderWrites:0,explicitSaveWrites:['day','plan']}));
