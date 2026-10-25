/* Author: Andrew Fisher. Declaration evidence, legacy history and existing counts; synthetic records only. */
'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert/strict');
const page=fs.readFileSync(process.env.PAGE,'utf8'),base=fs.readFileSync(process.env.BASE,'utf8');let checks=0;
function check(v,m){assert(v,m);checks++;console.log('PASS '+m);}
function extract(s,a,b){const i=s.indexOf(a),j=s.indexOf(b,i);assert(i>=0&&j>i);return s.slice(i,j+b.length);}
function json(s,v){return JSON.parse(s.split('\n').find(l=>l.startsWith('var '+v+'=')).slice(v.length+5,-1));}
const old=json(base,'SVC1067_CARD'),cur=json(page,'SVC1067_CARD'),oldData=json(base,'SVC1067_DATA'),data=json(page,'SVC1067_DATA');
const undoLabel=d=>{d=structuredClone(d);d.tasks.lockup='Locked';return d;};
check(JSON.stringify(undoLabel(cur.data))===JSON.stringify(old.data),'crew quantities, identities, rosters, plans and locations unchanged');
check(JSON.stringify(undoLabel(data))===JSON.stringify(oldData),'main servicing data unchanged except physical-door label');
const state=extract(page,'var SvcState = (function () {','module.exports = SvcState;');
check(state===extract(base,'var SvcState = (function () {','module.exports = SvcState;'),'shared counting/cancellation rules unchanged');
const ctx={module:{exports:{}},console};vm.runInNewContext(extract(page,'var SvcCrews1173 =','module.exports=SvcCrews1173;'),ctx);vm.runInNewContext(state,ctx);
const S=ctx.module.exports;vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../lock1221_shared.js'),'utf8'),ctx);const L=ctx.module.exports;
const script=s=>s.match(/<script id="report1202-script">([\s\S]*?)<\/script>/)[1];
vm.runInNewContext(script(page),ctx);const R=ctx.module.exports;
const oldCtx={module:{exports:{}},console};vm.runInNewContext(script(base),oldCtx);const oldR=oldCtx.module.exports;
const day='2026-10-25',now=Date.parse('2026-10-25T20:00:00+10:00');
const D={days:[{id:day,label:'Sun 25',plan:'final'}],tasks:{pump:'Pump out',clean:'Clean & restock',lockup:'Locked (doors locked)'},plans:{fwf:{final:['pump','clean','lockup']}},crewGroups:[{id:'cleaners',label:'Cleaners — Alpha and Beta'}],areas:[{n:1,name:'Test area',refs:[{ref:'TEST',lines:[{id:'TEST-FWF',kind:'fwf',qty:3,label:'Three toilets'}]}]}]};
const tick=(id,extra={})=>({id,ref:'TEST',line:'TEST-FWF',task:'lockup',day,done:true,undoes:[],at:'2026-10-25T09:02:00Z',tapped_at:'2026-10-25T09:01:00Z',crew_group:'cleaners',...extra});
const declaration={version:1,by:'Alpha',crew:'Cleaners — Alpha and Beta',units:3};
const I=events=>({D,S,C:ctx.SvcCrews1173,crewData:D,events,now,read:now,day,meta:{load:'servicing-tracker:GC500-2026'}});
let r=R.model(I([tick('new',{lock_declaration:declaration})]));
check(r.pct===33&&r.jobs.d===3&&r.jobs.w===9,'lock declaration does not fabricate pump/clean completion');
check(r.lockDeclarations.rows.length===1&&r.lockDeclarations.rows[0].units===3&&r.lockDeclarations.rows[0].by==='Alpha','one name covers the exact grouped line');
check(r.lockDeclarations.rows[0].crew===declaration.crew,'group names are preserved');
check(r.lockDeclarations.rows[0].declaredAt!==r.lockDeclarations.rows[0].receivedAt,'phone declaration and service receipt times distinct');
const comparable=JSON.parse(JSON.stringify(r));delete comparable.lockDeclarations;delete comparable.hm;const before=JSON.parse(JSON.stringify(oldR.model(I([tick('new',{lock_declaration:declaration})]))));delete before.hm;
check(JSON.stringify(comparable)===JSON.stringify(before),'night totals and every existing report field unchanged');
const html=R.html(r);check(html.includes(L.statement)&&html.includes('Declared by Alpha')&&html.includes('Cleaners — Alpha and Beta'),'report prints declaration wording and named group');
check(html.includes('2026-10-25 19:01 AEST')&&html.includes('Received by service: 2026-10-25 19:02 AEST'),'report has dated AEST tap and receipt times');
r=R.model(I([tick('old')]));check(r.lockDeclarations.legacy===1&&r.lockDeclarations.rows.length===0,'legacy tick remains complete without invented declaration');
check(R.html(r).includes('no named declaration recorded'),'report clearly distinguishes legacy completion');
r=R.model(I([tick('new',{lock_declaration:declaration}),tick('undo',{done:false,undoes:['new'],at:'2026-10-25T09:03:00Z'})]));
check(r.pct===0&&r.lockDeclarations.rows[0].status==='Withdrawn'&&r.lockDeclarations.rows[0].withdrawnAt==='2026-10-25T09:03:00Z','withdrawal preserved without active completion');
r=R.model(I([tick('new',{lock_declaration:declaration}),{voids:['new']}]));check(r.pct===0&&r.lockDeclarations.rows[0].status==='Voided','voided evidence not shown as active');
r=R.model(I([tick('new',{lock_declaration:declaration,local:true})]));check(r.lockDeclarations.rows[0].status==='Pending sync','pending declaration is labelled');
r=R.model(I([tick('other',{day:'2026-10-24',lock_declaration:declaration})]));check(!r.lockDeclarations.rows.length,'other nights excluded');
const e=tick('duplicate',{lock_declaration:declaration});r=R.model(I([e,e]));check(r.lockDeclarations.rows.length===1,'duplicate transport reads do not duplicate evidence');
const escaped=R.model(I([tick('escaped',{lock_declaration:{...declaration,by:'A & B',crew:'Team "Two"'}})]));check(R.html(escaped).includes('A &amp; B')&&R.html(escaped).includes('Team &quot;Two&quot;'),'names safely escaped');
check(!L.valid({...declaration,by:'<script>'})&&!L.valid({...declaration,by:' '}),'invalid names excluded');
const many=R.model(I(Array.from({length:120},(_,n)=>tick('many'+n,{lock_declaration:{...declaration,by:'Tester '+n}}))));
if(process.env.EVIDENCE){fs.mkdirSync(process.env.EVIDENCE,{recursive:true});fs.writeFileSync(path.join(process.env.EVIDENCE,'report-synthetic.html'),R.html(many));}
console.log(JSON.stringify({checks,synthetic:true,existingTotalsPreserved:true}));
