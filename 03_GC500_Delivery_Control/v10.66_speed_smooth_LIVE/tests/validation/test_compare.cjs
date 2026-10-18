/* Author: Andrew Fisher. Prevent focused evidence from concealing unrelated numeric or provenance drift. */
'use strict';
const fs=require('fs'),os=require('os'),path=require('path'),assert=require('assert'),{spawnSync}=require('child_process');
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'gc500-parity-contract-')),script=path.join(__dirname,'compare.cjs');
const clone=x=>JSON.parse(JSON.stringify(x));
const capture=release=>({pass:true,pageSha256:release,mobile:false,clock:'fixed',version:1,versionAfter:1,tabs:['today','progress','costs'],dayKeys:['day'],drawerKeys:['reference'],fixtureSetup:{recordSha256:'record',merge:{complete:true},secondChanges:[]},initial:{tab:'today',selected:'today'},panes:{today:{visible:'80.06%',full:'80.06%'},progress:{visible:'',full:'636 of 653'},costs:{visible:'$1,000.01',full:'$1,000.01'}},days:{day:{visible:'3 of 4',full:'3 of 4'}},drawers:{reference:{visible:'Qty3',full:'Qty3'}},header:{visible:'Live',full:'Live'},footer:{visible:'Footer · '+release,full:'Footer · '+release+'Shared record'}});
const base=capture('v10.65'),candidate=capture('v10.66');
const focus=c=>({pass:true,method:'settled-native-screen-report-v1',pageSha256:c.pageSha256,mobile:c.mobile,clock:c.clock,version:c.version,recordSha256:c.fixtureSetup.recordSha256,panes:{today:c.panes.today,progress:c.panes.progress}});
let checks=0;
function run(label,a,b,af,bf,expected){const values=[a,b,...(af?[af,bf]:[])],files=values.map((v,i)=>{const f=path.join(dir,i+'.json');fs.writeFileSync(f,JSON.stringify(v));return f;});const r=spawnSync(process.execPath,[script,...files],{encoding:'utf8'});assert.equal(r.status===0,expected,label+': '+r.stdout+' '+r.stderr);checks++;}
try{
 run('footer including adjacent Shared boundary',base,candidate,null,null,true);
 for(const [label,change] of [['cent',b=>b.panes.costs.full='$1,000.02'],['quantity',b=>b.drawers.reference.full='Qty4'],['percentage',b=>b.panes.today.visible='80.07%'],['order',b=>b.days.day.full='4 of 3']]){const b=clone(candidate);change(b);run(label,base,b,null,null,false);}
 const af=focus(base),bf=focus(candidate);run('bound focused samples',base,candidate,af,bf,true);
 for(const [label,change] of [['source',f=>f.pageSha256='other'],['record',f=>f.recordSha256='other'],['clock',f=>f.clock='other'],['scope',f=>f.panes.costs={visible:'x',full:'x'}]]){const f=clone(bf);change(f);run('reject focused '+label,base,candidate,af,f,false);}
 const changed=clone(candidate);changed.panes.costs.full='$1,000.02';run('focused samples cannot conceal unrelated cost change',base,changed,af,bf,false);
 console.log(JSON.stringify({pass:true,checks}));
}finally{fs.rmSync(dir,{recursive:true,force:true});}
