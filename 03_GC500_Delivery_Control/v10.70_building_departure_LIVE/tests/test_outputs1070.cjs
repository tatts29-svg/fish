/* Author: Andrew Fisher. Native bounded draft-email builders retain the rule and native limits. */
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const page=fs.readFileSync(process.argv[2],'utf8');
function between(start,end){const a=page.indexOf(start),b=page.indexOf(end,a);assert.ok(a>=0&&b>a);return page.slice(a,b);}
const pdf=between('function pdf7MailText(', '/* Copy the email text:');
const mail=between('function mail816(', 'function wireDemob816(');
const ctx=vm.createContext({assert,URL,URLSearchParams});
vm.runInContext(`
this.window=this;let include=true;const RULE='Buildings: leave pick-up before 07:00; Kingston departures away by 05:00.';
BuildingDeparture1070={words:RULE,mailWords:()=>RULE,missing:()=>RULE,row:r=>r.a.discipline==='Portable buildings'&&!r.accessory,load:(g,iso)=>include&&g.building&&iso>='2026-09-21',inScope:iso=>iso>='2026-09-21',building:a=>a.discipline==='Portable buildings'};
const loads=[{building:true,label:'Building 6m x2; time09:45; door passenger'},{building:false,label:'Fridge x1'}];
const programmeDays=()=>[{iso:'2026-10-19'}],dpLoads=()=>loads,fmtDate=x=>x,dayWords816=x=>x,dpLoadLine=g=>g.label;
const DP_MAIL={drivers:'Driver sheets',install:'Install sheets',prestart:'Pre-start'},DP_MAIL_MAX=700;
const mailto=(subject,body)=>'mailto:?subject='+encodeURIComponent(subject)+'&body='+encodeURIComponent(body);
const DM816={order:['fixture'],name:{fixture:'Fixture'}};
const demob816=()=>({day:{'2026-10-26':{}}});const kindWord=()=>'';
${pdf}
${mail}
let checks=0;const check=(v,m)=>{assert.ok(v,m);checks++;};
let x=pdf7MailText('drivers','2026-10-19',0,null,1800);
check(x.text.includes(RULE)&&x.text.includes(loads[0].label),'PDF email rule alongside original load facts');
check(!pdf7MailText('drivers','2026-10-19',1,null,1800).text.includes(RULE),'nonbuilding selected load unaffected');
const cap=1100;x=pdf7MailText('drivers','2026-10-19',null,null,cap);
check(x.text.includes(RULE)&&mailto(x.subject,x.text).length<=cap,'native URL size reduction retains rule');
const rows=Array.from({length:40},(_,i)=>({key:'EXAMPLE'+i,zone:'fixture',branch:'TEST',src:'plan',a:{discipline:'Portable buildings',item_types:['Building 6m']}}));
x=mail816('2026-10-26','all',rows,[]);const body=new URL(x).searchParams.get('body');
check(body.includes(RULE),'demob draft rule precedes truncation');
check(body.length<=DP_MAIL_MAX,'native demob body limit preserved');
check(body.includes('EXAMPLE0')&&body.includes('see the Demob tab'),'native row text and truncation notice retained');
check(!new URL(mail816('2026-09-20','all',rows,[])).searchParams.get('body').includes(RULE),'earlier demob fixture is not changed');
check(!new URL(mail816('2026-10-26','all',rows.map(r=>({...r,a:{discipline:'Furniture'}})),[])).searchParams.get('body').includes(RULE),'nonbuilding demob email unchanged');
check(!new URL(mail816('2026-10-26','all',rows.map(r=>({...r,accessory:true})),[])).searchParams.get('body').includes(RULE),'accessory-only demob email unchanged');
this.result={checks,passed:true};
`,ctx);
console.log(JSON.stringify({author:'Andrew Fisher',...ctx.result}));
