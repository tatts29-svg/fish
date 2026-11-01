// Author: Andrew Fisher. Synthetic review tests; no operational records or private figures.
// Usage: node test_row_rule_scope.cjs path/to/patch_v1278.py
// The dc055 helper fails six relevance checks; the proposed row-aware helper passes.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const patch=fs.readFileSync(process.argv[2],'utf8');
const embedded=patch.match(/FN = """([\s\S]*?)"""/);
assert(embedded,'Python patch FN source found');
const helper=embedded[1].split('function fin745Rows(asOf)')[0];
const ctx={};vm.createContext(ctx);
vm.runInContext(`
const RUN_DEF={cna_ord:7.6,lh_ord:7.5,ot_x15:2,sat_x15:2,wd_break:30};
let rules={};
function runRule(k){const v=rules[k],n=Number(v);return v!=null&&String(v).trim()!==''&&Number.isFinite(n)&&n>=0?n:RUN_DEF[k];}
function shiftHours(start,finish,brk){
 const t=v=>{const m=/^(\\d{1,2}):(\\d{2})$/.exec(String(v==null?'':v).trim());return m&&Number(m[1])<24&&Number(m[2])<60?Number(m[1])*60+Number(m[2]):null;};
 const a=t(start),b=t(finish);if(a==null||b==null||a===b)return null;let mins=b-a;if(mins<0)mins+=1440;
 const br=Number(brk);if(Number.isFinite(br)&&br>0)mins-=br;return mins>0?Math.round(mins/60*100)/100:null;
}
const Workforce1010={isShift:r=>r.quoted===true};
function stable(v){return v===undefined?'null':v===null||typeof v!=='object'?JSON.stringify(v):Array.isArray(v)?'['+v.map(stable).join(',')+']':'{'+Object.keys(v).sort().map(k=>JSON.stringify(k)+':'+stable(v[k])).join(',')+'}';}
function hash(v){const s=stable(v);let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619);}return'f745-'+(h>>>0).toString(16).padStart(8,'0')+'-'+s.length;}
`+helper+`
function probe(type,row,rs){
 rules=rs;const day=new Date(row.date+'T00:00:00').getDay(),explicit=row.break_min!=null&&String(row.break_min).trim()!==''&&Number.isFinite(Number(row.break_min));
 const br=explicit?Number(row.break_min):day===0||day===6?0:runRule('wd_break');
 const worked=row.start&&row.finish?shiftHours(row.start,row.finish,0):Number(row.hours);
 let paid=row.start&&row.finish?shiftHours(row.start,row.finish,br):Number(row.hours);if(paid==null)paid=0;
 let split;
 if(type==='salary')split={ordinary:paid,at_1_5:0,at_2:0};
 else if(day===0)split={ordinary:0,at_1_5:0,at_2:paid};
 else if(day===6){const x=Math.min(paid,runRule('sat_x15'));split={ordinary:0,at_1_5:x,at_2:paid-x};}
 else{const o=Math.min(paid,runRule(type==='hire'?'lh_ord':'cna_ord')),a=Math.min(paid-o,runRule('ot_x15'));split={ordinary:o,at_1_5:a,at_2:paid-o-a};}
 const source={id:row.id,person:row.person,type,date:row.date,start:row.start||null,finish:row.finish||null,break_min:row.break_min==null?null:row.break_min,hours:row.hours==null?null:row.hours,worked,paid,split,rate:50,rateBasis:'Synthetic fixture',payRules:fin745PayRules1278(type,row)};
 return {source,hash:hash(source),legacyDefaultHash:hash({...source,payRules:{}}),effect:stable({worked,paid,split,cost:(split.ordinary+1.5*split.at_1_5+2*split.at_2)*50})};
}
function helperOnly(type,row,rs){rules=rs;return stable(fin745PayRules1278(type,row));}
`,ctx);
const row={id:'synthetic-shift',person:'Synthetic worker',date:'2026-09-14',start:'06:00',finish:'17:00',hours:11};
const cases=[
 ['irrelevant buildings lock','cna',row,'buildingsLock1049','synthetic-lock',false],
 ['irrelevant other employment rule','cna',row,'lh_ord',8,false],
 ['weekday Saturday rule','cna',row,'sat_x15',3,false],
 ['explicit break default','cna',{...row,break_min:30},'wd_break',45,false],
 ['hours-only break','hire',{...row,start:null,finish:null,hours:8},'wd_break',45,false],
 ['Sunday ordinary rule','cna',{...row,date:'2026-09-20'},'cna_ord',8,false],
 ['Sunday salary break','salary',{...row,date:'2026-09-20'},'wd_break',45,false],
 ['Saturday weekday overtime','hire',{...row,date:'2026-09-19'},'ot_x15',3,false],
 ['relevant wages normal','cna',row,'cna_ord',8,true],
 ['relevant hire normal','hire',row,'lh_ord',7.6,true],
 ['relevant weekday overtime','hire',row,'ot_x15',3,true],
 ['relevant Saturday overtime','hire',{...row,date:'2026-09-19'},'sat_x15',3,true],
 ['relevant timed weekday break','salary',row,'wd_break',45,true]
];
let checks=0;const failures=[];
function check(value,name){checks++;if(!value)failures.push(name);}
for(const [name,type,r,key,value,relevant] of cases){
 const a=ctx.probe(type,r,{}),b=ctx.probe(type,r,{[key]:value});
 check((a.effect!==b.effect)===relevant,name+' effective calculation');
 check((a.hash!==b.hash)===relevant,name+' fingerprint');
 check(a.hash===a.legacyDefaultHash,name+' legacy {} compatibility');
}
for(const type of ['cna','hire','salary']){
 check(ctx.helperOnly(type,{...row,quoted:true},{cna_ord:8,lh_ord:8,ot_x15:3,sat_x15:3,wd_break:45})==='{}','quoted supplier excludes employee rules '+type);
}
const unchanged=ctx.probe('hire',row,{lh_ord:7.6});
check(unchanged.source.payRules.lh_ord===7.6,'relevant nondefault value preserved');
for(const [key,value] of [['start','07:00'],['finish','16:00'],['hours',12],['break_min',60],['date','2026-09-15'],['person','Other synthetic worker']]){
 check(ctx.probe('hire',{...row,[key]:value},{lh_ord:7.6}).hash!==unchanged.hash,'genuine raw edit retained '+key);
}
check(!patch.includes('review.payload.fingerprint ='),'no rewriting saved review hashes');
console.log(JSON.stringify({checks,passed:checks-failures.length,failed:failures.length,failures},null,2));
if(failures.length)process.exitCode=1;
