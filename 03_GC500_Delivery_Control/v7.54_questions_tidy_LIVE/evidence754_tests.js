// Author: Andrew Fisher. Pure-source tests: no browser, network or record writes.
const fs=require('fs'),path=require('path'),vm=require('vm');
const source=fs.readFileSync(path.join(__dirname,'evidence754_src.js'),'utf8');
const html=fs.readFileSync(process.env.PAGE||'/tmp/gc500_questions_current.html','utf8');
const start=html.indexOf('const DATA = ')+13;
// JSON.parse the data literal using a brace scanner that respects JSON strings.
let depth=0,quoted=false,escaped=false,end=start;
for(;end<html.length;end++){const c=html[end];if(quoted){if(escaped)escaped=false;else if(c==='\\')escaped=true;else if(c==='"')quoted=false;}else if(c==='"')quoted=true;else if(c==='{')depth++;else if(c==='}'&&--depth===0){end++;break;}}
const DATA=JSON.parse(html.slice(start,end));
const rawHistory=[['R07','done','Old drawings','All Rev 02','','about'],['R23','open','Old title','All Rev 02','Approval needed','about']];
const ctx={DATA,notes:DATA.ops.fencing.service_notes,questionHistoryBefore754:()=>rawHistory,fmtDate:x=>x,todayIso:()=> '2026-10-01',qYesterday:()=> '2026-09-30'};
ctx.serviceNoteRows=()=>ctx.notes;vm.createContext(ctx);vm.runInContext(source,ctx);
const checks=[],ok=(name,value)=>{checks.push({name,pass:!!value});};
const baseline=JSON.stringify(DATA),history=JSON.stringify(rawHistory);
const Q=[{id:'oi-R23',q:'old',why:'old',need:'old',st:'open'},{id:'fe-gap',why:'Record gaps.',rows:['Removal: 0 of 115 m on the record','Vehicle gates: 3 of 45 on the record'],st:'open'}];
ctx.decorateQuestionEvidence754(Q);
ok('Revision inventory includes master03 and Cypress01',Q[0].why.includes('D001-26003-03')&&Q[0].why.includes('D016-26003-01'));
ok('Tagged master positions remain authorised',Q[0].why.includes('Tagged unit positions already follow master plan'));
ok('Question asks only about later issues',Q[0].need.includes('latest issued set')&&Q[0].st==='open');
ok('Zero removal is qualified as hire-docket total',Q[1].rows[0]==='Removal: 0 of 115 m on hire dockets');
ok('Temporary removal and reinstatement both remain visible',Q[1].why.includes('32.5 m')&&Q[1].why.includes('24455')&&Q[1].why.includes('24456'));
ok('Other quantities and question status remain unchanged',Q[1].rows[1]==='Vehicle gates: 3 of 45 on the record'&&Q[1].st==='open');
ok('Future stack-down is not described as recorded',ctx.removalServiceEvidence754('2026-09-17')==='');
ok('Reinstatement is not asserted before its date',!ctx.removalServiceEvidence754('2026-09-18').includes('reinstated'));
const originalNotes=ctx.notes;ctx.notes=originalNotes.filter(n=>n.note_no!=='24455');ok('Missing source does not create service evidence',ctx.removalServiceEvidence754('2026-09-30')==='');ctx.notes=originalNotes;
ctx.notes=originalNotes.map(n=>n.note_no==='24455'?{...n,usable:false}:n);ok('Unusable source does not create service evidence',ctx.removalServiceEvidence754('2026-09-30')==='');ctx.notes=originalNotes;
const out=ctx.questionHistory753();ok('History has exact held revisions',out[1][3].includes('D001-26003-03')&&out[1][3].includes('D016-26003-01'));
ok('Raw history is preserved',JSON.stringify(rawHistory)===history);
ok('Source data and financial evidence remain unchanged',JSON.stringify(DATA)===baseline);
const evidence={author:'Andrew Fisher',checks};const dir=path.join(__dirname,'evidence');fs.mkdirSync(dir,{recursive:true});fs.writeFileSync(path.join(dir,'evidence754_results.json'),JSON.stringify(evidence,null,2));console.log(JSON.stringify({checks:checks.length,failed:checks.filter(c=>!c.pass)},null,2));if(checks.some(c=>!c.pass))process.exitCode=1;
